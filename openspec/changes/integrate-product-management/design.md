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

### Decision 11: Subscription-Based Claude Code Sessions (Not API/SDK)

**What**: Use manual Claude Code sessions (covered by existing Max subscription) instead of Claude Agent SDK or Task tool to avoid API costs.

**Why - Cost Analysis**:
- **Max 20x subscription**: $200/month (already paid)
- **API usage (November 2025)**: $1,742.71/month (8.7x subscription cost!)
- **Savings**: $1,542.71/month by using subscription instead of API
- **Break-even**: Never - subscription always cheaper for this use case

**Architecture**:
- **Master agent** = Long-running Claude Code session per project (free on subscription)
- **Worker agents** = Additional Claude Code sessions spawned manually as needed (free on subscription)
- **Coordination** = Database + tRPC endpoints for work queue management
- **Session polling** = Sessions query work queue via tRPC, self-assign tasks

**How It Works**:

```bash
# User opens terminal sessions manually

# Terminal 1: Master for Project A
claude --project ~/dev/project-a
> "Review work queue and process next approved spec"

# Terminal 2: Worker for Project A (if needed for parallelism)
claude --project ~/dev/project-a
> "Get next queued spec and implement it"

# Terminal 3: Master for Project B
claude --project ~/dev/project-b
> "Monitor queue and process specs"
```

**Work Queue Coordination**:
```typescript
// packages/api/src/router/work-queue.ts
export const workQueueRouter = createTRPCRouter({
  // Session polls this to get next work item
  getNextSpec: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Find highest priority approved spec not yet assigned
      const nextSpec = await ctx.db.select()
        .from(openspecSpecs)
        .where(and(
          eq(openspecSpecs.projectId, input.projectId),
          eq(openspecSpecs.status, 'approved')
        ))
        .orderBy(desc(openspecSpecs.priority))
        .limit(1);

      if (nextSpec.length === 0) return null;

      // Assign to this session
      const sessionId = ctx.session?.id; // From Claude Code session context
      await ctx.db.update(openspecSpecs)
        .set({
          status: 'assigned',
          assignedSessionId: sessionId,
          assignedAt: new Date()
        })
        .where(eq(openspecSpecs.id, nextSpec[0].id));

      return nextSpec[0];
    }),

  // Session calls this when work complete
  markComplete: publicProcedure
    .input(z.object({
      specId: z.string(),
      result: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.update(openspecSpecs)
        .set({
          status: 'review',
          completedAt: new Date(),
          result: input.result
        })
        .where(eq(openspecSpecs.id, input.specId));
    })
});
```

**Session Workflow**:

1. **User approves spec** in dashboard → Status: `proposing` → `approved`
2. **User opens Claude Code session** for project
3. **Session queries queue**: `curl http://localhost:3002/trpc/workQueue.getNextSpec?projectId=1`
4. **Session receives spec** with full context (proposal.md, tasks.md, design.md)
5. **Session implements spec** using normal Claude Code capabilities
6. **Session reports completion**: `curl -X POST http://localhost:3002/trpc/workQueue.markComplete`
7. **Repeat** - Session gets next spec from queue

**Dashboard Integration**:
- Shows which sessions are active per project
- User can spawn additional sessions for parallelism
- No programmatic session spawning - user controls all sessions manually

**Cost Comparison**:

| Approach | Monthly Cost | Tokens | Notes |
|----------|--------------|--------|-------|
| **Claude Agent SDK** | $1,742.71 | ~2.28B | API charges per token |
| **Task Tool** | $1,500+ | ~2B+ | API charges + 20k overhead/agent |
| **Claude Code Sessions** | **$0** | Unlimited* | Max subscription covers all usage |

*Limited by Max 20x capacity: ~20x Pro limits per session

**Alternatives Considered**:
1. **Claude Agent SDK** (previous design)
   - **Rejected**: $1,542.71/month wasted when subscription already paid
2. **Task tool**
   - **Rejected**: Still uses API (costs money), plus 10-agent limit
