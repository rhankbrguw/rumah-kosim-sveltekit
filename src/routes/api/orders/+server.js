import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { query } from '$lib/db.js';
import { JWT_SECRET } from '$env/static/private';

export async function GET({ request }) {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

		const [userRows] = await query('SELECT username FROM users WHERE id = ?', [userId]);
		const username = userRows?.username;

		const ordersSql = `
            SELECT
                o.id, o.total, o.shipping_address, o.shipping_price,
                o.shipping_method, o.tracking_number, o.status,
                DATE_FORMAT(o.date, '%Y-%m-%d %H:%i:%s') as date
            FROM orders o
            WHERE o.user_id = ?
            ORDER BY o.date DESC`;
		const orders = await query(ordersSql, [userId]);

		for (let order of orders) {
			const itemsSql = `
                SELECT
                    oi.quantity, oi.price_at_time, oi.product_id,
                    p.title, p.image
                FROM order_items oi
                JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id = ?`;
			const items = await query(itemsSql, [order.id]);
			order.items = items;
			order.username = username;
		}

		return json(orders);
	} catch (error) {
		console.error('Error fetching orders:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
