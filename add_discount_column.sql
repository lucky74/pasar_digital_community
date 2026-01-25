-- Add discount column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0;

-- Update existing products to have 0 discount
UPDATE products SET discount = 0 WHERE discount IS NULL;
