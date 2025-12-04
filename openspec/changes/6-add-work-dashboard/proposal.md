# Change: Add Unified Work Dashboard and Spec Editor

## Why

Changes 1-5 have implemented all backend capabilities for work queue management, worker coordination, and error automation, but the user interface is scattered across multiple tabs and lacks cohesive visibility. Users can't easily see all their work, approve specs, monitor workers, and edit specs from one place.

By adding a comprehensive unified dashboard with full spec editing capabilities, the Claude agent service becomes capable of:
- **Unified Work Queue View**: Combined specs + errors + workers in one table with real-time updates
- **Approval Workflow**: Dedicated approval gates for proposing and review states
- **Master/Worker Status**: Visual grid showing active master agents and their spawned workers
- **Full Spec Editor**: In-browser editor for proposal.md, tasks.md, design.md with validation
- **Lifecycle Visualization**: Timeline showing spec state transitions and history
- **Real-Time Notifications**: Toast alerts and notification center for high-priority events
- **Project-Scoped Views**: Filter all work by project for focused context

This change focuses on **unified UI consolidation** - bringing together all the isolated features into a cohesive, real-time experience.

## What Changes

### Unified Dashboard Layout

- **Main Page**: `/app/dashboard/page.tsx` - Landing page with tabs/sections
  - Tabs: **Work Queue**, **Approvals**, **Master Agents**, **Lifecycle**, **Specs**, **Errors**
  - OR: Single page with filter sidebar and dynamic content based on selection
  - Shared header: Stats cards (total specs, active work, pending approvals, errors)
  - Shared sidebar: Project filter, Status filter, Priority range, Date range, Search

### Work Queue Tab

- **Work Queue Table**: Combined specs + errors + workers
  - Columns: Type badge (Spec/Error), Title, Status (lifecycle stage or error classification), Priority, Age, Assigned To, Progress (if worker), Actions
  - Sortable: Priority, Age, Status
  - Filterable: By status, priority, project, age range
  - Drag-and-drop reordering for manual prioritization
  - Real-time updates: New items with animation, status changes, progress updates
- **Row Actions**:
  - "View" - Link to spec detail / error detail
  - "Edit" - Open full spec editor modal
  - "Approve" - Move from proposing to approved (add to queue)
  - "Assign to My Session" - Link current session to work item
  - "Complete" - Mark work as done (awaiting review)
  - "Reject" - Archive spec / dismiss error

### Approvals Tab

- **Approval Gates View**: Two sections
  - **Needs Approval** (proposing state): Specs waiting for user review before work starts
  - **Needs Validation** (review state): Specs completed by workers, waiting for user confirmation
- **Approval Detail Modal**:
  - For proposing: Show full proposal content (why, what changes)
  - For review: Show worker completion summary (tasks completed, files changed, tests run)
  - Actions: Approve, Edit & Approve, Request Changes, Reject
  - Comments section for approval notes

### Master Agents Tab

- **Master Agent Grid**: Card layout showing active master agents
  - Each card: Project name, Status badge (idle/working/paused), Current work item title, Progress (position in queue), Last activity
  - Card colors: Green (working), Yellow (idle), Red (paused), Gray (stopped)
  - Card actions: Pause, Resume, Stop, "Process Queue Now" (manual trigger)
- **Clarifications Panel**: Show pending clarifications from any master agent
  - Display clarification question
  - Radio button options
  - Submit button to send response back to agent

### Worker Status Grid

- **Active Workers View**: Show all currently running workers
  - Card layout: responsive (3 cols desktop, 2 tablet, 1 mobile)
  - Each card: Worker ID, Agent type badge, Spec title, Status, Progress bar, Time elapsed, Active tool
  - Card colors: Green (active), Yellow (idle), Red (failed), Gray (completed)
  - Card actions: Cancel (if active), Retry (if failed), View Details
- **Worker Detail Modal**: Click card to see
  - Progress metrics: Tools executed, success rate, files changed, tests run, task completion %
  - Hook timeline: Last 50 hook events with tool names and results
  - If failed: Error message and retry attempts
  - Actions: Retry, Cancel, View Spec

### Full Spec Editor

- **Spec Editor Page**: `/app/dashboard/spec-editor/[id]/page.tsx`
  - Route parameter: specId
  - Tabs: Proposal, Tasks, Design
  - Each tab has Monaco editor with markdown syntax highlighting
  - Split view: Editor on left, live preview on right
- **Proposal Editor Tab**:
  - Syntax highlighting for markdown
  - Preview pane showing rendered markdown
  - Validation: Checks for required sections (Why, What Changes, Impact)
  - Auto-save to localStorage every 5 seconds
- **Tasks Editor Tab**:
  - Syntax highlighting with checkbox highlighting
  - Show task completion percentage at top
  - "Mark all complete" quick action button
  - Live update of completion % as user edits
- **Design Editor Tab**:
  - Optional file, initially hidden
  - "Create design.md" button if not exists
  - Template generation: Pre-fill with design doc structure
  - When created, appears as active tab
