-- HAPUS SEMUA & ULANG DARI AWAL (PASTI BERHASIL)
-- 1. Hapus tabel yang rusak sampai bersih
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Buat tabel baru dengan tipe data yang BENAR (UUID)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Aktifkan Keamanan
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Izin Dasar (Wajib ada)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" 
ON public.profiles FOR DELETE USING (auth.uid() = id);

-- 5. Perbaiki Izin Hapus di Tabel Lain (Produk & Pesan)
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Users can delete own products" 
ON public.products FOR DELETE 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE username = seller));

DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages" 
ON public.messages FOR DELETE 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE username = sender OR username = receiver));
