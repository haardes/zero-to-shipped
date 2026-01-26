'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2Icon } from 'lucide-react'

import { createInvitationSchema } from '@/utils/validation'
import { createInvitation } from '@/lib/supabase/invitations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

type ShareListFormData = z.infer<typeof createInvitationSchema>

interface ShareListModalProps {
  listId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * ShareListModal Component
 * 
 * Modal form for inviting users to collaborate on a list with email input
 * and role selector. Integrates Zod validation and displays inline validation errors.
 * Shows loading spinner during invitation creation and displays success toast.
 * 
 * @component
 * @example
 * ```tsx
 * import { ShareListModal } from '@/components/lists/ShareListModal'
 * 
 * function ListDetailPage() {
 *   const [isShareModalOpen, setIsShareModalOpen] = useState(false)
 *   const listId = 'abc-123'
 * 
 *   const handleSuccess = () => {
 *     // Refresh invitations or show confirmation
 *     console.log('Invitation sent successfully')
 *   }
 * 
 *   return (
 *     <>
 *       <button onClick={() => setIsShareModalOpen(true)}>
 *         Share List
 *       </button>
 *       <ShareListModal
 *         listId={listId}
 *         isOpen={isShareModalOpen}
 *         onClose={() => setIsShareModalOpen(false)}
 *         onSuccess={handleSuccess}
 *       />
 *     </>
 *   )
 * }
 * ```
 * 
 * @param {ShareListModalProps} props - Component props
 * @param {string} props.listId - The ID of the list to share
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {() => void} props.onClose - Callback when modal is closed
 * @param {() => void} props.onSuccess - Callback when invitation is sent successfully
 * 
 * @returns {JSX.Element} Modal dialog with invitation form
 * 
 * Requirements: 15.2, 15.3, 15.4, 15.5, 15.6, 15.9, 21.2, 21.3, 22.1, 22.2
 */
export function ShareListModal({ listId, isOpen, onClose, onSuccess }: ShareListModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ShareListFormData>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: {
      listId,
      invitedEmail: '',
      role: 'viewer',
    },
  })

  /**
   * Handle form submission
   * 
   * Creates a new invitation and handles success/error cases.
   * Requirements: 15.7, 15.8, 15.9, 21.2, 21.3, 22.1, 22.2
   */
  async function onSubmit(data: ShareListFormData): Promise<void> {
    setIsLoading(true)

    try {
      const result = await createInvitation(data.listId, data.invitedEmail, data.role)

      if (!result.success) {
        // Display error message as toast notification (Requirement 22.2)
        toast.error(result.error)
        return
      }

      // Show success message (Requirement 22.2)
      toast.success('Invitation sent successfully!')
      
      // Reset form
      form.reset({
        listId,
        invitedEmail: '',
        role: 'viewer',
      })
      
      // Close modal and refresh parent
      onClose()
      onSuccess()
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle modal close
   * 
   * Resets form state when modal is closed.
   */
  function handleClose() {
    form.reset({
      listId,
      invitedEmail: '',
      role: 'viewer',
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share List</DialogTitle>
          <DialogDescription>
            Invite someone to collaborate on this list by entering their email address.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field - Requirements 15.3, 15.6 */}
            <FormField
              control={form.control}
              name="invitedEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  {/* Inline validation error display - Requirement 22.1 */}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Selector - Requirements 15.4, 15.5 */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Role <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                      {...field}
                    >
                      <option value="viewer">Viewer (can only view items)</option>
                      <option value="editor">Editor (can create and edit items)</option>
                    </select>
                  </FormControl>
                  {/* Inline validation error display - Requirement 22.1 */}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons - Requirements 15.5, 21.2, 21.3 */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
