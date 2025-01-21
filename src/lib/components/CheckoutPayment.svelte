<script>
	import { onMount } from 'svelte';
	import { checkoutStore } from '$lib/stores/checkoutStore';
	import { cartStore } from '$lib/stores/cartStore';
	import axios from 'axios';

	let cartItems = [];
	let subtotal = 0;
	let loading = false;
	let paymentMethod = 'apple';
	let cardNumber = '';
	let cardHolder = '';
	let month = '';
	let year = '';
	let cvv = '';
	let saveCard = false;
	let showQR = false;

	// Payment method definitions
	const paymentMethods = [
		{ id: 'apple', label: 'Apple Pay', icon: '/images/applePay.png', type: 'card' },
		{ id: 'paypal', label: 'PayPal', icon: '/images/paypal.png', type: 'card' },
		{ id: 'ewallet', label: 'E-Wallet', icon: '/images/ewallet.png', type: 'qr' }
	];

	const qrCodeUrl = '/images/qr-code.png';

	$: hasFreeShipping = $checkoutStore.shipping?.price === 0;
	$: originalShippingPrice = $checkoutStore.shipping?.originalPrice;

	onMount(async () => {
		try {
			const token = localStorage.getItem('authToken');
			if (!token) {
				window.location.href = '/client/login?redirect=/checkout/payment';
				return;
			}

			const response = await axios.get('/api/cart', {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!response.data || response.data.error) {
				throw new Error(response.data?.error || 'Failed to fetch cart');
			}

			cartItems = response.data.map((item) => ({
				...item,
				image: `/images/${item.image?.split('/').pop() || `buku${item.product_id}.jpg`}`
			}));

			calculateSubtotal();
		} catch (error) {
			console.error('Error fetching cart items:', error);
			if (error.response?.status === 401) {
				localStorage.removeItem('authToken');
				window.location.href = '/client/login?redirect=/checkout/payment';
			} else {
				alert('Error loading cart. Please try again.');
			}
		}
	});

	function calculateSubtotal() {
		subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
	}

	function calculateTotal() {
		const shippingCost = hasFreeShipping ? 0 : $checkoutStore.shipping?.price || 20000;
		return subtotal + shippingCost;
	}

	function validateForm() {
		if (!$checkoutStore.address) {
			alert('Please provide a shipping address');
			return false;
		}

		const selectedMethod = paymentMethods.find((m) => m.id === paymentMethod);
		if (selectedMethod?.type === 'card') {
			if (!cardHolder || !cardNumber || !month || !year || !cvv) {
				alert('Please fill in all payment details');
				return false;
			}
			if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
				alert('Invalid card number - must be 16 digits');
				return false;
			}
			if (!/^\d{3}$/.test(cvv)) {
				alert('Invalid CVV - must be 3 digits');
				return false;
			}
		}
		return true;
	}

	function formatCardNumber(event) {
		let value = event.target.value.replace(/\D/g, '');
		value = value.replace(/(\d{4})/g, '$1 ').trim();
		cardNumber = value.substring(0, 19);
	}

	function handleMethodSelect(method) {
		paymentMethod = method.id;
		showQR = method.type === 'qr';
	}

	async function handleSubmit(event) {
		event.preventDefault();
		if (!validateForm()) return;

		loading = true;
		try {
			const token = localStorage.getItem('authToken');
			if (!token) {
				window.location.href = '/client/login?redirect=/checkout/payment';
				return;
			}

			const paymentData = {
				cartItems,
				total: calculateTotal(),
				shippingAddress: $checkoutStore.address,
				shippingPrice: hasFreeShipping ? 0 : $checkoutStore.shipping?.price || 20000,
				shippingMethod: paymentMethod,
				couponApplied: hasFreeShipping
			};

			const response = await axios.post('/api/checkout/payment', paymentData, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (response.data.success) {
				cartStore.reset();
				checkoutStore.reset();
				alert('Payment Successful!');
				window.location.href = '/client/profiles';
			} else {
				throw new Error(response.data.error || 'Payment failed');
			}
		} catch (error) {
			console.error('Payment error:', error);
			alert(error.response?.data?.error || 'Payment failed. Please try again.');
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto px-4 py-6 sm:mt-12 md:mt-12">
	<div class="mb-8 pt-12 md:mb-12">
		<h1 class="mb-4 text-xl font-bold sm:text-2xl">Checkout</h1>
		<div class="flex items-center gap-1 sm:gap-2">
			<span class="text-sm text-gray-500 sm:text-base">Address</span>
			<span class="mx-1 text-gray-500 sm:mx-2">———</span>
			<span class="text-sm text-gray-500 sm:text-base">Shipping</span>
			<span class="mx-1 text-gray-500 sm:mx-2">———</span>
			<span class="text-sm font-medium text-black sm:text-base">Payment</span>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[1fr,400px] lg:gap-8">
		<!-- Payment Section -->
		<div class="rounded bg-white p-4 shadow sm:p-6">
			<h2 class="mb-4 text-lg font-semibold sm:mb-6 sm:text-xl">Payment Details</h2>

			<div class="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:gap-4">
				{#each paymentMethods as method}
					<button
						type="button"
						class="flex items-center justify-center rounded border p-3 sm:flex-1 sm:p-4 {paymentMethod ===
						method.id
							? 'border-blue-500'
							: ''}"
						on:click={() => handleMethodSelect(method)}
					>
						<img src={method.icon} alt={method.label} class="h-5 sm:h-6" />
						<p class="ml-2 text-sm sm:ml-0 sm:mt-2">{method.label}</p>
					</button>
				{/each}
			</div>

			{#if showQR}
				<div class="text-center">
					<div class="inline-block rounded-lg border border-gray-300 p-4 shadow-sm">
						<img src={qrCodeUrl} alt="Payment QR Code" class="mx-auto h-32 w-32 sm:h-40 sm:w-40" />
					</div>
					<p class="mt-3 text-xs text-gray-600 sm:mt-4 sm:text-sm">
						Scan this QR code with your e-wallet app to pay
					</p>
					<button
						on:click={handleSubmit}
						disabled={loading}
						class="mt-4 w-full rounded bg-black py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-blue-300 sm:mt-6 sm:py-3"
					>
						{loading ? 'Processing...' : 'Confirm Payment'}
					</button>
				</div>
			{:else}
				<form on:submit={handleSubmit} class="space-y-3 sm:space-y-4">
					<input
						type="text"
						bind:value={cardHolder}
						placeholder="Cardholder Name"
						class="w-full rounded border px-3 py-2.5 text-sm sm:px-4 sm:py-3"
						required
					/>
					<input
						type="text"
						bind:value={cardNumber}
						on:input={formatCardNumber}
						maxlength="19"
						placeholder="Card Number"
						class="w-full rounded border px-3 py-2.5 text-sm sm:px-4 sm:py-3"
						required
					/>
					<div class="grid grid-cols-[1fr,1fr,80px] gap-2 sm:grid-cols-[1fr,1fr,100px] sm:gap-4">
						<select
							bind:value={month}
							class="rounded border px-3 py-2.5 text-sm sm:px-4 sm:py-3"
							required
						>
							<option value="">Month</option>
							{#each Array(12)
								.fill()
								.map((_, i) => i + 1) as month}
								<option value={month.toString().padStart(2, '0')}>
									{month.toString().padStart(2, '0')}
								</option>
							{/each}
						</select>
						<select
							bind:value={year}
							class="rounded border px-3 py-2.5 text-sm sm:px-4 sm:py-3"
							required
						>
							<option value="">Year</option>
							{#each Array(10)
								.fill()
								.map((_, i) => new Date().getFullYear() + i) as year}
								<option value={year}>{year}</option>
							{/each}
						</select>
						<input
							type="text"
							bind:value={cvv}
							maxlength="3"
							placeholder="CVV"
							class="rounded border px-3 py-2.5 text-sm sm:px-4 sm:py-3"
							required
						/>
					</div>

					<label class="mt-4 flex items-center gap-2 sm:mt-6">
						<input type="checkbox" bind:checked={saveCard} class="sr-only" />
						<div
							class="h-5 w-9 rounded-full transition-colors duration-200 ease-in-out sm:h-6 sm:w-10"
							class:bg-gray-200={!saveCard}
							class:bg-blue-500={saveCard}
						>
							<div
								class="h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ease-in-out sm:h-4 sm:w-4"
								class:translate-x-0={!saveCard}
								class:translate-x-4={saveCard}
								style="margin: 3px;"
							/>
						</div>
						<span class="text-xs sm:text-sm">Save card for future payments</span>
					</label>

					<button
						type="submit"
						disabled={loading}
						class="mt-4 w-full rounded bg-black py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-blue-300 sm:mt-6 sm:py-3"
					>
						{loading ? 'Processing...' : 'Pay Now'}
					</button>
				</form>
			{/if}
		</div>

		<!-- Order Summary -->
		<div class="w-full rounded bg-white p-4 shadow sm:p-6 lg:w-[400px]">
			<h2 class="mb-4 text-lg font-semibold sm:mb-6 sm:text-xl">Order Summary</h2>
			<div class="mb-4 space-y-3 sm:mb-6 sm:space-y-4">
				{#each cartItems as item}
					<div class="flex items-start gap-3 sm:gap-4">
						<img
							src={item.image}
							alt={item.title}
							class="h-14 w-14 rounded object-cover sm:h-16 sm:w-16"
						/>
						<div class="flex-1">
							<h3 class="text-sm font-medium sm:text-base">{item.title}</h3>
							<p class="text-xs text-gray-500 sm:text-sm">Qty: {item.quantity}</p>
							<p class="mt-0.5 text-sm text-gray-700 sm:mt-1">Rp {item.price.toLocaleString()}</p>
						</div>
					</div>
				{/each}
			</div>
			<hr class="mb-3 sm:mb-4" />
			<div class="space-y-2 text-sm sm:space-y-3 sm:text-base">
				<div class="flex justify-between text-gray-600">
					<span>Subtotal</span>
					<span>Rp {subtotal.toLocaleString()}</span>
				</div>
				<div class="flex justify-between text-gray-600">
					<span>Shipping</span>
					{#if hasFreeShipping}
						<div>
							<span class="text-green-600">FREE</span>
							{#if originalShippingPrice}
								<span class="ml-2 text-xs line-through">
									Rp {originalShippingPrice.toLocaleString()}
								</span>
							{/if}
						</div>
					{:else}
						<span>Rp {($checkoutStore.shipping?.price || 20000).toLocaleString()}</span>
					{/if}
				</div>
				<hr class="my-2" />
				<div class="flex justify-between font-bold sm:text-lg">
					<span>Total</span>
					<span>Rp {calculateTotal().toLocaleString()}</span>
				</div>
			</div>
		</div>
	</div>
</div>
