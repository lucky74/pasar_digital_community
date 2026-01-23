-- FIX CHAT IMAGES STORAGE POLICIES
-- Run this in Supabase SQL Editor if you experience issues with sending images in chat

-- 1. Ensure the bucket 'chat_images' exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_images', 'chat_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access Chat Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Chat Images" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Chat Images" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Chat Images" ON storage.objects;

-- 3. Create Policy: EVERYONE can VIEW (SELECT) chat images
CREATE POLICY "Public Access Chat Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat_images' );

-- 4. Create Policy: AUTHENTICATED users can UPLOAD (INSERT)
CREATE POLICY "Authenticated Upload Chat Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat_images' );

-- 5. Create Policy: Users can UPDATE their own chat images
CREATE POLICY "Owner Update Chat Images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'chat_images' AND (storage.foldername(name))[1] != 'private' );

-- 6. Create Policy: Users can DELETE their own chat images
CREATE POLICY "Owner Delete Chat Images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'chat_images' AND (storage.foldername(name))[1] != 'private' );
