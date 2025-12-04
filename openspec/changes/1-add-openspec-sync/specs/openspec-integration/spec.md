# OpenSpec Integration Specification

## ADDED Requirements

### Requirement: Bidirectional Filesystem-Database Sync
The system SHALL maintain bidirectional synchronization between OpenSpec files on the filesystem and structured data in the database, with the filesystem as the authoritative source of truth.

#### Scenario: Filesystem to database sync on file change
- **WHEN** an OpenSpec file (proposal.md, tasks.md, or design.md) is modified on the filesystem
- **THEN** the system detects the change within 100ms via file watcher
- **AND** syncs the updated content to the database immediately
- **AND** records the sync operation in sync history

#### Scenario: Database to filesystem sync on UI edit
- **WHEN** a user edits spec content through the web UI
- **THEN** the system writes changes to the database
- **AND** immediately flushes changes to the filesystem atomically
- **AND** creates a backup file before overwriting
- **AND** records the sync operation in sync history

#### Scenario: Conflict resolution with filesystem priority
- **WHEN** both filesystem and database have been modified since last sync
- **THEN** the system detects the conflict by comparing timestamps
- **AND** resolves by applying the filesystem version
- **AND** discards database changes
- **AND** notifies the user that DB changes were overwritten

### Requirement: Hybrid Sync Strategy
The system SHALL use immediate sync for active specs and periodic batch sync for archived specs to optimize performance.

#### Scenario: Immediate sync for active work
- **WHEN** a spec in active status (proposing, approved, assigned, in_progress, review) is modified
- **THEN** the file watcher triggers immediate synchronization
- **AND** the sync completes within 100ms
- **AND** the database reflects filesystem content

#### Scenario: Periodic batch sync for archived specs
- **WHEN** the periodic sync job runs (every 30 seconds)
- **THEN** the system queries all specs not synced in the last 30 seconds
- **AND** batches up to 50 specs for synchronization
- **AND** syncs them in parallel with concurrency limit of 10
- **AND** completes the batch within 5 seconds

#### Scenario: Full sync on server startup
- **WHEN** the server starts up
- **THEN** the system scans all project OpenSpec directories
- **AND** syncs all active specs to ensure consistency
- **AND** logs any sync errors for investigation

### Requirement: Sync Audit Trail
The system SHALL maintain a complete audit log of all synchronization operations for debugging and compliance.

#### Scenario: Recording sync operations
- **WHEN** any sync operation occurs (filesystem→DB or DB→filesystem)
- **THEN** the system records the operation in syncHistory table
- **AND** includes sync direction, trigger source, success status, and timestamp
- **AND** stores error messages if sync fails
- **AND** lists which files were changed

#### Scenario: Querying sync history
- **WHEN** a user requests sync history for a spec
- **THEN** the system returns paginated sync operations
- **AND** includes all historical syncs for that spec
- **AND** shows both successful and failed operations
- **AND** provides error details for failures

### Requirement: Markdown Parsing and Validation
The system SHALL parse OpenSpec markdown files into structured data and validate their format.

#### Scenario: Parsing proposal.md
- **WHEN** syncing a proposal.md file from filesystem
- **THEN** the system extracts title, why section, what changes, and impact
- **AND** stores each section as separate fields in the database
- **AND** handles malformed markdown gracefully with error messages

#### Scenario: Parsing tasks.md with checkboxes
- **WHEN** syncing a tasks.md file from filesystem
- **THEN** the system identifies all task lines with `- [ ]` or `- [x]` format
- **AND** calculates task completion percentage
- **AND** stores the full markdown content in the database
- **AND** enables querying by completion status

#### Scenario: Handling missing design.md
- **WHEN** syncing a spec without a design.md file
- **THEN** the system stores NULL for designContent field
- **AND** continues sync without errors
- **AND** allows future addition of design.md through UI

### Requirement: File Watcher Lifecycle Management
The system SHALL manage file watcher lifecycle to ensure reliable operation across server restarts and failures.

#### Scenario: Starting watchers on server startup
- **WHEN** the server starts up
- **THEN** the system initializes file watchers for all projects with OpenSpec
- **AND** watches proposal.md, tasks.md, and design.md in changes/*/ directories
- **AND** debounces rapid file changes (100ms window)
- **AND** logs watcher initialization success

#### Scenario: Graceful shutdown of watchers
- **WHEN** the server shuts down
- **THEN** the system stops all file watchers gracefully
- **AND** completes any in-flight sync operations
- **AND** logs watcher shutdown completion

#### Scenario: Watcher restart on failure
- **WHEN** a file watcher crashes or stops emitting events
- **THEN** the system detects the failure via heartbeat monitoring (5 minutes no events)
- **AND** restarts the watcher with exponential backoff
- **AND** logs the restart event for debugging
- **AND** resumes watching the project directory

### Requirement: Conflict Detection and Resolution
The system SHALL detect synchronization conflicts and resolve them according to the filesystem-first policy.

#### Scenario: No conflict when only one side modified
- **WHEN** only the filesystem has been modified since last sync
- **THEN** the system syncs filesystem → database without conflict
- **WHEN** only the database has been modified since last sync
- **THEN** the system syncs database → filesystem without conflict

#### Scenario: Conflict notification to user
- **WHEN** the system resolves a conflict by applying filesystem version
- **THEN** the system creates a notification for the user
- **AND** explains that DB changes were discarded
- **AND** provides timestamps of both modifications
- **AND** links to the spec for review

### Requirement: Manual Sync Controls
The system SHALL provide API endpoints for manual synchronization control when automatic sync is insufficient.

#### Scenario: Force sync for specific spec
- **WHEN** a user triggers manual sync for a spec via API
- **THEN** the system immediately syncs that spec bidirectionally
- **AND** bypasses periodic schedule
- **AND** returns sync result with success status
- **AND** includes any errors encountered

#### Scenario: Force sync for entire project
- **WHEN** a user triggers manual sync for a project via API
- **THEN** the system syncs all specs in that project
- **AND** batches specs with concurrency limit
- **AND** returns summary of successful and failed syncs
- **AND** logs the manual sync operation

#### Scenario: Resolve conflict manually
- **WHEN** a user manually resolves a conflict via API
- **THEN** the system applies the specified resolution (filesystem wins or DB wins)
- **AND** records the manual resolution in sync history
- **AND** updates lastSyncedAt timestamp
- **AND** confirms resolution to the user
