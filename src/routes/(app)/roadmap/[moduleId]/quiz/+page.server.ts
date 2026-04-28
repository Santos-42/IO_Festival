import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
  const userId = locals.user?.id;
  if (!userId) throw redirect(303, '/login');

  const { moduleId } = params;
  const db = platform!.env.DB;

  // 1. Fetch module info
  const module = await db.prepare(
    'SELECT id, module_name, roadmap_id, module_order FROM modules WHERE id = ?'
  ).bind(moduleId).first();

  if (!module) throw error(404, 'Modul tidak ditemukan');

  // 2. Check if user has access to this module
  const progress = await db.prepare(
    'SELECT is_unlocked, current_material_id FROM user_module_progress WHERE user_id = ? AND module_id = ?'
  ).bind(userId, moduleId).first();

  if (!progress || !(progress as any).is_unlocked) {
    throw redirect(303, '/roadmap');
  }

  // 3. Check quiz status
  const quizResult = await db.prepare(
    'SELECT passed, score FROM quiz_results WHERE user_id = ? AND module_id = ?'
  ).bind(userId, moduleId).first();

  // 4. Get total materials count for this module
  const { results: materials } = await db.prepare(
    'SELECT id, material_order FROM materials WHERE module_id = ? ORDER BY material_order'
  ).bind(moduleId).all();

  const allMaterials = materials as any[];
  const lastMaterial = allMaterials[allMaterials.length - 1];

  return {
    moduleId,
    moduleName: (module as any).module_name,
    roadmapId: (module as any).roadmap_id,
    alreadyPassed: quizResult ? (quizResult as any).passed : false,
    score: quizResult ? (quizResult as any).score : null,
    lastMaterialId: lastMaterial?.id || null,
    totalMaterials: allMaterials.length
  };
};
