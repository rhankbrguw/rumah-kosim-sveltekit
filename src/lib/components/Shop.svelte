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

<section class="mt-16 p-4 sm:mt-20 sm:p-24 sm:px-4 sm:py-4">
	<!-- Search input -->
	<div class="relative mb-4 sm:mb-6">
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
	<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-1 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
		{#each filteredBooks as book}
			<div
				class="flex h-full flex-col rounded-lg border p-2 shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl sm:p-4"
			>
				<div class="mb-2 aspect-[3/4] w-full sm:mb-4 sm:h-64">
					<img
						src={book.image}
						alt={book.title}
						class="h-full w-full rounded-md object-contain transition-transform duration-300 hover:scale-110 sm:object-cover"
						on:error={(e) => (e.target.src = '/images/placeholder.jpg')}
						loading="lazy"
					/>
				</div>
				<div class="flex flex-1 flex-col">
					<div class="flex-1">
						<h3 class="line-clamp-2 text-sm font-bold sm:text-lg">{book.title}</h3>
						<p class="text-sm text-red-500 sm:text-base">{formatRupiah(book.price)}</p>
						<p class="mt-1 line-clamp-2 text-xs text-gray-600 sm:mt-2 sm:text-sm">
							{book.description}
						</p>
					</div>

					<!-- Different button styles for mobile and desktop -->
					<div class="mt-2 sm:mt-4">
						<button
							class="hidden text-blue-500 hover:underline sm:block"
							on:click={() => goToProduct(book.id)}
						>
							Show More...
						</button>
						<button
							class="w-full rounded-md bg-amber-400 px-2 py-1.5 text-xs text-white sm:hidden"
							on:click={() => goToProduct(book.id)}
						>
							Show More
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>
