/**
 * Todo Domain Types
 * 
 * This module defines the core domain types for the Todo Tracking Application.
 * It includes interfaces for todo lists, items, memberships, invitations, and
 * utility types for error handling and statistics.
 * 
 * @module types/todo
 * 
 * @example
 * // Import types for use in components and functions
 * import type { TodoList, TodoItem, Result } from '@/types/todo'
 * 
 * // Using Result type for error handling
 * async function fetchList(id: string): Promise<Result<TodoList>> {
 *   try {
 *     const list = await getListById(id)
 *     return { success: true, data: list }
 *   } catch (error) {
 *     return { success: false, error: 'Failed to fetch list' }
 *   }
 * }
 * 
 * // Handling Result type in components
 * const result = await fetchList(listId)
 * if (result.success) {
 *   console.log('List:', result.data.title)
 * } else {
 *   console.error('Error:', result.error)
 * }
 * 
 * @example
 * // Creating a new todo item
 * const newItem: Partial<TodoItem> = {
 *   listId: 'list-uuid',
 *   title: 'Buy groceries',
 *   description: 'Milk, eggs, bread',
 *   status: 'pending'
 * }
 * 
 * @example
 * // Working with dashboard statistics
 * const stats: DashboardStats = {
 *   ownedListsCount: 5,
 *   sharedListsCount: 3,
 *   totalItems: 42,
 *   completedItems: 28,
 *   completionPercentage: 66.67
 * }
 */

/**
 * TodoList represents a collection of todo items
 * 
 * @property id - Unique identifier (UUID)
 * @property title - List title (1-100 characters)
 * @property description - Optional list description (max 500 characters)
 * @property ownerUserId - UUID of the user who owns this list
 * @property createdAt - ISO 8601 timestamp of creation
 * @property updatedAt - ISO 8601 timestamp of last update
 */
export interface TodoList {
  id: string
  title: string
  description: string | null
  ownerUserId: string
  createdAt: string
  updatedAt: string
}

/**
 * TodoItem represents a single task within a todo list
 * 
 * @property id - Unique identifier (UUID)
 * @property listId - UUID of the parent list
 * @property title - Item title (1-200 characters)
 * @property description - Optional item description (max 1000 characters)
 * @property status - Current status: 'pending' or 'completed'
 * @property createdByUserId - UUID of the user who created this item
 * @property updatedByUserId - UUID of the user who last updated this item
 * @property completedAt - ISO 8601 timestamp when marked complete, null if pending
 * @property createdAt - ISO 8601 timestamp of creation
 * @property updatedAt - ISO 8601 timestamp of last update
 */
export interface TodoItem {
  id: string
  listId: string
  title: string
  description: string | null
  status: 'pending' | 'completed'
  createdByUserId: string
  updatedByUserId: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * ListMembership represents a user's access to a shared list
 * 
 * @property id - Unique identifier (UUID)
 * @property listId - UUID of the list
 * @property userId - UUID of the member user
 * @property role - Access level: 'owner', 'editor', or 'viewer'
 * @property createdAt - ISO 8601 timestamp when membership was created
 */
export interface ListMembership {
  id: string
  listId: string
  userId: string
  role: 'owner' | 'editor' | 'viewer'
  createdAt: string
}

/**
 * Invitation represents a pending or processed invitation to share a list
 * 
 * @property id - Unique identifier (UUID)
 * @property listId - UUID of the list being shared
 * @property invitedEmail - Email address of the invited user
 * @property invitedByUserId - UUID of the user who sent the invitation
 * @property role - Proposed access level: 'editor' or 'viewer'
 * @property status - Current status: 'pending', 'accepted', or 'declined'
 * @property acceptedAt - ISO 8601 timestamp when accepted, null if not accepted
 * @property createdAt - ISO 8601 timestamp of invitation creation
 */
export interface Invitation {
  id: string
  listId: string
  invitedEmail: string
  invitedByUserId: string
  role: 'editor' | 'viewer'
  status: 'pending' | 'accepted' | 'declined'
  acceptedAt: string | null
  createdAt: string
}

/**
 * DashboardStats represents aggregated statistics for the user's dashboard
 * 
 * @property ownedListsCount - Number of lists owned by the user
 * @property sharedListsCount - Number of lists shared with the user
 * @property totalItems - Total number of items across all accessible lists
 * @property completedItems - Number of completed items across all accessible lists
 * @property completionPercentage - Percentage of completed items (0-100)
 */
export interface DashboardStats {
  ownedListsCount: number
  sharedListsCount: number
  totalItems: number
  completedItems: number
  completionPercentage: number
}

/**
 * Result type for consistent error handling across the application
 * 
 * This discriminated union type provides a type-safe way to handle success
 * and error cases without throwing exceptions.
 * 
 * @template T - The type of data returned on success
 * 
 * @example
 * // Function returning Result type
 * async function createList(title: string): Promise<Result<TodoList>> {
 *   if (!title) {
 *     return { success: false, error: 'Title is required' }
 *   }
 *   const list = await db.createList(title)
 *   return { success: true, data: list }
 * }
 * 
 * // Handling Result in calling code
 * const result = await createList('My List')
 * if (result.success) {
 *   // TypeScript knows result.data is TodoList
 *   console.log('Created:', result.data.title)
 * } else {
 *   // TypeScript knows result.error is string
 *   console.error('Error:', result.error)
 * }
 */
export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string }
