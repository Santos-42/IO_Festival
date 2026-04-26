import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  const userId = locals.user?.id;

  // 1. Fetch available roadmaps (roles)
  const { results: roles } = await platform!.env.DB.prepare(
    'SELECT id, role_name FROM roadmaps'
  ).all();

  // 2. Fetch all modules
  const { results: modules } = await platform!.env.DB.prepare(
    'SELECT id, module_name, module_order, roadmap_id FROM modules ORDER BY roadmap_id, module_order'
  ).all();

  // 3. Fetch user progress
  const { results: userProgress } = await platform!.env.DB.prepare(
    'SELECT module_id, is_unlocked FROM user_module_progress WHERE user_id = ?'
  )
    .bind(userId)
    .all();

  return {
    roles: roles as Array<{ id: string; role_name: string }>,
    modules: modules as Array<{ id: string; module_name: string; module_order: number; roadmap_id: string }>,
    userProgress: userProgress as Array<{ module_id: string; is_unlocked: boolean }>
  };
};
