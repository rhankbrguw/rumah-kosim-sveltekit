import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';

export async function GET() {
	try {
		const sql = 'SELECT id, title, price, image, description FROM products';
		const books = await query(sql);
		return json(books);
	} catch (error) {
		console.error('Error fetching books:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
