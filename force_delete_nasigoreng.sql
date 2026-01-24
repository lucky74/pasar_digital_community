-- Hapus Nasi Goreng dengan pencarian yang lebih luas (mengabaikan spasi depan/belakang)
DELETE FROM products 
WHERE name ILIKE '%Nasi Goreng%';

-- Opsi Tambahan: Hapus semua produk dari akun lama "Luck" (jika Anda yakin semua produk "Luck" adalah sampah)
-- Uncomment (hilangkan tanda --) baris di bawah ini jika ingin menghapus semua produk buatan "Luck"
-- DELETE FROM products WHERE seller = 'Luck';
