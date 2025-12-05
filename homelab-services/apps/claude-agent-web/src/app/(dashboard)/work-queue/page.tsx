'use client'

import { useState } from 'react'
import { trpc } from '@/trpc/client'
import { Button } from '@homelab/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@homelab/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@homelab/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@homelab/ui/select'
import { Badge } from '@homelab/ui/badge'
import { CheckCircle2, Circle, Lock, AlertCircle, Star, Bot, User } from 'lucide-react'
import { toast } from '@homelab/ui/use-toast'

export default function WorkQueuePage() {
  const [selectedProject, setSelectedProject] = useState<string>('all')

  const utils = trpc.useUtils()
  const { data: projects } = trpc.projects.list.useQuery()
  const { data: sessions } = trpc.sessions.list.useQuery()
  const { data: workQueue, isLoading } = trpc.workQueue.getQueue.useQuery(
    selectedProject !== 'all' ? { projectId: parseInt(selectedProject) } : { projectId: 1 }
  )
  const { data: stats } = trpc.workQueue.stats.useQuery(
    selectedProject !== 'all' ? { projectId: parseInt(selectedProject) } : { projectId: 1 }
  )

  const spawnWorker = trpc.workerAgent.spawn.useMutation({
    onSuccess: () => {
      utils.workQueue.getQueue.invalidate()
      utils.workerAgent.listActive.invalidate()
      toast({
        title: 'Worker spawned',
        description: 'A specialized worker agent has been spawned for this spec.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to spawn worker',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const completeItem = trpc.workQueue.complete.useMutation({
    onSuccess: () => {
      utils.workQueue.getQueue.invalidate()
      utils.workQueue.stats.invalidate()
      toast({
        title: 'Work item completed',
        description: 'The work item has been marked as completed.',
      })
    },
  })

  const removeItem = trpc.workQueue.remove.useMutation({
    onSuccess: () => {
      utils.workQueue.getQueue.invalidate()
      utils.workQueue.stats.invalidate()
      toast({
        title: 'Work item removed',
        description: 'The work item has been removed from the queue.',
      })
    },
  })

  // Find active session for project
  const getActiveSessionId = (projectId: number): number | undefined => {
    return sessions?.find(
      (s: any) => s.projectId === projectId && s.status === 'running'
    )?.id
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      queued: { variant: 'default', icon: Circle },
      assigned: { variant: 'secondary', icon: AlertCircle },
      blocked: { variant: 'destructive', icon: Lock },
      completed: { variant: 'success', icon: CheckCircle2 },
    }

    const config = variants[status] || variants.queued
    const Icon = config.icon

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const renderPriorityStars = (priority: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < priority ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const formatAge = (addedAt: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(addedAt).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) {
      return `${days}d ${hours}h`
    }
    return `${hours}h`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Queue</h1>
          <p className="text-muted-foreground">
            Prioritized queue of approved specs ready for implementation
          </p>
        </div>

        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Queued</CardTitle>
              <Circle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQueued}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssigned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBlocked}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompleted}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Work Queue</CardTitle>
          <CardDescription>
            Specs are ordered by priority and position. Higher priority items appear first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !workQueue || workQueue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No work items in queue
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Spec</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Blocked By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workQueue.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{item.specTitle || item.specId}</div>
                        <div className="text-xs text-muted-foreground">{item.specId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{renderPriorityStars(item.priority)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatAge(item.addedAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.blockedBy ? (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          {item.blockedBy}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {item.status === 'assigned' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                const sessionId = getActiveSessionId(item.projectId)
                                if (!sessionId) {
                                  toast({
                                    title: 'No active session',
                                    description: 'Please start a session first to spawn workers.',
                                    variant: 'destructive',
                                  })
                                  return
                                }
                                spawnWorker.mutate({
                                  sessionId,
                                  specId: item.specId,
                                })
                              }}
                              disabled={spawnWorker.isPending}
                              className="flex items-center gap-1"
                            >
                              <Bot className="h-3 w-3" />
                              Spawn Worker
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => completeItem.mutate({ workItemId: item.id })}
                              disabled={completeItem.isPending}
                              className="flex items-center gap-1"
                            >
                              <User className="h-3 w-3" />
                              Do Manually
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeItem.mutate({ workItemId: item.id })}
                          disabled={removeItem.isPending}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
