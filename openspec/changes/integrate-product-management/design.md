# Design: Product Management Integration

## Context

The Claude agent service currently operates in isolation from two critical systems:
1. **OpenSpec**: Spec-driven development workflow for managing change proposals
2. **Playwright Server**: Test failure tracking and remediation attempts

This integration brings product management capabilities into the Claude agent service, enabling it to act as an intelligent orchestrator for both planned work (specs) and reactive work (error fixes).

### Stakeholders
- Developers using Claude agent for implementation
- OpenSpec workflow for spec-driven development
- Playwright server for test failure monitoring
- Homelab monorepo architecture (Better-T-Stack)

### Constraints
- Must work with existing Better-T-Stack architecture (tRPC, Drizzle, Zod, Turborepo)
- Must not duplicate data already in Playwright server database
- Must read OpenSpec files from filesystem (no separate database for specs)
- Must maintain clear separation between spec state (filesystem) and runtime state (database)

## Goals / Non-Goals

### Goals
1. **Intelligent Orchestration**: Master agent per project manages work queue and spawns specialized workers
2. **Bidirectional Sync**: OpenSpec files ↔ Database with filesystem as source of truth
3. **Automated Spec Proposals**: All Playwright errors converted to spec proposals automatically
4. **Full Spec Editing**: Rich UI editor for proposal/tasks/design with validation and conflict resolution
5. **Lifecycle Management**: 7-state workflow with manual approval gates and automatic transitions
6. **Applied Spec Tracking**: Track which specs have been implemented in each project
7. **Project-Aware Work Queues**: Per-project queues with master agent coordination

### Non-Goals
1. **OpenSpec CLI Replacement**: Still use OpenSpec CLI for validation and complex operations
2. **Playwright Server Replacement**: Not replacing Playwright server, consuming its data via foreign keys
3. **Direct Error Fixes**: No one-off fixes bypassing spec workflow (all errors → spec proposals)
4. **Multi-Project Master Agents**: One master per project, not cross-project orchestration

## Decisions

### Decision 1: Bidirectional Sync with Filesystem as Source of Truth

**What**: Sync OpenSpec files ↔ Database with hybrid sync strategy: immediate for queued specs, periodic for others. Filesystem always wins on conflicts.

**Why**:
- **Database enables work queue**: Need queryable structured data for master agent prioritization
- **UI editing requires DB**: Can't efficiently edit files through web UI without DB layer
- **Applied spec tracking**: Must track which specs implemented per project (DB only)
- **Lifecycle state**: Track spec states (proposing→approved→etc.) separate from file state
- **Filesystem = source of truth**: Git-trackable, diffable, OpenSpec CLI compatible

**Sync Strategy**:
- **Filesystem → DB (Immediate)**: File watcher (chokidar) syncs queued specs instantly
- **Filesystem → DB (Periodic)**: Batch sync archived/inactive specs every 30 seconds
- **DB → Filesystem**: UI edits write to DB, then immediately flush to filesystem
- **Conflict Resolution**: Filesystem always wins - discard DB changes if both modified

**Alternatives Considered**:
1. **Filesystem-only (original design)**: Read from disk, no DB
   - **Rejected**: Can't query/filter efficiently, no work queue, no lifecycle tracking
2. **Database-only**: Store in DB, generate files on demand
   - **Rejected**: Loses git history, breaks OpenSpec CLI, not human-editable
3. **Last-write-wins conflicts**: Keep most recent edit
   - **Rejected**: Filesystem is source of truth per requirements

**Implementation**:
```typescript
// packages/api/src/services/openspec-sync.ts
export class OpenSpecSyncService {
  // Filesystem → DB
  async syncFromFilesystem(projectId: string, immediate = false): Promise<void>

  // DB → Filesystem
  async syncToFilesystem(specId: string): Promise<void>

  // Detect conflicts (both changed since last sync)
  async detectConflicts(specId: string): Promise<Conflict | null>

  // Force filesystem version to DB (resolve conflict)
  async forceFilesystemWins(specId: string): Promise<void>
}

// File watcher for immediate sync
watchOpenSpecDirectory(projectPath, async (event, file) => {
  if (isQueuedSpec(file)) {
    await syncService.syncFromFilesystem(projectId, immediate: true)
  }
})
```

**Database Schema**:
```typescript
export const openspecSpecs = sqliteTable('openspec_specs', {
  id: text('id').primaryKey(), // Change ID from filesystem
  projectId: integer('project_id').references(() => projects.id),
  title: text('title').notNull(),
  status: text('status', {
    enum: ['proposing', 'approved', 'assigned', 'in_progress', 'review', 'applied', 'archived']
  }),
  proposalContent: text('proposal_content'), // Full proposal.md markdown
  tasksContent: text('tasks_content'), // Full tasks.md markdown
  designContent: text('design_content'), // Full design.md markdown (nullable)
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
  filesystemModifiedAt: integer('filesystem_modified_at', { mode: 'timestamp' }),
  dbModifiedAt: integer('db_modified_at', { mode: 'timestamp' }),
  syncError: text('sync_error'), // Last sync error message if any
})
```

### Decision 2: Playwright Data via Foreign Keys, Not Duplication

**What**: Reference existing Playwright `reports` and `testFailures` tables via foreign keys.

