-- FIX AVATAR UPLOAD ISSUES (COMPREHENSIVE)
-- Run this in Supabase SQL Editor

-- 1. Create 'avatars' bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing restrictive policies on storage.objects
DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 3. Create Simplified Permissive Policies for 'avatars' bucket

-- Allow Public View
CREATE POLICY "Public Access Avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow Authenticated Upload (INSERT)
CREATE POLICY "Authenticated Upload Avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- Allow Authenticated Update (Own files)
CREATE POLICY "Authenticated Update Avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND owner = auth.uid() );

-- Allow Authenticated Delete (Own files)
CREATE POLICY "Authenticated Delete Avatars"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' AND owner = auth.uid() );

-- 4. Ensure Profiles are Updatable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User can update own profile" ON profiles;
CREATE POLICY "User can update own profile"
ON profiles FOR UPDATE
USING ( auth.uid() = id );

-- 5. Ensure Profiles are Insertable (for new users)
DROP POLICY IF EXISTS "User can insert their own profile" ON profiles;
CREATE POLICY "User can insert their own profile"
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = id );
