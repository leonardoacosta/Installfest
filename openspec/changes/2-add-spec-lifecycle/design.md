# Design: Spec Lifecycle Management

## Context

OpenSpec specifications currently exist as static files without state tracking. Users cannot tell which specs are awaiting approval, actively being implemented, or ready for deployment. This creates workflow confusion and makes it impossible to build automation on top of specs.

### Stakeholders
- Developers implementing specs
- Project managers tracking work status
- Automation systems (future master agents, workers)
- Dashboard UI for displaying spec status

### Constraints
- Must work with existing OpenSpec filesystem structure (specs remain files)
- Must support both manual and automated workflows
- Must provide clear approval gates for human decision points
- Must maintain complete audit trail for compliance

## Goals / Non-Goals

### Goals
1. **7-State Workflow**: Clear progression from proposal through implementation to archive
2. **Manual Approval Gates**: Human approval required at critical decision points
3. **Automatic Transitions**: Specs advance automatically when objective criteria met
4. **State History**: Complete audit trail of all transitions
5. **Applied Spec Tracking**: Track which specs implemented in which projects

### Non-Goals
1. **Parallel States**: No concurrent states (e.g., "in_progress + review" simultaneously)
2. **State Rollback**: No undo/revert transitions (except reject to proposing)
3. **Multi-Project Specs**: Specs belong to single project, not shared across projects
4. **Automated Approvals**: Manual gates always require human action

## Decisions

### Decision 1: 7-State Lifecycle with Manual Approval Gates

**What**: Specs progress through 7 states with 2 manual gates requiring user approval. Other transitions automatic.

**States**:
1. **proposing**: Auto-generated from errors or manually created, awaiting review
2. **approved**: User approved, waiting for worker assignment
3. **assigned**: Worker assigned, preparing to spawn/start
4. **in_progress**: Worker actively implementing
5. **review**: All tasks complete, awaiting user validation
6. **applied**: User confirmed implementation successful, tests pass
7. **archived**: Moved to archive/ directory, complete

**Manual Gates** (require user action):
- **proposing → approved**: User reviews proposal, clicks "Approve" or "Reject"
- **review → applied**: User validates implementation, runs tests, confirms success

**Automatic Transitions**:
- **approved → assigned**: Worker picks up from queue
- **assigned → in_progress**: Worker starts first task (first tool execution)
- **in_progress → review**: Last task marked [x] complete in tasks.md
- **applied → archived**: User triggers archive action (runs `openspec archive`)

**Why**:
- **Proposing → Approved Gate**: Prevents auto-implementation of bad ideas, allows proposal refinement
- **Review → Applied Gate**: Ensures tests pass, allows user to verify quality before marking done
- **Automatic Transitions**: No user value in manually clicking through objective criteria

**Alternatives Considered**:
1. **Simple 3-state (todo/doing/done)**: Too coarse, loses visibility
   - **Rejected**: Can't distinguish approved vs assigned, review vs applied
2. **All transitions manual**: Maximum control
   - **Rejected**: Too much clicking, slows down automation
3. **No manual gates (fully automatic)**: Maximum speed
   - **Rejected**: Risky, no human review of proposals or completions

**Implementation**:
```typescript
// State transition validation
const allowedTransitions: Record<SpecStatus, SpecStatus[]> = {
  proposing: ['approved', 'proposing'], // Can reject back to proposing
  approved: ['assigned', 'proposing'], // Can revert to proposing
  assigned: ['in_progress', 'proposing'],
  in_progress: ['review', 'proposing'],
  review: ['applied', 'in_progress'], // Can send back for more work
  applied: ['archived'],
  archived: [], // Terminal state
};

export class TransitionRulesEngine {
  validateTransition(from: SpecStatus, to: SpecStatus): boolean {
    return allowedTransitions[from].includes(to);
  }

  isManualGate(from: SpecStatus, to: SpecStatus): boolean {
    return (from === 'proposing' && to === 'approved') ||
           (from === 'review' && to === 'applied');
  }
}
```

**State History Tracking**:
```typescript
export const specLifecycle = sqliteTable('spec_lifecycle', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  specId: text('spec_id').references(() => openspecSpecs.id),
  fromState: text('from_state'), // nullable for initial state
  toState: text('to_state').notNull(),
  triggeredBy: text('triggered_by'), // 'user', 'worker', 'system'
  triggerUserId: integer('trigger_user_id'), // If user action
  triggerSessionId: integer('trigger_session_id'), // If worker action
  transitionedAt: integer('transitioned_at', { mode: 'timestamp' }),
  notes: text('notes'), // Optional context about transition
});
```

