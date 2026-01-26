/**
 * Item Data Access Functions
 * 
 * This module provides data access functions for todo item management including
 * creation, retrieval, updates, status toggling, and deletion. All functions apply
 * input sanitization and use the Result type pattern for consistent error handling.
 * 
 * @module lib/supabase/items
 */

import { supabase } from './client'
import type { TodoItem } from '@/types/todo'
import type { Result } from '@/types/todo'
import type { Database } from '@/types/database'

type TodoItemRow = Database['public']['Tables']['todo_item']['Row']

/**
 * Convert database row to TodoItem domain type
 * 
 * Maps snake_case database fields to camelCase domain fields.
 * 
 * @param row - Database row from todo_item table
 * @returns TodoItem domain object
 */
function mapRowToTodoItem(row: TodoItemRow): TodoItem {
  return {
    id: row.id,
    listId: row.list_id,
    title: row.title,
    description: row.description,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    updatedByUserId: row.updated_by_user_id,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Create a new todo item
 * 
 * Creates a new item in the specified list with status 'pending'. Applies input
 * sanitization by trimming whitespace from title and description. Sets created_by_user_id
 * and updated_by_user_id to the current user, and sets timestamps automatically.
 * 
 * @param listId - UUID of the list to add the item to
 * @param title - Item title (1-200 characters)
 * @param description - Optional item description (max 1000 characters)
 * @returns Promise resolving to Result containing TodoItem or error message
 * 
 * @example
 * const result = await createItem(listId, 'Buy milk', 'Get 2% milk from store')
 * if (result.success) {
 *   console.log('Item created:', result.data)
 * } else {
 *   console.error('Failed to create item:', result.error)
 * }
 * 
 * @remarks
 * - Title and description are trimmed before processing
 * - Requires authenticated user (created_by_user_id and updated_by_user_id set from session)
 * - Item status defaults to 'pending'
 * - completed_at is null for new items
 * - Validation should be performed by Zod schemas before calling this function
 * - RLS policies enforce that only users with owner or editor role can create items
 * 
 * Requirements: 9.7, 9.8, 9.9, 28.3, 28.6
 */
export async function createItem(
  listId: string,
  title: string,
  description?: string
): Promise<Result<TodoItem>> {
  try {
    // Get current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Sanitize inputs by trimming whitespace
    const sanitizedTitle = title.trim()
    const sanitizedDescription = description?.trim() || null

    // Create item record
    const { data, error } = await supabase
      .from('todo_item')
      .insert({
        list_id: listId,
        title: sanitizedTitle,
        description: sanitizedDescription,
        status: 'pending',
        created_by_user_id: user.id,
        updated_by_user_id: user.id,
      } as any)
      .select()
      .single()

    if (error) {
      // Handle permission errors
      if (error.code === 'PGRST116' || error.message.includes('permission')) {
        return { success: false, error: "You don't have permission to perform this action" }
      }
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Failed to create item' }
    }

    return { success: true, data: mapRowToTodoItem(data) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create item',
    }
  }
}

/**
 * Get all items for a specific list
 * 
 * Retrieves all items in a list. Access is controlled by RLS policies - only users
 * who can access the list can retrieve its items. Items are ordered by created_at
 * ascending (oldest first).
 * 
 * @param listId - UUID of the list to fetch items for
 * @returns Promise resolving to Result containing array of TodoItem or error message
 * 
 * @example
 * const result = await getItemsForList(listId)
 * if (result.success) {
 *   console.log('Found items:', result.data.length)
 * } else {
 *   console.error('Failed to fetch items:', result.error)
 * }
 * 
 * @remarks
 * - RLS policies enforce access control based on list access
 * - Items are ordered by creation date (oldest first)
 * - Returns empty array if list has no items
 * - Returns error if user doesn't have access to the list
 * 
 * Requirements: 10.1, 28.3
 */
export async function getItemsForList(listId: string): Promise<Result<TodoItem[]>> {
  try {
    const { data, error } = await supabase
      .from('todo_item')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true })

    if (error) {
      // Handle permission errors
      if (error.code === 'PGRST116' || error.message.includes('permission')) {
        return { success: false, error: "You don't have permission to perform this action" }
      }
      return { success: false, error: error.message }
    }

    // Map database rows to domain objects
    const items = (data || []).map(mapRowToTodoItem)

    return { success: true, data: items }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch items',
    }
  }
}

