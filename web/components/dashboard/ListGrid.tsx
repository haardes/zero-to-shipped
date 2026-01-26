'use client'

import { useEffect, useState } from 'react'
import { getListsForUser } from '@/lib/supabase/lists'
import { supabase } from '@/lib/supabase/client'
import type { TodoList } from '@/types/todo'
import { ListCard } from './ListCard'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface ListWithMetadata {
  list: TodoList
  role: 'owner' | 'editor' | 'viewer'
  itemCount: {
    completed: number
    total: number
  }
}

/**
 * ListGrid Component
 * 
 * Fetches and displays all accessible lists in a grid layout.
 * Each list is rendered as a ListCard with role and item count information.
 * Shows loading skeleton while fetching data.
 * 
 * Requirements: 4.7, 21.1
 */
export function ListGrid() {
  const [lists, setLists] = useState<ListWithMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLists() {
      try {
        setIsLoading(true)
        setError(null)

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setError('User not authenticated')
          return
        }

        // Fetch lists
        const result = await getListsForUser(user.id)
        
        if (!result.success) {
          setError(result.error)
          return
        }

        // Fetch metadata for each list (role and item counts)
        const listsWithMetadata = await Promise.all(
          result.data.map(async (list) => {
            // Determine role
            let role: 'owner' | 'editor' | 'viewer' = 'owner'
            
            if (list.ownerUserId !== user.id) {
              // User is not owner, check membership
              type MembershipRole = { role: 'owner' | 'editor' | 'viewer' }
              const { data: membership, error: membershipError } = await supabase
                .from('list_membership')
                .select('role')
                .eq('list_id', list.id)
                .eq('user_id', user.id)
                .maybeSingle() as { data: MembershipRole | null; error: any }
              
              if (!membershipError && membership) {
                role = membership.role
              }
            }

            // Fetch item counts
            const { count: totalItems } = await supabase
              .from('todo_item')
              .select('*', { count: 'exact', head: true })
              .eq('list_id', list.id)

            const { count: completedItems } = await supabase
              .from('todo_item')
              .select('*', { count: 'exact', head: true })
              .eq('list_id', list.id)
              .eq('status', 'completed')

            return {
              list,
              role,
              itemCount: {
                completed: completedItems || 0,
                total: totalItems || 0,
              },
            }
          })
        )

        setLists(listsWithMetadata)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lists')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLists()
  }, [])

  if (isLoading) {
    return <ListGridSkeleton />
  }

  if (error) {
    return (
      <div className="text-destructive text-sm">
        Failed to load lists: {error}
      </div>
    )
  }

  if (lists.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No lists yet. Create your first list to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {lists.map(({ list, role, itemCount }) => (
        <ListCard
          key={list.id}
          list={list}
          role={role}
          itemCount={itemCount}
        />
      ))}
    </div>
  )
}

/**
 * Loading skeleton for ListGrid
 * 
 * Displays placeholder cards while lists are being fetched.
 * 
 * Requirement: 21.1
 */
function ListGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
            </div>
            <div className="h-4 w-full bg-muted animate-pulse rounded mt-2" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
