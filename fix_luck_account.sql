-- SQL Script untuk Mengatasi Masalah Akun Ganda (Luck vs Lucky)
-- Jalankan script ini di Supabase SQL Editor

-- 1. Pindahkan kepemilikan Grup dari 'Luck' ke 'Lucky'
-- Ini akan memperbaiki tombol delete yang hilang di grup yang dibuat oleh 'Luck'
UPDATE public.groups
SET created_by = 'Lucky'
WHERE created_by = 'Luck';

-- 2. Pindahkan pesan-pesan grup dari 'Luck' ke 'Lucky'
UPDATE public.group_messages
SET sender = 'Lucky'
WHERE sender = 'Luck';

-- 3. Hapus profil 'Luck' jika ada (supaya tidak muncul lagi sebagai akun ganda)
-- Pastikan Anda sudah login sebagai 'Lucky' dan profil 'Lucky' sudah ada.
DELETE FROM public.profiles
WHERE username = 'Luck';

-- 4. Opsional: Update pesan chat pribadi (jika ada)
UPDATE public.messages
SET sender = 'Lucky'
WHERE sender = 'Luck';

UPDATE public.messages
SET receiver = 'Lucky'
WHERE receiver = 'Luck';
