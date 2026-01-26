'use client'

import { useState } from 'react'
import type { TodoItem } from '@/types/todo'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'

interface ItemCardProps {
  item: TodoItem
  onClick: (item: TodoItem) => void
  onToggleStatus: (itemId: string) => void
}

/**
 * ItemCard Component
 * 
 * Displays a single todo item with:
 * - Checkbox reflecting completion status
 * - Item title
 * - Truncated description (50 characters)
 * 
 * Clicking the card opens the edit modal. Clicking the checkbox toggles status.
 * Implements optimistic UI updates for checkbox toggle.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 21.4
 */
export function ItemCard({ item, onClick, onToggleStatus }: ItemCardProps) {
  // Optimistic UI state for checkbox - Requirement 21.4
  const [optimisticStatus, setOptimisticStatus] = useState<'pending' | 'completed' | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  // Use optimistic status if available, otherwise use actual status
  const displayStatus = optimisticStatus ?? item.status

  /**
   * Truncate description to specified length
   * 
   * Requirement: 10.5
   */
  const truncateDescription = (text: string | null, maxLength: number): string => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  /**
   * Handle checkbox click with optimistic UI update
   * 
   * Prevents event propagation to avoid triggering card click.
   * Implements optimistic UI update for immediate feedback.
   * Requirements: 10.1, 10.2, 10.3, 21.4
   */
  const handleCheckboxClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (isToggling) return // Prevent multiple clicks
    
    setIsToggling(true)
    
    // Optimistic update - immediately show the new status
    const newStatus = item.status === 'pending' ? 'completed' : 'pending'
    setOptimisticStatus(newStatus)
    
    try {
      // Perform the actual update
      await onToggleStatus(item.id)
      
      // Clear optimistic state after successful update
      setOptimisticStatus(null)
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticStatus(null)
    } finally {
      setIsToggling(false)
    }
  }

  /**
   * Handle card click to open edit modal
   * 
   * Requirement: 10.6
   */
  const handleCardClick = () => {
    onClick(item)
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <CardContent className="flex items-start gap-3 p-4">
        {/* Checkbox - Requirements 10.1, 10.2, 10.3, 21.4 */}
        <div onClick={handleCheckboxClick}>
          <Checkbox 
            checked={displayStatus === 'completed'}
            disabled={isToggling}
            className="mt-1"
          />
        </div>

        {/* Item Content - Requirements 10.4, 10.5 */}
        <div className="flex-1 space-y-1">
          <h3 className={`font-medium ${displayStatus === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
            {item.title}
          </h3>
          {item.description && (
            <p className="text-sm text-muted-foreground">
              {truncateDescription(item.description, 50)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
