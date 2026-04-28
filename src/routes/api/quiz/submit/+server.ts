import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const PASSING_SCORE = 70;

export const POST: RequestHandler = async ({ request, platform, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const { attemptId, answers } = await request.json();
  if (!attemptId || !answers) return json({ error: 'attemptId dan answers diperlukan' }, { status: 400 });

  const db = platform!.env.DB;

  // 1. Verify attempt belongs to user and is still active
  const attempt = await db.prepare(
    `SELECT id, questions_data, answers_data, status, module_id FROM quiz_attempts 
     WHERE id = ? AND user_id = ?`
  ).bind(attemptId, userId).first();

  if (!attempt) return json({ error: 'Quiz attempt tidak ditemukan' }, { status: 404 });

  const attemptData = attempt as any;

  if (attemptData.status !== 'active') {
    return json({ error: `Quiz sudah ${attemptData.status === 'passed' ? 'lulus' : 'gagal'}` }, { status: 400 });
  }

  if (attemptData.answers_data) {
    return json({ error: 'Quiz ini sudah disubmit' }, { status: 400 });
  }

  // 2. Check expiry
  const expiresAt = await db.prepare(
    'SELECT expires_at FROM quiz_attempts WHERE id = ?'
  ).bind(attemptId).first();
  if (expiresAt && new Date((expiresAt as any).expires_at) < new Date()) {
    await db.prepare(
      "UPDATE quiz_attempts SET status = 'expired' WHERE id = ?"
    ).bind(attemptId).run();
    return json({ error: 'Waktu quiz sudah habis' }, { status: 400 });
  }

  // 3. Grade answers server-side
  const questionsData = JSON.parse(attemptData.questions_data);
  let correctCount = 0;
  const totalQuestions = questionsData.length;
  const answerDetails: { questionIndex: number; correct: boolean; userAnswer: number; correctAnswer: number }[] = [];

  for (let i = 0; i < totalQuestions; i++) {
    const userAnswer = typeof answers[i] === 'number' ? answers[i] : -1;
    const correctIndex = questionsData[i].correct_index;
    const isCorrect = userAnswer === correctIndex;
    if (isCorrect) correctCount++;
    answerDetails.push({
      questionIndex: i,
      correct: isCorrect,
      userAnswer,
      correctAnswer: correctIndex
    });
  }

  const score = Math.round((correctCount / totalQuestions) * 100);
  const passed = score >= PASSING_SCORE;

  // 4. Update attempt
  const now = new Date().toISOString();
  const newStatus = passed ? 'passed' : 'failed';

  await db.prepare(
    `UPDATE quiz_attempts 
     SET answers_data = ?, status = ?, score = ?, submitted_at = ?, failed_at = ?
     WHERE id = ?`
  ).bind(
    JSON.stringify(answers),
    newStatus,
    score,
    now,
    passed ? null : now,
    attemptId
  ).run();

  // 5. If passed, save to quiz_results as proof of completion
  if (passed) {
    await db.prepare(
      `INSERT INTO quiz_results (id, user_id, module_id, score, passed, attempt_count, completed_at)
       VALUES (?, ?, ?, ?, TRUE, 
         (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = ? AND module_id = ?),
         ?)
       ON CONFLICT(user_id, module_id) DO UPDATE SET
         score = excluded.score,
         passed = TRUE,
         attempt_count = (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = ? AND module_id = ?),
         completed_at = excluded.completed_at`
    ).bind(
      crypto.randomUUID(),
      userId,
      attemptData.module_id,
      score,
      userId,
      attemptData.module_id,
      now,
      userId,
      attemptData.module_id
    ).run();

    // 6. Unlock next module after passing quiz
    const currentModule = await db.prepare(
      'SELECT roadmap_id, module_order FROM modules WHERE id = ?'
    ).bind(attemptData.module_id).first();

    if (currentModule) {
      const nextModule = await db.prepare(
        'SELECT id FROM modules WHERE roadmap_id = ? AND module_order = ?'
      ).bind((currentModule as any).roadmap_id, (currentModule as any).module_order + 1).first();

      if (nextModule) {
        const nextModuleId = (nextModule as any).id;
        const existingProg = await db.prepare(
          'SELECT id FROM user_module_progress WHERE user_id = ? AND module_id = ?'
        ).bind(userId, nextModuleId).first();

        if (existingProg) {
          await db.prepare(
            'UPDATE user_module_progress SET is_unlocked = TRUE, unlocked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND module_id = ?'
          ).bind(userId, nextModuleId).run();
        } else {
          await db.prepare(
            'INSERT INTO user_module_progress (id, user_id, module_id, is_unlocked, unlocked_at) VALUES (?, ?, ?, TRUE, CURRENT_TIMESTAMP)'
          ).bind(`ump-${crypto.randomUUID().slice(0, 8)}`, userId, nextModuleId).run();
        }
      }
    }
  }

  return json({
    status: newStatus,
    score,
    passed,
    correctCount,
    totalQuestions,
    answerDetails,
    passingScore: PASSING_SCORE
  });
};
