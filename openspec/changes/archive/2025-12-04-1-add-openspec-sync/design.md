# Design: OpenSpec Bidirectional Sync

## Context

The Claude agent service needs to manage OpenSpec specifications through a web UI while maintaining full compatibility with the OpenSpec CLI. Specs must remain git-trackable, diffable, and human-editable on the filesystem.

### Stakeholders
- Developers using Claude agent for implementation
- OpenSpec CLI for validation and archiving
- Web UI for spec editing and management
- File watcher for real-time updates

### Constraints
- Filesystem is source of truth (git-tracked, OpenSpec CLI compatible)
- Database enables querying, filtering, work queue management
- Must handle concurrent edits (filesystem vs DB)
- Must work with existing Better-T-Stack architecture (tRPC, Drizzle, Zod)

## Goals / Non-Goals

### Goals
1. **Bidirectional Sync**: OpenSpec files ↔ Database with filesystem as source of truth
2. **Immediate Sync for Active Work**: File watcher triggers instant sync for active specs
3. **Periodic Sync for Archives**: Batch sync archived specs every 30 seconds
4. **Conflict Resolution**: Clear strategy when both filesystem and DB modified
5. **Queryable Spec Data**: Enable filtering, sorting, searching specs in database
6. **Atomic Operations**: Transaction safety for all sync operations

### Non-Goals
1. **OpenSpec CLI Replacement**: Still use OpenSpec CLI for validation and complex operations
2. **Version Control Integration**: Not managing git commits/branches
3. **Multi-User Locking**: No filesystem locks, conflicts resolved via timestamps
4. **Real-Time Collaboration**: Not building Google Docs-style concurrent editing

## Decisions

### Decision 1: Bidirectional Sync with Filesystem as Source of Truth

**What**: Sync OpenSpec files ↔ Database with hybrid sync strategy: immediate for active specs, periodic for archived. Filesystem always wins on conflicts.

**Why**:
- **Database enables work queue**: Need queryable structured data for prioritization
- **UI editing requires DB**: Can't efficiently edit files through web UI without DB layer
- **Lifecycle state tracking**: Track spec states (proposing→approved→etc.) separate from file state
- **Filesystem = source of truth**: Git-trackable, diffable, OpenSpec CLI compatible

**Sync Strategy**:
- **Filesystem → DB (Immediate)**: File watcher (chokidar) syncs active specs instantly
- **Filesystem → DB (Periodic)**: Batch sync archived/inactive specs every 30 seconds
- **DB → Filesystem**: UI edits write to DB, then immediately flush to filesystem
- **Conflict Resolution**: Filesystem always wins - discard DB changes if both modified

**Alternatives Considered**:
1. **Filesystem-only**: Read from disk on every request, no DB
   - **Rejected**: Can't query/filter efficiently, no work queue, poor performance
2. **Database-only**: Store in DB, generate files on demand
   - **Rejected**: Loses git history, breaks OpenSpec CLI, not human-editable
3. **Last-write-wins conflicts**: Keep most recent edit
   - **Rejected**: Filesystem is source of truth per requirements

