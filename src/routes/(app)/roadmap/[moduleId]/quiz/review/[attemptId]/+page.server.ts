import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
  const userId = locals.user?.id;
  if (!userId) throw redirect(303, '/login');

  const { moduleId, attemptId } = params;

  const db = platform!.env.DB;

  // Fetch ALL attempts for this user + module (for prev/next navigation)
  const { results: allAttempts } = await db.prepare(
    `SELECT id, attempt_number, status FROM quiz_attempts 
     WHERE user_id = ? AND module_id = ? AND answers_data IS NOT NULL
     ORDER BY created_at ASC`
  ).bind(userId, moduleId).all();

  const attemptsList = (allAttempts as any[]).map(a => ({
    id: a.id,
    attemptNumber: a.attempt_number,
    passed: a.status === 'passed'
  }));

  const currentIndex = attemptsList.findIndex(a => a.id === attemptId);
  if (currentIndex === -1) throw error(404, 'Quiz attempt tidak ditemukan');

  const prevAttempt = currentIndex > 0 ? attemptsList[currentIndex - 1] : null;
  const nextAttempt = currentIndex < attemptsList.length - 1 ? attemptsList[currentIndex + 1] : null;

  // Fetch the specific attempt
  const attempt = await db.prepare(
    `SELECT id, questions_data, answers_data, status, score, attempt_number, submitted_at, failed_at, created_at
     FROM quiz_attempts 
     WHERE id = ? AND user_id = ?`
  ).bind(attemptId, userId).first();

  if (!attempt) throw error(404, 'Quiz attempt tidak ditemukan');
  if (!(attempt as any).answers_data) throw error(400, 'Quiz ini belum disubmit');

  const attemptData = attempt as any;
  const questionsData = JSON.parse(attemptData.questions_data);
  const answersData = JSON.parse(attemptData.answers_data);

  const questions = questionsData.map((q: any, i: number) => ({
    question: q.question,
    options: q.options,
    correctIndex: q.correct_index,
    userAnswer: typeof answersData[i] === 'number' ? answersData[i] : -1,
    isCorrect: answersData[i] === q.correct_index
  }));

  return {
    attemptId,
    moduleId: params.moduleId,
    questions,
    score: attemptData.score,
    passed: attemptData.status === 'passed',
    attemptNumber: attemptData.attempt_number,
    submittedAt: attemptData.submitted_at || attemptData.failed_at || attemptData.created_at,
    totalQuestions: questions.length,
    correctCount: questions.filter((q: any) => q.isCorrect).length,
    prevAttempt,
    nextAttempt,
    currentAttemptIndex: currentIndex + 1,
    totalAttempts: attemptsList.length
  };
};
