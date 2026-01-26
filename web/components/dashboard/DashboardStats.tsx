'use client'

import { useEffect, useState } from 'react'
import { getDashboardStats } from '@/lib/supabase/stats'
import { supabase } from '@/lib/supabase/client'
import type { DashboardStats as Stats } from '@/types/todo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * DashboardStats Component
 * 
 * Displays aggregate statistics for the user's dashboard including:
 * - Total owned lists count
 * - Total shared lists count
 * - Total items across all accessible lists
 * - Completion percentage
 * 
 * Shows loading skeleton while fetching data and handles "No items yet" case.
 * 
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 21.1
 */
export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        setError(null)

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setError('User not authenticated')
          return
        }

        // Fetch dashboard statistics
        const result = await getDashboardStats(user.id)
        
        if (result.success) {
          setStats(result.data)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return <DashboardStatsSkeleton />
  }

  if (error) {
    return (
      <div className="text-destructive text-sm">
        Failed to load statistics: {error}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Owned Lists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.ownedListsCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Shared Lists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.sharedListsCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.totalItems === 0 ? (
            <div className="text-sm text-muted-foreground">No items yet</div>
          ) : (
            <div className="text-2xl font-bold">{stats.completionPercentage}%</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Loading skeleton for DashboardStats
 * 
 * Displays placeholder cards while statistics are being fetched.
 * 
 * Requirement: 21.1
 */
function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
