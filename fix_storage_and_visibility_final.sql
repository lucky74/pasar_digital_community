-- FIX STORAGE AND VISIBILITY FINAL
-- Run this in Supabase SQL Editor

-- 1. PRODUCTS TABLE VISIBILITY
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow everyone to see products
DROP POLICY IF EXISTS "Public Select Products" ON products;
CREATE POLICY "Public Select Products" ON products FOR SELECT USING (true);

-- Allow authenticated users to upload/sell products
DROP POLICY IF EXISTS "Authenticated Insert Products" ON products;
CREATE POLICY "Authenticated Insert Products" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow sellers to update/delete their OWN products
-- Using 'seller' column (username) to match with profile
DROP POLICY IF EXISTS "Owner Modify Products" ON products;
CREATE POLICY "Owner Modify Products" ON products 
FOR ALL 
USING (
  seller = (SELECT username FROM profiles WHERE id = auth.uid())
);

-- 2. STORAGE BUCKET POLICIES (Fixes Upload Failed)
-- We do NOT use ALTER TABLE here to avoid permission errors.

-- Allow Public View of Product Images
DROP POLICY IF EXISTS "Public View Product Images" ON storage.objects;
CREATE POLICY "Public View Product Images" ON storage.objects
FOR SELECT USING ( bucket_id = 'products' );

-- Allow Authenticated Upload to Product Images
DROP POLICY IF EXISTS "Authenticated Upload Product Images" ON storage.objects;
CREATE POLICY "Authenticated Upload Product Images" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);

-- Allow Public View of Status Media
DROP POLICY IF EXISTS "Public View Status Media" ON storage.objects;
CREATE POLICY "Public View Status Media" ON storage.objects
FOR SELECT USING ( bucket_id = 'status_media' );

-- Allow Authenticated Upload Status Media
DROP POLICY IF EXISTS "Authenticated Upload Status Media" ON storage.objects;
CREATE POLICY "Authenticated Upload Status Media" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'status_media' 
  AND auth.role() = 'authenticated'
);

-- 3. STATUSES VISIBILITY
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Select Statuses" ON statuses;
CREATE POLICY "Public Select Statuses" ON statuses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Statuses" ON statuses;
CREATE POLICY "Authenticated Insert Statuses" ON statuses FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owner Delete Statuses" ON statuses;
CREATE POLICY "Owner Delete Statuses" ON statuses FOR DELETE USING (auth.uid() = user_id);