3. **Fully automated SDK orchestration**
   - **Rejected**: Cool but costs 8.7x more than subscription
4. **Hybrid: API for master, sessions for workers**
   - **Rejected**: Still incurs API costs unnecessarily

**Trade-off Accepted**:
- **Manual session spawning** - User opens terminals/sessions as needed
- **Less automation** - No programmatic agent spawning
- **Simpler architecture** - Standard Claude Code sessions, no SDK complexity
- **$1,542/month savings** - Worth the manual effort

### Decision 12: Manual Session Management (User-Controlled Parallelism)

**What**: User manually opens Claude Code sessions as needed for parallelism, rather than programmatic resource allocation.

**Why**:
- **No API costs**: All sessions covered by Max subscription ($0 incremental cost)
- **User control**: User decides when to spawn workers based on actual workload
- **Max capacity constraint**: Max 20x subscription has capacity limits, so user manages within those bounds
- **Simpler architecture**: No complex resource allocator, just track active sessions in database

**How It Works**:

```bash
# User observes workload in dashboard
# Sees 5 approved specs for Project A, 3 for Project B

# Opens sessions based on priority:
# Terminal 1: Project A master
claude --project ~/dev/project-a

# Terminal 2: Project A worker (for parallelism)
claude --project ~/dev/project-a

# Terminal 3: Project B master
claude --project ~/dev/project-b

# Each session polls work queue independently
# Database tracks which session has which spec (prevents conflicts)
```

**Session Registration**:
```typescript
// packages/api/src/router/sessions.ts
export const sessionsRouter = createTRPCRouter({
  // Session calls this on startup
  register: publicProcedure
    .input(z.object({
      projectId: z.number(),
      sessionType: z.enum(['master', 'worker']),
      metadata: z.any()
    }))
    .mutation(async ({ input, ctx }) => {
      const session = await ctx.db.insert(sessions).values({
        projectId: input.projectId,
        sessionType: input.sessionType,
        status: 'active',
        lastHeartbeat: new Date(),
        metadata: JSON.stringify(input.metadata)
      }).returning();

      return session[0];
    }),

  // Session calls this every 5 minutes
  heartbeat: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.update(sessions)
        .set({ lastHeartbeat: new Date() })
        .where(eq(sessions.id, input.sessionId));
    })
});
```

**Dashboard Visibility**:
- Shows active sessions per project
- User sees: "Project A: 2 active sessions, 5 specs queued"
- User decides: "I'll open one more worker session"
- No automatic spawning - user-driven

**Recommended Parallelism**:
- **1 session**: Projects with light workload (1-2 specs)
- **2-3 sessions**: Projects with moderate workload (3-10 specs)
- **4+ sessions**: High-priority projects with large queue (10+ specs)

**Max Subscription Capacity Management**:
- Max 20x = ~20x Pro capacity per 5-hour window
- User monitors usage via `ccm` (claude-monitor)
- If approaching limits, close inactive sessions
- Prioritize high-value work

**Alternatives Considered**:
1. **Programmatic session spawning** (original SDK design)
   - **Rejected**: Costs $1,542/month in API charges
2. **Single session per project** (no parallelism)
   - **Rejected**: Too slow for projects with large queues
3. **Fixed allocation** (always 3 sessions per project)
   - **Rejected**: Wastes subscription capacity on inactive projects
4. **Automatic session spawning based on queue depth**
   - **Rejected**: Complex automation not worth it when manual spawning is free and effective

### Decision 13: Session Lifecycle & Cleanup (Heartbeat Monitoring)

**What**: Implement heartbeat monitoring (10-minute intervals) to detect stale Claude Code sessions and clean up abandoned work assignments.

**Why**:
- **Detect dead sessions**: Sessions that crash or user closes terminal without completing work
- **Release stuck specs**: Specs assigned to dead sessions can be reassigned to active sessions
- **Dashboard accuracy**: Show only truly active sessions in dashboard
- **No token budget needed**: Subscription has no per-token costs, only capacity limits monitored via `ccm`

