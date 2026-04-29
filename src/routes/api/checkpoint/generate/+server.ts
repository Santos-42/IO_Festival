import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const { materialId } = await request.json();
  if (!materialId) return json({ error: 'materialId is required' }, { status: 400 });

  const db = platform!.env.DB;
  const apiKey = env.Deepseek_Evaluator;
  if (!apiKey) return json({ error: 'DeepSeek API key not configured' }, { status: 500 });

  // 1. Check if material already has a passed checkpoint
  const passedCheckpoint = await db.prepare(
    `SELECT id FROM checkpoint_attempts 
     WHERE user_id = ? AND material_id = ? AND status = 'passed'
     LIMIT 1`
  ).bind(userId, materialId).first();

  if (passedCheckpoint) {
    return json({ alreadyPassed: true });
  }

  // 2. Check cooldown
  const recentFailed = await db.prepare(
    `SELECT failed_at FROM checkpoint_attempts 
     WHERE user_id = ? AND material_id = ? AND status = 'failed'
     ORDER BY failed_at DESC LIMIT 1`
  ).bind(userId, materialId).first();

  if (recentFailed) {
    const cooldownEnd = new Date((recentFailed as any).failed_at);
    cooldownEnd.setMinutes(cooldownEnd.getMinutes() + 1);
    if (new Date() < cooldownEnd) {
      const remaining = Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000);
      return json({ error: 'Cooldown aktif', cooldown_remaining: remaining }, { status: 429 });
    }
  }

  // 3. Check for ready (pre-generated) checkpoint
  const readyCheckpoint = await db.prepare(
    `SELECT id, question, hint FROM checkpoint_attempts 
     WHERE user_id = ? AND material_id = ? AND status = 'ready'
     ORDER BY created_at DESC LIMIT 1`
  ).bind(userId, materialId).first();

  if (readyCheckpoint) {
    await db.prepare(
      `UPDATE checkpoint_attempts SET status = 'active' WHERE id = ?`
    ).bind((readyCheckpoint as any).id).run();

    return json({
      checkpointId: (readyCheckpoint as any).id,
      question: (readyCheckpoint as any).question,
      hint: (readyCheckpoint as any).hint
    });
  }

  // 4. Check for existing active checkpoint (reuse if exists)
  const activeCheckpoint = await db.prepare(
    `SELECT id, question, hint, status FROM checkpoint_attempts 
     WHERE user_id = ? AND material_id = ? AND status = 'active'
     ORDER BY created_at DESC LIMIT 1`
  ).bind(userId, materialId).first();

  if (activeCheckpoint) {
    const cp = activeCheckpoint as any;
    return json({
      checkpointId: cp.id,
      question: cp.question,
      hint: cp.hint || null,
      reused: true
    });
  }

  // 4. Get material content
  const material = await db.prepare(
    'SELECT content_text, module_id FROM materials WHERE id = ?'
  ).bind(materialId).first();

  if (!material) return json({ error: 'Material not found' }, { status: 404 });

  const materialData = material as any;
  const cleanText = (materialData.content_text || '').replace(/\[span_\d+\]\((?:start|end)_span\)/g, '');

  // 5. Generate checkpoint question via AI
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

  let checkpointData: any = null;
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
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

      if (!parsed.question || !parsed.answer_key) {
        throw new Error('Invalid checkpoint structure');
      }

      checkpointData = parsed;
      break;
    } catch {
      retryCount++;
      if (retryCount > maxRetries) {
        return json({ error: 'Gagal generate checkpoint. Silakan coba lagi.' }, { status: 500 });
      }
    }
  }

  // 6. Store in DB with opaque UUID
  const checkpointId = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO checkpoint_attempts (id, user_id, material_id, module_id, question, answer_key, status)
     VALUES (?, ?, ?, ?, ?, ?, 'active')`
  ).bind(
    checkpointId,
    userId,
    materialId,
    materialData.module_id,
    checkpointData.question,
    checkpointData.answer_key
  ).run();

  // 7. Return question + opaque checkpoint ID (answer_key NEVER sent to frontend)
  return json({
    checkpointId,
    question: checkpointData.question,
    hint: null
  });
};
