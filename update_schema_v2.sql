-- 1. Tambahkan kolom kategori ke tabel products
ALTER TABLE products ADD COLUMN IF NOT EXISTS category text DEFAULT 'Lain-lain';

-- 2. Buat tabel profiles untuk menyimpan foto profil user
CREATE TABLE IF NOT EXISTS profiles (
  username text PRIMARY KEY,
  avatar_url text,
  email text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Aktifkan RLS untuk profiles (Bolehkan semua orang baca/tulis untuk prototype ini)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (true);

-- 4. Setup Storage Bucket untuk Avatar (Jika belum ada, user harus buat manual di dashboard biasanya, tapi kita coba via SQL jika extension aktif)
-- Note: Biasanya bucket dibuat via Dashboard Supabase > Storage > New Bucket "avatars" > Public
-- Kita hanya bisa set policy via SQL jika bucket sudah ada.

-- Policy agar avatar bisa dilihat publik
-- (Asumsi bucket 'avatars' sudah dibuat via Dashboard)
-- CREATE POLICY "Avatar images are publicly accessible"
-- ON storage.objects FOR SELECT
-- USING ( bucket_id = 'avatars' );

-- CREATE POLICY "Anyone can upload an avatar"
-- ON storage.objects FOR INSERT
-- WITH CHECK ( bucket_id = 'avatars' );
