import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  const userId = locals.user?.id;

  if (!userId) return { roadmapProgress: [], evaluations: [] };

  // 1. Fetch Roadmap Progress
  const { results: roadmapProgress } = await platform!.env.DB.prepare(`
    SELECT ur.id as user_roadmap_id, r.role_name, ur.status,
           (SELECT COUNT(*) FROM modules m WHERE m.roadmap_id = r.id) as total_modules,
           (SELECT COUNT(*) FROM user_module_progress ump 
            JOIN modules m ON ump.module_id = m.id 
            WHERE ump.user_id = ? AND m.roadmap_id = r.id AND ump.is_unlocked = TRUE) as completed_modules,
           (SELECT m.module_name FROM modules m 
            JOIN user_module_progress ump ON ump.module_id = m.id 
            WHERE ump.user_id = ? AND m.roadmap_id = r.id AND ump.is_unlocked = TRUE 
            ORDER BY m.module_order DESC LIMIT 1) as current_module
    FROM user_roadmaps ur
    JOIN roadmaps r ON ur.roadmap_id = r.id
    WHERE ur.user_id = ?
  `)
    .bind(userId, userId, userId)
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

  return {
    roadmapProgress: roadmapProgress as any[],
    evaluations: evaluations as any[],
    user: locals.user
  };
};
