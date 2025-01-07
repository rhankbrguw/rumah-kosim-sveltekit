import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { json } from '@sveltejs/kit';
import 'dotenv/config';

export async function POST({ request }) {
	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const connection = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME
		});

		// Fetch user from the database
		const [rows] = await connection.execute(
			'SELECT id, username, password, email FROM users WHERE username = ?',
			[username]
		);

		if (rows.length === 0) {
			await connection.end();
			return json({ error: 'Invalid username or password' }, { status: 401 });
		}

		const user = rows[0];

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			await connection.end();
			return json({ error: 'Invalid username or password' }, { status: 401 });
		}

		// Generate JWT
		const payload = { id: user.id, username: user.username, email: user.email };
		const token = jwt.sign(payload, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRATION
		});

		await connection.end();

		return json({ success: true, token });
	} catch (error) {
		console.error('Error during login:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
