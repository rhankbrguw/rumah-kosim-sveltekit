<script>
	import { goto } from '$app/navigation';

	export let books = [];

	function formatRupiah(price) {
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
	}

	function goToProduct(id) {
		goto(`/client/products/${id}`);
	}
</script>

<section class="grid grid-cols-1 gap-8 p-24 px-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
	{#each books as book}
		<div
			class="flex flex-col rounded-lg border p-4 shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl"
		>
			<img
				src={book.image}
				alt={book.title}
				class="mb-4 h-64 w-full rounded-md object-cover transition-transform duration-300 hover:scale-110"
				on:error={(e) => (e.target.src = '/fallback-image.jpg')}
				loading="lazy"
			/>
			<h3 class="text-lg font-bold">{book.title}</h3>
			<p class="text-red-500">{formatRupiah(book.price)}</p>
			<p class="mt-2 text-sm text-gray-600">{book.description.slice(0, 50)}...</p>
			<button class="mt-2 text-blue-500 hover:underline" on:click={() => goToProduct(book.id)}>
				Show More
			</button>
		</div>
	{/each}
</section>
