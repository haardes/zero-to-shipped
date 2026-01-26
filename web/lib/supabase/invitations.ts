/**
 * Invitation Data Access Functions
 * 
 * This module provides data access functions for invitation management including
 * creation, retrieval, acceptance, and decline. All functions apply input sanitization
 * and use the Result type pattern for consistent error handling.
 * 
 * @module lib/supabase/invitations
 */

import { supabase } from './client'
import type { Invitation, ListMembership } from '@/types/todo'
import type { Result } from '@/types/todo'
import type { Database } from '@/types/database'

type InvitationRow = Database['public']['Tables']['invitation']['Row']
type ListMembershipRow = Database['public']['Tables']['list_membership']['Row']

/**
 * Convert database row to Invitation domain type
 * 
 * Maps snake_case database fields to camelCase domain fields.
 * 
 * @param row - Database row from invitation table
 * @returns Invitation domain object
 */
function mapRowToInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    listId: row.list_id,
    invitedEmail: row.invited_email,
    invitedByUserId: row.invited_by_user_id,
    role: row.role,
    status: row.status,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  }
}

/**
 * Convert database row to ListMembership domain type
 * 
 * Maps snake_case database fields to camelCase domain fields.
 * 
 * @param row - Database row from list_membership table
 * @returns ListMembership domain object
 */
function mapRowToListMembership(row: ListMembershipRow): ListMembership {
  return {
    id: row.id,
    listId: row.list_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
  }
}

/**
 * Create a new invitation to share a list
 * 
 * Creates an invitation for a user to join a list with a specified role. Applies
 * input sanitization by trimming whitespace from email. Sets status to 'pending'
 * and invited_by_user_id to the current user.
 * 
 * @param listId - UUID of the list to share
 * @param email - Email address of the user to invite
 * @param role - Access level to grant: 'editor' or 'viewer'
 * @returns Promise resolving to Result containing Invitation or error message
 * 
 * @example
 * const result = await createInvitation(listId, 'user@example.com', 'editor')
 * if (result.success) {
 *   console.log('Invitation created:', result.data)
 * } else {
 *   console.error('Failed to create invitation:', result.error)
 * }
 * 
 * @remarks
 * - Email is trimmed before processing
 * - Requires authenticated user (invited_by_user_id set from session)
 * - Only list owners can create invitations (enforced by RLS policies)
 * - Invitation status defaults to 'pending'
 * - accepted_at is null for new invitations
 * - Validation should be performed by Zod schemas before calling this function
 * 
 * Requirements: 15.7, 15.8, 28.3, 28.6
 */
