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
import { createServerClient } from '@supabase/ssr'

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
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get the session from Supabase
  const { data: { session } } = await supabase.auth.getSession()

  // If no valid session, redirect to login
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // User is authenticated, allow access
  return response
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
