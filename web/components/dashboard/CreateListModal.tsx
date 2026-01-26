'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2Icon } from 'lucide-react'

import { createListSchema } from '@/utils/validation'
import { createList } from '@/lib/supabase/lists'
import { showError, showSuccess } from '@/utils/errors'
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

type CreateListFormData = z.infer<typeof createListSchema>

interface CreateListModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * CreateListModal Component
 * 
 * Modal form for creating new todo lists with title and description fields.
 * Integrates Zod validation and displays inline validation errors.
 * Shows loading spinner during creation and closes on success.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 21.2, 21.3, 22.1
 */
export function CreateListModal({ isOpen, onClose, onSuccess }: CreateListModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CreateListFormData>({
    resolver: zodResolver(createListSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  /**
   * Handle form submission
   * 
   * Creates a new list and handles success/error cases.
   * Requirements: 6.8, 6.9, 21.2, 21.3, 22.1, 22.2
   */
  async function onSubmit(data: CreateListFormData): Promise<void> {
    setIsLoading(true)

    try {
      const result = await createList(data.title, data.description)

      if (!result.success) {
        // Display error message as toast notification (Requirement 22.2)
        showError(result.error)
        return
      }

      // Show success message
      showSuccess('List created successfully!')
      
      // Reset form
      form.reset()
      
      // Close modal and refresh parent
      onClose()
      onSuccess()
    } catch (error) {
      showError('An unexpected error occurred. Please try again.')
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
          <DialogTitle>Create New List</DialogTitle>
          <DialogDescription>
            Create a new todo list to organize your tasks.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title Field - Requirements 6.2, 6.5, 6.6 */}
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
                      placeholder="Enter list title"
                      disabled={isLoading}
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  {/* Inline validation error display - Requirement 22.1 */}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field - Requirements 6.3, 6.7 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter list description"
                      disabled={isLoading}
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  {/* Inline validation error display - Requirement 22.1 */}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons - Requirements 6.4, 21.2, 21.3 */}
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
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
