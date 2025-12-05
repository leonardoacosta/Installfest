'use client'

import { trpc } from '@/trpc/client'
import { Button } from '@homelab/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@homelab/ui/card'
import { Badge } from '@homelab/ui/badge'
import { Play, Pause, Square, Bot, Activity } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import type { DashboardFilters } from '@/app/(dashboard)/dashboard/page'

interface MasterAgentsTabProps {
  filters: DashboardFilters
}

export function MasterAgentsTab({ filters }: MasterAgentsTabProps) {
  const projectId = filters.projectId || 1

  // For now, display a placeholder until master agent coordination is fully implemented
  // This would use a masterAgent router when available
  const { data: sessions } = trpc.sessions.list.useQuery()
  const activeSessions = sessions?.filter((s: any) => s.projectId === projectId)

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; color: string }> = {
      running: { variant: 'default', color: 'bg-green-500' },
      idle: { variant: 'secondary', color: 'bg-yellow-500' },
      paused: { variant: 'outline', color: 'bg-red-500' },
      stopped: { variant: 'outline', color: 'bg-gray-500' },
    }

    const { variant, color } = config[status] || config.stopped

    return (
      <Badge variant={variant as any} className="flex items-center gap-1">
        <div className={`h-2 w-2 rounded-full ${color}`} />
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Master Agents
          </CardTitle>
          <CardDescription>
            Autonomous agents coordinating work queue execution across the project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeSessions && activeSessions.length > 0 ? (
              activeSessions.map((session: any) => (
                <Card key={session.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Session {session.id}</CardTitle>
                      {getStatusBadge(session.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        <span>
                          Last activity:{' '}
                          {formatDistanceToNow(new Date(session.lastActivityAt || session.startedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled
                      >
                        <Square className="h-3 w-3 mr-1" />
                        Stop
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active master agents for this project</p>
                <Button className="mt-4" disabled>
                  <Play className="h-4 w-4 mr-2" />
                  Start Master Agent
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
