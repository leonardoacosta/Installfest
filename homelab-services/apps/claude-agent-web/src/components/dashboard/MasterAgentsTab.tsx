'use client'

import { useState } from 'react'
import { trpc } from '@/trpc/client'
import { Button } from '@homelab/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@homelab/ui/card'
import { Badge } from '@homelab/ui/badge'
import { Progress } from '@homelab/ui/progress'
import { Play, Pause, Square, Bot, Activity, ExternalLink, User, Clock, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import type { DashboardFilters } from '@/app/(dashboard)/dashboard/page'
import { WorkerDetailModal } from './WorkerDetailModal'

interface MasterAgentsTabProps {
  filters: DashboardFilters
}

export function MasterAgentsTab({ filters }: MasterAgentsTabProps) {
  const projectId = filters.projectId || 1
  const utils = trpc.useUtils()
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)

  // Fetch active workers
  const { data: workers, isLoading } = trpc.workerAgent.listActive.useQuery({
    projectId,
  })

  // Subscribe to worker events for real-time updates
  trpc.workerAgent.subscribe.useSubscription(
    { projectId },
    {
      onData: (event) => {
        console.log('[MasterAgentsTab] Worker event:', event)

        // Invalidate queries to refresh data
        utils.workerAgent.listActive.invalidate()

        // Show toast notification for important events
        if (event.event === 'worker_spawned') {
          toast.success(`Worker spawned: ${event.data?.agentType || 'unknown'}`)
        } else if (event.event === 'worker_completed') {
          toast.success(`Worker completed: ${event.workerId}`)
        } else if (event.event === 'worker_failed') {
          toast.error(`Worker failed: ${event.workerId}`)
        }
      },
      onError: (err) => {
        console.error('[MasterAgentsTab] Subscription error:', err)
      },
    }
  )

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; color: string; label: string }> = {
      spawned: { variant: 'secondary', color: 'bg-blue-500', label: 'Spawned' },
      active: { variant: 'default', color: 'bg-green-500', label: 'Working' },
      completed: { variant: 'outline', color: 'bg-gray-500', label: 'Completed' },
      failed: { variant: 'destructive', color: 'bg-red-500', label: 'Failed' },
      cancelled: { variant: 'outline', color: 'bg-gray-500', label: 'Cancelled' },
    }

    const { variant, color, label } = config[status] || config.cancelled

    return (
      <Badge variant={variant as any} className="flex items-center gap-1">
        <div className={`h-2 w-2 rounded-full ${color}`} />
        {label}
      </Badge>
    )
  }

  const getAgentTypeLabel = (agentType: string) => {
    const labels: Record<string, string> = {
      't3-stack-developer': 'T3 Stack',
      'e2e-test-engineer': 'E2E Tests',
      'database-architect': 'Database',
      'ux-design-specialist': 'UX Design',
      'docker-network-architect': 'Docker',
      'redis-cache-architect': 'Redis Cache',
      'general-purpose': 'General',
    }
    return labels[agentType] || agentType
  }

  const handleCancelWorker = async (workerId: string) => {
    try {
      await utils.client.workerAgent.cancel.mutate({ workerId })
      toast.success('Worker cancelled')
      utils.workerAgent.listActive.invalidate()
    } catch (error) {
      toast.error('Failed to cancel worker')
      console.error(error)
    }
  }

  const handleRetryWorker = async (workerId: string) => {
    try {
      await utils.client.workerAgent.retry.mutate({ workerId })
      toast.success('Worker retry initiated')
      utils.workerAgent.listActive.invalidate()
    } catch (error) {
      toast.error('Failed to retry worker')
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Active Workers
          </CardTitle>
          <CardDescription>
            Worker agents spawned by master sessions to execute specialized tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading workers...
            </div>
          ) : workers && workers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workers.map((worker: any) => (
                <Card
                  key={worker.id}
                  className="relative transition-all duration-200 hover:shadow-lg hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {getAgentTypeLabel(worker.agentType)}
                      </Badge>
                      {getStatusBadge(worker.status)}
                    </div>
                    <CardTitle className="text-sm font-mono truncate" title={worker.id}>
                      {worker.id.slice(0, 12)}...
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Spec Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <ExternalLink className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate" title={worker.specId}>
                          {worker.specId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span>Session {worker.sessionId}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {worker.startedAt
                            ? `Started ${formatDistanceToNow(new Date(worker.startedAt), { addSuffix: true })}`
                            : `Spawned ${formatDistanceToNow(new Date(worker.spawnedAt), { addSuffix: true })}`}
                        </span>
                      </div>
                    </div>

                    {/* Progress (if active) */}
                    {worker.status === 'active' && worker.progress && (
                      <div className="space-y-2 animate-pulse">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Activity className="h-3 w-3 animate-spin" />
                            Progress
                          </span>
                          <span className="font-medium">{worker.progress.completionPercentage || 0}%</span>
                        </div>
                        <Progress value={worker.progress.completionPercentage || 0} className="animate-pulse" />
                      </div>
                    )}

                    {/* Error Message */}
                    {worker.status === 'failed' && worker.errorMessage && (
                      <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                        {worker.errorMessage}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {worker.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleCancelWorker(worker.id)}
                        >
                          <Square className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                      {worker.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleRetryWorker(worker.id)}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                      {(worker.status === 'completed' || worker.status === 'cancelled' || worker.status === 'active') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setSelectedWorkerId(worker.id)}
                        >
                          <Activity className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active workers for this project</p>
              <p className="text-xs mt-2">Workers are spawned automatically when sessions process work items</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clarifications Panel - Placeholder for future implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Clarifications Panel</CardTitle>
          <CardDescription>
            Pending clarifications from master agents requiring user input
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No pending clarifications
            <p className="text-xs mt-2">
              Clarifications will appear here when workers need user input to proceed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Worker Detail Modal */}
      {selectedWorkerId && (
        <WorkerDetailModal
          workerId={selectedWorkerId}
          open={!!selectedWorkerId}
          onOpenChange={(open) => !open && setSelectedWorkerId(null)}
        />
      )}
    </div>
  )
}
