import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { json } from '@sveltejs/kit';
import { query } from '$lib/db.js';
import { JWT_SECRET, JWT_EXPIRATION } from '$env/static/private';

export async function POST({ request }) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sql = 'SELECT id, username, password, email, role FROM users WHERE username = ?';
    const rows = await query(sql, [username]);

    if (rows.length === 0) {
      return json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const user = rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const payload = { id: user.id, username: user.username, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    return json({
      success: true,
      token,
      user: { username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Error during login:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}