/**
 * Update an item's title, description, or status
 * 
 * Updates an existing item with new values. Only users with owner or editor role
 * can update items (enforced by RLS policies). Applies input sanitization by
 * trimming whitespace. Updates the updated_by_user_id and updated_at timestamp
 * automatically.
 * 
 * @param itemId - UUID of the item to update
 * @param updates - Partial TodoItem with fields to update
 * @returns Promise resolving to Result containing updated TodoItem or error message
 * 
 * @example
 * const result = await updateItem(itemId, { title: 'Updated Title' })
 * if (result.success) {
 *   console.log('Item updated:', result.data)
 * } else {
 *   console.error('Failed to update item:', result.error)
 * }
 * 
 * @remarks
 * - Title, description, and status can be updated
 * - Title and description are trimmed before processing
 * - RLS policies enforce that only users with owner or editor role can update items
 * - updated_by_user_id is set to current user
 * - updated_at timestamp is automatically set by database
 * - Validation should be performed by Zod schemas before calling this function
 * - Use toggleItemStatus for status changes to ensure proper completed_at handling
 * 
 * Requirements: 11.8, 11.9, 28.3, 28.6
 */
export async function updateItem(
  itemId: string,
  updates: Partial<Pick<TodoItem, 'title' | 'description' | 'status'>>
): Promise<Result<TodoItem>> {
  try {
    // Get current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Build update object with sanitized inputs
    const updateData: Record<string, string | null> = {
      updated_by_user_id: user.id,
    }
    
    if (updates.title !== undefined) {
      updateData.title = updates.title.trim()
    }
    
    if (updates.description !== undefined) {
      updateData.description = updates.description?.trim() || null
    }
    
    if (updates.status !== undefined) {
      updateData.status = updates.status
    }

    // Update item record
    const { data, error } = await (supabase
      .from('todo_item') as any)
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      // Handle not found or access denied
      if (error.code === 'PGRST116' || error.message.includes('permission')) {
        return { success: false, error: "You don't have permission to perform this action" }
      }
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Failed to update item' }
    }

    return { success: true, data: mapRowToTodoItem(data) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update item',
    }
  }
}

/**
 * Toggle an item's completion status
 * 
 * Toggles an item between 'pending' and 'completed' status. When marking as completed,
 * sets completed_at to current timestamp. When marking as pending, clears completed_at.
 * Updates updated_by_user_id to current user.
 * 
 * @param itemId - UUID of the item to toggle
 * @returns Promise resolving to Result containing updated TodoItem or error message
 * 
 * @example
 * const result = await toggleItemStatus(itemId)
 * if (result.success) {
 *   console.log('Item status:', result.data.status)
 * } else {
 *   console.error('Failed to toggle status:', result.error)
 * }
 * 
 * @remarks
 * - Toggles from 'pending' to 'completed' or vice versa
 * - Sets completed_at to current timestamp when marking as completed
 * - Clears completed_at (sets to null) when marking as pending
 * - RLS policies enforce that only users with owner or editor role can toggle status
 * - updated_by_user_id is set to current user
 * - updated_at timestamp is automatically set by database
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 28.3
 */
export async function toggleItemStatus(itemId: string): Promise<Result<TodoItem>> {
  try {
    // Get current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // First, fetch the current item to determine its status
    const { data: currentItem, error: fetchError } = await supabase
      .from('todo_item')
      .select('*')
      .eq('id', itemId)
      .single() as { data: TodoItemRow | null; error: any }

    if (fetchError) {
      // Handle not found or access denied
      if (fetchError.code === 'PGRST116' || fetchError.message.includes('permission')) {
        return { success: false, error: "You don't have permission to perform this action" }
      }
      return { success: false, error: fetchError.message }
    }

    if (!currentItem) {
      return { success: false, error: 'Item not found' }
    }

    // Determine new status and completed_at value
    const newStatus: 'pending' | 'completed' = currentItem.status === 'pending' ? 'completed' : 'pending'
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null

    // Update item with new status and completed_at
    const { data, error } = await (supabase
      .from('todo_item') as any)
      .update({
        status: newStatus,
        completed_at: completedAt,
        updated_by_user_id: user.id,
      })
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      // Handle not found or access denied
      if (error.code === 'PGRST116' || error.message.includes('permission')) {
        return { success: false, error: "You don't have permission to perform this action" }
      }
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Failed to toggle item status' }
    }

    return { success: true, data: mapRowToTodoItem(data) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle item status',
    }
  }
}

/**
 * Delete an item
 * 
 * Permanently deletes an item from the database. Only users with owner or editor
 * role can delete items (enforced by RLS policies).
 * 
 * @param itemId - UUID of the item to delete
 * @returns Promise resolving to Result with void data or error message
 * 
 * @example
 * const result = await deleteItem(itemId)
 * if (result.success) {
 *   console.log('Item deleted successfully')
 * } else {
 *   console.error('Failed to delete item:', result.error)
 * }
 * 
 * @remarks
 * - RLS policies enforce that only users with owner or editor role can delete items
 * - This operation cannot be undone
 * - Returns error if item doesn't exist or user doesn't have permission
 * 
 * Requirements: 13.2, 28.3
 */
export async function deleteItem(itemId: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('todo_item')
      .delete()
      .eq('id', itemId)

    if (error) {
      // Handle not found or access denied
      if (error.code === 'PGRST116' || error.message.includes('permission')) {
        return { success: false, error: "You don't have permission to perform this action" }
      }
      return { success: false, error: error.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete item',
    }
  }
}
