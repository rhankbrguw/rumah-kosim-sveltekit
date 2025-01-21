<script>
	import { createEventDispatcher } from 'svelte';

	let username = '';
	let password = '';
	let error = '';
	const dispatch = createEventDispatcher();

	function handleSubmit(event) {
		event.preventDefault();

		if (!username || !password) {
			error = 'Both fields are required!';
			return;
		}

		error = '';
		dispatch('login', { username, password });
	}
</script>

<div class="flex min-h-screen w-full items-start justify-center px-4 pt-20 md:pt-32 lg:pt-40">
	<div class="w-full max-w-sm rounded bg-white px-8 py-16 shadow-md sm:pt-4 md:max-w-md md:pt-4">
		<h2 class="mb-6 text-2xl font-bold">Login</h2>
		<form on:submit={handleSubmit}>
			{#if error}
				<p class="mb-4 text-red-500">{error}</p>
			{/if}
			<div class="mb-5">
				<label for="username" class="mb-1 block font-medium text-gray-700">Username</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					class="w-full rounded border px-4 py-2"
					required
				/>
			</div>
			<div class="mb-6">
				<label for="password" class="mb-1 block font-medium text-gray-700">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					class="w-full rounded border px-4 py-2"
					required
				/>
			</div>
			<button type="submit" class="w-full rounded bg-gray-700 py-2 text-white hover:bg-gray-900">
				Login
			</button>
		</form>
	</div>
</div>
