<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { cartCount, cartItems as cartStore, safeCartCount } from '$lib/stores/cart';
	import axios from 'axios';

	let cartItems = [];
	let isLoading = true;
	let error = null;

	$: subtotal =
		cartItems?.reduce((sum, item) => {
			const price = Number(item.price) || 0;
			const quantity = Number(item.quantity) || 0;
			return sum + price * quantity;
		}, 0) || 0;

	async function fetchCartItems() {
		try {
			const token = localStorage.getItem('authToken');
			if (!token) throw new Error('Not authenticated');

			const response = await axios.get('/api/cart', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			cartItems = response.data.map((item) => ({
				...item,
				image: `/images/${item.image?.split('/').pop() || `buku${item.product_id}.jpg`}`
			}));
			cartStore.set(cartItems);

			// Update cart count based on fetched items
			const newCount = cartItems.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
			cartCount.set(newCount);
			localStorage.setItem('cartCount', newCount.toString());

			isLoading = false;
		} catch (err) {
			error = err.response?.data?.message || err.message;
			isLoading = false;
		}
	}

	async function updateQuantity(productId, delta) {
		try {
			const token = localStorage.getItem('authToken');
			if (!token) throw new Error('Not authenticated');

			const item = cartItems.find((item) => item.product_id === productId);
			if (!item) throw new Error('Item not found');

			// Calculate new quantity before making the request
			const currentQuantity = Number(item.quantity) || 0;
			const newQuantity = currentQuantity + delta;

			// Prevent negative quantities
			if (newQuantity < 0) {
				throw new Error('Quantity cannot be negative');
			}

			const response = await axios.post(
				'/api/cart',
				{
					productId,
					quantity: delta
				},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (response.status === 200) {
				if (newQuantity === 0) {
					// Remove item if quantity is 0
					cartItems = cartItems.filter((item) => item.product_id !== productId);
				} else {
					// Update quantity
					cartItems = cartItems.map((item) =>
						item.product_id === productId ? { ...item, quantity: newQuantity } : item
					);
				}

				cartStore.set(cartItems);
				const newCount = cartItems.reduce((total, item) => total + Number(item.quantity), 0);
				cartCount.set(newCount);
				localStorage.setItem('cartCount', newCount.toString());
			}
		} catch (err) {
			if (err.response?.data?.message === 'Insufficient stock') {
				alert('Sorry, not enough stock available');
			} else if (err.message === 'Quantity cannot be negative') {
				alert('Cannot reduce quantity below 0');
			} else {
				alert(err.response?.data?.message || err.message);
			}
		}
	}

	async function removeFromCart(productId) {
		try {
			const token = localStorage.getItem('authToken');
			if (!token) throw new Error('Not authenticated');

			const item = cartItems.find((item) => item.product_id === productId);
			if (!item) throw new Error('Item not found');

			// First update the quantity to 0 using the stored procedure
			const updateResponse = await axios.post(
				'/api/cart',
				{
					productId,
					quantity: -item.quantity
				},
				{ headers: { Authorization: `Bearer ${token}` } }
			);

			if (updateResponse.status === 200) {
				// Then remove from UI
				const removedQuantity = Number(item.quantity) || 0;
				cartItems = cartItems.filter((item) => item.product_id !== productId);
				cartStore.set(cartItems);
				const newCount = Math.max(0, $safeCartCount - removedQuantity);
				cartCount.set(newCount);
				localStorage.setItem('cartCount', newCount.toString());
			}
		} catch (err) {
			alert(err.response?.data?.message || err.message);
		}
	}

	async function handleCheckout() {
		const token = localStorage.getItem('authToken');
		if (!token) {
			alert('Please login to proceed with checkout');
			goto('/client/login');
			return;
		}

		if (cartItems.length === 0) {
			alert('Your cart is empty');
			return;
		}

		goto('/client/checkout/address');
	}

	onMount(async () => {
		await fetchCartItems();
	});
</script>

<div class="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
	<div class="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
		<div class="lg:col-span-2">
			<h1 class="mb-8 text-2xl font-semibold text-gray-900">Your Cart</h1>

			{#if isLoading}
				<div class="py-8 text-center">Loading...</div>
			{:else if error}
				<div class="py-8 text-red-500">{error}</div>
			{:else if cartItems.length === 0}
				<div class="py-2 text-gray-500">Your cart is empty.</div>
			{:else}
				<div class="space-y-4">
					{#each cartItems as item (item.product_id)}
						<div class="flex items-center gap-4 rounded-lg border p-4">
							<img src={item.image} alt={item.title} class="h-24 w-24 rounded-md object-cover" />
							<div class="flex-1">
								<h3 class="text-lg font-medium text-gray-900">{item.title}</h3>
								<div class="mt-2 flex items-center gap-4">
									<button
										on:click={() => updateQuantity(item.product_id, -1)}
										class="rounded border px-2 py-1 text-sm hover:bg-gray-100"
									>
										-
									</button>
									<span class="text-gray-600">Quantity: {item.quantity}</span>
									<button
										on:click={() => updateQuantity(item.product_id, 1)}
										class="rounded border px-2 py-1 text-sm hover:bg-gray-100"
									>
										+
									</button>
								</div>
								<p class="mt-2 font-medium text-red-600">
									{new Intl.NumberFormat('id-ID', {
										style: 'currency',
										currency: 'IDR'
									}).format(Number(item.price))}
								</p>
								<button
									on:click={() => removeFromCart(item.product_id)}
									class="mt-2 text-sm text-red-500 hover:text-black"
								>
									Remove
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		{#if !isLoading && !error && cartItems.length > 0}
			<div class="mt-8 lg:col-span-1">
				<div class="rounded-lg bg-white p-6 shadow">
					<h2 class="mb-8 text-lg font-semibold text-gray-900">Order Summary</h2>
					<div class="space-y-2">
						<div class="flex justify-between text-gray-600">
							<span>Subtotal</span>
							<span>
								{new Intl.NumberFormat('id-ID', {
									style: 'currency',
									currency: 'IDR'
								}).format(subtotal)}
							</span>
						</div>
						<div class="flex justify-between text-gray-600">
							<span>Shipping</span>
							<span><i>Calculated later.</i></span>
						</div>
						<div class="mt-2 border-t pt-2">
							<div class="flex justify-between font-semibold text-gray-900">
								<span>Total</span>
								<span>
									{new Intl.NumberFormat('id-ID', {
										style: 'currency',
										currency: 'IDR'
									}).format(subtotal)}
								</span>
							</div>
						</div>
					</div>
					<button
						on:click={handleCheckout}
						class="mt-6 w-full rounded-lg bg-black py-3 text-white hover:bg-gray-800"
					>
						Continue to checkout
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
