/**
 * @fileoverview RegisterForm Component - User Registration Form
 * 
 * @description
 * A client-side form component for user registration with comprehensive validation.
 * Handles email and password input with real-time validation, error handling, and
 * automatic redirection upon successful registration.
 * 
 * @example
 * // Basic usage in a registration page
 * import { RegisterForm } from '@/components/auth/RegisterForm'
 * 
 * export default function RegisterPage() {
 *   return (
 *     <div className="container">
 *       <h1>Create Account</h1>
 *       <RegisterForm />
 *     </div>
 *   )
 * }
 * 
 * @example
 * // With custom layout
 * import { RegisterForm } from '@/components/auth/RegisterForm'
 * 
 * export default function RegisterPage() {
 *   return (
 *     <div className="flex min-h-screen items-center justify-center">
 *       <div className="w-full max-w-md space-y-6">
 *         <RegisterForm />
 *         <p className="text-center">
 *           Already have an account? <Link href="/login">Sign in</Link>
 *         </p>
 *       </div>
 *     </div>
 *   )
 * }
 * 
 * @features
 * - Email validation (valid email format required)
 * - Password validation (min 8 chars, uppercase, lowercase, number)
 * - Password confirmation matching
 * - Inline validation error messages
 * - Loading states with spinner during submission
 * - Toast notifications for success/error feedback
 * - Automatic password field clearing on error
 * - Email field persistence on error
 * - Redirect to /login on successful registration
 * 
 * @validation
 * Uses Zod schema validation with the following rules:
 * - Email: Must be valid email format
 * - Password: Min 8 characters, at least 1 uppercase, 1 lowercase, 1 number
 * - Confirm Password: Must match password field
 * 
 * @requirements
 * 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 22.1, 22.4, 27.2, 27.3, 27.4
 */

"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2Icon } from 'lucide-react'

import { registerSchema } from '@/utils/validation'
import { registerUser } from '@/lib/supabase/auth'
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

type RegisterFormData = z.infer<typeof registerSchema>

/**
 * RegisterForm Component
 * 
 * Handles user registration with email and password validation.
 * Displays inline validation errors and redirects to login on success.
 * 
 * @returns The registration form component
 * 
 * @remarks
 * This component uses react-hook-form for form state management and Zod for validation.
 * On successful registration, users are redirected to the login page.
 * Password fields are automatically cleared on error for security.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 22.1, 22.4, 27.2, 27.3, 27.4
 */
export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: RegisterFormData): Promise<void> {
    setIsLoading(true)

    try {
      const result = await registerUser(data.email, data.password)

      if (!result.success) {
        // Display error message as toast notification (Requirement 22.2)
        toast.error(result.error)
        
        // Clear password field on error (Requirement 27.3)
        form.setValue('password', '')
        form.setValue('confirmPassword', '')
        
        // Maintain email field value (Requirement 27.4)
        return
      }

      // Show success message
      toast.success('Registration successful! Please log in.')
      
      // Redirect to login page on success (Requirement 1.6)
      router.push('/login')
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.')
      
      // Clear password fields on error
      form.setValue('password', '')
      form.setValue('confirmPassword', '')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field - Requirement 1.1, 1.2 */}
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

        {/* Password Field - Requirements 1.1, 1.3, 1.4, 1.5 */}
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
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              {/* Inline validation error display - Requirement 22.1 */}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password Field - Requirement 1.1 */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
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
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>
    </Form>
  )
}
