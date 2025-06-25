import { json } from '@sveltejs/kit';
import { query, pool } from '$lib/db.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

export async function POST({ request }) {
	try {
		const authHeader = request.headers.get('Authorization');
		const { productId, quantity } = await request.json();
		const token = authHeader?.replace('Bearer ', '');

		if (!token) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		let userId;
		try {
			const decoded = jwt.verify(token, JWT_SECRET);
			userId = decoded.id;
		} catch (err) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		if (!userId || !productId || quantity === undefined) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		try {
			await query('CALL add_to_cart(?, ?, ?)', [userId, productId, quantity]);
			return json({ success: true });
		} catch (err) {
			if (err.message.includes('Insufficient stock')) {
				return json({ error: 'Insufficient stock' }, { status: 400 });
			}
			if (err.message.includes('Cannot reduce below zero')) {
				return json({ error: 'Cannot reduce quantity below zero' }, { status: 400 });
			}
			return json({ error: 'Failed to update cart' }, { status: 500 });
		}
	} catch (err) {
		console.error('POST: Unexpected error:', err);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function GET({ request }) {
	try {
		const authHeader = request.headers.get('Authorization');
		const token = authHeader?.replace('Bearer ', '');

		if (!token) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const decoded = jwt.verify(token, JWT_SECRET);
		const userId = decoded.id;

		if (!userId) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const sql =
			'SELECT c.product_id, p.title, p.price, c.quantity, p.image FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?';
		const cartItems = await query(sql, [userId]);
		return json(cartItems);
	} catch (err) {
		console.error('GET: Database error:', err);
		return json({ error: 'Failed to fetch cart' }, { status: 500 });
	}
}

export async function DELETE({ request }) {
	let connection;
	try {
		const authHeader = request.headers.get('Authorization');
		const token = authHeader?.replace('Bearer ', '');

		if (!token) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		let userId;
		try {
			const decoded = jwt.verify(token, JWT_SECRET);
			userId = decoded.id;
		} catch (err) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const { productId } = await request.json();
		if (!productId) {
			return json({ error: 'Invalid productId' }, { status: 400 });
		}

		connection = await pool.getConnection();
		await connection.beginTransaction();

		try {
			const [cartItem] = await connection.execute(
				'SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?',
				[userId, productId]
			);

			if (cartItem.length === 0) {
				await connection.rollback();
				return json({ error: 'No cart item found' }, { status: 404 });
			}

			await connection.execute('UPDATE products SET quantity = quantity + ? WHERE id = ?', [
				cartItem[0].quantity,
				productId
			]);

			await connection.execute('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [
				userId,
				productId
			]);

			await connection.commit();
			return json({ success: true });
		} catch (err) {
			await connection.rollback();
			console.error('DELETE: Database error:', err);
			return json({ error: 'Failed to delete from cart' }, { status: 500 });
		}
	} catch (err) {
		if (connection) {
			await connection.rollback();
		}
		console.error('DELETE: Unexpected error:', err);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	} finally {
		if (connection) {
			connection.release();
		}
	}
}
