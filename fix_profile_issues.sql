-- 1. FIX PROFILES RLS
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to profiles (Essential for fetching avatar/username)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow users to delete their own profile
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
CREATE POLICY "Users can delete their own profile" 
ON profiles FOR DELETE 
USING (auth.uid() = id);

-- 2. CREATE TRIGGER FOR CASCADING USERNAME UPDATES
-- This ensures that if a user changes their username, all their products and messages are updated.

CREATE OR REPLACE FUNCTION update_username_cascade()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.username <> OLD.username THEN
        -- Update Products
        UPDATE products 
        SET seller = NEW.username 
        WHERE seller = OLD.username;

        -- Update Messages (Sender)
        UPDATE messages 
        SET sender = NEW.username 
        WHERE sender = OLD.username;

        -- Update Messages (Receiver)
        UPDATE messages 
        SET receiver = NEW.username 
        WHERE receiver = OLD.username;
        
        -- Update Group Memberships (if stored by name)
        -- Assuming group_members might use name or ID. If ID, no change needed.
        -- If user_id is used, we are good.
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS on_profile_username_update ON profiles;

-- Create Trigger
CREATE TRIGGER on_profile_username_update
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_username_cascade();

-- 3. ENSURE STORAGE POLICIES FOR AVATARS
-- Allow public access to avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
CREATE POLICY "Anyone can upload an avatar"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid() = owner );
