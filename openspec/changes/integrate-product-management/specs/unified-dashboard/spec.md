## ADDED Requirements

### Requirement: Combined Work View
The system SHALL provide unified visibility into both OpenSpec proposals and triaged errors.

#### Scenario: List all work items
- **WHEN** GET /api/work/all is requested
- **THEN** both OpenSpec changes and errorTriage records are returned
- **AND** results are unified with common schema (id, title, type, status, priority)
- **AND** results are sortable by priority, created date, status

#### Scenario: Work item types
- **WHEN** work items are returned
- **THEN** each item has type field ('spec' or 'error')
- **AND** spec items include change ID and affected capabilities
- **AND** error items include test name, classification, and error message

#### Scenario: Combined sorting
- **WHEN** results are sorted by priority
- **THEN** spec priorities and error priorities are normalized to same scale
- **AND** items are interleaved by priority value
- **AND** same-priority items are sub-sorted by created date

### Requirement: Tabbed Interface
The dashboard SHALL organize work items into filterable tabs.

#### Scenario: All Work tab
- **WHEN** user selects "All Work" tab
- **THEN** combined specs and errors are displayed
- **AND** each row shows type indicator (badge or icon)
- **AND** clicking row navigates to detail view (spec or error)

#### Scenario: Specs tab
- **WHEN** user selects "Specs" tab
- **THEN** only OpenSpec changes are displayed
- **AND** changes are grouped by status (active, in-progress, archived)
- **AND** each change shows task completion percentage

#### Scenario: Errors tab
- **WHEN** user selects "Errors" tab
- **THEN** only triaged errors are displayed
- **AND** errors are grouped by decision (needs_spec, one_off_fix, pending)
- **AND** each error shows classification badge

#### Scenario: Sessions tab
- **WHEN** user selects "Sessions" tab
- **THEN** existing sessions view is displayed
- **AND** sessions show linked work item (spec or error)
- **AND** session type is visually indicated

#### Scenario: Agents tab
- **WHEN** user selects "Agents" tab
- **THEN** active agent activity view is displayed
- **AND** agents are shown as cards in grid layout
- **AND** each card shows: project, work item, current tool, real-time progress
- **AND** inactive/stopped agents are excluded

### Requirement: Cross-Tab Filtering
Filters SHALL apply consistently across all tabs.

#### Scenario: Project filter
- **WHEN** user selects project from dropdown
- **THEN** filter persists across tab switches
- **AND** all tabs show only items from selected project
- **AND** project selection is saved to localStorage

#### Scenario: Status filter
- **WHEN** user selects status values (multi-select)
- **THEN** only items matching selected statuses are shown
- **AND** status filter applies to both specs (active/archived) and errors (pending/triaged/fixed)

#### Scenario: Date range filter
- **WHEN** user sets date range (from/to)
- **THEN** only items created within range are shown
- **AND** date filter applies to both specs and errors

#### Scenario: Search filter
- **WHEN** user types in search box
- **THEN** fuzzy match is performed on spec titles and error test names
- **AND** results update in real-time as user types

### Requirement: Work Item Actions
Users SHALL be able to take actions on work items from the dashboard.

#### Scenario: Start spec implementation
- **WHEN** user clicks "Implement" on spec work item
- **THEN** modal prompts for session details
- **AND** new session is created with type='spec_implementation'
- **AND** session metadata links to spec change ID
- **AND** user is redirected to session detail view

#### Scenario: Start error remediation
- **WHEN** user clicks "Fix" on error work item
- **THEN** modal prompts for session details
- **AND** new session is created with type='error_remediation'
- **AND** errorTriage.assignedSessionId is updated
- **AND** user is redirected to session detail view

#### Scenario: Create spec from error
- **WHEN** user clicks "Create Spec" on error with decision='needs_spec'
- **THEN** OpenSpec proposal creation modal opens
- **AND** proposal title is pre-filled with test name
- **AND** proposal description includes error details
- **AND** on creation, errorTriage.specChangeId is linked

#### Scenario: Archive completed spec
- **WHEN** user clicks "Archive" on completed spec
- **THEN** confirmation modal appears
- **AND** on confirmation, openspec archive command is executed
- **AND** spec moves to archive tab

### Requirement: Work Statistics
The dashboard SHALL display aggregate statistics about work items.

#### Scenario: Overview stats
- **WHEN** dashboard loads
- **THEN** stats cards display at top of page
- **AND** cards show: Total Specs, Active Specs, Total Errors, Needs Spec, Active Agents, In Progress

#### Scenario: Project-scoped stats
- **WHEN** project filter is applied
- **THEN** stats are recalculated for selected project only

#### Scenario: Trend indicators
- **WHEN** stats are displayed
- **THEN** each stat includes trend arrow (up/down/unchanged)
- **AND** trend is compared to previous 7 days

### Requirement: Real-Time Dashboard Updates
The dashboard SHALL update automatically when new work items arrive.

#### Scenario: New spec detected
- **WHEN** new OpenSpec change is created (via CLI or API)
- **THEN** dashboard receives subscription event
- **AND** new spec appears in Specs tab without refresh
- **AND** stats are updated
- **AND** toast notification shows "New spec: [title]"

#### Scenario: New error triaged
- **WHEN** new test failure is triaged
- **THEN** dashboard receives subscription event
- **AND** new error appears in Errors tab without refresh
- **AND** stats are updated
- **AND** toast notification shows "New error triaged: [test name]"

#### Scenario: Session status change
- **WHEN** session status changes (running → stopped)
- **THEN** linked work item status is updated
- **AND** UI reflects change without refresh

#### Scenario: Agent activity update
- **WHEN** agent executes a tool (via send_event hook)
- **THEN** dashboard receives real-time activity event
- **AND** Agents tab updates agent card with current tool
- **AND** activity timeline updates with new event
- **AND** progress indicators update automatically

### Requirement: Detail Views
Clicking a work item SHALL navigate to detailed view.

#### Scenario: Spec detail view
- **WHEN** user clicks on spec work item
- **THEN** detail page shows proposal, tasks, design, and deltas
- **AND** task completion checkboxes are interactive
- **AND** related sessions are listed
- **AND** action buttons include: Implement, Archive, Edit

#### Scenario: Error detail view
- **WHEN** user clicks on error work item
- **THEN** detail page shows full error message, stack trace, and history
- **AND** triage decision and rationale are displayed
- **AND** classification chart shows failure pattern over time
- **AND** related remediation attempts are listed
- **AND** action buttons include: Fix, Create Spec, Override Decision

#### Scenario: Session detail from work item
- **WHEN** user clicks on linked session from work item detail
- **THEN** existing session detail view opens
- **AND** breadcrumb shows: Work > [Work Item] > Session

### Requirement: Responsive Layout
The dashboard SHALL adapt to different screen sizes.

#### Scenario: Desktop layout
- **WHEN** viewport width >= 1024px
- **THEN** full table view is shown with all columns
- **AND** sidebar filters are always visible

#### Scenario: Tablet layout
- **WHEN** viewport width 768-1023px
- **THEN** less critical columns are hidden
- **AND** sidebar filters collapse to dropdown

#### Scenario: Mobile layout
- **WHEN** viewport width < 768px
- **THEN** table switches to card layout
- **AND** tabs become swipeable
- **AND** filters move to modal overlay
