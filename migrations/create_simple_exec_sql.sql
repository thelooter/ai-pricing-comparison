-- Create a simple exec_sql function for executing SQL commands
-- This function allows admins to run arbitrary SQL
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  -- Only allow admin users to execute SQL
  IF EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_admin = true
  ) THEN
    EXECUTE sql;
  ELSE
    RAISE EXCEPTION 'Permission denied: Only admins can execute SQL commands';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 