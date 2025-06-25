import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';

export async function checkAdmin(request) {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return false;
		}
		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, JWT_SECRET);
		return decoded?.role === 'admin';
	} catch (error) {
		return false;
	}
}
