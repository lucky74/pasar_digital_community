-- SETUP GROUPS FEATURE
-- Run this in Supabase SQL Editor to enable Community Groups

-- 1. Create 'groups' table
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_by TEXT NOT NULL, -- storing username for simplicity in this app structure
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create 'group_messages' table
CREATE TABLE IF NOT EXISTS group_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    text TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for GROUPS
-- Everyone can read groups
CREATE POLICY "Public Read Groups" 
ON groups FOR SELECT 
USING (true);

-- Authenticated users can create groups
CREATE POLICY "Authenticated Create Groups" 
ON groups FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Creator can update their group
CREATE POLICY "Owner Update Groups" 
ON groups FOR UPDATE 
TO authenticated 
USING (created_by = (select username from profiles where id = auth.uid())); 
-- Note: complex check skipped for simplicity, using loose username matching or just allowing all auth users to update for MVP collaboration

-- SIMPLIFIED POLICIES FOR MVP (To avoid permission headaches)
DROP POLICY IF EXISTS "Public Read Groups" ON groups;
DROP POLICY IF EXISTS "Authenticated Create Groups" ON groups;

CREATE POLICY "Enable All Access for Groups"
ON groups FOR ALL
USING (true)
WITH CHECK (true);


-- 5. Create Policies for GROUP_MESSAGES
-- Everyone can read messages
DROP POLICY IF EXISTS "Enable All Access for Group Messages" ON group_messages;

CREATE POLICY "Enable All Access for Group Messages"
ON group_messages FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Add Realtime Support
-- Must be done via dashboard usually, but we try to enable it here
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
