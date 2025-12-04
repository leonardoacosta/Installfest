## ADDED Requirements

### Requirement: Unified Work Dashboard
The system SHALL provide a centralized dashboard for viewing and managing all work items.

#### Scenario: Dashboard main page
- **WHEN** user navigates to /app/dashboard
- **THEN** displays unified dashboard with:
  - Header stats cards: Total specs, Active work, Pending approvals, Error proposals
  - Left sidebar: Project filter, Status filter, Priority filter, Date range, Search
  - Tab navigation: Work Queue, Approvals, Master Agents, Lifecycle, Specs, Errors
  - Main content area (tabs)
- **AND** layout is responsive (mobile, tablet, desktop)
- **AND** tab selection is persisted to URL (?tab=work-queue)

#### Scenario: Switch between dashboard tabs
- **WHEN** user clicks tab
- **THEN** main content area updates to show tab content
- **AND** tab state saved to URL
- **AND** page reload restores selected tab
- **AND** filters apply across all tabs (project, status, priority)

#### Scenario: Update stats cards
- **WHEN** dashboard loads or filters change
- **THEN** stats cards query fresh data from `work.stats({ projectId })`
- **AND** display: Total specs, Active work (in_progress or assigned), Pending approvals (proposing + review), Error proposals (new)
- **AND** show trend indicators (7-day comparison)

### Requirement: Work Queue Tab
The system SHALL display combined work items with sorting and real-time updates.

#### Scenario: Display work queue items
- **WHEN** user selects Work Queue tab
- **THEN** displays table of work items
- **AND** columns: Type badge (Spec/Error), Title, Status badge, Priority (stars), Age, Assigned To, Progress (if worker), Actions
- **AND** items sorted by priority DESC, then position ASC
- **AND** filters applied: project, status, priority range

#### Scenario: Sort work queue
- **WHEN** user clicks column header (Priority, Age, Status, etc.)
- **THEN** table re-sorts by that column
- **AND** sort direction toggles on repeated clicks (ASC/DESC)
- **AND** sort preference persisted to localStorage

#### Scenario: Real-time work queue updates
- **WHEN** work queue changes (item added, removed, status changed)
- **THEN** subscription event is received
- **AND** dashboard updates table without page reload:
  - On item_added: New row appears with slide-in animation
  - On item_removed: Row disappears with fade-out animation
  - On status_changed: Row status badge updates with highlight animation
  - On dependency_unblocked: Row status updates from "blocked" to "queued"

#### Scenario: Drag-and-drop reordering
- **WHEN** user drags work queue row to new position
- **THEN** visual reordering happens immediately (optimistic)
- **AND** API call made to workQueue.reorder with new order
- **AND** on success: Reordering persists
- **AND** on error: Table reverts to previous order, error toast shown

#### Scenario: Work item row actions
- **WHEN** user clicks action button on row
- **THEN** corresponding action executed:
  - "View": Navigate to spec detail page
  - "Edit": Open spec editor modal
  - "Approve": Call lifecycle.approve (for proposing items)
  - "Assign to My Session": Call workQueue.assign (current user session)
  - "Complete": Call workQueue.complete (for assigned items)
  - "Reject": Show confirmation, call lifecycle.reject
- **AND** toast confirmation shown on success

### Requirement: Approvals Tab
The system SHALL provide dedicated approval workflow interface.

#### Scenario: Display approval items
- **WHEN** user selects Approvals tab
- **THEN** displays two sections:
  - **Needs Approval** (proposing state): Specs awaiting user review before work
  - **Needs Validation** (review state): Completed specs awaiting user confirmation
- **AND** each section has table: Title, Type badge (Error/Manual), Priority, Created, Actions
- **AND** items grouped and sorted by priority DESC

#### Scenario: Open approval detail modal
- **WHEN** user clicks on approval item
- **THEN** modal opens showing:
  - For proposing: Full proposal content (rendered markdown), tasks list, related errors
  - For review: Worker completion summary (tasks, files changed, tests run), timeline of work
- **AND** modal has scrollable content area

