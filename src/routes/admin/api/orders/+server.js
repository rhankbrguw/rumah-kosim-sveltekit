import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';
import { checkAdmin } from '$lib/server/admin-guard.js';

export async function GET({ request }) {
	if (!(await checkAdmin(request))) {
		return json({ success: false, message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const orders = await query(`
            SELECT
                o.id,
                p.title,
                u.username,
                oi.quantity,
                oi.price_at_time,
                o.total,
                o.status
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            JOIN users u ON o.user_id = u.id
            ORDER BY o.date DESC
        `);
		return json({ success: true, orders });
	} catch (error) {
		return json({ success: false, message: error.message }, { status: 500 });
	}
}

export async function PATCH({ request }) {
	if (!(await checkAdmin(request))) {
		return json({ success: false, message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { orderId, status } = await request.json();
		if (!orderId || !status) {
			return json({ success: false, message: 'Missing required fields' }, { status: 400 });
		}

		await query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
		return json({ success: true });
	} catch (error) {
		return json({ success: false, message: error.message }, { status: 500 });
	}
}
