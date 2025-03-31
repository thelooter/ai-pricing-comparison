-- Drop the old "first user becomes admin" policy
DROP POLICY IF EXISTS "Allow first user to become admin" ON admin_users;

-- Drop any existing admin management policy to avoid conflicts
DROP POLICY IF EXISTS "Allow admins to manage admin_users" ON admin_users;

-- Create new policy that only allows existing admins to create new admins
CREATE POLICY "Allow admins to manage admin_users" 
ON admin_users FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Add a comment explaining the change
COMMENT ON POLICY "Allow admins to manage admin_users" ON admin_users IS 
  'Only existing admin users can create new admin users. Removes automatic first-user-admin functionality.'; 