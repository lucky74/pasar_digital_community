-- 1. Drop function lama jika ada untuk menghindari konflik signature
DROP FUNCTION IF EXISTS increment_sold_count(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_sold_count_v2(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_sold_count_v3(UUID, INTEGER);

-- 2. Pastikan kolom sold_count ada dan default 0
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

-- 3. Reset semua NULL menjadi 0 (Force Update)
UPDATE products SET sold_count = 0 WHERE sold_count IS NULL;

-- 4. Buat function V4 yang bersih dan aman (SECURITY DEFINER = run as admin)
CREATE OR REPLACE FUNCTION increment_sold_count_v4(row_id UUID, quantity INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Update dan return nilai baru
  UPDATE products
  SET sold_count = COALESCE(sold_count, 0) + quantity
  WHERE id = row_id
  RETURNING sold_count INTO new_count;
  
  RETURN new_count;
END;
$$;

-- 5. Beri izin eksekusi ke semua role (Anon, Authenticated, Service Role)
GRANT EXECUTE ON FUNCTION increment_sold_count_v4(UUID, INTEGER) TO postgres, anon, authenticated, service_role;

-- 6. Force Notify untuk Realtime (Optional, tapi membantu trigger update)
NOTIFY pgrst, 'reload schema';
