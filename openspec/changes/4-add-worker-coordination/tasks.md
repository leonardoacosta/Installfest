# Implementation Tasks: Worker Coordination and Progress Monitoring

## Phase 4.1: Worker Agent Database Schema

### 4.1.1 Worker Agents Table
- [ ] Create `workerAgents` table in `packages/db/src/schema/worker-agents.ts`
  - [ ] Add id (text, primary key - Task tool agent ID)
  - [ ] Add sessionId (foreign key to sessions - who spawned this)
  - [ ] Add specId (foreign key to openspecSpecs - what are they working on)
  - [ ] Add agentType (text - subagent_type: t3-stack-developer, e2e-test-engineer, etc.)
  - [ ] Add status enum: 'spawned' | 'active' | 'completed' | 'failed' | 'cancelled'
  - [ ] Add spawnedAt, startedAt (nullable), completedAt (nullable) timestamps
  - [ ] Add result (JSON text - {filesChanged: [], testsRun, testsPassed, errors})
  - [ ] Add retryCount (integer, default 0)
  - [ ] Add errorMessage (nullable text, if failed)
  - [ ] Add indexes: (sessionId), (specId), (status), (spawnedAt)

### 4.1.2 Schema Export and Migration
- [ ] Export workerAgents schema from `packages/db/src/schema/index.ts`
- [ ] Run migrations to create table

## Phase 4.2: Zod Validators

### 4.2.1 Worker Agent Validators
- [ ] Create `packages/validators/src/worker-agent.ts`
  - [ ] `workerAgentConfigSchema` - Spawn request (sessionId, specId, agentType?)
  - [ ] `workerAgentStatusSchema` - Status response
  - [ ] `workerAgentProgressSchema` - Progress metrics
  - [ ] `agentTypeEnum` - Valid agent types

### 4.2.2 Validation Testing
- [ ] Test validators with valid/invalid inputs

## Phase 4.3: Agent Selection Service

### 4.3.1 Create Agent Selection Logic
- [ ] Create `packages/api/src/services/worker-selector.ts`
  - [ ] `selectAgentType(spec)` - Analyze spec and return best agentType
  - [ ] Extract content from proposal.md, tasks.md, design.md
  - [ ] Search for keywords in content:
    - [ ] tRPC/Better-T-Stack/TypeScript → `t3-stack-developer`
    - [ ] test/e2e/playwright/vitest → `e2e-test-engineer`
    - [ ] database/schema/migration/drizzle/SQL → `database-architect`
    - [ ] UI/component/design/React/CSS → `ux-design-specialist`
    - [ ] docker/compose/container/network → `docker-network-architect`
    - [ ] cache/redis/upstash/performance → `redis-cache-architect`
  - [ ] Fallback: `general-purpose` if no clear keywords
  - [ ] Return: { agentType, confidence, reasoning }
  - [ ] Log reasoning for debugging

### 4.3.2 Keyword Matching
- [ ] Create keyword mapping object
  - [ ] Case-insensitive matching
  - [ ] Support partial matches (e.g., "playwright" contains "test")
- [ ] Test with sample spec content

## Phase 4.4: Worker Spawning Service

### 4.4.1 Create WorkerAgentService
- [ ] Create `packages/api/src/services/worker-agent.ts`
  - [ ] Constructor accepts DB client and workerSelector
  - [ ] `spawnWorker(sessionId, specId, agentType?)` - Main spawn method
  - [ ] `buildWorkerPrompt(spec, agentType)` - Construct Task tool prompt
  - [ ] `getWorkerStatus(workerId)` - Query current status
  - [ ] `cancelWorker(workerId)` - Stop worker
  - [ ] `markWorkerComplete(workerId, result)` - Record completion

### 4.4.2 Prompt Building
- [ ] `buildWorkerPrompt(spec, agentType)` should include:
  - [ ] Spec title and ID
  - [ ] Full "Why" section from proposal.md
  - [ ] "What Changes" section
  - [ ] Full tasks.md list (work items)
  - [ ] Project path and key file paths
  - [ ] "Complete all tasks marked [ ], update their status to [x], report when done"
  - [ ] "If you encounter errors, report them clearly"
  - [ ] Clear, step-by-step instructions

### 4.4.3 Task Tool Integration
- [ ] Create `packages/api/src/utils/task-tool.ts`
  - [ ] `callTaskTool(subagent_type, prompt, description)` - Call Task tool
  - [ ] Return: agent_id (for tracking)
  - [ ] Handle errors: tool unavailable, invalid agent type, network errors

### 4.4.4 Spawning Implementation
- [ ] In `spawnWorker`:
  - [ ] Validate session exists and currentWorkItemId matches specId
  - [ ] Select agent type if not specified
  - [ ] Build worker prompt
  - [ ] Call Task tool to spawn agent
  - [ ] Create workerAgents table entry with status='spawned'
  - [ ] Set spawnedAt timestamp
  - [ ] Return created worker record
  - [ ] Emit subscription event: worker_spawned

## Phase 4.5: Worker Monitoring Service

### 4.5.1 Create WorkerMonitorService
- [ ] Create `packages/api/src/services/worker-monitor.ts`
  - [ ] `monitorWorker(workerId)` - Start continuous monitoring
  - [ ] `getProgress(workerId)` - Return current progress metrics
  - [ ] `detectCompletion(workerId)` - Check if worker finished
  - [ ] `detectFailure(workerId)` - Check if worker failed

### 4.5.2 Progress Tracking via Hooks
- [ ] On first hook for worker session → status='active', startedAt=now()
- [ ] For each hook event:
  - [ ] Extract: tool_name, success, duration_ms
  - [ ] If tool is Edit/Write → Track file changes
  - [ ] If tool is Bash with test pattern → Track test execution
  - [ ] Accumulate metrics
- [ ] Query latest 50 hooks for worker session for timeline view

### 4.5.3 Progress Metrics Calculation
- [ ] `getProgress(workerId)` should return:
  - [ ] `toolsExecuted` - Count of hook events
  - [ ] `successRate` - % of successful hooks
  - [ ] `filesChanged` - Array of file paths from Edit/Write tools
  - [ ] `testsRun` - Count of detected test executions
  - [ ] `elapsedMs` - completedAt - spawnedAt
  - [ ] `taskCompletion` - Parse latest tasks.md, count [x] vs [ ]
  - [ ] `status` - Current status
  - [ ] `statusChangedAt` - Last status change timestamp

### 4.5.4 Completion Detection
- [ ] `detectCompletion(workerId)` logic:
  - [ ] Check if last hook has completion signal (specific text)
  - [ ] OR check if all tasks marked [x] in tasks.md
  - [ ] OR check idle time: if no hooks for 10+ min AND tasks complete
  - [ ] If complete: status='completed', completedAt=now()
  - [ ] Emit: worker_completed event
  - [ ] Trigger lifecycle transition: spec in_progress → review

### 4.5.5 Failure Detection
- [ ] `detectFailure(workerId)` logic:
  - [ ] Check if last hook has success=false with error
  - [ ] OR check idle time: if no hooks for 20+ min (timeout)
  - [ ] OR check if last hook is error tool (e.g., Bash failed)
  - [ ] If failed: status='failed', errorMessage set
  - [ ] Emit: worker_failed event
  - [ ] Trigger retry logic (or manual intervention)

## Phase 4.6: Worker Retry Logic

### 4.6.1 Implement Retry Service
- [ ] In WorkerAgentService, add `retryWorker(workerId)` method
- [ ] `retryWorker` logic:
  - [ ] Fetch failed worker
  - [ ] If retryCount < 3: Spawn new worker with same agentType, increment retryCount
  - [ ] If retryCount >= 3: Try fallback agent (general-purpose)
  - [ ] If fallback fails: Create clarification request (manual intervention)
  - [ ] Log all retry attempts

### 4.6.2 Automatic Retry Trigger
- [ ] On worker_failed event
  - [ ] Call `retryWorker` automatically
  - [ ] Dashboard shows retry attempts
  - [ ] If all retries exhausted: Dashboard shows "Manual intervention needed"

## Phase 4.7: Worker tRPC Router

### 4.7.1 Create Router File
- [ ] Create `packages/api/src/router/worker-agent.ts`
  - [ ] Import WorkerAgentService, validators, tRPC

### 4.7.2 Query Procedures
- [ ] `workerAgent.getStatus` procedure
  - [ ] Input: `{ workerId: string }`
  - [ ] Return: Worker status, timestamps, error message
- [ ] `workerAgent.getProgress` procedure
  - [ ] Input: `{ workerId: string }`
  - [ ] Return: Progress metrics (tools, files, tests, completion %)
- [ ] `workerAgent.listActive` procedure
  - [ ] Input: `{ projectId?: number, sessionId?: string, specId?: string }`
  - [ ] Return: Array of active workers filtered by criteria
- [ ] `workerAgent.getHookTimeline` procedure
  - [ ] Input: `{ workerId: string, limit?: number }`
  - [ ] Return: Last N hooks for worker (tool calls, timestamps, results)

### 4.7.3 Mutation Procedures
- [ ] `workerAgent.spawn` procedure
  - [ ] Input: `{ sessionId: string, specId: string, agentType?: string }`
  - [ ] Call: WorkerAgentService.spawnWorker()
  - [ ] Return: Created worker record with id
- [ ] `workerAgent.cancel` procedure
  - [ ] Input: `{ workerId: string }`
  - [ ] Call: WorkerAgentService.cancelWorker()
  - [ ] Return: Updated worker with status='cancelled'
- [ ] `workerAgent.retry` procedure
  - [ ] Input: `{ workerId: string }`
  - [ ] Call: WorkerAgentService.retryWorker()
  - [ ] Return: New worker record for retry attempt

### 4.7.4 Subscription Procedure
- [ ] `workerAgent.subscribe` procedure
  - [ ] Input: `{ sessionId?: string, specId?: string, projectId?: number }`
  - [ ] Stream events: worker_spawned, worker_started, worker_progress, worker_completed, worker_failed
  - [ ] Include: workerId, status, progress metrics in each event

