-- SETUP GROUP MEMBERS
-- Run this to enable Joining/Leaving/Kicking

-- 1. Create 'group_members' table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'admin', 'member'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id) -- Prevent duplicate joins
);

-- 2. Enable RLS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- View: Everyone can see who is in a group (or at least count)
CREATE POLICY "Public View Members"
ON group_members FOR SELECT
USING (true);

-- Join: Authenticated users can add THEMSELVES
CREATE POLICY "User Join Group"
ON group_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Leave: Users can remove THEMSELVES
CREATE POLICY "User Leave Group"
ON group_members FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Kick: Group Owner can remove members
-- We need to check if auth.uid() is the owner of the group
-- groups.created_by is a USERNAME (text). profiles.id is auth.uid().
CREATE POLICY "Owner Kick Member"
ON group_members FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM groups g
        JOIN profiles p ON g.created_by = p.username
        WHERE g.id = group_members.group_id
        AND p.id = auth.uid()
    )
);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
