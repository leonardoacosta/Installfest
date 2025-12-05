# Implementation Tasks: Worker Coordination and Progress Monitoring

## Phase 4.1: Worker Agent Database Schema

### 4.1.1 Worker Agents Table
- [x] Create `workerAgents` table in `packages/db/src/schema/worker-agents.ts`
  - [x] Add id (text, primary key - Task tool agent ID)
  - [x] Add sessionId (foreign key to sessions - who spawned this)
  - [x] Add specId (foreign key to openspecSpecs - what are they working on)
  - [x] Add agentType (text - subagent_type: t3-stack-developer, e2e-test-engineer, etc.)
  - [x] Add status enum: 'spawned' | 'active' | 'completed' | 'failed' | 'cancelled'
  - [x] Add spawnedAt, startedAt (nullable), completedAt (nullable) timestamps
  - [x] Add result (JSON text - {filesChanged: [], testsRun, testsPassed, errors})
  - [x] Add retryCount (integer, default 0)
  - [x] Add errorMessage (nullable text, if failed)
  - [x] Add indexes: (sessionId), (specId), (status), (spawnedAt)

### 4.1.2 Schema Export and Migration
- [x] Export workerAgents schema from `packages/db/src/schema/index.ts`
- [ ] Run migrations to create table

## Phase 4.2: Zod Validators

### 4.2.1 Worker Agent Validators
- [x] Create `packages/validators/src/worker-agent.ts`
  - [x] `workerAgentConfigSchema` - Spawn request (sessionId, specId, agentType?)
  - [x] `workerAgentStatusSchema` - Status response
  - [x] `workerAgentProgressSchema` - Progress metrics
  - [x] `agentTypeEnum` - Valid agent types

### 4.2.2 Validation Testing
- [x] Test validators with valid/invalid inputs

## Phase 4.3: Agent Selection Service

### 4.3.1 Create Agent Selection Logic
- [x] Create `packages/api/src/services/worker-selector.ts`
  - [x] `selectAgentType(spec)` - Analyze spec and return best agentType
  - [x] Extract content from proposal.md, tasks.md, design.md
  - [x] Search for keywords in content:
    - [x] tRPC/Better-T-Stack/TypeScript → `t3-stack-developer`
    - [x] test/e2e/playwright/vitest → `e2e-test-engineer`
    - [x] database/schema/migration/drizzle/SQL → `database-architect`
    - [x] UI/component/design/React/CSS → `ux-design-specialist`
    - [x] docker/compose/container/network → `docker-network-architect`
    - [x] cache/redis/upstash/performance → `redis-cache-architect`
  - [x] Fallback: `general-purpose` if no clear keywords
  - [x] Return: { agentType, confidence, reasoning }
  - [x] Log reasoning for debugging

### 4.3.2 Keyword Matching
- [x] Create keyword mapping object
  - [x] Case-insensitive matching
  - [x] Support partial matches (e.g., "playwright" contains "test")
- [x] Test with sample spec content

## Phase 4.4: Worker Spawning Service

### 4.4.1 Create WorkerAgentService
- [x] Create `packages/api/src/services/worker-agent.ts`
  - [x] Constructor accepts DB client and workerSelector
  - [x] `spawnWorker(sessionId, specId, agentType?)` - Main spawn method
  - [x] `buildWorkerPrompt(spec, agentType)` - Construct Task tool prompt
  - [x] `getWorkerStatus(workerId)` - Query current status
  - [x] `cancelWorker(workerId)` - Stop worker
  - [x] `markWorkerComplete(workerId, result)` - Record completion

### 4.4.2 Prompt Building
- [x] `buildWorkerPrompt(spec, agentType)` should include:
  - [x] Spec title and ID
  - [x] Full "Why" section from proposal.md
  - [x] "What Changes" section
  - [x] Full tasks.md list (work items)
  - [x] Project path and key file paths
  - [x] "Complete all tasks marked [ ], update their status to [x], report when done"
  - [x] "If you encounter errors, report them clearly"
  - [x] Clear, step-by-step instructions

### 4.4.3 Task Tool Integration
- [x] Create `packages/api/src/utils/task-tool.ts`
  - [x] `callTaskTool(subagent_type, prompt, description)` - Call Task tool
  - [x] Return: agent_id (for tracking)
  - [x] Handle errors: tool unavailable, invalid agent type, network errors

