# Implementation Tasks: Work Queue and Session Management

## Phase 3.1: Work Queue Database Schema

### 3.1.1 Work Queue Table Schema
- [ ] Create `workQueue` table in `packages/db/src/schema/work-queue.ts`
  - [ ] Add id (primary key), projectId (foreign key), specId (foreign key)
  - [ ] Add priority (integer 1-5), position (integer for ordering)
  - [ ] Add status enum: 'queued' | 'assigned' | 'blocked' | 'completed'
  - [ ] Add blockedBy (nullable foreign key to specId)
  - [ ] Add addedAt, assignedAt (nullable), completedAt (nullable) timestamps
  - [ ] Add indexes: (projectId, status), (specId), (priority, position)

### 3.1.2 Sessions Table Extension
- [ ] Update `sessions` table in `packages/db/src/schema/sessions.ts`
  - [ ] Add currentWorkItemId (nullable foreign key to workQueue.id)
  - [ ] Add lastActivityAt (nullable timestamp, tracks last hook event)
  - [ ] Add activityStatus enum: 'running' | 'idle' | 'stopped' (computed, not stored)
  - [ ] Add index: (currentWorkItemId) for quick lookup

### 3.1.3 Export and Verify Schema
- [ ] Export new schemas from `packages/db/src/schema/index.ts`
- [ ] Run migrations to create tables in local SQLite
- [ ] Verify foreign key constraints work

## Phase 3.2: Zod Validators

### 3.2.1 Work Queue Item Validators
- [ ] Create `packages/validators/src/work-queue.ts`
  - [ ] `workQueueItemSchema` - Complete work item with id, specId, priority, status
  - [ ] `workQueueStatusEnum` - 'queued' | 'assigned' | 'blocked' | 'completed'
  - [ ] `workQueueFilterSchema` - Query filters (projectId, statuses[], priorityMin/Max)
  - [ ] `workQueueReorderSchema` - Array of items with new positions

### 3.2.2 Validators Integration
- [ ] Test validators with valid/invalid inputs
- [ ] Ensure error messages are helpful

## Phase 3.3: Work Queue Service

### 3.3.1 Create WorkQueueService Class
- [ ] Create `packages/api/src/services/work-queue.ts`
  - [ ] Constructor accepts database client
  - [ ] Import Drizzle ORM and workQueue table

### 3.3.2 Core CRUD Operations
- [ ] `addToQueue(projectId, specId, priority)` - Insert new work item
  - [ ] Validate spec exists and status='approved'
  - [ ] Find max position for project, insert at end
  - [ ] Return inserted work item
- [ ] `removeFromQueue(workItemId)` - Delete work item
  - [ ] Verify item exists
  - [ ] Delete and return success status
- [ ] `getQueue(projectId, filter?)` - Query work items
  - [ ] Filter by status if provided
  - [ ] Sort by priority DESC, then position ASC
  - [ ] Return array of work items with spec details (title, etc.)
- [ ] `completeWorkItem(workItemId)` - Mark as completed
  - [ ] Set status='completed', set completedAt=now()
  - [ ] Update position (move to end if reordering)

### 3.3.3 Priority Calculation
- [ ] `calculatePriority(spec)` - Compute priority from multiple factors
  - [ ] Base: PERSISTENT→5, RECURRING→4, FLAKY→3, NEW→2 (if auto-generated)
  - [ ] User-created: Use user-specified priority (default 3)
  - [ ] Age bonus: +1 per week queued (capped at 5)
  - [ ] Detect classification from spec proposal content (regex match)
  - [ ] Return final priority (1-5)

### 3.3.4 Dependency Management
- [ ] `blockWorkItem(workItemId, blockedBySpecId)` - Set dependency
  - [ ] Validate both specs exist
  - [ ] Update blockedBy field
  - [ ] Query: Check if blocker spec is in 'applied' state
  - [ ] If blocker already applied: Don't block (no dependency)
- [ ] `unblockWorkItem(workItemId)` - Remove dependency
  - [ ] Set blockedBy=null, status='queued'
- [ ] `checkAndUnblockDependents(specId)` - Auto-unblock waiting items
  - [ ] Called when spec reaches 'applied' state
  - [ ] Query: Find all items where blockedBy=specId
  - [ ] For each: Set blockedBy=null, status='queued'
  - [ ] Emit subscription event for each unblocked item

### 3.3.5 Reordering
- [ ] `reorderQueue(projectId, newOrder)` - Update item positions
  - [ ] newOrder = array of {workItemId, newPosition}
  - [ ] Validate all items belong to same project
  - [ ] Update position column for each item
  - [ ] Verify no gaps in positions (0, 1, 2, ...)
  - [ ] Emit subscription event with new order

