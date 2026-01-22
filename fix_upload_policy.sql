-- 1. HAPUS policy lama yang ketat (butuh login resmi)
drop policy if exists "Authenticated Users Can Upload" on storage.objects;
drop policy if exists "Public Access" on storage.objects;

-- 2. Buat Policy BARU: Izinkan SIAPAPUN (termasuk user demo) untuk Upload
create policy "Allow Public Upload"
on storage.objects for insert
with check ( bucket_id = 'products' );

-- 3. Izinkan SIAPAPUN untuk melihat gambar
create policy "Allow Public Select"
on storage.objects for select
using ( bucket_id = 'products' );