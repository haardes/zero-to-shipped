/**
 * @fileoverview Validation schemas for the Todo Tracking Application
 * 
 * This module provides Zod validation schemas for all user inputs including
 * authentication, todo lists, todo items, and invitations. All schemas enforce
 * business rules and data constraints defined in the requirements.
 * 
 * @example
 * // Validating user registration
 * import { registerSchema } from '@/utils/validation'
 * 
 * const result = registerSchema.safeParse({
 *   email: 'user@example.com',
 *   password: 'SecurePass123',
 *   confirmPassword: 'SecurePass123'
 * })
 * 
 * if (result.success) {
 *   // Data is valid, proceed with registration
 *   const { email, password } = result.data
 * } else {
 *   // Handle validation errors
 *   console.error(result.error.errors)
 * }
 * 
 * @example
 * // Validating todo list creation
 * import { createListSchema } from '@/utils/validation'
 * 
 * const result = createListSchema.safeParse({
 *   title: 'My Todo List',
 *   description: 'A list for tracking daily tasks'
 * })
 * 
 * @example
 * // Validating todo item updates
 * import { updateItemSchema } from '@/utils/validation'
 * 
 * const result = updateItemSchema.safeParse({
 *   title: 'Updated task title',
 *   status: 'completed'
 * })
 * 
 * @module utils/validation
 */

import { z } from 'zod'

/**
 * Validation schema for user registration
 * Requirements: 1.2, 1.3, 1.4, 1.5
 */
export const registerSchema = z.object({
  email: z.email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

/**
 * Validation schema for user login
 * Requirements: 1.2, 1.3
 */
export const loginSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * Validation schema for creating a todo list
 * Requirements: 6.5, 6.6, 6.7
 */
export const createListSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
})

/**
 * Validation schema for creating a todo item
 * Requirements: 9.4, 9.5, 9.6
 */
export const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  listId: z.uuid('Invalid list ID'),
})

/**
 * Validation schema for updating a todo item
 * Allows partial updates to title, description, and status
 * Requirements: 9.4, 9.5, 9.6
 */
export const updateItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').optional(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
  status: z.enum(['pending', 'completed']).optional(),
})

/**
 * Validation schema for creating an invitation
 * Requirements: 15.6, 26.1, 28.6, 28.7, 28.8
 */
export const createInvitationSchema = z.object({
  invitedEmail: z.email('Invalid email format'),
  role: z.enum(['viewer', 'editor'], {
    message: 'Role must be viewer or editor'
  }),
  listId: z.uuid('Invalid list ID'),
})
