-- FIX CHAT IMAGE UPLOAD ISSUE (RUN THIS IN SUPABASE)
-- Masalah "Hubungi Admin" muncul karena Bucket 'chat_images' belum dibuat di database.
-- Jalankan script ini untuk membuatnya.

-- 1. Create the bucket 'chat_images' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_images', 'chat_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Reset policies for chat_images to ensure clean slate
DROP POLICY IF EXISTS "Public Access Chat Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Chat Images" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Chat Images" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Chat Images" ON storage.objects;

-- 3. Allow EVERYONE to VIEW images (needed for recipient to see image)
CREATE POLICY "Public Access Chat Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat_images' );

-- 4. Allow LOGGED IN users to UPLOAD images
CREATE POLICY "Authenticated Upload Chat Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat_images' );

-- 5. Allow users to UPDATE/DELETE their own uploads
CREATE POLICY "Owner Update Chat Images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'chat_images' AND owner = auth.uid() );

CREATE POLICY "Owner Delete Chat Images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'chat_images' AND owner = auth.uid() );