#### Scenario: Approve proposal
- **WHEN** user clicks "Approve" in modal or table
- **THEN** spec transitions from 'proposing' to 'approved'
- **AND** work queue item created and appears in work queue tab
- **AND** modal closes or row removed from Needs Approval section
- **AND** confirmation toast: "Spec approved: {title}"

#### Scenario: Validate completed work
- **WHEN** user clicks "Validate & Apply" for review item
- **THEN** confirmation modal shown: "Apply this spec? (Runs tests, marks complete)"
- **AND** on confirm: Calls lifecycle.markApplied({ specId })
- **AND** spec transitions to 'applied' state
- **AND** row removed from Needs Validation section
- **AND** success toast: "Spec applied and archived"

#### Scenario: Reject proposal or request changes
- **WHEN** user clicks "Reject" or "Request Changes"
- **THEN** modal shown for entering reason
- **AND** on submit (Reject):
  - Spec archived immediately
  - Work queue item removed
  - Error proposal removed from queue
  - Confirmation toast
- **AND** on submit (Request Changes):
  - Clarification notification sent to agent/session
  - Approval item remains in list

### Requirement: Master Agents Tab
The system SHALL display active master agent orchestrators.

#### Scenario: Display master agents
- **WHEN** user selects Master Agents tab
- **THEN** displays grid of master agent cards
- **AND** each card shows: Project name, Status badge, Current work, Queue position, Last activity
- **AND** layout responsive: 3 cols desktop, 2 tablet, 1 mobile
- **AND** status colors: Green (working), Yellow (idle), Red (paused), Gray (stopped)

#### Scenario: Control master agent
- **WHEN** user clicks card action button
- **THEN** corresponding action executed:
  - "Pause": Call masterAgent.pause (stops processing queue)
  - "Resume": Call masterAgent.resume (resumes processing)
  - "Stop": Confirmation modal, call masterAgent.stop
  - "Process Queue Now": Call masterAgent.reviewNow (immediate processing)
- **AND** card updates to reflect status change

#### Scenario: View clarifications
- **WHEN** master agent requests clarification
- **THEN** Clarifications panel shows:
  - Question text
  - Radio button options
  - "Submit" button to send response
- **AND** response sent back to agent immediately
- **AND** clarification removed from panel

#### Scenario: Real-time master agent updates
- **WHEN** master agent status changes
- **THEN** subscription event received
- **AND** card updates: status badge, current work item, queue position
- **AND** visual indicators update with animation

### Requirement: Full Spec Editor
The system SHALL provide in-browser editor for proposal, tasks, and design.

#### Scenario: Load spec in editor
- **WHEN** user opens spec editor at /app/dashboard/spec-editor/[id]
- **THEN** spec is loaded from database: `openspec.get({ specId })`
- **AND** three tabs displayed: Proposal, Tasks, Design
- **AND** each tab has Monaco editor with markdown syntax highlighting

#### Scenario: Edit proposal
- **WHEN** user selects Proposal tab
- **THEN** editor shows proposal.md content
- **AND** split view: Editor (60%) + Live preview (40%)
- **AND** preview renders markdown to HTML in real-time
- **AND** auto-save to localStorage every 5 seconds
- **AND** on manual save:
  - Validates: Required sections exist (Why, What Changes, Impact)
  - Updates DB: `openspec.update({ specId, proposalContent })`
  - Syncs to filesystem: `sync.syncToFilesystem({ specId })`
  - Shows "Saved" confirmation

#### Scenario: Edit tasks
- **WHEN** user selects Tasks tab
- **THEN** editor shows tasks.md content
- **AND** displays task completion percentage at top: "3 of 5 tasks (60%)"
- **AND** percentage updates live as user edits (count [ ] vs [x])
- **AND** "Mark all complete" button marks all tasks [x]

#### Scenario: Create design doc
- **WHEN** user selects Design tab and design.md doesn't exist
- **THEN** shows "Create design.md" button
- **AND** on click: Creates file with design template
- **AND** template includes sections (Overview, Architecture, etc.)
- **AND** editor opens with template content
- **AND** tabs update to show Design as active

