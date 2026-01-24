-- 1. Pastikan kolom ada
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

-- 2. Pastikan tidak ada nilai NULL (ubah ke 0)
UPDATE products SET sold_count = 0 WHERE sold_count IS NULL;

-- 3. Hapus fungsi lama biar bersih
DROP FUNCTION IF EXISTS increment_sold_count_v2(UUID, INTEGER);

-- 4. Buat ulang fungsi dengan izin penuh (SECURITY DEFINER)
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

-- 5. Beri izin eksekusi ke semua user (Public/Authenticated)
GRANT EXECUTE ON FUNCTION increment_sold_count_v2(UUID, INTEGER) TO postgres, anon, authenticated, service_role;
