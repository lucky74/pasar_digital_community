-- 1. Tambahkan kolom sold_count jika belum ada
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

-- 2. Buat fungsi AMAN (SECURITY DEFINER) untuk menambah jumlah terjual
-- SECURITY DEFINER: Fungsi berjalan dengan hak akses pembuat fungsi (admin), 
-- sehingga pembeli bisa update counter meski tidak punya hak edit produk.
CREATE OR REPLACE FUNCTION increment_sold_count(row_id UUID, quantity INTEGER)
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
