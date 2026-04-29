import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
  const userId = locals.user?.id;
  if (!userId) throw redirect(303, '/login');

  const { evaluationId } = params;

  const db = platform!.env.DB;

  const evaluation = await db.prepare(
    `SELECT e.*
     FROM evaluations e
     JOIN user_roadmaps ur ON e.user_roadmap_id = ur.id
     WHERE e.id = ? AND ur.user_id = ?`
  ).bind(evaluationId, userId).first();

  if (!evaluation) throw error(404, 'Evaluasi tidak ditemukan');

  const evalData = evaluation as any;
  const feedback = JSON.parse(evalData.ai_feedback || '{}');
  const transcript = JSON.parse(evalData.transcript_data || '{}');

  return {
    evaluationId,
    caseStudy: transcript.caseStudy || '',
    question: transcript.question || '',
    userAnswer: evalData.user_answer || '',
    score: evalData.ai_score,
    decision: evalData.ai_decision,
    feedback: feedback.feedback || '',
    strengths: feedback.strengths || '',
    improvements: feedback.improvements || '',
    createdAt: evalData.created_at
  };
};
