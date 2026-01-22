-- Script Tambahan: Menambahkan kolom Rating di tabel Produk
-- Jalankan ini agar Bintang Rating muncul di halaman depan

-- 1. Tambah kolom 'rating' (untuk menyimpan rata-rata bintang)
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating float DEFAULT 0;

-- 2. Tambah kolom 'review_count' (untuk menyimpan jumlah ulasan)
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count int DEFAULT 0;

-- 3. (Opsional) Update data lama agar tidak null
UPDATE products SET rating = 0 WHERE rating IS NULL;
UPDATE products SET review_count = 0 WHERE review_count IS NULL;
