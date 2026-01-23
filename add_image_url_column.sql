-- SQL to add image_url column to messages table
-- Run this in Supabase SQL Editor

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS image_url text;
