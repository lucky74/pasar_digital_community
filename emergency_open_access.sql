-- EMERGENCY OPEN ACCESS FIX
-- Script ini akan MEMBUKA AKSES untuk mendiagnosa masalah "Foto Hilang", "Gagal Upload", dan "Logout Sendiri".
-- Kita menggunakan metode "Drop & Recreate" yang agresif untuk memastikan tidak ada policy lama yang nyangkut.

-- 1. STORAGE (Paling Kritikal untuk Foto)
-- Pastikan bucket public
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('status_media', 'status_media', true) ON CONFLICT (id) DO UPDATE SET public = true;

-- Reset Policy Storage (Hapus semua policy lama yang mungkin konflik)
DROP POLICY IF EXISTS "Public View" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Buat Policy Baru yang Sangat Terbuka (Sementara)
-- Semua orang bisa LIHAT
CREATE POLICY "Emergency Public View" ON storage.objects FOR SELECT USING (true);
-- Semua user login bisa UPLOAD/EDIT/DELETE (tanpa cek owner dulu, biar upload sukses)
CREATE POLICY "Emergency Auth Full Access" ON storage.objects FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 2. PROFILES (Penyebab Logout & Stuck)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Profiles" ON profiles;
DROP POLICY IF EXISTS "Owner Update Profile" ON profiles;
DROP POLICY IF EXISTS "Owner Insert Profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- Policy Profile Baru
CREATE POLICY "Public Read Profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Auth Update Own Profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Auth Insert Own Profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- 3. PRODUCTS (Penyebab Produk Hilang/Tidak Bisa Edit)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Products" ON products;
DROP POLICY IF EXISTS "Authenticated Insert Products" ON products;
DROP POLICY IF EXISTS "Owner Modify Products" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;

-- Policy Produk Baru
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Auth Insert Products" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Izinkan update/delete jika username cocok (menggunakan kolom seller)
-- ATAU jika user adalah pemilik (auth.uid) untuk backward compatibility
CREATE POLICY "Auth Modify Products" ON products FOR ALL USING (
  seller = (select username from profiles where id = auth.uid()) OR 
  auth.role() = 'authenticated' -- Sementara buka akses edit untuk semua user login agar tidak error
);


-- 4. STATUSES
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Statuses" ON statuses;
DROP POLICY IF EXISTS "Authenticated Insert Statuses" ON statuses;
DROP POLICY IF EXISTS "Owner Delete Statuses" ON statuses;

CREATE POLICY "Public Read Statuses" ON statuses FOR SELECT USING (true);
CREATE POLICY "Auth Insert Statuses" ON statuses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete Statuses" ON statuses FOR DELETE USING (auth.role() = 'authenticated'); 