#### Scenario: Handle filesystem conflicts
- **WHEN** user saves spec and filesystem has been modified
- **THEN** conflict detected: filesystemModifiedAt > lastSyncedAt
- **AND** modal shown: "File modified on filesystem"
- **AND** options: "Force my changes" or "Reload from filesystem"
- **AND** "Force my changes": Overwrites filesystem with editor content
- **AND** "Reload from filesystem": Reloads editor with latest filesystem version

#### Scenario: Cancel editing
- **WHEN** user clicks "Cancel" button
- **THEN** confirmation: "Discard unsaved changes?"
- **AND** on confirm:
  - Clears localStorage draft
  - Navigates back to dashboard
  - No data persisted

### Requirement: Lifecycle Visualization
The system SHALL display spec state transitions as visual timeline.

#### Scenario: View lifecycle timeline
- **WHEN** user navigates to /app/dashboard/lifecycle/[id]
- **THEN** displays vertical timeline
- **AND** each state node shows: State name, Timestamp, Triggered by (user/agent/system)
- **AND** current state highlighted in bold
- **AND** manual gates marked with user icon
- **AND** automatic transitions marked with robot icon

#### Scenario: View transition details
- **WHEN** user clicks on state node or transition
- **THEN** details panel shows:
  - From state, To state, Timestamp
  - Triggering agent/user/system
  - Duration in that state
  - Any transition notes
- **AND** if triggered by agent: Link to agent session

### Requirement: Notifications System
The system SHALL provide real-time notifications for important events.

#### Scenario: Notification bell
- **WHEN** unread notifications exist
- **THEN** bell icon in header shows unread count badge
- **AND** on click: Dropdown shows last 10 notifications
- **AND** each notification: Type icon, Message, Timestamp, Action button
- **AND** "Dismiss all" button clears all notifications

#### Scenario: Toast notifications
- **WHEN** high-priority event occurs (clarification, error, work complete)
- **THEN** toast appears at bottom-right
- **AND** toast auto-dismisses after 5 seconds
- **AND** click toast to navigate to relevant detail page
- **AND** types: urgent (red), warning (orange), success (green), info (blue)

#### Scenario: Notifications center
- **WHEN** user clicks "View all" in notification dropdown
- **THEN** navigates to /app/dashboard/notifications
- **AND** displays full history of notifications (paginated)
- **AND** filter options: Type, Date range, Read/Unread
- **AND** sort: Newest first
- **AND** each notification: Icon, Type, Message, Timestamp, Actions (Dismiss, View)

## MODIFIED Requirements

### Requirement: Real-Time Subscriptions
Dashboard SHALL use tRPC subscriptions for real-time updates across all tabs.

#### Scenario: Work queue subscription
- **WHEN** Work Queue tab is active
- **THEN** client subscribes to `workQueue.subscribe({ projectId })`
- **AND** receives events: item_added, item_removed, status_changed, item_reordered
- **AND** table updates without page reload

#### Scenario: Lifecycle subscription
- **WHEN** Approvals tab is active
- **THEN** client subscribes to `lifecycle.subscribe({ projectId })`
- **AND** receives events: state_changed, manual_gate_reached
- **AND** approvals table updates (items added/removed/status changed)

#### Scenario: Master agent subscription
- **WHEN** Master Agents tab is active
- **THEN** client subscribes to `masterAgent.subscribe({ projectId })`
- **AND** receives events: status_changed, work_started, clarification_requested
- **AND** master agent cards update with animations

#### Scenario: Unsubscribe on tab switch
- **WHEN** user switches to different tab
- **THEN** previous tab's subscription is unsubscribed
- **AND** new tab's subscription is created
- **AND** this prevents unnecessary network traffic

### Requirement: Cross-Tab Consistency
Dashboard state SHALL be consistent across all tabs.

#### Scenario: Filter persistence
- **WHEN** user sets project, status, priority filters
- **THEN** filters apply across ALL tabs
- **AND** switching tabs maintains same filters
- **AND** filters persisted to localStorage
- **AND** page reload restores filters

#### Scenario: Shared stats
- **WHEN** dashboard loads or data changes
- **THEN** stats cards show consistent data across tabs
- **AND** Work Queue count matches items displayed in Work Queue tab
- **AND** Approvals count matches items in Approvals tab
