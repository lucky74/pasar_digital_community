-- 1. Buat Bucket 'products' (Public)
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- 2. Buat Policy agar semua orang bisa melihat gambar (SELECT)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'products' );

-- 3. Buat Policy agar user yang login bisa upload (INSERT)
create policy "Authenticated Users Can Upload"
  on storage.objects for insert
  with check ( bucket_id = 'products' and auth.role() = 'authenticated' );