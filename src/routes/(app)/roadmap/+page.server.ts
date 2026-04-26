import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  const userId = locals.user?.id;
  
  if (!userId) return { hasRole: false };

  const roadmap = await platform!.env.DB.prepare(
    'SELECT id FROM user_roadmaps WHERE user_id = ? LIMIT 1'
  )
    .bind(userId)
    .first();

  return {
    hasRole: !!roadmap,
    userId: userId
  };
};
