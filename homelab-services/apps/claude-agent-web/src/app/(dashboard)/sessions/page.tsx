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
import { Activity, Clock, Play, Square } from 'lucide-react'
import { toast } from '@homelab/ui/use-toast'

export default function SessionsPage() {
  const [selectedProject, setSelectedProject] = useState<string>('all')

  const utils = trpc.useUtils()
  const { data: projects } = trpc.projects.list.useQuery()
  const { data: sessions, isLoading } = trpc.sessions.list.useQuery(
    selectedProject !== 'all' ? { projectId: parseInt(selectedProject) } : undefined
  )

  const stopSession = trpc.sessions.stop.useMutation({
    onSuccess: () => {
      utils.sessions.list.invalidate()
      toast({
        title: 'Session stopped',
        description: 'The session has been stopped successfully.',
      })
    },
  })

  const deleteSession = trpc.sessions.delete.useMutation({
    onSuccess: () => {
      utils.sessions.list.invalidate()
      toast({
        title: 'Session deleted',
        description: 'The session has been deleted successfully.',
      })
    },
  })

  const formatDuration = (startedAt: string, endedAt?: string) => {
    const start = new Date(startedAt)
    const end = endedAt ? new Date(endedAt) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`
    }
    return `${diffMins}m`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">
            Track and manage Claude Code development sessions
          </p>
        </div>

        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects?.map((project: any) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions?.filter((s: any) => s.status === 'running').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Square className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions?.filter((s: any) => s.status === 'stopped').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>
            All development sessions across your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading sessions...
            </div>
          ) : sessions && sessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Agent ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: any) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.project_name || 'Unknown'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {session.agent_id || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={session.status === 'running' ? 'default' : 'secondary'}
                      >
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(session.started_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatDuration(session.started_at, session.ended_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {session.status === 'running' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => stopSession.mutate({ id: session.id })}
                          >
                            Stop
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this session?')) {
                              deleteSession.mutate({ id: session.id })
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No sessions yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Sessions will appear here when you start using Claude Code.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
