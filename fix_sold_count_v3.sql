-- 1. Pastikan kolom sold_count ada dan default 0
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

-- 2. Update data lama yang NULL menjadi 0
UPDATE products SET sold_count = 0 WHERE sold_count IS NULL;

-- 3. Buat fungsi increment V3 yang mengembalikan nilai baru (RETURNS INTEGER)
CREATE OR REPLACE FUNCTION increment_sold_count_v3(row_id UUID, quantity INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE products
  SET sold_count = COALESCE(sold_count, 0) + quantity
  WHERE id = row_id
  RETURNING sold_count INTO new_count;
  
  RETURN new_count;
END;
$$;

-- 4. Beri izin eksekusi ke semua user
GRANT EXECUTE ON FUNCTION increment_sold_count_v3(UUID, INTEGER) TO postgres, anon, authenticated, service_role;
