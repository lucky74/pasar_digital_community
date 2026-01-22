-- FIX PERMISSION UPLOAD & PROFIL
-- Jalankan script ini di SQL Editor Supabase untuk mengatasi "Gagal Upload"

-- 1. Izin Storage (Bucket 'avatars')
-- Mengizinkan siapa saja (public) untuk upload, update, dan lihat file di bucket avatars
BEGIN;
  -- Hapus policy lama jika ada (untuk menghindari duplikat)
  DROP POLICY IF EXISTS "Public Upload Avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Public Update Avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Public Select Avatars" ON storage.objects;
  
  -- Buat Policy Baru
  CREATE POLICY "Public Upload Avatars" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' );
  CREATE POLICY "Public Update Avatars" ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' );
  CREATE POLICY "Public Select Avatars" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
COMMIT;

-- 2. Izin Tabel Profiles
-- Mengizinkan aplikasi (tanpa login Supabase Auth) untuk menyimpan data profil
BEGIN;
  -- Hapus policy lama yang mungkin membatasi berdasarkan auth.uid()
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Allow public insert profiles" ON profiles;
  DROP POLICY IF EXISTS "Allow public update profiles" ON profiles;

  -- Buat Policy Baru yang lebih longgar (karena kita pakai login custom)
  CREATE POLICY "Allow public insert profiles" ON profiles FOR INSERT WITH CHECK (true);
  CREATE POLICY "Allow public update profiles" ON profiles FOR UPDATE USING (true);
COMMIT;
