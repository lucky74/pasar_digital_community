-- PENTING: Jalankan ini agar Chat Masuk Otomatis (Realtime)

-- 1. Tambahkan tabel messages ke publikasi Realtime
-- Ini yang bikin chat muncul otomatis tanpa refresh
alter publication supabase_realtime add table messages;

-- 2. Pastikan Policy mengizinkan semua orang (anon) untuk Realtime
-- Kita buat Policy yang sangat longgar agar tidak ada yang terblokir
drop policy if exists "Enable access to all users" on messages;
create policy "Enable access to all users" on messages for all using (true) with check (true);