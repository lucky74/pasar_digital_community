-- FIX UPLOAD PERMISSIONS (INSERT) FOR STORAGE
-- Masalah "Gagal Upload" biasanya karena user tidak diizinkan INSERT ke bucket

-- 1. PASTIKAN BUCKET 'products' ADA
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('status_media', 'status_media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. BUKA IZIN UPLOAD (INSERT) UNTUK SEMUA USER YANG LOGIN
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND 
    (bucket_id = 'products' OR bucket_id = 'status_media' OR bucket_id = 'avatars' OR bucket_id = 'chat_images')
);

-- 3. BUKA IZIN UPDATE (GANTI GAMBAR)
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

-- 4. BUKA IZIN DELETE (HAPUS GAMBAR)
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (auth.uid() = owner);

-- 5. PASTIKAN PRODUK BISA DITAMBAH (INSERT KE TABLE)
DROP POLICY IF EXISTS "Users can create products" ON products;
CREATE POLICY "Users can create products" 
ON products FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 6. PASTIKAN PROFIL BISA DI-UPDATE (PENTING AGAR TIDAK LOGOUT TERUS)
-- Jika aplikasi gagal update "last_seen" atau data profil, kadang dianggap error sesi
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 7. SOLUSI DATA KOSONG (Jaga-jaga RLS Select masih nyangkut)
DROP POLICY IF EXISTS "Public products view" ON products;
CREATE POLICY "Public products view" ON products FOR SELECT USING (true);