### 3.3.6 Work Item Assignment
- [ ] `assignWorkItem(workItemId, sessionId)` - Link session to queue item
  - [ ] Validate work item exists and status='queued'
  - [ ] Validate session exists
  - [ ] Update workQueue.status='assigned', assignedAt=now()
  - [ ] Update sessions.currentWorkItemId=workItemId
  - [ ] Emit events: work_item_assigned, session_assigned

### 3.3.7 Error Handling
- [ ] Wrap all DB operations in try-catch
- [ ] Return meaningful error messages
- [ ] Log errors to console for debugging

## Phase 3.4: Session Activity Monitoring

### 3.4.1 Session Activity Service
- [ ] Create `packages/api/src/services/session-monitor.ts`
  - [ ] `getSessionActivity(sessionId)` - Query latest hook timestamp
  - [ ] `isSessionActive(sessionId, thresholdMs = 5*60*1000)` - Check last activity
  - [ ] `isSessionEnded(sessionId, thresholdMs = 30*60*1000)` - Check if should auto-close
  - [ ] `updateSessionActivity(sessionId)` - Set lastActivityAt=now()

### 3.4.2 Activity Status Calculation
- [ ] `calculateActivityStatus(session)` - Return 'running' | 'idle' | 'stopped'
  - [ ] If lastActivityAt within 5 min: 'running'
  - [ ] If lastActivityAt within 30 min: 'idle'
  - [ ] If status='stopped' or >30 min: 'stopped'
  - [ ] Return status

### 3.4.3 Hook Integration
- [ ] On each hook.create event (from send_event)
  - [ ] Find session by hook.sessionId
  - [ ] Call sessionMonitor.updateSessionActivity(sessionId)
  - [ ] This automatically updates lastActivityAt

## Phase 3.5: Work Queue tRPC Router

### 3.5.1 Create Router File
- [ ] Create `packages/api/src/router/work-queue.ts`
  - [ ] Import WorkQueueService, validators, tRPC
  - [ ] Create router = t.router({ ... })

### 3.5.2 Query Procedures
- [ ] `workQueue.getQueue` procedure
  - [ ] Input: `{ projectId: number, filter?: workQueueFilterSchema }`
  - [ ] Call: workQueueService.getQueue(projectId, filter)
  - [ ] Return: Array of work queue items with spec details
- [ ] `workQueue.stats` procedure
  - [ ] Input: `{ projectId: number }`
  - [ ] Return: { totalQueued, totalAssigned, totalBlocked, highestPriority }

### 3.5.3 Mutation Procedures
- [ ] `workQueue.add` procedure
  - [ ] Input: `{ projectId: number, specId: string, priority?: number }`
  - [ ] Call: workQueueService.addToQueue()
  - [ ] Return: Created work item
- [ ] `workQueue.reorder` procedure
  - [ ] Input: `{ projectId: number, newOrder: [{workItemId, newPosition}] }`
  - [ ] Call: workQueueService.reorderQueue()
  - [ ] Return: Updated queue
- [ ] `workQueue.assign` procedure
  - [ ] Input: `{ workItemId: string, sessionId: string }`
  - [ ] Call: workQueueService.assignWorkItem()
  - [ ] Return: Updated work item and session
- [ ] `workQueue.complete` procedure
  - [ ] Input: `{ workItemId: string }`
  - [ ] Call: workQueueService.completeWorkItem()
  - [ ] Return: Updated work item
- [ ] `workQueue.unblock` procedure
  - [ ] Input: `{ workItemId: string }`
  - [ ] Call: workQueueService.unblockWorkItem()
  - [ ] Return: Updated work item

### 3.5.4 Subscription Procedure
- [ ] `workQueue.subscribe` procedure
  - [ ] Input: `{ projectId?: number }`
  - [ ] Stream events: item_added, item_removed, item_reordered, status_changed, dependency_unblocked
  - [ ] Include: type, workItemId, projectId, details in each event
  - [ ] Emit real-time updates when procedures modify queue

### 3.5.5 Integration with Root Router
- [ ] Import workQueueRouter in `packages/api/src/root.ts`
- [ ] Export as part of appRouter

## Phase 3.6: Session Integration

### 3.6.1 Update Session Queries
- [ ] Add `currentWorkItemId` to session response schema
- [ ] Add `activityStatus` (computed from lastActivityAt) to session response
- [ ] When fetching sessions, include work item title if assigned

### 3.6.2 Session Lifecycle Hooks
- [ ] On spec approval (lifecyle.transitionTo proposing→approved)
  - [ ] Call: workQueueService.addToQueue(projectId, specId, calculatedPriority)
  - [ ] Emit: work_item_queued event
