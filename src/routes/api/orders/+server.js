import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

const getConnection = async () => {
	return mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME
	});
};

export async function GET({ request }) {
	let connection;
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

		connection = await getConnection();

		// Get user's username
		const [userRows] = await connection.execute('SELECT username FROM users WHERE id = ?', [
			userId
		]);

		const username = userRows[0]?.username;

		// Get orders with details
		const [orders] = await connection.execute(
			`SELECT 
                o.id, o.total, o.shipping_address, o.shipping_price,
                o.shipping_method, o.tracking_number, o.status,
                DATE_FORMAT(o.date, '%Y-%m-%d %H:%i:%s') as date
            FROM orders o
            WHERE o.user_id = ?
            ORDER BY o.date DESC`,
			[userId]
		);

		// Get items for each order
		for (let order of orders) {
			const [items] = await connection.execute(
				`SELECT 
                    oi.quantity, oi.price_at_time,
                    p.title, p.image
                FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id = ?`,
				[order.id]
			);
			order.items = items;
			order.username = username;
		}

		return json(orders);
	} catch (error) {
		console.error('Error fetching orders:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	} finally {
		if (connection) {
			await connection.end();
		}
	}
}
