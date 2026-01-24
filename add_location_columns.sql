-- Add location support to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS location_lat double precision,
ADD COLUMN IF NOT EXISTS location_lng double precision,
ADD COLUMN IF NOT EXISTS location_label text;

-- Add location support to group_messages table (just in case)
ALTER TABLE group_messages
ADD COLUMN IF NOT EXISTS location_lat double precision,
ADD COLUMN IF NOT EXISTS location_lng double precision,
ADD COLUMN IF NOT EXISTS location_label text;
