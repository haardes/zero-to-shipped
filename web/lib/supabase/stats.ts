/**
 * Dashboard Statistics Data Access Functions
 * 
 * This module provides functions for calculating and retrieving dashboard statistics
 * including list counts, item counts, and completion percentages.
 * 
 * @module lib/supabase/stats
 */

import { supabase } from './client'
import type { DashboardStats, Result } from '@/types/todo'

/**
 * Get dashboard statistics for a user
 * 
 * Calculates comprehensive statistics for the user's dashboard including:
 * - Count of lists owned by the user
 * - Count of lists shared with the user (via list_membership)
 * - Total number of items across all accessible lists
 * - Number of completed items
 * - Completion percentage (or 0 if no items exist)
 * 
 * @param userId - User ID to calculate statistics for
 * @returns Promise resolving to Result containing DashboardStats or error message
 * 
 * @example
 * const result = await getDashboardStats(userId)
 * if (result.success) {
 *   console.log('Owned lists:', result.data.ownedListsCount)
 *   console.log('Completion:', result.data.completionPercentage + '%')
 * } else {
 *   console.error('Failed to fetch stats:', result.error)
 * }
 * 
 * @remarks
 * - Completion percentage is calculated as (completedItems / totalItems) * 100
 * - When totalItems is 0, completionPercentage is set to 0
 * - Only counts items from lists the user has access to (owned or member)
 * - RLS policies enforce access control at database level
 * 
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
 */
export async function getDashboardStats(userId: string): Promise<Result<DashboardStats>> {
  try {
    // Query owned lists count
    const { count: ownedCount, error: ownedError } = await supabase
      .from('todo_list')
      .select('*', { count: 'exact', head: true })
      .eq('owner_user_id', userId)

    if (ownedError) {
      return { success: false, error: ownedError.message }
    }

    // Query shared lists count (via list_membership)
    const { count: sharedCount, error: sharedError } = await supabase
      .from('list_membership')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (sharedError) {
      return { success: false, error: sharedError.message }
    }

    // Get all accessible list IDs (owned + shared)
    const { data: ownedLists, error: ownedListsError } = await supabase
      .from('todo_list')
      .select('id')
      .eq('owner_user_id', userId)

    if (ownedListsError) {
      return { success: false, error: ownedListsError.message }
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from('list_membership')
      .select('list_id')
      .eq('user_id', userId)

    if (membershipsError) {
      return { success: false, error: membershipsError.message }
    }

    // Combine all accessible list IDs
    const ownedListIds = (ownedLists || []).map((list: any) => list.id)
    const sharedListIds = (memberships || []).map((m: any) => m.list_id)
    const allListIds = [...new Set([...ownedListIds, ...sharedListIds])]

    // If no lists, return zero stats
    if (allListIds.length === 0) {
      return {
        success: true,
        data: {
          ownedListsCount: ownedCount || 0,
          sharedListsCount: sharedCount || 0,
          totalItems: 0,
          completedItems: 0,
          completionPercentage: 0,
        },
      }
    }

    // Query total items across accessible lists
    const { count: totalItems, error: totalItemsError } = await supabase
      .from('todo_item')
      .select('*', { count: 'exact', head: true })
      .in('list_id', allListIds)

    if (totalItemsError) {
      return { success: false, error: totalItemsError.message }
    }

    // Query completed items count
    const { count: completedItems, error: completedItemsError } = await supabase
      .from('todo_item')
      .select('*', { count: 'exact', head: true })
      .in('list_id', allListIds)
      .eq('status', 'completed')

    if (completedItemsError) {
      return { success: false, error: completedItemsError.message }
    }

    // Calculate completion percentage (handle zero items case)
    const total = totalItems || 0
    const completed = completedItems || 0
    const completionPercentage = total === 0 ? 0 : Math.round((completed / total) * 100)

    return {
      success: true,
      data: {
        ownedListsCount: ownedCount || 0,
        sharedListsCount: sharedCount || 0,
        totalItems: total,
        completedItems: completed,
        completionPercentage,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard statistics',
    }
  }
}
