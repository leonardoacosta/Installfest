# OpenSpec Integration Specification

## MODIFIED Requirements

### Requirement: Bidirectional Filesystem-Database Sync
The system SHALL maintain bidirectional synchronization between OpenSpec files on the filesystem and structured data in the database, with the filesystem as the authoritative source of truth, and SHALL track spec lifecycle status separately from file content.

#### Scenario: Filesystem to database sync on file change
- **WHEN** an OpenSpec file (proposal.md, tasks.md, or design.md) is modified on the filesystem
- **THEN** the system detects the change within 100ms via file watcher
- **AND** syncs the updated content to the database immediately
- **AND** preserves existing status field during sync
- **AND** records the sync operation in sync history

#### Scenario: Database to filesystem sync on UI edit
- **WHEN** a user edits spec content through the web UI
- **THEN** the system writes changes to the database
- **AND** immediately flushes changes to the filesystem atomically
- **AND** preserves status field during sync
- **AND** creates a backup file before overwriting
- **AND** records the sync operation in sync history

#### Scenario: Sync preserves lifecycle status
- **WHEN** syncing spec content bidirectionally
- **THEN** the system preserves status field value
- **AND** only updates content fields (proposalContent, tasksContent, designContent)
- **AND** lifecycle status managed separately by SpecLifecycleService

#### Scenario: Conflict resolution with filesystem priority
- **WHEN** both filesystem and database have been modified since last sync
- **THEN** the system detects the conflict by comparing timestamps
- **AND** resolves by applying the filesystem version
- **AND** preserves status field from database
- **AND** discards database content changes only
- **AND** notifies the user that DB changes were overwritten
