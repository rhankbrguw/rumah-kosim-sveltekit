import { json } from '@sveltejs/kit';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const pool = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	waitForConnections: true,
	connectionLimit: 10
});

export async function POST({ request }) {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.split(' ')[1];
		let userId;

		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

		const conn = await pool.getConnection();

		try {
			await conn.beginTransaction();

			// Verify order exists and belongs to user
			const [orders] = await conn.execute('SELECT id FROM orders WHERE id = ? AND user_id = ?', [
				orderId,
				userId
			]);

			if (orders.length === 0) {
				await conn.rollback();
				return json({ error: 'Order not found' }, { status: 404 });
			}

			// Check if review already exists
			const [existingReviews] = await conn.execute(
				'SELECT id FROM reviews WHERE order_id = ? AND product_id = ? AND user_id = ?',
				[orderId, productId, userId]
			);

			if (existingReviews.length > 0) {
				await conn.rollback();
				return json({ error: 'Review already exists' }, { status: 400 });
			}

			// Create the review
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
