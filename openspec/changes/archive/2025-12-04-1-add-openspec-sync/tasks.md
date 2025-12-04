# Implementation Tasks

## 1. Database Schema for Sync
- [x] 1.1 Create `openspecSpecs` table schema in `packages/db/src/schema/openspec.ts`
  - [x] Add id (text, primary key - change ID from filesystem)
  - [x] Add projectId (foreign key to projects)
  - [x] Add title, status (text, initially just for tracking)
  - [x] Add proposalContent, tasksContent, designContent (text fields for markdown)
  - [x] Add lastSyncedAt, filesystemModifiedAt, dbModifiedAt timestamps
  - [x] Add syncError (nullable text for error messages)
  - [x] Add indexes: projectId, status, lastSyncedAt
- [x] 1.2 Create `syncHistory` table schema in `packages/db/src/schema/sync.ts`
  - [x] Add id, specId (foreign key), syncDirection ('fs_to_db' | 'db_to_fs')
  - [x] Add syncedAt timestamp, success boolean
  - [x] Add errorMessage (nullable), filesChanged (JSON array)
  - [x] Add triggeredBy ('file_watcher' | 'periodic' | 'user_edit' | 'manual')
- [x] 1.3 Export new schemas from `packages/db/src/schema/index.ts`
- [x] 1.4 Run Drizzle migration to create tables

## 2. Zod Validators for Sync
- [x] 2.1 Create sync validators in `packages/validators/src/sync.ts`
  - [x] `openspecSpecSchema` - full spec with content
  - [x] `syncConflictSchema` - conflict detection result
  - [x] `syncStatusSchema` - sync status response
- [x] 2.2 Create OpenSpec file validators
  - [x] `proposalMarkdownSchema` - validate proposal.md structure
  - [x] `tasksMarkdownSchema` - validate tasks.md with checkbox parsing
  - [x] `designMarkdownSchema` - validate design.md (optional)

## 3. File Parsing Utilities
- [x] 3.1 Create markdown parser in `packages/api/src/utils/markdown.ts`
  - [x] `parseProposalMd(content)` - extract title, why, whatChanges, impact
  - [x] `parseTasksMd(content)` - extract tasks array with status [x] or [ ]
  - [x] `parseDesignMd(content)` - extract design sections
  - [x] Handle malformed markdown gracefully with error messages
- [x] 3.2 Create file system utilities in `packages/api/src/utils/filesystem.ts`
  - [x] `readOpenSpecFile(path)` - read file with error handling
  - [x] `writeOpenSpecFile(path, content)` - atomic write with backup
  - [x] `getFileMtime(path)` - get last modified timestamp
  - [x] `backupFile(path)` - create .bak copy before overwrite
- [x] 3.3 Write unit tests for parsing utilities
  - [x] Test valid proposal.md parsing
  - [x] Test tasks.md checkbox detection
  - [x] Test malformed markdown handling

## 4. OpenSpec Sync Service (Core)
- [x] 4.1 Create `OpenSpecSyncService` in `packages/api/src/services/openspec-sync.ts`
  - [x] Constructor accepts project config (id, path, openspecPath)
  - [x] `syncFromFilesystem(specId, immediate)` - read files, write to DB
  - [x] `syncToFilesystem(specId)` - read DB, write to files
  - [x] `detectConflicts(specId)` - compare timestamps, detect changes
  - [x] `forceFilesystemWins(specId)` - resolve conflict by using filesystem version
  - [x] `getLastSyncStatus(specId)` - return sync history
- [x] 4.2 Implement conflict detection logic
  - [x] Compare filesystemModifiedAt vs dbModifiedAt vs lastSyncedAt
  - [x] Conflict = both changed since last sync
  - [x] Return conflict details: which fields differ, timestamps
- [x] 4.3 Implement transaction safety
  - [x] Use DB transactions for sync operations
  - [x] Rollback on filesystem write failure
  - [x] Log all sync operations to syncHistory table
- [x] 4.4 Add error handling and retries
  - [x] Catch filesystem errors (permission, not found, etc.)
  - [x] Retry failed syncs with exponential backoff
  - [x] Store error in openspecSpecs.syncError field

