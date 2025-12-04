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
import { FileText, CheckCircle2, XCircle, MinusCircle, TrendingUp } from 'lucide-react'

export default function StatisticsPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all')

  const { data: workflows } = trpc.reports.workflows.useQuery()
  const { data: reports } = trpc.reports.list.useQuery(
    selectedWorkflow !== 'all' ? { workflow: selectedWorkflow } : undefined
  )
  const { data: stats } = trpc.reports.stats.useQuery(
    selectedWorkflow !== 'all' ? { workflow: selectedWorkflow } : undefined
  )

  const statsData = stats as any
  const totalReports = statsData?.totalReports || 0
  const totalTests = statsData?.totalTests || 0
  const passedTests = statsData?.passedTests || 0
  const failedTests = statsData?.failedTests || 0
  const skippedTests = statsData?.skippedTests || 0
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0'

  // Group reports by workflow
  const workflowStats = reports?.reduce((acc: any, report: any) => {
    const workflow = report.workflow_name
    if (!acc[workflow]) {
      acc[workflow] = {
        workflow,
        totalReports: 0,
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
      }
    }
    acc[workflow].totalReports += 1
    acc[workflow].totalTests += report.total_tests
    acc[workflow].passed += report.passed
    acc[workflow].failed += report.failed
    acc[workflow].skipped += report.skipped
    return acc
  }, {})

  const workflowStatsArray = workflowStats ? Object.values(workflowStats) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Statistics</h1>
          <p className="text-muted-foreground">
            Aggregated test metrics and performance insights
          </p>
        </div>

        <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by workflow" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workflows</SelectItem>
            {(workflows as string[] | undefined)?.map((workflow) => (
              <SelectItem key={workflow} value={workflow}>
                {workflow}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passedTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statistics by Workflow</CardTitle>
          <CardDescription>
            Test results grouped by workflow name
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflowStatsArray && workflowStatsArray.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Total Tests</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Skipped</TableHead>
                  <TableHead>Pass Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(workflowStatsArray as any[]).map((stat: any, idx: number) => {
                  const passRate = stat.totalTests > 0
                    ? ((stat.passed / stat.totalTests) * 100).toFixed(1)
                    : '0'

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{stat.workflow}</TableCell>
                      <TableCell>{stat.totalReports}</TableCell>
                      <TableCell>{stat.totalTests}</TableCell>
                      <TableCell className="text-green-600">{stat.passed}</TableCell>
                      <TableCell className="text-red-600">{stat.failed}</TableCell>
                      <TableCell className="text-gray-500">{stat.skipped}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{passRate}%</div>
                          {stat.failed > 0 ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No statistics available
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Results</CardTitle>
            <CardDescription>
              Latest test runs with pass/fail breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports && reports.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Run #</TableHead>
                    <TableHead>Passed</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Skipped</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.slice(0, 10).map((report: any) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.workflow_name}</TableCell>
                      <TableCell>#{report.run_number}</TableCell>
                      <TableCell className="text-green-600">{report.passed}</TableCell>
                      <TableCell className="text-red-600">{report.failed}</TableCell>
                      <TableCell className="text-gray-500">{report.skipped}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No reports yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Statistics will appear here once you have test reports.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Trends</CardTitle>
            <CardDescription>
              Overall test health and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Passed Tests</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{passedTests}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium">Failed Tests</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{failedTests}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MinusCircle className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium">Skipped Tests</span>
                </div>
                <div className="text-2xl font-bold text-gray-500">{skippedTests}</div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">Overall Pass Rate</span>
                  </div>
                  <div className="text-2xl font-bold">{passRate}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