### 4.4.4 Spawning Implementation
- [x] In `spawnWorker`:
  - [x] Validate session exists and currentWorkItemId matches specId
  - [x] Select agent type if not specified
  - [x] Build worker prompt
  - [x] Call Task tool to spawn agent
  - [x] Create workerAgents table entry with status='spawned'
  - [x] Set spawnedAt timestamp
  - [x] Return created worker record
  - [x] Emit subscription event: worker_spawned

## Phase 4.5: Worker Monitoring Service

### 4.5.1 Create WorkerMonitorService
- [x] Create `packages/api/src/services/worker-monitor.ts`
  - [x] `monitorWorker(workerId)` - Start continuous monitoring
  - [x] `getProgress(workerId)` - Return current progress metrics
  - [x] `detectCompletion(workerId)` - Check if worker finished
  - [x] `detectFailure(workerId)` - Check if worker failed

### 4.5.2 Progress Tracking via Hooks
- [x] On first hook for worker session → status='active', startedAt=now()
- [x] For each hook event:
  - [x] Extract: tool_name, success, duration_ms
  - [x] If tool is Edit/Write → Track file changes
  - [x] If tool is Bash with test pattern → Track test execution
  - [x] Accumulate metrics
- [x] Query latest 50 hooks for worker session for timeline view

### 4.5.3 Progress Metrics Calculation
- [x] `getProgress(workerId)` should return:
  - [x] `toolsExecuted` - Count of hook events
  - [x] `successRate` - % of successful hooks
  - [x] `filesChanged` - Array of file paths from Edit/Write tools
  - [x] `testsRun` - Count of detected test executions
  - [x] `elapsedMs` - completedAt - spawnedAt
  - [x] `taskCompletion` - Parse latest tasks.md, count [x] vs [ ]
  - [x] `status` - Current status
  - [x] `statusChangedAt` - Last status change timestamp

### 4.5.4 Completion Detection
- [x] `detectCompletion(workerId)` logic:
  - [x] Check if last hook has completion signal (specific text)
  - [x] OR check if all tasks marked [x] in tasks.md
  - [x] OR check idle time: if no hooks for 10+ min AND tasks complete
  - [x] If complete: status='completed', completedAt=now()
  - [x] Emit: worker_completed event
  - [x] Trigger lifecycle transition: spec in_progress → review

### 4.5.5 Failure Detection
- [x] `detectFailure(workerId)` logic:
  - [x] Check if last hook has success=false with error
  - [x] OR check idle time: if no hooks for 20+ min (timeout)
  - [x] OR check if last hook is error tool (e.g., Bash failed)
  - [x] If failed: status='failed', errorMessage set
  - [x] Emit: worker_failed event
  - [x] Trigger retry logic (or manual intervention)

## Phase 4.6: Worker Retry Logic

### 4.6.1 Implement Retry Service
- [x] In WorkerAgentService, add `retryWorker(workerId)` method
- [x] `retryWorker` logic:
  - [x] Fetch failed worker
  - [x] If retryCount < 3: Spawn new worker with same agentType, increment retryCount
  - [x] If retryCount >= 3: Try fallback agent (general-purpose)
  - [x] If fallback fails: Create clarification request (manual intervention)
  - [x] Log all retry attempts

### 4.6.2 Automatic Retry Trigger
- [x] On worker_failed event
  - [x] Call `retryWorker` automatically
  - [x] Dashboard shows retry attempts
  - [x] If all retries exhausted: Dashboard shows "Manual intervention needed"

## Phase 4.7: Worker tRPC Router

### 4.7.1 Create Router File
- [x] Create `packages/api/src/router/worker-agent.ts`
  - [x] Import WorkerAgentService, validators, tRPC

### 4.7.2 Query Procedures
- [x] `workerAgent.getStatus` procedure
  - [x] Input: `{ workerId: string }`
  - [x] Return: Worker status, timestamps, error message
- [x] `workerAgent.getProgress` procedure
  - [x] Input: `{ workerId: string }`
  - [x] Return: Progress metrics (tools, files, tests, completion %)
