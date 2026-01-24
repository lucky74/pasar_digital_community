-- 1. Add sold_count column if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

-- 2. Create function to increment sold_count
CREATE OR REPLACE FUNCTION increment_sold_count(row_id UUID, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET sold_count = sold_count + quantity
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
