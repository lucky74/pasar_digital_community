
-- CLEANUP: Hapus semua versi fungsi yang membingungkan
DROP FUNCTION IF EXISTS increment_sold_count(bigint, integer);
DROP FUNCTION IF EXISTS increment_sold_count_v2(bigint, integer);
DROP FUNCTION IF EXISTS increment_sold_count_v3(bigint, integer);
DROP FUNCTION IF EXISTS increment_sold_count_v4(bigint, integer);

-- CREATE FINAL FUNCTION (Standard Name)
-- Gunakan SECURITY DEFINER agar user biasa bisa update sold_count milik orang lain saat beli
CREATE OR REPLACE FUNCTION increment_sold_count(row_id bigint, quantity int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
  new_count int;
BEGIN
  -- Update sold_count dan kembalikan nilai baru
  UPDATE products
  SET sold_count = COALESCE(sold_count, 0) + quantity
  WHERE id = row_id
  RETURNING sold_count INTO new_count;
  
  RETURN new_count;
END;
$$;

-- GRANT PERMISSIONS (Sangat Penting!)
-- Izinkan semua user (termasuk anonim jika perlu, atau minimal authenticated) untuk menjalankan fungsi ini
GRANT EXECUTE ON FUNCTION increment_sold_count(bigint, int) TO postgres, anon, authenticated, service_role;

-- PASTIKAN KOLOM ADA DAN DEFAULT 0
ALTER TABLE products 
ALTER COLUMN sold_count SET DEFAULT 0;

-- FIX NULL VALUES SEKALI LAGI
UPDATE products SET sold_count = 0 WHERE sold_count IS NULL;
