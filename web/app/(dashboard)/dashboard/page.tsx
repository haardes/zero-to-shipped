'use client'

import { useState } from 'react'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { ListGrid } from '@/components/dashboard/ListGrid'
import { CreateListModal } from '@/components/dashboard/CreateListModal'
import { InvitationList } from '@/components/dashboard/InvitationList'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'

/**
 * Dashboard Page
 * 
 * Main dashboard view displaying:
 * - Pending invitations (if any)
 * - Dashboard statistics (owned lists, shared lists, total items, completion %)
 * - Create List button that opens modal
 * - Grid of all accessible lists
 * 
 * Requirements: 4.1, 4.7, 6.1, 16.2, 16.3
 */
export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  /**
   * Handle successful list creation
   * 
   * Triggers a refresh of the dashboard by updating the key.
   * This causes both DashboardStats and ListGrid to re-fetch their data.
   */
  function handleListCreated() {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your todo lists and track your progress
          </p>
        </div>
        
        {/* Create List Button - Requirement 6.1 */}
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create List
        </Button>
      </div>

      {/* Dashboard Statistics - Requirements 4.2, 4.3, 4.4, 4.5, 4.6 */}
      <DashboardStats key={`stats-${refreshKey}`} />

      {/* Pending Invitations - Requirements 16.2, 16.3 */}
      <InvitationList key={`invitations-${refreshKey}`} />

      {/* Lists Grid - Requirement 4.7 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Lists</h2>
        <ListGrid key={`grid-${refreshKey}`} />
      </div>

      {/* Create List Modal */}
      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleListCreated}
      />
    </div>
  )
}
