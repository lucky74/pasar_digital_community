-- FIX STORAGE POLICIES FOR PUBLIC ACCESS AND UPLOAD PERMISSIONS
-- Run this in Supabase SQL Editor

-- 1. Ensure the bucket 'products' exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies to avoid conflicts/duplicates
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects; -- potential duplicate name

-- 3. Create Policy: EVERYONE can VIEW (SELECT) images
-- This fixes the issue where photos disappear after logout
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- 4. Create Policy: AUTHENTICATED users can UPLOAD (INSERT)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'products' );

-- 5. Create Policy: Users can UPDATE their own images
CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'products' AND (storage.foldername(name))[1] != 'private' );

-- 6. Create Policy: Users can DELETE their own images
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'products' AND (storage.foldername(name))[1] != 'private' );
