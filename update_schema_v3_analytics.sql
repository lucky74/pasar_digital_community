-- 1. Menambahkan kolom 'views' ke tabel products
ALTER TABLE products ADD COLUMN IF NOT EXISTS views BIGINT DEFAULT 0;

-- 2. Membuat fungsi untuk increment views (agar aman & atomic)
CREATE OR REPLACE FUNCTION increment_views(p_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET views = views + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Memastikan semua orang bisa melihat jumlah views (jika belum ada policy SELECT, biasanya sudah ada public)
-- (Tidak perlu ubah policy jika sudah public)
