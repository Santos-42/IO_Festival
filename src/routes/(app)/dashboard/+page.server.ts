import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  const userId = locals.user?.id;

  if (!userId) return { roadmapProgress: [], evaluations: [] };

  // 1. Fetch Roadmap Progress (accurate: checkpoint + quiz)
  const { results: roadmapProgress } = await platform!.env.DB.prepare(`
    SELECT ur.id as user_roadmap_id, r.role_name, ur.status,
           -- Total items = all materials + all modules (quiz per module)
           (SELECT COUNT(*) FROM materials m JOIN modules mod ON m.module_id = mod.id WHERE mod.roadmap_id = r.id) as total_materials,
           (SELECT COUNT(*) FROM modules mod WHERE mod.roadmap_id = r.id) as total_quizzes,
           -- Completed materials (checkpoint passed)
           (SELECT COUNT(*) FROM checkpoint_attempts ca 
            JOIN materials m ON ca.material_id = m.id 
            JOIN modules mod ON m.module_id = mod.id 
            WHERE ca.user_id = ? AND mod.roadmap_id = r.id AND ca.status = 'passed') as completed_checkpoints,
           -- Completed quizzes
           (SELECT COUNT(*) FROM quiz_results qr 
            JOIN modules mod ON qr.module_id = mod.id 
            WHERE qr.user_id = ? AND mod.roadmap_id = r.id AND qr.passed = TRUE) as completed_quizzes,
           -- Total unlocked modules (for display)
           (SELECT COUNT(*) FROM user_module_progress ump 
            JOIN modules m ON ump.module_id = m.id 
            WHERE ump.user_id = ? AND m.roadmap_id = r.id AND ump.is_unlocked = TRUE) as unlocked_modules,
           (SELECT COUNT(*) FROM modules mod WHERE mod.roadmap_id = r.id) as total_modules,
           (SELECT m.module_name FROM modules m 
            JOIN user_module_progress ump ON ump.module_id = m.id 
            WHERE ump.user_id = ? AND m.roadmap_id = r.id AND ump.is_unlocked = TRUE 
            ORDER BY m.module_order DESC LIMIT 1) as current_module
    FROM user_roadmaps ur
    JOIN roadmaps r ON ur.roadmap_id = r.id
    WHERE ur.user_id = ?
  `)
    .bind(userId, userId, userId, userId, userId)
    .all();

  // 2. Fetch Evaluation Scores
  const { results: evaluations } = await platform!.env.DB.prepare(`
    SELECT e.id, e.ai_score, e.ai_decision, e.ai_feedback, e.created_at,
           m.module_name, r.role_name
    FROM evaluations e
    JOIN user_roadmaps ur ON e.user_roadmap_id = ur.id
    JOIN modules m ON e.module_id = m.id
    JOIN roadmaps r ON ur.roadmap_id = r.id
    WHERE ur.user_id = ?
    ORDER BY e.created_at DESC
  `)
    .bind(userId)
    .all();

  // 3. Fetch Quiz Results
  const { results: quizScores } = await platform!.env.DB.prepare(`
    SELECT qr.score, qr.passed, qr.completed_at, m.module_name, r.role_name
    FROM quiz_results qr
    JOIN modules m ON qr.module_id = m.id
    JOIN user_roadmaps ur ON ur.roadmap_id = m.roadmap_id AND ur.user_id = qr.user_id
    JOIN roadmaps r ON m.roadmap_id = r.id
    WHERE qr.user_id = ? AND qr.passed = TRUE
    ORDER BY qr.completed_at DESC
  `)
    .bind(userId)
    .all();

  return {
    roadmapProgress: roadmapProgress as any[],
    evaluations: evaluations as any[],
    quizScores: quizScores as any[],
    user: locals.user
  };
};
