# Implementation Tasks: Work Queue and Session Management

## Phase 3.1: Work Queue Database Schema

### 3.1.1 Work Queue Table Schema
- [x] Create `workQueue` table in `packages/db/src/schema/work-queue.ts`
  - [x] Add id (primary key), projectId (foreign key), specId (foreign key)
  - [x] Add priority (integer 1-5), position (integer for ordering)
  - [x] Add status enum: 'queued' | 'assigned' | 'blocked' | 'completed'
  - [x] Add blockedBy (nullable foreign key to specId)
  - [x] Add addedAt, assignedAt (nullable), completedAt (nullable) timestamps
  - [x] Add indexes: (projectId, status), (specId), (priority, position)

### 3.1.2 Sessions Table Extension
- [x] Update `sessions` table in `packages/db/src/schema/sessions.ts`
  - [x] Add currentWorkItemId (nullable foreign key to workQueue.id)
  - [x] Add lastActivityAt (nullable timestamp, tracks last hook event)
  - [x] Add activityStatus enum: 'running' | 'idle' | 'stopped' (computed, not stored)
  - [x] Add index: (currentWorkItemId) for quick lookup

### 3.1.3 Export and Verify Schema
- [x] Export new schemas from `packages/db/src/schema/index.ts`
- [x] Run migrations to create tables in local SQLite
- [x] Verify foreign key constraints work

## Phase 3.2: Zod Validators

### 3.2.1 Work Queue Item Validators
- [x] Create `packages/validators/src/work-queue.ts`
  - [x] `workQueueItemSchema` - Complete work item with id, specId, priority, status
  - [x] `workQueueStatusEnum` - 'queued' | 'assigned' | 'blocked' | 'completed'
  - [x] `workQueueFilterSchema` - Query filters (projectId, statuses[], priorityMin/Max)
  - [x] `workQueueReorderSchema` - Array of items with new positions

### 3.2.2 Validators Integration
- [x] Test validators with valid/invalid inputs
- [x] Ensure error messages are helpful

## Phase 3.3: Work Queue Service

### 3.3.1 Create WorkQueueService Class
- [x] Create `packages/api/src/services/work-queue.ts`
  - [x] Constructor accepts database client
  - [x] Import Drizzle ORM and workQueue table

### 3.3.2 Core CRUD Operations
- [x] `addToQueue(projectId, specId, priority)` - Insert new work item
  - [x] Validate spec exists and status='approved'
  - [x] Find max position for project, insert at end
  - [x] Return inserted work item
- [x] `removeFromQueue(workItemId)` - Delete work item
  - [x] Verify item exists
  - [x] Delete and return success status
- [x] `getQueue(projectId, filter?)` - Query work items
  - [x] Filter by status if provided
  - [x] Sort by priority DESC, then position ASC
  - [x] Return array of work items with spec details (title, etc.)
- [x] `completeWorkItem(workItemId)` - Mark as completed
  - [x] Set status='completed', set completedAt=now()
  - [x] Update position (move to end if reordering)

### 3.3.3 Priority Calculation
- [x] `calculatePriority(spec)` - Compute priority from multiple factors
  - [x] Base: PERSISTENT→5, RECURRING→4, FLAKY→3, NEW→2 (if auto-generated)
  - [x] User-created: Use user-specified priority (default 3)
  - [x] Age bonus: +1 per week queued (capped at 5)
  - [x] Detect classification from spec proposal content (regex match)
  - [x] Return final priority (1-5)

### 3.3.4 Dependency Management
- [x] `blockWorkItem(workItemId, blockedBySpecId)` - Set dependency
  - [x] Validate both specs exist
  - [x] Update blockedBy field
  - [x] Query: Check if blocker spec is in 'applied' state
  - [x] If blocker already applied: Don't block (no dependency)
- [x] `unblockWorkItem(workItemId)` - Remove dependency
  - [x] Set blockedBy=null, status='queued'
- [x] `checkAndUnblockDependents(specId)` - Auto-unblock waiting items
  - [x] Called when spec reaches 'applied' state
  - [x] Query: Find all items where blockedBy=specId
  - [x] For each: Set blockedBy=null, status='queued'
  - [x] Emit subscription event for each unblocked item

### 3.3.5 Reordering
- [x] `reorderQueue(projectId, newOrder)` - Update item positions
  - [x] newOrder = array of {workItemId, newPosition}
  - [x] Validate all items belong to same project
  - [x] Update position column for each item
  - [x] Verify no gaps in positions (0, 1, 2, ...)
  - [x] Emit subscription event with new order

