import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { hashPassword } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirm = formData.get('confirm') as string;

		if (!email || !password || !confirm) {
			return fail(400, { error: 'Semua field harus diisi' });
		}

		if (password !== confirm) {
			return fail(400, { error: 'Password dan konfirmasi tidak cocok' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password minimal 6 karakter' });
		}

		if (!/[a-z]/.test(password)) {
			return fail(400, { error: 'Password harus mengandung minimal 1 huruf kecil' });
		}

		if (!/[A-Z]/.test(password)) {
			return fail(400, { error: 'Password harus mengandung minimal 1 huruf besar' });
		}

		const db = platform?.env.DB;
		if (!db) return fail(500, { error: 'Gagal terhubung ke database' });

		const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first() as { id: string } | null;
		if (!existingUser) {
			return fail(400, { error: 'Email tidak ditemukan' });
		}

		const hashedPassword = await hashPassword(password);
		await db.prepare('UPDATE users SET password = ? WHERE id = ?').bind(hashedPassword, existingUser.id).run();

		throw redirect(303, '/login');
	}
};