### Decision 2: Automatic Transition on Task Completion

**What**: When all tasks in tasks.md are marked `[x]` complete, automatically transition from `in_progress` to `review`.

**Why**:
- **Objective Criterion**: Task completion is binary, no judgment needed
- **Immediate Feedback**: User sees spec move to review instantly
- **Reduces Friction**: No manual clicking required for obvious transition
- **Audit Trail**: Automatic transition logged with triggering worker session

**Detection Logic**:
```typescript
export class SpecLifecycleService {
  async checkTasksComplete(specId: string): Promise<boolean> {
    const spec = await db.query.openspecSpecs.findFirst({
      where: eq(openspecSpecs.id, specId)
    });

    if (!spec || !spec.tasksContent) return false;

    // Parse tasks.md markdown
    const lines = spec.tasksContent.split('\n');
    const taskLines = lines.filter(line => /^- \[[x ]\]/.test(line.trim()));

    if (taskLines.length === 0) return false; // No tasks

    const completedTasks = taskLines.filter(line => /^- \[x\]/.test(line.trim()));

    // All tasks complete if every task line has [x]
    return completedTasks.length === taskLines.length;
  }

  async triggerAutomaticTransitions(): Promise<void> {
    const inProgressSpecs = await db.query.openspecSpecs.findMany({
      where: eq(openspecSpecs.status, 'in_progress')
    });

    for (const spec of inProgressSpecs) {
      const tasksComplete = await this.checkTasksComplete(spec.id);

      if (tasksComplete) {
        await this.transitionState(
          spec.id,
          'review',
          'system',
          'All tasks marked complete'
        );
      }
    }
  }
}

// Background job runs every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  await lifecycleService.triggerAutomaticTransitions();
});
```

**Alternatives Considered**:
1. **Manual transition only**: User must click "Move to Review"
   - **Rejected**: Extra friction, users will forget
2. **Real-time detection**: Transition immediately on last checkbox
   - **Rejected**: Requires websocket from UI to trigger, complex
3. **Webhook from worker**: Worker signals completion
   - **Rejected**: Couples lifecycle to worker implementation

### Decision 3: Applied Spec Tracking Per Project

**What**: Track which specs have been implemented in each project with verification status.

**Why**:
- **Cross-Project Specs**: Same spec may be applied to multiple projects
- **Verification Tracking**: Know if tests passed after implementation
- **Rollback Planning**: If spec fails, know which projects affected
- **Audit Compliance**: Complete record of what was deployed where

**Implementation**:
```typescript
export const appliedSpecs = sqliteTable('applied_specs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  specId: text('spec_id').notNull().references(() => openspecSpecs.id),
  projectId: integer('project_id').notNull().references(() => projects.id),
  appliedAt: integer('applied_at', { mode: 'timestamp' }),
  appliedBy: integer('applied_by').references(() => sessions.id), // Session that applied
  verificationStatus: text('verification_status', {
    enum: ['pending', 'tests_passed', 'tests_failed']
  }).default('pending'),
  verificationNotes: text('verification_notes'),
}, (table) => ({
  uniqueProjectSpec: uniqueIndex('unique_project_spec').on(table.projectId, table.specId),
}));

export class SpecLifecycleService {
  async markApplied(
    specId: string,
    projectId: number,
    appliedBy: number,
    verificationNotes?: string
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Transition spec to applied state
      await this.transitionState(specId, 'applied', 'user', verificationNotes);

      // Record in appliedSpecs table
      await tx.insert(appliedSpecs).values({
        specId,
        projectId,
        appliedAt: new Date(),
        appliedBy,
        verificationStatus: 'pending',
        verificationNotes,
      });
    });
  }

  async updateVerification(
    specId: string,
    projectId: number,
    status: 'tests_passed' | 'tests_failed',
    notes?: string
  ): Promise<void> {
    await db.update(appliedSpecs)
      .set({
        verificationStatus: status,
        verificationNotes: notes,
      })
      .where(and(
        eq(appliedSpecs.specId, specId),
        eq(appliedSpecs.projectId, projectId)
      ));
  }
}
```

**Alternatives Considered**:
1. **Single applied flag on spec**: No per-project tracking
   - **Rejected**: Loses information about which projects have this spec
2. **Verification in spec state**: Applied = tests passed
   - **Rejected**: Prevents tracking multiple applications with different results
3. **No verification tracking**: Just record applied date
   - **Rejected**: Users want to know if tests passed

### Decision 4: Reject as State Reversion

