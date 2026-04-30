import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { preGenerateQuiz } from '$lib/server/pregenerate';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = env.Deepseek_Evaluator;
  if (!apiKey) return json({ error: 'DeepSeek API key not configured' }, { status: 500 });

  const { moduleId } = await request.json();
  if (!moduleId) return json({ error: 'moduleId is required' }, { status: 400 });

  const db = platform!.env.DB;

  // Check if there's already a ready or active attempt
  const existingAttempt = await db.prepare(
    `SELECT id FROM quiz_attempts
     WHERE user_id = ? AND module_id = ? AND status IN ('ready', 'active')
     ORDER BY created_at DESC LIMIT 1`
  ).bind(userId, moduleId).first();

  if (existingAttempt) {
    return json({ existed: true });
  }

  // Get attempt number
  const lastAttempt = await db.prepare(
    'SELECT MAX(attempt_number) as max_attempt FROM quiz_attempts WHERE user_id = ? AND module_id = ?'
  ).bind(userId, moduleId).first();
  const attemptNumber = ((lastAttempt as any)?.max_attempt || 0) + 1;

  // Fire-and-forget pre-generation
  platform!.context.waitUntil(
    preGenerateQuiz(db, apiKey, userId, moduleId, attemptNumber)
  );

  return json({ generated: true });
};
