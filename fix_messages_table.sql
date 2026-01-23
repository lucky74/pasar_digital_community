
-- Add is_read column if it doesn't exist
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add image_url column if it doesn't exist (just in case)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Ensure RLS is enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Grant access (re-applying just to be safe)
GRANT ALL ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.messages TO anon;
GRANT ALL ON TABLE public.messages TO service_role;
