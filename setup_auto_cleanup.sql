-- 1. FUNGSI OTOMATIS: Hapus Data Terkait saat User Dihapus
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Hapus Grup yang dibuat user ini
  -- (Hapus isi grup dulu biar bersih)
  DELETE FROM public.group_messages WHERE group_id IN (SELECT id FROM public.groups WHERE created_by = OLD.username);
  DELETE FROM public.group_members WHERE group_id IN (SELECT id FROM public.groups WHERE created_by = OLD.username);
  DELETE FROM public.groups WHERE created_by = OLD.username;

  -- Hapus Produk user ini
  DELETE FROM public.products WHERE seller = OLD.username;

  -- Hapus Pesan user ini
  DELETE FROM public.messages WHERE sender = OLD.username OR receiver = OLD.username;

  -- Hapus Wishlist user ini
  DELETE FROM public.wishlists WHERE user_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. PASANG PEMICU (TRIGGER) UNTUK DELETE
DROP TRIGGER IF EXISTS on_profile_delete ON public.profiles;
CREATE TRIGGER on_profile_delete
BEFORE DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- 3. FUNGSI OTOMATIS: Update Data saat Username Ganti
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.username != NEW.username THEN
    -- Update nama pembuat di Grup
    UPDATE public.groups SET created_by = NEW.username WHERE created_by = OLD.username;
    -- Update nama penjual di Produk
    UPDATE public.products SET seller = NEW.username WHERE seller = OLD.username;
    -- Update pesan
    UPDATE public.messages SET sender = NEW.username WHERE sender = OLD.username;
    UPDATE public.messages SET receiver = NEW.username WHERE receiver = OLD.username;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. PASANG PEMICU (TRIGGER) UNTUK UPDATE
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
CREATE TRIGGER on_profile_update
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();
