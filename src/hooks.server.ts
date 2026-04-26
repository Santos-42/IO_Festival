import { redirect, type Handle } from '@sveltejs/kit';
import { parseSessionToken } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('session_token');
	event.locals.user = null;

	if (sessionToken) {
		const userId = parseSessionToken(sessionToken);
		if (userId) {
			// Get user from database
			const { results } = await event.platform!.env.DB.prepare(
				'SELECT id, name, email FROM users WHERE id = ?'
			)
				.bind(userId)
				.all();

			if (results && results.length > 0) {
				const user = results[0] as { id: string; name: string; email: string };
				
				// Check if user has an active roadmap
				const { results: roadmapResults } = await event.platform!.env.DB.prepare(
					'SELECT COUNT(*) as count FROM user_roadmaps WHERE user_id = ?'
				)
					.bind(user.id)
					.all();
				
				const hasActiveRoadmap = (roadmapResults?.[0]?.count as number || 0) > 0;
				
				event.locals.user = { ...user, hasActiveRoadmap };
			}
		}
	}

	const path = event.url.pathname;

	// Route protection
	// Protect (app) routes: /dashboard, /roadmap, /evaluation, /interview
	const isAppRoute = path.startsWith('/dashboard') || 
                     path.startsWith('/roadmap') || 
                     path.startsWith('/evaluation') || 
                     path.startsWith('/interview');

	if (isAppRoute && !event.locals.user) {
		throw redirect(303, '/login');
	}

	// Protect evaluation and interview if no roadmap
	if (event.locals.user && !event.locals.user.hasActiveRoadmap) {
		if (path.startsWith('/evaluation') || path.startsWith('/interview')) {
			throw redirect(303, '/roadmap');
		}
	}

	// If already logged in, redirect away from auth pages
	if (event.locals.user && (path === '/login' || path === '/register')) {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};
