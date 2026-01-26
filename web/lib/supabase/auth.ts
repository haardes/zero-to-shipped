/**
 * Authentication Data Access Functions
 * 
 * This module provides authentication-related functions for user registration,
 * login, session management, and logout. All functions apply input sanitization
 * and use the Result type pattern for consistent error handling.
 * 
 * @module lib/supabase/auth
 */

import { supabase } from './client'
import type { User } from '@/types/user'
import type { Result } from '@/types/todo'
import type { Session } from '@supabase/supabase-js'

/**
 * Register a new user with email and password
 * 
 * Creates a new user account in Supabase Auth. The app_user record is created
 * automatically via database trigger. Applies input sanitization by trimming whitespace.
 * 
 * @param email - User's email address
 * @param password - User's password (must meet validation requirements)
 * @returns Promise resolving to Result containing User data or error message
 * 
 * @example
 * const result = await registerUser('user@example.com', 'SecurePass123')
 * if (result.success) {
 *   console.log('User registered:', result.data)
 * } else {
 *   console.error('Registration failed:', result.error)
 * }
 * 
 * @remarks
 * - Email and password are trimmed before processing
 * - Password validation is handled by Zod schemas in the UI layer
 * - Password is hashed using bcrypt by Supabase Auth
 * - Returns "Email already exists" error for duplicate emails
 * - app_user record is created via database trigger
 * 
 * Requirements: 1.6, 28.1, 28.6
 */
export async function registerUser(
  email: string,
  password: string
): Promise<Result<User>> {
  try {
    // Sanitize inputs by trimming whitespace
    const sanitizedEmail = email.trim()
    const sanitizedPassword = password.trim()

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password: sanitizedPassword,
    })

    if (authError) {
      // Handle duplicate email error
      if (authError.message.includes('already registered') || 
          authError.message.includes('already been registered')) {
        return { success: false, error: 'Email already exists' }
      }
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user' }
    }

    // Map Supabase Auth user to User interface
    const user: User = {
      id: authData.user.id,
      email: authData.user.email || sanitizedEmail,
      createdAt: authData.user.created_at,
    }

    return { success: true, data: user }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    }
  }
}

/**
 * Authenticate a user with email and password
 * 
 * Signs in an existing user and returns their session. Applies input sanitization
 * by trimming whitespace.
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise resolving to Result containing Session or error message
 * 
 * @example
 * const result = await loginUser('user@example.com', 'SecurePass123')
 * if (result.success) {
 *   console.log('User logged in:', result.data.user)
 * } else {
 *   console.error('Login failed:', result.error)
 * }
 * 
 * @remarks
 * - Email and password are trimmed before processing
 * - Returns "Invalid credentials" error for authentication failures
 * - Session is automatically persisted by Supabase client configuration
 * - Session tokens are stored in httpOnly cookies for security
 * 
 * Requirements: 2.2, 2.4, 28.2, 28.6
 */
export async function loginUser(
  email: string,
  password: string
): Promise<Result<Session>> {
  try {
    // Sanitize inputs by trimming whitespace
    const sanitizedEmail = email.trim()
    const sanitizedPassword = password.trim()

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password: sanitizedPassword,
    })

    if (error) {
      // Return user-friendly error message for invalid credentials
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Invalid credentials' }
      }
      return { success: false, error: error.message }
    }

    if (!data.session) {
      return { success: false, error: 'Failed to create session' }
    }

    return { success: true, data: data.session }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    }
  }
}

/**
 * Get the current user session
 * 
 * Retrieves the active session for the authenticated user. Returns null if
 * no session exists or the session has expired.
 * 
 * @returns Promise resolving to Session or null
 * 
 * @example
 * const session = await getSession()
 * if (session) {
 *   console.log('User is authenticated:', session.user.email)
 * } else {
 *   console.log('No active session')
 * }
 * 
 * @remarks
 * - Session is automatically refreshed if expired but still valid
 * - Returns null for unauthenticated users
 * - Session includes user data and access tokens
 * - Used by middleware for route protection
 * 
 * Requirements: 2.4
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Failed to get session:', error.message)
      return null
    }

    return data.session
  } catch (error) {
    console.error('Failed to get session:', error)
    return null
  }
}

/**
 * Log out the current user
 * 
 * Signs out the authenticated user and clears their session. This removes
 * session tokens and invalidates the current session.
 * 
 * @returns Promise that resolves when logout is complete
 * 
 * @example
 * await logoutUser()
 * console.log('User logged out')
 * 
 * @remarks
 * - Clears session tokens from storage
 * - Invalidates the current session on the server
 * - Does not throw errors if no session exists
 * - Errors are logged but not returned (fire-and-forget pattern)
 * 
 * Requirements: 2.4, 28.2
 */
export async function logoutUser(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Failed to logout:', error.message)
    }
  } catch (error) {
    console.error('Failed to logout:', error)
  }
}
