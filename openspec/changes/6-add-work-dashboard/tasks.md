# Implementation Tasks: Unified Work Dashboard and Spec Editor

## Phase 6.1: Dashboard Foundation and Layout

### 6.1.1 Main Dashboard Page
- [ ] Create/Update `apps/claude-agent-web/src/app/dashboard/page.tsx`
  - [ ] Create responsive layout with sidebar and main content area
  - [ ] Sidebar: Stats cards (total specs, active work, pending approvals, errors)
  - [ ] Shared filter controls: Project dropdown, Status filter, Priority slider, Date range, Search
  - [ ] Tab navigation: Work Queue, Approvals, Master Agents, Lifecycle, Specs, Errors
  - [ ] Tab state persistence to URL (e.g., ?tab=work-queue)

### 6.1.2 Create Shared Filter Sidebar Component
- [ ] Component: `FilterSidebar.tsx`
  - [ ] Project dropdown (multi-select or single, persisted to localStorage)
  - [ ] Status multi-select checkboxes (based on context: proposing, approved, etc.)
  - [ ] Priority range slider (1-5)
  - [ ] Date range picker (from/to)
  - [ ] Search input with debounce (300ms)
  - [ ] "Apply Filters" and "Reset" buttons
  - [ ] Emit filter changes to parent/context

### 6.1.3 Create Stats Cards Component
- [ ] Component: `StatsCards.tsx`
  - [ ] Use tRPC query: `work.stats({ projectId })`
  - [ ] Display 4 cards: Total specs, Active work, Pending approvals, Error proposals
  - [ ] Add trend indicators (up/down arrows, percentage change vs 7 days ago)
  - [ ] Re-query on filter changes

## Phase 6.2: Work Queue Tab

### 6.2.1 Create Work Queue Page
- [ ] Create `apps/claude-agent-web/src/app/dashboard/work-queue/page.tsx`
  - [ ] Imports FilterSidebar, WorkQueueTable, StatsCards
  - [ ] Layout: Stats + Filters + Table
  - [ ] Fetch work queue items: `workQueue.getQueue({ projectId, filter })`

### 6.2.2 Create Work Queue Table Component
- [ ] Component: `WorkQueueTable.tsx`
  - [ ] Columns: Type badge, Title, Status badge, Priority (stars), Age (human-readable), Assigned To, Progress (if worker), Actions
  - [ ] Sortable columns: Priority, Age, Status (click column header)
  - [ ] Type badge: Blue for "Spec", Red for "Error"
  - [ ] Status badges with colors: proposing (gray), approved (blue), assigned (yellow), in_progress (orange), review (purple), applied (green)
  - [ ] Priority display: Star icons (1-5 stars)
  - [ ] Age: "2 days ago", "5 hours ago", etc. (use date-fns)
  - [ ] Assigned To: Session name or "Unassigned"
  - [ ] Progress: Progress bar if worker active (0-100%)

### 6.2.3 Implement Row Actions
- [ ] Actions menu per row (dropdown or quick buttons)
  - [ ] "View" - Link to spec detail page
  - [ ] "Edit" - Open spec editor modal
  - [ ] "Approve" - Call `lifecycle.approve({ specId })` (show for proposing)
  - [ ] "Assign to My Session" - Call `workQueue.assign({ workItemId, sessionId })`
  - [ ] "Complete" - Call `workQueue.complete({ workItemId })` (show for assigned)
  - [ ] "Reject" - Show confirmation, call `lifecycle.reject({ specId, reason })`
  - [ ] Toast confirmations on action success

### 6.2.4 Implement Drag-and-Drop Reordering
- [ ] Add @dnd-kit/sortable library to package.json
- [ ] Wrap table rows with SortableContext
- [ ] Make rows draggable to new positions
- [ ] On drop: Call `workQueue.reorder({ projectId, newOrder })`
  - [ ] Extract new order from drag end event
  - [ ] Show loading indicator during API call
  - [ ] Optimistic UI update (reorder rows immediately)
  - [ ] Rollback on error (revert to previous order, show error toast)

