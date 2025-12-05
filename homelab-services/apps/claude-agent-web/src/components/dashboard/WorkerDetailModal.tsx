'use client'

import { trpc } from '@/trpc/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@homelab/ui/dialog'
import { Badge } from '@homelab/ui/badge'
import { Progress } from '@homelab/ui/progress'
import { Separator } from '@homelab/ui/separator'
import { ScrollArea } from '@homelab/ui/scroll-area'
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileEdit,
  TestTube,
  Activity,
  Zap,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface WorkerDetailModalProps {
  workerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkerDetailModal({ workerId, open, onOpenChange }: WorkerDetailModalProps) {
  // Fetch worker status
  const { data: worker, isLoading: loadingStatus } = trpc.workerAgent.getStatus.useQuery(
    { workerId },
    { enabled: open }
  )

  // Fetch worker progress
  const { data: progress, isLoading: loadingProgress } = trpc.workerAgent.getProgress.useQuery(
    { workerId },
    { enabled: open }
  )

  // Fetch hook timeline
  const { data: hooks, isLoading: loadingHooks } = trpc.workerAgent.getHookTimeline.useQuery(
    { workerId, limit: 50 },
    { enabled: open }
  )

  const isLoading = loadingStatus || loadingProgress || loadingHooks

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="font-mono truncate" title={workerId}>
              Worker: {workerId.slice(0, 16)}...
            </span>
            {worker && getStatusBadge(worker.status)}
          </DialogTitle>
          <DialogDescription>
            {worker && `Agent Type: ${worker.agentType} • Session: ${worker.sessionId}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading worker details...</span>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Progress Metrics */}
              {progress && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Progress Metrics</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tools Executed</span>
                        <span className="font-medium">{progress.toolsExecuted || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Success Rate</span>
                        <span className="font-medium">
                          {progress.successRate ? `${Math.round(progress.successRate)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <FileEdit className="h-3 w-3" />
                          Files Changed
                        </span>
                        <span className="font-medium">{progress.filesChanged?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <TestTube className="h-3 w-3" />
                          Tests Run
                        </span>
                        <span className="font-medium">{progress.testsRun || 0}</span>
                      </div>
                    </div>
                  </div>

                  {progress.completionPercentage !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Task Completion</span>
                        <span className="font-medium">{progress.completionPercentage}%</span>
                      </div>
                      <Progress value={progress.completionPercentage} />
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Timing Information */}
              {worker && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Timing</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Spawned
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(worker.spawnedAt), { addSuffix: true })}
                      </span>
                    </div>
                    {worker.startedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Started
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(worker.startedAt), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                    {worker.completedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          {worker.status === 'failed' ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {worker.status === 'failed' ? 'Failed' : 'Completed'}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(worker.completedAt), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                    {worker.retryCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Retry Count</span>
                        <span>{worker.retryCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {worker?.errorMessage && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-destructive">Error</h3>
                    <div className="text-xs bg-destructive/10 text-destructive p-3 rounded">
                      {worker.errorMessage}
                    </div>
                  </div>
                </>
              )}

              {/* Files Changed */}
              {progress?.filesChanged && progress.filesChanged.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Files Changed ({progress.filesChanged.length})</h3>
                    <ScrollArea className="h-32 rounded border p-2">
                      <ul className="space-y-1 text-xs font-mono">
                        {progress.filesChanged.map((file: string, idx: number) => (
                          <li key={idx} className="text-muted-foreground">
                            {file}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                </>
              )}

              {/* Hook Timeline */}
              {hooks && hooks.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Hook Timeline (Last {hooks.length} events)</h3>
                    <ScrollArea className="h-64 rounded border">
                      <div className="space-y-1 p-2">
                        {hooks.map((hook: any) => (
                          <div
                            key={hook.hookId}
                            className="flex items-start gap-2 text-xs p-2 hover:bg-muted/50 rounded"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {hook.success ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-medium">{hook.toolName}</span>
                                <span className="text-muted-foreground">
                                  {hook.durationMs ? `${hook.durationMs}ms` : 'N/A'}
                                </span>
                              </div>
                              <div className="text-muted-foreground">
                                {formatDistanceToNow(new Date(hook.timestamp), { addSuffix: true })}
                              </div>
                              {hook.errorMessage && (
                                <div className="text-destructive mt-1">{hook.errorMessage}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