**Why**:
- Playwright server already tracks all test data
- Claude agent service only adds decision metadata (should we spec this? who's working on it?)
- Maintains single source of truth for test results

**Implementation**:
- Create `errorTriage` table linking to existing `testFailures.id`
- Store triage decision (needs_spec, one_off_fix, ignore)
- Store rationale and assigned session
- Use SQL joins to combine Playwright data with triage decisions

### Decision 3: All Errors Become Spec Proposals (No One-Off Fixes)

**What**: Every Playwright test failure automatically generates a spec proposal. No direct fixes bypassing spec workflow.

**Why**:
- **Traceability**: Every fix documented as a spec with rationale and requirements
- **Review gate**: User must approve `proposing → approved` before implementation
- **Knowledge capture**: Error context preserved in proposal.md for future reference
- **Consistency**: Single workflow for all changes, whether planned features or reactive fixes
- **Prevents tech debt**: Forces thinking about root cause, not just symptoms

**Spec Proposal Auto-Generation**:
```typescript
// packages/api/src/services/error-proposal.ts
export class ErrorProposalService {
  async generateProposal(testFailure: TestFailure): Promise<ProposalDraft> {
    return {
      title: `Fix: ${testFailure.testName}`,
      why: `
Test failure detected with classification: ${testFailure.classification}

**Error Message:**
\`\`\`
${testFailure.errorMessage}
\`\`\`

**Stack Trace:**
\`\`\`
${testFailure.stackTrace}
\`\`\`

**Failure Pattern:**
- Occurrences: ${testFailure.occurrenceCount}
- First seen: ${testFailure.firstSeenAt}
- Last seen: ${testFailure.lastSeenAt}
      `,
      whatChanges: this.inferChangesFromError(testFailure),
      priority: this.calculatePriority(testFailure.classification),
      status: 'proposing'
    }
  }
}
```

**Priority Calculation**:
- **PERSISTENT** (100% failure) → Priority 5 (critical)
- **RECURRING** (3+ times) → Priority 4 (high)
- **FLAKY** (inconsistent) → Priority 3 (medium)
- **NEW** (first occurrence) → Priority 2 (low)

**Alternatives Considered**:
1. **One-off fix option (original design)**: Let master agent fix simple errors directly
   - **Rejected**: Loses traceability, creates inconsistent workflows, bypasses review
2. **User chooses per error**: Dashboard shows "Fix now" vs "Create spec" buttons
   - **Rejected**: Decision fatigue, most users would click "Fix now" and skip specs
3. **ML classification**: AI decides spec vs direct fix
   - **Rejected**: "All specs" is simpler, more consistent, captures knowledge

**User Workflow**:
1. Test fails → Playwright server records failure
2. Error proposal service generates spec draft in `proposing` state
3. User reviews proposal in Approvals tab
4. User can:
   - **Approve**: Moves to `approved`, enters work queue
   - **Edit**: Modify proposal in UI editor, then approve
   - **Reject**: Mark as "won't fix", archive immediately
5. If approved, master agent picks up and implements via worker agents

### Decision 4: Unified Dashboard Using Tabs/Filters, Not Separate Pages

**What**: Single page with tabbed interface for Specs, Errors, and Combined view.

**Why**:
- Easier to switch context without navigation
- Shared filtering logic (project, status, priority)
- Visual consistency with existing homelab dashboards

**Tabs**:
- **All Work**: Combined view showing both specs and errors, sorted by priority
- **Specs**: OpenSpec proposals only (proposal, in-progress, archived)
- **Errors**: Playwright failures only (new, triaged, in-remediation, fixed)
- **Sessions**: Existing sessions view (links to specs or errors)

**Filters** (apply across all tabs):
- Project dropdown (all projects with OpenSpec)
- Status multi-select
- Date range
- Search (fuzzy match on titles/test names)

### Decision 5: Project Detection via Filesystem Convention

**What**: Detect projects by scanning `/projects` directory for OpenSpec presence.

**Why**:
- Automatic discovery without manual configuration
- OpenSpec presence indicates project uses spec-driven development
- Aligns with existing homelab-services monorepo structure

**Implementation**:
```typescript
// Scan for projects
const projects = await scanProjectsWithOpenSpec('/home/leo/dev/projects');

