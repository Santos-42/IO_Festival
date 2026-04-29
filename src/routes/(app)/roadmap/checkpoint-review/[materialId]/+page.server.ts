import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
  const userId = locals.user?.id;
  if (!userId) throw redirect(303, '/login');

  const { materialId } = params;

  const db = platform!.env.DB;

  // Fetch all checkpoint attempts for this material + user
  const { results: attempts } = await db.prepare(
    `SELECT id, question, answer_key, user_answer, status, hint, failed_at, created_at
     FROM checkpoint_attempts 
     WHERE user_id = ? AND material_id = ? 
     ORDER BY created_at DESC`
  ).bind(userId, materialId).all();

  // Fetch material title
  const material = await db.prepare(
    'SELECT content_text, module_id FROM materials WHERE id = ?'
  ).bind(materialId).first();

  const cleanText = (material as any)?.content_text?.replace(/\[span_\d+\]\((?:start|end)_span\)/g, '') || '';
  const title = cleanText.split('\n')[0]?.split('. ')[0]?.trim() || 'Material';

  return {
    materialId,
    moduleId: (material as any)?.module_id || '',
    materialTitle: title,
    attempts: (attempts as any[]).map(a => ({
      id: a.id,
      question: a.question,
      answerKey: a.answer_key,
      userAnswer: a.user_answer || null,
      status: a.status,
      hint: a.hint || null,
      createdAt: a.created_at
    }))
  };
};
