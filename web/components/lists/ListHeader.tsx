/**
 * ListHeader Component
 * 
 * Displays the header section for a todo list detail page, including the list title,
 * description, and action buttons. The component conditionally renders the "Share List"
 * button based on ownership status, while the "Add Item" button is always visible.
 * Includes a navigation link back to the dashboard.
 * 
 * @component
 * 
 * @example
 * // Basic usage with owner permissions
 * <ListHeader
 *   list={todoList}
 *   isOwner={true}
 *   onAddItem={() => setShowAddModal(true)}
 *   onShare={() => setShowShareModal(true)}
 * />
 * 
 * @example
 * // Usage for non-owner (Share button hidden)
 * <ListHeader
 *   list={todoList}
 *   isOwner={false}
 *   onAddItem={() => setShowAddModal(true)}
 *   onShare={() => {}}
 * />
 * 
 * @example
 * // List with description
 * const list = {
 *   id: '123',
 *   title: 'Shopping List',
 *   description: 'Weekly grocery shopping items',
 *   ownerId: 'user-123',
 *   createdAt: '2024-01-01T00:00:00Z',
 *   updatedAt: '2024-01-01T00:00:00Z'
 * }
 * <ListHeader
 *   list={list}
 *   isOwner={true}
 *   onAddItem={handleAddItem}
 *   onShare={handleShare}
 * />
 * 
 * @param {ListHeaderProps} props - Component props
 * @param {TodoList} props.list - The todo list object containing title, description, and metadata
 * @param {boolean} props.isOwner - Whether the current user is the owner of the list (controls Share button visibility)
 * @param {() => void} props.onAddItem - Callback function invoked when the "Add Item" button is clicked
 * @param {() => void} props.onShare - Callback function invoked when the "Share List" button is clicked (only visible to owners)
 * 
 * @remarks
 * - The "Share List" button is only rendered when isOwner is true (Requirement 7.6)
 * - The "Add Item" button is always visible regardless of ownership (Requirement 7.3)
 * - The component uses Next.js Link for client-side navigation to /dashboard
 * - Icons are provided by lucide-react library
 * - Styling uses Tailwind CSS utility classes
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7
 */
'use client'

import Link from 'next/link'
import { ArrowLeftIcon, PlusIcon, Share2Icon } from 'lucide-react'
import type { TodoList } from '@/types/todo'
import { Button } from '@/components/ui/button'

interface ListHeaderProps {
  list: TodoList
  isOwner: boolean
  onAddItem: () => void
  onShare: () => void
}

export function ListHeader({ list, isOwner, onAddItem, onShare }: ListHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Back to Dashboard Link - Requirement 7.7 */}
      <Link 
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* List Title and Description - Requirements 7.1, 7.2 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{list.title}</h1>
        {list.description && (
          <p className="text-muted-foreground">{list.description}</p>
        )}
      </div>

      {/* Action Buttons - Requirements 7.3, 7.5, 7.6 */}
      <div className="flex items-center gap-2">
        {/* Add Item Button - Requirement 7.3 */}
        <Button onClick={onAddItem}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Item
        </Button>

        {/* Share List Button - Only shown for owners - Requirements 7.5, 7.6 */}
        {isOwner && (
          <Button variant="outline" onClick={onShare}>
            <Share2Icon className="mr-2 h-4 w-4" />
            Share List
          </Button>
        )}
      </div>
    </div>
  )
}
