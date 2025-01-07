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

export async function POST({ request }) {
	let connection;
	try {
		const authHeader = request.headers.get('Authorization');
		const { productId, quantity } = await request.json();
		const token = authHeader?.replace('Bearer ', '');

		if (!token) {
			console.error('POST: Missing token');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		let userId;
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			userId = decoded.id;
		} catch (err) {
			console.error('POST: JWT verification failed:', err);
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		if (!userId || !productId || quantity === undefined) {
			console.error('POST: Missing required fields');
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		connection = await getConnection();

		try {
			// Call the improved stored procedure
			await connection.execute('CALL add_to_cart(?, ?, ?)', [userId, productId, quantity]);
			return json({ success: true });
		} catch (err) {
			console.error('POST: Database error:', err);

			// Handle specific error cases from stored procedure
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
	} finally {
		if (connection) {
			await connection.end();
		}
	}
}

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

		if (!userId) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		connection = await getConnection();
		const [cartItems] = await connection.execute(
			'SELECT c.product_id, p.title, p.price, c.quantity, p.image FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?',
			[userId]
		);
		return json(cartItems);
	} catch (err) {
		console.error('GET: Database error:', err);
		return json({ error: 'Failed to fetch cart' }, { status: 500 });
	} finally {
		if (connection) {
			await connection.end();
		}
	}
}

export async function DELETE({ request }) {
	let connection;
	try {
		const authHeader = request.headers.get('Authorization');
		const token = authHeader?.replace('Bearer ', '');

		if (!token) {
			console.error('DELETE: Missing token');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		let userId;
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			userId = decoded.id;
		} catch (err) {
			console.error('DELETE: JWT verification failed:', err);
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const { productId } = await request.json();
		if (!productId) {
			console.error('DELETE: Missing productId');
			return json({ error: 'Invalid productId' }, { status: 400 });
		}

		connection = await getConnection();

		// Start transaction
		await connection.beginTransaction();

		try {
			// First get the current quantity to return to stock
			const [cartItem] = await connection.execute(
				'SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?',
				[userId, productId]
			);

			if (cartItem.length === 0) {
				await connection.rollback();
				return json({ error: 'No cart item found' }, { status: 404 });
			}

			// Update product stock
			await connection.execute('UPDATE products SET quantity = quantity + ? WHERE id = ?', [
				cartItem[0].quantity,
				productId
			]);

			// Delete cart item
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
			await connection.end();
		}
	}
}