### 6.2.5 Implement Real-Time Updates
- [ ] Subscribe: `workQueue.subscribe({ projectId })`
- [ ] On item_added: Add new row to table with slide-in animation
- [ ] On item_removed: Remove row with fade-out animation
- [ ] On status_changed: Update row status badge with highlight animation
- [ ] On item_reordered: Animate row position changes
- [ ] On dependency_unblocked: Update row status, show notification toast
- [ ] Auto-scroll to new items if user scrolled to bottom

## Phase 6.3: Approvals Tab

### 6.3.1 Create Approvals Page
- [ ] Create `apps/claude-agent-web/src/app/dashboard/approvals/page.tsx`
  - [ ] Fetch: `lifecycle.getStatus({ filter: { status: ['proposing', 'review'] } })`
  - [ ] Group by approval gate (Needs Approval, Needs Validation)

### 6.3.2 Create Approvals Table Component
- [ ] Component: `ApprovalsTable.tsx`
  - [ ] Two sections:
    - [ ] **Needs Approval** (proposing state): Specs awaiting user review
    - [ ] **Needs Validation** (review state): Completed specs awaiting user confirmation
  - [ ] Columns per section: Title, Type badge (Error/Manual), Priority, Created, Actions
  - [ ] For each row:
    - [ ] Proposing: "Approve", "Edit & Approve", "Reject" buttons
    - [ ] Review: "Validate & Apply", "Request Changes" buttons
  - [ ] Sortable by priority, date
  - [ ] Click row to open detail modal

### 6.3.3 Create Approval Detail Modal
- [ ] Component: `ApprovalDetailModal.tsx`
  - [ ] Header: Title, Type badge, Priority, Created date
  - [ ] For proposing specs:
    - [ ] Show full proposal.md content (rendered markdown)
    - [ ] Show tasks.md list
    - [ ] Show any related errors (if error-generated)
  - [ ] For review specs:
    - [ ] Show worker completion summary (if worker completed)
    - [ ] List: Tasks completed [x], Files changed, Tests run
    - [ ] If manual completion: Show what was changed
  - [ ] Footer: Action buttons (Approve/Validate, Reject, or Edit)
  - [ ] Notes/Comments section (optional)

### 6.3.4 Implement Approval Actions
- [ ] "Approve" button:
  - [ ] Call `lifecycle.approve({ specId })`
  - [ ] Close modal, show confirmation toast
  - [ ] Work item appears in work queue
- [ ] "Edit & Approve" button:
  - [ ] Open spec editor
  - [ ] On save: Call approve
- [ ] "Validate & Apply" button:
  - [ ] Show confirmation modal (runs tests, applies spec)
  - [ ] Call `lifecycle.markApplied({ specId, verificationNotes })`
  - [ ] Show success toast
- [ ] "Request Changes" button:
  - [ ] Show modal for entering feedback
  - [ ] Call API to create clarification/notification back to agent
- [ ] "Reject" button:
  - [ ] Show modal with rejection reason input
  - [ ] Call `lifecycle.reject({ specId, reason })`
  - [ ] Confirm rejection and archival

## Phase 6.4: Master Agents Tab

### 6.4.1 Create Master Agents Page
- [ ] Create `apps/claude-agent-web/src/app/dashboard/master-agents/page.tsx`
  - [ ] Fetch: `masterAgent.getStatus({ projectId? })`
  - [ ] Optional: Multiple master agents (one per project)

### 6.4.2 Create Master Agent Grid Component
- [ ] Component: `MasterAgentGrid.tsx`
  - [ ] Card layout: 3 columns desktop, 2 tablet, 1 mobile
  - [ ] Each card: Project name, Status badge, Current work, Queue position, Last activity
  - [ ] Status colors: Green (working), Yellow (idle), Red (paused), Gray (stopped)

### 6.4.3 Create Master Agent Card Component
- [ ] Component: `MasterAgentCard.tsx`
  - [ ] Header: Project name (linked to project)
  - [ ] Status badge with icon (working/idle/paused/stopped)
  - [ ] "Currently working on": Spec title (linked to spec detail)
  - [ ] Progress bar: "Position {N} of {total}" in queue
  - [ ] Last activity: "{time} ago" (e.g., "Active 2m ago")
  - [ ] Action buttons: Pause, Resume, Stop, "Process Queue Now"
  - [ ] Card styling based on status

### 6.4.4 Implement Master Agent Actions
- [ ] "Pause" button:
  - [ ] Call `masterAgent.pause({ masterAgentId, reason: 'user_requested' })`
  - [ ] Card status changes to Red/paused
  - [ ] Show: "Master paused by user"
