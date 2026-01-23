-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to INSERT messages
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL); -- Or stricter: sender matches profile

-- Policy to allow users to SELECT messages they sent or received
-- Note: This assumes 'sender' and 'receiver' columns store usernames. 
-- Ideally we should use UUIDs, but app uses usernames.
-- We need to join with profiles to verify ownership, or trust the client (less secure).
-- For now, let's assume if you are authenticated, you can read messages where you are sender or receiver.
-- BUT, auth.uid() gives UUID. 'sender' has 'Luck'. We need to map.
-- It's complex to do strictly with usernames in RLS without a helper function or join.
-- SIMPLIFIED POLICY: Allow authenticated users to view all messages (for development) OR try to match.

-- Let's try to be secure:
-- User can see message if sender = (select username from profiles where id = auth.uid())
-- OR receiver = (select username from profiles where id = auth.uid())

CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  sender IN (SELECT username FROM profiles WHERE id = auth.uid())
  OR
  receiver IN (SELECT username FROM profiles WHERE id = auth.uid())
);

-- Policy for DELETE (already implemented in logic, but needs RLS permission)
CREATE POLICY "Users can delete their own conversations"
ON public.messages
FOR DELETE
TO authenticated
USING (
  sender IN (SELECT username FROM profiles WHERE id = auth.uid())
  OR
  receiver IN (SELECT username FROM profiles WHERE id = auth.uid())
);
