import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Type for the result of authorization checks
 */
type AuthCheckResult = {
  isAuthorized: boolean;
  error?: string;
  status: number;
};

/**
 * Safely checks if a user is an admin without triggering recursion in RLS policies
 * Uses a direct query approach rather than relying on RLS policies
 */
export async function checkAdminAccess(): Promise<AuthCheckResult> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { 
      isAuthorized: false, 
      error: "Authentication required", 
      status: 401 
    };
  }
  
  try {
    // Temporarily using direct query until we can run the migration
    const { data, error } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .limit(1)
      .single();
    
    if (error) {
      console.error("Error checking admin status:", error);
      return { 
        isAuthorized: false, 
        error: "Error checking admin status", 
        status: 500 
      };
    }

    return { 
      isAuthorized: data?.is_admin === true, 
      error: data?.is_admin ? undefined : "Admin privileges required",
      status: data?.is_admin ? 200 : 403 
    };
  } catch (error) {
    console.error("Error checking admin status:", error);
    return { 
      isAuthorized: false, 
      error: "Error checking admin status", 
      status: 500 
    };
  }
}

/**
 * Server Component helper: Checks admin access and redirects if unauthorized
 * Use this in Server Components that require admin access
 */
export async function requireAdmin() {
  const { isAuthorized, error } = await checkAdminAccess();
  
  if (!isAuthorized) {
    const redirectUrl = new URL('/admin/login', 'http://localhost');
    if (error) {
      redirectUrl.searchParams.set('error', error);
    }
    redirect(redirectUrl.pathname + redirectUrl.search);
  }
}

/**
 * API Route helper: Validates admin access for API routes
 * Returns appropriate response if unauthorized
 */
export async function validateAdminRequest() {
  const { isAuthorized, error, status } = await checkAdminAccess();
  
  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ error: error || 'Unauthorized' }), 
      { 
        status, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
  
  return null; // No error response needed, request is authorized
}

/**
 * Utility to check if the current user has admin access
 * Use this when you just need to check admin status without enforcing it
 */
export async function isAdmin(): Promise<boolean> {
  const { isAuthorized } = await checkAdminAccess();
  return isAuthorized;
} 