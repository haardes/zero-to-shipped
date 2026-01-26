"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2Icon } from 'lucide-react'

import { loginSchema } from '@/utils/validation'
import { loginUser } from '@/lib/supabase/auth'
import { showError, showSuccess } from '@/utils/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

/**
 * LoginForm Component
 * 
 * A client-side form component for user authentication. Handles email and password
 * validation using Zod schemas, displays inline validation errors, and manages
 * loading states during authentication. On successful login, redirects to the
 * dashboard. On error, displays toast notifications and clears the password field
 * while maintaining the email value.
 * 
 * @component
 * @example
 * // Basic usage in a login page
 * import { LoginForm } from '@/components/auth/LoginForm'
 * 
 * export default function LoginPage() {
 *   return (
 *     <div className="container mx-auto max-w-md">
 *       <h1>Sign In</h1>
 *       <LoginForm />
 *     </div>
 *   )
 * }
 * 
 * @example
 * // Usage with custom layout
 * import { LoginForm } from '@/components/auth/LoginForm'
 * 
 * export default function AuthPage() {
 *   return (
 *     <div className="flex min-h-screen items-center justify-center">
 *       <div className="w-full max-w-sm space-y-6">
 *         <div className="text-center">
 *           <h2 className="text-2xl font-bold">Welcome Back</h2>
 *           <p className="text-muted-foreground">Sign in to your account</p>
 *         </div>
 *         <LoginForm />
 *       </div>
 *     </div>
 *   )
 * }
 * 
 * @remarks
 * This component uses react-hook-form for form state management and Zod for
 * validation. It integrates with Supabase authentication via the loginUser
 * function from @/lib/supabase/auth.
 * 
 * Features:
 * - Email and password validation with inline error messages
 * - Loading spinner during authentication
 * - Disabled form inputs during submission
 * - Toast notifications for success and error states
 * - Password field cleared on authentication failure
 * - Email field preserved on authentication failure
 * - Automatic redirect to /dashboard on successful login
 * - Router refresh to update session state after login
 * 
 * Requirements: 2.1, 2.2, 2.3, 22.1, 22.4, 27.1, 27.3, 27.4
 * 
 * @returns {JSX.Element} The rendered login form component
 */

type LoginFormData = z.infer<typeof loginSchema>
export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormData): Promise<void> {
    setIsLoading(true)

    try {
      const result = await loginUser(data.email, data.password)

      if (!result.success) {
        // Display error message as toast notification (Requirement 22.2, 27.1)
        showError(result.error)
        
        // Clear password field on error (Requirement 27.3)
        form.setValue('password', '')
        
        // Maintain email field value (Requirement 27.4)
        return
      }

      // Show success message
      showSuccess('Login successful!')
      
      // Use window.location for full page reload to ensure cookies are set
      window.location.href = '/dashboard'
    } catch (error) {
      showError('An unexpected error occurred. Please try again.')
      
      // Clear password field on error
      form.setValue('password', '')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field - Requirement 2.1 */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              {/* Inline validation error display - Requirement 22.1 */}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field - Requirement 2.1 */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              {/* Inline validation error display - Requirement 22.1 */}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button - Requirement 21.2, 21.3 */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
    </Form>
  )
}
