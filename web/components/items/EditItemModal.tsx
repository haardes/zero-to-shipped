'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2Icon, CheckIcon, XIcon, TrashIcon } from 'lucide-react'

import { updateItemSchema } from '@/utils/validation'
import { updateItem, toggleItemStatus, deleteItem } from '@/lib/supabase/items'
import type { TodoItem } from '@/types/todo'
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

type UpdateItemFormData = z.infer<typeof updateItemSchema>

interface EditItemModalProps {
  item: TodoItem | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * EditItemModal Component
 * 
 * Modal form for editing existing todo items with:
 * - Editable title and description fields
 * - Mark Complete/Incomplete button based on status
 * - Delete button with confirmation
 * - Save and Cancel buttons
 * 
 * Integrates Zod validation and displays inline validation errors.
 * Shows loading spinner during operations.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10,
 *              12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 13.1, 13.2, 13.3, 13.4,
 *              21.2, 21.3, 22.1
 */
export function EditItemModal({ item, isOpen, onClose, onSuccess }: EditItemModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const form = useForm<UpdateItemFormData>({
    resolver: zodResolver(updateItemSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  // Update form when item changes
  useEffect(() => {
    if (item) {
      form.reset({
        title: item.title,
        description: item.description || '',
      })
    }
  }, [item, form])

  /**
   * Handle form submission (Save)
   * 
   * Updates the item with new values.
   * Requirements: 11.8, 11.9, 21.2, 21.3, 22.1, 22.2
   */
  async function onSubmit(data: UpdateItemFormData): Promise<void> {
    if (!item) return

    setIsLoading(true)

    try {
      const result = await updateItem(item.id, {
        title: data.title,
        description: data.description,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Item updated successfully!')
      onClose()
      onSuccess()
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle status toggle
   * 
   * Toggles item between pending and completed.
   * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 21.2, 21.3
   */
  async function handleToggleStatus(): Promise<void> {
    if (!item) return

    setIsLoading(true)

    try {
      const result = await toggleItemStatus(item.id)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      const newStatus = result.data.status
      toast.success(`Item marked as ${newStatus}!`)
      onClose()
      onSuccess()
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle delete confirmation
   * 
   * Shows confirmation dialog before deleting.
   * Requirement: 13.1
   */
  function handleDeleteClick(): void {
    setShowDeleteConfirm(true)
  }

  /**
   * Handle delete confirmation cancel
   * 
   * Closes confirmation dialog.
   * Requirement: 13.4
   */
  function handleDeleteCancel(): void {
    setShowDeleteConfirm(false)
  }

  /**
   * Handle delete confirmation
   * 
   * Deletes the item permanently.
   * Requirements: 13.2, 13.3, 21.2, 21.3
   */
  async function handleDeleteConfirm(): Promise<void> {
    if (!item) return

    setIsLoading(true)

    try {
      const result = await deleteItem(item.id)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Item deleted successfully!')
      setShowDeleteConfirm(false)
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
   * Resets form state and confirmation dialog.
   * Requirement: 11.10
   */
  function handleClose() {
    setShowDeleteConfirm(false)
    onClose()
  }

  if (!item) return null

  // Delete confirmation dialog
  if (showDeleteConfirm) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Edit form
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the item details or change its status.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title Field - Requirements 11.2, 11.8 */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Title <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter item title"
                      disabled={isLoading}
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  {/* Inline validation error display - Requirement 22.1 */}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field - Requirements 11.3, 11.8 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter item description"
                      disabled={isLoading}
                      maxLength={1000}
                      {...field}
                    />
                  </FormControl>
                  {/* Inline validation error display - Requirement 22.1 */}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Toggle and Delete Buttons - Requirements 11.4, 11.5, 11.6, 21.2, 21.3 */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleStatus}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    {item.status === 'pending' ? 'Completing...' : 'Reverting...'}
                  </>
                ) : item.status === 'pending' ? (
                  <>
                    <CheckIcon className="mr-2 h-4 w-4" />
                    Mark Complete
                  </>
                ) : (
                  <>
                    <XIcon className="mr-2 h-4 w-4" />
                    Mark Incomplete
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteClick}
                disabled={isLoading}
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>

            {/* Action Buttons - Requirements 11.7, 21.2, 21.3 */}
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
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