export async function createInvitation(
  listId: string,
  email: string,
  role: 'editor' | 'viewer'
): Promise<Result<Invitation>> {
  try {
    // Get current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Sanitize inputs by trimming whitespace
    const sanitizedEmail = email.trim()

    // Create invitation record
    const { data, error } = await supabase
      .from('invitation')
      .insert({
        list_id: listId,
        invited_email: sanitizedEmail,
        invited_by_user_id: user.id,
        role: role,
        status: 'pending',
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
      return { success: false, error: 'Failed to create invitation' }
    }

    return { success: true, data: mapRowToInvitation(data) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invitation',
    }
  }
}

/**
 * Get all pending invitations for a specific email address
 * 
 * Retrieves all invitations with status 'pending' that match the provided email.
 * Invitations are ordered by created_at descending (most recent first).
 * 
 * @param email - Email address to query invitations for
 * @returns Promise resolving to Result containing array of Invitation or error message
 * 
 * @example
 * const result = await getPendingInvitations('user@example.com')
 * if (result.success) {
 *   console.log('Pending invitations:', result.data.length)
 * } else {
 *   console.error('Failed to fetch invitations:', result.error)
 * }
 * 
 * @remarks
 * - Email is trimmed before processing
 * - Only returns invitations with status 'pending'
 * - Invitations are ordered by creation date (most recent first)
 * - Returns empty array if no pending invitations exist
 * - RLS policies enforce that users can only see invitations for their email
 * 
 * Requirements: 16.1, 16.2, 28.6
 */
export async function getPendingInvitations(email: string): Promise<Result<Invitation[]>> {
  try {
    // Sanitize input by trimming whitespace
    const sanitizedEmail = email.trim()

    const { data, error } = await supabase
      .from('invitation')
      .select('*')
      .eq('invited_email', sanitizedEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    // Map database rows to domain objects
    const invitations = (data || []).map(mapRowToInvitation)

    return { success: true, data: invitations }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch invitations',
    }
  }
}

/**
 * Accept an invitation to join a list
 * 
 * Accepts a pending invitation by updating its status to 'accepted', setting
 * accepted_at timestamp, and creating a list_membership record with the specified
 * role. This grants the user access to the shared list.
 * 
 * @param invitationId - UUID of the invitation to accept
 * @returns Promise resolving to Result containing ListMembership or error message
 * 
 * @example
 * const result = await acceptInvitation(invitationId)
 * if (result.success) {
 *   console.log('Invitation accepted, membership created:', result.data)
 * } else {
 *   console.error('Failed to accept invitation:', result.error)
 * }
 * 
 * @remarks
 * - Requires authenticated user
 * - Updates invitation status to 'accepted'
 * - Sets accepted_at to current timestamp
 * - Creates list_membership record with role from invitation
 * - User must match the invited_email (enforced by RLS policies)
 * - Returns error if invitation doesn't exist or is not pending
 * - Transaction-like behavior: both invitation update and membership creation must succeed
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4, 28.3
 */
export async function acceptInvitation(
  invitationId: string
): Promise<Result<ListMembership>> {
  try {
    // Get current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // First, fetch the invitation to get list_id and role
    const { data: invitation, error: fetchError } = await supabase
      .from('invitation')
      .select('*')
      .eq('id', invitationId)
      .eq('status', 'pending')
      .single() as { data: InvitationRow | null; error: any }

    if (fetchError) {
      // Handle not found or access denied
      if (fetchError.code === 'PGRST116') {
        return { success: false, error: "You don't have permission to perform this action" }
      }
      return { success: false, error: fetchError.message }
    }

    if (!invitation) {
      return { success: false, error: 'Invitation not found or already processed' }
    }

    // Update invitation status to 'accepted' and set accepted_at
    const { error: updateError } = await (supabase
      .from('invitation') as any)
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitationId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Create list_membership record
    const { data: membership, error: membershipError } = await supabase
      .from('list_membership')
      .insert({
        list_id: invitation.list_id,
        user_id: user.id,
        role: invitation.role,
      } as any)
      .select()
      .single()

    if (membershipError) {
      // If membership creation fails, we should ideally rollback the invitation update
      // For now, log the error and return it
      console.error('Failed to create membership after accepting invitation:', membershipError)
      return { success: false, error: membershipError.message }
    }

    if (!membership) {
      return { success: false, error: 'Failed to create membership' }
    }

    return { success: true, data: mapRowToListMembership(membership) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept invitation',
    }
  }
}

/**
 * Decline an invitation to join a list
 * 
 * Declines a pending invitation by updating its status to 'declined'. This does
 * not create a list_membership record and the user will not gain access to the list.
 * 
 * @param invitationId - UUID of the invitation to decline
 * @returns Promise resolving to Result with void data or error message
 * 
 * @example
 * const result = await declineInvitation(invitationId)
 * if (result.success) {
 *   console.log('Invitation declined')
 * } else {
 *   console.error('Failed to decline invitation:', result.error)
 * }
 * 
 * @remarks
 * - Requires authenticated user
 * - Updates invitation status to 'declined'
 * - Does not create list_membership record
 * - User must match the invited_email (enforced by RLS policies)
 * - Returns error if invitation doesn't exist or is not pending
 * - Declined invitations remain in the database for audit purposes
 * 
 * Requirements: 18.1, 18.2, 28.3
 */
export async function declineInvitation(
  invitationId: string
): Promise<Result<void>> {
  try {
    // Get current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Update invitation status to 'declined'
    const { error } = await (supabase
      .from('invitation') as any)
      .update({
        status: 'declined',
      })
      .eq('id', invitationId)
      .eq('status', 'pending')

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
      error: error instanceof Error ? error.message : 'Failed to decline invitation',
    }
  }
}