// Each project returns:
interface Project {
  name: string;
  path: string;
  openspecPath: string;
  hasActiveChanges: boolean;
  specCount: number;
}
```

### Decision 6: tRPC Subscriptions for Real-Time Updates

**What**: Use tRPC subscriptions to stream new failures and triage updates.

**Why**:
- Already using tRPC for hooks real-time streaming
- Consistent with existing architecture
- Enables reactive UI updates without polling

**Implementation**:
- `errors.subscribe({ projectId? })` - Stream new test failures
- `specs.subscribe({ projectId? })` - Stream OpenSpec change events (via file watcher)
- `agents.subscribe({ sessionId? })` - Stream agent activity (hook events)
- Combine both into `work.subscribe({ projectId? })` for unified feed

### Decision 7: Agent Activity via Existing Hooks Table

**What**: Use existing hooks table and send_event infrastructure for agent activity tracking.

**Why**:
- Hook system already captures all agent tool executions
- send_event.py already POSTs to tRPC API
- No new database tables needed
- Real-time data already flowing through subscriptions

**Implementation**:
- Query hooks table JOIN sessions to get active agents
- Calculate activity metrics from hook events (tool count, success rate, duration)
- Stream hook events via existing subscription mechanism
- Detect idle agents (no events for 5+ minutes) via timestamp comparison

**Activity Data**:
```sql
SELECT
  s.id as session_id,
  s.agent_id,
  s.session_type,
  s.metadata,
  h.tool_name as current_tool,
  MAX(h.timestamp) as last_activity,
  COUNT(h.id) as total_tools,
  AVG(h.duration_ms) as avg_duration,
  SUM(CASE WHEN h.success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(h.id) as success_rate
FROM sessions s
LEFT JOIN hooks h ON s.id = h.session_id
WHERE s.status = 'running'
GROUP BY s.id
ORDER BY last_activity DESC;
```

### Decision 8: Master Agent as Persistent Claude Code Session Per Project

**What**: One long-running Claude Code session per project acts as orchestrator, managing work queue and spawning worker agents.

**Why**:
- **Continuous coordination**: Runs persistently, no startup overhead per task
- **Context retention**: Maintains project knowledge across multiple work items
- **Intelligent sequencing**: Prioritizes queue, detects dependencies, reorders work
- **Worker delegation**: Spawns specialized agents via Task tool for efficient execution
- **User familiarity**: Uses Claude Code interface developers already know

**Master Agent Responsibilities**:
1. **Queue Management**: Poll work queue for approved items, select next task
2. **Dependency Detection**: Parse specs for cross-references, avoid conflicts
3. **Worker Spawning**: Call Task tool with appropriate subagent_type
4. **Progress Tracking**: Monitor worker hooks, update spec lifecycle states
5. **Clarification Requests**: Pause and send dashboard notifications when decisions needed
6. **Lifecycle Transitions**: Auto-move specs through states (except manual gates)

**Triggers** (master agent starts working):
- Manual approval: User approves `proposing → approved` transition
- Scheduled review: Hourly cron job checks for ready work
- Auto-continue: Previous work item completed and marked ready

**Clarification Protocol**:
```typescript
// When master agent needs decision
await masterAgent.requestClarification({
  question: "Spec X requires database migration. Safe to proceed?",
  options: ['Proceed with migration', 'Skip migration for now', 'Modify approach'],
  blocking: true // Agent pauses until answered
})

// Dashboard shows notification
// User clicks option → Response sent to master agent → Resumes
```

**State Persistence**:
- Session metadata stores: current work item, queue position, pending clarifications
- On restart: Resume from last known state
- Hooks table tracks all actions for audit trail

**Alternatives Considered**:
1. **Background service with LLM API calls**: Node.js service calls Claude API
   - **Rejected**: Loses Claude Code tool ecosystem, different UX from manual sessions
2. **One-time sessions per task**: Spawn new session per work item
   - **Rejected**: Loses context between tasks, repeated project analysis overhead
3. **Hybrid service + sessions**: Service orchestrates, spawns workers
   - **Rejected**: Too complex, mixing two orchestration patterns

**Implementation**:
```typescript
// packages/api/src/services/master-agent.ts
export class MasterAgentService {
  // Start master agent for project
  async startMasterAgent(projectId: number): Promise<Session> {
    const session = await createSession({
      projectId,
      sessionType: 'master_orchestrator',
      persistent: true,
      metadata: { workQueue: [], currentItem: null }
    })

    await sendCommandToAgent(session.id, 'initialize-master-agent')
    return session
  }

  // Send work item to master agent
  async assignWork(sessionId: string, workItemId: string): Promise<void> {
    await sendCommandToAgent(sessionId, `start-work-item:${workItemId}`)
  }

  // Handle clarification response
  async answerClarification(sessionId: string, answer: string): Promise<void> {
    await sendCommandToAgent(sessionId, `clarification-response:${answer}`)
  }
}
```

### Decision 9: 7-State Spec Lifecycle with Manual Approval Gates

**What**: Specs progress through 7 states with 2 manual gates requiring user approval. Other transitions automatic.

**States**:
1. **proposing**: Auto-generated from errors or manually created, awaiting review
2. **approved**: User approved, waiting for master agent assignment
3. **assigned**: Master agent picked up, preparing to spawn workers
4. **in_progress**: Worker agents actively implementing
5. **review**: All tasks complete, awaiting user validation
6. **applied**: User confirmed implementation successful, tests pass
7. **archived**: Moved to archive/ directory, complete

**Manual Gates** (require user action):
- **proposing → approved**: User reviews proposal, clicks "Approve" or "Reject"
- **review → applied**: User validates implementation, runs tests, confirms success

**Automatic Transitions**:
- **approved → assigned**: Master agent selects from queue
- **assigned → in_progress**: Worker agent spawned and first tool executed
- **in_progress → review**: Last task marked [x] complete in tasks.md
- **applied → archived**: User triggers archive action (runs `openspec archive`)

**State History Tracking**:
```typescript
export const specLifecycle = sqliteTable('spec_lifecycle', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  specId: text('spec_id').references(() => openspecSpecs.id),
  fromState: text('from_state'),
  toState: text('to_state').notNull(),
  triggeredBy: text('triggered_by'), // 'user', 'master_agent', 'worker_agent', 'system'
  triggerUserId: integer('trigger_user_id'), // If user action
  triggerSessionId: integer('trigger_session_id'), // If agent action
  transitionedAt: integer('transitioned_at', { mode: 'timestamp' }),
  notes: text('notes') // Optional context about transition
})
```

**Why Manual Gates**:
- **Proposing → Approved**: Prevents auto-implementation of bad ideas, allows proposal refinement
- **Review → Applied**: Ensures tests pass, allows user to verify quality before marking done

**Why Automatic Transitions**:
- **Approved → Assigned**: No user value in manually assigning, master agent handles prioritization
- **Assigned → In Progress**: Worker starts immediately, no delay needed
- **In Progress → Review**: Objective criterion (all tasks done), no judgment needed
- **Applied → Archived**: User-triggered action, but could be automated in future

**Alternatives Considered**:
1. **Simple 3-state (todo/doing/done)**: Too coarse, loses visibility
   - **Rejected**: Can't distinguish approved vs assigned, review vs applied
2. **All transitions manual**: Maximum control
   - **Rejected**: Too much clicking, slows down automation
3. **No manual gates (fully automatic)**: Maximum speed
   - **Rejected**: Risky, no human review of proposals or completions

### Decision 10: Worker Agent Spawning via Claude Agent SDK Subagents

**What**: Master agent spawns specialized worker subagents using Claude Agent SDK with custom system prompts tailored to each work item type.

**Why**:
- **Specialized expertise**: Different system prompts optimize for different tasks (T3 Stack, E2E testing, database design)
- **Efficient delegation**: Right agent configuration for the job, no generic agent doing everything
- **Parallel execution**: SDK supports multiple concurrent subagents (no 10-agent limit like Task tool)
- **Full control**: Custom system prompts, tool permissions, working directories per worker type

**Worker Agent Selection Logic**:
```typescript
// packages/api/src/services/worker-agent.ts
export class WorkerAgentService {
  private sdkClient: ClaudeSDKClient;

  selectAgentType(spec: OpenSpecSpec): string {
    // Analyze spec content to determine best agent type
    const keywords = this.extractKeywords(spec)

    if (keywords.includes('tRPC') || keywords.includes('Better-T-Stack')) {
      return 't3-stack-developer'
    }
    if (keywords.includes('test') || keywords.includes('e2e')) {
      return 'e2e-test-engineer'
    }
    if (keywords.includes('database') || keywords.includes('schema')) {
      return 'database-architect'
    }
    if (keywords.includes('UI') || keywords.includes('design')) {
      return 'ux-design-specialist'
    }

    return 'general-purpose' // Fallback
  }

  buildSystemPrompt(agentType: string, spec: OpenSpecSpec): string {
    // Load specialized system prompt for agent type
    const basePrompts = {
      't3-stack-developer': 'You are an expert in T3 Stack (tRPC, Drizzle, Zod, React)...',
      'e2e-test-engineer': 'You are an expert in end-to-end testing with Playwright...',
      'database-architect': 'You are an expert in database design and Drizzle ORM...',
      'ux-design-specialist': 'You are an expert in UX design and shadcn/ui...',
      'general-purpose': 'You are a versatile full-stack developer...'
    };

    return `${basePrompts[agentType]}

Your task: ${spec.title}

Context:
${spec.proposalContent}

Tasks to complete:
${spec.tasksContent}

Report completion with summary of changes.`;
  }

  async spawnWorker(masterSessionId: string, spec: OpenSpecSpec): Promise<WorkerSession> {
    const agentType = this.selectAgentType(spec)
    const systemPrompt = this.buildSystemPrompt(agentType, spec)

    // Spawn subagent via Claude Agent SDK
    const worker = await this.sdkClient.createSubagent({
      systemPrompt,
      allowedTools: this.getToolsForAgentType(agentType),
      cwd: spec.projectPath,
      maxTokens: 150000, // Enforce token budget per worker
    });

    // Track worker in database
    return await db.insert(workerAgents).values({
      id: worker.id,
      masterSessionId,
      specId: spec.id,
      agentType,
      status: 'spawned',
      spawnedAt: new Date(),
      tokensUsed: 0,
      lastHeartbeat: new Date()
    })
  }

