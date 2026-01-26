import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Login Page Component
 * 
 * A Next.js page component that renders the user authentication login interface.
 * Displays a centered card with email/password login form and navigation to registration.
 * 
 * @component
 * @example
 * // This page is automatically rendered by Next.js at the /login route
 * // No direct import needed - Next.js App Router handles routing
 * 
 * // Route: /login
 * // File: app/(auth)/login/page.tsx
 * 
 * @description
 * Features:
 * - Email and password authentication form
 * - Link to registration page for new users
 * - Responsive centered layout
 * - Card-based UI with shadcn/ui components
 * 
 * @returns {JSX.Element} The login page with authentication form
 * 
 * @see {@link LoginForm} - The form component handling authentication logic
 * @see {@link Card} - shadcn/ui card component for layout
 * 
 * Requirements: 2.1
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
