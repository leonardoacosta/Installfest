# Change: Integrate Product Management into Claude Agent Service

## Why

The Claude agent service currently manages development sessions and captures hook events, but lacks integration with OpenSpec for spec-driven development and doesn't interface with the Playwright server for automated error handling. This creates a gap where spec management and error triage happen outside the agent workflow, missing opportunities for intelligent automation and unified visibility.

By integrating OpenSpec bidirectional sync and Playwright error analysis, the Claude agent service becomes an **intelligent orchestration platform** with:
- **Master Agent per Project**: Persistent Claude Code session that manages work queue, spawns specialized worker agents, and coordinates implementation
- **Automated Spec Proposals**: All Playwright errors automatically converted to spec proposals for review and approval
- **Bidirectional Sync**: OpenSpec files (filesystem) ↔ Database for planning, queuing, and UI editing
- **Lifecycle Management**: 7-state spec workflow (proposing → approved → assigned → in_progress → review → applied → archived)
- **Specialized Worker Agents**: Master orchestrates Task tool agents (t3-stack-developer, e2e-test-engineer, etc.) for efficient execution
- **Unified Visibility**: Single dashboard showing all work items (specs + errors) across all projects

## What Changes

### OpenSpec Bidirectional Sync
- **Filesystem → Database**: Auto-detect OpenSpec files and sync to database
  - Immediate sync for queued specs (file watcher with chokidar)
  - Periodic sync for others (every 30 seconds)
  - Sync all specs including archived for complete history
- **Database → Filesystem**: UI edits write back to OpenSpec files
  - Conflict resolution: Filesystem always wins (source of truth)
  - Transaction safety: Validate before writing, rollback on failure
- **Sync Service**: Background service coordinates bidirectional sync
- Parse proposal.md, tasks.md, design.md, and spec delta files into structured DB schema
- Track sync status per spec (last_synced_at, sync_errors)

### Master Agent Orchestrator (Per Project)
- **Persistent Claude Code Session**: Long-running agent per project manages work queue
- **Work Queue Management**: Prioritizes and sequences work items (specs + errors)
- **Worker Agent Spawning**: Uses Task tool to spawn specialized agents:
  - `t3-stack-developer` for T3 Stack implementation
  - `e2e-test-engineer` for test fixes
  - `database-architect` for schema changes
  - `ux-design-specialist` for UI work
- **State Orchestration**: Moves specs through 7-state lifecycle automatically (except manual gates)
- **Clarification Protocol**: Pauses and sends dashboard notifications when decisions needed
- **Scheduled Reviews**: Wakes hourly to check queue for ready work
- **Session Continuity**: Resumes after pauses, maintains context across work items

### Playwright Error Automation
- Subscribe to new Playwright test failures from `testFailures` table
- Classify failures using existing classification logic (NEW, FLAKY, RECURRING, PERSISTENT)
- **Always create spec proposals** for ALL errors (no direct fixes)
- Auto-generate proposal.md content from error details:
  - Test name → Proposal title
  - Error message → Problem description
  - Stack trace → Technical context
  - Classification → Initial priority
- Add to project work queue in "proposing" state for master agent review

### Spec Lifecycle Management (7-State Workflow)
- **States**: `proposing` → `approved` → `assigned` → `in_progress` → `review` → `applied` → `archived`
- **Manual Gates** (require user approval):
  - `proposing` → `approved`: User reviews and approves spec proposal
  - `review` → `applied`: User confirms implementation complete and tests pass
- **Automatic Transitions**:
  - `approved` → `assigned`: Master agent picks up from queue
  - `assigned` → `in_progress`: Worker agent spawned and starts work
  - `in_progress` → `review`: All tasks marked complete in tasks.md
  - `applied` → `archived`: User-triggered archive action
- Track state history with timestamps and triggering agent/user
- Per-project applied spec tracking (which specs implemented in each project)

### Unified Dashboard
- **Work Queue View**: Combined specs + errors, sortable by priority/age/status
- **Per-Project Views**: Filter by project, see project-specific work queue
- **Lifecycle Pipeline**: Visual Kanban board showing specs moving through states
- **Approval Workflow**: Dedicated tab for items awaiting manual approval gates
- **Master Agent Status**: Show which master agents running, current work item, idle/active status
- **Worker Agent Grid**: Real-time view of spawned worker agents and their tasks
- **Full Spec Editor**: Edit proposal.md, tasks.md, design.md in UI with syntax highlighting
  - Auto-sync edits to filesystem
  - Validation before save (run `openspec validate`)
  - Conflict warnings if filesystem changed since load