  getToolsForAgentType(agentType: string): string[] {
    const toolsByType = {
      't3-stack-developer': ['read', 'write', 'edit', 'bash', 'glob', 'grep'],
      'e2e-test-engineer': ['read', 'write', 'bash', 'glob'],
      'database-architect': ['read', 'write', 'edit', 'bash'],
      'ux-design-specialist': ['read', 'write', 'edit', 'glob'],
      'general-purpose': ['read', 'write', 'edit', 'bash', 'glob', 'grep']
    };
    return toolsByType[agentType] || toolsByType['general-purpose'];
  }
}
```

**Worker Tracking**:
```typescript
export const workerAgents = sqliteTable('worker_agents', {
  id: text('id').primaryKey(), // Task tool agent ID
  masterSessionId: integer('master_session_id').references(() => sessions.id),
  specId: text('spec_id').references(() => openspecSpecs.id),
  agentType: text('agent_type').notNull(), // 't3-stack-developer', etc.
  status: text('status', {
    enum: ['spawned', 'active', 'completed', 'failed', 'cancelled']
  }),
  spawnedAt: integer('spawned_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  result: text('result'), // JSON: files changed, tests passed, etc.
})
```

**Master ↔ Worker Communication**:
- Master monitors worker progress via hooks table (worker tool executions visible)
- Worker completes → Master receives signal → Master transitions spec to next state
- Worker fails → Master retries with different agent or requests clarification

**Alternatives Considered**:
1. **Master does all work directly**: No worker spawning
   - **Rejected**: Less efficient, master not specialized for all tasks
2. **Manual worker assignment**: User picks agent type
   - **Rejected**: User shouldn't need to know agent types, automation better
3. **Task tool for worker spawning** (original design)
   - **Rejected**: 10 concurrent agent limit, 20k token overhead per agent, batching inefficiency, no lifecycle control

### Decision 11: Claude Agent SDK for Master/Worker Architecture

**What**: Use Claude Agent SDK instead of Task tool for implementing master and worker agents.

**Why**:
- **No concurrency ceiling**: Task tool has hard limit of 10 concurrent agents; SDK scales to support multiple masters with 2-3 workers each
- **Native tRPC integration**: SDK agents run as in-process MCP servers, perfect for Better-T-Stack architecture
- **Custom lifecycle management**: SDK provides context managers for proper cleanup, timeouts, and resource limits
- **Token efficiency**: No 20k overhead per agent like Task tool; we control context size
- **Non-blocking**: SDK spawns subagents asynchronously; Task tool blocks master until all workers finish
- **Production-ready**: SDK designed for production agents with fine-grained permissions, working directory isolation

**Implementation with SDK**:
```typescript
// packages/api/src/services/master-agent-sdk.ts
import { ClaudeSDKClient } from '@anthropic-ai/claude-agent-sdk';

export class MasterAgentSDKService {
  private client: ClaudeSDKClient;

  constructor(projectId: number, projectPath: string) {
    this.client = new ClaudeSDKClient({
      systemPrompt: `You are the master orchestrator for project ${projectId}...`,
      allowedTools: ['file_operations', 'read', 'write', 'bash'],
      cwd: projectPath,
      // Custom memory for state persistence
      memory: new PostgresMemoryAdapter(projectId)
    });
  }

  async spawnWorker(specId: string, agentType: string): Promise<WorkerAgent> {
    // Spawn subagent via SDK
    const worker = await this.client.createSubagent({
      systemPrompt: this.buildWorkerPrompt(specId, agentType),
      allowedTools: this.getToolsForAgentType(agentType),
      cwd: this.projectPath,
      // Isolated context per worker
      maxTokens: 150000 // Enforce token budget
    });

    // Track in database
    await db.insert(workerAgents).values({
      id: worker.id,
      specId,
      agentType,
      status: 'spawned',
      spawnedAt: new Date()
    });

    return worker;
  }

  async monitorWorker(workerId: string): Promise<WorkerStatus> {
    // SDK provides built-in status tracking
    const worker = await this.client.getSubagent(workerId);
    return {
      status: worker.status,
      tokensUsed: worker.usage.totalTokens,
      lastActivity: worker.lastActivityAt
    };
  }

  async cleanup(): Promise<void> {
    // SDK context manager handles proper cleanup
    await this.client.close();
  }
}
```

**SDK vs Task Tool Comparison**:
| Dimension | Claude Agent SDK | Task Tool (Rejected) |
|-----------|------------------|----------------------|
| Concurrent agents | No stated limit (scalable) | 10 max (hard limit) |
| Token overhead | Configurable | 20k per agent |
| tRPC integration | Native (in-process MCP) | Limited (blocking) |
| Lifecycle control | Custom timeouts, cleanup | None (auto-cleanup only) |
| Dynamic allocation | ✅ Fully supported | ❌ Batching inefficiency |
| Master blocking | Non-blocking (async) | Blocks until all complete |

**Alternatives Considered**:
1. **Task tool** (original design)
   - **Rejected**: 10-agent ceiling unsuitable for multi-project orchestration, 20k token waste per agent, blocking calls prevent master from processing queue
2. **No SDK, custom Claude API calls**
   - **Rejected**: Reinventing SDK features (context management, subagents, memory), more complex
3. **Hybrid: SDK master + Task tool workers**
   - **Rejected**: Mixing paradigms increases complexity, still limited by Task tool's 10-agent cap

### Decision 12: Dynamic Resource Allocation (2-3 Workers Per Master)

**What**: Allocate 2-3 concurrent workers per master agent, with multiple masters running across projects sharing a global worker pool.

**Why**:
- **Efficient resource usage**: With Claude Agent SDK removing 10-agent ceiling, can scale to support multiple active projects
- **Fair allocation**: Each project gets dedicated master + small worker pool, prevents resource starvation
- **Cost control**: Limit workers per master to contain token costs (200k context × workers)
- **Queue flexibility**: If project has 10 specs, workers process them sequentially; master manages queue

**Resource Allocation Strategy**:
```typescript
// Global resource manager
export class ResourceAllocator {
  // Tracks active masters and their worker counts
  private activeAllocations: Map<number, { // projectId → allocation
    masterAgentId: string;
    workerCount: number;
    maxWorkers: number;
  }>;

  async allocateWorkerSlot(projectId: number): Promise<boolean> {
    const allocation = this.activeAllocations.get(projectId);
    if (!allocation) return false;

    // Check if project can spawn more workers
    if (allocation.workerCount >= allocation.maxWorkers) {
      return false; // At capacity, worker must queue
    }

    allocation.workerCount++;
    return true;
  }

  async releaseWorkerSlot(projectId: number): Promise<void> {
    const allocation = this.activeAllocations.get(projectId);
    if (allocation) {
      allocation.workerCount--;
      // Notify master agent that slot available
      await this.notifyMasterAgentSlotAvailable(allocation.masterAgentId);
    }
  }

  async startMasterAgent(projectId: number): Promise<MasterAllocation> {
    // Default: 3 workers per master (configurable per project)
    const maxWorkers = await this.getProjectWorkerLimit(projectId) || 3;

    this.activeAllocations.set(projectId, {
      masterAgentId: generateId(),
      workerCount: 0,
      maxWorkers
    });

    return this.activeAllocations.get(projectId)!;
  }
}
```

**Resource Limits**:
- **Per Project**: Max 3 concurrent workers (configurable)
- **Per Worker**: Max 150k tokens (leaves 50k buffer from 200k context)
- **Per Master**: Max 200k tokens (full context window)
- **Global**: No hard limit (constrained by server resources and token budget)

**Scaling Example**:
- 5 projects active = 5 masters + 15 workers max = 20 concurrent agents
- Each consumes 200k context (master) + 450k total (workers) = 650k tokens per project
- Total: 3.25M tokens for 5 active projects

**Alternatives Considered**:
1. **Single master for all projects**
   - **Rejected**: Bottleneck, no parallelism, context overload mixing project concerns
2. **Max 1 master + 9 workers per server**
   - **Rejected**: Only one project can be active at a time, poor resource utilization
3. **Unlimited workers per master**
   - **Rejected**: Runaway token costs, resource exhaustion, hard to debug failures

### Decision 13: Agent Lifecycle & Cleanup (Heartbeat + Token Budget)

**What**: Implement heartbeat monitoring (5-minute intervals) and token budget enforcement to detect and clean up stale, hung, or runaway agents.

**Why**:
- **Prevent zombie agents**: Workers that crash or hang consume resources but produce no output
- **Cost control**: Runaway agents approaching context limits waste tokens
- **Reliability**: Automatic recovery from agent failures without manual intervention
- **Observability**: Real-time visibility into agent health and resource usage

**Heartbeat Monitoring**:
```typescript
// packages/api/src/services/agent-heartbeat.ts
export class AgentHeartbeatMonitor {
  private heartbeats: Map<string, Date>; // agentId → last heartbeat

  async startMonitoring(agentId: string): Promise<void> {
    this.heartbeats.set(agentId, new Date());

    // Worker agents send heartbeat every 5 minutes
    // (via custom tRPC endpoint or SDK event)
  }

  async checkHeartbeat(agentId: string): Promise<boolean> {
    const lastHeartbeat = this.heartbeats.get(agentId);
    if (!lastHeartbeat) return false;

    const minutesSinceHeartbeat = (Date.now() - lastHeartbeat.getTime()) / 60000;

    // If no heartbeat for >5 minutes, consider dead
    return minutesSinceHeartbeat < 5;
  }

  async cleanupStaleAgents(): Promise<string[]> {
    const staleAgents: string[] = [];

    for (const [agentId, lastHeartbeat] of this.heartbeats.entries()) {
      const minutesSinceHeartbeat = (Date.now() - lastHeartbeat.getTime()) / 60000;

      if (minutesSinceHeartbeat >= 5) {
        // Mark agent as failed
        await db.update(workerAgents)
          .set({ status: 'failed', completedAt: new Date() })
          .where(eq(workerAgents.id, agentId));

        // Force cleanup via SDK
        await this.forceTerminateAgent(agentId);

        staleAgents.push(agentId);
        this.heartbeats.delete(agentId);
      }
    }

    return staleAgents;
  }

  // Runs every minute as background job
  async monitorLoop(): Promise<void> {
    setInterval(async () => {
      const stale = await this.cleanupStaleAgents();
      if (stale.length > 0) {
        console.warn(`Cleaned up ${stale.length} stale agents:`, stale);
      }
    }, 60000); // Every 1 minute
  }
}
```

**Token Budget Enforcement**:
```typescript
// Track token usage per agent in real-time
export class TokenBudgetEnforcer {
  async trackAgentUsage(agentId: string): Promise<void> {
    // SDK provides token usage via getSubagent().usage.totalTokens
    const worker = await sdkClient.getSubagent(agentId);
    const tokensUsed = worker.usage.totalTokens;

    // Update database
    await db.update(workerAgents)
      .set({ tokensUsed })
      .where(eq(workerAgents.id, agentId));

    // Check if approaching budget limit (150k)
    if (tokensUsed > 140000) {
      console.warn(`Worker ${agentId} approaching token limit: ${tokensUsed}/150k`);

      // Send warning to master agent
      await this.notifyMasterAgentTokenWarning(agentId);
    }

    // Enforce hard limit
    if (tokensUsed >= 150000) {
      console.error(`Worker ${agentId} exceeded token budget, terminating`);
      await this.forceTerminateAgent(agentId, 'token_budget_exceeded');
    }
  }

  // Runs every 30 seconds for active workers
  async monitorLoop(): Promise<void> {
    setInterval(async () => {
      const activeWorkers = await db.select()
        .from(workerAgents)
        .where(eq(workerAgents.status, 'active'));

      for (const worker of activeWorkers) {
        await this.trackAgentUsage(worker.id);
      }
    }, 30000); // Every 30 seconds
  }
}
```

**Cleanup Triggers**:
1. **Heartbeat timeout** (>5 min no heartbeat) → Mark failed, force terminate
2. **Token budget exceeded** (>150k tokens) → Force terminate with warning
3. **Max runtime** (>2 hours) → Force terminate, move to manual review
4. **Session close** → Graceful cleanup via SDK context manager

**Database Schema Additions**:
```typescript
// Add to workerAgents table
export const workerAgents = sqliteTable('worker_agents', {
  // ... existing fields
  tokensUsed: integer('tokens_used').default(0),
  lastHeartbeat: integer('last_heartbeat', { mode: 'timestamp' }),
  maxRuntime: integer('max_runtime').default(7200), // 2 hours in seconds
  terminationReason: text('termination_reason'), // 'completed', 'timeout', 'token_limit', 'heartbeat_timeout'
});
```

**Alternatives Considered**:
1. **No heartbeat, rely on SDK auto-cleanup**
   - **Rejected**: SDK doesn't document automatic hung agent detection, we need explicit monitoring
2. **Manual intervention only (no auto-cleanup)**
   - **Rejected**: Requires human monitoring 24/7, not sustainable for production
3. **Shorter heartbeat interval (1 minute)**
   - **Rejected**: Too noisy, increases network overhead, 5 minutes sufficient for production
4. **No token budget enforcement**
   - **Rejected**: Runaway agents could consume entire context window (200k tokens × $15/M = $3 per agent!)

### Decision 14: Three-Tier Memory Architecture (Global → Project → Task)

**What**: Implement a three-tier memory system using the existing SQLite database to store and retrieve knowledge across all projects, per-project context, and per-task memory.

**Why**:
- **Cross-project learning**: All projects use Better-T-Stack with same patterns → Global knowledge base prevents rediscovering solutions
- **Project-specific context**: Each project has unique business logic, naming conventions, file structures
- **Task isolation**: Each worker needs focused context for their specific spec without noise from other work
- **Cost efficiency**: Reusing learned patterns reduces token usage and improves consistency
- **No additional infrastructure**: Leverage existing SQLite database in homelab-services

**Database Choice**:
- **Use existing SQLite** (`homelab-services/db/claude.db`)
- **Why SQLite over PostgreSQL**:
  - Already in stack (no new dependencies)
  - Perfect for single-writer workload (master agent coordinates writes)
  - Embedded (no network overhead)
  - Simple backups (copy .db file)
  - 281TB max size (more than sufficient)
  - ACID transactions for consistency
- **Why extend homelab-services DB** (not separate DB):
  - Unified schema management via Drizzle migrations
  - Single database connection pool
  - Foreign key relationships to existing tables (projects, sessions, specs)
  - Consistent backup/restore process

**Three-Tier Architecture**:

```typescript
// Tier 1: Global Stack Knowledge Base (Spans All Projects)
export const globalKnowledge = sqliteTable('global_knowledge', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category', {
    enum: ['pattern', 'lesson', 'convention', 'solution', 'anti_pattern']
  }).notNull(),
  key: text('key').notNull(), // 'trpc_router_structure', 'drizzle_migration_pattern'
  title: text('title').notNull(), // Human-readable title
  content: text('content').notNull(), // Markdown or code snippet
  tags: text('tags'), // JSON array: ['tRPC', 'Drizzle', 'validation']
  sourceProject: integer('source_project').references(() => projects.id),
  sourceSpec: text('source_spec'), // Which spec created this knowledge
  confidence: integer('confidence').default(5), // 1-10, how reliable is this?
  usageCount: integer('usage_count').default(0), // How many times applied
  successRate: integer('success_rate').default(100), // % of times it helped (0-100)
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
});

