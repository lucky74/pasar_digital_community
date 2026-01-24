-- Script ini hanya untuk mengecek data, tidak mengubah apa-apa.
-- Jalankan ini di SQL Editor dan lihat hasilnya di tabel "Results".
-- Jika kolom sold_count muncul dengan angka, berarti database aman.

SELECT id, name, sold_count FROM products ORDER BY created_at DESC LIMIT 10;