### 3.3.6 Work Item Assignment
- [x] `assignWorkItem(workItemId, sessionId)` - Link session to queue item
  - [x] Validate work item exists and status='queued'
  - [x] Validate session exists
  - [x] Update workQueue.status='assigned', assignedAt=now()
  - [x] Update sessions.currentWorkItemId=workItemId
  - [x] Emit events: work_item_assigned, session_assigned

### 3.3.7 Error Handling
- [x] Wrap all DB operations in try-catch
- [x] Return meaningful error messages
- [x] Log errors to console for debugging

## Phase 3.4: Session Activity Monitoring

### 3.4.1 Session Activity Service
- [x] Create `packages/api/src/services/session-monitor.ts`
  - [x] `getSessionActivity(sessionId)` - Query latest hook timestamp
  - [x] `isSessionActive(sessionId, thresholdMs = 5*60*1000)` - Check last activity
  - [x] `isSessionEnded(sessionId, thresholdMs = 30*60*1000)` - Check if should auto-close
  - [x] `updateSessionActivity(sessionId)` - Set lastActivityAt=now()

### 3.4.2 Activity Status Calculation
- [x] `calculateActivityStatus(session)` - Return 'running' | 'idle' | 'stopped'
  - [x] If lastActivityAt within 5 min: 'running'
  - [x] If lastActivityAt within 30 min: 'idle'
  - [x] If status='stopped' or >30 min: 'stopped'
  - [x] Return status

### 3.4.3 Hook Integration
- [x] On each hook.create event (from send_event)
  - [x] Find session by hook.sessionId
  - [x] Call sessionMonitor.updateSessionActivity(sessionId)
  - [x] This automatically updates lastActivityAt

## Phase 3.5: Work Queue tRPC Router

### 3.5.1 Create Router File
- [x] Create `packages/api/src/router/work-queue.ts`
  - [x] Import WorkQueueService, validators, tRPC
  - [x] Create router = t.router({ ... })

### 3.5.2 Query Procedures
- [x] `workQueue.getQueue` procedure
  - [x] Input: `{ projectId: number, filter?: workQueueFilterSchema }`
  - [x] Call: workQueueService.getQueue(projectId, filter)
  - [x] Return: Array of work queue items with spec details
- [x] `workQueue.stats` procedure
  - [x] Input: `{ projectId: number }`
  - [x] Return: { totalQueued, totalAssigned, totalBlocked, highestPriority }

### 3.5.3 Mutation Procedures
- [x] `workQueue.add` procedure
  - [x] Input: `{ projectId: number, specId: string, priority?: number }`
  - [x] Call: workQueueService.addToQueue()
  - [x] Return: Created work item
- [x] `workQueue.reorder` procedure
  - [x] Input: `{ projectId: number, newOrder: [{workItemId, newPosition}] }`
  - [x] Call: workQueueService.reorderQueue()
  - [x] Return: Updated queue
- [x] `workQueue.assign` procedure
  - [x] Input: `{ workItemId: string, sessionId: string }`
  - [x] Call: workQueueService.assignWorkItem()
  - [x] Return: Updated work item and session
- [x] `workQueue.complete` procedure
  - [x] Input: `{ workItemId: string }`
  - [x] Call: workQueueService.completeWorkItem()
  - [x] Return: Updated work item
- [x] `workQueue.unblock` procedure
  - [x] Input: `{ workItemId: string }`
  - [x] Call: workQueueService.unblockWorkItem()
  - [x] Return: Updated work item

### 3.5.4 Subscription Procedure
- [x] `workQueue.subscribe` procedure
  - [x] Input: `{ projectId?: number }`
  - [x] Stream events: item_added, item_removed, item_reordered, status_changed, dependency_unblocked
  - [x] Include: type, workItemId, projectId, details in each event
  - [x] Emit real-time updates when procedures modify queue

### 3.5.5 Integration with Root Router
- [x] Import workQueueRouter in `packages/api/src/root.ts`
- [x] Export as part of appRouter

## Phase 3.6: Session Integration

### 3.6.1 Update Session Queries
- [x] Add `currentWorkItemId` to session response schema
- [x] Add `activityStatus` (computed from lastActivityAt) to session response
- [x] When fetching sessions, include work item title if assigned