- [ ] "Resume" button:
  - [ ] Call `masterAgent.resume({ masterAgentId })`
  - [ ] Card status returns to previous state
- [ ] "Stop" button:
  - [ ] Confirmation modal: "Stop master agent for this project?"
  - [ ] Call `masterAgent.stop({ masterAgentId })`
  - [ ] Card status changes to Gray/stopped
- [ ] "Process Queue Now" button:
  - [ ] Call `masterAgent.reviewNow({ projectId })`
  - [ ] Force immediate review bypassing schedule
- [ ] "Start Master Agent" button (if not running):
  - [ ] Call `masterAgent.start({ projectId })`
  - [ ] Card appears in grid

### 6.4.5 Create Clarifications Panel
- [ ] Component: `ClarificationsPanel.tsx`
  - [ ] Display all pending clarifications from master agents
  - [ ] Each clarification shows:
    - [ ] Question text
    - [ ] Radio button options
    - [ ] Master agent and project context
  - [ ] "Submit" button per clarification
  - [ ] On submit: Call `masterAgent.answerClarification({ clarificationId, answer })`
  - [ ] Show confirmation and remove from list
- [ ] Real-time updates: Subscribe to `masterAgent.subscribe()`

### 6.4.6 Implement Real-Time Updates
- [ ] Subscribe: `masterAgent.subscribe({ projectId? })`
- [ ] On status_changed: Update card status badge
- [ ] On clarification_requested: Add to clarifications panel
- [ ] On work_started: Update "Currently working on" and progress bar
- [ ] On work_completed: Update status, advance queue position

## Phase 6.5: Worker Activity Grid (Reuse from Change 4)

- [ ] Display active workers in main dashboard or dedicated tab
- [ ] Show real-time worker progress with animations
- [ ] Link to worker detail modals
- [ ] Subscribe to worker events: `workerAgent.subscribe()`

## Phase 6.6: Full Spec Editor

### 6.6.1 Create Spec Editor Page
- [ ] Create `apps/claude-agent-web/src/app/dashboard/spec-editor/[id]/page.tsx`
  - [ ] Route parameter: specId
  - [ ] Load spec: `openspec.get({ specId })`
  - [ ] Tabs: Proposal, Tasks, Design
  - [ ] Monaco editor for each tab

### 6.6.2 Install Monaco Editor
- [ ] Add @monaco-editor/react to package.json
- [ ] Import MonacoEditor component

### 6.6.3 Create Proposal Editor Tab
- [ ] Monaco editor with markdown syntax highlighting
  - [ ] Set language="markdown"
  - [ ] Set theme="vs-dark" (or configurable)
  - [ ] Enable word wrap, line numbers
  - [ ] Optional vim mode
- [ ] Split view: Editor (60%) + Preview (40%)
  - [ ] Use react-split-pane or custom CSS grid
  - [ ] Live preview rendering markdown to HTML
  - [ ] Use remark + react-markdown or similar
- [ ] Validation on save:
  - [ ] Check required sections exist: Why, What Changes, Impact
  - [ ] Show validation error messages if missing
  - [ ] Prevent save on validation failure
- [ ] Auto-save draft to localStorage
  - [ ] Save every 5 seconds
  - [ ] Show indicator "Saving draft..."
  - [ ] Restore from localStorage on page reload

### 6.6.4 Create Tasks Editor Tab
- [ ] Monaco editor with markdown
  - [ ] Syntax highlighting for checkboxes: `[ ]` vs `[x]`
  - [ ] Use custom regex highlighting if needed
- [ ] Show task completion percentage at top
  - [ ] Live update as user types
  - [ ] Format: "3 of 5 tasks complete (60%)"
- [ ] Quick action button: "Mark all complete"
  - [ ] Replaces all [ ] with [x]
  - [ ] User must still save to persist

### 6.6.5 Create Design Editor Tab
- [ ] Initially hidden if design.md not exists
- [ ] "Create design.md" button when hidden
  - [ ] Click to create with template
  - [ ] Template: Pre-filled design doc structure
  - [ ] Possible template sections: Overview, Architecture, Database Schema, API Design, Security, Performance, etc.
  - [ ] After creation: Switch to Design tab automatically
