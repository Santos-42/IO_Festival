import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { preGenerateCheckpoint } from '$lib/server/pregenerate';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const { checkpointId, answer } = await request.json();
  if (!checkpointId || !answer) return json({ error: 'checkpointId dan answer diperlukan' }, { status: 400 });

  const db = platform!.env.DB;
  const apiKey = env.Deepseek_Evaluator;
  if (!apiKey) return json({ error: 'DeepSeek API key not configured' }, { status: 500 });

  // 1. Verify checkpoint belongs to user
  const checkpoint = await db.prepare(
    `SELECT id, question, answer_key, material_id, module_id, status FROM checkpoint_attempts 
     WHERE id = ? AND user_id = ?`
  ).bind(checkpointId, userId).first();

  if (!checkpoint) return json({ error: 'Checkpoint tidak ditemukan' }, { status: 404 });

  const cp = checkpoint as any;

  if (cp.status === 'passed') {
    return json({ passed: true, alreadyPassed: true });
  }

  // 1b. Save user answer before grading
  await db.prepare(
    'UPDATE checkpoint_attempts SET user_answer = ? WHERE id = ?'
  ).bind(answer, checkpointId).run();

  // 2. Semantic grading via AI
  const prompt = `Anda adalah evaluator pembelajaran (grader).

Pertanyaan: ${cp.question}
Kunci Referensi: ${cp.answer_key}
Jawaban User: ${answer}

Evaluasi jawaban user terhadap kunci referensi. Gunakan semantic grading - terima jawaban yang secara makna benar meskipun kata-katanya berbeda.
Berikan keputusan PASS jika jawaban user mencakup konsep inti dari kunci referensi.
Format output HARUS JSON valid:
{
  "passed": true,
  "reason": "Alasan singkat (1-2 kalimat dalam Bahasa Indonesia)"
}`;

  let gradingResult: any = null;
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
          temperature: 0.3
        })
      });

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);

      if (typeof parsed.passed !== 'boolean') {
        throw new Error('Invalid grading structure');
      }

      gradingResult = parsed;
      break;
    } catch {
      retryCount++;
      if (retryCount > maxRetries) {
        return json({ error: 'Gagal evaluasi jawaban. Silakan coba lagi.' }, { status: 500 });
      }
    }
  }

  const now = new Date().toISOString();

  if (gradingResult.passed) {
    // Mark checkpoint as passed
    await db.prepare(
      `UPDATE checkpoint_attempts SET status = 'passed' WHERE id = ?`
    ).bind(checkpointId).run();

    // Update user_module_progress to mark material complete
    await db.prepare(
      `UPDATE user_module_progress SET current_material_id = ?, is_unlocked = TRUE
       WHERE user_id = ? AND module_id = ?`
    ).bind(cp.material_id, userId, cp.module_id).run();

    return json({ passed: true, reason: gradingResult.reason });
  } else {
    // Mark checkpoint as failed, set cooldown
    await db.prepare(
      `UPDATE checkpoint_attempts 
       SET status = 'failed', hint = ?, failed_at = ?
       WHERE id = ?`
    ).bind(gradingResult.reason, now, checkpointId).run();

    // Pre-generate new checkpoint for this material
    platform!.context.waitUntil(
      preGenerateCheckpoint(db, apiKey, userId, cp.material_id, cp.module_id)
    );

    return json({
      passed: false,
      reason: gradingResult.reason,
      cooldownRemaining: 60
    });
  }
};
