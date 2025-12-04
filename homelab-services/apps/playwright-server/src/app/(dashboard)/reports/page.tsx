"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@homelab/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@homelab/ui/card";
import { Badge } from "@homelab/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@homelab/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@homelab/ui/select";
import {
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Eye,
} from "lucide-react";
import { toast } from "@homelab/ui/use-toast";
import Link from "next/link";

export default function ReportsPage() {
  const [workflowFilter, setWorkflowFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: reports, isLoading } = trpc.reports.list.useQuery({
    workflow: workflowFilter || undefined,
    status: (statusFilter && statusFilter !== "" ? statusFilter : undefined) as
      | "passed"
      | "failed"
      | "skipped"
      | undefined,
  });

  const { data: workflows } = trpc.reports.workflows.useQuery();

  const deleteReport = trpc.reports.delete.useMutation({
    onSuccess: () => {
      utils.reports.list.invalidate();
      toast({
        title: "Report deleted",
        description: "The test report has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this report?")) {
      deleteReport.mutate({ id });
    }
  };

  const getStatusBadge = (
    status: string,
    passed: number,
    failed: number,
    skipped: number
  ) => {
    if (failed > 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    }
    if (passed > 0 && failed === 0) {
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Passed
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <MinusCircle className="h-3 w-3" />
        Skipped
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Reports</h1>
          <p className="text-muted-foreground">
            View and manage Playwright test reports from all workflows
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Workflows" />
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

        <div className="flex-1">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>
            {reports?.length || 0} report(s) total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading reports...
            </div>
          ) : reports && reports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Run #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reports as any[]).map((report: any) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {report.workflow_name}
                      </div>
                    </TableCell>
                    <TableCell>#{report.run_number}</TableCell>
                    <TableCell>
                      {getStatusBadge(
                        report.status,
                        report.passed,
                        report.failed,
                        report.skipped
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="text-green-600">
                          {report.passed} passed
                        </span>
                        {report.failed > 0 && (
                          <span className="text-red-600 ml-2">
                            {report.failed} failed
                          </span>
                        )}
                        {report.skipped > 0 && (
                          <span className="text-gray-500 ml-2">
                            {report.skipped} skipped
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(report.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/reports/${report.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View report details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(report.id)}
                          disabled={deleteReport.isPending}
                          title="Delete report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No reports yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Test reports will appear here when your workflows run.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
