<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { checkoutStore } from '$lib/stores/checkoutStore';
	import { cartStore } from '$lib/stores/cartStore';

	let selectedShipping = '';
	let cartItems = [];
	let subtotal = 0;

	const shippingOptions = [
		{
			id: 'gosend',
			label: 'Go-send',
			duration: '4-7 Business Days',
			price: 20000
		},
		{
			id: 'jne',
			label: 'JNE',
			duration: '3-5 Business Days',
			price: 70000
		}
	];

	onMount(async () => {
		await cartStore.getCart();
		cartStore.subscribe((state) => {
			cartItems = state.items;
			subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
		});

		await checkoutStore.getUserAddress();
	});

	function handleShippingSelect(option) {
		selectedShipping = option.id;
		checkoutStore.setShipping(option);
	}

	function calculateTotal() {
		const shipping = selectedShipping
			? shippingOptions.find((opt) => opt.id === selectedShipping).price
			: 0;
		return subtotal + shipping;
	}

	async function handleContinue() {
		if (!selectedShipping) {
			alert('Please select a shipping method');
			return;
		}
		await goto('/client/checkout/payment');
	}
</script>

<div class="mx-auto mt-20 max-w-5xl px-4 py-6 sm:px-8">
	<!-- Checkout content -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr,auto] lg:gap-16">
		<div>
			<h1 class="mb-6 text-xl font-semibold sm:text-2xl">Checkout</h1>

			<!-- Progress -->
			<div class="mb-8 flex items-center text-sm sm:text-base">
				<span class="text-gray-500">Address</span>
				<div class="mx-2 flex-1 border-t border-gray-300 sm:mx-4"></div>
				<span class="font-medium text-black">Shipping</span>
				<div class="mx-2 flex-1 border-t border-gray-300 sm:mx-4"></div>
				<span class="text-gray-500">Payment</span>
			</div>

			<!-- Shipping options -->
			<div class="space-y-4">
				{#each shippingOptions as option}
					<label
						class="block cursor-pointer rounded-lg border p-3 hover:border-black sm:p-4
            {selectedShipping === option.id ? 'border-black' : 'border-gray-200'}"
					>
						<div class="flex items-center">
							<input
								type="radio"
								name="shipping"
								value={option.id}
								bind:group={selectedShipping}
								on:change={() => handleShippingSelect(option)}
								class="mr-3"
							/>
							<div>
								<div class="text-sm font-medium sm:text-base">{option.label}</div>
								<div class="text-xs text-gray-500 sm:text-sm">{option.duration}</div>
							</div>
						</div>
					</label>
				{/each}
			</div>

			<button
				on:click={handleContinue}
				class="mt-6 w-full rounded-lg bg-black py-2 text-white hover:bg-gray-800 sm:py-3"
			>
				Continue to payment
			</button>
		</div>

		<!-- Order summary -->
		<div class="w-full lg:w-80">
			<h2 class="-mt-2 mb-4 text-xl font-semibold sm:text-2xl">Your Cart</h2>
			<div class="mt-8 space-y-4">
				{#each cartItems as item}
					<div class="flex gap-3 sm:gap-4">
						<img
							src="/images/{item.image.split('/').pop()}"
							alt={item.title}
							class="h-16 w-12 rounded object-cover sm:h-20 sm:w-16"
						/>
						<div>
							<h3 class="text-sm font-medium sm:text-base">{item.title}</h3>
							<p class="text-xs text-gray-500 sm:text-sm">Qty: {item.quantity}</p>
							<p class="mt-1 text-sm text-gray-700 sm:mt-2 sm:text-base">
								Rp {item.price.toLocaleString()}
							</p>
						</div>
					</div>
					<hr class="mb-4 mt-4 border-gray-600" />
				{/each}
			</div>

			<!-- Coupon -->
			<input
				type="text"
				placeholder="Enter coupon code here"
				class="mt-6 w-full rounded-lg border p-2 text-sm sm:text-base"
			/>

			<!-- Totals -->
			<div class="mt-4 space-y-2 text-sm sm:text-base">
				<br />
				<hr class="mb-4 border-gray-300" />
				<div class="flex justify-between">
					<span class="text-gray-600">Subtotal</span>
					<span>Rp {subtotal.toLocaleString()}</span>
				</div>
				{#if selectedShipping}
					<div class="flex justify-between">
						<span class="text-gray-600">Shipping</span>
						<span>
							Rp {shippingOptions.find((opt) => opt.id === selectedShipping).price.toLocaleString()}
						</span>
					</div>
				{/if}
				<hr class="my-2 border-gray-300" />
				<div class="flex justify-between font-medium">
					<span>Total</span>
					<span>Rp {calculateTotal().toLocaleString()}</span>
				</div>
			</div>
		</div>
	</div>
</div>
