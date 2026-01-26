/**
 * Database type definitions for the Todo Tracking Application.
 * 
 * This file contains TypeScript type definitions that mirror the Supabase database schema,
 * providing type safety for database operations throughout the application.
 * 
 * @module types/database
 * 
 * @example
 * // Import the Database type
 * import { Database } from '@/types/database';
 * 
 * @example
 * // Use with Supabase client for type-safe queries
 * import { createClient } from '@supabase/supabase-js';
 * import { Database } from '@/types/database';
 * 
 * const supabase = createClient<Database>(url, key);
 * 
 * // Type-safe query for todo lists
 * const { data, error } = await supabase
 *   .from('todo_list')
 *   .select('*')
 *   .eq('owner_user_id', userId);
 * 
 * @example
 * // Insert a new todo item with type checking
 * const newItem: Database['public']['Tables']['todo_item']['Insert'] = {
 *   list_id: 'uuid-here',
 *   title: 'Buy groceries',
 *   description: 'Milk, eggs, bread',
 *   created_by_user_id: userId,
 *   updated_by_user_id: userId
 * };
 * 
 * const { data, error } = await supabase
 *   .from('todo_item')
 *   .insert(newItem);
 * 
 * @example
 * // Update with partial fields
 * const update: Database['public']['Tables']['todo_item']['Update'] = {
 *   status: 'completed'
 * };
 * 
 * await supabase
 *   .from('todo_item')
 *   .update(update)
 *   .eq('id', itemId);
 * 
 * @description
 * The Database type includes:
 * - Tables: All database tables with Row, Insert, and Update types
 *   - todo_list: User-created todo lists
 *   - todo_item: Individual todo items within lists
 *   - list_membership: User access and roles for lists
 *   - invitation: Pending invitations to join lists
 * - Enums: Database enum types for type-safe status values
 *   - list_role: User roles (owner, editor, viewer)
 *   - invitation_status: Invitation states (pending, accepted, declined)
 *   - todo_item_status: Item completion status (pending, completed)
 */
export type Database = {
  public: {
    Tables: {
      todo_list: {
        Row: {
          id: string
          title: string
          description: string | null
          owner_user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          owner_user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          owner_user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      todo_item: {
        Row: {
          id: string
          list_id: string
          title: string
          description: string | null
          status: 'pending' | 'completed'
          created_by_user_id: string
          updated_by_user_id: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          title: string
          description?: string | null
          status?: 'pending' | 'completed'
          created_by_user_id: string
          updated_by_user_id: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'completed'
          created_by_user_id?: string
          updated_by_user_id?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      list_membership: {
        Row: {
          id: string
          list_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          user_id?: string
          role?: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
      }
      invitation: {
        Row: {
          id: string
          list_id: string
          invited_email: string
          invited_by_user_id: string
          role: 'editor' | 'viewer'
          status: 'pending' | 'accepted' | 'declined'
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          invited_email: string
          invited_by_user_id: string
          role: 'editor' | 'viewer'
          status?: 'pending' | 'accepted' | 'declined'
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          invited_email?: string
          invited_by_user_id?: string
          role?: 'editor' | 'viewer'
          status?: 'pending' | 'accepted' | 'declined'
          accepted_at?: string | null
          created_at?: string
        }
      }
    }
    Enums: {
      list_role: 'owner' | 'editor' | 'viewer'
      invitation_status: 'pending' | 'accepted' | 'declined'
      todo_item_status: 'pending' | 'completed'
    }
  }
}