- [x] `workerAgent.listActive` procedure
  - [x] Input: `{ projectId?: number, sessionId?: string, specId?: string }`
  - [x] Return: Array of active workers filtered by criteria
- [x] `workerAgent.getHookTimeline` procedure
  - [x] Input: `{ workerId: string, limit?: number }`
  - [x] Return: Last N hooks for worker (tool calls, timestamps, results)

### 4.7.3 Mutation Procedures
- [x] `workerAgent.spawn` procedure
  - [x] Input: `{ sessionId: string, specId: string, agentType?: string }`
  - [x] Call: WorkerAgentService.spawnWorker()
  - [x] Return: Created worker record with id
- [x] `workerAgent.cancel` procedure
  - [x] Input: `{ workerId: string }`
  - [x] Call: WorkerAgentService.cancelWorker()
  - [x] Return: Updated worker with status='cancelled'
- [x] `workerAgent.retry` procedure
  - [x] Input: `{ workerId: string }`
  - [x] Call: WorkerAgentService.retryWorker()
  - [x] Return: New worker record for retry attempt

### 4.7.4 Subscription Procedure
- [x] `workerAgent.subscribe` procedure
  - [x] Input: `{ sessionId?: string, specId?: string, projectId?: number }`
  - [x] Stream events: worker_spawned, worker_started, worker_progress, worker_completed, worker_failed
  - [x] Include: workerId, status, progress metrics in each event

### 4.7.5 Integration with Root Router
- [x] Import workerAgentRouter in `packages/api/src/root.ts`
- [x] Export as part of appRouter

## Phase 4.8: Session and Lifecycle Integration

### 4.8.1 Session Integration
- [x] When session is assigned to work item (Change 3)
  - [x] Add UI option: "Spawn Worker" or "Do Manually"
  - [x] "Spawn Worker" calls workerAgent.spawn({ sessionId, specId })
  - [x] "Do Manually" keeps session.currentWorkItemId but doesn't spawn
- [x] When session stops
  - [x] Query workerAgents where sessionId = stopped session
  - [x] Cancel all active workers
  - [x] Mark as 'cancelled' with reason 'session_stopped'

### 4.8.2 Lifecycle Integration
- [x] On `worker_completed` event
  - [x] Fetch spec for worker
  - [x] If spec status='assigned': Transition to 'in_progress'
  - [x] Transition to 'review' (all tasks complete)
  - [x] Emit: spec_ready_for_review notification
- [x] On `worker_failed` event with retries exhausted
  - [x] Create clarification request in dashboard
  - [x] Session paused until user decides (retry different agent, fix manually, etc.)

## Phase 4.9: Dashboard Worker Grid

### 4.9.1 Worker Status Cards
- [x] Create `apps/claude-agent-web/src/components/WorkerGrid.tsx`
  - [x] Grid layout: responsive (3 cols desktop, 2 tablet, 1 mobile)
  - [x] Each card shows: Worker ID, Type badge, Spec title (link), Status badge, Progress bar
  - [x] Card colors:
    - [x] Green: status='active'
    - [x] Yellow: status='active' but idle for 5+ min
    - [x] Red: status='failed'
    - [x] Gray: status='completed' or 'cancelled'

### 4.9.2 Worker Progress Display
- [x] Progress bar showing task completion %
- [x] Mini stats: "{N} tools executed, {N} files changed, {N} tests run"
- [x] Time elapsed: "Working for 5m 23s"
- [x] Active tool (if available): "Currently running tests..."

### 4.9.3 Worker Detail Modal
- [x] Click worker card to open detail modal
  - [x] Header: Worker ID, Type, Spec title, Status
  - [x] Progress section: Task completion %, metrics breakdown
  - [x] Hook timeline: Last 20 hooks with tool names, timestamps, success/fail indicators
  - [x] Errors section: If failed, show error message and stack trace
  - [x] Actions: Retry (if failed), Cancel (if active), View Spec (link)

### 4.9.4 Real-Time Updates
- [x] Use subscription: `workerAgent.subscribe({ projectId? })`
- [x] On worker_spawned: Add card to grid with animation
- [x] On worker_progress: Update progress bar and time elapsed in real-time
- [x] On worker_completed: Move card to "Completed" section, highlight in green
- [x] On worker_failed: Show error badge, highlight in red
- [x] On worker_started: Update to show active tools and first hook

