// src/hooks.server.js
import { DATABASE_URL } from '$env/static/private';

console.log('--- MEMERIKSA KONFIGURASI SERVER SAAT STARTUP ---');
console.log('Nilai DATABASE_URL adalah:', DATABASE_URL);
console.log('Tipe dari DATABASE_URL adalah:', typeof DATABASE_URL);
console.log('--------------------------------------------------');

// Anda tidak perlu menambahkan apa-apa lagi di sini untuk sekarang.
// File ini akan dieksekusi sekali saat server menyala.