- [ ] When exists: Show Monaco editor with markdown
  - [ ] Same split view as Proposal tab

### 6.6.6 Implement Save/Cancel
- [ ] "Save" button:
  - [ ] Validate current tab content
  - [ ] Update spec in DB: `openspec.update({ specId, proposalContent, tasksContent, designContent })`
  - [ ] Call `sync.syncToFilesystem({ specId })` to write changes
  - [ ] Show "Saved successfully" toast
  - [ ] Clear localStorage draft
  - [ ] Navigate back to dashboard/spec-detail after save
- [ ] "Cancel" button:
  - [ ] Confirm: "Discard changes?"
  - [ ] Clear localStorage draft
  - [ ] Navigate back without saving

### 6.6.7 Implement Conflict Detection
- [ ] Load spec with filesystem timestamp
- [ ] On save: Check if filesystem modified since load
- [ ] If conflict detected:
  - [ ] Show modal: "Spec was modified on filesystem since you loaded it"
  - [ ] Show diff view (if possible)
  - [ ] Options: "Force my changes" or "Reload from filesystem"
  - [ ] "Force my changes": Overwrite filesystem with DB changes
  - [ ] "Reload from filesystem": Discard edits, reload spec

## Phase 6.7: Lifecycle Visualization

### 6.7.1 Create Lifecycle Page
- [ ] Create `apps/claude-agent-web/src/app/dashboard/lifecycle/[id]/page.tsx`
  - [ ] Route parameter: specId
  - [ ] Load lifecycle history: `lifecycle.getStatus({ specId })`

### 6.7.2 Create Timeline Component
- [ ] Component: `LifecycleTimeline.tsx`
  - [ ] Vertical timeline layout
  - [ ] Each node: State name (proposing, approved, assigned, in_progress, review, applied, archived)
  - [ ] State nodes styled with color coding
  - [ ] Transitions shown as arrows between nodes
  - [ ] Current state highlighted in bold
  - [ ] Manual gates shown with user icon (proposing→approved, review→applied)
  - [ ] Automatic transitions shown with robot icon
  - [ ] Each node includes timestamp

### 6.7.3 Create Transition Details
- [ ] Click on transition node to expand details
  - [ ] Show: fromState, toState, triggeredBy (user/agent/system), timestamp
  - [ ] If agent: Show agent ID and link to session/agent detail
  - [ ] If user: Show user name/ID if available
  - [ ] Include any transition notes
  - [ ] Show duration (time in that state)

## Phase 6.8: Notifications System

### 6.8.1 Create Notifications Table (Optional)
- [ ] Create `packages/db/src/schema/notifications.ts` (if not exists)
  - [ ] Add id, userId (if multi-user), type, message, actionUrl (nullable)
  - [ ] Add dismissed (boolean), createdAt timestamp
  - [ ] Types enum: 'clarification_needed', 'approval_required', 'work_completed', 'error_critical', 'worker_failed'

### 6.8.2 Create Notification Service (Backend)
- [ ] Service: `packages/api/src/services/notifications.ts`
  - [ ] `createNotification(type, message, actionUrl?, metadata?)` - Create notification
  - [ ] `dismissNotification(notificationId)` - Mark dismissed
  - [ ] `getUnreadNotifications(userId?)` - Return undismissed
  - [ ] Integration: Call from various services on important events

### 6.8.3 Create Notification Bell Component
- [ ] Component: `NotificationBell.tsx`
  - [ ] Header location (top right)
  - [ ] Bell icon with unread count badge
  - [ ] Click to open dropdown
  - [ ] Dropdown shows last 10 notifications:
    - [ ] Type icon, Message text, Timestamp, Action (if applicable)
  - [ ] "Dismiss" and "Dismiss all" buttons
  - [ ] "View all" link to notifications center
  - [ ] Real-time updates via subscription

### 6.8.4 Create Toast Notification Component
- [ ] Use react-hot-toast library
- [ ] Show toasts for high-priority events:
  - [ ] Clarification requested (red/urgent)
  - [ ] Work completed (green/success)
  - [ ] Error critical (red/urgent)
  - [ ] Worker failed (orange/warning)
  - [ ] Approval required (blue/info)
- [ ] Auto-dismiss after 5 seconds
- [ ] Click toast to navigate to detail page

