import type { D1Database } from '@cloudflare/workers-types';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

const QUIZ_DURATION_MINUTES = 15;
const NUM_QUESTIONS = 10;

export async function preGenerateQuiz(
  db: D1Database,
  apiKey: string,
  userId: string,
  moduleId: string,
  attemptNumber: number
): Promise<void> {
  try {
    // 1. Get module name and materials
    const module = await db.prepare('SELECT module_name FROM modules WHERE id = ?').bind(moduleId).first();
    if (!module) return;

    const { results: materials } = await db.prepare(
      'SELECT content_text FROM materials WHERE module_id = ? ORDER BY material_order'
    ).bind(moduleId).all();

    const materialText = (materials as any[]).map(m => m.content_text || '').join('\n\n');

    // 2. Get previous questions to avoid repeats
    const { results: prevAttempts } = await db.prepare(
      `SELECT questions_data FROM quiz_attempts 
       WHERE user_id = ? AND module_id = ? 
       ORDER BY attempt_number DESC LIMIT 3`
    ).bind(userId, moduleId).all();

    let previousQuestions = '';
    if (prevAttempts && prevAttempts.length > 0) {
      const prevQs = (prevAttempts as any[]).flatMap(a => {
        try { return JSON.parse(a.questions_data).map((q: any) => q.question); } catch { return []; }
      });
      previousQuestions = `\nSoal-soal dari attempt sebelumnya (JANGAN diulang):\n${prevQs.join('\n')}`;
    }

    // 3. Generate via AI
    const moduleName = (module as any).module_name;
    const prompt = `Anda adalah pembuat soal ujian profesional untuk materi "${moduleName}".

Berdasarkan materi berikut:
${materialText.substring(0, 6000)}
${previousQuestions}

Buatlah ${NUM_QUESTIONS} soal pilihan ganda yang MENGUJI PEMAHAMAN (bukan hafalan).
Setiap soal harus memiliki 4 opsi (A, B, C, D) dan 1 jawaban benar.
Soal harus berbeda dari soal-soal sebelumnya yang tercantum di atas.
Gunakan Bahasa Indonesia.

Format output HARUS JSON valid dengan struktur persis:
{
  "questions": [
    {
      "question": "teks pertanyaan",
      "options": ["A. opsi1", "B. opsi2", "C. opsi3", "D. opsi4"],
      "correct_index": 0
    }
  ]
}`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.8
      })
    });

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length !== NUM_QUESTIONS) {
      return;
    }

    const valid = parsed.questions.every((q: any) =>
      q.question && Array.isArray(q.options) && q.options.length === 4 &&
      typeof q.correct_index === 'number' && q.correct_index >= 0 && q.correct_index <= 3
    );

    if (!valid) return;

    // 4. Insert with status 'ready'
    const attemptId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + QUIZ_DURATION_MINUTES * 60 * 1000).toISOString();

    await db.prepare(
      `INSERT INTO quiz_attempts (id, user_id, module_id, attempt_number, questions_data, status, expires_at)
       VALUES (?, ?, ?, ?, ?, 'ready', ?)`
    ).bind(attemptId, userId, moduleId, attemptNumber, JSON.stringify(parsed.questions), expiresAt).run();
  } catch {
    // Pre-generation failure must not affect user flow
  }
}

export async function preGenerateCheckpoint(
  db: D1Database,
  apiKey: string,
  userId: string,
  materialId: string,
  moduleId: string
): Promise<void> {
  try {
    // 1. Get material content
    const material = await db.prepare(
      'SELECT content_text FROM materials WHERE id = ?'
    ).bind(materialId).first();
    if (!material) return;

    const cleanText = ((material as any).content_text || '').replace(/\[span_\d+\]\((?:start|end)_span\)/g, '');

    // 2. Generate via AI
    const prompt = `Anda adalah mentor pembelajaran.

Berdasarkan materi berikut, buatlah SATU pertanyaan esai singkat yang menguji pemahaman inti dari materi tersebut.
Pertanyaan harus bisa dijawab dalam 1-3 kalimat dan langsung menguji konsep utama.
Gunakan Bahasa Indonesia.

Materi:
${cleanText.substring(0, 4000)}

Format output HARUS JSON valid:
{
  "question": "teks pertanyaan",
  "answer_key": "poin-poin kunci jawaban yang benar (keyword)"
}`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    if (!parsed.question || !parsed.answer_key) return;

    // 3. Insert with status 'ready'
    const checkpointId = crypto.randomUUID();

    await db.prepare(
      `INSERT INTO checkpoint_attempts (id, user_id, material_id, module_id, question, answer_key, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ready')`
    ).bind(checkpointId, userId, materialId, moduleId, parsed.question, parsed.answer_key).run();
  } catch {
    // Pre-generation failure must not affect user flow
  }
}

export async function preGenerateEvaluation(
  db: D1Database,
  apiKey: string,
  userId: string,
  roadmapId: string,
  roleName: string,
  completedModules: string
): Promise<void> {
  try {
    const prompt = `Anda adalah evaluator profesional untuk posisi ${roleName}.
Kandidat telah mempelajari modul-modul berikut: ${completedModules || 'Fondasi dasar'}.
Buatlah 1 skenario mini case / use case realistis yang relevan dengan posisi tersebut.
Skenario harus cukup detail untuk menguji pemahaman kandidat secara praktis.
Di akhir skenario, berikan 1 pertanyaan esai spesifik yang meminta kandidat menjelaskan solusi atau pendekatannya.
Format output HARUS berupa JSON valid dengan struktur: { "caseStudy": "...", "question": "..." }`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    if (!parsed.caseStudy || !parsed.question) return;

    // Insert with status 'ready'
    await db.prepare(
      `INSERT INTO evaluation_pregenerated (id, user_id, roadmap_id, case_study, question, status)
       VALUES (?, ?, ?, ?, ?, 'ready')`
    ).bind(crypto.randomUUID(), userId, roadmapId, parsed.caseStudy, parsed.question).run();
  } catch {
    // Pre-generation failure must not affect user flow
  }
}
