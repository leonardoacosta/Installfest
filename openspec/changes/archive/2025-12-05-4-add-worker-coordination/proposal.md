# Change: Add Worker Coordination and Progress Monitoring

## Why

Change 3 added work queue management with manual session coordination, but sessions have no way to spawn worker agents for specialized tasks. This creates a bottleneck: users must do all implementation work themselves, unable to delegate to specialized subagents.

By adding worker coordination capabilities, the Claude agent service becomes capable of:
- **Master Agent Spawning**: Sessions can spawn focused worker agents via Task tool for specialized work (e2e tests, database schema, UI components, etc.)
- **Worker Progress Tracking**: Monitor active workers via hooks, track tool usage and success rates
- **Session-to-Worker Linking**: Track which session spawned which workers and what work they're doing
- **Progress Metrics**: Real-time visibility into: tools executed, files changed, tests run, completion percentage
- **Completion Detection**: Automatically detect when workers finish and update spec lifecycle

This change focuses on **programmatic spawning via Task tool** - sessions explicitly call "spawn worker for this spec" instead of users manually starting another session.

## What Changes

### Worker Agent Tracking

- **New Table**: `workerAgents` tracks spawned worker agents
  - Fields: id, sessionId (spawner), specId, agentType (text - task tool subagent_type)
  - Status: 'spawned' | 'active' | 'completed' | 'failed' | 'cancelled'
  - Timestamps: spawnedAt, startedAt (nullable), completedAt (nullable)
  - Result: JSON field storing completion summary (files, tests, errors)
  - RetryCount: integer for failure retries
- **Foreign Keys**: sessionId → sessions, specId → openspecSpecs

### Agent Selection Logic

- **WorkerAgentService**: Analyzes spec content to select best subagent_type
  - Extract keywords from proposal + tasks + design (if exists)
  - Match keywords to agent types:
    - tRPC/Better-T-Stack/TypeScript → `t3-stack-developer`
    - test/e2e/playwright/vitest → `e2e-test-engineer`
    - database/schema/migration/drizzle → `database-architect`
    - UI/component/design/React → `ux-design-specialist`
    - docker/compose/container/networking → `docker-network-architect`
    - cache/redis/upstash/performance → `redis-cache-architect`
  - Fallback: `general-purpose` if no clear match
  - Log selection reasoning for debugging

### Worker Spawning via Task Tool

- **Session Integration**: When session is assigned to work item
  - Session has authority to call WorkerAgentService.spawnWorker()
  - Service calls Task tool with constructed prompt
  - Record worker in workerAgents table with status='spawned'
- **Prompt Construction**:
  - Include spec title, why section, what changes
  - Include tasks.md list (work items for worker)
  - Include file paths (generated from project structure)
  - Include: "Complete all tasks, update tasks.md checkbox status, report when done"
  - Format as clear, actionable instructions

### Worker Progress Monitoring

- **Hook-Based Detection**: Query hooks table for worker activity
  - On first hook event for worker session → status='active', set startedAt
  - Track: tool_name, success, duration for each hook
  - Accumulate: total_tools_used, successful_tools, files_changed
- **Progress Metrics**:
  - Tools executed (count + success rate)
  - Files modified (extracted from Edit/Write tool calls)
  - Tests run (detect via Bash tool with test patterns)
  - Time elapsed (completedAt - spawnedAt)
  - Tasks completion (parse tasks.md for [x] vs [ ])
- **Completion Detection**:
  - Worker sends completion signal (final message or tool call)
  - All tasks.md marked [x]
  - No activity for 10+ minutes + tasks complete
  - Manual mark-as-complete via dashboard

### Worker Retry Logic

- **Retry on Failure**:
  - If worker status='failed' AND retryCount < 3 → retry with same agent
  - If retry fails 3x → try different agent type (fallback to general-purpose)
  - If all retries fail → request manual intervention (clarification)