**What**: Rejection returns spec to `proposing` state rather than creating a separate "rejected" state.

**Why**:
- **Simplicity**: Fewer states to manage, clearer workflow
- **Iterative Improvement**: User can edit proposal and resubmit for approval
- **No Terminal Rejection**: Specs aren't permanently rejected, just need more work
- **Audit Trail**: Rejection recorded in lifecycle history with reason

**Implementation**:
```typescript
export class SpecLifecycleService {
  async reject(specId: string, reason: string, userId: number): Promise<void> {
    const spec = await db.query.openspecSpecs.findFirst({
      where: eq(openspecSpecs.id, specId)
    });

    if (!spec) throw new Error(`Spec ${specId} not found`);

    // Transition back to proposing with rejection reason
    await this.transitionState(
      specId,
      'proposing',
      'user',
      `Rejected: ${reason}`,
      userId
    );

    // Create notification for user
    await createNotification({
      type: 'spec_rejected',
      message: `Spec ${spec.title} was rejected: ${reason}`,
      actionUrl: `/dashboard/spec/${specId}`,
    });
  }
}
```

**Alternatives Considered**:
1. **Separate "rejected" state**: Terminal rejection state
   - **Rejected**: Creates dead-end specs, no path to recovery
2. **Delete rejected specs**: Remove from database
   - **Rejected**: Loses audit trail, can't see why rejected
3. **Archive rejected specs immediately**: Move to archive/
   - **Rejected**: Prevents iteration on rejected proposals

## Risks / Trade-offs

### Risk 1: Task Completion Detection Accuracy

**Risk**: Parsing tasks.md for `[x]` may fail on malformed markdown.

**Mitigation**:
- Strict tasks.md format in documentation
- Validation on sync: Warn if tasks.md malformed
- Graceful failure: Log error, don't crash background job
- Manual override: User can force transition if detection fails

**Acceptance Criteria**: >95% accurate detection on well-formed tasks.md

### Risk 2: Automatic Transition Delay

**Risk**: Background job runs every 30 seconds, so transitions delayed.

**Mitigation**:
- 30 seconds acceptable for most workflows
- User can manually trigger transition if urgent
- Dashboard shows "Tasks complete, awaiting auto-transition" indicator
- Consider real-time detection in future if needed

**Acceptance Criteria**: 90% of automatic transitions happen within 60 seconds

### Risk 3: State Machine Complexity

**Risk**: 7 states + manual gates + automatic transitions may confuse users.

**Mitigation**:
- Visual state diagram in documentation
- Dashboard shows next steps clearly ("Awaiting approval", "Ready to implement")
- Lifecycle history provides transparency
- Start simple, add complexity only if needed

**Acceptance Criteria**: Users understand workflow without extensive training

### Risk 4: Applied Spec Tracking Overhead

**Risk**: Tracking every application adds database overhead.

**Mitigation**:
- Single insert per application, minimal overhead
- Indexes on projectId + specId for fast lookups
- Verification updates are infrequent
- Optional feature, can be disabled if not needed

**Acceptance Criteria**: <10ms query time for applied specs per project

## Migration Plan

### Phase 1: Schema Updates
1. Add status field to openspecSpecs table (default 'proposing')
2. Create specLifecycle table
3. Create appliedSpecs table
4. Existing specs default to 'proposing' status

### Phase 2: Service Deployment
1. Deploy TransitionRulesEngine and SpecLifecycleService
2. Start background job for automatic transitions
3. Monitor logs for transitions

### Phase 3: API Deployment
1. Deploy lifecycle tRPC router
2. Test manual transitions via API
3. Verify subscriptions working

### Phase 4: User Testing
1. Walk test spec through full lifecycle
2. Verify manual gates block progression
3. Verify automatic transitions work
4. Test rejection workflow

### Rollback Plan
- Feature flag to disable lifecycle management
- Default status='proposing' allows existing functionality
- Background job can be stopped without breaking anything
- No breaking changes to existing code

## Open Questions

1. **State timeout**: Should specs automatically timeout if stuck in one state too long?
   - **Answer**: Defer to Phase 2 - add notifications for stale specs

2. **Parallel review**: Can multiple reviewers approve simultaneously?
   - **Answer**: No - single approval gate, first reviewer wins

3. **Partial completion**: What if some tasks marked [x] but not all?
   - **Answer**: Show completion percentage, but don't auto-transition until 100%

4. **Applied to multiple projects**: If spec applied to project A, does it auto-apply to project B?
   - **Answer**: No - each project must explicitly apply the spec
