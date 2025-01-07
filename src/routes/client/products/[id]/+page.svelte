<script>
	import ProductDetail from '$lib/components/ProductDetail.svelte';
	import { onMount } from 'svelte';
	import axios from 'axios';

	export let data;
	let product = null;
	let isLoading = true;

	const id = data.id;

	async function fetchProduct() {
		try {
			const response = await axios.get(`/api/product`, {
				params: { id },
			});
			if (response.status === 200) {
				product = response.data;
			} else {
				console.error('Failed to fetch product:', response.statusText);
			}
		} catch (error) {
			console.error('Error fetching product:', error.message);
		} finally {
			isLoading = false;
		}
	}

	onMount(fetchProduct);
</script>

{#if isLoading}
	<div class="flex min-h-[400px] items-center justify-center">
		<p>Loading...</p>
	</div>
{:else if product}
	<ProductDetail {product} />
{:else}
	<div class="flex min-h-[400px] items-center justify-center">
		<p>Product not found</p>
	</div>
{/if}
