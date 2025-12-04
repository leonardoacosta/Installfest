# Change: Add OpenSpec Bidirectional Sync

## Why

The Claude agent service needs to manage OpenSpec specifications through a web UI while maintaining filesystem compatibility with the OpenSpec CLI. Currently, specs exist only on the filesystem, making them difficult to query, filter, and edit through a web interface.

By implementing bidirectional sync between the filesystem (source of truth) and database, we enable:
- **Queryable spec data**: Filter and sort specs by status, priority, project
- **Web-based editing**: Edit proposals, tasks, and design docs through UI
- **Work queue foundation**: Database enables intelligent work prioritization
- **Lifecycle tracking**: Track spec states separately from filesystem content
- **Real-time updates**: File watcher detects changes for immediate sync

## What Changes

### Bidirectional Sync Strategy
- **Filesystem → Database (Immediate)**: File watcher (chokidar) syncs active specs instantly on change
- **Filesystem → Database (Periodic)**: Batch sync archived/inactive specs every 30 seconds
- **Database → Filesystem**: UI edits write to DB, then immediately flush to filesystem
- **Conflict Resolution**: Filesystem always wins - discard DB changes if both modified
- **Sync Audit Trail**: All sync operations logged to `syncHistory` table

### Database Schema
- `openspecSpecs` table: Synced OpenSpec data with content fields (proposalContent, tasksContent, designContent)
- `syncHistory` table: Audit log of all sync operations

### Services
- `OpenSpecSyncService`: Core bidirectional sync logic with conflict detection
- `FileWatcherService`: Chokidar-based file watching for immediate sync
- `SyncScheduler`: Periodic batch sync for non-active specs

### API
- tRPC `sync` router: Manual sync triggers, conflict resolution, sync status queries

## Impact

### Affected Specs
- **openspec-integration**: ADDED new capability for bidirectional filesystem ↔ DB sync

### Affected Code
- `homelab-services/packages/db/src/schema/` - New tables: openspecSpecs, syncHistory
- `homelab-services/packages/api/src/services/` - New services: OpenSpecSyncService, FileWatcherService, SyncScheduler
- `homelab-services/packages/api/src/router/` - New tRPC router: sync.ts
- `homelab-services/packages/validators/src/` - New Zod schemas for sync entities
- `homelab-services/packages/api/src/utils/` - New utilities: markdown parsing, filesystem operations

### Breaking Changes
None. This is purely additive functionality.

### Dependencies
- **New**: `chokidar` - Filesystem watching for immediate sync
- **New**: `node-cron` - Scheduled periodic sync
- **Existing**: tRPC, Drizzle, Zod, Better-T-Stack architecture
