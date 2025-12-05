'use client'

import { useState, useEffect } from 'react'
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
import { CheckCircle2, Circle, Lock, AlertCircle, Star, Bot, User, Edit, GripVertical, Eye, ArrowUpDown, FileText, AlertTriangle, XCircle, UserPlus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import type { DashboardFilters } from '@/app/(dashboard)/dashboard/page'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@homelab/ui/dialog'
import { Textarea } from '@homelab/ui/textarea'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface WorkQueueTabProps {
  filters: DashboardFilters
}

function SortableRow({
  item,
  getStatusBadge,
  getTypeBadge,
  renderPriorityStars,
  onEdit,
  onView,
  onSpawnWorker,
  onComplete,
  onRemove,
  onApprove,
  onAssignToMe,
  onReject,
  isSpawning,
  isCompleting,
  isRemoving,
  isApproving,
  isAssigning,
  assignedSession,
  workerProgress,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted/50' : ''}>
      <TableCell className="w-8">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {getTypeBadge(item.source)}
          <div>
            <div className="font-semibold">{item.specTitle || item.specId}</div>
            <div className="text-xs text-muted-foreground">{item.specId}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(item.status)}</TableCell>
      <TableCell>{renderPriorityStars(item.priority)}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(item.addedAt), { addSuffix: true })}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {assignedSession ? (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{assignedSession.name || `Session ${assignedSession.id}`}</span>
          </div>
        ) : (
          <span className="text-muted-foreground/50">Unassigned</span>
        )}
      </TableCell>
      <TableCell>
        {workerProgress !== undefined ? (
          <div className="space-y-1">
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${workerProgress}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground text-center">{workerProgress}%</div>
          </div>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => onView(item)} title="View spec">
            <Eye className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(item)} title="Edit spec">
            <Edit className="h-3 w-3" />
          </Button>
          {item.status === 'queued' && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => onApprove(item)}
                disabled={isApproving}
                className="flex items-center gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAssignToMe(item)}
                disabled={isAssigning}
                className="flex items-center gap-1"
              >
                <UserPlus className="h-3 w-3" />
                Assign to Me
              </Button>
            </>
          )}
          {item.status === 'assigned' && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => onSpawnWorker(item)}
                disabled={isSpawning}
                className="flex items-center gap-1"
              >
                <Bot className="h-3 w-3" />
                Spawn
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onComplete(item)}
                disabled={isCompleting}
                className="flex items-center gap-1"
              >
                <User className="h-3 w-3" />
                Manual
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onReject(item)}
            title="Reject spec"
          >
            <XCircle className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onRemove(item)}
            disabled={isRemoving}
            title="Remove from queue"
          >
            Remove
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

type SortField = 'priority' | 'age' | 'status'
type SortDirection = 'asc' | 'desc'

