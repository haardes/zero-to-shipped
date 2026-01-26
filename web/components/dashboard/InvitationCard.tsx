'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2Icon, CheckIcon, XIcon } from 'lucide-react'

import type { Invitation } from '@/types/todo'
import { acceptInvitation, declineInvitation } from '@/lib/supabase/invitations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface InvitationCardProps {
  invitation: Invitation
  onAccept: () => void
  onDecline: () => void
}

/**
 * InvitationCard Component
 * 
 * Displays a single invitation with list title, inviter email, proposed role,
 * and Accept/Decline buttons. Shows loading spinner on buttons during actions.
 * 
 * Requirements: 16.4, 16.5, 16.6, 16.7, 21.2, 21.3
 */
export function InvitationCard({ invitation, onAccept, onDecline }: InvitationCardProps) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)

  /**
   * Handle accepting the invitation
   * 
   * Calls acceptInvitation function and handles success/error cases.
   * Requirements: 17.1, 17.2, 17.3, 17.4, 21.2, 21.3
   */
  async function handleAccept(): Promise<void> {
    setIsAccepting(true)

    try {
      const result = await acceptInvitation(invitation.id)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Invitation accepted! You can now access the shared list.')
      onAccept()
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsAccepting(false)
    }
  }

  /**
   * Handle declining the invitation
   * 
   * Calls declineInvitation function and handles success/error cases.
   * Requirements: 18.1, 18.2, 21.2, 21.3
   */
  async function handleDecline(): Promise<void> {
    setIsDeclining(true)

    try {
      const result = await declineInvitation(invitation.id)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Invitation declined.')
      onDecline()
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsDeclining(false)
    }
  }

  const isLoading = isAccepting || isDeclining

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">List Invitation</CardTitle>
          <Badge variant="secondary">
            {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
          </Badge>
        </div>
        <CardDescription>
          {invitation.invitedEmail} has been invited by another user
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <p>
              <span className="font-medium">Invited by:</span> {invitation.invitedByUserId}
            </p>
            <p>
              <span className="font-medium">Role:</span>{' '}
              {invitation.role === 'viewer' 
                ? 'Viewer (can only view items)' 
                : 'Editor (can create and edit items)'}
            </p>
          </div>

          {/* Action Buttons - Requirements 16.6, 16.7, 21.2, 21.3 */}
          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              disabled={isLoading}
              className="flex-1"
            >
              {isAccepting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckIcon className="mr-2 h-4 w-4" />
                  Accept
                </>
              )}
            </Button>
            <Button
              onClick={handleDecline}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isDeclining ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Declining...
                </>
              ) : (
                <>
                  <XIcon className="mr-2 h-4 w-4" />
                  Decline
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
