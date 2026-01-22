-- SQL: TAMBAHKAN KOLOM PASSWORD KE TABEL PROFILES
-- Jalankan script ini di SQL Editor Supabase untuk mengaktifkan fitur keamanan password

-- 1. Tambahkan kolom password (jika belum ada)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password text;

-- 2. Pastikan tabel profiles bisa dibaca semua orang (untuk pengecekan login)
-- Hapus policy lama agar bersih
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;

-- Buat policy baru: Siapa saja boleh BACA data profil (untuk cek apakah email terdaftar)
CREATE POLICY "Allow public read profiles" 
ON public.profiles FOR SELECT USING (true);

-- 3. (Opsional) Jika ingin data password tidak bisa dibaca sembarangan, 
-- idealnya RLS dibatasi. Tapi karena kita login di client-side (Prototype),
-- kita butuh akses SELECT password untuk mencocokkan input user.
-- PERINGATAN: Ini tidak standar industri (harusnya hash di server), 
-- tapi cukup untuk kebutuhan prototype "Trust System + PIN".
