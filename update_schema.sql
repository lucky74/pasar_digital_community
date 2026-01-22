-- UPDATE SCHEMA: Tambahkan kolom penerima pesan
-- Salin kode ini ke SQL Editor Supabase dan RUN

-- 1. Tambahkan kolom receiver (penerima) ke tabel messages
alter table public.messages add column if not exists receiver text;

-- 2. Hapus pesan lama yang 'ngaco' (tanpa penerima) agar bersih
truncate table public.messages;

-- 3. Pastikan RLS tetap aktif (opsional, untuk memastikan)
alter table public.messages enable row level security;
