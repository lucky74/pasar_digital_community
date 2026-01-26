-- Add fcm_token column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Create a function to update fcm_token
CREATE OR REPLACE FUNCTION update_fcm_token(token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET fcm_token = token, updated_at = NOW()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
