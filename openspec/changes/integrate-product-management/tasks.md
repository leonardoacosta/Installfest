# Implementation Tasks

## Phase 1: Foundation & Database Schema

### 1.1 Database Schema Updates
- [ ] 1.1.1 Create `errorTriage` table schema in `packages/db/src/schema/`
  - [ ] Add id, testFailureId, decision, rationale, priority fields
  - [ ] Add assignedSessionId, specChangeId foreign keys
  - [ ] Add createdAt, updatedAt timestamps
  - [ ] Define indexes for performance
- [ ] 1.1.2 Add `session_type` column to `sessions` table via migration
  - [ ] Add enum: 'manual', 'spec_implementation', 'error_remediation'
  - [ ] Default to 'manual' for backwards compatibility
- [ ] 1.1.3 Add `metadata` JSONB column to `sessions` table
  - [ ] Store specChangeId, errorTriageId, projectId
- [ ] 1.1.4 Generate and run Drizzle migrations
  - [ ] `bun run db:generate` to create migration files
  - [ ] `bun run db:migrate` to apply migrations
  - [ ] Verify schema changes in SQLite

### 1.2 Zod Validators
- [ ] 1.2.1 Create OpenSpec validators in `packages/validators/src/openspec.ts`
  - [ ] `openspecChangeSchema` - proposal metadata
  - [ ] `openspecSpecSchema` - spec metadata
  - [ ] `openspecDeltaSchema` - delta operations
  - [ ] `createProposalSchema` - API input validation
- [ ] 1.2.2 Create error triage validators in `packages/validators/src/triage.ts`
  - [ ] `errorTriageSchema` - triage decision
  - [ ] `classificationResultSchema` - classifier output
  - [ ] `triageDecisionSchema` - API input validation
- [ ] 1.2.3 Create unified work validators in `packages/validators/src/work.ts`
  - [ ] `workItemSchema` - combined spec/error schema
  - [ ] `workFilterSchema` - filtering parameters

## Phase 2: OpenSpec Integration

### 2.1 OpenSpec Parser Utility
- [ ] 2.1.1 Create `packages/openspec-parser/` package
  - [ ] Initialize package.json with dependencies
  - [ ] Add to Turborepo pipeline
