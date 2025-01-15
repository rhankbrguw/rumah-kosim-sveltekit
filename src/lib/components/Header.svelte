<script>
	import { auth, logout } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import axios from 'axios';

	let cartCount = 0;
	let isAuthenticated = false;
	let user;

	// Subscribe Auth
	$: auth.subscribe(({ isAuthenticated: authState, user: userDetails }) => {
		isAuthenticated = authState;
		user = userDetails;
	});

	// Fetch Items
	async function fetchCartCount() {
		try {
			const storedCartCount = localStorage.getItem('cartCount');
			if (storedCartCount) {
				cartCount = parseInt(storedCartCount);
			}

			if (isAuthenticated) {
				const token = localStorage.getItem('authToken');
				if (!token) {
					console.warn('No auth token found');
					return;
				}

				const res = await axios.get('/api/cart', {
					headers: { Authorization: `Bearer ${token}` }
				});

				if (res.status === 200) {
					const cart = res.data;
					cartCount = cart.reduce((total, item) => total + item.quantity, 0);

					localStorage.setItem('cartCount', cartCount);
				}
			}
		} catch (error) {
			console.error('Failed to fetch cart count:', error.response?.data || error.message);
		}
	}

	onMount(fetchCartCount);

	// Handle logout
	function handleLogout() {
		logout();
		localStorage.clear();
		goto('/client/login');
	}
</script>

<header
	class="bg-white/2 fixed top-0 z-[100] flex w-full items-center justify-between border-b px-6 py-4 shadow-md backdrop-blur-sm"
>
	<div class="flex items-center gap-x-6 text-yellow-500">
		<a href="/" class="text-2xl font-bold">RumahKosimBook</a>
		<nav class="flex gap-4">
			<a href="/client/about" class="text-sm text-stone-500 hover:text-amber-400">About</a>
			<a href="/client/shop" class="text-sm text-stone-500 hover:text-amber-400">Shop</a>
		</nav>
	</div>

	<div class="flex items-center gap-4">
		{#if isAuthenticated && user?.role !== 'admin'}
			<a href="/client/cart" class="text-stone-300 hover:text-amber-400">🛒 {cartCount}</a>
		{/if}

		{#if isAuthenticated}
			<div class="group relative">
				<div class="flex cursor-pointer items-center gap-2 group-hover:underline">
					<img src="/images/profile.png" alt="Profile" class="h-8 w-8 rounded-full" />
					<span class="text-stone-500 hover:text-amber-400">{user?.username}</span>
				</div>
				<div class="absolute right-0 hidden w-48 rounded bg-white shadow-md group-hover:block">
					{#if user?.role === 'admin'}
						<a
							href="/admin"
							class="block px-4 py-2 text-sm text-stone-500 hover:bg-amber-50 hover:text-amber-400"
						>
							⚙️Settings
						</a>
					{:else}
						<a
							href="/client/profiles"
							class="block px-4 py-2 text-sm text-stone-500 hover:bg-amber-50 hover:text-amber-400"
						>
							View Profiles
						</a>
					{/if}
					<a
						on:click={handleLogout}
						class="block cursor-pointer px-4 py-2 text-sm text-red-500 hover:bg-amber-50 hover:text-red-700"
					>
						Logout
					</a>
				</div>
			</div>
		{:else}
			<a href="/client/login" class="font-semibold text-stone-500 hover:text-amber-400">Login</a>
			<a href="/client/signup" class="font-semibold text-stone-500 hover:text-amber-400">Daftar</a>
		{/if}
	</div>
</header>
