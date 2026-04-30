import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  const userId = locals.user?.id;
  if (!userId) return { activeRole: null, pastEvaluations: [], roadmapCompleted: false, progress: null };

  // 1. Fetch user's active role
  const activeRole = await platform!.env.DB.prepare(
    `SELECT r.id, r.role_name, ur.roadmap_id 
     FROM user_roadmaps ur 
     JOIN roadmaps r ON ur.roadmap_id = r.id 
     WHERE ur.user_id = ? AND ur.status = 'active' 
     LIMIT 1`
  )
    .bind(userId)
    .first();

  // 2. Fetch completed modules for context
  let completedModules = '';
  if (activeRole) {
    const { results: modules } = await platform!.env.DB.prepare(
      `SELECT m.module_name 
       FROM user_module_progress ump
       JOIN modules m ON ump.module_id = m.id
       WHERE ump.user_id = ? AND ump.is_unlocked = 1 AND m.roadmap_id = ?`
    )
      .bind(userId, (activeRole as any).roadmap_id)
      .all();
    
    completedModules = (modules as any[]).map(m => m.module_name).join(', ');
  }

  // 3. Check roadmap completion (100%)
  let roadmapCompleted = false;
  let progress = null;
  if (activeRole) {
    const roadmapId = (activeRole as any).roadmap_id;
    const completion = await platform!.env.DB.prepare(
      `SELECT
        (SELECT COUNT(*) FROM materials m JOIN modules mod ON m.module_id = mod.id WHERE mod.roadmap_id = ?) as total_materials,
        (SELECT COUNT(*) FROM modules mod WHERE mod.roadmap_id = ?) as total_quizzes,
        (SELECT COUNT(*) FROM checkpoint_attempts ca
         JOIN materials m ON ca.material_id = m.id
         JOIN modules mod ON m.module_id = mod.id
         WHERE ca.user_id = ? AND mod.roadmap_id = ? AND ca.status = 'passed') as completed_checkpoints,
        (SELECT COUNT(*) FROM quiz_results qr
         JOIN modules mod ON qr.module_id = mod.id
         WHERE qr.user_id = ? AND mod.roadmap_id = ? AND qr.passed = TRUE) as completed_quizzes`
    )
      .bind(roadmapId, roadmapId, userId, roadmapId, userId, roadmapId)
      .first();

    if (completion) {
      const c = completion as any;
      const totalItems = (c.total_materials || 0) + (c.total_quizzes || 0);
      const completedItems = (c.completed_checkpoints || 0) + (c.completed_quizzes || 0);
      const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      roadmapCompleted = totalItems > 0 && completedItems >= totalItems;
      progress = {
        totalMaterials: c.total_materials,
        totalQuizzes: c.total_quizzes,
        completedCheckpoints: c.completed_checkpoints,
        completedQuizzes: c.completed_quizzes,
        percentage: pct
      };
    }
  }

  // 4. Fetch past evaluations
  const { results: pastEvaluations } = await platform!.env.DB.prepare(
    `SELECT e.* 
     FROM evaluations e
     JOIN user_roadmaps ur ON e.user_roadmap_id = ur.id
     WHERE ur.user_id = ? 
     ORDER BY e.created_at DESC`
  )
    .bind(userId)
    .all();

  return {
    activeRole: activeRole as { id: string; role_name: string; roadmap_id: string } | null,
    completedModules,
    roadmapCompleted,
    progress,
    pastEvaluations: pastEvaluations.map((e: any) => {
      const feedback = JSON.parse(e.ai_feedback || '{}');
      const transcript = JSON.parse(e.transcript_data || '{}');
      return {
        ...e,
        score: e.ai_score,
        questions: transcript.question || 'Evaluation',
        feedback_json: {
          decision: e.ai_decision,
          ...feedback
        }
      };
    })
  };
};
