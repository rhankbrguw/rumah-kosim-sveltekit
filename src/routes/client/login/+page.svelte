<script>
  import axios from 'axios';
  import LoginForm from '$lib/components/LoginForm.svelte';
  import { login } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  function handleLogin(event) {
    const { username, password } = event.detail;

    axios.post('/api/auth/login', { username, password })
      .then(response => {
        if (response.data.success) {
          const { token } = response.data;
          login({ username }, token);
          localStorage.setItem('authToken', token);
          
          alert('Login successful!');

          // Redirect
          goto('/');
        } else {
       
          alert(response.data.error || 'Login failed');
        }
      })
      .catch(err => {
        console.error('Login error:', err.response?.data || err.message);

        alert('Wrong Username or Password! Please try again later!');
      });
  }
</script>

<LoginForm on:login={handleLogin} />
