import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';
import { JWT_SECRET, JWT_EXPIRATION } from '$env/static/private';

export async function POST({ request }) {
	try {
		const { username, password, email } = await request.json();

		if (!username || !password || !email) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const sql = `INSERT INTO users (username, password, email) VALUES (?, ?, ?)`;
		await query(sql, [username, hashedPassword, email]);

		const payload = { username, email };
		const token = jwt.sign(payload, JWT_SECRET, {
			expiresIn: JWT_EXPIRATION
		});

		return json({ success: true, token });
	} catch (error) {
		console.error('Error during registration:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
