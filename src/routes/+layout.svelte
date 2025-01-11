<script>
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import { restoreAuth } from '$lib/stores/auth.js';

	if (typeof window !== 'undefined') {
		restoreAuth().catch((err) => {
			console.error('Error during auth restoration:', err.message);
		});
	}

	export async function load() {
		if (browser) {
			await restoreAuth();
		}
		return {};
	}
</script>

<main>
	<Header />
	<slot />
</main>

<style>
	main {
		background-color: white;
	}
</style>
