<script>
	import AddressForm from '$lib/components/AddressForm.svelte';

	function handleSuccess() {
		console.log('Address saved successfully');
	}
</script>

<AddressForm onSubmitSuccess={handleSuccess} />
