-- EMERGENCY FIX: RESTORE DATA VISIBILITY
-- Script ini membuka kunci database agar data Produk, Status, dan Profil bisa dilihat kembali.

-- 1. PASTIKAN PRODUK BISA DILIHAT SEMUA ORANG
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan lama yang mungkin salah
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Anyone can view products" ON products;

-- Buat kebijakan baru: SEMUA orang (login atau tidak) bisa LIHAT produk
CREATE POLICY "Public products are viewable by everyone" 
ON products FOR SELECT 
USING (true);

-- 2. PASTIKAN STATUS BISA DILIHAT SEMUA ORANG
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public statuses are viewable by everyone" ON statuses;

CREATE POLICY "Public statuses are viewable by everyone" 
ON statuses FOR SELECT 
USING (true);

-- 3. PASTIKAN PROFIL BISA DILIHAT (Penting untuk Foto & Nama)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- 4. PASTIKAN GROUP BISA DILIHAT
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON groups;

CREATE POLICY "Public groups are viewable by everyone" 
ON groups FOR SELECT 
USING (true);

-- 5. PASTIKAN FOTO (STORAGE) BISA DILIHAT
-- Ini membuka akses baca untuk semua bucket gambar yang digunakan
DROP POLICY IF EXISTS "Public images are viewable by everyone" ON storage.objects;

CREATE POLICY "Public images are viewable by everyone"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('products', 'avatars', 'status_media', 'chat_images', 'group_icons') );