**Implementation**:
```typescript
// packages/api/src/services/openspec-sync.ts
export class OpenSpecSyncService {
  // Filesystem → DB
  async syncFromFilesystem(projectId: string, specId: string, immediate = false): Promise<void> {
    const filesystemContent = await this.readOpenSpecFiles(projectId, specId);
    const filesystemMtime = await this.getFileMtime(filesystemContent.proposalPath);

    await db.transaction(async (tx) => {
      await tx.insert(openspecSpecs).values({
        id: specId,
        projectId,
        proposalContent: filesystemContent.proposal,
        tasksContent: filesystemContent.tasks,
        designContent: filesystemContent.design,
        filesystemModifiedAt: filesystemMtime,
        lastSyncedAt: new Date(),
      }).onConflictDoUpdate({
        target: openspecSpecs.id,
        set: {
          proposalContent: filesystemContent.proposal,
          tasksContent: filesystemContent.tasks,
          designContent: filesystemContent.design,
          filesystemModifiedAt: filesystemMtime,
          lastSyncedAt: new Date(),
        }
      });

      await tx.insert(syncHistory).values({
        specId,
        syncDirection: 'fs_to_db',
        triggeredBy: immediate ? 'file_watcher' : 'periodic',
        success: true,
        syncedAt: new Date(),
      });
    });
  }

  // DB → Filesystem
  async syncToFilesystem(specId: string): Promise<void> {
    const spec = await db.query.openspecSpecs.findFirst({
      where: eq(openspecSpecs.id, specId)
    });

    if (!spec) throw new Error(`Spec ${specId} not found`);

    // Check for conflicts
    const conflict = await this.detectConflicts(specId);
    if (conflict) {
      throw new ConflictError(`Spec ${specId} has conflicts. Resolve before syncing.`);
    }

    await db.transaction(async (tx) => {
      // Atomic write with backup
      await this.writeOpenSpecFiles(spec);

      await tx.update(openspecSpecs)
        .set({
          lastSyncedAt: new Date(),
          dbModifiedAt: new Date()
        })
        .where(eq(openspecSpecs.id, specId));

      await tx.insert(syncHistory).values({
        specId,
        syncDirection: 'db_to_fs',
        triggeredBy: 'user_edit',
        success: true,
        syncedAt: new Date(),
      });
    });
  }

  // Detect conflicts (both changed since last sync)
  async detectConflicts(specId: string): Promise<Conflict | null> {
    const spec = await db.query.openspecSpecs.findFirst({
      where: eq(openspecSpecs.id, specId)
    });

    if (!spec) return null;

    const filesystemMtime = await this.getFileMtime(spec.projectId, specId);

    // Conflict = both modified after last sync
    const filesystemChanged = filesystemMtime > spec.lastSyncedAt;
    const dbChanged = spec.dbModifiedAt > spec.lastSyncedAt;

    if (filesystemChanged && dbChanged) {
      return {
        specId,
        filesystemModifiedAt: filesystemMtime,
        dbModifiedAt: spec.dbModifiedAt,
        lastSyncedAt: spec.lastSyncedAt,
      };
    }

    return null;
  }

  // Force filesystem version to DB (resolve conflict)
  async forceFilesystemWins(specId: string): Promise<void> {
    await this.syncFromFilesystem(specId, immediate: true);
  }
}
```

**Database Schema**:
```typescript
export const openspecSpecs = sqliteTable('openspec_specs', {
  id: text('id').primaryKey(), // Change ID from filesystem
  projectId: integer('project_id').references(() => projects.id),
  title: text('title').notNull(),
  status: text('status').default('proposing'), // For future lifecycle management
  proposalContent: text('proposal_content'), // Full proposal.md markdown
  tasksContent: text('tasks_content'), // Full tasks.md markdown
  designContent: text('design_content'), // Full design.md markdown (nullable)
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
  filesystemModifiedAt: integer('filesystem_modified_at', { mode: 'timestamp' }),
  dbModifiedAt: integer('db_modified_at', { mode: 'timestamp' }),
  syncError: text('sync_error'), // Last sync error message if any
});

export const syncHistory = sqliteTable('sync_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  specId: text('spec_id').references(() => openspecSpecs.id),
  syncDirection: text('sync_direction', { enum: ['fs_to_db', 'db_to_fs'] }),
  triggeredBy: text('triggered_by', { enum: ['file_watcher', 'periodic', 'user_edit', 'manual'] }),
  success: integer('success', { mode: 'boolean' }),
  errorMessage: text('error_message'),
  filesChanged: text('files_changed'), // JSON array
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
});
```

### Decision 2: Hybrid Sync Strategy (Immediate + Periodic)

**What**: Use file watcher for immediate sync of active specs, periodic batch sync for archived specs.

**Why**:
- **Active specs need immediate sync**: Users editing proposals expect instant updates
- **Archived specs can wait**: Historical data doesn't need real-time sync
- **Performance**: File watcher overhead only for active work, not entire archive
- **Scalability**: Batch sync handles large archives efficiently

**Implementation**:
```typescript
// File watcher for immediate sync
watchOpenSpecDirectory(projectPath, async (event, file) => {
  const specId = extractSpecId(file); // Extract from path
  const spec = await db.query.openspecSpecs.findFirst({
    where: eq(openspecSpecs.id, specId)
  });

  // Immediate sync if active status
  const activeStatuses = ['proposing', 'approved', 'assigned', 'in_progress', 'review'];
  if (spec && activeStatuses.includes(spec.status)) {
    await syncService.syncFromFilesystem(projectId, specId, immediate: true);
  }
  // Otherwise, periodic sync will pick it up
});

// Periodic sync (every 30 seconds)
cron.schedule('*/30 * * * * *', async () => {
  const staleSpecs = await db.query.openspecSpecs.findMany({
    where: lt(openspecSpecs.lastSyncedAt, new Date(Date.now() - 30000))
  });

  await syncService.syncBatch(staleSpecs.map(s => s.id));
});
```

**Alternatives Considered**:
1. **Immediate sync for all specs**: File watcher for everything
   - **Rejected**: Too much overhead for large archives (100+ specs)
