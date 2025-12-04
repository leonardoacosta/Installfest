# Implementation Tasks

## 1. Database Schema for Sync
- [ ] 1.1 Create `openspecSpecs` table schema in `packages/db/src/schema/openspec.ts`
  - [ ] Add id (text, primary key - change ID from filesystem)
  - [ ] Add projectId (foreign key to projects)
  - [ ] Add title, status (text, initially just for tracking)
  - [ ] Add proposalContent, tasksContent, designContent (text fields for markdown)
  - [ ] Add lastSyncedAt, filesystemModifiedAt, dbModifiedAt timestamps
  - [ ] Add syncError (nullable text for error messages)
  - [ ] Add indexes: projectId, status, lastSyncedAt
- [ ] 1.2 Create `syncHistory` table schema in `packages/db/src/schema/sync.ts`
  - [ ] Add id, specId (foreign key), syncDirection ('fs_to_db' | 'db_to_fs')
  - [ ] Add syncedAt timestamp, success boolean
  - [ ] Add errorMessage (nullable), filesChanged (JSON array)
  - [ ] Add triggeredBy ('file_watcher' | 'periodic' | 'user_edit' | 'manual')
- [ ] 1.3 Export new schemas from `packages/db/src/schema/index.ts`
- [ ] 1.4 Run Drizzle migration to create tables

## 2. Zod Validators for Sync
- [ ] 2.1 Create sync validators in `packages/validators/src/sync.ts`
  - [ ] `openspecSpecSchema` - full spec with content
  - [ ] `syncConflictSchema` - conflict detection result
  - [ ] `syncStatusSchema` - sync status response
- [ ] 2.2 Create OpenSpec file validators
  - [ ] `proposalMarkdownSchema` - validate proposal.md structure
  - [ ] `tasksMarkdownSchema` - validate tasks.md with checkbox parsing
  - [ ] `designMarkdownSchema` - validate design.md (optional)

## 3. File Parsing Utilities
- [ ] 3.1 Create markdown parser in `packages/api/src/utils/markdown.ts`
  - [ ] `parseProposalMd(content)` - extract title, why, whatChanges, impact
  - [ ] `parseTasksMd(content)` - extract tasks array with status [x] or [ ]
  - [ ] `parseDesignMd(content)` - extract design sections
  - [ ] Handle malformed markdown gracefully with error messages
- [ ] 3.2 Create file system utilities in `packages/api/src/utils/filesystem.ts`
  - [ ] `readOpenSpecFile(path)` - read file with error handling
  - [ ] `writeOpenSpecFile(path, content)` - atomic write with backup
  - [ ] `getFileMtime(path)` - get last modified timestamp
  - [ ] `backupFile(path)` - create .bak copy before overwrite
- [ ] 3.3 Write unit tests for parsing utilities
  - [ ] Test valid proposal.md parsing
  - [ ] Test tasks.md checkbox detection
  - [ ] Test malformed markdown handling

## 4. OpenSpec Sync Service (Core)
- [ ] 4.1 Create `OpenSpecSyncService` in `packages/api/src/services/openspec-sync.ts`
  - [ ] Constructor accepts project config (id, path, openspecPath)
  - [ ] `syncFromFilesystem(specId, immediate)` - read files, write to DB
  - [ ] `syncToFilesystem(specId)` - read DB, write to files
  - [ ] `detectConflicts(specId)` - compare timestamps, detect changes
  - [ ] `forceFilesystemWins(specId)` - resolve conflict by using filesystem version
  - [ ] `getLastSyncStatus(specId)` - return sync history
- [ ] 4.2 Implement conflict detection logic
  - [ ] Compare filesystemModifiedAt vs dbModifiedAt vs lastSyncedAt
  - [ ] Conflict = both changed since last sync
  - [ ] Return conflict details: which fields differ, timestamps
- [ ] 4.3 Implement transaction safety
  - [ ] Use DB transactions for sync operations
  - [ ] Rollback on filesystem write failure
  - [ ] Log all sync operations to syncHistory table
- [ ] 4.4 Add error handling and retries
  - [ ] Catch filesystem errors (permission, not found, etc.)
  - [ ] Retry failed syncs with exponential backoff
  - [ ] Store error in openspecSpecs.syncError field