**Heartbeat Monitoring**:
```typescript
// packages/api/src/services/session-monitor.ts
export class SessionMonitor {
  // Runs every 2 minutes as background job
  async cleanupStaleSessions(): Promise<void> {
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

    // Find sessions with no heartbeat in 10+ minutes
    const staleSessions = await db.select()
      .from(sessions)
      .where(and(
        eq(sessions.status, 'active'),
        lt(sessions.lastHeartbeat, staleThreshold)
      ));

    for (const session of staleSessions) {
      console.warn(`Detected stale session: ${session.id} (project ${session.projectId})`);

      // Mark session as inactive
      await db.update(sessions)
        .set({
          status: 'inactive',
          endedAt: new Date()
        })
        .where(eq(sessions.id, session.id));

      // Release any specs assigned to this session
      const assignedSpecs = await db.select()
        .from(openspecSpecs)
        .where(and(
          eq(openspecSpecs.assignedSessionId, session.id),
          inArray(openspecSpecs.status, ['assigned', 'in_progress'])
        ));

      for (const spec of assignedSpecs) {
        console.info(`Releasing spec ${spec.id} back to queue`);

        // Reset to approved so another session can pick it up
        await db.update(openspecSpecs)
          .set({
            status: 'approved',
            assignedSessionId: null,
            assignedAt: null
          })
          .where(eq(openspecSpecs.id, spec.id));
      }
    }
  }

  // Start background monitor
  startMonitoring(): void {
    setInterval(() => {
      this.cleanupStaleSessions().catch(err => {
        console.error('Session cleanup error:', err);
      });
    }, 2 * 60 * 1000); // Every 2 minutes
  }
}
```

**Session Heartbeat Protocol**:
```typescript
// Claude Code sessions call this every 5 minutes
// Can be manual: curl http://localhost:3002/trpc/sessions.heartbeat?sessionId=123
// Or automated via cron in terminal: watch -n 300 'curl ...'

export const sessionsRouter = createTRPCRouter({
  heartbeat: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.update(sessions)
        .set({ lastHeartbeat: new Date() })
        .where(eq(sessions.id, input.sessionId));

      return { success: true };
    })
});
```

**Dashboard Indicators**:
- 🟢 **Active** - Heartbeat within 5 minutes
- 🟡 **Slow** - Heartbeat within 5-10 minutes (warning)
- 🔴 **Stale** - No heartbeat >10 minutes (will be cleaned up)

**Cleanup Triggers**:
1. **Heartbeat timeout** (>10 min no heartbeat) → Mark session inactive, release assigned specs
2. **User closes terminal** → Session stops sending heartbeats, auto-cleanup after 10 minutes
3. **Manual session end** → User calls `sessions.end` endpoint, immediate cleanup
4. **Capacity management** → User monitors via `ccm`, closes low-priority sessions if hitting limits

**Dashboard Schema Updates**:
```typescript
// Extend sessions table
export const sessions = sqliteTable('sessions', {
  // ... existing fields
  lastHeartbeat: integer('last_heartbeat', { mode: 'timestamp' }),
  status: text('status', {
    enum: ['active', 'inactive', 'ended']
  }).default('active'),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  sessionType: text('session_type', {
    enum: ['master', 'worker']
  }).default('worker')
});
```

**Alternatives Considered**:
1. **No heartbeat monitoring** (trust user to clean up)
   - **Rejected**: Crashed sessions would leave specs stuck indefinitely
2. **Manual cleanup only** (user marks sessions as done)
   - **Rejected**: User forgets to mark done, specs get stuck
3. **Shorter heartbeat interval** (1 minute)
   - **Rejected**: Too noisy, 10 minutes is sufficient for detecting crashes
4. **Token budget enforcement** (from SDK approach)
   - **Rejected**: Not relevant for subscription-based approach, no per-token costs

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
