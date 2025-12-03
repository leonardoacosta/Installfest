'use client'

import { useState } from 'react'
import { trpc } from '@/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@homelab/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@homelab/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@homelab/ui/table'
import { Badge } from '@homelab/ui/badge'
import { Webhook, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react'

export default function HooksPage() {
  const [selectedSession, setSelectedSession] = useState<string>('all')

  const { data: sessions } = trpc.sessions.list.useQuery()
  const { data: hooks, isLoading } = trpc.hooks.list.useQuery(
    selectedSession !== 'all' ? { sessionId: parseInt(selectedSession) } : undefined
  )
  const { data: stats } = trpc.hooks.stats.useQuery(
    selectedSession !== 'all' ? { sessionId: parseInt(selectedSession) } : undefined
  )

  const totalHooks = stats?.reduce((acc: number, stat: any) => acc + stat.total, 0) || 0
  const successfulHooks = stats?.reduce((acc: number, stat: any) => acc + stat.successful, 0) || 0
  const avgDuration = (stats?.reduce((acc: number, stat: any) => acc + (stat.avg_duration || 0), 0) || 0) / (stats?.length || 1)
  const successRate = totalHooks > 0 ? ((successfulHooks / totalHooks) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hooks Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor tool calls and execution statistics
          </p>
        </div>

        <Select value={selectedSession} onValueChange={setSelectedSession}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            {sessions?.map((session: any) => (
              <SelectItem key={session.id} value={session.id.toString()}>
                Session #{session.id} - {session.project_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHooks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successfulHooks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDuration.toFixed(0)}ms</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hook Statistics by Type</CardTitle>
            <CardDescription>
              Aggregated metrics grouped by hook type and tool
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats && stats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Tool</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Success</TableHead>
                    <TableHead>Avg Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{stat.hook_type}</TableCell>
                      <TableCell>{stat.tool_name || 'N/A'}</TableCell>
                      <TableCell>{stat.total}</TableCell>
                      <TableCell>{stat.successful}</TableCell>
                      <TableCell>{stat.avg_duration?.toFixed(0) || 0}ms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No statistics available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Hook Executions</CardTitle>
            <CardDescription>
              Latest hook calls with execution details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading hooks...
              </div>
            ) : hooks && hooks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Tool</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hooks.slice(0, 10).map((hook: any) => (
                    <TableRow key={hook.id}>
                      <TableCell className="font-medium">{hook.hook_type}</TableCell>
                      <TableCell className="font-mono text-sm">{hook.tool_name}</TableCell>
                      <TableCell>
                        <Badge variant={hook.success ? 'default' : 'destructive'}>
                          {hook.success ? (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          ) : (
                            <XCircle className="mr-1 h-3 w-3" />
                          )}
                          {hook.success ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(hook.timestamp).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Webhook className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No hooks yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Hook executions will appear here once you integrate the SDK.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
