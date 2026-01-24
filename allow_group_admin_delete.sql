-- Enable RLS on group_messages (just to be sure)
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable All Access for Group Messages" ON group_messages;
DROP POLICY IF EXISTS "Public Read Group Messages" ON group_messages;
DROP POLICY IF EXISTS "Authenticated Insert Group Messages" ON group_messages;

-- Create a permissive policy for MVP (Allows Select, Insert, Update, DELETE)
-- This ensures the 'Clear Chat' feature works immediately without complex joins
CREATE POLICY "Enable All Access for Group Messages"
ON group_messages FOR ALL
USING (true)
WITH CHECK (true);

-- Optional: If you want to restrict DELETE to admins only later, you can use:
-- CREATE POLICY "Admin Delete Messages"
-- ON group_messages FOR DELETE
-- USING (
--   EXISTS (
--     SELECT 1 FROM groups
--     WHERE groups.id = group_messages.group_id
--     AND groups.created_by = (SELECT username FROM profiles WHERE id = auth.uid())
--   )
-- );
