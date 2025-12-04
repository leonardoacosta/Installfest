# Implementation Tasks

## Phase 1: Bidirectional Sync Service (Foundation)

### 1.1 Database Schema for Sync
- [ ] 1.1.1 Create `openspecSpecs` table schema in `packages/db/src/schema/openspec.ts`
  - [ ] Add id (text, primary key - change ID from filesystem)
  - [ ] Add projectId (foreign key to projects)
  - [ ] Add title, status (7-state enum)
  - [ ] Add proposalContent, tasksContent, designContent (text fields for markdown)
  - [ ] Add lastSyncedAt, filesystemModifiedAt, dbModifiedAt timestamps
  - [ ] Add syncError (nullable text for error messages)
  - [ ] Add indexes: projectId, status, lastSyncedAt
- [ ] 1.1.2 Create `syncHistory` table schema in `packages/db/src/schema/sync.ts`
  - [ ] Add id, specId (foreign key), syncDirection ('fs_to_db' | 'db_to_fs')
  - [ ] Add syncedAt timestamp, success boolean
  - [ ] Add errorMessage (nullable), filesChanged (JSON array)
  - [ ] Add triggeredBy ('file_watcher' | 'periodic' | 'user_edit' | 'manual')
- [ ] 1.1.3 Export new schemas from `packages/db/src/schema/index.ts`

### 1.2 Zod Validators for Sync
- [ ] 1.2.1 Create sync validators in `packages/validators/src/sync.ts`
  - [ ] `openspecSpecSchema` - full spec with content
  - [ ] `syncConflictSchema` - conflict detection result
  - [ ] `syncStatusSchema` - sync status response
- [ ] 1.2.2 Create OpenSpec file validators
  - [ ] `proposalMarkdownSchema` - validate proposal.md structure
  - [ ] `tasksMarkdownSchema` - validate tasks.md with checkbox parsing
  - [ ] `designMarkdownSchema` - validate design.md (optional)

### 1.3 File Parsing Utilities
- [ ] 1.3.1 Create markdown parser in `packages/api/src/utils/markdown.ts`
  - [ ] `parseProposalMd(content)` - extract title, why, whatChanges, impact
  - [ ] `parseTasksMd(content)` - extract tasks array with status [x] or [ ]
  - [ ] `parseDesignMd(content)` - extract design sections
  - [ ] Handle malformed markdown gracefully with error messages
- [ ] 1.3.2 Create file system utilities in `packages/api/src/utils/filesystem.ts`
  - [ ] `readOpenSpecFile(path)` - read file with error handling
  - [ ] `writeOpenSpecFile(path, content)` - atomic write with backup
  - [ ] `getFileMtime(path)` - get last modified timestamp
  - [ ] `backupFile(path)` - create .bak copy before overwrite
- [ ] 1.3.3 Write unit tests for parsing utilities
  - [ ] Test valid proposal.md parsing
  - [ ] Test tasks.md checkbox detection
  - [ ] Test malformed markdown handling

### 1.4 OpenSpec Sync Service (Core)
- [ ] 1.4.1 Create `OpenSpecSyncService` in `packages/api/src/services/openspec-sync.ts`
  - [ ] Constructor accepts project config (id, path, openspecPath)
  - [ ] `syncFromFilesystem(specId, immediate)` - read files, write to DB
  - [ ] `syncToFilesystem(specId)` - read DB, write to files
  - [ ] `detectConflicts(specId)` - compare timestamps, detect changes
  - [ ] `forceFilesystemWins(specId)` - resolve conflict by using filesystem version
  - [ ] `getLastSyncStatus(specId)` - return sync history
- [ ] 1.4.2 Implement conflict detection logic
  - [ ] Compare filesystemModifiedAt vs dbModifiedAt vs lastSyncedAt
  - [ ] Conflict = both changed since last sync
  - [ ] Return conflict details: which fields differ, timestamps
- [ ] 1.4.3 Implement transaction safety
  - [ ] Use DB transactions for sync operations
  - [ ] Rollback on filesystem write failure
  - [ ] Log all sync operations to syncHistory table
- [ ] 1.4.4 Add error handling and retries
  - [ ] Catch filesystem errors (permission, not found, etc.)
  - [ ] Retry failed syncs with exponential backoff
  - [ ] Store error in openspecSpecs.syncError field

