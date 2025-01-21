<script>
	import { createEventDispatcher } from 'svelte';

	let username = '';
	let password = '';
	let confirmPassword = '';
	let email = '';
	let error = '';

	const dispatch = createEventDispatcher();

	function handleSubmit() {
		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}
		error = '';
		dispatch('signup', { username, password, email });
	}
</script>

<div class="mx-auto mt-20 w-96 rounded bg-white px-4 py-6 shadow-md">
	<h2 class="mb-8 p-0 text-2xl font-bold">Sign Up</h2>
	<form on:submit|preventDefault={handleSubmit}>
		{#if error}
			<p class="mb-4 text-red-500">{error}</p>
		{/if}
		<div class="mb-5">
			<label for="username" class="text-md mb-1 block font-medium">Username</label>
			<input
				id="username"
				type="text"
				bind:value={username}
				class="w-full rounded border px-4 py-2"
				required
			/>
		</div>
		<div class="mb-5">
			<label for="password" class="text-md mb-1 block font-medium">Password</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				class="w-full rounded border px-4 py-2"
				required
			/>
		</div>
		<div class="mb-5">
			<label for="confirmPassword" class="text-md mb-1 block font-medium">Confirm Password</label>
			<input
				id="confirmPassword"
				type="password"
				bind:value={confirmPassword}
				class="w-full rounded border px-4 py-2"
				required
			/>
		</div>
		<div class="mb-6">
			<label for="email" class="mb-1 block text-sm font-medium">Email</label>
			<input
				id="email"
				type="email"
				bind:value={email}
				class="w-full rounded border px-4 py-2"
				required
			/>
		</div>
		<button type="submit" class="w-full rounded bg-gray-700 py-2 text-white hover:bg-gray-900">
			Sign Up
		</button>
	</form>
</div>
