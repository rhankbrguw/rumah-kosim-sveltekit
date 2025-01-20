<script>
	import { onDestroy } from 'svelte';
	import { cartCount, safeCartCount, updateCartCount, cartItems } from '$lib/stores/cart';
	import { auth } from '$lib/stores/auth';
	import axios from 'axios';

	export let product;
	export let quantity = 1;

	let isAddingToCart = false;
	let user;

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
				const updatedCart = await axios.get('/api/cart', {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				const newCount = updatedCart.data.reduce((total, item) => total + Number(item.quantity), 0);

				cartCount.set(newCount);
				cartItems.set(updatedCart.data);
				localStorage.setItem('cartCount', newCount.toString());

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

<div class="fixed inset-0 bg-white">
	<div class="h-full w-full overflow-y-auto md:overflow-y-hidden">
		<div class="mx-auto h-full max-w-6xl px-4 pt-16 md:px-6 md:pt-0 lg:px-8">
			<!-- Close Button -->
			<div class="bg-white/2 fixed right-0 top-0 z-50 mt-4 w-full p-4 pt-14 backdrop-blur-sm">
				<div class="mx-auto max-w-6xl">
					<button
						on:click={() => (window.location.href = '/client/shop')}
						class="absolute right-4 text-2xl font-bold text-gray-500 transition-colors hover:text-gray-700 sm:text-3xl"
						aria-label="Close"
					>
						&times;
					</button>
				</div>
			</div>

			<div class="grid h-full grid-cols-1 gap-4 md:mt-6 md:grid-cols-2 md:gap-8 md:pt-8 lg:gap-12">
				<!-- Image Section - Improved Layout -->
				<div
					class="flex h-[400px] items-center justify-center rounded-lg bg-white p-6 md:mt-8 md:h-[500px] md:shadow-sm"
				>
					<div class="relative h-full w-full">
						<img
							src={product.image ? product.image.replace('../', '/') : '/images/placeholder.jpg'}
							alt={product.title}
							class="h-full w-full object-contain"
						/>
					</div>
				</div>

				<!-- Product Details Section -->
				<div class="flex flex-col justify-center space-y-4 pb-8 md:pb-0">
					<h1 class="text-xl font-semibold text-gray-800 sm:text-2xl lg:text-3xl">
						<i>{product.title}</i>
					</h1>
					<p class="text-lg font-medium text-red-600 sm:text-xl">{formatRupiah(product.price)}</p>
					<p class="text-sm text-gray-700 sm:text-base">{product.description}</p>

					<div class="flex items-center gap-2 text-sm sm:text-base">
						<span class="text-gray-500">Stock:</span>
						{#if isOutOfStock}
							<span class="font-medium text-red-500">Out of stock</span>
						{:else}
							<span class="font-medium text-green-600">{product.quantity}</span>
						{/if}
					</div>

					{#if !isAdmin}
						<div class="space-y-2 text-sm text-gray-600 sm:text-base">
							<p>
								<strong>Note:</strong> You must agree to our Terms & Conditions before making any purchase.
							</p>
						</div>

						<!-- Quantity Selector -->
						<div class="flex items-center gap-4">
							<button
								on:click={decrement}
								class="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed sm:h-10 sm:w-10"
								disabled={quantity === 1 || isAddingToCart}
							>
								-
							</button>
							<span class="text-base font-medium sm:text-lg">{quantity}</span>
							<button
								on:click={increment}
								class="flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed sm:h-10 sm:w-10"
								disabled={quantity >= product.quantity || isAddingToCart}
							>
								+
							</button>
						</div>

						<!-- Add to Cart Button -->
						<div>
							<button
								on:click={handleAddToCart}
								class="w-full rounded bg-yellow-500 px-4 py-2 text-sm text-white transition-colors hover:bg-yellow-600 disabled:bg-gray-400 sm:py-3 sm:text-base"
								disabled={isOutOfStock || isAddingToCart}
							>
								{isAddingToCart ? 'Adding...' : 'Add to Cart'}
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body.overflow-hidden) {
		overflow: hidden;
	}
</style>
