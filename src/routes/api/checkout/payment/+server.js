import { json } from '@sveltejs/kit';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const getConnection = async () => {
	return mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME
	});
};

function generateTrackingNumber() {
	const prefix = 'RK';
	const timestamp = Date.now().toString().slice(-8);
	const random = Math.floor(Math.random() * 1000)
		.toString()
		.padStart(3, '0');
	return `${prefix}${timestamp}${random}`;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	let connection;
	try {
		const authHeader = request.headers.get('Authorization');
		const token = authHeader?.replace('Bearer ', '');

		if (!token) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		let userId;
		try {
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			userId = decoded.id;
		} catch (err) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		const { cartItems, total, shippingAddress, shippingPrice, shippingMethod } =
			await request.json();

		if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
			return json({ error: 'Invalid cart items' }, { status: 400 });
		}

		if (!shippingAddress || !shippingMethod) {
			return json({ error: 'Shipping address and method are required' }, { status: 400 });
		}

		connection = await getConnection();
		await connection.beginTransaction();

		try {
			const trackingNumber = generateTrackingNumber();

			// Create the order with all required fields
			const [orderResult] = await connection.execute(
				`INSERT INTO orders (
                    user_id, total, shipping_address, shipping_price,
                    shipping_method, tracking_number, date, status
                ) VALUES (?, ?, ?, ?, ?, ?, NOW(), 'Processing')`,
				[userId, total, shippingAddress, shippingPrice, shippingMethod, trackingNumber]
			);

			const orderId = orderResult.insertId;

			// Insert order items without updating product quantities
			for (const item of cartItems) {
				await connection.execute(
					'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)',
					[orderId, item.product_id, item.quantity, item.price]
				);
			}

			// Clear the user's cart
			await connection.execute('DELETE FROM cart WHERE user_id = ?', [userId]);

			await connection.commit();

			return json({
				success: true,
				orderId,
				trackingNumber,
				message: 'Order processed successfully'
			});
		} catch (error) {
			await connection.rollback();
			console.error('Database error:', error);
			throw error;
		}
	} catch (error) {
		console.error('Payment processing error:', error);
		return json(
			{
				error: 'Payment processing failed',
				details: error.message
			},
			{ status: 500 }
		);
	} finally {
		if (connection) {
			await connection.end();
		}
	}
}
