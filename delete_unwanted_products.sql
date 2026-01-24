-- Script untuk menghapus produk Nasi Goreng dan Mie Ayam/Mie Goreng
-- Masalah: Tombol delete tidak muncul karena pemilik produk tertulis 'Luck', sedangkan Anda login sebagai 'Lucky'.
-- Solusi: Hapus langsung dari database.

DELETE FROM products 
WHERE name ILIKE 'Nasi Goreng' 
   OR name ILIKE 'Mie Ayam' 
   OR name ILIKE 'Mie Goreng';

-- Hapus juga review terkait jika ada (opsional, biasanya cascade, tapi untuk memastikan)
DELETE FROM reviews 
WHERE product_id IN (
    SELECT id FROM products 
    WHERE name ILIKE 'Nasi Goreng' 
       OR name ILIKE 'Mie Ayam' 
       OR name ILIKE 'Mie Goreng'
);
