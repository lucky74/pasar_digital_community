-- 1. Tambahkan kolom sold_count jika belum ada
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

-- 2. Buat fungsi BARU (V2) yang dijamin aman
-- SECURITY DEFINER: Menggunakan hak akses admin untuk bypass RLS
CREATE OR REPLACE FUNCTION increment_sold_count_v2(row_id UUID, quantity INTEGER)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET sold_count = COALESCE(sold_count, 0) + quantity
  WHERE id = row_id;
END;
$$;
