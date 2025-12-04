'use client'

import { useRouter } from 'next/navigation'
import { trpc } from '@/trpc/client'
import { Button } from '@homelab/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@homelab/ui/card'
import { Badge } from '@homelab/ui/badge'
import { SimpleBarChart } from '@homelab/ui'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  FileText,
  ExternalLink,
  Calendar,
  Hash
} from 'lucide-react'

interface ReportDetailPageProps {
  params: {
    id: string
  }
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  const router = useRouter()
  const reportId = parseInt(params.id)

  const { data: report, isLoading, error } = trpc.reports.byId.useQuery({ id: reportId })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading report...</div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Report not found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                The requested report could not be found.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const reportData = report as any
  const passRate = reportData.total_tests > 0
    ? ((reportData.passed / reportData.total_tests) * 100).toFixed(1)
    : '0'

  const getStatusBadge = () => {
    if (reportData.failed > 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      )
    }
    if (reportData.passed > 0 && reportData.failed === 0) {
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Passed
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <MinusCircle className="h-3 w-3" />
        Skipped
      </Badge>
    )
  }

  // Chart data for test results
  const chartData = [
    {
      category: 'Passed',
      count: reportData.passed,
    },
    {
      category: 'Failed',
      count: reportData.failed,
    },
    {
      category: 'Skipped',
      count: reportData.skipped,
    },
  ].filter(item => item.count > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
          <h1 className="text-3xl font-bold">{reportData.workflow_name}</h1>
          <p className="text-muted-foreground">
            Test Report Details
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Run Number</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{reportData.run_number}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.total_tests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(reportData.created_at).toLocaleDateString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(reportData.created_at).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Results Breakdown</CardTitle>
            <CardDescription>
              Visual breakdown of test outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <SimpleBarChart
                data={chartData}
                dataKey="count"
                xAxisKey="category"
                height={300}
                colors={['hsl(142, 71%, 45%)', 'hsl(0, 84%, 60%)', 'hsl(215, 16%, 47%)']}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No test data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Statistics</CardTitle>
            <CardDescription>
              Detailed test execution metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Passed Tests</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{reportData.passed}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm font-medium">Failed Tests</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{reportData.failed}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MinusCircle className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium">Skipped Tests</span>
                </div>
                <div className="text-2xl font-bold text-gray-500">{reportData.skipped}</div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <div className="text-2xl font-bold">{reportData.total_tests}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>HTML Report</CardTitle>
          <CardDescription>
            View the full Playwright HTML report with detailed test execution information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportData.file_path ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <code className="font-mono text-xs">{reportData.file_path}</code>
              </div>
              <Button asChild>
                <a
                  href={`/reports-static/${reportData.hash}/index.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Full Report
                </a>
              </Button>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={`/reports-static/${reportData.hash}/index.html`}
                  className="w-full h-[600px]"
                  title="Playwright Test Report"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              HTML report file not available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
