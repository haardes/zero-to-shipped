'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { TodoItem } from '@/types/todo'
import { getItemsForList, toggleItemStatus } from '@/lib/supabase/items'
import { ItemCard } from './ItemCard'
import { Card, CardContent } from '@/components/ui/card'

interface ItemListProps {
  listId: string
  onItemClick: (item: TodoItem) => void
  refreshTrigger?: number
}

/**
 * ItemList Component
 * 
 * Fetches and displays all items in a list using ItemCard components.
 * Shows loading skeleton while fetching data.
 * 
 * Requirements: 7.4, 21.1
 */
export function ItemList({ listId, onItemClick, refreshTrigger }: ItemListProps) {
  const [items, setItems] = useState<TodoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Fetch items for the list
   * 
   * Requirement: 7.4
   */
  const fetchItems = async () => {
    setIsLoading(true)
    
    try {
      const result = await getItemsForList(listId)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      setItems(result.data)
    } catch (error) {
      toast.error('Failed to load items. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle item status toggle
   * 
   * Toggles item status and refreshes the list.
   */
  const handleToggleStatus = async (itemId: string) => {
    const result = await toggleItemStatus(itemId)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    // Refresh items list
    await fetchItems()
  }

  // Fetch items on mount and when refreshTrigger changes
  useEffect(() => {
    fetchItems()
  }, [listId, refreshTrigger])

  // Loading skeleton - Requirement 21.1
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-4 w-4 bg-muted rounded animate-pulse mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No items yet. Click "Add Item" to create your first task.
        </CardContent>
      </Card>
    )
  }

  // Render items
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onClick={onItemClick}
          onToggleStatus={handleToggleStatus}
        />
      ))}
    </div>
  )
}
