'use client'

import { trpc } from '@/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@homelab/ui/card'
import { ArrowUp, ArrowDown, Circle, CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import type { DashboardFilters } from '@/app/(dashboard)/dashboard/page'

interface StatsCardsProps {
  filters: DashboardFilters
}

export function StatsCards({ filters }: StatsCardsProps) {
  const projectId = filters.projectId || 1

  const { data: stats } = trpc.workQueue.stats.useQuery({ projectId })
  const { data: lifecycleStats } = trpc.lifecycle.stats.useQuery({ projectId })
  const { data: errorStats } = trpc.errorProposals.stats.useQuery()

  const totalSpecs = lifecycleStats?.total || 0
  const activeWork = stats?.totalAssigned || 0
  const pendingApprovals = (lifecycleStats?.proposing || 0) + (lifecycleStats?.review || 0)
  const errorProposals = errorStats?.pendingReview || 0

  // Mock trend data - would come from historical stats in real implementation
  const trends = {
    specs: 12,
    active: -5,
    approvals: 8,
    errors: 15,
  }

  const renderTrend = (value: number) => {
    if (value === 0) return null
    const Icon = value > 0 ? ArrowUp : ArrowDown
    const color = value > 0 ? 'text-green-600' : 'text-red-600'
    return (
      <div className={`flex items-center gap-1 text-sm ${color}`}>
        <Icon className="h-3 w-3" />
        <span>{Math.abs(value)}%</span>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Specs</CardTitle>
          <Circle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSpecs}</div>
          {renderTrend(trends.specs)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Work</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeWork}</div>
          {renderTrend(trends.active)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <Lock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingApprovals}</div>
          {renderTrend(trends.approvals)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Error Proposals</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{errorProposals}</div>
          {renderTrend(trends.errors)}
        </CardContent>
      </Card>
    </div>
  )
}
