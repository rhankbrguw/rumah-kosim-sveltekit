import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';

export async function GET({ url }) {
	const id = url.searchParams.get('id');

	if (!id || isNaN(parseInt(id))) {
		return json({ error: 'Invalid product ID' }, { status: 400 });
	}

	try {
		const sql = 'SELECT id, title, price, image, description, quantity FROM products WHERE id = ?';
		const rows = await query(sql, [id]);

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
