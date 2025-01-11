<script>
	import SignupForm from '$lib/components/SignupForm.svelte';
	import axios from 'axios';

	async function handleSignup(event) {
		const { username, password, email } = event.detail;

		try {
			const response = await axios.post('/api/auth/register', {
				username,
				password,
				email
			});

			if (response.data.success) {
				alert('Registration successful! Please log in to continue.');
				console.log('JWT Token:', response.data.token);

				// Redirect to login page
				window.location.href = '/client/login';
			} else {
				alert(`Error: ${response.data.error || 'Registration failed'}`);
			}
		} catch (error) {
			// Log detailed error for debugging
			console.error('Signup error:', error.response?.data || error.message);

			// Display user-friendly message
			alert(
				error.response?.data?.error || 'Failed to register. Please check your details and try again.'
			);
		}
	}
</script>

<SignupForm on:signup={handleSignup} />