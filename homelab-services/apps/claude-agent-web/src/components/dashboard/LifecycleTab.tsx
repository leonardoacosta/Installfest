'use client'

import { useState } from 'react'
import { trpc } from '@/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@homelab/ui/card'
import { Label } from '@homelab/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@homelab/ui/select'
import { Badge } from '@homelab/ui/badge'
import { Timeline, TimelineItem } from '@homelab/ui/data-display/timeline'
import { formatDistanceToNow } from 'date-fns'
import type { DashboardFilters } from '@/app/(dashboard)/dashboard/page'
import { User, Bot, Cog } from 'lucide-react'

interface LifecycleTabProps {
  filters: DashboardFilters
}

export function LifecycleTab({ filters }: LifecycleTabProps) {
  const projectId = filters.projectId || 1
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null)
  const utils = trpc.useUtils()

  // Get list of specs for the project
  const { data: workQueue } = trpc.workQueue.getQueue.useQuery({ projectId })

  // Get lifecycle history for selected spec
  const { data: lifecycleData, isLoading } = trpc.lifecycle.getStatus.useQuery(
    { specId: selectedSpecId! },
    { enabled: !!selectedSpecId }
  )

  // Subscribe to lifecycle events for real-time updates
  trpc.lifecycle.subscribe.useSubscription(
    { projectId },
    {
      onData: (event) => {
        console.log('[LifecycleTab] Lifecycle event:', event)

        // If event is for the currently selected spec, refresh its history
        if (event.event === 'state_changed' && event.data?.specId === selectedSpecId) {
          utils.lifecycle.getStatus.invalidate({ specId: selectedSpecId })
        }
      },
      onError: (err) => {
        console.error('[LifecycleTab] Subscription error:', err)
      },
    }
  )

  const getTriggeredByIcon = (triggeredBy: string) => {
    switch (triggeredBy) {
      case 'user':
        return <User className="h-4 w-4 text-blue-500" />
      case 'worker':
        return <Bot className="h-4 w-4 text-purple-500" />
      case 'system':
        return <Cog className="h-4 w-4 text-gray-500" />
      default:
        return <Cog className="h-4 w-4 text-gray-500" />
    }
  }

  const getStateBadge = (state: string, isCurrentState: boolean) => {
    const variants: Record<string, any> = {
      proposing: 'default',
      approved: 'secondary',
      assigned: 'secondary',
      in_progress: 'default',
      review: 'default',
      applied: 'success',
      archived: 'outline',
    }

    return (
      <Badge
        variant={variants[state] || 'default'}
        className={isCurrentState ? 'ring-2 ring-primary' : ''}
      >
        {state}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lifecycle Timeline</CardTitle>
          <CardDescription>
            Visual timeline of spec state transitions and history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Spec</Label>
            <Select value={selectedSpecId || ''} onValueChange={setSelectedSpecId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a spec to view its lifecycle" />
              </SelectTrigger>
              <SelectContent>
                {workQueue?.map((item: any) => (
                  <SelectItem key={item.specId} value={item.specId}>
                    {item.specTitle || item.specId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedSpecId ? (
            <div className="text-center py-8 text-muted-foreground">
              Select a spec to view its lifecycle timeline
            </div>
          ) : isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : lifecycleData?.history && lifecycleData.history.length > 0 ? (
            <div className="mt-6">
              <Timeline>
                {lifecycleData.history.map((item: any, index: number) => {
                  const isCurrentState = item.toState === lifecycleData.currentState
                  return (
                    <TimelineItem
                      key={index}
                      title={
                        <div className="flex items-center gap-2">
                          {getStateBadge(item.toState, isCurrentState)}
                          {getTriggeredByIcon(item.triggeredBy)}
                        </div>
                      }
                      description={
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">
                            Transitioned from <strong>{item.fromState || 'initial'}</strong> to{' '}
                            <strong>{item.toState}</strong>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.transitionedAt), {
                              addSuffix: true,
                            })}
                          </div>
                          {item.notes && (
                            <div className="text-sm mt-2 p-2 bg-muted rounded">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      }
                      active={isCurrentState}
                    />
                  )
                })}
              </Timeline>

              {lifecycleData.tasksCompletionPercentage !== undefined && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Task Completion</span>
                    <span className="text-sm font-bold">
                      {lifecycleData.tasksCompletionPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${lifecycleData.tasksCompletionPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No lifecycle history available for this spec
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
