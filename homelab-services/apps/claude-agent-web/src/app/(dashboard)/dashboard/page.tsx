'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@homelab/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@homelab/ui/card'
import { WorkQueueTab } from '@/components/dashboard/WorkQueueTab'
import { ApprovalsTab } from '@/components/dashboard/ApprovalsTab'
import { MasterAgentsTab } from '@/components/dashboard/MasterAgentsTab'
import { LifecycleTab } from '@/components/dashboard/LifecycleTab'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { FilterSidebar } from '@/components/dashboard/FilterSidebar'
import { Toaster } from 'react-hot-toast'

export type DashboardFilters = {
  projectId?: number
  status?: string[]
  priority?: [number, number]
  dateRange?: { from: Date; to: Date }
  search?: string
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<DashboardFilters>({})

  // Initialize active tab from URL or default to 'work-queue'
  const tabFromUrl = searchParams.get('tab') || 'work-queue'
  const [activeTab, setActiveTab] = useState(tabFromUrl)

  // Sync activeTab with URL on mount and when URL changes
  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'work-queue'
    setActiveTab(currentTab)
  }, [searchParams])

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex h-full">
        {/* Filter Sidebar */}
        <FilterSidebar filters={filters} onFiltersChange={setFilters} />

        {/* Main Content */}
        <div className="flex-1 space-y-6 p-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Unified view of work queue, approvals, master agents, and lifecycle
            </p>
          </div>

          {/* Stats Cards */}
          <StatsCards filters={filters} />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList>
              <TabsTrigger value="work-queue">Work Queue</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
              <TabsTrigger value="master-agents">Master Agents</TabsTrigger>
              <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
            </TabsList>

            <TabsContent value="work-queue" className="space-y-4">
              <WorkQueueTab filters={filters} />
            </TabsContent>

            <TabsContent value="approvals" className="space-y-4">
              <ApprovalsTab filters={filters} />
            </TabsContent>

            <TabsContent value="master-agents" className="space-y-4">
              <MasterAgentsTab filters={filters} />
            </TabsContent>

            <TabsContent value="lifecycle" className="space-y-4">
              <LifecycleTab filters={filters} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
