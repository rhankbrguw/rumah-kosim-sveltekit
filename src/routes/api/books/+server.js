import { json } from '@sveltejs/kit';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export async function GET() {
	try {
		const connection = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME
		});

		const [rows] = await connection.execute(
			'SELECT id, title, price, image, description FROM products'
		);
		await connection.end();

		return json(rows);
	} catch (error) {
		console.error('Error fetching books:', error.message);
		return json({ error: 'Server error' }, { status: 500 });
	}
}