- **Failure Detection**:
  - Worker reports error explicitly
  - Last hook has success=false with error message
  - No activity for 20+ minutes (timeout)

### tRPC Router Enhancements

- **New Routers**: `packages/api/src/router/worker-agent.ts`
  - `workerAgent.spawn({ sessionId, specId, agentType? })` - Spawn worker
  - `workerAgent.getStatus({ workerId })` - Current status + metrics
  - `workerAgent.getProgress({ workerId })` - Detailed progress (tools, files, tests)
  - `workerAgent.cancel({ workerId })` - Stop worker
  - `workerAgent.listActive({ projectId? })` - List running workers
  - `workerAgent.subscribe({ sessionId?, specId? })` - Stream worker events (worker_spawned, worker_started, worker_completed, worker_failed)

### Session Integration Hooks

- **Session-Spawned-Worker Relationship**:
  - sessions.currentWorkItemId → workQueue
  - workerAgents.sessionId → sessions (spawned by)
  - workerAgents.specId → openspecSpecs (working on)
  - Track parent→child relationship for orchestration
- **On Session Stop**: Cancel all spawned workers cleanly
- **On Worker Complete**: Update spec lifecycle automatically

### Dashboard Worker Grid

- **New UI Component**: Worker activity panel in sessions/dashboard
  - Shows: Worker ID, Type (badge), Spec (link), Status, Progress bar, Active Tools, Time Elapsed, Actions
  - Green card: active worker with progress
  - Yellow card: worker with idle period
  - Red card: failed worker
  - Gray card: completed/cancelled worker
- **Worker Detail Modal**: Click worker card to see
  - Full progress metrics (tools, files, tests)
  - Hook timeline (last 50 hooks)
  - Any errors or warnings
  - Retry options (if failed)

## Impact

### Affected Specs
- **worker-agent-management**: ADDED - Spec for worker spawning, selection, and monitoring
- **session-management**: MODIFIED - Add ability to spawn workers, track spawned workers
- **spec-lifecycle-management**: MODIFIED - Auto-transition from in_progress → review when worker completes
- **task-tool-integration**: ADDED - Integration with Task tool for subagent spawning

### Affected Code
- `homelab-services/packages/db/src/schema/worker-agents.ts` - NEW table schema
- `homelab-services/packages/api/src/services/worker-agent.ts` - NEW service class
- `homelab-services/packages/api/src/services/worker-monitor.ts` - NEW monitoring service
- `homelab-services/packages/api/src/services/worker-selector.ts` - NEW selection logic
- `homelab-services/packages/validators/src/worker-agent.ts` - NEW validators
- `homelab-services/packages/api/src/router/worker-agent.ts` - NEW tRPC router
- `homelab-services/apps/claude-agent-web/src/components/WorkerGrid.tsx` - NEW UI component
- `homelab-services/packages/api/src/utils/task-tool.ts` - NEW Task tool wrapper

### Dependencies
- **Existing**: Drizzle ORM, tRPC, Zod
- **New**: None (uses existing send_event hook infrastructure)
- **Prerequisite**: Change 1 (Sync), Change 2 (Lifecycle), Change 3 (Work Queue) must be complete

### Breaking Changes
None. Purely additive. Existing manual sessions continue working, worker spawning is opt-in.

## Acceptance Criteria

- [ ] Worker agents table created with schema as defined
- [ ] Agent selection algorithm correctly identifies spec requirements
- [ ] Worker spawning via Task tool works with mock/real agents
- [ ] Worker progress tracking detects tool execution and updates metrics
- [ ] Progress metrics calculated correctly (tools, files, tests, completion %)
- [ ] Completion detection triggers spec lifecycle transition to review
- [ ] Retry logic attempts same agent, then fallback agent
- [ ] Session-to-worker relationship tracked and queryable
- [ ] Worker activity grid displays active workers with real-time updates
- [ ] Worker subscription streams events correctly
- [ ] Tests pass (unit for service, integration for spawning/monitoring, E2E for full workflow)
