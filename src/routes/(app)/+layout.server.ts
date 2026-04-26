import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// If session validation failed in hooks, this is a secondary guard
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	return {
		user: locals.user
	};
};
