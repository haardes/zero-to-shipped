/**
 * Route Protection Middleware
 * 
 * This middleware protects authenticated routes by checking for valid Supabase
 * sessions. Unauthenticated users attempting to access protected routes are
 * redirected to the login page.
 * 
 * @module middleware
 * 
 * @remarks
 * Protected routes:
 * - /dashboard - Main dashboard view
 * - /lists/* - All list detail pages
 * 
 * Public routes (not protected):
 * - / - Landing page
 * - /login - Login page
 * - /register - Registration page
 * - /_next/* - Next.js internal routes
 * - /api/* - API routes
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Middleware function to protect authenticated routes
 * 
 * Checks for a valid Supabase session before allowing access to protected routes.
 * Redirects unauthenticated users to /login.
 * 
 * @param request - The incoming Next.js request
 * @returns NextResponse - Either allows the request to proceed or redirects to /login
 * 
 * @example
 * // Authenticated user accessing /dashboard
 * // -> Allowed to proceed
 * 
 * @example
 * // Unauthenticated user accessing /dashboard
 * // -> Redirected to /login
 * 
 * @example
 * // Unauthenticated user accessing /lists/123
 * // -> Redirected to /login
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Create Supabase client for server-side session checking
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Look for Supabase auth cookies
  // Supabase stores auth tokens in cookies with project-specific names
  const cookies = request.cookies.getAll()
  const authCookie = cookies.find(cookie => 
    cookie.name.includes('auth-token') || 
    cookie.name.includes('sb-') && cookie.name.includes('auth')
  )

  // If no auth cookie exists, redirect to login
  if (!authCookie) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Create Supabase client to verify session
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    },
  })

  // Get the session from Supabase
  const { data: { session }, error } = await supabase.auth.getSession()

  // If no valid session or error, redirect to login
  if (error || !session) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // User is authenticated, allow access
  return NextResponse.next()
}

/**
 * Middleware configuration
 * 
 * Specifies which routes should be protected by this middleware.
 * Uses Next.js matcher pattern to include protected routes.
 * 
 * @remarks
 * Protected routes:
 * - /dashboard - Main dashboard
 * - /lists/:path* - All list detail pages
 * 
 * Requirements: 3.1, 3.2
 */
export const config = {
  matcher: [
    '/dashboard',
    '/lists/:path*',
  ],
}
