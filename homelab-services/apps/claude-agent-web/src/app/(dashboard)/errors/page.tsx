'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { Input } from '@homelab/ui/input'
import { Label } from '@homelab/ui/label'
import { Checkbox } from '@homelab/ui/checkbox'
import { Slider } from '@homelab/ui/slider'
import { Textarea } from '@homelab/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@homelab/ui/dialog'
import { AlertTriangle, Bug, Star, CheckCircle2, XCircle, Search, Filter } from 'lucide-react'
import { toast } from '@homelab/ui/use-toast'

export default function ErrorProposalsPage() {
  const [sortBy, setSortBy] = useState<'occurrences' | 'priority' | 'date'>('occurrences')
  const [selectedProject, setSelectedProject] = useState<string>('1')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>([
    'NEW',
    'FLAKY',
    'RECURRING',
    'PERSISTENT',
  ])
  const [priorityRange, setPriorityRange] = useState<[number, number]>([1, 5])
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [relatedFailuresDialogOpen, setRelatedFailuresDialogOpen] = useState(false)
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null)

  const utils = trpc.useUtils()
  const { data: projects } = trpc.projects.list.useQuery()
  const { data: errorProposalsRaw, isLoading } = trpc.errorProposals.listPending.useQuery({
    projectId: parseInt(selectedProject),
    sortBy,
    limit: 100,
  })
  const { data: stats } = trpc.errorProposals.stats.useQuery({
    projectId: parseInt(selectedProject),
  })
  const { data: relatedFailures, isLoading: isLoadingRelated } = trpc.errorProposals.getRelatedFailures.useQuery(
    { errorProposalId: selectedProposalId! },
    { enabled: selectedProposalId !== null }
  )

  // Client-side filtering
  const errorProposals = useMemo(() => {
    if (!errorProposalsRaw) return []

    return errorProposalsRaw.filter((proposal: any) => {
      const content = proposal.parsedContent

      // Filter by search query
      if (searchQuery && !proposal.testName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Filter by classification
      if (content?.classification && !selectedClassifications.includes(content.classification)) {
        return false
      }

      // Filter by priority range
      if (content?.priority) {
        if (content.priority < priorityRange[0] || content.priority > priorityRange[1]) {
          return false
        }
      }

      return true
    })
  }, [errorProposalsRaw, searchQuery, selectedClassifications, priorityRange])

  const approveProposal = trpc.lifecycle.approve.useMutation({
    onSuccess: () => {
      utils.errorProposals.listPending.invalidate()
      utils.errorProposals.stats.invalidate()
      utils.workQueue.getQueue.invalidate()
      toast({
        title: 'Proposal approved',
        description: 'The error proposal has been approved and added to the work queue.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to approve proposal',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const rejectProposal = trpc.lifecycle.reject.useMutation({
    onSuccess: () => {
      utils.errorProposals.listPending.invalidate()
      utils.errorProposals.stats.invalidate()
      utils.workQueue.getQueue.invalidate()
      setRejectDialogOpen(false)
      setSelectedSpecId(null)
      setRejectionReason('')
      toast({
        title: 'Proposal rejected',
        description: 'The error proposal has been rejected and archived.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to reject proposal',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleRejectClick = (specId: string) => {
    setSelectedSpecId(specId)
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = () => {
    if (!selectedSpecId || !rejectionReason.trim()) {
      toast({
        title: 'Rejection reason required',
        description: 'Please provide a reason for rejecting this proposal.',
        variant: 'destructive',
      })
      return
    }

    rejectProposal.mutate({
      specId: selectedSpecId,
      reason: rejectionReason,
    })
  }

  const handleViewRelatedClick = (proposalId: number) => {
    setSelectedProposalId(proposalId)
    setRelatedFailuresDialogOpen(true)
  }

  // Subscribe to error proposal events for real-time updates
  trpc.errorProposals.subscribe.useSubscription(
    { projectId: parseInt(selectedProject) },
    {
      onData: (event) => {
        // Invalidate queries to refresh the list
        utils.errorProposals.listPending.invalidate()
        utils.errorProposals.stats.invalidate()

        // Show toast notification based on event type
        if (event.type === 'proposal_generated') {
          toast({
            title: 'New error found!',
            description: `Error proposal created with priority ${event.priority || 'N/A'}`,
          })
        } else if (event.type === 'proposal_updated') {
          toast({
            title: 'Error updated',
            description: `Occurrence count increased`,
          })
        } else if (event.type === 'priority_escalated') {
          toast({
            title: 'Priority escalated!',
            description: `Error priority increased to ${event.priority || 'N/A'}`,
            variant: 'destructive',
          })
        }
      },
      onError: (error) => {
        console.error('Subscription error:', error)
      },
    }
  )

  const getClassificationBadge = (classification: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      PERSISTENT: { variant: 'destructive', label: 'Persistent' },
      RECURRING: { variant: 'default', label: 'Recurring' },
      FLAKY: { variant: 'secondary', label: 'Flaky' },
      NEW: { variant: 'outline', label: 'New' },
    }

    const config = variants[classification] || variants.NEW

    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    )
  }

  const getErrorTypeBadge = (errorType: string) => {
    const labels: Record<string, string> = {
      'type-error': 'Type Error',
      'missing-property': 'Missing Property',
      'assertion-failure': 'Assertion Failed',
      'network-error': 'Network Error',
      'configuration-error': 'Config Error',
      'other': 'Other',
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Bug className="h-3 w-3" />
        {labels[errorType] || errorType}
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 5) return 'bg-red-50 border-l-4 border-l-red-500'
    if (priority === 4) return 'bg-orange-50 border-l-4 border-l-orange-500'
    if (priority === 3) return 'bg-yellow-50 border-l-4 border-l-yellow-500'
    if (priority === 2) return 'bg-blue-50 border-l-4 border-l-blue-500'
    return ''
  }

  const toggleClassification = (classification: string) => {
    setSelectedClassifications((prev) =>
      prev.includes(classification)
        ? prev.filter((c) => c !== classification)
        : [...prev, classification]
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Proposals</h1>
          <p className="text-muted-foreground">
            Automatically generated spec proposals from test failures
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="occurrences">By Occurrences</SelectItem>
              <SelectItem value="priority">By Priority</SelectItem>
              <SelectItem value="date">By Date</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Sidebar */}
      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search Test Name</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Classifications */}
            <div className="space-y-3">
              <Label>Classification</Label>
              <div className="space-y-2">
                {['NEW', 'FLAKY', 'RECURRING', 'PERSISTENT'].map((classification) => (
                  <div key={classification} className="flex items-center space-x-2">
                    <Checkbox
                      id={`classification-${classification}`}
                      checked={selectedClassifications.includes(classification)}
                      onCheckedChange={() => toggleClassification(classification)}
                    />
                    <Label
                      htmlFor={`classification-${classification}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {classification}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Range */}
            <div className="space-y-3">
              <Label>Priority Range: {priorityRange[0]} - {priorityRange[1]}</Label>
              <Slider
                min={1}
                max={5}
                step={1}
                value={priorityRange}
                onValueChange={(value: any) => setPriorityRange(value as [number, number])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low (1)</span>
                <span>High (5)</span>
              </div>
            </div>

            {/* Active Filters Count */}
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {errorProposals?.length || 0} of {errorProposalsRaw?.length || 0} proposals
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProposals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Persistent</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byClassification.PERSISTENT}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recurring</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byClassification.RECURRING}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Linked to Specs</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.linkedToSpecs}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Error Proposals</CardTitle>
          <CardDescription>
            Review and approve auto-generated proposals from test failures. Higher priority and more frequent errors appear first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !errorProposals || errorProposals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No error proposals found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Error Type</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Occurrences</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorProposals.map((proposal: any) => {
                  const content = proposal.parsedContent
                  return (
                    <TableRow key={proposal.id} className={getPriorityColor(content?.priority || 2)}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{proposal.testName}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {proposal.testFile}
                          </div>
                          {proposal.specTitle && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Spec: {proposal.specTitle}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getErrorTypeBadge(content?.errorType || 'other')}</TableCell>
                      <TableCell>{getClassificationBadge(content?.classification || 'NEW')}</TableCell>
                      <TableCell>{renderPriorityStars(content?.priority || 2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{proposal.occurrenceCount}x</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(proposal.lastFailureAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {proposal.specId && proposal.specStatus === 'proposing' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => approveProposal.mutate({ specId: proposal.specId })}
                                disabled={approveProposal.isPending}
                                className="flex items-center gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectClick(proposal.specId)}
                                disabled={rejectProposal.isPending}
                                className="flex items-center gap-1"
                              >
                                <XCircle className="h-3 w-3" />
                                Reject
                              </Button>
                            </>
                          )}
                          {proposal.specId && proposal.specStatus === 'approved' && (
                            <Badge variant="success">Approved</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              toast({
                                title: 'View Details',
                                description: 'Error details view coming soon',
                              })
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewRelatedClick(proposal.id)}
                          >
                            View Related ({proposal.occurrenceCount})
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Error Proposal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this error proposal. This will be recorded in the spec history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="E.g., This is not a real error, it's expected behavior..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setSelectedSpecId(null)
                setRejectionReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectProposal.isPending || !rejectionReason.trim()}
            >
              {rejectProposal.isPending ? 'Rejecting...' : 'Reject Proposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Related Failures Dialog */}
      <Dialog open={relatedFailuresDialogOpen} onOpenChange={setRelatedFailuresDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Related Test Failures</DialogTitle>
            <DialogDescription>
              All test failures with the same test name (last 50 occurrences)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingRelated ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !relatedFailures || relatedFailures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No related failures found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Failed At</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedFailures.map((failure: any) => (
                    <TableRow key={failure.id}>
                      <TableCell className="text-sm">
                        {new Date(failure.failedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        {failure.classification && getClassificationBadge(failure.classification)}
                      </TableCell>
                      <TableCell className="text-sm max-w-md">
                        <div className="truncate" title={failure.error}>
                          {failure.error}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRelatedFailuresDialogOpen(false)
                setSelectedProposalId(null)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
