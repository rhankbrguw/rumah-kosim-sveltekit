import { json } from '@sveltejs/kit';
import { query } from '$lib/db';
import jwt from 'jsonwebtoken';

async function checkAdmin(request) {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return false;
		}
		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		return decoded && decoded.role === 'admin';
	} catch (error) {
		return false;
	}
}

export async function PATCH({ request }) {
	if (!(await checkAdmin(request))) {
		return json({ success: false, message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { productId, quantity } = await request.json();

		if (!productId || quantity === undefined) {
			return json({ success: false, message: 'Missing required fields' }, { status: 400 });
		}

		// Update the stock in the database
		await query('UPDATE products SET quantity = ? WHERE id = ?', [quantity, productId]);

		return json({ success: true });
	} catch (error) {
		console.error('Stock update error:', error);
		return json({ success: false, message: error.message }, { status: 500 });
	}
}
