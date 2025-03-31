/**
 * Next.js Middleware with Supabase Auth SSR Implementation
 * 
 * IMPORTANT NOTES:
 * 1. Cookie Handling:
 *    - We use getAll() and setAll() for cookie management
 *    - Individual cookie operations (get/set/remove) are deprecated and will break auth
 *    - Cookie state must be maintained exactly as provided by Supabase
 * 
 * 2. Response Handling:
 *    - The response object must be created before cookie operations
 *    - Any modifications to the response must preserve cookie state
 *    - The final response must be returned exactly as is after Supabase operations
 * 
 * 3. Session Management:
 *    - No code should run between createServerClient and auth.getSession()
 *    - This prevents race conditions that could cause random logouts
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Security check: Reject any requests with x-middleware-subrequest header
  if (request.headers.get('x-middleware-subrequest')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Create initial response - required for cookie handling
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Initialize Supabase client with correct cookie handling
  // IMPORTANT: This pattern must be followed exactly to maintain session state
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Get all cookies for Supabase client
        getAll() {
          return request.cookies.getAll()
        },
        // Set all cookies from Supabase response
        // This must create a new response to avoid cookie state conflicts
        setAll(cookiesToSet) {
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: Do not add any code between client creation and session check
  // This prevents race conditions that could break authentication
  const { data: { session } } = await supabase.auth.getSession()

  // Define routes that require authentication
  const requiresAuth = request.nextUrl.pathname.startsWith('/admin')
  
  // Special case: login page should be accessible without auth
  const isLoginPage = request.nextUrl.pathname === '/admin/login'

  // If trying to access authenticated route without being logged in
  if (requiresAuth && !session && !isLoginPage) {
    const redirectUrl = new URL('/admin/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Prevent authenticated users from accessing login page
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // IMPORTANT: Return the response object exactly as is
  // Any modifications to the response must be done through the setAll() method
  // to maintain proper cookie state
  return response
}

// Configure middleware to only run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/admin/:path*',
  ],
} 