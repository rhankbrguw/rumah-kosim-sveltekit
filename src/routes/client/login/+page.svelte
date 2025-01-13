<script>
  import LoginForm from '$lib/components/LoginForm.svelte';
  import { login } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import axios from 'axios';

  async function handleLogin(event) {
    const { username, password } = event.detail;

    try {
      const response = await axios.post('/api/auth/login', { username, password });

      if (response.data.success) {
        const { token, user } = response.data;
        login(user, token);
        localStorage.setItem('authToken', token);

        alert('Login successful!');
        user.role === 'admin' ? goto('/') : goto('/');

      } else {
        alert(response.data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      alert('Wrong Username or Password! Please try again later!');
    }
  }
</script>

<LoginForm on:login={handleLogin} />
