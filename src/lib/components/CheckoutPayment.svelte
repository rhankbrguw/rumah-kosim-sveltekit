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

	// QR code URL updated to the public static folder
	const qrCodeUrl = '/images/qr-code.png';

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
		const shipping = $checkoutStore.shipping?.price || 20000;
		return subtotal + shipping;
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
				shippingPrice: $checkoutStore.shipping?.price || 20000,
				shippingMethod: paymentMethod
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

<div class="container mx-auto mt-12 px-4 py-8">
	<div class="mb-12">
		<h1 class="mb-4 text-2xl font-bold">Checkout</h1>
		<div class="flex items-center gap-2">
			<span class="text-gray-500">Address</span>
			<span class="mx-2 text-gray-500">———</span>
			<span class="text-gray-500">Shipping</span>
			<span class="mx-2 text-gray-500">———</span>
			<span class="font-medium text-black">Payment</span>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr,400px]">
		<div class="rounded bg-white p-6 shadow">
			<h2 class="mb-6 text-xl font-semibold">Payment Details</h2>

			<div class="mb-8 flex gap-4">
				{#each paymentMethods as method}
					<button
						type="button"
						class="flex-1 rounded border p-4 {paymentMethod === method.id ? 'border-blue-500' : ''}"
						on:click={() => handleMethodSelect(method)}
					>
						<img src={method.icon} alt={method.label} class="h-6" />
						<p class="mt-2 text-sm">{method.label}</p>
					</button>
				{/each}
			</div>

			{#if showQR}
				<div class="text-center">
					<div class="inline-block rounded-lg border border-gray-300 p-4 shadow-sm">
						<img src={qrCodeUrl} alt="Payment QR Code" class="mx-auto h-40 w-40" />
					</div>
					<p class="mt-4 text-sm text-gray-600">Scan this QR code with your e-wallet app to pay</p>
					<button
						on:click={handleSubmit}
						disabled={loading}
						class="mt-6 w-full rounded bg-black py-3 font-medium text-white hover:bg-gray-800 disabled:bg-blue-300"
					>
						{loading ? 'Processing...' : 'Confirm Payment'}
					</button>
				</div>
			{:else}
				<form on:submit={handleSubmit} class="space-y-4">
					<input
						type="text"
						bind:value={cardHolder}
						placeholder="Cardholder Name"
						class="w-full rounded border px-4 py-3"
						required
					/>
					<input
						type="text"
						bind:value={cardNumber}
						on:input={formatCardNumber}
						maxlength="19"
						placeholder="Card Number"
						class="w-full rounded border px-4 py-3"
						required
					/>
					<div class="grid grid-cols-[1fr,1fr,100px] gap-4">
						<select bind:value={month} class="rounded border px-4 py-3" required>
							<option value="">Month</option>
							{#each Array(12)
								.fill()
								.map((_, i) => i + 1) as month}
								<option value={month.toString().padStart(2, '0')}>
									{month.toString().padStart(2, '0')}
								</option>
							{/each}
						</select>
						<select bind:value={year} class="rounded border px-4 py-3" required>
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
							class="rounded border px-4 py-3"
							required
						/>
					</div>

					<label class="mt-6 flex items-center gap-2">
						<input type="checkbox" bind:checked={saveCard} class="sr-only" />
						<div
							class="h-6 w-10 rounded-full transition-colors duration-200 ease-in-out"
							class:bg-gray-200={!saveCard}
							class:bg-blue-500={saveCard}
						>
							<div
								class="h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out"
								class:translate-x-0={!saveCard}
								class:translate-x-4={saveCard}
								style="margin: 4px;"
							/>
						</div>
						<span class="text-sm">Save card for future payments</span>
					</label>

					<button
						type="submit"
						disabled={loading}
						class="mt-6 w-full rounded bg-black py-3 font-medium text-white hover:bg-gray-800 disabled:bg-blue-300"
					>
						{loading ? 'Processing...' : 'Pay Now'}
					</button>
				</form>
			{/if}
		</div>

		<!-- Order Summary -->
		<div class="-mt-4 w-[400px] rounded bg-white p-6 shadow">
			<h2 class="mb-6 text-xl font-semibold">Order Summary</h2>
			<div class="mb-6 space-y-4">
				{#each cartItems as item}
					<div class="flex items-start gap-4">
						<img src={item.image} alt={item.title} class="h-16 w-16 rounded object-cover" />
						<div class="flex-1">
							<h3 class="font-medium">{item.title}</h3>
							<p class="text-sm text-gray-500">Qty: {item.quantity}</p>
							<p class="mt-1 text-gray-700">Rp {item.price.toLocaleString()}</p>
						</div>
					</div>
				{/each}
			</div>
			<hr class="mb-4" />
			<div class="space-y-3">
				<div class="flex justify-between text-gray-600">
					<span>Subtotal</span>
					<span>Rp {subtotal.toLocaleString()}</span>
				</div>
				<div class="flex justify-between text-gray-600">
					<span>Shipping</span>
					<span>Rp {($checkoutStore.shipping?.price || 20000).toLocaleString()}</span>
				</div>
				<hr class="my-2" />
				<div class="flex justify-between text-lg font-bold">
					<span>Total</span>
					<span>Rp {calculateTotal().toLocaleString()}</span>
				</div>
			</div>
		</div>
	</div>
</div>
