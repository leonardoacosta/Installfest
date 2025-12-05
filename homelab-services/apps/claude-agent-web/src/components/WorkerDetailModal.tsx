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
import { Button } from '@homelab/ui/button'
import { Progress } from '@homelab/ui/progress'
import { Separator } from '@homelab/ui/separator'
import {
  Bot,
  Clock,
  FileEdit,
  CheckCircle,
  XCircle,
  RotateCcw,
  ExternalLink,
  TestTube,
  Activity
} from 'lucide-react'
import { cn } from '@homelab/ui/utils'

interface WorkerDetailModalProps {
  workerId: string
  onClose: () => void
}

export function WorkerDetailModal({ workerId, onClose }: WorkerDetailModalProps) {
  const { data: status } = trpc.workerAgent.getStatus.useQuery({ workerId })
  const { data: progress } = trpc.workerAgent.getProgress.useQuery({ workerId })
  const { data: hooks } = trpc.workerAgent.getHookTimeline.useQuery({
    workerId,
    limit: 20,
  })

  const utils = trpc.useUtils()

  const retryWorker = trpc.workerAgent.retry.useMutation({
    onSuccess: () => {
      utils.workerAgent.getStatus.invalidate({ workerId })
      utils.workerAgent.listActive.invalidate()
      onClose()
    },
  })

  const cancelWorker = trpc.workerAgent.cancel.useMutation({
    onSuccess: () => {
      utils.workerAgent.getStatus.invalidate({ workerId })
      utils.workerAgent.listActive.invalidate()
      onClose()
    },
  })

  if (!status || !progress) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading worker details...
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const formatElapsedTime = (ms: number) => {
    const secs = Math.floor(ms / 1000)
    const mins = Math.floor(secs / 60)
    const hours = Math.floor(mins / 60)

    if (hours > 0) {
      return `${hours}h ${mins % 60}m ${secs % 60}s`
    } else if (mins > 0) {
      return `${mins}m ${secs % 60}s`
    }
    return `${secs}s`
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Worker {workerId.slice(0, 12)}
              </DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{status.agentType}</Badge>
                  <Badge variant={status.status === 'active' ? 'default' : 'secondary'}>
                    {status.status}
                  </Badge>
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Spec Information */}
          <div>
            <h3 className="text-sm font-medium mb-2">Specification</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Working on:</span>
              <span className="font-mono font-medium">{status.specId}</span>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Progress Metrics */}
          <div>
            <h3 className="text-sm font-medium mb-3">Progress</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Tools Executed</div>
                <div className="text-2xl font-bold">{progress.toolsExecuted}</div>
                <div className="text-xs text-muted-foreground">
                  {progress.successRate.toFixed(0)}% success
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Files Changed</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <FileEdit className="h-4 w-4" />
                  {progress.filesChanged.length}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Tests Run</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <TestTube className="h-4 w-4" />
                  {progress.testsRun}
                </div>
                {progress.testsPassed !== null && (
                  <div className="text-xs text-muted-foreground">
                    {progress.testsPassed} passed
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Time Elapsed</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatElapsedTime(progress.elapsedMs).split(' ')[0]}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatElapsedTime(progress.elapsedMs).split(' ').slice(1).join(' ')}
                </div>
              </div>
            </div>

            {/* Task Completion */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Task Completion</span>
                <span className="font-medium">
                  {progress.taskCompletion.completed}/{progress.taskCompletion.total}
                </span>
              </div>
              <Progress value={progress.taskCompletion.percentage} />
            </div>

            {/* Current Tool */}
            {progress.currentTool && status.status === 'active' && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 animate-pulse text-green-500" />
                <span className="text-muted-foreground">Currently:</span>
                <span className="font-medium">{progress.currentTool}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Files Changed */}
          {progress.filesChanged.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2">Modified Files</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {progress.filesChanged.map((file) => (
                    <div
                      key={file}
                      className="text-xs font-mono bg-muted px-2 py-1 rounded"
                    >
                      {file}
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Hook Timeline */}
          {hooks && hooks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Recent Activity</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {hooks.map((hook) => (
                  <div
                    key={hook.hookId}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg border text-xs',
                      hook.success
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {hook.success ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                      <span className="font-medium">{hook.toolName}</span>
                      {hook.errorMessage && (
                        <span className="text-red-600 text-xs line-clamp-1">
                          {hook.errorMessage}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{hook.durationMs}ms</span>
                      <span>
                        {new Date(hook.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {status.errorMessage && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
                  Error Details
                </h3>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {status.errorMessage}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Retry Information */}
          {status.retryCount > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400">
                <RotateCcw className="h-4 w-4" />
                <span>This is retry attempt {status.retryCount}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {status.status === 'failed' && (
              <Button
                onClick={() => retryWorker.mutate({ workerId })}
                disabled={retryWorker.isPending}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Worker
              </Button>
            )}

            {(status.status === 'active' || status.status === 'spawned') && (
              <Button
                variant="destructive"
                onClick={() => cancelWorker.mutate({ workerId })}
                disabled={cancelWorker.isPending}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Worker
              </Button>
            )}

            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
