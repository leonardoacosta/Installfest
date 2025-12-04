## ADDED Requirements

### Requirement: Worker Agent Spawning via Task Tool
The system SHALL allow sessions to spawn specialized worker agents for implementation work.

#### Scenario: Spawn worker from session
- **WHEN** session is assigned to work queue item
- **THEN** session can call workerAgent.spawn({ specId, agentType? })
- **AND** system selects best agentType based on spec content if not specified
- **AND** Task tool is called with constructed prompt
- **AND** worker is recorded in workerAgents table with status='spawned'
- **AND** spawnedAt timestamp is set to current time

#### Scenario: Task tool invocation with agent type
- **WHEN** workerAgent.spawn is called
- **THEN** Task tool is invoked with:
  - **subagent_type**: Selected agent type (e.g., 't3-stack-developer')
  - **prompt**: Includes spec title, why section, what changes, tasks list, instructions
  - **description**: Human-readable description of work (e.g., "Implement {SpecTitle}")
- **AND** system waits for Task tool to return agent_id
- **AND** agent_id is stored in workerAgents.id

### Requirement: Agent Type Selection Algorithm
The system SHALL select appropriate agent types based on spec content analysis.

#### Scenario: Select agent by keyword matching
- **WHEN** spec is analyzed for agent selection
- **THEN** system extracts keywords from proposal.md, tasks.md, design.md
- **AND** keywords are matched against agent type profiles:
  - tRPC/Better-T-Stack/TypeScript → `t3-stack-developer`
  - test/e2e/playwright/vitest → `e2e-test-engineer`
  - database/schema/migration/drizzle/SQL → `database-architect`
  - UI/component/design/React/CSS → `ux-design-specialist`
  - docker/compose/container/network → `docker-network-architect`
  - cache/redis/upstash/performance → `redis-cache-architect`
- **AND** highest-confidence match is selected
- **AND** if no clear match: fallback to `general-purpose`
- **AND** selection reasoning is logged for debugging

#### Scenario: Override agent selection
- **WHEN** workerAgent.spawn is called with explicit agentType
- **THEN** specified agentType is used instead of auto-selected
- **AND** no auto-selection logic runs

### Requirement: Worker Progress Tracking
The system SHALL monitor worker progress through hook events.

#### Scenario: Detect worker activation
- **WHEN** first hook event is recorded for worker session
- **THEN** workerAgents.status changes from 'spawned' to 'active'
- **AND** workerAgents.startedAt is set to current timestamp
- **AND** subscription event worker_started is emitted

#### Scenario: Track tool execution
- **WHEN** hooks are recorded for worker session
- **THEN** system counts hook events (tools executed)
- **AND** success rate is calculated (successful tools / total tools * 100)
- **AND** worker_progress event is emitted with updated metrics

#### Scenario: Detect file changes
- **WHEN** worker executes Edit or Write tools
- **THEN** file paths are extracted from tool calls
- **AND** filesChanged array is accumulated in worker monitoring
- **AND** progress includes "N files changed" metric

#### Scenario: Detect test execution
- **WHEN** worker executes Bash tool with pattern (npm test, pytest, vitest, etc.)
- **THEN** test execution is detected and counted
- **AND** testsRun counter is incremented
- **AND** if Bash tool includes "passed", testsPassed is incremented

### Requirement: Completion Detection
The system SHALL automatically detect when workers finish their work.

#### Scenario: Completion by task checkbox
- **WHEN** tasks.md is updated with all tasks marked [x]
- **THEN** system detects completion (parse tasks.md)
- **AND** workerAgents.status is set to 'completed'
- **AND** workerAgents.completedAt is set to current timestamp
- **AND** worker_completed event is emitted

#### Scenario: Completion by idle time
- **WHEN** worker has no hook events for 10+ minutes AND all tasks marked [x]
- **THEN** system assumes work is complete
- **AND** workerAgents.status is set to 'completed'
- **AND** worker_completed event is emitted

#### Scenario: Explicit completion
- **WHEN** session stops or calls workerAgent.complete endpoint
- **THEN** if tasks are marked complete, mark worker 'completed'
- **AND** worker_completed event is emitted

### Requirement: Failure Detection and Retry
The system SHALL detect worker failures and retry with appropriate logic.

#### Scenario: Detect worker failure
- **WHEN** hook event has success=false with error message
- **THEN** workerAgents.status is set to 'failed'
- **AND** workerAgents.errorMessage is populated
- **AND** worker_failed event is emitted

#### Scenario: Retry with same agent
- **WHEN** worker status='failed' AND retryCount < 3
- **THEN** system automatically spawns new worker with same agentType
- **AND** new worker record created with same specId, retryCount incremented
- **AND** previous worker remains in failed state for reference

#### Scenario: Fallback to different agent
- **WHEN** retries with same agent fail 3 times
- **THEN** system spawns new worker with fallback agentType (general-purpose)
- **AND** fallback attempt is tracked in worker records

