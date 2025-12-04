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
1. **Unified Visibility**: Single dashboard showing both specs and errors
2. **Intelligent Triage**: Automated classification of whether an error needs a spec or a quick fix
3. **Traceability**: Link Claude sessions to both spec implementation and error remediation
4. **Filesystem Integration**: Read OpenSpec directly from disk without duplication
5. **Project-Aware**: Support filtering and grouping by project across multiple codebases

### Non-Goals
1. **OpenSpec CLI Replacement**: Not building a new CLI tool, just integrating with existing one
2. **Playwright Server Replacement**: Not replacing Playwright server, just consuming its data
3. **AI-Powered Fixes**: Not auto-fixing errors, just triaging and tracking remediation
4. **Complex Spec Editing**: Web-based spec editing kept minimal (create/view/archive only)

## Decisions

### Decision 1: OpenSpec as Filesystem-Based, No Database Duplication

**What**: Read OpenSpec changes and specs directly from filesystem on each request, cache in memory only.

**Why**:
- OpenSpec files are the source of truth - duplicating to database risks drift
- Changes are infrequent enough that filesystem reads are acceptable
- Enables real-time reflection of spec changes without sync mechanisms
- Simpler architecture with fewer moving parts

**Alternatives Considered**:
1. **Database Sync**: Store OpenSpec in database, sync periodically
   - **Rejected**: Adds complexity, risks drift, requires sync logic
2. **Hybrid**: Index metadata in DB, full content from filesystem
   - **Rejected**: Still requires sync for metadata, minimal perf benefit
3. **File Watcher**: Monitor filesystem for changes
   - **Deferred**: Can add later if performance becomes issue

**Implementation**:
- tRPC procedures call filesystem utilities to parse OpenSpec
- Cache parsed results in memory (LRU cache with TTL)
- Support multiple OpenSpec roots (one per project)

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

### Decision 3: Classification Decision Engine as Rule-Based, Not ML

**What**: Use deterministic rules based on failure patterns to classify errors.

**Why**:
- Simple, explainable, maintainable
- Sufficient for current scale
- Can evolve rules based on experience
- No training data or model management overhead

**Rules**:
1. **NEW** failure → Candidate for one-off fix (might be environmental)
2. **FLAKY** (inconsistent) → Investigate root cause, possibly spec if behavioral
3. **RECURRING** (3+ times) → Strong candidate for spec (systematic issue)
4. **PERSISTENT** (100% failure rate) → Requires spec (broken functionality)

**Additional Heuristics**:
- Test file path contains "integration" or "e2e" → More likely needs spec
- Error message contains "feature not implemented" → Definitely needs spec
- Stacktrace in test setup/teardown → More likely one-off fix

**Future Enhancement**: Can add ML-based classification later if needed.

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
// (via migration, add column to existing table)
ALTER TABLE sessions ADD COLUMN session_type TEXT DEFAULT 'manual';
// Values: 'manual', 'spec_implementation', 'error_remediation'

// Add index for quick lookups
CREATE INDEX idx_triage_decision ON error_triage(decision, priority);
CREATE INDEX idx_triage_failure ON error_triage(test_failure_id);
```

### tRPC API Structure

```
api/
├── openspec/
│   ├── listChanges({ projectId?, status? })
│   ├── showChange({ changeId, projectId })
│   ├── showSpec({ specId, projectId })
│   ├── createProposal({ projectId, title, description })
│   ├── archiveChange({ changeId, projectId })
│   └── subscribe({ projectId? }) - real-time spec events
├── errors/
│   ├── listFailures({ projectId?, classification?, status? })
│   ├── triageFailure({ failureId, decision, rationale, priority })
│   ├── assignSession({ failureId, sessionId })
│   ├── classifyFailure({ failureId }) - runs classification engine
│   └── subscribe({ projectId? }) - real-time failure events
├── agents/
│   ├── listActive() - active sessions with latest activity
│   ├── getActivity({ sessionId }) - activity timeline for specific agent
│   ├── getMetrics({ sessionId? }) - performance metrics
│   └── subscribe({ sessionId? }) - stream real-time activity updates
└── work/
    ├── listAll({ projectId?, filter? }) - combined specs + errors
    ├── stats({ projectId? }) - aggregate counts by status
    └── subscribe({ projectId? }) - combined real-time feed
```

### Filesystem Utilities

```typescript
// packages/openspec-parser/src/
export class OpenSpecParser {
  constructor(private rootPath: string) {}

  async listChanges(): Promise<Change[]>;
  async readChange(id: string): Promise<ChangeWithDeltas>;
  async listSpecs(): Promise<Spec[]>;
  async readSpec(id: string): Promise<SpecWithRequirements>;
  async validateChange(id: string): Promise<ValidationResult>;
}

// Cached at application level
const parserCache = new Map<string, OpenSpecParser>();
```

### Classification Engine

```typescript
// packages/error-classifier/src/
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
1. Create OpenSpecParser utility package
2. Add tRPC openspec router with read-only operations
3. Add Specs tab to dashboard
4. Test with single project (homelab-services)

### Phase 2: Error Triage (Week 2)
1. Create ErrorClassifier utility package
2. Add errorTriage table and migrations
3. Add tRPC errors router
4. Add Errors tab to dashboard
5. Test with Playwright server failures

### Phase 3: Unified Dashboard (Week 3)
1. Create "All Work" combined view
2. Implement filtering and sorting
3. Add real-time subscriptions
4. Test end-to-end workflow

### Phase 4: Session Integration (Week 4)
1. Extend sessions table with session_type
2. Link sessions to specs and errors
3. Add session creation from dashboard
4. Test full remediation flow

### Rollback Plan
Each phase is independently deployable. If issues arise:
1. Feature flag to disable new tabs
2. Database migrations are reversible
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
