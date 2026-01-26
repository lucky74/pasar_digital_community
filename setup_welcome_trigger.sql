-- Trigger untuk mengirim pesan selamat datang otomatis saat user baru mendaftar
-- Jalankan script ini di SQL Editor Supabase Anda

CREATE OR REPLACE FUNCTION public.handle_new_user_welcome()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.messages (sender, receiver, text, is_read, created_at)
  VALUES (
    'Admin Pasar Digital',
    NEW.raw_user_meta_data->>'username', -- Mengambil username dari metadata
    'Selamat bergabung, ' || (NEW.raw_user_meta_data->>'username') || '! 🚀

Terima kasih telah menjadi bagian dari Pasar Digital Community.
Jelajahi beragam produk menarik dan nikmati kemudahan bertransaksi serta chatting langsung dengan penjual.

Selamat berbelanja! 🛒',
    false,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hapus trigger lama jika ada untuk menghindari duplikasi
DROP TRIGGER IF EXISTS on_auth_user_created_welcome ON auth.users;

-- Buat trigger baru
CREATE TRIGGER on_auth_user_created_welcome
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_welcome();