### 1.5 File Watcher Integration (chokidar)
- [ ] 1.5.1 Add chokidar dependency to `packages/api/package.json`
- [ ] 1.5.2 Create file watcher service in `packages/api/src/services/file-watcher.ts`
  - [ ] `watchProject(projectId, openspecPath)` - start watching directory
  - [ ] Watch: proposal.md, tasks.md, design.md in changes/*/
  - [ ] Debounce rapid changes (100ms)
  - [ ] Emit events: file_changed, file_added, file_deleted
- [ ] 1.5.3 Integrate watcher with sync service
  - [ ] On file_changed event → check if spec is queued
  - [ ] If queued → syncFromFilesystem(specId, immediate: true)
  - [ ] If not queued → add to periodic sync batch
  - [ ] Log watcher events to sync history
- [ ] 1.5.4 Handle watcher lifecycle
  - [ ] Start watchers on server startup for all projects
  - [ ] Stop watchers on server shutdown gracefully
  - [ ] Restart watcher if it crashes (with backoff)
  - [ ] Handle missing directories (log warning, retry periodically)

### 1.6 Periodic Sync Job (node-cron)
- [ ] 1.6.1 Add node-cron dependency to `packages/api/package.json`
- [ ] 1.6.2 Create periodic sync scheduler in `packages/api/src/services/sync-scheduler.ts`
  - [ ] Schedule: every 30 seconds
  - [ ] Query all specs with status NOT IN ('proposing', 'approved', 'assigned', 'in_progress')
  - [ ] Batch sync up to 50 specs per run
  - [ ] Skip specs with recent sync (< 30s ago)
- [ ] 1.6.3 Implement batch sync logic
  - [ ] `syncBatch(specIds)` - sync multiple specs efficiently
  - [ ] Parallelize syncs (Promise.all with concurrency limit)
  - [ ] Collect errors, continue on failure
  - [ ] Log batch summary to console
- [ ] 1.6.4 Add manual sync trigger endpoint
  - [ ] `sync.forceSync({ projectId?, specId? })` tRPC procedure
  - [ ] Force immediate sync bypassing schedules
  - [ ] Return sync result summary

### 1.7 Sync tRPC Router
- [ ] 1.7.1 Create `packages/api/src/router/sync.ts`
  - [ ] Import OpenSpecSyncService
  - [ ] `sync.getStatus({ specId })` - return last sync time, errors
  - [ ] `sync.forceSync({ specId })` - trigger immediate sync
  - [ ] `sync.resolveConflict({ specId, resolution })` - force fs wins
  - [ ] `sync.getSyncHistory({ specId, limit? })` - paginated sync history
- [ ] 1.7.2 Implement sync subscription for real-time updates
  - [ ] `sync.subscribe({ projectId? })` - stream sync events
  - [ ] Emit: sync_started, sync_completed, sync_failed, conflict_detected
  - [ ] Include sync details in events (specId, direction, success)
- [ ] 1.7.3 Add to root router in `packages/api/src/root.ts`
  - [ ] Export syncRouter

### 1.8 Testing Sync Service
- [ ] 1.8.1 Unit tests for OpenSpecSyncService
  - [ ] Test syncFromFilesystem with valid files
  - [ ] Test syncToFilesystem writes correctly
  - [ ] Test conflict detection logic
  - [ ] Test error handling (file not found, parse errors)
- [ ] 1.8.2 Integration tests for file watcher
  - [ ] Create test project with OpenSpec files
  - [ ] Modify file, verify immediate sync triggered
  - [ ] Test debouncing (rapid changes only sync once)
- [ ] 1.8.3 Integration tests for periodic sync
  - [ ] Create specs in various states
  - [ ] Run periodic sync, verify correct specs synced
  - [ ] Test batch sync with multiple specs

## Phase 2: Spec Lifecycle Management (7-State Workflow)

### 2.1 Database Schema for Lifecycle
- [ ] 2.1.1 Update `openspecSpecs` table with status enum
  - [ ] status: 'proposing' | 'approved' | 'assigned' | 'in_progress' | 'review' | 'applied' | 'archived'
  - [ ] Add statusChangedAt timestamp
  - [ ] Add statusChangedBy (userId or sessionId)
- [ ] 2.1.2 Create `specLifecycle` table in `packages/db/src/schema/lifecycle.ts`
  - [ ] Add id, specId (foreign key)
  - [ ] Add fromState, toState (7-state enum)
  - [ ] Add triggeredBy ('user' | 'master_agent' | 'worker_agent' | 'system')
  - [ ] Add triggerUserId (nullable), triggerSessionId (nullable)
  - [ ] Add transitionedAt timestamp, notes (nullable text)
  - [ ] Add index: specId, transitionedAt
- [ ] 2.1.3 Create `appliedSpecs` table for tracking implementations
  - [ ] Add id, specId, projectId (foreign keys)
  - [ ] Add appliedAt timestamp, appliedBy (sessionId)
  - [ ] Add verificationStatus ('pending' | 'tests_passed' | 'tests_failed')
  - [ ] Add verificationNotes (nullable text)

### 2.2 Zod Validators for Lifecycle
- [ ] 2.2.1 Create lifecycle validators in `packages/validators/src/lifecycle.ts`
  - [ ] `specStatusSchema` - 7-state enum
  - [ ] `stateTransitionSchema` - from/to states
  - [ ] `transitionRequestSchema` - user/agent transition request
  - [ ] `lifecycleHistorySchema` - state history response

### 2.3 Spec Lifecycle Service
- [ ] 2.3.1 Create `SpecLifecycleService` in `packages/api/src/services/spec-lifecycle.ts`
  - [ ] `transitionState(specId, toState, triggeredBy, notes?)` - main entry point
  - [ ] `canTransition(specId, toState)` - validate transition is allowed
  - [ ] `getStateHistory(specId)` - return lifecycle history
  - [ ] `getCurrentState(specId)` - return current status
- [ ] 2.3.2 Implement state transition validation
  - [ ] Define allowed transitions map (proposing → approved, etc.)
  - [ ] Check current state allows transition to target state
  - [ ] Return validation error if invalid transition
  - [ ] Log all validation attempts
- [ ] 2.3.3 Implement manual gate checks
  - [ ] `isManualGate(fromState, toState)` - returns true for proposing→approved, review→applied
  - [ ] `requiresUserApproval(specId, toState)` - check if user action needed
  - [ ] Create notification when manual gate reached
- [ ] 2.3.4 Implement automatic transitions
  - [ ] `triggerAutomaticTransition(specId)` - check if auto-transition possible
  - [ ] approved → assigned: when master agent picks up
  - [ ] assigned → in_progress: when worker starts
  - [ ] in_progress → review: when all tasks marked [x]
  - [ ] applied → archived: user-triggered only

### 2.4 State Transition Logic (Rule Engine)
- [ ] 2.4.1 Create transition rules in `packages/api/src/services/transition-rules.ts`
  - [ ] Define state machine graph (adjacency list)
  - [ ] `validateTransition(from, to)` - check if edge exists
  - [ ] `getNextStates(currentState)` - return possible next states
- [ ] 2.4.2 Implement task completion detection
  - [ ] Parse tasks.md markdown
  - [ ] Count total tasks: lines matching `- [ ]` or `- [x]`
  - [ ] Count completed: lines matching `- [x]`
  - [ ] If all complete AND state = in_progress → auto-transition to review
- [ ] 2.4.3 Implement transition side effects
  - [ ] On proposing → approved: add to work queue, notify master agent
  - [ ] On review → applied: record in appliedSpecs, run tests (optional)
  - [ ] On applied → archived: run `openspec archive` CLI command
  - [ ] Update sync timestamps to trigger filesystem write

### 2.5 Lifecycle tRPC Router
- [ ] 2.5.1 Create `packages/api/src/router/lifecycle.ts`
  - [ ] Import SpecLifecycleService
  - [ ] `lifecycle.getStatus({ specId })` - current status + history
  - [ ] `lifecycle.transitionTo({ specId, toState, notes? })` - manual transition
  - [ ] `lifecycle.approve({ specId })` - shortcut for proposing → approved
  - [ ] `lifecycle.markApplied({ specId, verificationNotes })` - shortcut for review → applied
  - [ ] `lifecycle.reject({ specId, reason })` - reject proposal, archive immediately
- [ ] 2.5.2 Implement lifecycle subscription
  - [ ] `lifecycle.subscribe({ projectId?, specId? })` - stream state changes
  - [ ] Emit: state_changed, manual_gate_reached, auto_transition_blocked
  - [ ] Include: specId, fromState, toState, triggeredBy in events
- [ ] 2.5.3 Add to root router

### 2.6 Testing Lifecycle Service
- [ ] 2.6.1 Unit tests for SpecLifecycleService
  - [ ] Test valid transitions succeed
  - [ ] Test invalid transitions fail with error
  - [ ] Test manual gate detection
  - [ ] Test automatic transition triggering
- [ ] 2.6.2 Integration tests for state machine
  - [ ] Create spec, walk through full lifecycle: proposing → archived
  - [ ] Test manual approvals (proposing → approved, review → applied)
  - [ ] Test automatic transitions (approved → assigned → in_progress → review)
  - [ ] Verify lifecycle history recorded correctly

## Phase 3: Master Agent Orchestrator (Persistent Session)

### 3.1 Database Schema for Master Agents
- [ ] 3.1.1 Update `sessions` table with new fields
  - [ ] Add sessionType: 'manual' | 'master_orchestrator' | 'worker_agent'
  - [ ] Add persistent boolean (default false)
  - [ ] Add parentSessionId (nullable, for worker sessions)
  - [ ] Add metadata JSON (stores work queue, current item, clarifications)
- [ ] 3.1.2 Create `masterAgents` table in `packages/db/src/schema/master-agents.ts`
  - [ ] Add id (primary key), sessionId (foreign key to sessions)
  - [ ] Add projectId (foreign key to projects)
  - [ ] Add status: 'initializing' | 'idle' | 'working' | 'paused' | 'stopped'
  - [ ] Add currentWorkItemId (nullable, foreign key to openspecSpecs)
  - [ ] Add queuePosition integer (which item in queue currently processing)
  - [ ] Add lastActivityAt timestamp
  - [ ] Add clarificationsPending JSON array
- [ ] 3.1.3 Create `workQueue` table for prioritized work items
  - [ ] Add id, projectId, specId (foreign keys)
  - [ ] Add priority (1-5), position (order in queue)
  - [ ] Add status: 'queued' | 'assigned' | 'blocked' | 'completed'
  - [ ] Add blockedBy (nullable, specId that must complete first)
  - [ ] Add addedAt timestamp, assignedAt (nullable)

### 3.2 Zod Validators for Master Agents
- [ ] 3.2.1 Create master agent validators in `packages/validators/src/master-agent.ts`
  - [ ] `masterAgentConfigSchema` - configuration options
  - [ ] `workQueueItemSchema` - queue item with priority
  - [ ] `clarificationRequestSchema` - clarification question
  - [ ] `masterAgentStatusSchema` - current status response

### 3.3 Master Agent Service (Core Orchestration)
- [ ] 3.3.1 Create `MasterAgentService` in `packages/api/src/services/master-agent.ts`
  - [ ] `startMasterAgent(projectId)` - create persistent session
  - [ ] `stopMasterAgent(masterAgentId)` - gracefully stop session
  - [ ] `pauseMasterAgent(masterAgentId, reason)` - pause for clarification
  - [ ] `resumeMasterAgent(masterAgentId)` - resume after pause
  - [ ] `getMasterAgentStatus(projectId)` - return current status
- [ ] 3.3.2 Implement session initialization
  - [ ] Create session with sessionType='master_orchestrator', persistent=true
  - [ ] Initialize metadata: { workQueue: [], currentItem: null, clarifications: [] }
  - [ ] Send initialization command to Claude Code session
  - [ ] Load project context (OpenSpec root, recent specs, error patterns)
- [ ] 3.3.3 Implement work assignment logic
  - [ ] `assignWork(masterAgentId, specId)` - send work item to master
  - [ ] `getNextWorkItem(projectId)` - query work queue, select highest priority queued item
  - [ ] Check dependencies: skip items with blockedBy set
  - [ ] Mark item as assigned, update masterAgents.currentWorkItemId
  - [ ] Send command to master agent: `start-work-item:{specId}`
- [ ] 3.3.4 Implement clarification protocol
  - [ ] `requestClarification(masterAgentId, question, options)` - pause master, show notification
  - [ ] `answerClarification(masterAgentId, answer)` - send answer to master, resume
  - [ ] Store pending clarifications in masterAgents.clarificationsPending
  - [ ] Create notification in UI for user response

### 3.4 Work Queue Management
- [ ] 3.4.1 Create work queue service in `packages/api/src/services/work-queue.ts`
  - [ ] `addToQueue(projectId, specId, priority)` - add spec to queue
  - [ ] `removeFromQueue(workItemId)` - remove completed/cancelled item
  - [ ] `reorderQueue(projectId, newOrder)` - user manually reorders
  - [ ] `getQueue(projectId)` - return prioritized queue
  - [ ] `blockWorkItem(workItemId, blockedBySpecId)` - set dependency
- [ ] 3.4.2 Implement priority calculation
  - [ ] Calculate based on: spec priority (1-5), age, dependencies
  - [ ] PERSISTENT errors → priority 5
  - [ ] RECURRING errors → priority 4
  - [ ] User-created specs → use user-specified priority
  - [ ] Age bonus: +1 priority per week waiting
- [ ] 3.4.3 Implement dependency detection
  - [ ] Parse spec content for cross-references (e.g., "depends on spec X")
  - [ ] Check if referenced spec in queue or in_progress
  - [ ] Set blockedBy if dependency not yet applied
  - [ ] Auto-unblock when dependency transitions to applied

### 3.5 Scheduled Reviews (Hourly Cron)
- [ ] 3.5.1 Create review scheduler in `packages/api/src/services/master-review-scheduler.ts`
  - [ ] Schedule: every hour (cron: '0 * * * *')
  - [ ] Query all projects with master agents in 'idle' status
  - [ ] Check if work queue has items in 'queued' status
  - [ ] If yes: send command to master agent to process next item
- [ ] 3.5.2 Implement review trigger conditions
  - [ ] Trigger if: queue not empty AND master agent idle
  - [ ] Trigger if: previous work completed AND marked ready
  - [ ] Skip if: master agent paused (awaiting clarification)
  - [ ] Skip if: manual approval gate not yet cleared
- [ ] 3.5.3 Add manual review trigger
  - [ ] `masterAgent.reviewNow({ projectId })` tRPC procedure
  - [ ] Force immediate review bypassing schedule
  - [ ] Useful for testing and urgent work

### 3.6 Master Agent tRPC Router
- [ ] 3.6.1 Create `packages/api/src/router/master-agent.ts`
  - [ ] Import MasterAgentService
  - [ ] `masterAgent.start({ projectId })` - start master agent session
  - [ ] `masterAgent.stop({ masterAgentId })` - stop master agent
  - [ ] `masterAgent.pause({ masterAgentId, reason })` - pause for clarification
  - [ ] `masterAgent.resume({ masterAgentId })` - resume after pause
  - [ ] `masterAgent.getStatus({ projectId })` - current status
  - [ ] `masterAgent.sendCommand({ masterAgentId, command })` - send arbitrary command
- [ ] 3.6.2 Implement clarification procedures
  - [ ] `masterAgent.requestClarification({ masterAgentId, question, options })` - create clarification request
  - [ ] `masterAgent.answerClarification({ clarificationId, answer })` - provide answer
  - [ ] `masterAgent.listPendingClarifications({ projectId })` - show all pending
- [ ] 3.6.3 Implement master agent subscription
  - [ ] `masterAgent.subscribe({ projectId? })` - stream master agent events
  - [ ] Emit: status_changed, work_started, work_completed, clarification_requested
  - [ ] Include masterAgentId, projectId, status in events
- [ ] 3.6.4 Add to root router

### 3.7 Testing Master Agent Service
- [ ] 3.7.1 Unit tests for MasterAgentService
  - [ ] Test session creation with correct config
  - [ ] Test work assignment logic
  - [ ] Test clarification protocol
  - [ ] Test pause/resume
- [ ] 3.7.2 Integration tests for work queue
  - [ ] Add multiple specs to queue
  - [ ] Master agent processes in priority order
  - [ ] Test dependency blocking (item blocked until dependency applied)
  - [ ] Test manual reordering
- [ ] 3.7.3 End-to-end test for master agent orchestration
  - [ ] Start master agent for test project
  - [ ] Add spec to queue
  - [ ] Master picks up, spawns worker (mock), completes
  - [ ] Verify lifecycle transitions and work queue updates

## Phase 4: Worker Agent Spawning (Task Tool Integration)

### 4.1 Database Schema for Worker Agents
- [ ] 4.1.1 Create `workerAgents` table in `packages/db/src/schema/worker-agents.ts`
  - [ ] Add id (text, primary key - Task tool agent ID)
  - [ ] Add masterSessionId (foreign key to sessions)
  - [ ] Add specId (foreign key to openspecSpecs)
  - [ ] Add agentType (text - subagent_type passed to Task tool)
  - [ ] Add status: 'spawned' | 'active' | 'completed' | 'failed' | 'cancelled'
  - [ ] Add spawnedAt, startedAt (nullable), completedAt (nullable) timestamps
  - [ ] Add result JSON (files changed, tests passed, error messages, etc.)
  - [ ] Add retryCount (integer, for failed workers)

### 4.2 Zod Validators for Worker Agents
- [ ] 4.2.1 Create worker agent validators in `packages/validators/src/worker-agent.ts`
  - [ ] `workerAgentConfigSchema` - spawn config
  - [ ] `workerAgentStatusSchema` - status response
  - [ ] `workerAgentResultSchema` - completion result

### 4.3 Worker Agent Selection Service
- [ ] 4.3.1 Create `WorkerAgentService` in `packages/api/src/services/worker-agent.ts`
  - [ ] `selectAgent(spec)` - analyze spec content, return best subagent_type
  - [ ] `spawnWorker(masterSessionId, specId, agentType)` - call Task tool
  - [ ] `monitorWorker(workerId)` - track progress via hooks
  - [ ] `cancelWorker(workerId)` - stop worker agent
  - [ ] `getWorkerStatus(workerId)` - return current status
- [ ] 4.3.2 Implement agent selection logic
  - [ ] Extract keywords from spec content (proposal + tasks + design)
  - [ ] Match keywords to agent types:
    - tRPC/Better-T-Stack → t3-stack-developer
    - test/e2e/playwright → e2e-test-engineer
    - database/schema/migration → database-architect
    - UI/design/component → ux-design-specialist
    - docker/compose/container → docker-network-architect
    - cache/redis/upstash → redis-cache-architect
  - [ ] Fallback: general-purpose if no match
  - [ ] Log selection reasoning for debugging
- [ ] 4.3.3 Implement worker prompt building
  - [ ] `buildWorkerPrompt(spec)` - construct Task tool prompt
  - [ ] Include: spec title, why section, what changes, tasks list
  - [ ] Include: project path, relevant file paths
  - [ ] Include: "Report completion with summary of changes"
  - [ ] Format as clear instructions for worker agent

### 4.4 Task Tool Integration
- [ ] 4.4.1 Create Task tool wrapper in `packages/api/src/utils/task-tool.ts`
  - [ ] `callTaskTool(subagent_type, prompt, description)` - invoke Task tool
  - [ ] Return: agent ID (for tracking)
  - [ ] Handle errors: tool unavailable, invalid agent type
- [ ] 4.4.2 Implement worker spawning
  - [ ] Master agent calls: `WorkerAgentService.spawnWorker()`
  - [ ] Service calls: Task tool with selected agent type
  - [ ] Record in workerAgents table with status='spawned'
  - [ ] Start monitoring hooks for worker activity
- [ ] 4.4.3 Implement worker monitoring
  - [ ] Query hooks table filtered by worker session ID
  - [ ] Detect first tool execution → update status to 'active', set startedAt
  - [ ] Track tool count, success rate, files edited
  - [ ] Detect completion signal (worker reports done) → status 'completed', set completedAt
  - [ ] Detect errors/failures → status 'failed', log error in result

### 4.5 Worker Progress Tracking
- [ ] 4.5.1 Create worker monitoring service in `packages/api/src/services/worker-monitor.ts`
  - [ ] `trackProgress(workerId)` - continuously monitor hooks
  - [ ] `getProgress(workerId)` - return current progress metrics
  - [ ] `detectCompletion(workerId)` - check if worker finished
  - [ ] `detectFailure(workerId)` - check if worker failed
- [ ] 4.5.2 Implement progress metrics calculation
  - [ ] Tools used: count from hooks table
  - [ ] Files modified: extract from Edit/Write tool calls
  - [ ] Tests run: detect Bash tool calls with test commands
  - [ ] Time elapsed: completedAt - spawnedAt
  - [ ] Success rate: successful tools / total tools
- [ ] 4.5.3 Implement completion detection
  - [ ] Check for completion signal in hooks (e.g., final message)
  - [ ] If tasks.md all marked [x] → assume complete
  - [ ] If no activity for 10+ minutes AND tasks complete → assume done
  - [ ] Update spec lifecycle: in_progress → review

### 4.6 Worker Retry Logic
- [ ] 4.6.1 Implement failure detection and retry
  - [ ] If worker status='failed' AND retryCount < 3 → retry with same agent
  - [ ] If retry fails 3x → try different agent type
  - [ ] If all retries fail → request manual intervention (clarification)
  - [ ] Log all retry attempts in workerAgents.result
- [ ] 4.6.2 Implement alternative agent selection
  - [ ] If t3-stack-developer fails → try general-purpose
  - [ ] If e2e-test-engineer fails → try general-purpose
  - [ ] Record which agents attempted, which succeeded

### 4.7 Worker Agent tRPC Router
- [ ] 4.7.1 Create `packages/api/src/router/worker-agent.ts`
  - [ ] Import WorkerAgentService
  - [ ] `workerAgent.listActive({ projectId? })` - show running workers
  - [ ] `workerAgent.getStatus({ workerId })` - detailed status
  - [ ] `workerAgent.getProgress({ workerId })` - progress metrics
  - [ ] `workerAgent.cancel({ workerId })` - stop worker
  - [ ] `workerAgent.listForSpec({ specId })` - all workers for spec (including retries)
- [ ] 4.7.2 Implement worker subscription
  - [ ] `workerAgent.subscribe({ masterSessionId?, specId? })` - stream worker events
  - [ ] Emit: worker_spawned, worker_started, worker_completed, worker_failed
  - [ ] Include: workerId, agentType, specId, status in events
- [ ] 4.7.3 Add to root router

### 4.8 Testing Worker Agent Service
- [ ] 4.8.1 Unit tests for WorkerAgentService
  - [ ] Test agent selection logic with various spec content
  - [ ] Test prompt building
  - [ ] Test worker spawning (mock Task tool)
  - [ ] Test retry logic
- [ ] 4.8.2 Integration tests for worker monitoring
  - [ ] Spawn mock worker, simulate hooks
  - [ ] Test progress tracking
  - [ ] Test completion detection
  - [ ] Test failure detection and retry
- [ ] 4.8.3 End-to-end test for worker orchestration
  - [ ] Master spawns worker for spec
  - [ ] Worker executes tools (mock)
  - [ ] Worker completes, master updates lifecycle
  - [ ] Verify spec transitions in_progress → review

## Phase 5: Error Automation (Auto-Generate Spec Proposals)

### 5.1 Database Schema for Error Proposals
- [ ] 5.1.1 Create `errorProposals` table in `packages/db/src/schema/error-proposals.ts`
  - [ ] Add id, testFailureId (foreign key to testFailures)
  - [ ] Add specId (foreign key to openspecSpecs, nullable until created)
  - [ ] Add generatedAt timestamp
  - [ ] Add autoGeneratedContent JSON (original generated proposal)
  - [ ] Add userModified boolean (did user edit before approval)

### 5.2 Error Proposal Service
- [ ] 5.2.1 Create `ErrorProposalService` in `packages/api/src/services/error-proposal.ts`
  - [ ] `generateProposal(testFailure)` - create spec draft from error
  - [ ] `inferChangesFromError(testFailure)` - analyze error, suggest fixes
  - [ ] `calculatePriority(classification)` - map classification to priority
  - [ ] `createProposalFiles(proposal, projectPath)` - write proposal.md, tasks.md
- [ ] 5.2.2 Implement proposal generation logic
  - [ ] Title: "Fix: {testName}"
  - [ ] Why section: include error message, stack trace, failure pattern
  - [ ] What Changes: infer from error type (test expectations, missing features, etc.)
  - [ ] Priority: PERSISTENT=5, RECURRING=4, FLAKY=3, NEW=2
  - [ ] Initial status: 'proposing'
- [ ] 5.2.3 Implement tasks generation
  - [ ] Analyze error stack trace to identify failing files
  - [ ] Generate tasks: "Investigate {fileName}", "Fix {testName}", "Add test coverage"
  - [ ] Format as tasks.md with checkboxes: `- [ ] 1. Investigate...`
- [ ] 5.2.4 Integrate with sync service
  - [ ] After generating proposal files, trigger syncFromFilesystem
  - [ ] Proposal enters DB with status='proposing'
  - [ ] Add to work queue automatically

### 5.3 Playwright Integration
- [ ] 5.3.1 Create failure watcher in `packages/api/src/services/failure-watcher.ts`
  - [ ] Subscribe to testFailures table (poll or trigger)
  - [ ] On new failure: check if proposal already exists
  - [ ] If not: call ErrorProposalService.generateProposal()
  - [ ] Record in errorProposals table
- [ ] 5.3.2 Implement duplicate detection
  - [ ] Check if proposal already exists for same test name
  - [ ] If exists: update existing proposal with new failure info
  - [ ] If different error message: create new proposal
  - [ ] Link multiple failures to same proposal if root cause same
- [ ] 5.3.3 Implement automatic priority updates
  - [ ] If failure reoccurs: increase priority (NEW → RECURRING → PERSISTENT)
  - [ ] Update proposal priority in DB
  - [ ] Reorder work queue based on new priority

### 5.4 Error Proposal tRPC Router
- [ ] 5.4.1 Create `packages/api/src/router/error-proposals.ts`
  - [ ] Import ErrorProposalService
  - [ ] `errorProposals.listPending({ projectId? })` - proposals awaiting approval
  - [ ] `errorProposals.get({ errorProposalId })` - detailed error proposal
  - [ ] `errorProposals.regenerate({ errorProposalId })` - regenerate with updated error info
  - [ ] `errorProposals.link({ errorProposalId, specId })` - link proposal to manually created spec
- [ ] 5.4.2 Implement error proposal subscription
  - [ ] `errorProposals.subscribe({ projectId? })` - stream new error proposals
  - [ ] Emit: proposal_generated, proposal_updated
  - [ ] Include: errorProposalId, testFailureId, specId, priority in events
- [ ] 5.4.3 Add to root router

### 5.5 Testing Error Proposal Service
- [ ] 5.5.1 Unit tests for ErrorProposalService
  - [ ] Test proposal generation with various error types
  - [ ] Test priority calculation
  - [ ] Test tasks generation
  - [ ] Test change inference
- [ ] 5.5.2 Integration tests for error automation
  - [ ] Simulate test failure
  - [ ] Verify proposal auto-generated
  - [ ] Verify proposal added to work queue
  - [ ] Verify sync to filesystem

## Phase 6: Unified Dashboard (Work Queue & Spec Editor)

### 6.1 Dashboard Layout Components
- [ ] 6.1.1 Create main dashboard page in `apps/claude-agent-web/src/app/dashboard/page.tsx`
  - [ ] Tabs: Work Queue, Approvals, Master Agents, Lifecycle, Specs, Errors
  - [ ] Shared filter sidebar: Project, Status, Priority, Date range
  - [ ] Stats cards at top: Total specs, Active work, Pending approvals, Errors
- [ ] 6.1.2 Create stats cards component `StatsCards.tsx`
  - [ ] Use tRPC query: `work.stats({ projectId })`
  - [ ] Display: Total specs, Specs in progress, Pending approvals, Error proposals
  - [ ] Add trend indicators (up/down arrows for 7-day change)
- [ ] 6.1.3 Create filter sidebar component `FilterSidebar.tsx`
  - [ ] Project dropdown (persisted to localStorage)
  - [ ] Status multi-select checkboxes
  - [ ] Priority range slider (1-5)
  - [ ] Date range picker (from/to)
  - [ ] Search input with debounce (300ms)
  - [ ] Apply filters button

### 6.2 Work Queue Tab
- [ ] 6.2.1 Create work queue table component `WorkQueueTable.tsx`
  - [ ] Columns: Type badge, Title, Status, Priority, Age, Actions
  - [ ] Type badge: Blue for specs, Red for errors
  - [ ] Status badge: Color-coded by 7-state status
  - [ ] Priority: 1-5 stars visual
  - [ ] Age: Human-readable (e.g., "2 days ago")
  - [ ] Actions: View, Edit, Approve, Reject buttons
- [ ] 6.2.2 Implement row actions
  - [ ] View: Navigate to spec detail page
  - [ ] Edit: Open spec editor modal
  - [ ] Approve: Call `lifecycle.approve({ specId })`
  - [ ] Reject: Show rejection reason modal, call `lifecycle.reject({ specId, reason })`
- [ ] 6.2.3 Implement drag-and-drop reordering
  - [ ] Use react-beautiful-dnd or @dnd-kit
  - [ ] Allow dragging rows to reorder priority
  - [ ] On drop: call `workQueue.reorder({ projectId, newOrder })`
  - [ ] Optimistic UI update, rollback on error
- [ ] 6.2.4 Implement real-time updates
  - [ ] Subscribe to `work.subscribe({ projectId })`
  - [ ] On new work item: add to table with animation
  - [ ] On status change: update row with transition animation
  - [ ] Show toast notification for high-priority items

### 6.3 Approvals Tab
- [ ] 6.3.1 Create approvals table component `ApprovalsTable.tsx`
  - [ ] Filter: Only specs with status='proposing' OR status='review'
  - [ ] Columns: Title, Type (Error/Manual), Priority, Created, Actions
  - [ ] Grouped by approval gate: "Needs Approval" (proposing), "Needs Validation" (review)
- [ ] 6.3.2 Implement approval actions
  - [ ] For proposing specs: Approve, Edit & Approve, Reject buttons
  - [ ] For review specs: Validate & Apply, Request Changes buttons
  - [ ] Approve: Transition proposing → approved
  - [ ] Validate & Apply: Transition review → applied (with confirmation modal)
  - [ ] Reject: Archive immediately with reason
- [ ] 6.3.3 Create approval detail modal `ApprovalDetailModal.tsx`
  - [ ] Show full proposal content
  - [ ] For error proposals: show original error details (message, stack trace)
  - [ ] For review specs: show worker completion summary, files changed
  - [ ] Approve/Reject buttons at bottom

### 6.4 Master Agents Tab
- [ ] 6.4.1 Create master agent grid component `MasterAgentGrid.tsx`
  - [ ] Card layout: 3 columns desktop, 2 tablet, 1 mobile
  - [ ] Each card: Project name, Status badge, Current work item, Last activity
  - [ ] Status indicator: Green (working), Yellow (idle), Red (paused), Gray (stopped)
- [ ] 6.4.2 Create master agent card component `MasterAgentCard.tsx`
  - [ ] Project name as header
  - [ ] Status badge with icon
  - [ ] Current work: Spec title with link to detail
  - [ ] Progress bar: Work queue position (e.g., "Item 3 of 7")
  - [ ] Last activity: Timestamp (e.g., "Active 2m ago")
  - [ ] Actions: Pause, Resume, Stop buttons
- [ ] 6.4.3 Implement master agent actions
  - [ ] Pause: Call `masterAgent.pause({ masterAgentId, reason: 'user_requested' })`
  - [ ] Resume: Call `masterAgent.resume({ masterAgentId })`
  - [ ] Stop: Confirmation modal, call `masterAgent.stop({ masterAgentId })`
  - [ ] Start (if no master for project): `masterAgent.start({ projectId })`
- [ ] 6.4.4 Create clarifications panel `ClarificationsPanel.tsx`
  - [ ] Show pending clarifications from all master agents
  - [ ] Each clarification: Question text, Options (radio buttons), Submit button
  - [ ] On submit: Call `masterAgent.answerClarification({ clarificationId, answer })`
  - [ ] Real-time updates via subscription

### 6.5 Spec Editor (Full Editing UI)
- [ ] 6.5.1 Create spec editor page `/dashboard/spec-editor/[id]/page.tsx`
  - [ ] Route parameter: specId
  - [ ] Load spec from DB via tRPC: `openspec.get({ specId })`
  - [ ] Tabs: Proposal, Tasks, Design
  - [ ] Save button (triggers sync to filesystem)
  - [ ] Cancel button (discard changes)
- [ ] 6.5.2 Integrate Monaco Editor for markdown editing
  - [ ] Add @monaco-editor/react dependency
  - [ ] Configure for markdown syntax highlighting
  - [ ] Enable vim mode (optional user setting)
  - [ ] Add preview pane (live markdown rendering)
- [ ] 6.5.3 Implement proposal editor tab
  - [ ] Monaco editor for proposal.md content
  - [ ] Split view: Editor left, Preview right
  - [ ] Auto-save draft to localStorage (every 5s)
  - [ ] Validation on save: Check required sections exist
- [ ] 6.5.4 Implement tasks editor tab
  - [ ] Monaco editor for tasks.md content
  - [ ] Highlight checkboxes `[ ]` and `[x]`
  - [ ] Show task completion percentage at top
  - [ ] Add "Mark all complete" button
- [ ] 6.5.5 Implement design editor tab
  - [ ] Monaco editor for design.md content (optional file)
  - [ ] Show "Create design.md" button if not exists
  - [ ] Template generation: Pre-fill with design doc structure
- [ ] 6.5.6 Implement save logic
  - [ ] On save: Update openspecSpecs in DB (proposalContent, tasksContent, designContent)
  - [ ] Trigger sync to filesystem: Call `sync.syncToFilesystem({ specId })`
  - [ ] Handle conflicts: If filesystem changed since load, show conflict modal
  - [ ] Conflict modal: Show diff, offer "Force my changes" or "Reload from filesystem"
  - [ ] After successful save: Show toast, redirect to spec detail

### 6.6 Lifecycle Tab (State History Visualization)
- [ ] 6.6.1 Create lifecycle page `/dashboard/lifecycle/[id]/page.tsx`
  - [ ] Route parameter: specId
  - [ ] Load lifecycle history via tRPC: `lifecycle.getStatus({ specId })`
  - [ ] Visual timeline showing state transitions
- [ ] 6.6.2 Create timeline component `LifecycleTimeline.tsx`
  - [ ] Vertical timeline with state nodes
  - [ ] Each node: State name, Timestamp, Triggered by (user/agent)
  - [ ] Transitions shown as arrows between nodes
  - [ ] Current state highlighted in bold
  - [ ] Manual gates shown with user icon
  - [ ] Automatic transitions shown with robot icon
- [ ] 6.6.3 Implement transition details modal
  - [ ] Click on transition to see details
  - [ ] Show: fromState, toState, triggeredBy, timestamp, notes
  - [ ] If triggered by agent: Link to agent session, show agent activity
  - [ ] If triggered by user: Show user name/ID

### 6.7 Testing Dashboard Components
- [ ] 6.7.1 Component tests for tables and cards
  - [ ] Test work queue table renders correctly
  - [ ] Test row actions trigger correct tRPC calls
  - [ ] Test drag-and-drop reordering
  - [ ] Test filter application
- [ ] 6.7.2 Integration tests for spec editor
  - [ ] Load spec, edit content, save
  - [ ] Test conflict detection and resolution
  - [ ] Test validation errors on invalid markdown
- [ ] 6.7.3 E2E tests for full workflow
  - [ ] User approves spec from Approvals tab
  - [ ] Master agent picks up, spawns worker
  - [ ] Worker completes, spec moves to review
  - [ ] User validates and applies
  - [ ] Verify lifecycle history shows all transitions

## Phase 7: Real-Time Subscriptions & Notifications

### 7.1 Subscription Infrastructure
- [ ] 7.1.1 Create unified work subscription in `packages/api/src/router/work.ts`
  - [ ] `work.subscribe({ projectId? })` - combines all subscriptions
  - [ ] Merges events from: openspec, lifecycle, masterAgent, workerAgent, errorProposals
  - [ ] Returns unified event stream with discriminated union type
- [ ] 7.1.2 Implement subscription aggregation
  - [ ] Subscribe to all relevant tables/watchers
  - [ ] Deduplicate events (same event from multiple sources)
  - [ ] Add event timestamps for ordering
  - [ ] Buffer events if client disconnects (recent 100)

### 7.2 Notification System
- [ ] 7.2.1 Create notifications table in `packages/db/src/schema/notifications.ts`
  - [ ] Add id, userId, type, message, actionUrl (nullable)
  - [ ] Add dismissed boolean, createdAt timestamp
  - [ ] Add metadata JSON (context-specific data)
  - [ ] Types: 'clarification_needed', 'approval_required', 'work_completed', 'error_critical'
- [ ] 7.2.2 Create notification service in `packages/api/src/services/notifications.ts`
  - [ ] `createNotification(type, message, actionUrl, metadata)` - create notification
  - [ ] `dismissNotification(notificationId)` - mark as dismissed
  - [ ] `getUnreadNotifications(userId)` - return undismissed notifications
- [ ] 7.2.3 Implement notification triggers
  - [ ] On clarification requested: Create 'clarification_needed' notification
  - [ ] On spec proposing: Create 'approval_required' notification
  - [ ] On worker completed: Create 'work_completed' notification
  - [ ] On PERSISTENT error: Create 'error_critical' notification

### 7.3 Notification UI Components
- [ ] 7.3.1 Create notification bell component `NotificationBell.tsx`
  - [ ] Icon in header with unread count badge
  - [ ] Click to open dropdown with notifications list
  - [ ] Each notification: Icon, Message, Timestamp, Action button (optional)
  - [ ] "Dismiss" and "Dismiss all" buttons
- [ ] 7.3.2 Implement notification interactions
  - [ ] Click notification: Navigate to actionUrl if present
  - [ ] Dismiss: Call `notifications.dismiss({ notificationId })`
  - [ ] Dismiss all: Call `notifications.dismissAll()`
  - [ ] Subscribe to `notifications.subscribe()` for real-time updates
- [ ] 7.3.3 Create toast notifications component `ToastNotifications.tsx`
  - [ ] Use react-hot-toast or similar library
  - [ ] Show toast for high-priority events: critical errors, clarifications
  - [ ] Auto-dismiss after 5 seconds (configurable)
  - [ ] Click toast to navigate to detail

### 7.4 Testing Subscriptions & Notifications
- [ ] 7.4.1 Unit tests for notification service
  - [ ] Test notification creation
  - [ ] Test notification retrieval
  - [ ] Test dismissal logic
- [ ] 7.4.2 Integration tests for real-time updates
  - [ ] Simulate spec state change
  - [ ] Verify subscription emits event
  - [ ] Verify UI updates in real-time
  - [ ] Test reconnection after disconnect

## Phase 8: Testing & Validation

### 8.1 Unit Tests
- [ ] 8.1.1 Test all service classes with mocked dependencies
  - [ ] OpenSpecSyncService
  - [ ] SpecLifecycleService
  - [ ] MasterAgentService
  - [ ] WorkerAgentService
  - [ ] ErrorProposalService
- [ ] 8.1.2 Test utility functions
  - [ ] Markdown parsing utilities
  - [ ] File system utilities
  - [ ] Priority calculation
  - [ ] Agent selection logic
- [ ] 8.1.3 Test validators (Zod schemas)
  - [ ] Valid inputs pass
  - [ ] Invalid inputs fail with correct error messages
  - [ ] Edge cases handled

### 8.2 Integration Tests
- [ ] 8.2.1 Test bidirectional sync end-to-end
  - [ ] Create OpenSpec files in test project
  - [ ] Trigger filesystem → DB sync
  - [ ] Edit in UI, trigger DB → filesystem sync
  - [ ] Verify filesystem changes reflect in files
  - [ ] Test conflict detection and resolution
- [ ] 8.2.2 Test spec lifecycle state machine
  - [ ] Walk spec through full lifecycle
  - [ ] Verify all transitions recorded in specLifecycle table
  - [ ] Test invalid transitions rejected
  - [ ] Test manual gates block automatic progression
- [ ] 8.2.3 Test master agent orchestration
  - [ ] Start master agent
  - [ ] Add specs to work queue
  - [ ] Master picks up, spawns workers (mocked)
  - [ ] Workers complete, master updates lifecycle
  - [ ] Verify work queue emptied
- [ ] 8.2.4 Test worker agent spawning
  - [ ] Master spawns worker via Task tool (mocked)
  - [ ] Monitor worker progress via hooks
  - [ ] Detect completion
  - [ ] Test retry logic on failure

### 8.3 End-to-End Tests (E2E)
- [ ] 8.3.1 Test full user workflow: Error → Spec → Implementation → Applied
  - [ ] Playwright test fails
  - [ ] Error proposal auto-generated
  - [ ] User approves proposal
  - [ ] Master agent assigns to worker
  - [ ] Worker implements fix
  - [ ] User validates and applies
  - [ ] Spec archived
- [ ] 8.3.2 Test manual spec creation workflow
  - [ ] User creates spec via UI
  - [ ] Spec synced to filesystem
  - [ ] User edits in external editor
  - [ ] Changes synced back to DB
  - [ ] User approves, master agent picks up
- [ ] 8.3.3 Test clarification workflow
  - [ ] Master agent requests clarification
  - [ ] Notification appears in UI
  - [ ] User answers clarification
  - [ ] Master agent resumes work
- [ ] 8.3.4 Test work queue prioritization
  - [ ] Add multiple specs with different priorities
  - [ ] Master agent processes in priority order
  - [ ] Test dependency blocking
  - [ ] Test manual reordering

### 8.4 Validation with OpenSpec CLI
- [ ] 8.4.1 Run `openspec validate --strict` on proposal
  - [ ] Verify proposal.md structure valid
  - [ ] Verify all required sections present
  - [ ] Fix any validation errors
- [ ] 8.4.2 Validate all spec deltas
  - [ ] Each delta has at least one requirement
  - [ ] Each requirement has at least one scenario
  - [ ] Scenarios use WHEN/THEN format
- [ ] 8.4.3 Generate validation report
  - [ ] List all specs created/modified
  - [ ] Show validation status for each
  - [ ] Document any exceptions or warnings

## Phase 9: Documentation & Deployment

### 9.1 Update Documentation
- [ ] 9.1.1 Update CLAUDE.md
  - [ ] Add section on product management integration
  - [ ] Document new dashboard features
  - [ ] Link to detailed docs and specs
- [ ] 9.1.2 Create homelab-services/docs/product-management.md
  - [ ] Architecture overview
  - [ ] User workflows (error → spec → implementation)
  - [ ] Master agent configuration
  - [ ] Worker agent types and selection
  - [ ] Troubleshooting common issues
- [ ] 9.1.3 Update homelab-services/docs/INDEX.md
  - [ ] Add product management docs to navigation
  - [ ] Link to OpenSpec specs

### 9.2 Deployment Preparation
- [ ] 9.2.1 Update Docker configuration
  - [ ] Ensure all new dependencies in package.json
  - [ ] Verify Turborepo build includes new packages
  - [ ] Test Docker build locally
- [ ] 9.2.2 Add environment variables
  - [ ] Document new env vars in .env.example
  - [ ] OPENSPEC_PROJECTS_DIR - path to projects with OpenSpec
  - [ ] MASTER_AGENT_REVIEW_CRON - cron schedule for reviews
  - [ ] FILE_WATCHER_ENABLED - enable/disable file watcher
- [ ] 9.2.3 Create deployment runbook
  - [ ] Pre-deployment: Backup database
  - [ ] Initial sync: Run filesystem → DB sync for all projects
  - [ ] Start master agents: Manually start for each project (opt-in)
  - [ ] Monitor: Check logs for sync errors, master agent status

### 9.3 Deployment Execution
- [ ] 9.3.1 Deploy to dev environment
  - [ ] Push to dev branch
  - [ ] Monitor CI/CD pipeline
  - [ ] Verify services start successfully
  - [ ] Run smoke tests
- [ ] 9.3.2 Run initial sync
  - [ ] SSH to server
  - [ ] Call `sync.forceSync()` for each project
  - [ ] Verify specs appear in database
  - [ ] Check for sync errors in logs
- [ ] 9.3.3 Start master agents (opt-in per project)
  - [ ] Use dashboard to start master agent for test project
  - [ ] Verify master agent shows as 'idle'
  - [ ] Add test spec to queue
  - [ ] Verify master picks up and processes
- [ ] 9.3.4 Monitor and validate
  - [ ] Check logs for errors (sync, master agent, worker spawning)
  - [ ] Monitor database for expected data
  - [ ] Test user workflows in dashboard
  - [ ] Verify real-time subscriptions working

### 9.4 Post-Deployment
- [ ] 9.4.1 Gather feedback from usage
  - [ ] Monitor master agent decisions (good/bad prioritization)
  - [ ] Track error proposal quality (good/bad auto-generation)
  - [ ] Measure user satisfaction with workflows
- [ ] 9.4.2 Iterate on agent selection logic
  - [ ] Review which agent types selected most often
  - [ ] Check worker success rates per agent type
  - [ ] Adjust selection keywords if needed
- [ ] 9.4.3 Optimize performance
  - [ ] Monitor sync latency (filesystem ↔ DB)
  - [ ] Check work queue query performance
  - [ ] Optimize database indexes if slow
- [ ] 9.4.4 Plan Phase 2 enhancements
  - [ ] Advanced priority calculation (ML-based?)
  - [ ] Multi-project master agent coordination
  - [ ] Automated testing integration (run tests before applying)
  - [ ] Spec template library

## Summary

**Total Phases**: 9
**Estimated Tasks**: ~280
**Estimated Timeline**: 6-8 weeks (1-2 weeks per major phase)

**Dependencies**:
- Phase 1 (Sync) must complete before Phase 2-4
- Phase 2 (Lifecycle) must complete before Phase 3 (Master)
- Phase 3 (Master) must complete before Phase 4 (Worker)
- Phase 5 (Error Automation) can parallelize with Phase 3-4
- Phase 6 (Dashboard) depends on all backend phases
- Phase 7 (Subscriptions) can parallelize with Phase 6
- Phase 8 (Testing) throughout all phases
- Phase 9 (Deployment) final phase

**Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 6 → Phase 9