#### Scenario: Manual intervention on all retries exhausted
- **WHEN** all retry attempts exhausted without success
- **THEN** dashboard shows "Manual intervention needed" for spec
- **AND** clarification is created, requesting user guidance

### Requirement: Worker Progress Metrics
The system SHALL provide detailed progress information about active workers.

#### Scenario: Query worker progress
- **WHEN** workerAgent.getProgress({ workerId }) is called
- **THEN** returns:
  - `toolsExecuted`: Count of hook events
  - `successRate`: Percentage of successful hooks
  - `filesChanged`: Array of file paths modified
  - `testsRun`: Count of detected test executions
  - `testsPassed`: Count of passing tests (if detectable)
  - `elapsedMs`: Time since startedAt
  - `taskCompletion`: Percentage of tasks marked [x]
  - `status`: Current status
- **AND** all metrics are real-time from latest hook events

#### Scenario: Query hook timeline
- **WHEN** workerAgent.getHookTimeline({ workerId }) is called
- **THEN** returns last N hook events for worker session
- **AND** each hook includes: timestamp, tool_name, success, duration_ms, summary
- **AND** events ordered chronologically (newest last)

### Requirement: Session-to-Worker Relationship
The system SHALL track which workers are spawned by which sessions.

#### Scenario: Record worker parent session
- **WHEN** worker is spawned
- **THEN** workerAgents.sessionId is set to spawning session
- **AND** session detail view can query all workers spawned by that session
- **AND** when session stops, all spawned workers can be cancelled

#### Scenario: Worker list for session
- **WHEN** workerAgent.listActive({ sessionId }) is called
- **THEN** returns all active workers spawned by that session
- **AND** includes progress metrics for each worker

### Requirement: Real-Time Worker Events
The system SHALL stream worker state changes to connected clients.

#### Scenario: Subscribe to worker events
- **WHEN** client calls workerAgent.subscribe({ projectId? })
- **THEN** server streams events for that project's workers
- **AND** event types: worker_spawned, worker_started, worker_progress, worker_completed, worker_failed
- **AND** each event includes: workerId, status, specId, metrics

#### Scenario: Worker spawned event
- **WHEN** new worker is spawned
- **THEN** subscription event includes: workerId, specId, agentType, spawnedAt
- **AND** clients can add worker card to grid immediately

#### Scenario: Worker progress event
- **WHEN** hook events are recorded for active worker
- **THEN** subscription event includes: updated metrics (tools, files, tests, completion %)
- **AND** clients update progress bar and time elapsed in real-time

### Requirement: Worker Dashboard Grid
The system SHALL display active workers in a visual grid format.

#### Scenario: Display worker cards
- **WHEN** user views dashboard with active workers
- **THEN** each worker is shown as a card with:
  - Worker ID, Agent type badge, Spec title (linked), Status badge, Progress bar
  - Mini metrics: "N tools, N files, N tests"
  - Time elapsed
  - Last active timestamp
- **AND** cards grouped by status (Active, Idle, Failed, Completed)
- **AND** layout is responsive (3 cols desktop, 2 tablet, 1 mobile)

#### Scenario: Open worker detail modal
- **WHEN** user clicks worker card
- **THEN** modal shows:
  - Detailed progress metrics (tools, files, tests, task completion %)
  - Hook timeline (last 20 hook events)
  - If failed: error message and stack trace
  - Actions: Retry (if failed), Cancel (if active), View Spec (link)

#### Scenario: Real-time worker grid updates
- **WHEN** worker events are emitted
- **THEN** dashboard updates worker cards:
  - On worker_started: Show active status with green indicator
  - On worker_progress: Update metrics and time elapsed
  - On worker_completed: Move to completed section with green highlight
  - On worker_failed: Show error badge with red highlight
  - On worker_spawned: Add new card to grid with animation

## MODIFIED Requirements

### Requirement: Session Work Item Assignment
Sessions SHALL support spawning workers for assigned work items.

#### Scenario: Session options after assignment
- **WHEN** session is assigned to work queue item
- **THEN** session can:
  - **Spawn worker**: Call workerAgent.spawn to delegate work
  - **Work manually**: Implement directly in session without spawning
  - Both approaches update spec lifecycle when complete

#### Scenario: Spawn worker flow
- **WHEN** user clicks "Spawn Worker" for assigned work item
- **THEN** system calls agent selection
- **AND** spawns worker with selected agentType
- **AND** dashboard shows worker card
- **AND** work item status changes to 'assigned' (worker working)

### Requirement: Spec Lifecycle Auto-Transitions
Specs SHALL automatically transition to 'review' when worker completes.

#### Scenario: Auto-transition on worker completion
- **WHEN** worker_completed event is emitted
- **THEN** find associated spec
- **AND** if spec status='assigned': transition to 'in_progress'
- **AND** transition to 'review' (all tasks complete from worker work)
- **AND** emit: spec_ready_for_review notification

#### Scenario: Auto-transition on worker failure
- **WHEN** worker_failed event is emitted and all retries exhausted
- **THEN** create clarification: "Worker failed after X retries, need manual decision"
- **AND** session paused, waiting for user response