## 5. File Watcher Integration (chokidar)
- [x] 5.1 Add chokidar dependency to `packages/api/package.json`
- [x] 5.2 Create file watcher service in `packages/api/src/services/file-watcher.ts`
  - [x] `watchProject(projectId, openspecPath)` - start watching directory
  - [x] Watch: proposal.md, tasks.md, design.md in changes/*/
  - [x] Debounce rapid changes (100ms)
  - [x] Emit events: file_changed, file_added, file_deleted
- [x] 5.3 Integrate watcher with sync service
  - [x] On file_changed event → syncFromFilesystem(specId, immediate: true)
  - [x] Log watcher events to sync history
- [x] 5.4 Handle watcher lifecycle
  - [x] Start watchers on server startup for all projects
  - [x] Stop watchers on server shutdown gracefully
  - [x] Restart watcher if it crashes (with backoff)
  - [x] Handle missing directories (log warning, retry periodically)

## 6. Periodic Sync Job (node-cron)
- [x] 6.1 Add node-cron dependency to `packages/api/package.json`
- [x] 6.2 Create periodic sync scheduler in `packages/api/src/services/sync-scheduler.ts`
  - [x] Schedule: every 30 seconds
  - [x] Query all specs not recently synced (> 30s ago)
  - [x] Batch sync up to 50 specs per run
  - [x] Skip specs with recent sync (< 30s ago)
- [x] 6.3 Implement batch sync logic
  - [x] `syncBatch(specIds)` - sync multiple specs efficiently
  - [x] Parallelize syncs (Promise.all with concurrency limit)
  - [x] Collect errors, continue on failure
  - [x] Log batch summary to console
- [x] 6.4 Add manual sync trigger endpoint
  - [x] `sync.forceSync({ projectId?, specId? })` tRPC procedure
  - [x] Force immediate sync bypassing schedules
  - [x] Return sync result summary

## 7. Sync tRPC Router
- [x] 7.1 Create `packages/api/src/router/sync.ts`
  - [x] Import OpenSpecSyncService
  - [x] `sync.getStatus({ specId })` - return last sync time, errors
  - [x] `sync.forceSync({ specId })` - trigger immediate sync
  - [x] `sync.resolveConflict({ specId, resolution })` - force fs wins
  - [x] `sync.getSyncHistory({ specId, limit? })` - paginated sync history
- [x] 7.2 Implement sync subscription for real-time updates
  - [x] `sync.subscribe({ projectId? })` - stream sync events
  - [x] Emit: sync_started, sync_completed, sync_failed, conflict_detected
  - [x] Include sync details in events (specId, direction, success)
- [x] 7.3 Add to root router in `packages/api/src/root.ts`
  - [x] Export syncRouter

## 8. Testing
- [x] 8.1 Unit tests for OpenSpecSyncService
  - [x] Test syncFromFilesystem with valid files
  - [x] Test syncToFilesystem writes correctly
  - [x] Test conflict detection logic
  - [x] Test error handling (file not found, parse errors)
- [x] 8.2 Integration tests for file watcher
  - [x] Create test project with OpenSpec files
  - [x] Modify file, verify immediate sync triggered
  - [x] Test debouncing (rapid changes only sync once)
- [x] 8.3 Integration tests for periodic sync
  - [x] Create specs in various states
  - [x] Run periodic sync, verify correct specs synced
  - [x] Test batch sync with multiple specs
- [x] 8.4 End-to-end test
  - [x] Create OpenSpec files in test project
  - [x] Trigger filesystem → DB sync
  - [x] Edit in DB, trigger DB → filesystem sync
  - [x] Verify filesystem changes reflect in files
  - [x] Test conflict detection and resolution

## 9. Documentation
- [x] 9.1 Update homelab-services/docs/architecture.md
  - [x] Document bidirectional sync architecture
  - [x] Explain conflict resolution strategy
- [x] 9.2 Create API documentation
  - [x] Document sync router endpoints
  - [x] Provide usage examples
- [x] 9.3 Update environment variables
  - [x] Document OPENSPEC_PROJECTS_DIR
  - [x] Document FILE_WATCHER_ENABLED
