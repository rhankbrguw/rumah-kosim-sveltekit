<script>
	import imageSrc from '$lib/assets/image/banner-4.png';

	export let title = 'What is RumahKosimBook?';
	export let description = [
		`RumahKosimBook is a cozy and vibrant bookstore located in the heart of Jakarta. Established with a passion for literature and learning, RumahKosimBook offers a wide selection of books ranging from fiction, non-fiction, educational resources, to rare and collectible editions.`,
		`Our mission is to inspire a love for reading and provide a welcoming space where book enthusiasts can explore, discover, and immerse themselves in the world of knowledge and imagination. Whether you're looking for the latest bestseller, a classic novel, or a special gift for a fellow book lover, RumahKosimBook has something for everyone.`
	];
</script>

<section
	class="flex flex-col items-center gap-4 rounded-lg border border-blue-300 bg-stone-200 px-4 py-8 sm:gap-6 sm:px-6 sm:py-12 lg:w-full lg:flex-row lg:items-start lg:gap-8 lg:px-8 lg:py-16"
>
	<img
		src={imageSrc}
		alt="A banner showcasing RumahKosimBook, a cozy bookstore in Jakarta"
		class="w-full rounded-lg object-cover shadow-xl lg:w-1/2 xl:w-3/5"
	/>

	<div class="w-full lg:w-1/2">
		<h2 class="mb-4 text-2xl font-bold text-yellow-900 sm:mb-6 sm:text-3xl">
			{title}
		</h2>

		{#each description as paragraph}
			<p class="mt-4 text-base leading-relaxed text-zinc-600 sm:mt-6 sm:text-lg">
				{paragraph}
			</p>
		{/each}
	</div>
</section>
