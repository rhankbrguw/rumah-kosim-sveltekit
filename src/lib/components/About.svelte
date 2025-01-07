<script>
	import imageSrc from '$lib/assets/image/banner-4.png';

	export let title = 'What is RumahKosimBook?';
	export let description = [
		`RumahKosimBook is a cozy and vibrant bookstore located in the heart of Jakarta. Established with a passion for literature and learning, RumahKosimBook offers a wide selection of books ranging from fiction, non-fiction, educational resources, to rare and collectible editions.`,
		`Our mission is to inspire a love for reading and provide a welcoming space where book enthusiasts can explore, discover, and immerse themselves in the world of knowledge and imagination. Whether you’re looking for the latest bestseller, a classic novel, or a special gift for a fellow book lover, RumahKosimBook has something for everyone.`
	];
</script>

<section
	class="flex flex-col items-center gap-8 rounded-lg border border-blue-300 bg-stone-200 px-8 py-16 lg:flex-row lg:items-start"
>
	<img 
		src={imageSrc} 
		alt="A banner showcasing RumahKosimBook, a cozy bookstore in Jakarta" 
		class="w-full rounded-lg shadow-xl lg:w-1/2 xl:w-3/4" 
	/>

	<div class="lg:w-1/2">
		<h2 class="text-black-800 mb-6 text-3xl font-bold text-yellow-900">
			{title}
		</h2>

		{#each description as paragraph}
			<p class="mt-6 text-lg leading-relaxed text-zinc-600">
				{paragraph}
			</p>
		{/each}
	</div>
</section>