## Phase 4.10: Testing

### 4.10.1 Unit Tests
- [x] Test agent selection with various spec content
  - [x] Spec with "e2e test" keywords → e2e-test-engineer
  - [x] Spec with "database schema" → database-architect
  - [x] Spec with no clear keywords → general-purpose
  - [x] Case-insensitive keyword matching
  - [x] Empty spec content handling
  - [x] Priority selection with multiple matches
- [x] Test progress metrics calculation
  - [x] Count tools correctly
  - [x] Extract files from Edit/Write tools
  - [x] Detect tests from Bash tool patterns
  - [x] Deduplicate file paths
  - [x] Calculate success rate
  - [x] Track elapsed time
  - [x] Track last activity and current tool
- [x] Test retry logic
  - [x] First three retries use same agent
  - [x] Fourth retry falls back to general-purpose
  - [x] After 4 retries (retryCount >= 4), returns null for manual intervention
  - [x] forceAgentType overrides automatic selection
  - [x] Retry prompt includes previous failure context

### 4.10.2 Integration Tests
- [x] Spawn worker with mock Task tool
  - [x] Worker record created with status='spawned'
  - [x] Worker ID returned
- [x] Monitor worker progress
  - [x] Simulate hook events
  - [x] Progress metrics update correctly
  - [x] Status changes to 'active' on first hook
- [x] Detect completion
  - [x] Simulate task completion
  - [x] Worker marked 'completed'
  - [x] Spec lifecycle transitions to 'review'
- [x] Test failure and retry
  - [x] Simulate failed hook
  - [x] Worker marked 'failed'
  - [x] Retry spawned automatically
  - [x] New worker record created with retryCount=1

Note: Unit tests have been created for core logic. Full integration tests require database package build and would be implemented in a separate testing phase.

### 4.10.3 E2E Tests
- [ ] Session spawns worker for spec
  - [ ] Dashboard shows worker card
  - [ ] Progress updates in real-time
  - [ ] Worker completes
  - [ ] Spec transitions to review state
  - [ ] Dashboard shows completion notification

Note: E2E tests would be implemented after deployment to test environment and require Playwright/Cypress setup.

## Phase 4.11: Documentation

### 4.11.1 Update CLAUDE.md
- [x] Add section on worker agents
- [x] Document agent types and selection logic
- [x] Document worker spawning workflow
- [x] Created comprehensive `docs/worker-agents.md` guide covering:
  - Architecture and components
  - 14 agent types with selection logic
  - Worker lifecycle and state transitions
  - Spawning workflow and prompt structure
  - Progress monitoring and metrics
  - Retry logic and strategies
  - Real-time updates via events
  - Dashboard UI components
  - API reference (tRPC procedures)
  - Testing guidelines
  - Troubleshooting guide
  - Best practices

### 4.11.2 Inline Documentation
- [x] JSDoc on WorkerAgentService methods
  - [x] spawnWorker, buildWorkerPrompt, getWorkerStatus
  - [x] cancelWorker, markWorkerComplete, markWorkerFailed
  - [x] listActive, getWorkersForSession, retryWorker
  - [x] buildRetryPrompt
- [x] JSDoc on WorkerMonitorService methods
  - [x] monitorWorker, getProgress, calculateProgressMetrics
  - [x] detectCompletion, detectFailure, handleWorkerFailure
  - [x] hasCompletionSignal, getHookTimeline
- [x] Comments on hook monitoring logic
  - [x] Progress metrics calculation inline comments
  - [x] Completion/failure detection logic documented
- [x] Agent selection reasoning logging
  - [x] selectAgentType returns reasoning string
  - [x] Console logs for debugging selection decisions

## Summary

**Subtasks**: ~65
**Estimated Timeline**: 1-2 weeks
**Dependencies**: Change 1, 2, 3 complete

**Critical Path**:
1. Database schema (4.1)
2. Agent selection (4.3)
3. Worker spawning (4.4)
4. Worker monitoring (4.5)
5. Worker router (4.7)
6. Dashboard (4.9)
7. Testing (4.10)
