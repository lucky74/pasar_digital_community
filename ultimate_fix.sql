-- FIX PERMISSIONS (SAFE MODE - NO ALTER TABLE ON SYSTEM OBJECTS)

-- 1. STORAGE POLICIES
-- Note: We SKIP 'ALTER TABLE storage.objects' because it causes "must be owner" error.
-- We only drop and recreate policies, which is allowed.

DROP POLICY IF EXISTS "Public View" ON storage.objects;
CREATE POLICY "Public View" ON storage.objects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
CREATE POLICY "Owner Update" ON storage.objects FOR UPDATE USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING (auth.uid() = owner);


-- 2. PRODUCTS (Using 'seller' column)
-- Ensure RLS is enabled for our tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Select Products" ON products;
CREATE POLICY "Public Select Products" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Products" ON products;
CREATE POLICY "Authenticated Insert Products" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owner Modify Products" ON products;
CREATE POLICY "Owner Modify Products" ON products FOR ALL USING (seller = (select username from profiles where id = auth.uid()));


-- 3. STATUSES (Using 'user_id' column)
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Select Statuses" ON statuses;
CREATE POLICY "Public Select Statuses" ON statuses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Statuses" ON statuses;
CREATE POLICY "Authenticated Insert Statuses" ON statuses FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owner Delete Statuses" ON statuses;
CREATE POLICY "Owner Delete Statuses" ON statuses FOR DELETE USING (auth.uid() = user_id);


-- 4. PROFILES (Using 'id' column)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Select Profiles" ON profiles;
CREATE POLICY "Public Select Profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner Update Profile" ON profiles;
CREATE POLICY "Owner Update Profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owner Insert Profile" ON profiles;
CREATE POLICY "Owner Insert Profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