### Agent Activity Tracking
- Stream real-time activities via send_event hook integration
- **Master Agent Dashboard**: Show queue processing, decision points, worker spawns
- **Worker Agent Timeline**: Track tool usage, file edits, test runs per worker
- Track success rates, duration metrics, resource usage per agent type
- Generate session summaries showing what was accomplished

### API Capabilities (tRPC Routers)
- **openspec**: Bidirectional sync operations, CRUD for specs, lifecycle transitions
- **workQueue**: Query queue, reorder items, mark ready/blocked
- **masterAgent**: Start/stop master agents, send commands, query status
- **workerAgent**: List active workers, get progress, cancel workers
- **sync**: Force sync filesystem ↔ DB, resolve conflicts, view sync history

## Impact

### Affected Specs
- **claude-agent-management**: MODIFIED to add master orchestrator and worker spawning capabilities
- **openspec-integration**: ADDED new capability for bidirectional filesystem ↔ DB sync
- **spec-lifecycle-management**: ADDED new capability for 7-state workflow with approval gates
- **error-automation**: ADDED new capability for automatic spec proposal generation from errors
- **unified-dashboard**: ADDED new capability for work queue management and full spec editing
- **master-agent-orchestrator**: ADDED new capability for persistent per-project coordination agents
- **worker-agent-management**: ADDED new capability for Task tool-based worker spawning
- **applied-spec-tracking**: ADDED new capability for tracking implemented specs per project

### Affected Code
- `homelab-services/packages/db/src/schema/` - New tables:
  - `openspecSpecs` - Synced OpenSpec data
  - `specLifecycle` - State transition history
  - `workQueue` - Prioritized work items per project
  - `masterAgents` - Per-project master agent sessions
  - `workerAgents` - Spawned worker agent tracking
  - `syncHistory` - Filesystem ↔ DB sync audit log
  - `appliedSpecs` - Track which specs applied to which projects
- `homelab-services/packages/api/src/services/` - New services:
  - `OpenSpecSyncService` - Bidirectional filesystem sync
  - `MasterAgentService` - Orchestrator lifecycle management
  - `WorkerAgentService` - Task tool spawning and tracking
  - `SpecLifecycleService` - State transition logic
  - `ErrorProposalService` - Auto-generate specs from errors
- `homelab-services/packages/api/src/router/` - New tRPC routers:
  - `openspec.ts` - CRUD + sync operations
  - `workQueue.ts` - Queue management
  - `masterAgent.ts` - Master agent control
  - `workerAgent.ts` - Worker agent tracking
  - `sync.ts` - Sync status and conflict resolution
  - `lifecycle.ts` - Spec state transitions
- `homelab-services/apps/claude-agent-web/src/app/` - New pages:
  - `/dashboard/work-queue` - Combined work items
  - `/dashboard/approvals` - Manual approval gates
  - `/dashboard/master-agents` - Orchestrator status
  - `/dashboard/spec-editor/[id]` - Full spec editing UI
  - `/dashboard/lifecycle/[id]` - State history view
- `homelab-services/packages/validators/src/` - New Zod schemas for all new entities

### Breaking Changes
None. This is purely additive functionality. Existing sessions, hooks, and reports continue working unchanged.

### Dependencies
- **Existing Infrastructure**:
  - Playwright server (reports, failures, remediation)
  - Claude Code (persistent master agents)
  - Task tool (worker agent spawning)
  - tRPC/Drizzle/Better-T-Stack architecture
- **New Dependencies**:
  - `chokidar` - Filesystem watching for immediate sync
  - `monaco-editor` - In-browser spec editing with syntax highlighting
  - `node-cron` - Scheduled master agent reviews (hourly)
  - OpenSpec CLI - Validation and archive operations

### Migration Path
1. Add new database tables to schema (no data migration needed)
2. Initial sync: Scan all project OpenSpec directories, populate DB
3. Start master agents for projects with queued work (opt-in per project)
4. Existing sessions continue unchanged, new sessions use master/worker pattern
