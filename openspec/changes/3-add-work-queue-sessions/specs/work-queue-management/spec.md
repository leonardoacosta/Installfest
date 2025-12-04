## ADDED Requirements

### Requirement: Work Queue Table and CRUD Operations
The system SHALL provide a persistent work queue for tracking and prioritizing approved specs per project.

#### Scenario: Add spec to work queue
- **WHEN** a spec transitions from 'proposing' to 'approved' state
- **THEN** the spec is automatically added to the project's work queue
- **AND** the work queue item has status='queued'
- **AND** priority is calculated based on spec classification and age
- **AND** position is set to end of queue

#### Scenario: Query work queue
- **WHEN** GET /api/work-queue called with projectId
- **THEN** returns array of work queue items sorted by priority DESC, position ASC
- **AND** each item includes: id, specId, title, status, priority, age, blockedBy status
- **AND** items can be filtered by status and priority

#### Scenario: Reorder work queue
- **WHEN** PATCH /api/work-queue/reorder called with new position order
- **THEN** positions are updated for specified items
- **AND** all items maintain correct sort order (no gaps)
- **AND** positions are contiguous (0, 1, 2, ...)

#### Scenario: Remove from work queue
- **WHEN** work queue item is completed or cancelled
- **THEN** item is removed from work queue table
- **AND** next queued item becomes first in line

### Requirement: Priority Calculation
Work queue items SHALL be prioritized based on multiple factors.

#### Scenario: Auto-generated spec priority
- **WHEN** spec is created from Playwright error with classification
- **THEN** priority is set based on classification:
  - PERSISTENT failures → Priority 5 (critical)
  - RECURRING failures → Priority 4 (high)
  - FLAKY failures → Priority 3 (medium)
  - NEW failures → Priority 2 (low)

#### Scenario: Age bonus calculation
- **WHEN** work queue item queued for 1+ weeks
- **THEN** priority is increased by 1 per week waiting
- **AND** priority capped at 5

#### Scenario: Dependency-aware prioritization
- **WHEN** work queue item is blocked (blockedBy set)
- **THEN** item remains in queue but cannot be assigned
- **AND** priority not increased while blocked

### Requirement: Work Item Status Management
Work queue items SHALL transition through distinct statuses.

#### Scenario: Work item status transitions
- **WHEN** work queue item is created
- **THEN** status is 'queued' (ready for assignment)
- **WHEN** session is assigned to work item
- **THEN** status changes to 'assigned'
- **WHEN** all tasks are marked complete in tasks.md
- **THEN** status changes to 'completed' (awaiting review)

#### Scenario: Blocked work items
- **WHEN** work queue item has blockedBy set to another specId
- **THEN** item status is 'blocked'
- **AND** item cannot be assigned to a session
- **WHEN** blocking spec transitions to 'applied' state
- **THEN** blockedBy is cleared and status reverts to 'queued'

### Requirement: Session-to-Work-Item Assignment
Sessions SHALL be linkable to work queue items for tracking active work.

#### Scenario: Assign session to work item
- **WHEN** user clicks "Assign to My Session" for a queued work item
- **THEN** sessions.currentWorkItemId is updated to that workItemId
- **AND** workQueue.status is set to 'assigned'
- **AND** workQueue.assignedAt is set to current timestamp
- **AND** session detail view shows linked spec title

#### Scenario: Unassign session from work item
- **WHEN** user stops session or manually unassigns
- **THEN** sessions.currentWorkItemId is set to null
- **AND** workQueue.status reverts to 'queued'
- **AND** workQueue.assignedAt is cleared

#### Scenario: Query session's work item
- **WHEN** session detail view loads
- **THEN** if sessions.currentWorkItemId is set, fetch work item details
- **AND** show spec title, priority, status in session sidebar

### Requirement: Session Activity Monitoring
The system SHALL track session activity to determine if session is active, idle, or ended.

#### Scenario: Detect active session
- **WHEN** session has hook event (tool execution) within last 5 minutes
- **THEN** session activityStatus is 'running'
- **AND** session shows green indicator in dashboard

