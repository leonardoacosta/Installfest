/**
 * Dashboard Example
 *
 * Real-world dashboard layout demonstrating charts, stats, and data visualization.
 * Perfect for Claude Agent Server and Playwright Server implementations.
 */

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  SimpleLineChart,
  AreaLineChart,
  SimpleBarChart,
  DonutChart,
  Sparkline,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Separator,
} from "../src"

import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"

// Sample data
const sessionData = [
  { time: "00:00", sessions: 45 },
  { time: "04:00", sessions: 30 },
  { time: "08:00", sessions: 120 },
  { time: "12:00", sessions: 200 },
  { time: "16:00", sessions: 180 },
  { time: "20:00", sessions: 90 },
]

const testRunData = [
  { date: "Mon", passed: 45, failed: 5, skipped: 3 },
  { date: "Tue", passed: 50, failed: 3, skipped: 2 },
  { date: "Wed", passed: 48, failed: 7, skipped: 4 },
  { date: "Thu", passed: 52, failed: 2, skipped: 1 },
  { date: "Fri", passed: 55, failed: 4, skipped: 2 },
  { date: "Sat", passed: 40, failed: 1, skipped: 5 },
  { date: "Sun", passed: 35, failed: 2, skipped: 8 },
]

const statusData = [
  { name: "Passed", value: 285 },
  { name: "Failed", value: 24 },
  { name: "Skipped", value: 25 },
]

const recentTests = [
  { id: 1, name: "Authentication Flow", status: "passed", duration: "2.3s", time: "2 min ago" },
  { id: 2, name: "Checkout Process", status: "passed", duration: "5.1s", time: "5 min ago" },
  { id: 3, name: "User Registration", status: "failed", duration: "1.8s", time: "8 min ago" },
  { id: 4, name: "Product Search", status: "passed", duration: "3.2s", time: "12 min ago" },
  { id: 5, name: "API Integration", status: "running", duration: "—", time: "Just now" },
]

const agentSessions = [
  { id: 1, project: "homelab-ui", agent: "Agent-42", status: "running", tools: 127, duration: "45m" },
  { id: 2, project: "playwright-tests", agent: "Agent-17", status: "completed", tools: 89, duration: "32m" },
  { id: 3, project: "api-refactor", agent: "Agent-33", status: "running", tools: 54, duration: "18m" },
  { id: 4, project: "docs-update", agent: "Agent-09", status: "completed", tools: 23, duration: "12m" },
]

const sparklinePassedData = [{ v: 45 }, { v: 50 }, { v: 48 }, { v: 52 }, { v: 55 }, { v: 40 }, { v: 35 }]
const sparklineFailedData = [{ v: 5 }, { v: 3 }, { v: 7 }, { v: 2 }, { v: 4 }, { v: 1 }, { v: 2 }]
const sparklineSessionData = [{ v: 120 }, { v: 135 }, { v: 128 }, { v: 145 }, { v: 152 }, { v: 138 }, { v: 125 }]

export function DashboardExample() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your test runs and agent sessions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">334</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> from last week
              </p>
              <Sparkline
                data={sparklinePassedData}
                dataKey="v"
                height={40}
                trend="up"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.8%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Tests</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">+3</span> from yesterday
              </p>
              <Sparkline
                data={sparklineFailedData}
                dataKey="v"
                height={40}
                trend="down"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="text-cyan-600">127</span> tool calls active
              </p>
              <Sparkline
                data={sparklineSessionData}
                dataKey="v"
                height={40}
                trend="up"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Runs (Last 7 Days)</CardTitle>
            <CardDescription>Daily test execution results</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={testRunData}
              dataKey="passed"
              xAxisKey="date"
              height={300}
              showLegend
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Status Distribution</CardTitle>
            <CardDescription>Overall test results breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={statusData}
              dataKey="value"
              nameKey="name"
              height={300}
              centerLabel="Total"
              centerValue="334"
              colors={["#00FF94", "#FF453A", "#FFD60A"]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Sessions (24 Hours)</CardTitle>
          <CardDescription>Active development sessions over time</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaLineChart
            data={sessionData}
            dataKey="sessions"
            xAxisKey="time"
            height={250}
          />
        </CardContent>
      </Card>

      {/* Tables Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Runs</CardTitle>
            <CardDescription>Latest test execution results</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">
                      {test.name}
                      <div className="text-xs text-muted-foreground">{test.time}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          test.status === "passed"
                            ? "passed"
                            : test.status === "failed"
                            ? "failed"
                            : "running"
                        }
                      >
                        {test.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{test.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Agent Sessions</CardTitle>
            <CardDescription>Claude Code development sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Tools</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {session.project}
                      <div className="text-xs text-muted-foreground">{session.duration}</div>
                    </TableCell>
                    <TableCell>{session.agent}</TableCell>
                    <TableCell>{session.tools}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          session.status === "running" ? "running" : "success"
                        }
                      >
                        {session.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardExample
