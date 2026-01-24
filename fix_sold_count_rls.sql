-- Pastikan RLS aktif (praktik keamanan yang baik)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama agar tidak duplikat/konflik
DROP POLICY IF EXISTS "Public Read Products" ON products;
DROP POLICY IF EXISTS "Public Select Products" ON products;

-- Buat policy baru yang IZINKAN SEMUA ORANG (anon & auth) membaca SEMUA baris & kolom
CREATE POLICY "Public Read Products"
ON products
FOR SELECT
TO public
USING (true);

-- Pastikan grant di level database juga aman
GRANT SELECT ON products TO anon, authenticated;

-- Cek ulang data (untuk memastikan tidak ada yang null)
UPDATE products SET sold_count = 0 WHERE sold_count IS NULL;
