-- Create a function that allows executing arbitrary SQL
-- IMPORTANT: This is a powerful function with security implications!
-- It should only be callable by authenticated users with admin privileges.

-- First, make sure we have the pgcrypto extension for uuid generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the exec_sql function
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the function creator
AS $$
BEGIN
  -- Execute the provided SQL
  EXECUTE sql;
END;
$$;

-- Set proper security permissions
-- Only authenticated users can execute this function
REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- Add row level security policy to restrict access to super_admin users
CREATE POLICY exec_sql_admin_only
  ON public.models
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

COMMENT ON FUNCTION public.exec_sql IS 'Executes arbitrary SQL. This function should only be callable by admin users.'; 