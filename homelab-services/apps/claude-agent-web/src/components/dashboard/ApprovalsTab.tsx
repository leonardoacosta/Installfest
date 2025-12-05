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
import { Badge } from '@homelab/ui/badge'
import { CheckCircle2, XCircle, Edit, Eye, AlertTriangle, ArrowUpDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import type { DashboardFilters } from '@/app/(dashboard)/dashboard/page'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@homelab/ui/dialog'
import { Textarea } from '@homelab/ui/textarea'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { Alert, AlertDescription } from '@homelab/ui/alert'

interface ApprovalsTabProps {
  filters: DashboardFilters
}

type SortField = 'priority' | 'date'
type SortDirection = 'asc' | 'desc'

export function ApprovalsTab({ filters }: ApprovalsTabProps) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const projectId = filters.projectId || 1

  const [selectedSpec, setSelectedSpec] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showProposalDetailDialog, setShowProposalDetailDialog] = useState(false)
  const [showReviewDetailDialog, setShowReviewDetailDialog] = useState(false)
  const [showRequestChangesDialog, setShowRequestChangesDialog] = useState(false)
  const [requestChangesFeedback, setRequestChangesFeedback] = useState('')
  const [proposingSortField, setProposingSortField] = useState<SortField>('priority')
  const [proposingSortDirection, setProposingSortDirection] = useState<SortDirection>('desc')
  const [reviewSortField, setReviewSortField] = useState<SortField>('date')
  const [reviewSortDirection, setReviewSortDirection] = useState<SortDirection>('desc')

  // Fetch specs needing approval (proposing) and validation (review)
  const { data: proposingSpecs, isLoading: loadingProposing } = trpc.lifecycle.listByStatus.useQuery({
    projectId,
    status: 'proposing',
  })

  const { data: reviewSpecs, isLoading: loadingReview } = trpc.lifecycle.listByStatus.useQuery({
    projectId,
    status: 'review',
  })

  // Fetch spec content when a spec is selected for detail view
  const { data: specContent } = trpc.sync.getSpecContent.useQuery(
    { id: selectedSpec?.specId || '' },
    { enabled: !!selectedSpec && (showProposalDetailDialog || showReviewDetailDialog) }
  )

  const approveSpec = trpc.lifecycle.approve.useMutation({
    onSuccess: () => {
      utils.lifecycle.listByStatus.invalidate()
      utils.workQueue.getQueue.invalidate()
      toast.success('Spec approved and added to work queue')
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`)
    },
  })

  const rejectSpec = trpc.lifecycle.reject.useMutation({
    onSuccess: () => {
      utils.lifecycle.listByStatus.invalidate()
      setShowRejectDialog(false)
      setRejectReason('')
      toast.success('Spec rejected and archived')
    },
    onError: (error) => {
      toast.error(`Failed to reject: ${error.message}`)
    },
  })

  const markApplied = trpc.lifecycle.markApplied.useMutation({
    onSuccess: () => {
      utils.lifecycle.listByStatus.invalidate()
      utils.workQueue.getQueue.invalidate()
      toast.success('Spec validated and marked as applied')
    },
    onError: (error) => {
      toast.error(`Failed to validate: ${error.message}`)
    },
  })

  const handleReject = (specId: string) => {
    setSelectedSpec(specId)
    setShowRejectDialog(true)
  }

  const confirmReject = () => {
    if (!selectedSpec) return
    rejectSpec.mutate({ specId: selectedSpec, reason: rejectReason })
  }

  const handleViewProposal = (spec: any) => {
    setSelectedSpec(spec)
    setShowProposalDetailDialog(true)
  }

  const handleViewReview = (spec: any) => {
    setSelectedSpec(spec)
    setShowReviewDetailDialog(true)
  }

  const handleRequestChanges = (spec: any) => {
    setSelectedSpec(spec)
    setShowRequestChangesDialog(true)
  }

  const confirmRequestChanges = () => {
    if (!selectedSpec || !requestChangesFeedback) return

    // TODO: Implement API call to create clarification/notification back to agent
    // This would create a notification or clarification that the master agent can respond to
    toast.success('Change request sent (placeholder - API not yet implemented)')

    setShowRequestChangesDialog(false)
    setRequestChangesFeedback('')
    setSelectedSpec(null)
  }

  const handleProposingSort = (field: SortField) => {
    if (proposingSortField === field) {
      setProposingSortDirection(proposingSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setProposingSortField(field)
      setProposingSortDirection('desc')
    }
  }

  const handleReviewSort = (field: SortField) => {
    if (reviewSortField === field) {
      setReviewSortDirection(reviewSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setReviewSortField(field)
      setReviewSortDirection('desc')
    }
  }

  const sortSpecs = (specs: any[], sortField: SortField, sortDirection: SortDirection) => {
    return [...specs].sort((a, b) => {
      let comparison = 0
      if (sortField === 'priority') {
        comparison = b.priority - a.priority // Higher priority first by default
      } else if (sortField === 'date') {
        const dateA = new Date(a.createdAt || a.updatedAt).getTime()
        const dateB = new Date(b.createdAt || b.updatedAt).getTime()
        comparison = dateB - dateA // Newer first by default
      }
      return sortDirection === 'asc' ? -comparison : comparison
    })
  }

  const sortedProposingSpecs = proposingSpecs
    ? sortSpecs(proposingSpecs, proposingSortField, proposingSortDirection)
    : []

  const sortedReviewSpecs = reviewSpecs ? sortSpecs(reviewSpecs, reviewSortField, reviewSortDirection) : []

  const renderProposingSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Needs Approval
        </CardTitle>
        <CardDescription>
          Specs in proposing state awaiting user review before work begins
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingProposing ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !proposingSpecs || proposingSpecs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No specs awaiting approval
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spec ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleProposingSort('priority')}
                    className="h-8 px-2"
                  >
                    Priority
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleProposingSort('date')}
                    className="h-8 px-2"
                  >
                    Created
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProposingSpecs.map((spec: any) => (
                <TableRow key={spec.id}>
                  <TableCell className="font-medium">{spec.specId}</TableCell>
                  <TableCell>
                    <Badge variant={spec.source === 'error' ? 'destructive' : 'default'}>
                      {spec.source === 'error' ? 'Error' : 'Manual'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">P{spec.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(spec.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewProposal(spec)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => approveSpec.mutate({ specId: spec.specId })}
                        disabled={approveSpec.isPending}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/spec-editor/${spec.specId}`)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(spec.specId)}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
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
  )

  const renderReviewSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-blue-500" />
          Needs Validation
        </CardTitle>
        <CardDescription>
          Completed specs awaiting user confirmation before being marked as applied
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingReview ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !reviewSpecs || reviewSpecs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No specs awaiting validation
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spec ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReviewSort('priority')}
                    className="h-8 px-2"
                  >
                    Priority
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReviewSort('date')}
                    className="h-8 px-2"
                  >
                    Completed
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReviewSpecs.map((spec: any) => (
                <TableRow key={spec.id}>
                  <TableCell className="font-medium">{spec.specId}</TableCell>
                  <TableCell>
                    <Badge variant={spec.source === 'error' ? 'destructive' : 'default'}>
                      {spec.source === 'error' ? 'Error' : 'Manual'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">P{spec.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(spec.updatedAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewReview(spec)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => markApplied.mutate({ specId: spec.specId, projectId: spec.projectId })}
                        disabled={markApplied.isPending}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Validate & Apply
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
  )

  return (
    <>
      <div className="space-y-6">
        {renderProposingSection()}
        {renderReviewSection()}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Spec</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this spec. It will be archived.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectReason || rejectSpec.isPending}
            >
              Reject Spec
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proposal Detail Dialog */}
      <Dialog open={showProposalDetailDialog} onOpenChange={setShowProposalDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DialogTitle>{selectedSpec?.specTitle || selectedSpec?.specId}</DialogTitle>
                <Badge variant={selectedSpec?.source === 'error' ? 'destructive' : 'default'}>
                  {selectedSpec?.source === 'error' ? 'Error' : 'Manual'}
                </Badge>
                <Badge variant="outline">P{selectedSpec?.priority}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Created {selectedSpec?.createdAt && formatDistanceToNow(new Date(selectedSpec.createdAt), { addSuffix: true })}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Proposal Content */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Proposal</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted rounded-md">
                {specContent?.proposal ? (
                  <ReactMarkdown>{specContent.proposal}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground">Loading proposal...</p>
                )}
              </div>
            </div>

            {/* Tasks Content */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Tasks</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted rounded-md">
                {specContent?.tasks ? (
                  <ReactMarkdown>{specContent.tasks}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground">Loading tasks...</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowProposalDetailDialog(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowProposalDetailDialog(false)
                handleRequestChanges(selectedSpec)
              }}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Request Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowProposalDetailDialog(false)
                router.push(`/dashboard/spec-editor/${selectedSpec?.specId}`)
              }}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="default"
              onClick={() => {
                approveSpec.mutate({ specId: selectedSpec?.specId })
                setShowProposalDetailDialog(false)
              }}
              disabled={approveSpec.isPending}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowProposalDetailDialog(false)
                handleReject(selectedSpec?.specId)
              }}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Detail Dialog */}
      <Dialog open={showReviewDetailDialog} onOpenChange={setShowReviewDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DialogTitle>{selectedSpec?.specTitle || selectedSpec?.specId}</DialogTitle>
                <Badge variant={selectedSpec?.source === 'error' ? 'destructive' : 'default'}>
                  {selectedSpec?.source === 'error' ? 'Error' : 'Manual'}
                </Badge>
                <Badge variant="outline">P{selectedSpec?.priority}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Completed {selectedSpec?.updatedAt && formatDistanceToNow(new Date(selectedSpec.updatedAt), { addSuffix: true })}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Tasks Completion Status */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Tasks</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted rounded-md">
                {specContent?.tasks ? (
                  <ReactMarkdown>{specContent.tasks}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground">Loading tasks...</p>
                )}
              </div>
            </div>

            {/* Proposal for Reference */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Proposal (Reference)</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted rounded-md">
                {specContent?.proposal ? (
                  <ReactMarkdown>{specContent.proposal}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground">Loading proposal...</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReviewDetailDialog(false)}>
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => {
                markApplied.mutate({ specId: selectedSpec?.specId, projectId: selectedSpec?.projectId })
                setShowReviewDetailDialog(false)
              }}
              disabled={markApplied.isPending}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Validate & Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog open={showRequestChangesDialog} onOpenChange={setShowRequestChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Provide feedback to the agent about what needs to be changed or clarified in this spec.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Describe the changes you'd like to see..."
              value={requestChangesFeedback}
              onChange={(e) => setRequestChangesFeedback(e.target.value)}
              rows={6}
            />
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will create a notification for the master agent to address your feedback.
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRequestChangesDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={confirmRequestChanges}
              disabled={!requestChangesFeedback}
            >
              Send Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