#### Scenario: Detect idle session
- **WHEN** session has no hook events for 5-30 minutes
- **THEN** session activityStatus is 'idle'
- **AND** session shows yellow indicator in dashboard

#### Scenario: Detect ended session
- **WHEN** session status='stopped' OR no hook events for 30+ minutes
- **THEN** session activityStatus is 'stopped'
- **AND** if sessions.currentWorkItemId is set, mark work item 'queued' and unassign
- **AND** session shows gray indicator in dashboard

### Requirement: Work Queue Dashboard
The system SHALL provide UI for viewing and managing work queues.

#### Scenario: Work queue table display
- **WHEN** user navigates to /dashboard/work-queue
- **THEN** displays table of work items for selected project
- **AND** columns: Type badge, Title, Status badge, Priority (stars), Age, Assigned Session, Actions
- **AND** table sorted by priority DESC, position ASC

#### Scenario: Filter work queue
- **WHEN** user adjusts filters: status, priority, search
- **THEN** table updates to show only matching items
- **AND** filters are persisted to localStorage

#### Scenario: Drag-and-drop reordering
- **WHEN** user drags work queue row to new position
- **THEN** item position is updated in UI
- **AND** API call is made to workQueue.reorder
- **AND** if API fails, UI reverts to previous order

#### Scenario: Work item actions
- **WHEN** user clicks "Assign to My Session" on queued item
- **THEN** session is linked to work item
- **AND** row updates to show session assignment
- **WHEN** user clicks "View" on work item
- **THEN** navigates to spec detail page
- **WHEN** user clicks "Complete" on assigned item
- **THEN** work item status changes to 'completed'

### Requirement: Dependency Detection and Blocking
Work queue items SHALL detect cross-spec dependencies.

#### Scenario: Detect dependency
- **WHEN** spec proposal contains text like "depends on {OtherSpec}"
- **THEN** system detects reference and sets blockedBy to OtherSpec ID
- **AND** work queue item status is 'blocked'

#### Scenario: Auto-unblock on dependency completion
- **WHEN** blocking spec transitions to 'applied' state
- **THEN** all items with blockedBy set to that spec ID
- **AND** blockedBy is cleared and status reverts to 'queued'
- **AND** dashboard notification shows "Blocked items now ready"

### Requirement: Real-Time Work Queue Updates
The system SHALL stream work queue changes to connected clients.

#### Scenario: Subscribe to work queue changes
- **WHEN** client calls workQueue.subscribe({ projectId })
- **THEN** server streams events for that project's work queue
- **AND** event types: item_added, item_removed, item_reordered, status_changed, dependency_unblocked

#### Scenario: Real-time item addition
- **WHEN** new spec is approved and added to work queue
- **THEN** subscription event is emitted with new item details
- **AND** dashboard table updates with new row (with animation)

#### Scenario: Real-time status change
- **WHEN** work item status changes (assigned/completed/unblocked)
- **THEN** subscription event is emitted
- **AND** dashboard updates affected row (status badge, assigned session, position)

## MODIFIED Requirements

### Requirement: Spec Lifecycle Management
Specs SHALL transition through 7-state workflow with integration to work queue.

#### Scenario: Queue work item on approval
- **WHEN** spec transitions from 'proposing' to 'approved'
- **THEN** spec is automatically added to work queue
- **AND** work item created with calculated priority
- **AND** work item status is 'queued'

#### Scenario: Mark assigned on session link
- **WHEN** session is assigned to work item via workQueue.assign
- **THEN** spec status remains 'approved' (lifecycle unchanged)
- **AND** work item status changes to 'assigned'
- **AND** work item assignedAt is set

#### Scenario: Mark completed on task completion
- **WHEN** all tasks marked [x] complete in tasks.md
- **THEN** work item status changes to 'completed'
- **AND** if lifecycle not yet 'in_progress', transition now
- **AND** if lifecycle still 'assigned', transition to 'in_progress' then 'review'
