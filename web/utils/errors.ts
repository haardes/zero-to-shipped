/**
 * Error Handling Utilities
 * 
 * This module provides centralized error handling utilities for consistent
 * error display across the application. It includes functions for showing
 * toast notifications and components for inline field errors.
 * 
 * @module utils/errors
 */

import { toast } from 'sonner'

/**
 * Display an error message as a toast notification
 * 
 * Shows a destructive toast notification with the provided error message.
 * Used for server errors, authentication errors, and authorization errors.
 * 
 * @param message - Error message to display
 * 
 * @example
 * // Display authentication error
 * showError('Invalid credentials')
 * 
 * @example
 * // Display authorization error
 * showError("You don't have permission to perform this action")
 * 
 * @example
 * // Display server error
 * showError('Failed to load lists. Please try again.')
 * 
 * @example
 * // Use with Result type
 * const result = await createList(title, description)
 * if (!result.success) {
 *   showError(result.error)
 *   return
 * }
 * 
 * @remarks
 * - Uses sonner toast library for notifications
 * - Toast appears at top-right of screen by default
 * - Toast auto-dismisses after a few seconds
 * - Multiple toasts can be shown simultaneously
 * - Error messages should be user-friendly and actionable
 * 
 * Requirements: 22.2, 22.3, 22.4
 */
export function showError(message: string): void {
  toast.error(message)
}

/**
 * Display a success message as a toast notification
 * 
 * Shows a success toast notification with the provided message.
 * Used for successful operations like creating lists, updating items, etc.
 * 
 * @param message - Success message to display
 * 
 * @example
 * // Display success after creating a list
 * showSuccess('List created successfully!')
 * 
 * @example
 * // Display success after accepting invitation
 * showSuccess('Invitation accepted!')
 * 
 * @remarks
 * - Uses sonner toast library for notifications
 * - Toast appears at top-right of screen by default
 * - Toast auto-dismisses after a few seconds
 */
export function showSuccess(message: string): void {
  toast.success(message)
}

/**
 * Display an info message as a toast notification
 * 
 * Shows an info toast notification with the provided message.
 * Used for informational messages that are neither success nor error.
 * 
 * @param message - Info message to display
 * 
 * @example
 * // Display info message
 * showInfo('Loading your lists...')
 */
export function showInfo(message: string): void {
  toast.info(message)
}

/**
 * Handle Result type errors consistently
 * 
 * Helper function to handle Result type errors by displaying the error
 * message as a toast notification. Returns true if there was an error,
 * false if the result was successful.
 * 
 * @param result - Result object from data access function
 * @returns true if error was handled, false if result was successful
 * 
 * @example
 * // Use with Result type
 * const result = await createList(title, description)
 * if (handleResultError(result)) {
 *   return // Error was displayed, exit early
 * }
 * // Continue with result.data
 * 
 * @example
 * // Inline usage
 * const result = await loginUser(email, password)
 * if (handleResultError(result)) return
 * router.push('/dashboard')
 */
export function handleResultError<T>(result: { success: boolean; error?: string; data?: T }): result is { success: false; error: string } {
  if (!result.success && result.error) {
    showError(result.error)
    return true
  }
  return false
}

/**
 * Standard error messages for common scenarios
 * 
 * Provides consistent error messages across the application.
 * Use these constants instead of hardcoding error messages.
 */
export const ErrorMessages = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  
  // Authorization errors
  PERMISSION_DENIED: "You don't have permission to perform this action",
  
  // Generic errors
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  
  // Resource errors
  NOT_FOUND: 'Resource not found',
  FAILED_TO_LOAD: 'Failed to load data. Please try again.',
  FAILED_TO_SAVE: 'Failed to save changes. Please try again.',
  FAILED_TO_DELETE: 'Failed to delete. Please try again.',
} as const

/**
 * Check if an error is an authorization error (403)
 * 
 * Determines if an error message indicates a permission/authorization issue.
 * 
 * @param error - Error message to check
 * @returns true if error is authorization-related
 * 
 * @example
 * if (isAuthorizationError(result.error)) {
 *   router.push('/dashboard')
 * }
 */
export function isAuthorizationError(error: string): boolean {
  return error.includes('permission') || 
         error.includes('403') || 
         error.includes('Forbidden') ||
         error === ErrorMessages.PERMISSION_DENIED
}
