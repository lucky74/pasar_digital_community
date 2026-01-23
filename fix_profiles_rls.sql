-- FIX PROFILES TABLE RLS POLICIES
-- Run this in Supabase SQL Editor to fix "new row violates row-level security policy for table 'profiles'"

-- 1. Enable RLS on profiles (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Profiles Access" ON profiles;
DROP POLICY IF EXISTS "User can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "User can update own profile" ON profiles;
DROP POLICY IF EXISTS "User can delete own profile" ON profiles;

-- 3. Create Policy: EVERYONE can VIEW (SELECT) profiles
-- This is needed so other users can see seller names/avatars
CREATE POLICY "Public Profiles Access"
ON profiles FOR SELECT
USING ( true );

-- 4. Create Policy: USERS can INSERT their own profile
-- This is needed during Registration
CREATE POLICY "User can insert their own profile"
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

-- 5. Create Policy: USERS can UPDATE their own profile
-- This is needed for Avatar Upload (Upsert)
CREATE POLICY "User can update own profile"
ON profiles FOR UPDATE
USING ( auth.uid() = id );

-- 6. Create Policy: USERS can DELETE their own profile
CREATE POLICY "User can delete own profile"
ON profiles FOR DELETE
USING ( auth.uid() = id );
