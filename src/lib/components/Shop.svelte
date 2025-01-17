<script>
	import { goto } from '$app/navigation';
	import { Search } from 'lucide-svelte';

	export let books = [];
	let searchTerm = '';

	function formatRupiah(price) {
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
	}

	function goToProduct(id) {
		goto(`/client/products/${id}`);
	}

	$: filteredBooks = books.filter(
		(book) =>
			book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			book.description.toLowerCase().includes(searchTerm.toLowerCase())
	);
</script>

<section class="mt-20 p-24 px-4 py-4">
	<!-- Search input -->
	<div class="relative mb-6">
		<div class="relative">
			<input
				type="text"
				class="w-full rounded-[4px] border border-gray-200 py-2 pl-10 pr-4 md:w-64"
				placeholder="Search books..."
				bind:value={searchTerm}
			/>
			<div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
				<Search size={20} />
			</div>
		</div>
	</div>

	<!-- Books grid -->
	<div class="mb-6 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each filteredBooks as book}
			<div
				class="flex flex-col rounded-lg border p-4 shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl"
			>
				<img
					src={book.image}
					alt={book.title}
					class="mb-4 h-64 w-full rounded-md object-cover transition-transform duration-300 hover:scale-110"
					on:error={(e) => (e.target.src = '/images/placeholder.jpg')}
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
	</div>
</section>