export function WorkQueueTab({ filters }: WorkQueueTabProps) {
  const router = useRouter()
  const utils = trpc.useUtils()
  const projectId = filters.projectId || 1
  const [items, setItems] = useState<any[]>([])
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: sessions } = trpc.sessions.list.useQuery()
  const { data: workQueue, isLoading } = trpc.workQueue.getQueue.useQuery({ projectId })
  const { data: workers } = trpc.workerAgent.listActive.useQuery()

  // Real-time subscription
  trpc.workQueue.subscribe.useSubscription(
    { projectId },
    {
      onData: (event) => {
        if (event.type === 'item_added') {
          utils.workQueue.getQueue.invalidate()
          toast.success('New work item added')
        } else if (event.type === 'item_removed') {
          utils.workQueue.getQueue.invalidate()
          toast('Work item removed')
        } else if (event.type === 'status_changed') {
          utils.workQueue.getQueue.invalidate()
        } else if (event.type === 'item_reordered') {
          utils.workQueue.getQueue.invalidate()
        }
      },
    }
  )

  // Sync items from query data
  useEffect(() => {
    if (workQueue) {
      setItems(workQueue)
    }
  }, [workQueue])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const reorderMutation = trpc.workQueue.reorder.useMutation({
    onSuccess: () => {
      toast.success('Work queue reordered')
    },
    onError: (error) => {
      toast.error(`Failed to reorder: ${error.message}`)
      // Rollback to server state
      if (workQueue) {
        setItems(workQueue)
      }
    },
  })

  const spawnWorker = trpc.workerAgent.spawn.useMutation({
    onSuccess: () => {
      utils.workQueue.getQueue.invalidate()
      utils.workerAgent.listActive.invalidate()
      toast.success('Worker spawned successfully')
    },
    onError: (error) => {
      toast.error(`Failed to spawn worker: ${error.message}`)
    },
  })

  const completeItem = trpc.workQueue.complete.useMutation({
    onSuccess: () => {
      utils.workQueue.getQueue.invalidate()
      utils.workQueue.stats.invalidate()
      toast.success('Work item marked as completed')
    },
  })

  const removeItem = trpc.workQueue.remove.useMutation({
    onSuccess: () => {
      utils.workQueue.getQueue.invalidate()
      utils.workQueue.stats.invalidate()
      toast.success('Work item removed from queue')
    },
  })

  const approveSpec = trpc.lifecycle.approve.useMutation({
    onSuccess: () => {
      utils.workQueue.getQueue.invalidate()
      utils.lifecycle.listByStatus.invalidate()
      toast.success('Spec approved and added to work queue')
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`)
    },
  })

  const assignToSession = trpc.workQueue.assign.useMutation({
    onSuccess: () => {
      utils.workQueue.getQueue.invalidate()
      toast.success('Work item assigned to your session')
    },
    onError: (error) => {
      toast.error(`Failed to assign: ${error.message}`)
    },
  })

  const rejectSpec = trpc.lifecycle.reject.useMutation({
    onSuccess: () => {
      utils.workQueue.getQueue.invalidate()
      utils.lifecycle.listByStatus.invalidate()
      setShowRejectDialog(false)
      setRejectReason('')
      setSelectedItem(null)
      toast.success('Spec rejected and archived')
    },
    onError: (error) => {
      toast.error(`Failed to reject: ${error.message}`)
    },
  })

  const getActiveSessionId = (projectId: number): number | undefined => {
    return sessions?.find((s: any) => s.projectId === projectId && s.status === 'running')?.id
  }

  const getTypeBadge = (source: string) => {
    if (source === 'error') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Error
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <FileText className="h-3 w-3" />
        Spec
      </Badge>
    )
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getWorkerProgress = (specId: string) => {
    const worker = workers?.find((w: any) => w.specId === specId)
    if (!worker) return undefined
    // Mock progress calculation - would come from worker metadata
    return Math.floor(Math.random() * 100) // Replace with actual progress
  }

  const getAssignedSession = (sessionId: number | null) => {
    if (!sessionId) return null
    return sessions?.find((s: any) => s.id === sessionId)
  }

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    // Optimistic update
    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems)

    // Send to server
    const newOrder = newItems.map((item) => item.id)
    reorderMutation.mutate({ projectId, newOrder })
  }

  // Apply filters and sorting to items
  const filteredItems = items
    .filter((item: any) => {
      if (filters.status && filters.status.length > 0 && !filters.status.includes(item.status)) {
        return false
      }
      if (filters.priority && (item.priority < filters.priority[0] || item.priority > filters.priority[1])) {
        return false
      }
      if (filters.search && !item.specTitle?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      return true
    })
    .sort((a: any, b: any) => {
      let comparison = 0

      if (sortField === 'priority') {
        comparison = b.priority - a.priority // Higher priority first by default
      } else if (sortField === 'age') {
        comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime() // Older first by default
      } else if (sortField === 'status') {
        const statusOrder = ['queued', 'assigned', 'blocked', 'completed']
        comparison = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

  const handleView = (item: any) => {
    router.push(`/dashboard/lifecycle/${item.specId}`)
  }

  const handleEdit = (item: any) => {
    router.push(`/dashboard/spec-editor/${item.specId}`)
  }

  const handleSpawnWorker = (item: any) => {
    const sessionId = getActiveSessionId(item.projectId)
    if (!sessionId) {
      toast.error('No active session. Please start a session first.')
      return
    }
    spawnWorker.mutate({
      sessionId,
      specId: item.specId,
    })
  }

  const handleComplete = (item: any) => {
    completeItem.mutate({ workItemId: item.id })
  }

  const handleRemove = (item: any) => {
    removeItem.mutate({ workItemId: item.id })
  }

  const handleApprove = (item: any) => {
    approveSpec.mutate({ specId: item.specId })
  }

  const handleAssignToMe = (item: any) => {
    const sessionId = getActiveSessionId(item.projectId)
    if (!sessionId) {
      toast.error('No active session. Please start a session first.')
      return
    }
    assignToSession.mutate({
      workItemId: item.id,
      sessionId,
    })
  }

  const handleReject = (item: any) => {
    setSelectedItem(item)
    setShowRejectDialog(true)
  }

  const confirmReject = () => {
    if (!selectedItem) return
    rejectSpec.mutate({ specId: selectedItem.specId, reason: rejectReason })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Queue</CardTitle>
        <CardDescription>
          Drag to reorder • Real-time updates enabled
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : !filteredItems || filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No work items match your filters
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Spec</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('status')}
                      className="h-8 px-2"
                    >
                      Status
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('priority')}
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
                      onClick={() => handleSort('age')}
                      className="h-8 px-2"
                    >
                      Age
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <SortableContext items={filteredItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {filteredItems.map((item: any) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      getStatusBadge={getStatusBadge}
                      getTypeBadge={getTypeBadge}
                      renderPriorityStars={renderPriorityStars}
                      onView={handleView}
                      onEdit={handleEdit}
                      onSpawnWorker={handleSpawnWorker}
                      onComplete={handleComplete}
                      onRemove={handleRemove}
                      onApprove={handleApprove}
                      onAssignToMe={handleAssignToMe}
                      onReject={handleReject}
                      isSpawning={spawnWorker.isPending}
                      isCompleting={completeItem.isPending}
                      isRemoving={removeItem.isPending}
                      isApproving={approveSpec.isPending}
                      isAssigning={assignToSession.isPending}
                      assignedSession={getAssignedSession(item.sessionId)}
                      workerProgress={getWorkerProgress(item.specId)}
                    />
                  ))}
                </TableBody>
              </SortableContext>
            </Table>
          </DndContext>
        )}
      </CardContent>

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
    </Card>
  )
}