- [ ] On session stop
  - [ ] If session.currentWorkItemId set: Mark work item back to 'queued'
  - [ ] Clear sessions.currentWorkItemId
  - [ ] Emit: work_item_unassigned event

## Phase 3.7: Dashboard Work Queue Tab

### 3.7.1 Create Work Queue Page Component
- [ ] Create `apps/claude-agent-web/src/app/dashboard/work-queue/page.tsx`
  - [ ] Layout: Filter sidebar + main table
  - [ ] Use tRPC query: workQueue.getQueue

### 3.7.2 Filter Sidebar
- [ ] Component: `FilterSidebar.tsx` (reusable)
  - [ ] Project dropdown (multi-select or single)
  - [ ] Status checkboxes: queued, assigned, blocked, completed
  - [ ] Priority range slider (1-5)
  - [ ] Search input (fuzzy match on spec title)
  - [ ] Apply/Reset buttons
  - [ ] Persist filters to localStorage

### 3.7.3 Work Queue Table
- [ ] Component: `WorkQueueTable.tsx`
  - [ ] Columns: Type (spec/error badge), Title, Status (badge), Priority (stars), Age (human-readable), Assigned To (session name or "-"), Actions
  - [ ] Sortable columns: Priority, Age, Status
  - [ ] Row actions: View (link to spec), Edit, "Assign to My Session", Complete, Delete
  - [ ] Row styling: Blocked items shown in muted color with lock icon

### 3.7.4 Drag-and-Drop Reordering
- [ ] Add library: `@dnd-kit/sortable` or `react-beautiful-dnd`
  - [ ] Add to package.json
- [ ] Implement drag handle on each row
- [ ] On drop: Call workQueue.reorder with new order
- [ ] Optimistic UI update, rollback on error
- [ ] Show loading indicator during reorder

### 3.7.5 Real-Time Updates
- [ ] Use tRPC subscription: workQueue.subscribe({ projectId })
- [ ] On item_added: Add row to table with animation
- [ ] On status_changed: Update row color/badge
- [ ] On item_reordered: Reorder rows with animation
- [ ] On dependency_unblocked: Update row status badge
- [ ] Scroll to new items on add

### 3.7.6 Session Assignment UI
- [ ] "Assign to My Session" button
  - [ ] Get current user's active session (from context)
  - [ ] Call: workQueue.assign({ workItemId, sessionId })
  - [ ] Show confirmation: "Assigned {specTitle} to your session"
  - [ ] Update row to show session assignment
- [ ] Display assigned session name in table

## Phase 3.8: Testing

### 3.8.1 Unit Tests for WorkQueueService
- [ ] Test addToQueue: Valid input creates item at end of queue
- [ ] Test addToQueue: Rejects non-approved specs
- [ ] Test getQueue: Returns items sorted by priority, then position
- [ ] Test calculatePriority: PERSISTENT=5, RECURRING=4, FLAKY=3, NEW=2
- [ ] Test calculatePriority: Age bonus works correctly
- [ ] Test blockWorkItem: Sets blockedBy correctly
- [ ] Test reorderQueue: Updates positions, no gaps
- [ ] Test checkAndUnblockDependents: Unblocks items when blocker applied
- [ ] Test assignWorkItem: Links session and work item

### 3.8.2 Integration Tests
- [ ] Create test project with approved specs
- [ ] Add multiple specs to queue
- [ ] Verify queue returns items in priority order
- [ ] Test reordering via API
- [ ] Test blocking/unblocking
- [ ] Create session, assign work item
- [ ] Verify session.currentWorkItemId updated
- [ ] Verify activity monitoring detects session activity

### 3.8.3 E2E Tests
- [ ] Navigate to /dashboard/work-queue
- [ ] Filter by project, status, priority
- [ ] View work queue table
- [ ] Drag item to new position
- [ ] Click "Assign to My Session"
- [ ] Verify real-time updates on queue changes

## Phase 3.9: Documentation

### 3.9.1 Update CLAUDE.md
- [ ] Add section on work queue management
- [ ] Document work item statuses and lifecycle
- [ ] Link to OpenSpec specs

### 3.9.2 Create Inline Documentation
- [ ] JSDoc comments on WorkQueueService methods
- [ ] tRPC router documentation

## Summary

**Subtasks**: ~60
**Estimated Timeline**: 1-2 weeks
**Dependencies**: Change 1 (Sync), Change 2 (Lifecycle) complete

**Critical Path**:
1. Database schema (3.1)
2. WorkQueueService (3.3)
3. Work Queue Router (3.5)
4. Dashboard UI (3.7)
5. Real-time subscriptions (3.7.5)
6. Testing (3.8)
