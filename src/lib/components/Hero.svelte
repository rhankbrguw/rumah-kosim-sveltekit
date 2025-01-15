<script>
	import { Search } from 'lucide-svelte';
</script>

<section class="flex h-screen flex-col items-center justify-center pt-8 text-center">
	<div class="z-50">
		<h1 class="z-[100] text-3xl font-bold text-stone-300">
			Books are the windows to the world, and <br />
			<span class="text-yellow-600">RumahKosimBook</span> is the door that invites you in.
		</h1>
		<p class="mt-6 text-stone-400">
			Discover your favorite stories and treasures at RumahKosimBook—
		</p>
		<a
			href="/client/shop"
			class="mt-6 inline-flex items-center gap-2 rounded bg-yellow-500 px-8 py-2 text-center text-white hover:bg-yellow-600"
		>
			Explore Us
			<Search size={20} />
		</a>
	</div>
	<div class="bg-img absolute top-0 z-10 h-screen w-screen max-w-full bg-center bg-no-repeat"></div>
</section>
<div
	class="absolute top-0 z-10 h-screen w-screen max-w-full bg-center bg-no-repeat backdrop-blur-sm"
></div>

<style>
	.bg-img {
		background-image: url(../assets/image/bg-ruko.png);
	}
</style>
