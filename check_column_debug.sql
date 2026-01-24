-- Cek apakah kolom sold_count benar-benar ada dan tipenya apa
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'sold_count';

-- Cek sampel data
SELECT id, name, sold_count FROM products LIMIT 5;
