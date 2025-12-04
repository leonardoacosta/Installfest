# Change Split Notice

## Original Change: integrate-product-management

**Status**: **SPLIT INTO 6 SMALLER CHANGES**

This change was too large for single implementation (280+ tasks, 6-8 weeks). It has been split into 6 sequential changes following OpenSpec's "Simplicity First" principle.

## Split Changes (Implementation Order)

### 1. `1-add-openspec-sync`
**Focus**: Bidirectional filesystem ↔ database sync

**Why First**: Foundation for all other changes - enables database queries and UI editing

**Key Features**:
- File watcher (chokidar) for immediate sync
- Periodic batch sync for archives
- Conflict resolution (filesystem wins)
- Sync audit trail

**Estimated Timeline**: 1-2 weeks

---

### 2. `2-add-spec-lifecycle`
**Focus**: 7-state lifecycle workflow with manual approval gates

**Depends On**: 1-add-openspec-sync

**Key Features**:
- States: proposing → approved → assigned → in_progress → review → applied → archived
- Manual gates: proposing → approved, review → applied
- Automatic transitions on task completion
- Applied spec tracking per project

**Estimated Timeline**: 1 week

---

### 3. `3-add-work-queue-sessions`
**Focus**: Work queue management for manual Claude Code sessions

**Depends On**: 1-add-openspec-sync, 2-add-spec-lifecycle

**Key Features**:
- Work queue table with priority and dependencies
- Session heartbeat monitoring (10-minute timeout)
- Manual session spawning (user-controlled parallelism)
- Work queue dashboard tab

**Estimated Timeline**: 1-2 weeks

---

### 4. `4-add-worker-coordination`
**Focus**: Worker agent spawning and progress monitoring

**Depends On**: 1-3

**Key Features**:
- Agent type selection (t3-stack-developer, e2e-test-engineer, etc.)
- Task tool integration for worker spawning
- Progress tracking via hooks
- Retry logic on failure

**Estimated Timeline**: 1-2 weeks

---

### 5. `5-add-error-proposals`
**Focus**: Auto-generate spec proposals from Playwright errors

**Depends On**: 1-3 (can parallelize with 4)

**Key Features**:
- All errors → spec proposals (no one-off fixes)
- Priority calculation (PERSISTENT=5, RECURRING=4, FLAKY=3, NEW=2)
- Duplicate detection and linking
- Priority escalation on recurrence

**Estimated Timeline**: 1 week

---

### 6. `6-add-work-dashboard`
**Focus**: Unified dashboard UI with spec editor

**Depends On**: 1-5

**Key Features**:
- 6 dashboard tabs (Work Queue, Approvals, Master Agents, Lifecycle, Specs, Errors)
- Full spec editor with Monaco (split view, conflict resolution)
- Master agent control panel
- Real-time notifications and subscriptions

**Estimated Timeline**: 2 weeks

---

## Implementation Order

**Critical Path**: 1 → 2 → 3 → (4 + 5 in parallel) → 6

**Total Estimated Timeline**: 6-8 weeks (same as original, but incremental delivery)

## Benefits of Splitting

1. **Incremental Delivery**: Each change delivers value independently
2. **Easier Testing**: Smaller changes easier to test and validate
3. **Reduced Risk**: Failures isolated to smaller scope
4. **Better Reviews**: Reviewers can focus on one aspect at a time
5. **OpenSpec Compliance**: Follows "Simplicity First" principle

## Original Files

Original proposal, design, and tasks preserved in this directory for reference:
- `proposal.md` - Full original proposal
- `design.md` - All architectural decisions
- `tasks.md` - Complete 280+ task breakdown

## Next Steps

1. Implement changes in numbered order (1 → 2 → 3 → 4 → 5 → 6)
2. Use `/openspec:apply [change-id]` for each change individually
3. Archive each change after deployment before starting next
4. Final step: Archive this split notice when all 6 changes complete

## Validation

Each split change can be validated independently:

```bash
openspec validate 1-add-openspec-sync --strict
openspec validate 2-add-spec-lifecycle --strict
openspec validate 3-add-work-queue-sessions --strict
openspec validate 4-add-worker-coordination --strict
openspec validate 5-add-error-proposals --strict
openspec validate 6-add-work-dashboard --strict
```
