/**
 * List Data Access Functions
 * 
 * This module provides data access functions for todo list management including
 * creation, retrieval, updates, and deletion. All functions apply input sanitization
 * and use the Result type pattern for consistent error handling.
 * 
 * @module lib/supabase/lists
 */

import { supabase } from './client'
import type { TodoList } from '@/types/todo'
import type { Result } from '@/types/todo'
import type { Database } from '@/types/database'

type TodoListRow = Database['public']['Tables']['todo_list']['Row']

/**
 * Convert database row to TodoList domain type
 * 
 * Maps snake_case database fields to camelCase domain fields.
 * 
 * @param row - Database row from todo_list table
 * @returns TodoList domain object
 */
function mapRowToTodoList(row: TodoListRow): TodoList {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    ownerUserId: row.owner_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Create a new todo list
 * 
 * Creates a new list with the current user as owner. Applies input sanitization
 * by trimming whitespace from title and description. Sets created_at and updated_at
 * timestamps automatically.
 * 
 * @param title - List title (1-100 characters)
 * @param description - Optional list description (max 500 characters)
 * @returns Promise resolving to Result containing TodoList or error message
 * 
 * @example
 * const result = await createList('Shopping List', 'Weekly groceries')
 * if (result.success) {
 *   console.log('List created:', result.data)
 * } else {
 *   console.error('Failed to create list:', result.error)
 * }
 * 
 * @remarks
 * - Title and description are trimmed before processing
 * - Requires authenticated user (owner_user_id set from session)
 * - Validation should be performed by Zod schemas before calling this function
 * - RLS policies enforce that only authenticated users can create lists
 * 
 * Requirements: 6.8, 6.9, 28.3, 28.6
 */
export async function createList(
  title: string,
  description?: string
): Promise<Result<TodoList>> {
  try {
    // Get current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Sanitize inputs by trimming whitespace
    const sanitizedTitle = title.trim()
    const sanitizedDescription = description?.trim() || null

    // Create list record
    const { data, error } = await supabase
      .from('todo_list')
      .insert({
        title: sanitizedTitle,
        description: sanitizedDescription,
        owner_user_id: user.id,
      } as any)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Failed to create list' }
    }

    return { success: true, data: mapRowToTodoList(data) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create list',
    }
  }
}

/**
 * Get all lists accessible to a user
 * 
 * Retrieves all lists that the user owns or has been granted access to via
 * list_membership. Lists are ordered by updated_at descending (most recent first).
 * 
 * @param userId - User ID to fetch lists for
 * @returns Promise resolving to Result containing array of TodoList or error message
 * 
 * @example
 * const result = await getListsForUser(userId)
 * if (result.success) {
 *   console.log('Found lists:', result.data.length)
 * } else {
 *   console.error('Failed to fetch lists:', result.error)
 * }
 * 
 * @remarks
 * - Returns both owned lists and shared lists (via list_membership)
 * - RLS policies enforce access control at database level
 * - Lists are ordered by most recently updated first
 * - Returns empty array if user has no accessible lists
 * 
 * Requirements: 7.1, 7.2, 8.1, 8.2
 */
export async function getListsForUser(userId: string): Promise<Result<TodoList[]>> {
  try {
    // Get lists where user is the owner
    const { data: ownedLists, error: ownedError } = await supabase
      .from('todo_list')
      .select('*')
      .eq('owner_user_id', userId)

    if (ownedError) {
      return { success: false, error: ownedError.message }
    }

    // Get lists where user is a member
    const { data: memberships, error: membershipError } = await supabase
      .from('list_membership')
      .select('list_id')
      .eq('user_id', userId)

    if (membershipError) {
      return { success: false, error: membershipError.message }
    }

    // Get the shared lists
    const sharedListIds = (memberships || []).map((m: any) => m.list_id)
    let sharedLists: TodoListRow[] = []
    
    if (sharedListIds.length > 0) {
      const { data: shared, error: sharedError } = await supabase
        .from('todo_list')
        .select('*')
        .in('id', sharedListIds)

      if (sharedError) {
        return { success: false, error: sharedError.message }
      }
      
      sharedLists = shared || []
    }

    // Combine and deduplicate lists
    const allLists = [...(ownedLists || []), ...sharedLists]
    const uniqueLists = Array.from(
      new Map(allLists.map(list => [list.id, list])).values()
    )

    // Sort by updated_at descending
    uniqueLists.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

    // Map database rows to domain objects
    const lists = uniqueLists.map(mapRowToTodoList)

    return { success: true, data: lists }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch lists',
    }
  }
}

