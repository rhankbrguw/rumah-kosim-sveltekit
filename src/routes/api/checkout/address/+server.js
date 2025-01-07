import { json } from '@sveltejs/kit';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const getConnection = async () => {
	return mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME
	});
};

export async function GET({ request }) {
	let connection;
	try {
		const authHeader = request.headers.get('Authorization');
		const token = authHeader?.replace('Bearer ', '');

		if (!token) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.id;

		connection = await getConnection();
		const [rows] = await connection.execute('SELECT address FROM users WHERE id = ?', [userId]);

		return json({ address: rows[0]?.address || '' });
	} catch (err) {
		console.error('GET Address Error:', err);
		return json({ error: 'Failed to fetch address' }, { status: 500 });
	} finally {
		if (connection) {
			await connection.end();
		}
	}
}

export async function POST({ request }) {
	let connection;
	try {
		const authHeader = request.headers.get('Authorization');
		const token = authHeader?.replace('Bearer ', '');

		if (!token) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.id;

		const { address } = await request.json(); // Ensure this matches your frontend

		if (!address || address.length < 10) {
			return json({ error: 'Address must be at least 10 characters' }, { status: 400 });
		}

		connection = await getConnection();
		await connection.execute('UPDATE users SET address = ? WHERE id = ?', [address, userId]);

		return json({ success: true });
	} catch (err) {
		console.error('POST Address Error:', err);
		return json({ error: 'Failed to update address' }, { status: 500 });
	} finally {
		if (connection) {
			await connection.end();
		}
	}
}
