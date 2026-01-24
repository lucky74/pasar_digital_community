-- ==========================================
-- ULTIMATE FIX FOR PERMISSIONS & VISIBILITY
-- ==========================================

-- 1. RESET & OPEN STORAGE PERMISSIONS (CRITICAL FOR UPLOAD)
-- Note: 'storage' schema permissions are tricky. We set them explicitly.

-- Enable RLS on objects (standard practice, but we'll open it up)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE to view files (Public Read)
DROP POLICY IF EXISTS "Public View" ON storage.objects;
CREATE POLICY "Public View" ON storage.objects FOR SELECT USING (true);

-- Allow AUTHENTICATED users to upload files (Insert)
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow OWNERS to update their files
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
CREATE POLICY "Owner Update" ON storage.objects FOR UPDATE 
USING (auth.uid() = owner);

-- Allow OWNERS to delete their files
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE 
USING (auth.uid() = owner);


-- 2. RESET & OPEN PRODUCTS TABLE
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow EVERYONE to see products
DROP POLICY IF EXISTS "Public Select Products" ON products;
CREATE POLICY "Public Select Products" ON products FOR SELECT USING (true);

-- Allow AUTHENTICATED users to add products
DROP POLICY IF EXISTS "Authenticated Insert Products" ON products;
CREATE POLICY "Authenticated Insert Products" ON products FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow OWNERS to update/delete (using seller name match ONLY)
-- Note: 'products' table uses 'seller' (username) column, not 'user_id'
DROP POLICY IF EXISTS "Owner Modify Products" ON products;
CREATE POLICY "Owner Modify Products" ON products FOR ALL 
USING (seller = (select username from profiles where id = auth.uid()));


-- 3. RESET & OPEN PROFILES TABLE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow EVERYONE to see profiles (needed for avatar display)
DROP POLICY IF EXISTS "Public Select Profiles" ON profiles;
CREATE POLICY "Public Select Profiles" ON profiles FOR SELECT USING (true);

-- Allow USERS to update their own profile
DROP POLICY IF EXISTS "Owner Update Profile" ON profiles;
CREATE POLICY "Owner Update Profile" ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow USERS to insert their own profile (on signup)
DROP POLICY IF EXISTS "Owner Insert Profile" ON profiles;
CREATE POLICY "Owner Insert Profile" ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);


-- 4. RESET & OPEN STATUSES TABLE
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

-- Allow EVERYONE to see statuses
DROP POLICY IF EXISTS "Public Select Statuses" ON statuses;
CREATE POLICY "Public Select Statuses" ON statuses FOR SELECT USING (true);

-- Allow AUTHENTICATED users to create statuses
DROP POLICY IF EXISTS "Authenticated Insert Statuses" ON statuses;
CREATE POLICY "Authenticated Insert Statuses" ON statuses FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow OWNERS to delete statuses
DROP POLICY IF EXISTS "Owner Delete Statuses" ON statuses;
CREATE POLICY "Owner Delete Statuses" ON statuses FOR DELETE 
USING (auth.uid() = user_id);


-- 5. ENSURE BUCKETS EXIST AND ARE PUBLIC
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('status_media', 'status_media', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat_images', 'chat_images', true) ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. GRANT BASIC USAGE (Just in case)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
