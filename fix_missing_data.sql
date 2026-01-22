-- PERBAIKAN TOTAL (JALANKAN INI AGAR TIDAK ADA YANG HILANG LAGI)
-- Ini akan membuka semua izin akses agar data tersimpan permanen

-- 1. Reset Izin Tabel Produk (Bisa Tambah, Hapus, Edit, Lihat)
drop policy if exists "Enable read access for all users" on public.products;
drop policy if exists "Enable insert access for all users" on public.products;
drop policy if exists "Enable delete for all users" on public.products;
drop policy if exists "Enable all for products" on public.products;

create policy "Enable all for products" on public.products for all using (true) with check (true);

-- 2. Reset Izin Tabel Pesan (Chat Lancar)
drop policy if exists "Enable access to all users" on public.messages;
drop policy if exists "Enable all for messages" on public.messages;

create policy "Enable all for messages" on public.messages for all using (true) with check (true);

-- 3. Reset Izin Upload Gambar (Anti Gagal)
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Users Can Upload" on storage.objects;
drop policy if exists "Authenticated Users Can Update Own Images" on storage.objects;
drop policy if exists "Allow All Access" on storage.objects;

create policy "Allow All Access" on storage.objects for all using ( bucket_id = 'products' ) with check ( bucket_id = 'products' );

-- Pastikan bucket public
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict (id) do update set public = true;