/**
 * Get a specific list by ID
 * 
 * Retrieves a single list by its ID. Access is controlled by RLS policies -
 * only owners and members can retrieve the list.
 * 
 * @param listId - UUID of the list to retrieve
 * @returns Promise resolving to Result containing TodoList or error message
 * 
 * @example
 * const result = await getListById(listId)
 * if (result.success) {
 *   console.log('List:', result.data.title)
 * } else {
 *   console.error('Failed to fetch list:', result.error)
 * }
 * 
 * @remarks
 * - RLS policies enforce access control (owner or member only)
 * - Returns 403-style error if user doesn't have access
 * - Returns error if list doesn't exist
 * 
 * Requirements: 7.1, 7.2, 8.1, 8.2
 */
export async function getListById(listId: string): Promise<Result<TodoList>> {
  try {
    const { data, error } = await supabase
      .from('todo_list')
      .select('*')
      .eq('id', listId)
      .single()

    if (error) {
      // Handle not found or access denied
      if (error.code === 'PGRST116') {
        return { success: false, error: "You don't have permission to perform this action" }
      }
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'List not found' }
    }

    return { success: true, data: mapRowToTodoList(data) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch list',
    }
  }
}

/**
 * Update a list's title and/or description
 * 
 * Updates an existing list with new values. Only the owner can update a list
 * (enforced by RLS policies). Applies input sanitization by trimming whitespace.
 * Updates the updated_at timestamp automatically.
 * 
 * @param listId - UUID of the list to update
 * @param updates - Partial TodoList with fields to update
 * @returns Promise resolving to Result containing updated TodoList or error message
 * 
 * @example
 * const result = await updateList(listId, { title: 'Updated Title' })
 * if (result.success) {
 *   console.log('List updated:', result.data)
 * } else {
 *   console.error('Failed to update list:', result.error)
 * }
 * 
 * @remarks
 * - Only title and description can be updated
 * - Title and description are trimmed before processing
 * - RLS policies enforce that only owners can update lists
 * - updated_at timestamp is automatically set by database
 * - Validation should be performed by Zod schemas before calling this function
 * 
 * Requirements: 7.1, 7.2, 28.3, 28.6
 */
export async function updateList(
  listId: string,
  updates: Partial<Pick<TodoList, 'title' | 'description'>>
): Promise<Result<TodoList>> {
  try {
    // Build update object with sanitized inputs
    const updateData: Record<string, string | null> = {}
    
    if (updates.title !== undefined) {
      updateData.title = updates.title.trim()
    }
    
    if (updates.description !== undefined) {
      updateData.description = updates.description?.trim() || null
    }

    // Update list record
    const { data, error } = await (supabase
      .from('todo_list') as any)
      .update(updateData)
      .eq('id', listId)
      .select()
      .single()

    if (error) {
      // Handle not found or access denied
      if (error.code === 'PGRST116') {
        return { success: false, error: "You don't have permission to perform this action" }
      }
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Failed to update list' }
    }

    return { success: true, data: mapRowToTodoList(data) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update list',
    }
  }
}

/**
 * Delete a list
 * 
 * Permanently deletes a list and all associated data (items, memberships, invitations)
 * via CASCADE constraints. Only the owner can delete a list (enforced by RLS policies).
 * 
 * @param listId - UUID of the list to delete
 * @returns Promise resolving to Result with void data or error message
 * 
 * @example
 * const result = await deleteList(listId)
 * if (result.success) {
 *   console.log('List deleted successfully')
 * } else {
 *   console.error('Failed to delete list:', result.error)
 * }
 * 
 * @remarks
 * - RLS policies enforce that only owners can delete lists
 * - Cascading deletes remove all associated items, memberships, and invitations
 * - This operation cannot be undone
 * - Returns error if list doesn't exist or user doesn't have permission
 * 
 * Requirements: 8.1, 8.2, 28.3
 */
export async function deleteList(listId: string): Promise<Result<void>> {
  try {
    const { error } = await supabase
      .from('todo_list')
      .delete()
      .eq('id', listId)

    if (error) {
      // Handle not found or access denied
      if (error.code === 'PGRST116') {
        return { success: false, error: "You don't have permission to perform this action" }
      }
      return { success: false, error: error.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete list',
    }
  }
}
