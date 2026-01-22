-- Script untuk memperbaiki masalah "Ulasan tidak terlihat oleh pengguna lain"
-- Jalankan script ini di Supabase Dashboard -> SQL Editor

-- 1. Pastikan RLS aktif (Standard Security)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 2. Hapus policy lama jika ada (agar tidak bentrok)
DROP POLICY IF EXISTS "Enable read access for all users" ON reviews;
DROP POLICY IF EXISTS "Enable insert for all users" ON reviews;

-- 3. Buat Policy: Semua orang BOLEH MELIHAT ulasan
CREATE POLICY "Enable read access for all users" 
ON reviews FOR SELECT 
USING (true);

-- 4. Buat Policy: Semua orang BOLEH MENULIS ulasan
CREATE POLICY "Enable insert for all users" 
ON reviews FOR INSERT 
WITH CHECK (true);

-- Penjelasan:
-- Karena aplikasi ini menggunakan Login sederhana (bukan Supabase Auth Email/Pass),
-- Database perlu diizinkan menerima data dari aplikasi (Role 'anon').
-- Validasi user sudah dilakukan di sisi Aplikasi (React).