### 6.8.5 Create Notifications Center Page
- [ ] Create `apps/claude-agent-web/src/app/dashboard/notifications/page.tsx`
  - [ ] Full history of notifications (paginated)
  - [ ] Filter: Type, Date range, Dismissed/Undismissed
  - [ ] Sort: By date (newest first)
  - [ ] Each notification shows: Icon, Type, Message, Timestamp, Actions (Dismiss, View)
  - [ ] Mark/Unmark as read toggle

## Phase 6.9: Integration and Testing

### 6.9.1 Subscription Integration
- [ ] All components subscribe to relevant tRPC subscriptions
- [ ] Work queue tab: `workQueue.subscribe({ projectId })`
- [ ] Approvals tab: `lifecycle.subscribe({ projectId })`
- [ ] Master agents: `masterAgent.subscribe({ projectId })`
- [ ] Worker activity: `workerAgent.subscribe({ projectId })`
- [ ] Errors: `errorProposals.subscribe({ projectId })`
- [ ] Unsubscribe on component unmount

### 6.9.2 Component Tests
- [ ] Test work queue table renders items correctly
- [ ] Test row actions trigger correct tRPC calls
- [ ] Test drag-and-drop reordering
- [ ] Test filter application
- [ ] Test spec editor loads content
- [ ] Test save/cancel functionality
- [ ] Test conflict detection modal

### 6.9.3 Integration Tests
- [ ] Test full workflow:
  - [ ] Navigate dashboard
  - [ ] Approve spec from Approvals tab
  - [ ] View in work queue
  - [ ] Edit spec in editor
  - [ ] Save and sync to filesystem
  - [ ] View lifecycle timeline
- [ ] Test real-time updates:
  - [ ] Subscribe to work queue
  - [ ] Trigger change (e.g., spec approved)
  - [ ] Verify UI updates without page reload

### 6.9.4 E2E Tests
- [ ] Full user workflow:
  - [ ] User logs in to dashboard
  - [ ] Views stats cards
  - [ ] Navigates work queue tab
  - [ ] Sees work items in table
  - [ ] Filters by project and priority
  - [ ] Drags to reorder
  - [ ] Clicks "Approve" on item
  - [ ] Navigates to Approvals tab, confirms it moved
  - [ ] Opens spec editor
  - [ ] Edits proposal.md
  - [ ] Saves and sees filesystem update
  - [ ] Views lifecycle timeline

## Phase 6.10: Documentation

### 6.10.1 Update CLAUDE.md
- [ ] Add section on dashboard navigation
- [ ] Document each tab's purpose and workflows
- [ ] Link to OpenSpec specs

### 6.10.2 Create Dashboard User Guide
- [ ] How to approve specs
- [ ] How to edit specs
- [ ] How to monitor workers
- [ ] How to respond to clarifications
- [ ] Keyboard shortcuts for editor

## Summary

**Subtasks**: ~80
**Estimated Timeline**: 2-3 weeks
**Dependencies**: Changes 1-5 complete

**Critical Path**:
1. Dashboard foundation and layout (6.1)
2. Work queue tab (6.2)
3. Approvals tab (6.3)
4. Master agents tab (6.4)
5. Spec editor (6.6)
6. Notifications (6.8)
7. Testing and integration (6.9)

**UI Component Library Structure**:
```
apps/claude-agent-web/src/
├── app/dashboard/
│   ├── page.tsx (main dashboard)
│   ├── work-queue/page.tsx
│   ├── approvals/page.tsx
│   ├── master-agents/page.tsx
│   ├── spec-editor/[id]/page.tsx
│   ├── lifecycle/[id]/page.tsx
│   └── notifications/page.tsx
├── components/
│   ├── FilterSidebar.tsx
│   ├── StatsCards.tsx
│   ├── WorkQueueTable.tsx
│   ├── ApprovalsTable.tsx
│   ├── ApprovalDetailModal.tsx
│   ├── MasterAgentGrid.tsx
│   ├── MasterAgentCard.tsx
│   ├── ClarificationsPanel.tsx
│   ├── SpecEditor.tsx
│   ├── LifecycleTimeline.tsx
│   ├── NotificationBell.tsx
│   ├── ToastContainer.tsx
│   └── WorkerGrid.tsx (from Change 4)
```
