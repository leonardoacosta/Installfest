# Change: Add Work Queue and Session Management

## Why

The Claude agent service has bidirectional spec sync (Change 1) and lifecycle management (Change 2), but lacks work queue infrastructure for coordinating which specs to work on next. This creates a bottleneck: approved specs pile up with no prioritization, and there's no way to track which user-initiated Claude Code sessions are working on which specs.

By adding work queue management and session coordination, the Claude agent service becomes capable of:
- **Prioritized Work Queue**: Specs ordered by priority (5-critical to 1-low), age, and dependencies
- **Manual Session Coordination**: Users open Claude Code sessions manually; the system tracks which session works on which spec
- **Session Heartbeating**: Monitor active sessions via hook activity, detect idleness
- **Dependency Management**: Block specs until prerequisites complete
- **Queue Reordering**: Users manually adjust priority and order via dashboard UI

This change focuses on **manual user-initiated sessions** (users explicitly open Claude Code for a spec), not programmatic spawning. That comes in Change 4.

## What Changes

### Work Queue Table and Management

- **New Table**: `workQueue` tracks prioritized work items per project
  - Fields: id, projectId, specId, priority (1-5), position (order), status (queued|assigned|blocked|completed)
  - Indexes: projectId, specId, priority, status
  - Foreign keys: projectId, specId
- **Work Item Status**:
  - `queued` - Approved spec ready to be picked up
  - `assigned` - Session actively working on this item
  - `blocked` - Waiting for dependency (blockedBy field)
  - `completed` - Work finished, awaiting review
- **Dependency Tracking**: `blockedBy` field references another specId, auto-unblocks when dependency reaches 'applied' state

### Session-to-Work-Item Linking

- **Sessions Enhancement**: Add `currentWorkItemId` (nullable) to sessions table to track which spec the session is working on
- **Work Item Assignment**: When user selects a spec from work queue, create session and link it via currentWorkItemId
- **Session Activity**: Query hooks table to detect if session is still active
  - Active = has hook events in last 5 minutes
  - Idle = no events for 5+ minutes
  - Ended = session explicitly stopped or 30+ minutes idle

### Work Queue Service

- **Add `WorkQueueService`** in `packages/api/src/services/work-queue.ts`
  - `addToQueue(projectId, specId, priority)` - Add approved spec to work queue
  - `removeFromQueue(workItemId)` - Remove completed/cancelled item
  - `reorderQueue(projectId, newOrder)` - Update item positions (user drag-and-drop)
  - `getQueue(projectId)` - Return queue sorted by priority/position
  - `assignWorkItem(workItemId, sessionId)` - Link session to queue item
  - `completeWorkItem(workItemId)` - Mark as completed (awaiting review)
  - `blockWorkItem(workItemId, blockedBySpecId)` - Set dependency
  - `calculatePriority(spec)` - Compute priority from: classification (PERSISTENT=5, RECURRING=4, FLAKY=3, NEW=2), age bonus (+1 per week), user-specified priority

### Priority Calculation

- **Auto-Generated from Errors**: PERSISTENT=5, RECURRING=4, FLAKY=3, NEW=2
- **User-Created Specs**: Use user-specified priority (default 3)
- **Age Bonus**: +1 priority per week queued (capped at 5)
- **Dependency Impact**: Higher priority specs that are blocked notify users

### Zod Validators

- **New Validators** in `packages/validators/src/work-queue.ts`
  - `workQueueItemSchema` - Work item with priority and status
  - `workQueueFilterSchema` - Query filters (projectId, status, priorityRange)
  - `workQueueReorderSchema` - Reorder payload

### tRPC Router

- **New Router**: `packages/api/src/router/work-queue.ts`
  - `workQueue.getQueue({ projectId, filter? })` - List work items, sorted by priority
  - `workQueue.addItem({ projectId, specId, priority })` - Add approved spec to queue
  - `workQueue.reorder({ projectId, newOrder })` - Update item order (user drag-and-drop)
  - `workQueue.assign({ workItemId, sessionId })` - Link session to work item
  - `workQueue.complete({ workItemId })` - Mark as completed (awaiting review)
  - `workQueue.unblock({ workItemId })` - Remove dependency block
  - `workQueue.subscribe({ projectId })` - Stream work queue changes (item added/removed/reordered/status changed)

### Session Heartbeat Monitoring

- **Session Activity Service**: Track active sessions via hook events
  - Query: Last hook timestamp for each session
  - Idle threshold: 5+ minutes = idle
  - Ended threshold: 30+ minutes = ended (auto-close)
- **Idle/Active Status**: Include in session response (`status` field becomes 'running'|'idle'|'stopped')
- **Dashboard Indicator**: Visual status badge (green=active, yellow=idle, gray=stopped)

### Dashboard Work Queue Tab

- **New UI Tab**: `/dashboard/work-queue`
  - Table of work items: Type badge, Title, Status, Priority (stars), Age, Assigned Session (if any), Actions
  - Drag-and-drop reordering for priority adjustment
  - Filter sidebar: Project, Status multi-select, Priority range
  - "View", "Edit", "Assign to My Session", "Complete" actions per row
  - Real-time updates via subscription (new items, status changes, reordering)

## Impact

### Affected Specs
- **work-queue-management**: ADDED - Spec for work queue CRUD and prioritization
- **session-management**: MODIFIED - Add currentWorkItemId and activity tracking fields
- **spec-lifecycle-management**: MODIFIED - Trigger "queued" state on approval, update blockedBy handling

### Affected Code
- `homelab-services/packages/db/src/schema/work-queue.ts` - NEW table schema
- `homelab-services/packages/api/src/services/work-queue.ts` - NEW service class
- `homelab-services/packages/validators/src/work-queue.ts` - NEW validators
- `homelab-services/packages/api/src/router/work-queue.ts` - NEW tRPC router
- `homelab-services/apps/claude-agent-web/src/app/dashboard/work-queue/page.tsx` - NEW UI page
- `homelab-services/packages/db/src/schema/sessions.ts` - MODIFIED (add currentWorkItemId)
- `homelab-services/packages/api/src/services/session-monitor.ts` - MODIFIED (add activity tracking)

### Dependencies
- **Existing**: Drizzle ORM, tRPC, Zod
- **New**: None
- **Prerequisite**: Change 1 (Sync) and Change 2 (Lifecycle) must be complete

### Breaking Changes
None. Purely additive. Existing sessions continue working, new queuing is opt-in.

## Acceptance Criteria

- [ ] Work queue table created with schema as defined
- [ ] WorkQueueService implements all listed methods
- [ ] Work queue tRPC router callable and functional
- [ ] Priority calculation algorithm works correctly (base + age + bonuses)
- [ ] Dependencies block items correctly, unblock on target completion
- [ ] Session assignment links currentWorkItemId properly
- [ ] Session activity monitoring detects idle/active/ended status
- [ ] Drag-and-drop reordering updates positions and triggers API call
- [ ] Real-time subscription streams work queue changes
- [ ] Dashboard work queue tab renders correctly with all filters
- [ ] Tests pass (unit tests for service, integration tests for queue ordering)
