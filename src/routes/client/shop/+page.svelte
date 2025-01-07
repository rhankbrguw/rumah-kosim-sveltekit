<script>
	import Shop from '$lib/components/Shop.svelte';
	import axios from 'axios';

	let books = [];

	async function fetchBooks() {
		try {
			const response = await axios.get('/api/books');
			if (response.status === 200) {
				books = response.data;
			} else {
				console.error('Failed to fetch books:', response.statusText);
			}
		} catch (error) {
			console.error('Error fetching books:', error.message);
		}
	}

	fetchBooks();
</script>

<Shop {books} />
