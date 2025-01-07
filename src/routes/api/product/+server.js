import { json } from '@sveltejs/kit';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export async function GET({ url }) {
	const id = url.searchParams.get('id');

	if (!id || isNaN(parseInt(id))) {
		return json({ error: 'Invalid product ID' }, { status: 400 });
	}

	try {
		const connection = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME
		});

		const [rows] = await connection.execute(
			'SELECT id, title, price, image, description, quantity FROM products WHERE id = ?',
			[id]
		);
		await connection.end();

		if (rows.length > 0) {
			return json(rows[0]);
		} else {
			return json({ error: 'Product not found' }, { status: 404 });
		}
	} catch (error) {
		console.error('Error fetching product:', error.message);
		return json({ error: 'Server error' }, { status: 500 });
	}
}