2. **Periodic sync only**: No file watcher, just batch sync
   - **Rejected**: Users expect immediate feedback when editing active work
3. **Manual sync only**: User triggers all syncs
   - **Rejected**: Poor UX, users will forget to sync

### Decision 3: Conflict Resolution - Filesystem Always Wins

**What**: When both filesystem and DB modified since last sync, filesystem version takes precedence.

**Why**:
- **Filesystem is source of truth**: Git commits, OpenSpec CLI operations happen on filesystem
- **Simplicity**: No complex 3-way merge, clear winner
- **Git integration**: Filesystem changes via git pull should always apply
- **User expectations**: Developers expect filesystem to be authoritative

**Conflict Detection**:
```typescript
const filesystemChanged = filesystemMtime > spec.lastSyncedAt;
const dbChanged = spec.dbModifiedAt > spec.lastSyncedAt;

if (filesystemChanged && dbChanged) {
  // CONFLICT: Both modified since last sync
  // Resolution: Filesystem wins
  await forceFilesystemWins(specId);

  // Notify user in UI
  await createNotification({
    type: 'conflict_resolved',
    message: `Spec ${specId} had conflicts. Filesystem version applied (DB changes discarded).`,
  });
}
```

**Alternatives Considered**:
1. **DB always wins**: UI edits always apply
   - **Rejected**: Breaks git workflows, loses CLI changes
2. **Last-write-wins**: Timestamp-based merge
   - **Rejected**: Filesystem is source of truth per requirements
3. **Manual resolution**: User chooses which version
   - **Rejected**: Adds complexity, most users won't understand choice

## Risks / Trade-offs

### Risk 1: Filesystem Performance

**Risk**: Reading OpenSpec files on every sync could be slow for large projects.

**Mitigation**:
- File watcher only syncs changed files, not entire directory
- Batch sync parallelizes reads (Promise.all with concurrency limit of 10)
- Parse markdown only once per sync, cache results in DB

**Acceptance Criteria**: <100ms sync time per spec

### Risk 2: File Watcher Reliability

**Risk**: File watcher (chokidar) may miss events on system crashes or restarts.

**Mitigation**:
- Periodic sync (30s) catches any missed events
- On server startup: Force full sync of all active specs
- Heartbeat monitoring: Restart watcher if no events for 5+ minutes

**Acceptance Criteria**: No specs stuck out-of-sync for >30 seconds

### Risk 3: Concurrent Edits

**Risk**: User edits in UI while external tool modifies filesystem simultaneously.

**Mitigation**:
- Conflict detection on every sync
- Filesystem wins policy prevents data loss
- UI shows warning when filesystem version newer

**Acceptance Criteria**: No silent data loss, all conflicts detected and resolved

### Risk 4: Large Archives

**Risk**: Projects with 100+ archived specs could slow down periodic sync.

**Mitigation**:
- Batch sync with concurrency limit (10 at a time)
- Skip archived specs that haven't changed in 30+ days
- Eventual consistency acceptable for archives

**Acceptance Criteria**: Periodic sync completes in <5 seconds even with 100+ specs

## Migration Plan

### Phase 1: Schema Creation
1. Create database tables (openspecSpecs, syncHistory)
2. Add indexes for efficient queries
3. No data yet - tables empty

### Phase 2: Initial Sync
1. Scan all projects for OpenSpec directories
2. Run full filesystem → DB sync for all specs
3. Verify data in database matches filesystem

### Phase 3: File Watcher Deployment
1. Start file watchers for all projects
2. Monitor logs for sync events
3. Verify immediate sync working

### Phase 4: Periodic Sync
1. Start cron job for batch sync
2. Monitor batch completion times
3. Tune concurrency limits if needed

### Rollback Plan
- Feature flag to disable sync service
- Database tables can be dropped without affecting filesystem
- No breaking changes to existing functionality
- OpenSpec CLI continues working normally

## Open Questions

1. **Multi-instance coordination**: If multiple Claude agent instances run, how do we coordinate file watcher?
   - **Answer**: Each instance watches separately, DB transactions prevent conflicts

2. **Sync on git pull**: Should we trigger sync after git operations?
   - **Answer**: Defer to Phase 2 - file watcher will catch changes, or periodic sync

3. **Large file handling**: What if proposal.md is >1MB?
   - **Answer**: SQLite text fields support up to 1GB, acceptable for specs

4. **Deleted specs**: How to handle specs deleted from filesystem?
   - **Answer**: Mark as deleted in DB (soft delete), don't remove from DB for audit trail