## 5. File Watcher Integration (chokidar)
- [ ] 5.1 Add chokidar dependency to `packages/api/package.json`
- [ ] 5.2 Create file watcher service in `packages/api/src/services/file-watcher.ts`
  - [ ] `watchProject(projectId, openspecPath)` - start watching directory
  - [ ] Watch: proposal.md, tasks.md, design.md in changes/*/
  - [ ] Debounce rapid changes (100ms)
  - [ ] Emit events: file_changed, file_added, file_deleted
- [ ] 5.3 Integrate watcher with sync service
  - [ ] On file_changed event → syncFromFilesystem(specId, immediate: true)
  - [ ] Log watcher events to sync history
- [ ] 5.4 Handle watcher lifecycle
  - [ ] Start watchers on server startup for all projects
  - [ ] Stop watchers on server shutdown gracefully
  - [ ] Restart watcher if it crashes (with backoff)
  - [ ] Handle missing directories (log warning, retry periodically)

## 6. Periodic Sync Job (node-cron)
- [ ] 6.1 Add node-cron dependency to `packages/api/package.json`
- [ ] 6.2 Create periodic sync scheduler in `packages/api/src/services/sync-scheduler.ts`
  - [ ] Schedule: every 30 seconds
  - [ ] Query all specs not recently synced (> 30s ago)
  - [ ] Batch sync up to 50 specs per run
  - [ ] Skip specs with recent sync (< 30s ago)
- [ ] 6.3 Implement batch sync logic
  - [ ] `syncBatch(specIds)` - sync multiple specs efficiently
  - [ ] Parallelize syncs (Promise.all with concurrency limit)
  - [ ] Collect errors, continue on failure
  - [ ] Log batch summary to console
- [ ] 6.4 Add manual sync trigger endpoint
  - [ ] `sync.forceSync({ projectId?, specId? })` tRPC procedure
  - [ ] Force immediate sync bypassing schedules
  - [ ] Return sync result summary

## 7. Sync tRPC Router
- [ ] 7.1 Create `packages/api/src/router/sync.ts`
  - [ ] Import OpenSpecSyncService
  - [ ] `sync.getStatus({ specId })` - return last sync time, errors
  - [ ] `sync.forceSync({ specId })` - trigger immediate sync
  - [ ] `sync.resolveConflict({ specId, resolution })` - force fs wins
  - [ ] `sync.getSyncHistory({ specId, limit? })` - paginated sync history
- [ ] 7.2 Implement sync subscription for real-time updates
  - [ ] `sync.subscribe({ projectId? })` - stream sync events
  - [ ] Emit: sync_started, sync_completed, sync_failed, conflict_detected
  - [ ] Include sync details in events (specId, direction, success)
- [ ] 7.3 Add to root router in `packages/api/src/root.ts`
  - [ ] Export syncRouter

## 8. Testing
- [ ] 8.1 Unit tests for OpenSpecSyncService
  - [ ] Test syncFromFilesystem with valid files
  - [ ] Test syncToFilesystem writes correctly
  - [ ] Test conflict detection logic
  - [ ] Test error handling (file not found, parse errors)
- [ ] 8.2 Integration tests for file watcher
  - [ ] Create test project with OpenSpec files
  - [ ] Modify file, verify immediate sync triggered
  - [ ] Test debouncing (rapid changes only sync once)
- [ ] 8.3 Integration tests for periodic sync
  - [ ] Create specs in various states
  - [ ] Run periodic sync, verify correct specs synced
  - [ ] Test batch sync with multiple specs
- [ ] 8.4 End-to-end test
  - [ ] Create OpenSpec files in test project
  - [ ] Trigger filesystem → DB sync
  - [ ] Edit in DB, trigger DB → filesystem sync
  - [ ] Verify filesystem changes reflect in files
  - [ ] Test conflict detection and resolution

## 9. Documentation
- [ ] 9.1 Update homelab-services/docs/architecture.md
  - [ ] Document bidirectional sync architecture
  - [ ] Explain conflict resolution strategy
- [ ] 9.2 Create API documentation
  - [ ] Document sync router endpoints
  - [ ] Provide usage examples
- [ ] 9.3 Update environment variables
  - [ ] Document OPENSPEC_PROJECTS_DIR
  - [ ] Document FILE_WATCHER_ENABLED
