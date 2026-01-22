-- SALIN SEMUA KODE INI KE SQL EDITOR SUPABASE DAN KLIK 'RUN'

-- 1. IZINKAN HAPUS PRODUK (DELETE)
-- Kita izinkan delete untuk tabel products
drop policy if exists "Enable delete for all users" on public.products;
create policy "Enable delete for all users" on public.products for delete using (true);

-- 2. PERBAIKI UPLOAD GAMBAR (FIX RLS ERROR)
-- Kita izinkan upload/update/delete untuk semua orang di bucket 'products'
-- (Karena sistem login kita menggunakan custom local storage, bukan Supabase Auth asli)

drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Users Can Upload" on storage.objects;
drop policy if exists "Allow All Access" on storage.objects;

-- Policy sapu jagat untuk bucket products: Boleh ngapain aja (Upload/Lihat/Hapus)
create policy "Allow All Access"
  on storage.objects for all
  using ( bucket_id = 'products' )
  with check ( bucket_id = 'products' );

-- Pastikan bucket public
update storage.buckets set public = true where id = 'products';
