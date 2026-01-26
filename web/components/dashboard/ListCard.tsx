'use client'

import { useRouter } from 'next/navigation'
import type { TodoList } from '@/types/todo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ListCardProps {
  list: TodoList
  role: 'owner' | 'editor' | 'viewer'
  itemCount?: {
    completed: number
    total: number
  }
}

/**
 * ListCard Component
 * 
 * Displays summary information for a single todo list including:
 * - List title
 * - Truncated description (100 characters)
 * - Item counts (completed/total)
 * - Role badge (Owner or Shared with role)
 * - Last updated timestamp
 * 
 * Clicking the card navigates to the list detail page.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
export function ListCard({ list, role, itemCount }: ListCardProps) {
  const router = useRouter()

  /**
   * Truncate description to specified length
   * 
   * Requirement: 5.2
   */
  const truncateDescription = (text: string | null, maxLength: number): string => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  /**
   * Format timestamp for display
   * 
   * Requirement: 5.6
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  /**
   * Handle card click to navigate to list detail
   * 
   * Requirement: 5.7
   */
  const handleClick = () => {
    router.push(`/lists/${list.id}`)
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{list.title}</CardTitle>
          {role === 'owner' ? (
            <Badge variant="default">Owner</Badge>
          ) : (
            <Badge variant="secondary">
              Shared ({role.charAt(0).toUpperCase() + role.slice(1)})
            </Badge>
          )}
        </div>
        {list.description && (
          <CardDescription>
            {truncateDescription(list.description, 100)}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {itemCount ? (
              `${itemCount.completed} / ${itemCount.total} completed`
            ) : (
              '0 / 0 completed'
            )}
          </span>
          <span>{formatTimestamp(list.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
