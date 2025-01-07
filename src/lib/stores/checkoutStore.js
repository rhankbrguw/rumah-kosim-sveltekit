import { writable } from 'svelte/store';
import axios from 'axios';

const createCheckoutStore = () => {
	const { subscribe, set, update } = writable({
		address: '',
		shipping: null,
		payment: '',
		loading: false,
		error: null
	});

	return {
		subscribe,
		setAddress: (address) => update((store) => ({ ...store, address })),
		setShipping: (shipping) => update((store) => ({ ...store, shipping })),
		setPayment: (payment) => update((store) => ({ ...store, payment })),
		async getUserAddress() {
			try {
				const token = localStorage.getItem('authToken');
				if (!token) throw new Error('Not authenticated');

				const response = await axios.get('/api/checkout/address', {
					headers: { Authorization: `Bearer ${token}` }
				});

				if (response.data.address) {
					update((store) => ({ ...store, address: response.data.address }));
				}
			} catch (error) {
				update((store) => ({ ...store, error: error.message }));
			}
		},
		async saveAddress(address) {
			try {
				const token = localStorage.getItem('authToken');
				if (!token) throw new Error('Not authenticated');

				const response = await axios.post(
					'/api/checkout/address',
					{ address },
					{ headers: { Authorization: `Bearer ${token}` } }
				);

				if (response.data.success) {
					update((store) => ({ ...store, address }));
				}
			} catch (error) {
				update((store) => ({ ...store, error: error.message }));
			}
		},
		reset: () => set({ address: '', shipping: '', payment: '', loading: false, error: null })
	};
};

export const checkoutStore = createCheckoutStore();
