import { json } from '@sveltejs/kit';
import { query, pool } from '$lib/db.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

export async function POST({ request }) {
	let conn;
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		let userId;

		try {
			const decoded = jwt.verify(token, JWT_SECRET);
			userId = decoded.id;
		} catch (err) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const requestBody = await request.json();
		const { orderId, productId, rating, comment } = requestBody;

		if (!orderId || !productId || !rating || !comment) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		if (rating < 1 || rating > 5) {
			return json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
		}

		conn = await pool.getConnection();

		try {
			await conn.beginTransaction();

			const [orders] = await conn.execute('SELECT id FROM orders WHERE id = ? AND user_id = ?', [
				orderId,
				userId
			]);

			if (orders.length === 0) {
				await conn.rollback();
				return json({ error: 'Order not found' }, { status: 404 });
			}

			const [existingReviews] = await conn.execute(
				'SELECT id FROM reviews WHERE order_id = ? AND product_id = ? AND user_id = ?',
				[orderId, productId, userId]
			);

			if (existingReviews.length > 0) {
				await conn.rollback();
				return json({ error: 'Review already exists' }, { status: 400 });
			}

			const [result] = await conn.execute(
				`INSERT INTO reviews (order_id, product_id, user_id, rating, comment)
         VALUES (?, ?, ?, ?, ?)`,
				[orderId, productId, userId, rating, comment]
			);

			await conn.commit();
			return json({ success: true, reviewId: result.insertId });
		} catch (err) {
			await conn.rollback();
			throw err;
		} finally {
			conn.release();
		}
	} catch (err) {
		return json({ error: 'Failed to create review', details: err.message }, { status: 500 });
	}
}

export async function GET({ request }) {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		let userId;

		try {
			const decoded = jwt.verify(token, JWT_SECRET);
			userId = decoded.id;
		} catch (err) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const sql = `
            SELECT r.*, p.title as product_title
            FROM reviews r
            JOIN products p ON r.product_id = p.id
            WHERE r.user_id = ?`;
		const reviews = await query(sql, [userId]);

		return json(reviews);
	} catch (err) {
		console.error('Server error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
