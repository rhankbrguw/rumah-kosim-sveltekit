<script>
	import { createEventDispatcher } from 'svelte';
	import { StarIcon } from 'lucide-svelte';

	export let product = null;
	export let isOpen = false;

	let rating = 0;
	let comment = '';
	let loading = false;
	let error = null;

	const dispatch = createEventDispatcher();

	function close() {
		rating = 5;
		comment = '';
		error = null;
		dispatch('close');
	}

	async function handleSubmit() {
		if (loading) return;
		if (!comment.trim()) {
			error = 'Please enter a comment';
			return;
		}

		loading = true;
		error = null;

		try {
			// Updated validation
			console.log('Product data:', product); // Add this for debugging
			if (!product || !product.orderId || !product.id) {
				error = 'Product data is missing';
				console.error('Missing product data:', product); // Add this for debugging
				return;
			}

			dispatch('submit', {
				orderId: product.orderId,
				productId: product.id,
				rating,
				comment: comment.trim()
			});
		} catch (err) {
			error = err.message || 'Failed to submit review';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && !loading) {
			close();
		}
	}

	function handleOutsideClick(event) {
		if (event.target === event.currentTarget && !loading) {
			close();
		}
	}

	$: if (comment) error = null;
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
		on:click={handleOutsideClick}
		on:keydown={handleKeydown}
	>
		<div
			class="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
			role="dialog"
			aria-modal="true"
		>
			<h3 class="text-xl font-semibold text-stone-800">
				Review {product?.title || 'Loading...'}
			</h3>

			{#if error}
				<div class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
					{error}
				</div>
			{/if}

			<div class="mt-6">
				<label class="block text-sm font-medium text-stone-700"> Rating </label>
				<div class="mt-2 flex gap-2">
					{#each Array(5) as _, i}
						<button
							type="button"
							class="focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
							on:click={() => (rating = i + 1)}
						>
							<StarIcon size={24} class={i < rating ? 'text-amber-400' : 'text-stone-300'} />
						</button>
					{/each}
				</div>
			</div>

			<div class="mt-4">
				<label for="comment" class="block text-sm font-medium text-stone-700"> Comment </label>
				<textarea
					id="comment"
					bind:value={comment}
					class="mt-2 w-full rounded-lg border border-stone-200 p-3 text-stone-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400"
					rows="4"
					placeholder="Share your thoughts about this product..."
					disabled={loading}
				></textarea>
			</div>

			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					on:click={close}
					disabled={loading}
					class="rounded-lg bg-stone-100 px-4 py-2 text-stone-700 hover:bg-stone-200 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					on:click={handleSubmit}
					disabled={loading}
					class="rounded-lg bg-amber-400 px-4 py-2 text-white hover:bg-amber-500 disabled:opacity-50"
				>
					{loading ? 'Submitting...' : 'Submit Review'}
				</button>
			</div>
		</div>
	</div>
{/if}
