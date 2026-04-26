import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
  const { results } = await platform!.env.DB.prepare(
    'SELECT id, role_name FROM roadmaps ORDER BY role_name'
  ).all();

  return json(results);
};
