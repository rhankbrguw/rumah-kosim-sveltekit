import { writable } from 'svelte/store';
import axios from 'axios';
import { cartCount, updateCartCount } from './cart';

export const auth = writable({
    isAuthenticated: false,
    user: null,
    token: null,
});

export function login(user, token) {
    auth.set({
        isAuthenticated: true,
        user,
        token,
    });
    localStorage.setItem('authToken', token);
    updateCartCount();
}

export function logout() {
    auth.set({ isAuthenticated: false, user: null, token: null });
    localStorage.removeItem('authToken');
    localStorage.removeItem('cartCount');
    cartCount.set(0);
}

export async function restoreAuth() {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const response = await axios.post('/api/auth/validate', { token });
            if (response.data.success) {
                auth.set({
                    isAuthenticated: true,
                    user: response.data.user,
                    token,
                });
                updateCartCount();
            } else {
                logout();
            }
        } catch {
            logout();
        }
    }
}
