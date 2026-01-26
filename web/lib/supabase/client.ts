/**
 * Supabase Client Configuration
 * 
 * This module provides a configured Supabase client instance for the Todo Tracking Application.
 * The client is typed with the application's database schema and configured for authentication
 * session persistence and automatic token refresh.
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
 * - Session persistence is enabled to maintain user authentication across page reloads
 * - Auto token refresh is enabled to keep sessions active
 * - The client is typed with the Database schema for full TypeScript support
 * - Environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Configured Supabase client instance
 * 
 * @type {SupabaseClient<Database>}
 * @constant
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
