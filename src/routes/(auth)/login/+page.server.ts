import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { verifyPassword, createSessionToken } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email dan password harus diisi' });
		}

		const db = platform?.env.DB;
		if (!db) {
			return fail(500, { error: 'Gagal terhubung ke database' });
		}

		try {
			// Find user by email
			const user = await db.prepare('SELECT id, password FROM users WHERE email = ?').bind(email).first() as { id: string, password: string } | null;

			if (!user) {
				return fail(400, { error: 'Email atau password salah' });
			}

			// Verify password (supports legacy plaintext and new hashes)
			const isValid = await verifyPassword(password, user.password);
			if (!isValid) {
				return fail(400, { error: 'Email atau password salah' });
			}

			// Set session cookie
			const sessionToken = createSessionToken(user.id);
			cookies.set('session_token', sessionToken, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});

		} catch (e) {
			console.error('Login error:', e);
			return fail(500, { error: 'Login gagal. Silakan coba lagi nanti.' });
		}

		throw redirect(303, '/dashboard');
	}
};
