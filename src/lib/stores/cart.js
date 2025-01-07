import { writable, derived } from 'svelte/store';
import axios from 'axios';

export const cartItems = writable([]);
export const cartCount = writable(0);

export const safeCartCount = derived(cartCount, ($count) => {
	const parsedCount = parseInt($count);
	return !isNaN(parsedCount) ? parsedCount : 0;
});

export async function updateCartCount() {
	try {
		const token = localStorage.getItem('authToken');
		if (!token) {
			cartCount.set(0);
			return;
		}

		const response = await axios.get('/api/cart', {
			headers: { Authorization: `Bearer ${token}` }
		});

		const items = response.data;
		const newCount = items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
		cartCount.set(newCount);
		localStorage.setItem('cartCount', newCount.toString());
	} catch {
		const storedCount = localStorage.getItem('cartCount');
		cartCount.set(storedCount ? parseInt(storedCount) : 0);
	}
}

export async function addToCart(productId, quantity) {
	try {
		const token = localStorage.getItem('authToken');
		if (!token) throw new Error('Not authenticated');

		const response = await axios.post(
			'/api/cart',
			{ productId, quantity },
			{ headers: { Authorization: `Bearer ${token}` } }
		);

		if (response.status === 200) {
			await updateCartCount();
			return true;
		}
		return false;
	} catch (err) {
		throw err;
	}
}

export async function removeFromCart(productId) {
	try {
		const token = localStorage.getItem('authToken');
		if (!token) throw new Error('Not authenticated');

		// Get current quantity first
		const currentItems = get(cartItems);
		const item = currentItems.find((item) => item.product_id === productId);

		if (item) {
			// Use negative quantity to remove
			await addToCart(productId, -item.quantity);
		}

		await updateCartCount();
	} catch (err) {
		throw err;
	}
}

export function clearCart() {
	cartItems.set([]);
	cartCount.set(0);
	localStorage.removeItem('cartCount');
}
