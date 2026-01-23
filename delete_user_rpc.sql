-- Function to allow users to delete their own account from auth.users
-- This effectively deletes the user authentication record, allowing the email to be reused.
-- CAUTION: This is a powerful function.

CREATE OR REPLACE FUNCTION delete_own_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the user from auth.users
  -- This will cascade to profiles if configured, but we handle manual cleanup in client too
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_own_user() TO authenticated;
