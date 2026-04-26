import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		cookies.set('session_token', '', {
			path: '/',
			maxAge: 0
		});
		throw redirect(303, '/login');
	}
};
