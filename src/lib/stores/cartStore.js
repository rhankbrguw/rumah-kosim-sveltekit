// src/lib/stores/cartStore.js
import { writable } from 'svelte/store';
import axios from 'axios';

const createCartStore = () => {
	const { subscribe, set, update } = writable({
		items: [],
		loading: false,
		error: null
	});

	return {
		subscribe,
		async getCart() {
			update((store) => ({ ...store, loading: true }));
			try {
				const token = localStorage.getItem('authToken');
				if (!token) throw new Error('Not authenticated');

				const response = await axios.get('/api/cart', {
					headers: { Authorization: `Bearer ${token}` }
				});

				update((store) => ({
					...store,
					items: response.data,
					loading: false
				}));
			} catch (error) {
				update((store) => ({
					...store,
					error: error.message,
					loading: false
				}));
			}
		},
		reset: () => set({ items: [], loading: false, error: null })
	};
};

export const cartStore = createCartStore();
