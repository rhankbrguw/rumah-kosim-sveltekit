import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import axios from 'axios';
import { cartCount, updateCartCount } from './cart';

export const auth = writable({
    isAuthenticated: false,
    user: null,
    token: null,
    isAdmin: false
});

let authInitialized = false;

export function login(user, token) {
    auth.set({
        isAuthenticated: true,
        user,
        token,
        isAdmin: user.role === 'admin'
    });
    if (browser) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('isAdmin', (user.role === 'admin').toString());
        updateCartCount();
    }
}

export function logout() {
    auth.set({ isAuthenticated: false, user: null, token: null, isAdmin: false });
    if (browser) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('cartCount');
        cartCount.set(0);
        goto('/client/login');
    }
}

export async function validateToken(token) {
    try {
        const response = await axios.post('/api/auth/validate', { token });
        return response.data.success ? response.data.user : null;
    } catch {
        return null;
    }
}

export async function restoreAuth() {
    if (!browser || authInitialized) return;
    
    authInitialized = true;
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        if (window.location.pathname.startsWith('/admin')) {
            goto('/client/login');
        }
        return;
    }

    const user = await validateToken(token);
    if (user) {
        login(user, token);
        if (!user.role === 'admin' && window.location.pathname.startsWith('/admin')) {
            goto('/');
        }
    } else {
        logout();
    }
}