### 3.6.2 Session Lifecycle Hooks
- [x] On spec approval (lifecyle.transitionTo proposing→approved)
  - [x] Call: workQueueService.addToQueue(projectId, specId, calculatedPriority)
  - [x] Emit: work_item_queued event
- [x] On session stop
  - [x] If session.currentWorkItemId set: Mark work item back to 'queued'
  - [x] Clear sessions.currentWorkItemId
  - [x] Emit: work_item_unassigned event

## Phase 3.7: Dashboard Work Queue Tab

### 3.7.1 Create Work Queue Page Component
- [x] Create `apps/claude-agent-web/src/app/dashboard/work-queue/page.tsx`
  - [x] Layout: Filter sidebar + main table
  - [x] Use tRPC query: workQueue.getQueue

### 3.7.2 Filter Sidebar
- [x] Component: `FilterSidebar.tsx` (reusable)
  - [x] Project dropdown (multi-select or single)
  - [x] Status checkboxes: queued, assigned, blocked, completed
  - [x] Priority range slider (1-5)
  - [x] Search input (fuzzy match on spec title)
  - [x] Apply/Reset buttons
  - [x] Persist filters to localStorage

### 3.7.3 Work Queue Table
- [x] Component: `WorkQueueTable.tsx`
  - [x] Columns: Type (spec/error badge), Title, Status (badge), Priority (stars), Age (human-readable), Assigned To (session name or "-"), Actions
  - [x] Sortable columns: Priority, Age, Status
  - [x] Row actions: View (link to spec), Edit, "Assign to My Session", Complete, Delete
  - [x] Row styling: Blocked items shown in muted color with lock icon

### 3.7.4 Drag-and-Drop Reordering
- [x] Add library: `@dnd-kit/sortable` or `react-beautiful-dnd`
  - [x] Add to package.json
- [x] Implement drag handle on each row
- [x] On drop: Call workQueue.reorder with new order
- [x] Optimistic UI update, rollback on error
- [x] Show loading indicator during reorder

### 3.7.5 Real-Time Updates
- [x] Use tRPC subscription: workQueue.subscribe({ projectId })
- [x] On item_added: Add row to table with animation
- [x] On status_changed: Update row color/badge
- [x] On item_reordered: Reorder rows with animation
- [x] On dependency_unblocked: Update row status badge
- [x] Scroll to new items on add

### 3.7.6 Session Assignment UI
- [x] "Assign to My Session" button
  - [x] Get current user's active session (from context)
  - [x] Call: workQueue.assign({ workItemId, sessionId })
  - [x] Show confirmation: "Assigned {specTitle} to your session"
  - [x] Update row to show session assignment
- [x] Display assigned session name in table

## Phase 3.8: Testing

### 3.8.1 Unit Tests for WorkQueueService
- [x] Test addToQueue: Valid input creates item at end of queue
- [x] Test addToQueue: Rejects non-approved specs
- [x] Test getQueue: Returns items sorted by priority, then position
- [x] Test calculatePriority: PERSISTENT=5, RECURRING=4, FLAKY=3, NEW=2
- [x] Test calculatePriority: Age bonus works correctly
- [x] Test blockWorkItem: Sets blockedBy correctly
- [x] Test reorderQueue: Updates positions, no gaps
- [x] Test checkAndUnblockDependents: Unblocks items when blocker applied
- [x] Test assignWorkItem: Links session and work item

### 3.8.2 Integration Tests
- [x] Create test project with approved specs
- [x] Add multiple specs to queue
- [x] Verify queue returns items in priority order
- [x] Test reordering via API
- [x] Test blocking/unblocking
- [x] Create session, assign work item
- [x] Verify session.currentWorkItemId updated
- [x] Verify activity monitoring detects session activity

### 3.8.3 E2E Tests
- [x] Navigate to /dashboard/work-queue
- [x] Filter by project, status, priority
- [x] View work queue table
- [x] Drag item to new position
- [x] Click "Assign to My Session"
- [x] Verify real-time updates on queue changes

## Phase 3.9: Documentation

### 3.9.1 Update CLAUDE.md
- [x] Add section on work queue management
- [x] Document work item statuses and lifecycle
- [x] Link to OpenSpec specs

### 3.9.2 Create Inline Documentation
- [x] JSDoc comments on WorkQueueService methods
- [x] tRPC router documentation

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
