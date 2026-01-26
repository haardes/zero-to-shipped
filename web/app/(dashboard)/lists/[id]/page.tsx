'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'

import type { TodoList, TodoItem } from '@/types/todo'
import { getListById } from '@/lib/supabase/lists'
import { supabase } from '@/lib/supabase/client'
import { ListHeader } from '@/components/lists/ListHeader'
import { ItemList } from '@/components/items/ItemList'
import { AddItemModal } from '@/components/items/AddItemModal'
import { EditItemModal } from '@/components/items/EditItemModal'
import { ShareListModal } from '@/components/lists/ShareListModal'
import { Card, CardContent } from '@/components/ui/card'

/**
 * List Detail Page
 * 
 * Displays a specific todo list with:
 * - List header (title, description, actions)
 * - All items in the list
 * - Add item modal
 * - Edit item modal
 * - Share list modal (for owners)
 * 
 * Handles authorization errors with redirect to dashboard.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.4, 15.1, 15.2, 22.3
 */
export default function ListDetailPage() {
  const router = useRouter()
  const params = useParams()
  const listId = params.id as string

  const [list, setList] = useState<TodoList | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  /**
   * Fetch list data and check ownership
   * 
   * Requirements: 7.1, 7.2, 8.1, 8.2, 8.3, 8.4
   */
  const fetchList = async () => {
    setIsLoading(true)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error('User not authenticated')
        router.push('/login')
        return
      }

      // Fetch list
      const result = await getListById(listId)

      if (!result.success) {
        // Handle authorization error - Requirement 8.4, 22.3
        if (result.error.includes('permission')) {
          toast.error("You don't have permission to perform this action")
          router.push('/dashboard')
          return
        }
        
        toast.error(result.error)
        router.push('/dashboard')
        return
      }

      setList(result.data)
      
      // Check if current user is the owner
      setIsOwner(result.data.ownerUserId === user.id)
    } catch (error) {
      toast.error('Failed to load list. Please try again.')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch list on mount
  useEffect(() => {
    if (listId) {
      fetchList()
    }
  }, [listId])

  /**
   * Handle add item button click
   * 
   * Requirement: 7.3
   */
  const handleAddItem = () => {
    setShowAddModal(true)
  }

  /**
   * Handle share button click
   * 
   * Requirements: 7.5, 15.1, 15.2
   */
  const handleShare = () => {
    setShowShareModal(true)
  }

  /**
   * Handle item click to open edit modal
   * 
   * Requirement: 10.6
   */
  const handleItemClick = (item: TodoItem) => {
    setSelectedItem(item)
    setShowEditModal(true)
  }

  /**
   * Handle modal success
   * 
   * Refreshes the item list after successful operations.
   */
  const handleModalSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  /**
   * Handle edit modal close
   */
  const handleEditModalClose = () => {
    setShowEditModal(false)
    setSelectedItem(null)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded animate-pulse w-1/3" />
              <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              <div className="flex gap-2">
                <div className="h-10 bg-muted rounded animate-pulse w-32" />
                <div className="h-10 bg-muted rounded animate-pulse w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // List not found or error
  if (!list) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            List not found
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* List Header - Requirements 7.1, 7.2, 7.3, 7.5, 7.6, 7.7 */}
      <ListHeader
        list={list}
        isOwner={isOwner}
        onAddItem={handleAddItem}
        onShare={handleShare}
      />

      {/* Item List - Requirement 7.4 */}
      <ItemList
        listId={listId}
        onItemClick={handleItemClick}
        refreshTrigger={refreshTrigger}
      />

      {/* Add Item Modal */}
      <AddItemModal
        listId={listId}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleModalSuccess}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        item={selectedItem}
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        onSuccess={handleModalSuccess}
      />

      {/* Share List Modal - Requirements 15.1, 15.2 */}
      <ShareListModal
        listId={listId}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