// Tier 2: Project Memory (Per-Project Context)
export const projectMemory = sqliteTable('project_memory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id),
  category: text('category', {
    enum: ['architecture', 'naming', 'business_logic', 'file_structure', 'dependencies']
  }).notNull(),
  key: text('key').notNull(), // 'api_router_location', 'auth_implementation'
  content: text('content').notNull(),
  relevance: integer('relevance').default(5), // 1-10, how important is this?
  lastUsed: integer('last_used', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
});

// Tier 3: Task Memory (Per-Spec Context)
export const taskMemory = sqliteTable('task_memory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  specId: text('spec_id').notNull().references(() => openspecSpecs.id),
  workerAgentId: text('worker_agent_id').references(() => workerAgents.id),
  category: text('category', {
    enum: ['decision', 'challenge', 'solution', 'file_change', 'test_result']
  }).notNull(),
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
});

// Indexes for efficient queries
// globalKnowledge: category, key, tags (JSON search), confidence, usageCount
// projectMemory: projectId+category, projectId+key, relevance
// taskMemory: specId, workerAgentId, timestamp
```

**Memory Injection Service**:

```typescript
// packages/api/src/services/memory-injection.ts
export class MemoryInjectionService {
  async buildWorkerContext(
    projectId: number,
    specId: string,
    agentType: string
  ): Promise<string> {
    // Query all three tiers
    const globalContext = await this.getGlobalKnowledge(agentType);
    const projectContext = await this.getProjectMemory(projectId);
    const taskContext = await this.getTaskMemory(specId);

    // Format as markdown sections
    return `
# Memory Context

## Global Knowledge (Better-T-Stack Patterns)
${globalContext}

## Project-Specific Context
${projectContext}

## Previous Task Attempts
${taskContext}
`;
  }

