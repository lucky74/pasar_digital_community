-- FIX AVATARS STORAGE POLICIES
-- Run this in Supabase SQL Editor

-- 1. Ensure the bucket 'avatars' exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Avatars" ON storage.objects;

-- 3. Create Policy: EVERYONE can VIEW (SELECT) avatars
CREATE POLICY "Public Access Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 4. Create Policy: AUTHENTICATED users can UPLOAD (INSERT)
CREATE POLICY "Authenticated Upload Avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- 5. Create Policy: Users can UPDATE their own avatars
CREATE POLICY "Owner Update Avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND (storage.foldername(name))[1] != 'private' );

-- 6. Create Policy: Users can DELETE their own avatars
CREATE POLICY "Owner Delete Avatars"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' AND (storage.foldername(name))[1] != 'private' );
