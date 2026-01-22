-- SQL: FIX COLUMN CREATED_AT & PASSWORD VISIBILITY
-- Jalankan script ini untuk memperbaiki error saat registrasi

-- 1. Tambahkan kolom created_at ke tabel profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. Pastikan kolom password ada (jika script sebelumnya belum dijalankan)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password text;