### 4.7.5 Integration with Root Router
- [ ] Import workerAgentRouter in `packages/api/src/root.ts`
- [ ] Export as part of appRouter

## Phase 4.8: Session and Lifecycle Integration

### 4.8.1 Session Integration
- [ ] When session is assigned to work item (Change 3)
  - [ ] Add UI option: "Spawn Worker" or "Do Manually"
  - [ ] "Spawn Worker" calls workerAgent.spawn({ sessionId, specId })
  - [ ] "Do Manually" keeps session.currentWorkItemId but doesn't spawn
- [ ] When session stops
  - [ ] Query workerAgents where sessionId = stopped session
  - [ ] Cancel all active workers
  - [ ] Mark as 'cancelled' with reason 'session_stopped'

### 4.8.2 Lifecycle Integration
- [ ] On `worker_completed` event
  - [ ] Fetch spec for worker
  - [ ] If spec status='assigned': Transition to 'in_progress'
  - [ ] Transition to 'review' (all tasks complete)
  - [ ] Emit: spec_ready_for_review notification
- [ ] On `worker_failed` event with retries exhausted
  - [ ] Create clarification request in dashboard
  - [ ] Session paused until user decides (retry different agent, fix manually, etc.)

## Phase 4.9: Dashboard Worker Grid

### 4.9.1 Worker Status Cards
- [ ] Create `apps/claude-agent-web/src/components/WorkerGrid.tsx`
  - [ ] Grid layout: responsive (3 cols desktop, 2 tablet, 1 mobile)
  - [ ] Each card shows: Worker ID, Type badge, Spec title (link), Status badge, Progress bar
  - [ ] Card colors:
    - [ ] Green: status='active'
    - [ ] Yellow: status='active' but idle for 5+ min
    - [ ] Red: status='failed'
    - [ ] Gray: status='completed' or 'cancelled'

### 4.9.2 Worker Progress Display
- [ ] Progress bar showing task completion %
- [ ] Mini stats: "{N} tools executed, {N} files changed, {N} tests run"
- [ ] Time elapsed: "Working for 5m 23s"
- [ ] Active tool (if available): "Currently running tests..."

### 4.9.3 Worker Detail Modal
- [ ] Click worker card to open detail modal
  - [ ] Header: Worker ID, Type, Spec title, Status
  - [ ] Progress section: Task completion %, metrics breakdown
  - [ ] Hook timeline: Last 20 hooks with tool names, timestamps, success/fail indicators
  - [ ] Errors section: If failed, show error message and stack trace
  - [ ] Actions: Retry (if failed), Cancel (if active), View Spec (link)

### 4.9.4 Real-Time Updates
- [ ] Use subscription: `workerAgent.subscribe({ projectId? })`
- [ ] On worker_spawned: Add card to grid with animation
- [ ] On worker_progress: Update progress bar and time elapsed in real-time
- [ ] On worker_completed: Move card to "Completed" section, highlight in green
- [ ] On worker_failed: Show error badge, highlight in red
- [ ] On worker_started: Update to show active tools and first hook

## Phase 4.10: Testing

### 4.10.1 Unit Tests
- [ ] Test agent selection with various spec content
  - [ ] Spec with "e2e test" keywords → e2e-test-engineer
  - [ ] Spec with "database schema" → database-architect
  - [ ] Spec with no clear keywords → general-purpose
- [ ] Test progress metrics calculation
  - [ ] Count tools correctly
  - [ ] Extract files from Edit/Write tools
  - [ ] Detect tests from Bash tool patterns
  - [ ] Calculate task completion % from tasks.md
- [ ] Test retry logic
  - [ ] First retry uses same agent
  - [ ] Second retry tries fallback agent
  - [ ] After 3 retries, requests manual intervention

### 4.10.2 Integration Tests
- [ ] Spawn worker with mock Task tool
  - [ ] Worker record created with status='spawned'
  - [ ] Worker ID returned
- [ ] Monitor worker progress
  - [ ] Simulate hook events
  - [ ] Progress metrics update correctly
  - [ ] Status changes to 'active' on first hook
- [ ] Detect completion
  - [ ] Simulate task completion
  - [ ] Worker marked 'completed'
  - [ ] Spec lifecycle transitions to 'review'
- [ ] Test failure and retry
  - [ ] Simulate failed hook
  - [ ] Worker marked 'failed'
  - [ ] Retry spawned automatically
  - [ ] New worker record created with retryCount=1

### 4.10.3 E2E Tests
- [ ] Session spawns worker for spec
  - [ ] Dashboard shows worker card
  - [ ] Progress updates in real-time
  - [ ] Worker completes
  - [ ] Spec transitions to review state
  - [ ] Dashboard shows completion notification

## Phase 4.11: Documentation

### 4.11.1 Update CLAUDE.md
- [ ] Add section on worker agents
- [ ] Document agent types and selection logic
- [ ] Document worker spawning workflow

### 4.11.2 Inline Documentation
- [ ] JSDoc on WorkerAgentService methods
- [ ] Comments on hook monitoring logic
- [ ] Agent selection reasoning logging

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
