import jwt from 'jsonwebtoken';
import { json } from '@sveltejs/kit';
import 'dotenv/config';

export async function POST({ request }) {
	try {
		const { token } = await request.json();
		if (!token) {
			console.error('Token is missing');
			return json({ error: 'Token is missing' }, { status: 400 });
		}
        
		console.log('Validating token:', token);

		// Verify the token
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		console.log('Token is valid, payload:', payload);

		return json({ success: true, user: payload });
	} catch (error) {
		console.error('Token validation error:', error.message);
		return json({ error: 'Invalid token' }, { status: 401 });
	}
}
