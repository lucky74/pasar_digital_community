-- 1. Buat bucket 'products' jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Catatan: Kita TIDAK perlu menjalankan 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;' 
-- karena itu sudah aktif secara default dan hanya bisa diubah oleh admin sistem.

-- 2. Hapus policy lama jika ada (untuk reset agar tidak duplikat)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;

-- 3. Buat Policy BARU

-- Izin LIHAT gambar untuk semua orang (Public)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- Izin UPLOAD hanya untuk user login
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'products' );

-- Izin HAPUS hanya untuk pemilik gambar
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'products' AND auth.uid() = owner );

-- Izin UPDATE (Edit) hanya untuk pemilik gambar
CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'products' AND auth.uid() = owner );
