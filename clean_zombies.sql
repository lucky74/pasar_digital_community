-- =================================================================
-- SCRIPT PEMBERSIH SUPER (CLEAN ZOMBIE ACCOUNTS)
-- =================================================================
-- Cara Pakai:
-- 1. Buka Dashboard Supabase Anda (https://supabase.com/dashboard)
-- 2. Masuk ke Menu "SQL Editor" (ikon terminal di kiri)
-- 3. Klik "New Query"
-- 4. Copy-Paste semua kode di bawah ini
-- 5. Klik "Run" (Tombol Hijau)
-- =================================================================

-- 1. HAPUS GRUP "PELANGGAN" (Dan anggotanya)
DELETE FROM public.group_messages
WHERE group_id IN (SELECT id FROM public.groups WHERE name = 'Pelanggan');

DELETE FROM public.group_members
WHERE group_id IN (SELECT id FROM public.groups WHERE name = 'Pelanggan');

DELETE FROM public.groups 
WHERE name = 'Pelanggan';

-- 2. HAPUS AKUN "LUCK" & "MUHANALCKY" (PEMBASMIAN TOTAL)
-- Menghapus dari tabel public.profiles (Data user yang terlihat di aplikasi)
DELETE FROM public.profiles 
WHERE username IN ('Luck', 'muhanalcky');

-- 3. HAPUS AKUN "LUCKY" (RESET TOTAL - SEPERTI PERMINTAAN)
-- PERINGATAN: Ini akan menghapus akun Lucky juga.
DELETE FROM public.profiles 
WHERE username = 'Lucky';

-- 4. BERSIH-BERSIH DATA YATIM PIATU (ZOMBIE)
-- Hapus produk yang penjualnya sudah tidak ada di profiles
DELETE FROM public.products
WHERE seller NOT IN (SELECT username FROM public.profiles);

-- Hapus pesan chat yang pengirim/penerimanya sudah musnah
DELETE FROM public.messages
WHERE sender NOT IN (SELECT username FROM public.profiles)
   OR receiver NOT IN (SELECT username FROM public.profiles);

-- Hapus data wishlist yang pemiliknya sudah tidak ada
DELETE FROM public.wishlists
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 5. HAPUS LOGIN UTAMA (AUTH USERS)
-- Ini menghapus akses login email-nya. 
-- Note: Mungkin memerlukan hak akses Super Admin, tapi worth to try.
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles);

-- =================================================================
-- SELESAI. DATABASE ANDA SEKARANG BERSIH KINCLONG.
-- =================================================================
