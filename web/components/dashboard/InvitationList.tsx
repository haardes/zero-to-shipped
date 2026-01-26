'use client'

import { useEffect, useState } from 'react'
import { BellIcon } from 'lucide-react'

import type { Invitation } from '@/types/todo'
import { getPendingInvitations } from '@/lib/supabase/invitations'
import { supabase } from '@/lib/supabase/client'
import { InvitationCard } from './InvitationCard'
import { Badge } from '@/components/ui/badge'

/**
 * InvitationList Component
 * 
 * Fetches and displays pending invitations for the current user's email.
 * Shows a notification badge when invitations exist and renders InvitationCard
 * for each invitation. Shows loading skeleton while fetching.
 * 
 * Requirements: 16.1, 16.2, 16.3, 21.1
 */
export function InvitationList() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  /**
   * Fetch pending invitations for the current user
   * 
   * Requirements: 16.1, 16.2
   */
  async function fetchInvitations(): Promise<void> {
    try {
      // Get current user email
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user || !user.email) {
        console.error('Failed to get user:', userError)
        setIsLoading(false)
        return
      }

      setUserEmail(user.email)

      // Fetch pending invitations
      const result = await getPendingInvitations(user.email)

      if (result.success) {
        setInvitations(result.data)
      } else {
        console.error('Failed to fetch invitations:', result.error)
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle invitation acceptance
   * 
   * Refreshes the invitation list after acceptance.
   */
  function handleAccept(): void {
    fetchInvitations()
  }

  /**
   * Handle invitation decline
   * 
   * Refreshes the invitation list after decline.
   */
  function handleDecline(): void {
    fetchInvitations()
  }

  useEffect(() => {
    fetchInvitations()
  }, [])

  // Loading skeleton - Requirement 21.1
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BellIcon className="size-5" />
          <h2 className="text-xl font-semibold">Pending Invitations</h2>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 rounded-lg border bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  // Don't render if no invitations
  if (invitations.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header with notification badge - Requirements 16.2, 16.3 */}
      <div className="flex items-center gap-2">
        <BellIcon className="size-5" />
        <h2 className="text-xl font-semibold">Pending Invitations</h2>
        <Badge variant="destructive">{invitations.length}</Badge>
      </div>

      {/* Invitation cards - Requirement 16.3 */}
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <InvitationCard
            key={invitation.id}
            invitation={invitation}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        ))}
      </div>
    </div>
  )
}
