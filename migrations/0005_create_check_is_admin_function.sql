-- Create a function to safely check if a user is an admin without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.check_is_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_admin_value BOOLEAN;
BEGIN
    -- Direct query bypassing RLS
    SELECT is_admin INTO is_admin_value
    FROM admin_users
    WHERE user_id = user_id_param
    LIMIT 1;
    
    -- Return false if no record found
    RETURN COALESCE(is_admin_value, false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_is_admin TO authenticated;

COMMENT ON FUNCTION public.check_is_admin IS 'Safely checks if a user is an admin without triggering RLS recursion';