import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const materialId = url.searchParams.get('materialId');
  if (!materialId) return json({ error: 'materialId is required' }, { status: 400 });

  const db = platform!.env.DB;

  // Check if already passed
  const passedCheckpoint = await db.prepare(
    `SELECT id FROM checkpoint_attempts 
     WHERE user_id = ? AND material_id = ? AND status = 'passed'
     LIMIT 1`
  ).bind(userId, materialId).first();

  // Check active checkpoint
  const activeCheckpoint = await db.prepare(
    `SELECT id, question, hint FROM checkpoint_attempts 
     WHERE user_id = ? AND material_id = ? AND status = 'active'
     ORDER BY created_at DESC LIMIT 1`
  ).bind(userId, materialId).first();

  // Check cooldown
  const recentFailed = await db.prepare(
    `SELECT failed_at, hint FROM checkpoint_attempts 
     WHERE user_id = ? AND material_id = ? AND status = 'failed'
     ORDER BY failed_at DESC LIMIT 1`
  ).bind(userId, materialId).first();

  let cooldownRemaining = 0;
  let hint: string | null = null;
  if (recentFailed) {
    const rf = recentFailed as any;
    const cooldownEnd = new Date(rf.failed_at);
    cooldownEnd.setMinutes(cooldownEnd.getMinutes() + 1);
    if (new Date() < cooldownEnd) {
      cooldownRemaining = Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000);
    }
    hint = rf.hint;
  }

  return json({
    passed: !!passedCheckpoint,
    hasActive: !!activeCheckpoint,
    activeCheckpoint: activeCheckpoint ? {
      id: (activeCheckpoint as any).id,
      question: (activeCheckpoint as any).question,
      hint: (activeCheckpoint as any).hint
    } : null,
    cooldownRemaining,
    hint
  });
};
