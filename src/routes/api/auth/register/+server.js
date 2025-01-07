import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { json } from '@sveltejs/kit';
import 'dotenv/config';

export async function POST({ request }) {
	try {
		const { username, password, email } = await request.json();

		if (!username || !password || !email) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const connection = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME
		});

		// Insert user into database
		const query = `INSERT INTO users (username, password, email) VALUES (?, ?, ?)`;
		await connection.execute(query, [username, hashedPassword, email]);

		// Generate a JWT
		const payload = { username, email };
		const token = jwt.sign(payload, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRATION
		});

		await connection.end();

		return json({ success: true, token });
	} catch (error) {
		console.error('Error during registration:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