  async getGlobalKnowledge(agentType: string): Promise<string> {
    // Query top 10 most successful patterns relevant to agent type
    const patterns = await db.select()
      .from(globalKnowledge)
      .where(and(
        gte(globalKnowledge.confidence, 7),
        gte(globalKnowledge.successRate, 80)
      ))
      .orderBy(desc(globalKnowledge.usageCount))
      .limit(10);

    return patterns.map(p => `### ${p.title}\n${p.content}`).join('\n\n');
  }

  async getProjectMemory(projectId: number): Promise<string> {
    // Get all high-relevance project context
    const memory = await db.select()
      .from(projectMemory)
      .where(and(
        eq(projectMemory.projectId, projectId),
        gte(projectMemory.relevance, 7)
      ))
      .orderBy(desc(projectMemory.relevance));

    return memory.map(m => `- **${m.key}**: ${m.content}`).join('\n');
  }

  async getTaskMemory(specId: string): Promise<string> {
    // Get previous attempts and lessons from this specific spec
    const memory = await db.select()
      .from(taskMemory)
      .where(eq(taskMemory.specId, specId))
      .orderBy(desc(taskMemory.timestamp));

    if (memory.length === 0) return '*No previous attempts*';

    return memory.map(m => `- **${m.category}**: ${m.content}`).join('\n');
  }

