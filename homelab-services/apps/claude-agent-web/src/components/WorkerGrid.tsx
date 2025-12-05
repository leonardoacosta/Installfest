'use client'

import { trpc } from '@/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@homelab/ui/card'
import { Badge } from '@homelab/ui/badge'
import { Button } from '@homelab/ui/button'
import { Progress } from '@homelab/ui/progress'
import {
  Bot,
  Clock,
  FileEdit,
  Play,
  XCircle,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Eye
} from 'lucide-react'
import { cn } from '@homelab/ui/utils'
import { useState, useEffect } from 'react'
import { WorkerDetailModal } from './WorkerDetailModal'
import { toast } from '@homelab/ui/use-toast'

interface WorkerGridProps {
  sessionId?: number
  specId?: string
  projectId?: number
}

export function WorkerGrid({ sessionId, specId, projectId }: WorkerGridProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)

  const { data: workers, isLoading } = trpc.workerAgent.listActive.useQuery({
    sessionId,
    specId,
    projectId,
  })

  const utils = trpc.useUtils()

  // Subscribe to worker events for real-time updates
  trpc.workerAgent.subscribe.useSubscription(
    { sessionId, specId, projectId },
    {
      onData: (event) => {
        // Invalidate queries to refetch latest data
        utils.workerAgent.listActive.invalidate()

        // Show toast notifications for important events
        switch (event.event) {
          case 'worker_spawned':
            toast({
              title: 'Worker Spawned',
              description: `New ${event.data?.agentType || 'worker'} agent started`,
            })
            break
          case 'worker_completed':
            toast({
              title: 'Worker Completed',
              description: 'Worker finished all tasks successfully',
            })
            break
          case 'worker_failed':
            toast({
              title: 'Worker Failed',
              description: event.data?.errorMessage || 'Worker encountered an error',
              variant: 'destructive',
            })
            break
        }
      },
      onError: (error) => {
        console.error('Worker subscription error:', error)
      },
    }
  )

  // Auto-refresh every 10 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      utils.workerAgent.listActive.invalidate()
    }, 10000)

    return () => clearInterval(interval)
  }, [utils])

  const cancelWorker = trpc.workerAgent.cancel.useMutation({
    onSuccess: () => {
      utils.workerAgent.listActive.invalidate()
    },
  })

  const retryWorker = trpc.workerAgent.retry.useMutation({
    onSuccess: () => {
      utils.workerAgent.listActive.invalidate()
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
      case 'spawned':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400'
      case 'completed':
        return 'bg-gray-500/10 border-gray-500/20 text-gray-700 dark:text-gray-400'
      case 'failed':
        return 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
      case 'cancelled':
        return 'bg-gray-500/10 border-gray-500/20 text-gray-700 dark:text-gray-400'
      default:
        return 'bg-gray-500/10 border-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />
      case 'spawned':
        return <Clock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  const formatElapsedTime = (spawnedAt: Date, completedAt?: Date | null) => {
    const start = new Date(spawnedAt)
    const end = completedAt ? new Date(completedAt) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`
    } else if (diffMins > 0) {
      return `${diffMins}m ${diffSecs % 60}s`
    }
    return `${diffSecs}s`
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading workers...
      </div>
    )
  }

  if (!workers || workers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No workers active</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Worker agents will appear here when spawned for implementation work.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workers.map((worker) => (
          <Card
            key={worker.id}
            className={cn(
              'transition-all hover:shadow-md',
              getStatusColor(worker.status)
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getStatusIcon(worker.status)}
                    <span className="font-mono text-xs">{worker.id.slice(0, 12)}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    <Badge variant="outline" className="text-xs">
                      {worker.agentType}
                    </Badge>
                  </CardDescription>
                </div>
                <Badge variant={worker.status === 'active' ? 'default' : 'secondary'}>
                  {worker.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Spec Link */}
              <div className="text-sm">
                <span className="text-muted-foreground">Spec: </span>
                <span className="font-medium">{worker.specId}</span>
              </div>

              {/* Time Elapsed */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {worker.status === 'active' || worker.status === 'spawned'
                    ? `Working for ${formatElapsedTime(worker.spawnedAt)}`
                    : formatElapsedTime(worker.spawnedAt, worker.completedAt)}
                </span>
              </div>

              {/* Retry Count */}
              {worker.retryCount > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <RotateCcw className="h-3 w-3 text-orange-500" />
                  <span className="text-orange-600 dark:text-orange-400">
                    Retry attempt {worker.retryCount}
                  </span>
                </div>
              )}

              {/* Error Message */}
              {worker.errorMessage && (
                <div className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                  {worker.errorMessage}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedWorkerId(worker.id)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Details
                </Button>

                {worker.status === 'failed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retryWorker.mutate({ workerId: worker.id })}
                    disabled={retryWorker.isPending}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}

                {(worker.status === 'active' || worker.status === 'spawned') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cancelWorker.mutate({ workerId: worker.id })}
                    disabled={cancelWorker.isPending}
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Worker Detail Modal */}
      {selectedWorkerId && (
        <WorkerDetailModal
          workerId={selectedWorkerId}
          onClose={() => setSelectedWorkerId(null)}
        />
      )}
    </>
  )
}
