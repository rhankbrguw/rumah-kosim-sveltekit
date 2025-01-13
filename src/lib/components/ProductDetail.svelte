<script>
	import { onDestroy } from 'svelte';
	import { cartCount, safeCartCount, updateCartCount, cartItems } from '$lib/stores/cart';
	import { auth } from '$lib/stores/auth';
	import axios from 'axios';

	export let product;
	export let quantity = 1;

	let isAddingToCart = false;
	let user;

	// Subscribe to auth store to get user role
	auth.subscribe(({ user: userDetails }) => {
		user = userDetails;
	});

	function formatRupiah(price) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR'
		}).format(price);
	}

	function increment() {
		if (quantity < product.quantity) {
			quantity++;
		}
	}

	function decrement() {
		if (quantity > 1) {
			quantity--;
		}
	}

	$: isOutOfStock = product?.quantity === 0;
	$: isAdmin = user?.role === 'admin';

	const handleAddToCart = async () => {
		if (isAddingToCart || isAdmin) return;

		try {
			isAddingToCart = true;
			const token = localStorage.getItem('authToken');
			if (!token) {
				alert('You need to login first!');
				return;
			}

			// Get current cart state before adding
			const currentCart = await axios.get('/api/cart', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			const existingItem = currentCart.data.find((item) => item.product_id === product.id);
			const totalQuantity = (existingItem?.quantity || 0) + quantity;

			if (totalQuantity > product.quantity) {
				alert('Cannot add more items than available in stock!');
				return;
			}

			const response = await axios.post(
				'/api/cart',
				{
					productId: product.id,
					quantity
				},
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);

			if (response.status === 200) {
				// Get updated cart count from server
				const updatedCart = await axios.get('/api/cart', {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				// Calculate total items in cart
				const newCount = updatedCart.data.reduce((total, item) => total + Number(item.quantity), 0);

				// Update stores
				cartCount.set(newCount);
				cartItems.set(updatedCart.data);
				localStorage.setItem('cartCount', newCount.toString());

				// Update product quantity display
				product.quantity -= quantity;

				alert('Product added to cart successfully!');
			} else {
				alert(response.data?.error || 'Failed to add product to cart');
			}
		} catch (error) {
			console.error('Error adding to cart:', error);
			if (error.response?.data?.error === 'Insufficient stock') {
				alert('Not enough stock available.');
			} else {
				alert(error.response?.data?.error || 'An unexpected error occurred.');
			}
		} finally {
			isAddingToCart = false;
		}
	};

	onDestroy(() => {
		document.body.classList.remove('overflow-hidden');
	});
</script>

<div class="relative mx-auto mt-16 max-w-7xl p-8">
	<!-- Close Button -->
	<button
		on:click={() => (window.location.href = '/client/shop')}
		class="absolute right-4 top-4 text-3xl font-bold text-gray-500 hover:text-gray-700"
		aria-label="Close"
	>
		&times;
	</button>

	<div class="grid grid-cols-1 gap-12 md:grid-cols-2">
		<!-- Image Section -->
		<div class="overflow-hidden rounded-lg">
			<img
				src={product.image ? product.image.replace('../', '/') : '/images/placeholder.jpg'}
				alt={product.title}
				class="max-h-96 w-full object-contain"
			/>
		</div>

		<!-- Product Details Section -->
		<div class="flex flex-col text-sm">
			<h1 class="mb-4 text-2xl font-semibold text-gray-800"><i>{product.title}</i></h1>
			<p class="mb-4 text-xl font-medium text-red-600">{formatRupiah(product.price)}</p>
			<p class="mb-2 text-gray-700">{product.description}</p>

			<div class="flex items-center gap-2">
				<span class="text-gray-500">Stock:</span>
				{#if isOutOfStock}
					<span class="font-medium text-red-500">Out of stock</span>
				{:else}
					<span class="font-medium text-green-600">{product.quantity}</span>
				{/if}
			</div>

			{#if !isAdmin}
				<ul class="mt-6 space-y-2 text-gray-600">
					<li>
						<strong>Note:</strong> You must agree to our Terms & Conditions before making any purchase.
					</li>
				</ul>

				<!-- Quantity Selector -->
				<div class="mt-6 flex items-center gap-4">
					<button
						on:click={decrement}
						class="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed"
						disabled={quantity === 1 || isAddingToCart}
					>
						-
					</button>
					<span class="text-lg font-medium">{quantity}</span>
					<button
						on:click={increment}
						class="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed"
						disabled={quantity >= product.quantity || isAddingToCart}
					>
						+
					</button>
				</div>

				<!-- Add to Cart Button -->
				<div class="mt-6">
					<button
						on:click={handleAddToCart}
						class="w-full rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600 disabled:bg-gray-400"
						disabled={isOutOfStock || isAddingToCart}
					>
						{isAddingToCart ? 'Adding...' : 'Add to Cart'}
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	:global(body.overflow-hidden) {
		overflow: hidden;
	}
</style>