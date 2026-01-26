/**
 * Supabase Client Configuration
 * 
 * This module provides a configured Supabase client instance for the Todo Tracking Application.
 * The client is typed with the application's database schema and uses @supabase/ssr for proper
 * cookie-based session management in Next.js App Router with automatic token refresh.
 * 
 * @module lib/supabase/client
 * 
 * @example
 * // Import the client in your components or utilities
 * import { supabase } from '@/lib/supabase/client'
 * 
 * @example
 * // Query data from a table
 * const { data, error } = await supabase
 *   .from('todo_list')
 *   .select('*')
 *   .eq('owner_id', userId)
 * 
 * @example
 * // Insert data into a table
 * const { data, error } = await supabase
 *   .from('todo_item')
 *   .insert({ title: 'New Task', list_id: listId })
 *   .select()
 *   .single()
 * 
 * @example
 * // Authenticate a user
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'password123'
 * })
 * 
 * @example
 * // Get current session
 * const { data: { session } } = await supabase.auth.getSession()
 * 
 * @remarks
 * - Uses @supabase/ssr for proper cookie-based session management in Next.js App Router
 * - Session persistence and auto token refresh are handled automatically
 * - The client is typed with the Database schema for full TypeScript support
 * - Environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set
 * - This client is designed for use in client components and browser contexts
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Configured Supabase browser client instance for client components
 * 
 * Uses @supabase/ssr's createBrowserClient for proper cookie handling in Next.js App Router.
 * This ensures sessions are properly maintained across page navigations and refreshes.
 * 
 * @type {SupabaseClient<Database>}
 * @constant
 */
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)