- [ ] 2.1.2 Implement filesystem utilities
  - [ ] `readProposal(path)` - parse proposal.md
  - [ ] `readTasks(path)` - parse tasks.md with checkbox state
  - [ ] `readDesign(path)` - parse design.md if exists
  - [ ] `readSpecDeltas(path)` - parse specs/*.md files
- [ ] 2.1.3 Implement OpenSpecParser class
  - [ ] Constructor accepts openspec root path
  - [ ] `listChanges()` - scan changes/ directory
  - [ ] `readChange(id)` - read full change with deltas
  - [ ] `listSpecs()` - scan specs/ directory
  - [ ] `readSpec(id)` - read spec with requirements
- [ ] 2.1.4 Add LRU cache with TTL
  - [ ] Use `lru-cache` package
  - [ ] 5-minute TTL per cache entry
  - [ ] Cache key includes file mtime
  - [ ] Implement cache warming on startup
- [ ] 2.1.5 Write unit tests
  - [ ] Test parsing of valid OpenSpec files
  - [ ] Test error handling for malformed files
  - [ ] Test cache hit/miss behavior

### 2.2 Project Scanner
- [ ] 2.2.1 Implement project scanner in `packages/openspec-parser/`
  - [ ] `scanProjectsWithOpenSpec(baseDir)` function
  - [ ] Returns array of { name, path, openspecPath }
  - [ ] Filters for directories with openspec/ subfolder
- [ ] 2.2.2 Add scheduled refresh
  - [ ] Scan on server startup
  - [ ] Re-scan every 5 minutes
  - [ ] Update in-memory project registry
- [ ] 2.2.3 Integrate with existing projects API
  - [ ] Extend GET /api/projects response
  - [ ] Add hasOpenspec, activeChangesCount, specsCount fields

### 2.3 OpenSpec tRPC Router
- [ ] 2.3.1 Create `packages/api/src/router/openspec.ts`
  - [ ] Import OpenSpecParser utility
  - [ ] Initialize parser per project
- [ ] 2.3.2 Implement read-only procedures
  - [ ] `openspec.listChanges({ projectId? })` - list all changes
  - [ ] `openspec.showChange({ changeId, projectId })` - read change details
  - [ ] `openspec.listSpecs({ projectId? })` - list all specs
  - [ ] `openspec.showSpec({ specId, projectId })` - read spec details
- [ ] 2.3.3 Implement write procedures
  - [ ] `openspec.createProposal({ projectId, title, description })` - scaffold new proposal
  - [ ] `openspec.archiveChange({ changeId, projectId })` - run archive command
- [ ] 2.3.4 Implement subscription
  - [ ] `openspec.subscribe({ projectId? })` - stream filesystem events
  - [ ] Use chokidar for file watching
  - [ ] Emit events for create/update/delete/archive
- [ ] 2.3.5 Add to root router
  - [ ] Export from `packages/api/src/router/index.ts`

### 2.4 File Watcher Integration
- [ ] 2.4.1 Install and configure chokidar
  - [ ] Add chokidar dependency
  - [ ] Create watcher per project openspec/ directory
- [ ] 2.4.2 Implement event handlers
  - [ ] Watch proposal.md, tasks.md, design.md, specs/*.md
  - [ ] Debounce rapid file changes (100ms)
  - [ ] Invalidate cache on file change
  - [ ] Emit subscription event
- [ ] 2.4.3 Handle edge cases
  - [ ] Watcher startup/shutdown
  - [ ] Missing directories
  - [ ] Permission errors

## Phase 3: Error Triage System

### 3.1 Classification Engine
- [ ] 3.1.1 Create `packages/error-classifier/` package
  - [ ] Initialize package.json
  - [ ] Add to Turborepo pipeline
- [ ] 3.1.2 Implement ErrorClassifier class
  - [ ] `classify(failure, history)` - main entry point
  - [ ] Returns { decision, rationale, priority, confidence }
- [ ] 3.1.3 Implement classification rules
  - [ ] `checkPersistentFailure()` - consecutiveFailures >= 5
  - [ ] `checkRecurringPattern()` - occurrences >= 3
  - [ ] `checkFlakyTest()` - mixed pass/fail
  - [ ] `checkNewFailure()` - first occurrence
- [ ] 3.1.4 Implement keyword analysis
  - [ ] `checkFeatureKeywords()` - scan error message
  - [ ] `checkTestType()` - analyze test file path
  - [ ] Keyword lists: ['feature not implemented', 'not supported', 'todo']
- [ ] 3.1.5 Write unit tests
  - [ ] Test each classification rule
  - [ ] Test keyword matching
  - [ ] Test priority assignment
  - [ ] Test confidence scores

### 3.2 Triage tRPC Router
- [ ] 3.2.1 Create `packages/api/src/router/errors.ts`
  - [ ] Import ErrorClassifier
  - [ ] Initialize classifier instance
- [ ] 3.2.2 Implement triage procedures
  - [ ] `errors.listFailures({ projectId?, classification?, status? })` - list test failures
  - [ ] `errors.triageFailure({ failureId, decision, rationale, priority })` - create triage record
  - [ ] `errors.classifyFailure({ failureId })` - run classifier, return recommendation
  - [ ] `errors.assignSession({ failureId, sessionId })` - link session to error
- [ ] 3.2.3 Implement queries
  - [ ] `errors.listTriage({ decision?, priority? })` - list errorTriage with JOINs
  - [ ] `errors.getTriageById({ id })` - single triage record with full details
- [ ] 3.2.4 Implement subscription
  - [ ] `errors.subscribe({ projectId? })` - stream new triage events
  - [ ] Use SQL triggers or polling (prefer triggers)
- [ ] 3.2.5 Add to root router
  - [ ] Export from `packages/api/src/router/index.ts`

### 3.3 Automated Triage Trigger
- [ ] 3.3.1 Create background job for auto-triage
  - [ ] Poll testFailures table for new failures (every 30s)
  - [ ] Check if errorTriage already exists (skip if yes)
  - [ ] Run classifier and create triage record
- [ ] 3.3.2 Add tRPC context for background jobs
  - [ ] Initialize separate tRPC caller for server-side usage
- [ ] 3.3.3 Handle errors gracefully
  - [ ] Log classification failures
  - [ ] Continue processing other failures
  - [ ] Retry failed classifications

### 3.4 Remediation Integration
- [ ] 3.4.1 Extend sessions router
  - [ ] Add sessionType parameter to `sessions.start`
  - [ ] Store metadata in sessions.metadata column
- [ ] 3.4.2 Link remediationAttempts
  - [ ] On error remediation session start, create remediationAttempt
  - [ ] Link via claudeSessionId and testName
  - [ ] Update status as session progresses
- [ ] 3.4.3 Track completion
  - [ ] On session stop, check if error fixed (rerun test)
  - [ ] Update errorTriage with completion timestamp
  - [ ] Link rerun report if available

## Phase 4: Unified Dashboard

### 4.1 Work API Router
- [ ] 4.1.1 Create `packages/api/src/router/work.ts`
  - [ ] Combine openspec and errors routers
- [ ] 4.1.2 Implement unified queries
  - [ ] `work.listAll({ projectId?, filter?, sort? })` - combine specs + errors
  - [ ] Transform into common schema: { id, type, title, status, priority, createdAt }
  - [ ] Support sorting by priority (normalize spec/error priorities)
- [ ] 4.1.3 Implement statistics
  - [ ] `work.stats({ projectId? })` - aggregate counts
  - [ ] Return: totalSpecs, activeSpecs, totalErrors, needsSpec, inProgress
  - [ ] Calculate 7-day trends
- [ ] 4.1.4 Implement combined subscription
  - [ ] `work.subscribe({ projectId? })` - merge openspec + errors subscriptions
  - [ ] Emit unified events with type discriminator
- [ ] 4.1.5 Add to root router

### 4.2 Dashboard Layout
- [ ] 4.2.1 Create dashboard page in `apps/claude-agent-web/src/app/dashboard/`
  - [ ] Create page.tsx with Tabs component
  - [ ] Add route to app router
- [ ] 4.2.2 Create stats cards component
  - [ ] Use StatsCard from @homelab/ui
  - [ ] Display totalSpecs, activeSpecs, totalErrors, needsSpec
  - [ ] Add trend indicators (up/down arrows)
- [ ] 4.2.3 Create filter sidebar
  - [ ] Project dropdown (persist to localStorage)
  - [ ] Status multi-select
  - [ ] Date range picker (use DateRangePicker from @homelab/ui)
  - [ ] Search input with debounce

### 4.3 All Work Tab
- [ ] 4.3.1 Create AllWorkTable component
  - [ ] Use DataTable from @homelab/ui
  - [ ] Columns: Type Badge, Title, Status, Priority, Created Date, Actions
- [ ] 4.3.2 Implement type indicators
  - [ ] Spec badge: Blue, icon: document
  - [ ] Error badge: Red, icon: alert
- [ ] 4.3.3 Implement row actions
  - [ ] Spec: Implement button (opens session creation modal)
  - [ ] Error: Fix button (opens session creation modal)
  - [ ] Error: Create Spec button (opens proposal creation modal)
- [ ] 4.3.4 Implement row click navigation
  - [ ] Spec → /dashboard/specs/[id]
  - [ ] Error → /dashboard/errors/[id]

### 4.4 Specs Tab
- [ ] 4.4.1 Create SpecsTable component
  - [ ] Columns: Title, Status, Tasks Progress, Created Date, Actions
  - [ ] Group by status: Active, In Progress, Archived
- [ ] 4.4.2 Add task progress indicator
  - [ ] Parse tasks.md to count [x] vs [ ]
  - [ ] Display as progress bar: "12/15 tasks"
- [ ] 4.4.3 Implement actions
  - [ ] Implement button
  - [ ] Archive button (confirmation modal)
  - [ ] View Details button

### 4.5 Errors Tab
- [ ] 4.5.1 Create ErrorsTable component
  - [ ] Columns: Test Name, Classification, Decision, Priority, Created Date, Actions
  - [ ] Group by decision: Needs Spec, One-off Fix, Pending
- [ ] 4.5.2 Add classification badge
  - [ ] NEW: Gray
  - [ ] FLAKY: Yellow
  - [ ] RECURRING: Orange
  - [ ] PERSISTENT: Red
- [ ] 4.5.3 Implement actions
  - [ ] Fix button
  - [ ] Create Spec button
  - [ ] Override Decision button (modal with rationale input)

### 4.6 Detail Views
- [ ] 4.6.1 Create Spec Detail page `/dashboard/specs/[id]`
  - [ ] Display proposal, tasks, design in tabs
  - [ ] Show spec deltas with syntax highlighting
  - [ ] List related sessions
  - [ ] Action buttons: Implement, Archive, Edit (edit opens file in system editor)
- [ ] 4.6.2 Create Error Detail page `/dashboard/errors/[id]`
  - [ ] Display full error message, stack trace
  - [ ] Show classification and triage decision
  - [ ] Chart showing failure pattern over time (Chart.js or Recharts)
  - [ ] List remediation attempts
  - [ ] Action buttons: Fix, Create Spec, Override Decision
- [ ] 4.6.3 Extend Session Detail page
  - [ ] Add sidebar showing linked work item (if any)
  - [ ] Show spec proposal OR error details
  - [ ] Add breadcrumb: Work > [Item] > Session

### 4.7 Action Modals
- [ ] 4.7.1 Create SessionCreationModal component
  - [ ] Inputs: Agent ID (optional), Project Path (pre-filled)
  - [ ] Show linked work item title
  - [ ] On submit: call sessions.start with sessionType and metadata
- [ ] 4.7.2 Create ProposalCreationModal component
  - [ ] Inputs: Title, Description
  - [ ] Pre-fill from error details if triggered from error
  - [ ] On submit: call openspec.createProposal
  - [ ] Link errorTriage.specChangeId on success
- [ ] 4.7.3 Create ArchiveConfirmationModal component
  - [ ] Show validation status (run openspec validate)
  - [ ] Display warnings if validation fails
  - [ ] On confirm: call openspec.archiveChange

### 4.8 Real-Time Updates
- [ ] 4.8.1 Implement tRPC subscription in All Work tab
  - [ ] Subscribe to work.subscribe on mount
  - [ ] Update table data on new events
  - [ ] Show toast notifications for new items
- [ ] 4.8.2 Implement subscription in Specs tab
  - [ ] Subscribe to openspec.subscribe
  - [ ] Update on file changes
- [ ] 4.8.3 Implement subscription in Errors tab
  - [ ] Subscribe to errors.subscribe
  - [ ] Update on new triage events

### 4.9 Responsive Design
- [ ] 4.9.1 Test desktop layout (>= 1024px)
  - [ ] Full table with all columns
  - [ ] Sidebar always visible
- [ ] 4.9.2 Test tablet layout (768-1023px)
  - [ ] Hide less critical columns
  - [ ] Sidebar collapses to dropdown
- [ ] 4.9.3 Test mobile layout (< 768px)
  - [ ] Switch to card layout
  - [ ] Tabs become swipeable
  - [ ] Filters in modal overlay

## Phase 5: Agent Activity Tracking

### 5.1 Agent Activity API
- [ ] 5.1.1 Create `packages/api/src/router/agents.ts`
  - [ ] Import hooks data from existing hooks table
  - [ ] Join with sessions to get active agents
- [ ] 5.1.2 Implement activity procedures
  - [ ] `agents.listActive()` - get all running sessions with latest activity
  - [ ] `agents.getActivity({ sessionId })` - get activity timeline for specific agent
  - [ ] `agents.getMetrics({ sessionId? })` - get performance metrics
  - [ ] `agents.subscribe({ sessionId? })` - stream real-time activity updates
- [ ] 5.1.3 Implement activity aggregation
  - [ ] Query hooks table grouped by sessionId
  - [ ] Calculate: last activity timestamp, current tool, tool count
  - [ ] Determine idle status (no activity for 5+ minutes)
- [ ] 5.1.4 Add to root router
  - [ ] Export from `packages/api/src/router/index.ts`

### 5.2 Activity Timeline Component
- [ ] 5.2.1 Create ActivityTimeline component in `apps/claude-agent-web/`
  - [ ] Display chronological list of hook events
  - [ ] Group by user prompt (each prompt starts new group)
  - [ ] Show elapsed time per group
- [ ] 5.2.2 Implement event rendering
  - [ ] pre_tool_use: Show pending tool with spinner
  - [ ] post_tool_use: Show completed tool with duration and success/failure
  - [ ] user_prompt_submit: Show prompt text
  - [ ] session_start/stop: Show lifecycle events
- [ ] 5.2.3 Add filtering
  - [ ] Filter by hookType (multi-select)
  - [ ] Filter by toolName
  - [ ] Search in tool input/output
- [ ] 5.2.4 Implement real-time updates
  - [ ] Subscribe to agents.subscribe
  - [ ] Append new events to timeline without scroll jump
  - [ ] Highlight new events with fade-in animation

### 5.3 Active Agents Grid
- [ ] 5.3.1 Create AgentCard component
  - [ ] Show: project name, work item (spec/error), agent status
  - [ ] Show: current tool (if executing), last activity timestamp
  - [ ] Show: progress indicator (task completion or tools used)
  - [ ] Show: session duration (elapsed time since start)
- [ ] 5.3.2 Implement status indicators
  - [ ] Running: Green badge, show current tool
  - [ ] Idle: Yellow badge, show "Idle for X minutes"
  - [ ] Error: Red badge, show error count
- [ ] 5.3.3 Create Agents tab page
  - [ ] Grid layout with responsive columns (3 on desktop, 2 on tablet, 1 on mobile)
  - [ ] Auto-refresh every 5 seconds (in addition to subscriptions)
  - [ ] Click card to open activity detail modal
- [ ] 5.3.4 Implement activity detail modal
  - [ ] Show ActivityTimeline component
  - [ ] Show session metrics (tools used, success rate, duration)
  - [ ] Show linked work item details
  - [ ] Action: Stop Session button

### 5.4 Progress Tracking
- [ ] 5.4.1 Implement spec implementation progress
  - [ ] Parse tasks.md to count total tasks
  - [ ] Count completed tasks ([x] vs [ ])
  - [ ] Calculate percentage: completed / total
  - [ ] Estimate completion based on task velocity (tasks per hour)
- [ ] 5.4.2 Implement error remediation progress
  - [ ] Track remediation attempt status from remediationAttempts table
  - [ ] Show: pending, in_progress, fixed, failed
  - [ ] Display tool usage count and elapsed time
- [ ] 5.4.3 Add progress bars to agent cards
  - [ ] Spec: Show task completion percentage
  - [ ] Error: Show remediation status with color coding
- [ ] 5.4.4 Implement completion detection
  - [ ] Check if all tasks marked [x] in tasks.md
  - [ ] Show "Complete!" badge on agent card
  - [ ] Suggest archiving spec in notification

### 5.5 Performance Metrics Dashboard
- [ ] 5.5.1 Create MetricsPanel component
  - [ ] Display session-level metrics (per agent)
  - [ ] Display aggregate metrics (all agents)
- [ ] 5.5.2 Implement metrics calculations
  - [ ] Total tools used (count from hooks)
  - [ ] Success rate (successful tools / total tools)
  - [ ] Average tool duration (mean of durationMs)
  - [ ] Tools per minute (tools / session duration in minutes)
  - [ ] Error rate (failed tools / total tools)
- [ ] 5.5.3 Create tool usage chart
  - [ ] Bar chart showing tool distribution (Read, Edit, Write, Bash, etc.)
  - [ ] Use Chart.js or Recharts
  - [ ] Show success vs failure per tool (stacked bars)
- [ ] 5.5.4 Add to Agents tab header
  - [ ] Show aggregate metrics above agent grid
  - [ ] Update in real-time as agents work

### 5.6 Activity Summary Generation
- [ ] 5.6.1 Implement summarization logic
  - [ ] Group consecutive tool calls of same type
  - [ ] Example: "Read 5 files", "Edited 3 components"
  - [ ] Highlight phase transitions (user prompts)
- [ ] 5.6.2 Create session summary on completion
  - [ ] Generate when session stops
  - [ ] Include: work accomplished, tools used, key files modified
  - [ ] Store in sessions.metadata as JSON
- [ ] 5.6.3 Display summary in session detail
  - [ ] Show summary at top of activity timeline
  - [ ] Expandable sections for each phase
- [ ] 5.6.4 Implement activity export
  - [ ] Export button on activity timeline
  - [ ] Format: JSON (full data) or CSV (tabular)
  - [ ] Include all hook events with timestamps

### 5.7 Real-Time Notifications
- [ ] 5.7.1 Implement activity toast notifications
  - [ ] On new session start: "Agent started working on [Work Item]"
  - [ ] On session complete: "Agent completed [Work Item]"
  - [ ] On error: "Agent encountered error in [Tool]"
- [ ] 5.7.2 Add notification preferences
  - [ ] Toggle notifications per event type
  - [ ] Save preferences to localStorage
- [ ] 5.7.3 Implement sound notifications (optional)
  - [ ] Subtle sound on session completion
  - [ ] Warning sound on error
  - [ ] User can enable/disable

## Phase 6: Testing & Documentation

### 6.1 Unit Tests
- [ ] 6.1.1 Test OpenSpec parser
  - [ ] Valid file parsing
  - [ ] Malformed file handling
  - [ ] Cache behavior
- [ ] 5.1.2 Test error classifier
  - [ ] Each classification rule
  - [ ] Keyword matching
  - [ ] Edge cases
- [ ] 5.1.3 Test tRPC procedures
  - [ ] Input validation
  - [ ] Error handling
  - [ ] Database operations

### 6.2 Integration Tests
- [ ] 5.2.1 Test end-to-end spec workflow
  - [ ] Create proposal → Implement → Archive
  - [ ] Verify filesystem changes
  - [ ] Verify database state
- [ ] 5.2.2 Test end-to-end error workflow
  - [ ] New failure → Classify → Triage → Remediate
  - [ ] Verify triage decision
  - [ ] Verify session link
- [ ] 5.2.3 Test real-time subscriptions
  - [ ] File watcher events
  - [ ] Database triggers
  - [ ] WebSocket delivery

### 6.3 Manual Testing
- [ ] 5.3.1 Test multi-project support
  - [ ] Switch between projects
  - [ ] Verify filtering works
  - [ ] Verify project isolation
- [ ] 5.3.2 Test error classification accuracy
  - [ ] Create sample failures (NEW, FLAKY, RECURRING, PERSISTENT)
  - [ ] Verify classification decisions
  - [ ] Track accuracy metrics
- [ ] 5.3.3 Test dashboard UX
  - [ ] Navigate between tabs
  - [ ] Apply filters
  - [ ] Trigger actions
  - [ ] Verify real-time updates

### 6.4 Documentation
- [ ] 5.4.1 Update CLAUDE.md
  - [ ] Document new dashboard features
  - [ ] Document error triage workflow
  - [ ] Document OpenSpec integration
- [ ] 5.4.2 Add API documentation
  - [ ] Document tRPC procedures
  - [ ] Add usage examples
- [ ] 5.4.3 Create user guide
  - [ ] How to create specs
  - [ ] How to triage errors
  - [ ] How to start remediation sessions

## Phase 7: Deployment & Monitoring

### 7.1 Docker Build
- [ ] 6.1.1 Update Dockerfile
  - [ ] Include new packages in build
  - [ ] Verify Turborepo pruning works
- [ ] 6.1.2 Test Docker build locally
  - [ ] Build image
  - [ ] Run container
  - [ ] Verify all features work

### 7.2 Deployment
- [ ] 6.2.1 Deploy to homelab via CI/CD
  - [ ] Push to dev branch
  - [ ] Monitor deployment logs
  - [ ] Verify service starts successfully
- [ ] 6.2.2 Run database migrations
  - [ ] SSH to server
  - [ ] Run `bun run db:migrate`
  - [ ] Verify schema updates
- [ ] 6.2.3 Smoke test deployed service
  - [ ] Access claude.local
  - [ ] Verify dashboard loads
  - [ ] Create test spec
  - [ ] Triage test error

### 7.3 Monitoring
- [ ] 6.3.1 Add logging for key operations
  - [ ] OpenSpec file reads
  - [ ] Classification decisions
  - [ ] Session creation
- [ ] 6.3.2 Monitor error rates
  - [ ] Check for filesystem errors
  - [ ] Check for classification failures
  - [ ] Check for subscription disconnects
- [ ] 6.3.3 Track performance metrics
  - [ ] OpenSpec read latency
  - [ ] Triage decision latency
  - [ ] Dashboard load time

### 7.4 Post-Deployment
- [ ] 6.4.1 Gather user feedback
  - [ ] Test with real development workflows
  - [ ] Collect improvement suggestions
- [ ] 6.4.2 Iterate on classification rules
  - [ ] Track decision accuracy
  - [ ] Adjust thresholds based on data
- [ ] 6.4.3 Plan Phase 2 enhancements
  - [ ] ML-based classification (if needed)
  - [ ] Advanced spec editing
  - [ ] Workflow automation