  async recordGlobalKnowledge(
    category: string,
    key: string,
    title: string,
    content: string,
    sourceProject: number,
    sourceSpec: string
  ): Promise<void> {
    // Check if knowledge already exists
    const existing = await db.select()
      .from(globalKnowledge)
      .where(eq(globalKnowledge.key, key))
      .limit(1);

    if (existing.length > 0) {
      // Update existing knowledge (increment usage, update confidence)
      await db.update(globalKnowledge)
        .set({
          usageCount: sql`${globalKnowledge.usageCount} + 1`,
          updatedAt: new Date()
        })
        .where(eq(globalKnowledge.key, key));
    } else {
      // Insert new knowledge
      await db.insert(globalKnowledge).values({
        category,
        key,
        title,
        content,
        sourceProject,
        sourceSpec,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  async mergeTaskMemoryToProject(
    specId: string,
    projectId: number
  ): Promise<void> {
    // After spec completion, analyze task memory for useful project patterns
    const taskLessons = await db.select()
      .from(taskMemory)
      .where(and(
        eq(taskMemory.specId, specId),
        eq(taskMemory.category, 'solution')
      ));

    for (const lesson of taskLessons) {
      // Promote to project memory if valuable
      await this.recordProjectMemory(
        projectId,
        'business_logic',
        `lesson_from_${specId}`,
        lesson.content,
        7 // relevance
      );
    }
  }

  async recordProjectMemory(
    projectId: number,
    category: string,
    key: string,
    content: string,
    relevance: number
  ): Promise<void> {
    await db.insert(projectMemory).values({
      projectId,
      category,
      key,
      content,
      relevance,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  async recordTaskMemory(
    specId: string,
    workerAgentId: string | null,
    category: string,
    content: string
  ): Promise<void> {
    await db.insert(taskMemory).values({
      specId,
      workerAgentId,
      category,
      content,
      timestamp: new Date(),
      createdAt: new Date()
    });
  }
}
```

**Memory Lifecycle**:

1. **Worker spawns** → Memory injection service builds context from all 3 tiers → Injected into worker system prompt
2. **Worker works** → Records decisions/challenges to task memory in real-time
3. **Worker completes** → Useful task memory promoted to project memory
4. **Project memory grows** → Most valuable patterns promoted to global knowledge base
5. **Global knowledge** → Reused across all future projects automatically

**Integration with Master Agent**:

```typescript
// When spawning worker
async spawnWorker(masterSessionId: string, spec: OpenSpecSpec): Promise<WorkerSession> {
  const agentType = this.selectAgentType(spec);
  const basePrompt = this.buildSystemPrompt(agentType, spec);

  // Inject memory context
  const memoryContext = await memoryInjectionService.buildWorkerContext(
    spec.projectId,
    spec.id,
    agentType
  );

  const fullSystemPrompt = `${basePrompt}

---

${memoryContext}

---

Use the above memory context to inform your work. Follow established patterns.
Record any new discoveries or lessons learned.`;

  const worker = await this.sdkClient.createSubagent({
    systemPrompt: fullSystemPrompt,
    allowedTools: this.getToolsForAgentType(agentType),
    cwd: spec.projectPath,
    maxTokens: 150000
  });

  return worker;
}
```

**Example Global Knowledge Entry**:

```markdown
**Category**: pattern
**Key**: trpc_router_structure
**Title**: tRPC Router with Drizzle Query Pattern
**Content**:
\`\`\`typescript
// Standard pattern for tRPC router with Drizzle
export const userRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0)
    }))
    .query(async ({ input, ctx }) => {
      const users = await ctx.db.select()
        .from(usersTable)
        .limit(input.limit)
        .offset(input.offset);
      return users;
    }),

  create: protectedProcedure
    .input(insertUserSchema)
    .mutation(async ({ input, ctx }) => {
      const [user] = await ctx.db.insert(usersTable)
        .values(input)
        .returning();
      return user;
    })
});
\`\`\`
**Tags**: ["tRPC", "Drizzle", "Better-T-Stack", "CRUD"]
**Confidence**: 9/10
**Usage Count**: 47
**Success Rate**: 95%
```

**Alternatives Considered**:
1. **PostgreSQL instead of SQLite**
   - **Rejected**: Adds Docker container, network overhead, migration complexity, overkill for workload
2. **Separate database for memory**
   - **Rejected**: Complicates schema management, backups, foreign key relationships
3. **Redis for memory layer**
   - **Rejected**: Volatile storage, adds dependency, no structured queries, no persistence guarantees
4. **No global knowledge base (project-only memory)**
   - **Rejected**: Misses opportunity to learn cross-project patterns, wastes rediscovery time
5. **File-based memory (JSON/markdown files)**
   - **Rejected**: No structured queries, no ACID transactions, hard to search/filter

## Architecture

### Database Schema Additions

```typescript
// New table: errorTriage
export const errorTriage = sqliteTable('error_triage', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  testFailureId: integer('test_failure_id')
    .notNull()
    .references(() => testFailures.id, { onDelete: 'cascade' }),
  decision: text('decision', {
    enum: ['needs_spec', 'one_off_fix', 'ignore', 'pending']
  }).notNull().default('pending'),
  rationale: text('rationale'),
  priority: integer('priority').default(3), // 1-5, higher = more urgent
  assignedSessionId: integer('assigned_session_id')
    .references(() => sessions.id, { onDelete: 'set null' }),
  specChangeId: text('spec_change_id'), // Links to OpenSpec change if created
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// Extend sessions table with type
// (add column to existing schema)
session_type: text('session_type').default('manual').notNull(),
// Values: 'manual', 'spec_implementation', 'error_remediation'

metadata: text('metadata'), // JSON field for storing additional context

// Add indexes for quick lookups
// (in schema definition)
.addIndex('idx_triage_decision', ['decision', 'priority'])
.addIndex('idx_triage_failure', ['test_failure_id'])
```

### tRPC API Structure

```
packages/api/src/
├── services/
│   ├── openspec.ts - OpenSpecService class
│   ├── error-classifier.ts - ErrorClassifier class
│   └── project-scanner.ts - scanProjectsWithOpenSpec
├── router/
│   ├── openspec.ts
│   │   ├── listChanges({ projectId?, status? })
│   │   ├── showChange({ changeId, projectId })
│   │   ├── showSpec({ specId, projectId })
│   │   ├── createProposal({ projectId, title, description })
│   │   ├── archiveChange({ changeId, projectId })
│   │   └── subscribe({ projectId? }) - real-time spec events
│   ├── errors.ts
│   │   ├── listFailures({ projectId?, classification?, status? })
│   │   ├── triageFailure({ failureId, decision, rationale, priority })
│   │   ├── assignSession({ failureId, sessionId })
│   │   ├── classifyFailure({ failureId }) - runs classification service
│   │   └── subscribe({ projectId? }) - real-time failure events
│   ├── agents.ts
│   │   ├── listActive() - active sessions with latest activity
│   │   ├── getActivity({ sessionId }) - activity timeline for specific agent
│   │   ├── getMetrics({ sessionId? }) - performance metrics
│   │   └── subscribe({ sessionId? }) - stream real-time activity updates
│   └── work.ts
│       ├── listAll({ projectId?, filter? }) - combined specs + errors
│       ├── stats({ projectId? }) - aggregate counts by status
│       └── subscribe({ projectId? }) - combined real-time feed
```

### OpenSpec Service

```typescript
// packages/api/src/services/openspec.ts
export class OpenSpecService {
  constructor(private rootPath: string) {}

  async listChanges(): Promise<Change[]>;
  async readChange(id: string): Promise<ChangeWithDeltas>;
  async listSpecs(): Promise<Spec[]>;
  async readSpec(id: string): Promise<SpecWithRequirements>;
  async validateChange(id: string): Promise<ValidationResult>;
}

// Cached at application level
const serviceCache = new Map<string, OpenSpecService>();
```

### Classification Service

```typescript
// packages/api/src/services/error-classifier.ts
export class ErrorClassifier {
  async classify(failure: TestFailure, history: FailureHistory): Promise<Classification> {
    const rules = [
      this.checkPersistentFailure,
      this.checkRecurringPattern,
      this.checkFeatureKeywords,
      this.checkTestType,
    ];

    for (const rule of rules) {
      const result = await rule(failure, history);
      if (result) return result;
    }

    return { decision: 'pending', confidence: 0.5 };
  }

  private checkPersistentFailure(failure, history): Classification | null {
    if (history.consecutiveFailures >= 5) {
      return {
        decision: 'needs_spec',
        rationale: 'Persistent failure (100% failure rate over 5+ runs)',
        confidence: 0.95,
        priority: 5,
      };
    }
    return null;
  }

  // ... other rules
}
```

## Data Flow

### Playwright Failure → Triage → Remediation

```
1. Playwright Server detects test failure
   └─> Writes to `testFailures` table

2. Claude Agent Service watches for new failures (subscription)
   └─> Runs ErrorClassifier.classify()
   └─> Creates `errorTriage` record with decision

3. Dashboard displays new triaged error
   └─> User reviews decision
   └─> User starts remediation session OR creates spec proposal

4. If spec proposal:
   └─> Create OpenSpec change directory
   └─> Link errorTriage.specChangeId to change
   └─> Track in unified dashboard

5. If one-off fix:
   └─> Start Claude session
   └─> Link session to errorTriage via assignedSessionId
   └─> Track remediation in remediationAttempts table

### Agent Activity → Real-Time Display

```
1. Agent starts session
   └─> Session created with type='spec_implementation' or 'error_remediation'
   └─> agents.subscribe streams session_start event

2. Agent executes tool
   └─> pre_tool_use hook fires
   └─> send_event.py POSTs to hooks.ingest
   └─> Hook record created in database
   └─> agents.subscribe streams new hook event
   └─> Dashboard updates "Current Tool: [ToolName]"

3. Tool completes
   └─> post_tool_use hook fires
   └─> Hook record updated with duration, output, success
   └─> Dashboard updates with completion status
   └─> Metrics recalculated (tool count, success rate)

4. Agent idle detection
   └─> Background job checks last activity timestamp
   └─> If no activity for 5+ minutes, mark as idle
   └─> Dashboard shows "Idle for X minutes"

5. Session completes
   └─> Agent stops
   └─> Activity summary generated from hooks
   └─> Dashboard shows completion notification
   └─> Agent removed from active list
```

### OpenSpec Change → Implementation → Archive

```
1. User creates OpenSpec proposal (web UI or CLI)
   └─> Files written to openspec/changes/<id>/

2. Dashboard detects new change (file watcher subscription)
   └─> Displays in Specs tab

3. User starts implementation session
   └─> Creates session with type='spec_implementation'
   └─> Links session metadata to OpenSpec change ID

4. User completes implementation
   └─> Marks tasks as complete in tasks.md
   └─> Archives change via CLI or web UI
   └─> Moves to openspec/changes/archive/

5. Dashboard updates to show archived state
```

## Risks / Trade-offs

### Risk 1: Filesystem Performance

**Risk**: Reading OpenSpec from filesystem on every request could be slow.

**Mitigation**:
- Implement in-memory LRU cache with 5-minute TTL
- Use file watchers to invalidate cache on changes
- Pre-warm cache on server startup

**Acceptance Criteria**: <100ms response time for listing changes

### Risk 2: Classification Accuracy

**Risk**: Rule-based classifier may make wrong decisions (spec vs one-off).

**Mitigation**:
- All decisions are suggestions, require human approval
- Track decision accuracy over time (did spec get created? did fix work?)
- Iterate on rules based on feedback
- Add override mechanism in UI

**Acceptance Criteria**: >70% agreement with human decisions

### Risk 3: Multi-Project Coordination

**Risk**: Managing OpenSpec across multiple projects could be confusing.

**Mitigation**:
- Clear project selector in UI (persistent across sessions)
- Visual indicators showing which project you're viewing
- Project name in breadcrumbs and page titles

**Acceptance Criteria**: No accidental cross-project operations

### Risk 4: Database Schema Drift

**Risk**: Playwright server schema changes could break foreign keys.

**Mitigation**:
- Use Drizzle schema references with proper cascade rules
- Document dependency on Playwright schema in README
- Version lock Playwright server updates with agent updates

**Acceptance Criteria**: No runtime foreign key constraint violations

## Migration Plan

### Phase 1: OpenSpec Integration (Week 1)
1. Create OpenSpecService in API package
2. Add tRPC openspec router with read-only operations
3. Add Specs tab to dashboard
4. Test with single project (homelab-services)

### Phase 2: Error Triage (Week 2)
1. Create ErrorClassifier service in API package
2. Add errorTriage table schema
3. Add tRPC errors router
4. Add Errors tab to dashboard
5. Test with Playwright server failures

### Phase 3: Unified Dashboard (Week 3)
1. Create "All Work" combined view
2. Implement filtering and sorting
3. Add real-time subscriptions
4. Test end-to-end workflow

### Phase 4: Session Integration (Week 4)
1. Extend sessions table schema with session_type and metadata
2. Link sessions to specs and errors
3. Add session creation from dashboard
4. Test full remediation flow

### Rollback Plan
Each phase is independently deployable. If issues arise:
1. Feature flag to disable new tabs
2. Schema changes can be reverted by removing fields
3. No breaking changes to existing functionality
4. Can operate without OpenSpec integration if needed

## Open Questions

1. **Multi-instance coordination**: If multiple Claude agent instances run, how do we coordinate OpenSpec file access?
   - **Answer**: Use filesystem locks for write operations, read-only for most operations

2. **Project autodiscovery**: Should we scan for projects on startup or lazily?
   - **Answer**: Scan on startup, refresh on interval (5 minutes)

3. **Spec proposal templates**: Should we provide templates for common spec types?
   - **Answer**: Defer to future enhancement, use OpenSpec CLI templates for now

4. **Error thresholds**: What thresholds for RECURRING vs PERSISTENT?
   - **Answer**: RECURRING = 3+ occurrences, PERSISTENT = 5+ consecutive failures

5. **Session linking**: Should a session be able to work on multiple errors/specs?
   - **Answer**: No, one session = one work item for clarity. Can start multiple sessions.
