'use client'

import { useState } from 'react'
import { trpc } from '@/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@homelab/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@homelab/ui/select'
import { Bot, CheckCircle, Play, XCircle } from 'lucide-react'
import { WorkerGrid } from '@/components/WorkerGrid'

export default function WorkersPage() {
  const [selectedProject, setSelectedProject] = useState<string>('all')

  const { data: projects } = trpc.projects.list.useQuery()
  const { data: workers } = trpc.workerAgent.listActive.useQuery(
    selectedProject !== 'all' ? { projectId: parseInt(selectedProject) } : {}
  )

  const activeWorkers = workers?.filter(w => w.status === 'active' || w.status === 'spawned') || []
  const completedWorkers = workers?.filter(w => w.status === 'completed') || []
  const failedWorkers = workers?.filter(w => w.status === 'failed') || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Worker Agents</h1>
          <p className="text-muted-foreground">
            Monitor specialized agents working on implementation tasks
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workers?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedWorkers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedWorkers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Workers */}
      {activeWorkers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Active Workers</h2>
          <WorkerGrid
            projectId={selectedProject !== 'all' ? parseInt(selectedProject) : undefined}
          />
        </div>
      )}

      {/* Failed Workers */}
      {failedWorkers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
            Failed Workers
          </h2>
          <WorkerGrid
            projectId={selectedProject !== 'all' ? parseInt(selectedProject) : undefined}
          />
        </div>
      )}

      {/* Completed Workers */}
      {completedWorkers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Completed Workers
          </h2>
          <WorkerGrid
            projectId={selectedProject !== 'all' ? parseInt(selectedProject) : undefined}
          />
        </div>
      )}

      {/* Empty State */}
      {workers?.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No workers yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Worker agents will appear here when sessions spawn them for implementation work.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
