'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2Icon } from 'lucide-react'

import { createItemSchema } from '@/utils/validation'
import { createItem } from '@/lib/supabase/items'
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

type CreateItemFormData = z.infer<typeof createItemSchema>

interface AddItemModalProps {
  listId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * AddItemModal Component
 * 
 * Modal form for creating new todo items with title and description fields.
 * Integrates Zod validation and displays inline validation errors.
 * Shows loading spinner during creation and closes on success.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 21.2, 21.3, 22.1
 */
export function AddItemModal({ listId, isOpen, onClose, onSuccess }: AddItemModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CreateItemFormData>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      listId,
      title: '',
      description: '',
    },
  })

  /**
   * Handle form submission
   * 
   * Creates a new item and handles success/error cases.
   * Requirements: 9.7, 9.8, 21.2, 21.3, 22.1, 22.2
   */
  async function onSubmit(data: CreateItemFormData): Promise<void> {
    setIsLoading(true)

    try {
      const result = await createItem(data.listId, data.title, data.description)

      if (!result.success) {
        // Display error message as toast notification (Requirement 22.2)
        toast.error(result.error)
        return
      }

      // Show success message
      toast.success('Item created successfully!')
      
      // Reset form
      form.reset()
      
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
    form.reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
          <DialogDescription>
            Add a new task to your list.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title Field - Requirements 9.2, 9.4, 9.5 */}
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

            {/* Description Field - Requirements 9.3, 9.6 */}
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

            {/* Action Buttons - Requirements 21.2, 21.3 */}
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
                    Adding...
                  </>
                ) : (
                  'Add Item'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
