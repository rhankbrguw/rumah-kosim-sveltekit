import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

export async function GET({ request }) {
	try {
		const authHeader = request.headers.get('Authorization');
		const token = authHeader?.replace('Bearer ', '');

		if (!token) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const decoded = jwt.verify(token, JWT_SECRET);
		const userId = decoded.id;

		const rows = await query('SELECT address FROM users WHERE id = ?', [userId]);

		return json({ address: rows[0]?.address || '' });
	} catch (err) {
		console.error('GET Address Error:', err);
		return json({ error: 'Failed to fetch address' }, { status: 500 });
	}
}

export async function POST({ request }) {
	try {
		const authHeader = request.headers.get('Authorization');
		const token = authHeader?.replace('Bearer ', '');

		if (!token) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const decoded = jwt.verify(token, JWT_SECRET);
		const userId = decoded.id;

		const { address } = await request.json();

		if (!address || address.length < 10) {
			return json({ error: 'Address must be at least 10 characters' }, { status: 400 });
		}

		await query('UPDATE users SET address = ? WHERE id = ?', [address, userId]);

		return json({ success: true });
	} catch (err) {
		console.error('POST Address Error:', err);
		return json({ error: 'Failed to update address' }, { status: 500 });
	}
}
