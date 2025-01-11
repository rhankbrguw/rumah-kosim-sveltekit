import { json } from '@sveltejs/kit';
import { query } from '$lib/db';
import jwt from 'jsonwebtoken';

async function checkAdmin(request) {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return false;
		}
		const token = authHeader.split(' ')[1];
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		return decoded && decoded.role === 'admin';
	} catch (error) {
		console.error('Admin check error:', error);
		return false;
	}
}

export async function GET({ request }) {
	if (!(await checkAdmin(request))) {
		return json({ success: false, message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const products = await query('SELECT * FROM products ORDER BY id DESC');
		return json({ success: true, products });
	} catch (error) {
		console.error('GET products error:', error);
		return json({ success: false, message: 'Error fetching products' }, { status: 500 });
	}
}

export async function POST({ request }) {
	if (!(await checkAdmin(request))) {
		return json({ success: false, message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();
		const { title, price, image, description, quantity } = data;

		// Log received data and its types
		console.log('Data types:', {
			title: typeof title,
			description: typeof description,
			price: typeof price,
			quantity: typeof quantity,
			image: typeof image,
			descriptionLength: description?.length
		});

		// Validate required fields
		if (!title?.trim()) {
			return json({ success: false, message: 'Title is required' }, { status: 400 });
		}
		if (!description?.trim()) {
			return json({ success: false, message: 'Description is required' }, { status: 400 });
		}
		if (!image?.trim()) {
			return json({ success: false, message: 'Image is required' }, { status: 400 });
		}
		if (!price || isNaN(Number(price)) || Number(price) <= 0) {
			return json({ success: false, message: 'Valid price is required' }, { status: 400 });
		}
		if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 0) {
			return json({ success: false, message: 'Valid quantity is required' }, { status: 400 });
		}

		// Check description length against VARCHAR(255) limit
		if (description.length > 255) {
			return json(
				{
					success: false,
					message: 'Description must be less than 255 characters'
				},
				{ status: 400 }
			);
		}

		try {
			const result = await query(
				'INSERT INTO products (title, price, image, description, quantity) VALUES (?, ?, ?, ?, ?)',
				[
					title.trim(),
					Number(price),
					image.trim(),
					description.trim(),
					Math.floor(Number(quantity))
				]
			);

			return json({
				success: true,
				productId: result.insertId,
				message: 'Product added successfully'
			});
		} catch (dbError) {
			console.error('Database error:', {
				code: dbError.code,
				message: dbError.message,
				sqlMessage: dbError.sqlMessage
			});

			if (dbError.code === 'ER_DUP_ENTRY') {
				return json(
					{
						success: false,
						message: 'A product with this title already exists'
					},
					{ status: 400 }
				);
			}

			if (dbError.code === 'ER_DATA_TOO_LONG') {
				return json(
					{
						success: false,
						message: 'One or more fields exceed maximum length'
					},
					{ status: 400 }
				);
			}

			throw dbError; // Re-throw for general error handling
		}
	} catch (error) {
		console.error('POST product error:', {
			error: error,
			message: error.message,
			stack: error.stack
		});

		return json(
			{
				success: false,
				message: 'Error adding product: ' + error.message
			},
			{ status: 500 }
		);
	}
}

export async function PATCH({ request }) {
	if (!(await checkAdmin(request))) {
		return json({ success: false, message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { productId, image } = await request.json();
		if (!productId || !image?.trim()) {
			return json(
				{ success: false, message: 'Product ID and image are required' },
				{ status: 400 }
			);
		}

		await query('UPDATE products SET image = ? WHERE id = ?', [image.trim(), productId]);
		return json({ success: true, message: 'Product image updated successfully' });
	} catch (error) {
		console.error('PATCH product error:', error);
		return json({ success: false, message: 'Error updating product image' }, { status: 500 });
	}
}

export async function DELETE({ request }) {
	if (!(await checkAdmin(request))) {
		return json({ success: false, message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { productId } = await request.json();
		if (!productId) {
			return json({ success: false, message: 'Product ID is required' }, { status: 400 });
		}

		await query('DELETE FROM products WHERE id = ?', [productId]);
		return json({ success: true, message: 'Product deleted successfully' });
	} catch (error) {
		console.error('DELETE product error:', error);
		return json({ success: false, message: 'Error deleting product' }, { status: 500 });
	}
}
