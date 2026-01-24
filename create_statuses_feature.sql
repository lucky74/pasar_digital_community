-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create statuses table
CREATE TABLE IF NOT EXISTS statuses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 hours'
);

-- Enable RLS
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid errors on re-run
DROP POLICY IF EXISTS "Public statuses are viewable by everyone" ON statuses;
DROP POLICY IF EXISTS "Users can insert their own statuses" ON statuses;
DROP POLICY IF EXISTS "Users can delete their own statuses" ON statuses;

-- Create Policies
CREATE POLICY "Public statuses are viewable by everyone" 
ON statuses FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own statuses" 
ON statuses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own statuses" 
ON statuses FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for status media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('status_media', 'status_media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Status media is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload status media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own status media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own status media" ON storage.objects;

-- Create Storage Policies
CREATE POLICY "Status media is publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'status_media');

CREATE POLICY "Users can upload status media" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'status_media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own status media" 
ON storage.objects FOR UPDATE
USING (bucket_id = 'status_media' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own status media" 
ON storage.objects FOR DELETE
USING (bucket_id = 'status_media' AND auth.uid() = owner);
