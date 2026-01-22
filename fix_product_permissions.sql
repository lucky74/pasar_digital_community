-- FIX: IZINKAN HAPUS & EDIT PRODUK
-- Masalah: Pedagang tidak bisa menghapus produk karena diblokir keamanan database (RLS).
-- Solusi: Jalankan script ini untuk membuka akses Hapus & Edit.

-- 1. Pastikan RLS Aktif
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Hapus Policy Lama (Agar tidak bentrok)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.products;
DROP POLICY IF EXISTS "Enable update for all users" ON public.products;

-- 3. Buat Policy Baru (Izinkan Semua Aksi)
-- SELECT (Lihat)
CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);

-- INSERT (Tambah)
CREATE POLICY "Enable insert access for all users" ON public.products FOR INSERT WITH CHECK (true);

-- UPDATE (Edit)
CREATE POLICY "Enable update for all users" ON public.products FOR UPDATE USING (true);

-- DELETE (Hapus)
CREATE POLICY "Enable delete for all users" ON public.products FOR DELETE USING (true);

-- 4. Fix Storage (Opsional, jaga-jaga kalau mau hapus gambar juga)
-- Pastikan bucket 'products' public
UPDATE storage.buckets SET public = true WHERE id = 'products';

-- Reset policy storage
DROP POLICY IF EXISTS "Allow All Access" ON storage.objects;
CREATE POLICY "Allow All Access"
ON storage.objects FOR ALL
USING ( bucket_id = 'products' )
WITH CHECK ( bucket_id = 'products' );