- **Save/Cancel**:
  - "Save" button: Update spec in DB, sync to filesystem
  - "Cancel" button: Discard changes, go back
  - Auto-detect conflicts: If filesystem changed since load, show warning
  - Conflict resolution: "Force my changes" or "Reload from filesystem"

### Lifecycle Visualization

- **Lifecycle Page**: `/app/dashboard/lifecycle/[id]/page.tsx`
  - Route parameter: specId
  - Visual timeline showing all state transitions
  - Each node: State name, Timestamp, Triggered by (user/agent/system)
  - Transitions: Arrows between states, manual gates shown with user icon
  - Current state highlighted in bold
- **Transition Details**: Click on transition to see
  - From state, to state, timestamp, triggering agent/user
  - If triggered by agent: Link to agent session, show agent activity summary
  - Transition notes if any

### Notification System

- **Notification Bell**: Header icon with unread count badge
  - Click to open dropdown showing last 10 notifications
  - Each notification: Type icon, Message, Timestamp, Action button (if applicable)
  - "Dismiss" and "Dismiss all" buttons
  - Types: approval_required, work_completed, error_critical, clarification_needed, worker_failed
- **Toast Notifications**: Auto-show for high-priority events
  - Critical errors, clarifications needed, work completed
  - Auto-dismiss after 5 seconds
  - Click toast to navigate to relevant detail page
- **Notification Center**: `/app/dashboard/notifications`
  - Full history of notifications (paginated)
  - Filter by type, date range
  - Mark as read/unread
  - Archive old notifications

### Stats Cards

- **Dashboard Header Stats**:
  - Total specs in project
  - Specs in progress (assigned or working)
  - Pending approvals (proposing + review states)
  - Error proposals (new errors awaiting review)
  - Trend indicators: Up/down arrows for 7-day comparison

### Real-Time Updates

- **Socket Subscription Integration**: All views subscribe to relevant tRPC subscriptions
  - Work queue: Subscribe to work queue changes, lifecycle changes, worker events
  - Master agents: Subscribe to master agent status changes, clarification requests
  - Workers: Subscribe to worker progress and completion events
  - Errors: Subscribe to new error proposals
  - Lifecycle: Subscribe to state transitions for focused spec

## Impact

### Affected Specs
- **unified-dashboard**: MODIFIED - Now fully implements all dashboard features
- **spec-editor-ui**: ADDED - Full in-browser spec editing with Monaco editor
- **notification-system**: ADDED - Real-time notifications and notification center
- **conflict-resolution**: ADDED - Handle filesystem/DB conflicts in editor

### Affected Code
- `homelab-services/apps/claude-agent-web/src/app/dashboard/page.tsx` - MODIFIED main dashboard
- `homelab-services/apps/claude-agent-web/src/app/dashboard/work-queue/page.tsx` - NEW tab
- `homelab-services/apps/claude-agent-web/src/app/dashboard/approvals/page.tsx` - NEW tab
- `homelab-services/apps/claude-agent-web/src/app/dashboard/master-agents/page.tsx` - NEW tab
- `homelab-services/apps/claude-agent-web/src/app/dashboard/spec-editor/[id]/page.tsx` - NEW editor
- `homelab-services/apps/claude-agent-web/src/app/dashboard/lifecycle/[id]/page.tsx` - NEW timeline
- `homelab-services/apps/claude-agent-web/src/app/dashboard/notifications/page.tsx` - NEW notifications
- `homelab-services/apps/claude-agent-web/src/components/` - NEW UI components for all tabs
- `homelab-services/packages/db/src/schema/notifications.ts` - NEW notifications table (if needed)

### Dependencies
- **Existing**: React, Next.js, tRPC client, Drizzle, Zod
- **New**:
  - `@monaco-editor/react` - In-browser markdown/text editor
  - `@dnd-kit/sortable` or `react-beautiful-dnd` - Drag-and-drop reordering
  - `react-hot-toast` - Toast notifications
  - `lucide-react` or `heroicons` - Icons for badges and indicators
- **Prerequisite**: Changes 1-5 all complete for full feature set

### Breaking Changes
None. This is a UI reorganization of existing capabilities.

## Acceptance Criteria

- [ ] Dashboard main page loads with responsive layout
- [ ] Work Queue tab displays items with real-time updates
- [ ] Drag-and-drop reordering works and persists
- [ ] Approvals tab shows proposing and review items
- [ ] Master Agents tab displays active master agents with status
- [ ] Master Agent pause/resume/stop buttons work
- [ ] Clarifications panel displays and accepts responses
- [ ] Worker status grid shows active workers with progress bars
- [ ] Worker detail modal displays metrics and hook timeline
- [ ] Spec editor loads spec content and renders both tabs
- [ ] Edit and save spec triggers filesystem sync
- [ ] Conflict detection shows warning when filesystem changed
- [ ] Lifecycle page renders timeline with transitions
- [ ] Stats cards display correct counts with trends
- [ ] Notification bell displays recent notifications
- [ ] Toast notifications appear for high-priority events
- [ ] All tabs subscribe to real-time updates correctly
- [ ] Tests pass (component tests, integration tests for subscriptions)
