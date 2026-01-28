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

  // Check if environment variables are available
  const supabaseUrl = "https://tuaerfuuqnsrlajquhge.supabase.co"
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1YWVyZnV1cW5zcmxhanF1aGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzOTMxNzcsImV4cCI6MjA4NDk2OTE3N30.fH218FViigm5jU4zLccg4o2puk56pSCoiq1X6qdwaQM"

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in middleware')
    // Allow request to proceed - let the app handle missing env vars
    return response
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error getting session in middleware:', error)
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // If no valid session, redirect to login
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // User is authenticated, allow access
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to login to be safe
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
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
