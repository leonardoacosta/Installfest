'use client'

import { useParams, useRouter } from 'next/navigation'
import { trpc } from '@/trpc/client'
import { Button } from '@homelab/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@homelab/ui/card'
import { Badge } from '@homelab/ui/badge'
import { Timeline, TimelineItem } from '@homelab/ui/data-display/timeline'
import { ArrowLeft, User, Bot, Cog, Clock, Activity } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

export default function LifecyclePage() {
  const params = useParams()
  const router = useRouter()
  const specId = params.id as string

  // Get lifecycle history for the spec
  const { data: lifecycleData, isLoading } = trpc.lifecycle.getStatus.useQuery({ specId })

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
    const config: Record<
      string,
      { variant: any; color: string; label: string }
    > = {
      proposing: { variant: 'secondary', color: 'bg-blue-500', label: 'Proposing' },
      approved: { variant: 'default', color: 'bg-green-500', label: 'Approved' },
      assigned: { variant: 'default', color: 'bg-yellow-500', label: 'Assigned' },
      in_progress: { variant: 'default', color: 'bg-orange-500', label: 'In Progress' },
      review: { variant: 'default', color: 'bg-purple-500', label: 'Review' },
      applied: { variant: 'outline', color: 'bg-green-600', label: 'Applied' },
      archived: { variant: 'outline', color: 'bg-gray-500', label: 'Archived' },
    }

    const { variant, color, label } = config[state] || config.proposing

    return (
      <Badge
        variant={variant as any}
        className={`${isCurrentState ? 'ring-2 ring-primary font-bold' : ''}`}
      >
        <div className={`h-2 w-2 rounded-full ${color} mr-1`} />
        {label}
      </Badge>
    )
  }

  const calculateDuration = (currentTransition: any, nextTransition: any) => {
    if (!currentTransition?.transitionedAt) return null
    const endTime = nextTransition?.transitionedAt
      ? new Date(nextTransition.transitionedAt)
      : new Date()
    const startTime = new Date(currentTransition.transitionedAt)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60))
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

    if (durationHours > 24) {
      const days = Math.floor(durationHours / 24)
      return `${days}d ${durationHours % 24}h`
    } else if (durationHours > 0) {
      return `${durationHours}h ${durationMinutes}m`
    } else {
      return `${durationMinutes}m`
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="h-5 w-5 animate-spin" />
          Loading lifecycle history...
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{specId}</h1>
            <p className="text-sm text-muted-foreground">Lifecycle Timeline</p>
          </div>
        </div>
        {lifecycleData?.currentState && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current State:</span>
            {getStateBadge(lifecycleData.currentState, true)}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 grid gap-4 md:grid-cols-3">
        {/* Timeline */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              State Transitions
            </CardTitle>
            <CardDescription>
              History of all state changes and who triggered them
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lifecycleData?.history && lifecycleData.history.length > 0 ? (
              <Timeline>
                {lifecycleData.history.map((item: any, index: number) => {
                  const isCurrentState = item.toState === lifecycleData.currentState
                  const nextTransition = lifecycleData.history[index + 1]
                  const duration = calculateDuration(item, nextTransition)

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
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Transitioned from </span>
                            <strong>{item.fromState || 'initial'}</strong>
                            <span className="text-muted-foreground"> to </span>
                            <strong>{item.toState}</strong>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-4">
                            <span>
                              {format(new Date(item.transitionedAt), 'MMM d, yyyy HH:mm')}
                            </span>
                            <span>
                              ({formatDistanceToNow(new Date(item.transitionedAt), { addSuffix: true })})
                            </span>
                          </div>
                          {duration && !isCurrentState && (
                            <div className="text-xs text-muted-foreground">
                              Duration in this state: <strong>{duration}</strong>
                            </div>
                          )}
                          {item.triggeredBy && (
                            <div className="text-xs text-muted-foreground">
                              Triggered by: <strong>{item.triggeredBy}</strong>
                              {item.triggeredByDetails && ` (${item.triggeredByDetails})`}
                            </div>
                          )}
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No lifecycle history available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar Stats */}
        <div className="space-y-4">
          {/* Task Completion */}
          {lifecycleData?.tasksCompletionPercentage !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Task Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {lifecycleData.tasksCompletionPercentage.toFixed(0)}%
                    </span>
                    <Badge variant={lifecycleData.tasksCompletionPercentage === 100 ? 'default' : 'secondary'}>
                      {lifecycleData.tasksCompletionPercentage === 100 ? 'Complete' : 'In Progress'}
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${lifecycleData.tasksCompletionPercentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lifecycle Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Transitions</span>
                <span className="font-medium">{lifecycleData?.history?.length || 0}</span>
              </div>
              {lifecycleData?.history && lifecycleData.history.length > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Started</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(lifecycleData.history[0].transitionedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {lifecycleData.currentState === 'applied' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completed</span>
                      <span className="font-medium">
                        {formatDistanceToNow(
                          new Date(lifecycleData.history[lifecycleData.history.length - 1].transitionedAt),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Manual vs Automatic */}
          {lifecycleData?.history && lifecycleData.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transition Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['user', 'worker', 'system'].map((type) => {
                  const count = lifecycleData.history.filter((h: any) => h.triggeredBy === type).length
                  if (count === 0) return null
                  return (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        {getTriggeredByIcon(type)}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
