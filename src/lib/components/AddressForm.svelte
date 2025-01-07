<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { checkoutStore } from '$lib/stores/checkoutStore';
	import axios from 'axios';

	export let onSubmitSuccess = () => {};

	let firstName = '';
	let lastName = '';
	let address = '';
	let apartment = '';
	let subdistrict = '';
	let district = '';
	let city = '';
	let province = 'JABODETABEK';
	let postalCode = '';
	let saveInfo = false;
	let cartItems = [];
	let subtotal = 0;
	let shippingCost = 0;
	let total = 0;
	let loading = false;
	let error = '';
	let addressLoaded = false;

	const locationsData = {
		Jakarta: {
			'Central Jakarta': ['Gambir', 'Menteng', 'Cempaka Putih', 'Tanah Abang'],
			'West Jakarta': ['Cengkareng', 'Kebon Jeruk', 'Grogol Petamburan', 'Tambora'],
			'South Jakarta': ['Kebayoran Baru', 'Pasar Minggu', 'Setiabudi', 'Cilandak'],
			'East Jakarta': ['Cakung', 'Pulo Gadung', 'Jatinegara', 'Kramat Jati'],
			'North Jakarta': ['Tanjung Priok', 'Penjaringan', 'Koja', 'Kelapa Gading']
		},
		Bogor: {
			'North Bogor': ['Tanah Sareal', 'Ciluar', 'Cimahpar'],
			'South Bogor': ['Batutulis', 'Empang', 'Bondongan']
		},
		Depok: {
			Beji: ['Pondok Cina', 'Kemiri Muka', 'Tanah Baru'],
			Sukmajaya: ['Tugu', 'Abadijaya', 'Sukmajaya']
		},
		Tangerang: {
			Ciledug: ['Sudimara Barat', 'Karang Tengah', 'Pondok Pucung'],
			Serpong: ['Ciater', 'Buaran', 'Lengkong Gudang']
		},
		Bekasi: {
			'West Bekasi': ['Bintara', 'Kranji', 'Jakasetia'],
			'East Bekasi': ['Duren Jaya', 'Margahayu', 'Aren Jaya']
		}
	};

	let districts = [];
	let subdistricts = [];

	const updateDistricts = () => {
		districts = Object.keys(locationsData[city] || {});
		district = '';
		subdistrict = '';
	};

	const updateSubdistricts = () => {
		subdistricts = locationsData[city]?.[district] || [];
		subdistrict = '';
	};

	onMount(async () => {
		try {
			const token = localStorage.getItem('authToken');
			if (!token) {
				goto('/client/login');
				return;
			}

			loading = true;

			await checkoutStore.getUserAddress();
			const unsubscribe = checkoutStore.subscribe((state) => {
				if (state.address && !addressLoaded) {
					address = state.address;
					addressLoaded = true;
				}
				error = state.error;
			});

			const response = await axios.get('/api/cart', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			cartItems = response.data.map((item) => ({
				...item,
				image: `/images/${item.image?.split('/').pop() || `book${item.product_id}.jpg`}`
			}));

			subtotal = cartItems.reduce(
				(acc, item) => acc + Number(item.price) * Number(item.quantity),
				0
			);
			calculateTotal();

			return () => unsubscribe();
		} catch (err) {
			error = err.response?.data?.message || err.message;
			if (err.response?.status === 401) {
				goto('/client/login');
			}
		} finally {
			loading = false;
		}
	});

	const calculateTotal = () => {
		total = subtotal + shippingCost;
	};

	async function handleSubmit() {
		try {
			loading = true;
			const token = localStorage.getItem('authToken');

			// If address exists in store, use it instead of form values
			const storedAddress = $checkoutStore.address;
			if (storedAddress) {
				await axios.post(
					'/api/checkout/address',
					{ address: storedAddress, cartItems, subtotal, shippingCost, total },
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				goto('/client/checkout/shipping');
				return;
			}

			// Otherwise validate and submit full form
			if (
				!firstName ||
				!lastName ||
				!address ||
				!province ||
				!city ||
				!district ||
				!subdistrict ||
				!postalCode
			) {
				error = 'All fields are required';
				return;
			}

			if (address && address.length >= 10) {
				// Proceed with saving the address
			} else {
				error = 'Address must be at least 10 characters';
				return;
			}

			if (saveInfo) {
				await checkoutStore.saveAddress(address);
			}

			const formData = {
				firstName,
				lastName,
				address,
				apartment,
				subdistrict,
				district,
				city,
				province,
				postalCode,
				cartItems,
				subtotal,
				shippingCost,
				total
			};

			await axios.post('/api/checkout/address', formData, {
				headers: { Authorization: `Bearer ${token}` }
			});
			goto('/client/checkout/shipping');
		} catch (err) {
			error = err.response?.data?.message || err.message;
		} finally {
			loading = false;
		}
	};
</script>

<div class="min-h-screen bg-white">
	<main class="mx-auto mt-12 max-w-7xl px-16 py-10">
		<h1 class="mb-8 text-2xl font-medium">Checkout</h1>
		<div class="flex flex-col gap-12 md:flex-row">
			<!-- Left Column - Form -->
			<div class="flex-1">
				<div class="mb-8 flex items-center">
					<span class="font-medium text-black">Address</span>
					<div class="mx-4 flex-1 border-t border-gray-300"></div>
					<span class="text-gray-500">Shipping</span>
					<div class="mx-4 flex-1 border-t border-gray-300"></div>
					<span class="text-gray-500">Payment</span>
				</div>
				<h2 class="mb-4 text-lg font-semibold">Detail Shipping</h2>

				{#if error}
					<div class="mb-4 text-sm text-red-600">{error}</div>
				{/if}

				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<input
							type="text"
							bind:value={firstName}
							placeholder="First name"
							class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:ring-2 focus:ring-black/10"
							required
						/>
						<input
							type="text"
							bind:value={lastName}
							placeholder="Last name"
							class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:ring-2 focus:ring-black/10"
							required
						/>
					</div>

					<input
						type="text"
						bind:value={address}
						placeholder="Address"
						class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:ring-2 focus:ring-black/10"
						required
					/>
					<input
						type="text"
						bind:value={apartment}
						placeholder="Apartment, suite, etc. (optional)"
						class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:ring-2 focus:ring-black/10"
					/>

					<div class="grid grid-cols-2 gap-4">
						<select
							bind:value={city}
							on:change={updateDistricts}
							class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:ring-2 focus:ring-black/10"
							required
						>
							<option value="">Select City</option>
							{#each Object.keys(locationsData) as c}
								<option value={c}>{c}</option>
							{/each}
						</select>

						<select
							bind:value={district}
							on:change={updateSubdistricts}
							class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:ring-2 focus:ring-black/10"
							required
						>
							<option value="">Select District</option>
							{#each districts as d}
								<option value={d}>{d}</option>
							{/each}
						</select>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<select
							bind:value={subdistrict}
							class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:ring-2 focus:ring-black/10"
							required
						>
							<option value="">Select Subdistrict</option>
							{#each subdistricts as s}
								<option value={s}>{s}</option>
							{/each}
						</select>

						<input
							type="text"
							bind:value={postalCode}
							placeholder="Postal code"
							on:input={(e) => postalCode = e.target.value.slice(0, 5)}
							class="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-black focus:ring-2 focus:ring-black/10"
							required
						/>
					</div>

					<label class="flex items-center gap-2 py-2">
						<input type="checkbox" bind:checked={saveInfo} class="rounded border-gray-300" />
						<span class="text-sm text-gray-600">Save this information</span>
					</label>

					<button
						type="submit"
						disabled={loading}
						class="mt-4 w-full rounded-lg bg-black py-3 text-white hover:bg-gray-800 disabled:opacity-50"
					>
						{loading ? 'Processing...' : 'Continue to shipping'}
					</button>
				</form>
			</div>

			<!-- Right Column - Cart Summary -->
			<div class="w-full px-6 md:w-[400px]">
				<h2 class="-mt-8 mb-6 text-2xl font-semibold">Your Cart</h2>
				<div class="space-y-4">
					{#each cartItems as item}
						<div class="flex items-start justify-between">
							<div class="flex gap-4">
								<div class="h-24 w-20 overflow-hidden rounded">
									<img src={item.image} alt={item.title} class="h-full w-full object-cover" />
								</div>
								<div>
									<h3 class="font-medium">{item.title}</h3>
									<p class="text-sm text-gray-500">Qty: {item.quantity}</p>
									<p class="mt-2 text-gray-700">Rp {item.price.toLocaleString()}</p>
								</div>
							</div>
						</div>
						<hr class="mb-4 mt-4 border-gray-600" />
					{/each}
				</div>

				<br />

				<div class="mt-6 space-y-4 border-t pt-4">
					<div class="flex justify-between">
						<span class="text-gray-600">Subtotal</span>
						<span>Rp {subtotal.toLocaleString()}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Shipping</span>
						<span><i>Calculated later.</i></span>
					</div>
					<div class="flex justify-between border-t pt-4 font-medium">
						<span>Total</span>
						<span>Rp {total.toLocaleString()}</span>
					</div>
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	nav span {
		cursor: pointer;
	}
	nav span.font-semibold {
		text-decoration: underline;
	}
</style>
