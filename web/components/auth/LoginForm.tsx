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

type LoginFormData = z.infer<typeof loginSchema>

/**
 * LoginForm Component
 * 
 * Handles user authentication with email and password validation.
 * Displays inline validation errors and redirects to dashboard on success.
 * 
 * Requirements: 2.1, 2.2, 2.3, 22.1, 22.4, 27.1, 27.3, 27.4
 */
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
      
      // Redirect to dashboard on success (Requirement 2.2)
      router.push('/dashboard')
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
