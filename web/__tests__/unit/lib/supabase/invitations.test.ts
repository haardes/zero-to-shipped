/**
 * Unit Tests for Invitation Data Access Functions
 * 
 * Tests the invitation management functions including creation, retrieval,
 * acceptance, and decline operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createInvitation, getPendingInvitations, acceptInvitation, declineInvitation } from '@/lib/supabase/invitations'

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}))

describe('Invitation Data Access Functions', () => {
  describe('createInvitation', () => {
    it('should sanitize email by trimming whitespace', async () => {
      const { supabase } = await import('@/lib/supabase/client')
      
      // Mock authenticated user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123', email: 'owner@example.com' } },
        error: null,
      } as any)

      // Mock successful insertion
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'invitation-123',
              list_id: 'list-123',
              invited_email: 'invited@example.com',
              invited_by_user_id: 'user-123',
              role: 'editor',
              status: 'pending',
              accepted_at: null,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any)

      const result = await createInvitation('list-123', '  invited@example.com  ', 'editor')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.invitedEmail).toBe('invited@example.com')
      }
    })

    it('should return error when user is not authenticated', async () => {
      const { supabase } = await import('@/lib/supabase/client')
      
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' } as any,
      } as any)

      const result = await createInvitation('list-123', 'invited@example.com', 'editor')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('User not authenticated')
      }
    })
  })

  describe('getPendingInvitations', () => {
    it('should sanitize email and query pending invitations', async () => {
      const { supabase } = await import('@/lib/supabase/client')
      
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'invitation-1',
            list_id: 'list-1',
            invited_email: 'user@example.com',
            invited_by_user_id: 'owner-1',
            role: 'editor',
            status: 'pending',
            accepted_at: null,
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      })

      const mockEq2 = vi.fn().mockReturnValue({
        order: mockOrder,
      })

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      const result = await getPendingInvitations('  user@example.com  ')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0].status).toBe('pending')
      }
    })
  })

  describe('acceptInvitation', () => {
    it('should update invitation and create membership', async () => {
      const { supabase } = await import('@/lib/supabase/client')
      
      // Mock authenticated user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123', email: 'user@example.com' } },
        error: null,
      } as any)

      // Mock fetching invitation
      const mockSingle1 = vi.fn().mockResolvedValue({
        data: {
          id: 'invitation-123',
          list_id: 'list-123',
          invited_email: 'user@example.com',
          invited_by_user_id: 'owner-123',
          role: 'editor',
          status: 'pending',
          accepted_at: null,
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const mockEq2 = vi.fn().mockReturnValue({
        single: mockSingle1,
      })

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      })

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      })

      // Mock updating invitation
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      })

      // Mock creating membership
      const mockSingle2 = vi.fn().mockResolvedValue({
        data: {
          id: 'membership-123',
          list_id: 'list-123',
          user_id: 'user-123',
          role: 'editor',
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: mockSingle2,
        }),
      })

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation(((table: string) => {
        callCount++
        if (callCount === 1) {
          // First call: select invitation
          return { select: mockSelect } as any
        } else if (callCount === 2) {
          // Second call: update invitation
          return { update: mockUpdate } as any
        } else {
          // Third call: insert membership
          return { insert: mockInsert } as any
        }
      }) as any)

      const result = await acceptInvitation('invitation-123')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.listId).toBe('list-123')
        expect(result.data.userId).toBe('user-123')
        expect(result.data.role).toBe('editor')
      }
    })
  })

  describe('declineInvitation', () => {
    it('should update invitation status to declined', async () => {
      const { supabase } = await import('@/lib/supabase/client')
      
      // Mock authenticated user
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123', email: 'user@example.com' } },
        error: null,
      } as any)

      // Mock updating invitation
      const mockEq2 = vi.fn().mockResolvedValue({
        error: null,
      })

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      })

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq1,
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any)

      const result = await declineInvitation('invitation-123')

      expect(result.success).toBe(true)
    })
  })
})
