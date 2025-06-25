import { json } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

async function ensureDir(dirPath) {
	try {
		await mkdir(dirPath, { recursive: true });
	} catch (err) {
		if (err.code !== 'EEXIST') throw err;
	}
}

export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const image = formData.get('image');

		if (!image) {
			return json({ success: false, message: 'No image uploaded' }, { status: 400 });
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
		if (!allowedTypes.includes(image.type)) {
			return json({ success: false, message: 'Invalid file type' }, { status: 400 });
		}

		// Create unique filename
		const extension = image.name.split('.').pop();
		const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

		// Ensure the upload directory exists
		const uploadDir = join(process.cwd(), 'static', 'images');
		await ensureDir(uploadDir);

		// Write the file
		const arrayBuffer = await image.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const filePath = join(uploadDir, filename);

		await writeFile(filePath, buffer);

		return json({
			success: true,
			imagePath: `/images/${filename}`
		});
	} catch (error) {
		console.error('Upload error:', error);
		return json({ success: false, message: 'Error uploading file' }, { status: 500 });
	}
}
