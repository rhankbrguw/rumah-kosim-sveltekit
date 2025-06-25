import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';
import { checkAdmin } from '$lib/server/admin-guard.js';

export async function PATCH({ request }) {
	if (!(await checkAdmin(request))) {
		return json({ success: false, message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { productId, quantity } = await request.json();

		if (!productId || quantity === undefined) {
			return json({ success: false, message: 'Missing required fields' }, { status: 400 });
		}

		await query('UPDATE products SET quantity = ? WHERE id = ?', [quantity, productId]);

		return json({ success: true });
	} catch (error) {
		console.error('Stock update error:', error);
		return json({ success: false, message: error.message }, { status: 500 });
	}
}