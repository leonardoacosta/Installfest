## ADDED Requirements

### Requirement: OpenSpec Filesystem Reader
The system SHALL read OpenSpec changes and specifications directly from the filesystem.

#### Scenario: List all changes
- **WHEN** GET /api/openspec/changes is requested with optional projectId filter
- **THEN** all changes in openspec/changes/ directory are returned
- **AND** each change includes metadata from proposal.md
- **AND** changes are categorized by status (active vs archived)

#### Scenario: Read change details
- **WHEN** GET /api/openspec/changes/:id is requested
- **THEN** change proposal, tasks, design, and spec deltas are parsed and returned
- **AND** delta operations (ADDED, MODIFIED, REMOVED) are identified
- **AND** requirements and scenarios are extracted

#### Scenario: List specifications
- **WHEN** GET /api/openspec/specs is requested
- **THEN** all specs in openspec/specs/ directory are returned
- **AND** each spec includes requirement count and last modified date

#### Scenario: Read spec details
- **WHEN** GET /api/openspec/specs/:id is requested
- **THEN** spec requirements and scenarios are parsed and returned
- **AND** related changes (deltas affecting this spec) are included

### Requirement: Multi-Project Support
The system SHALL support reading OpenSpec from multiple project directories.

#### Scenario: Project discovery
- **WHEN** server starts
- **THEN** /projects directory is scanned for subdirectories with openspec/ folder
- **AND** each discovered project is registered with name and path
- **AND** project list is cached and refreshed every 5 minutes

#### Scenario: Project filtering
- **WHEN** API request includes projectId parameter
- **THEN** only OpenSpec data from that project's directory is returned
- **AND** filesystem reads are scoped to project path

#### Scenario: Project metadata
- **WHEN** GET /api/projects is requested
- **THEN** each project includes hasOpenspec boolean
- **AND** projects with OpenSpec include activeChangesCount and specsCount

### Requirement: Filesystem Caching
The system SHALL cache parsed OpenSpec data to optimize performance.

#### Scenario: Cache population
- **WHEN** OpenSpec file is first read
- **THEN** parsed content is stored in in-memory LRU cache
- **AND** cache entry includes 5-minute TTL
- **AND** cache key includes file path and last modified timestamp

#### Scenario: Cache invalidation
- **WHEN** file modification time changes
- **THEN** cached entry is evicted
- **AND** next read parses file again

#### Scenario: Cache warming
- **WHEN** server starts
- **THEN** all active changes are pre-parsed and cached
- **AND** cache warming completes before accepting requests

### Requirement: OpenSpec Proposal Creation
The system SHALL support creating new OpenSpec proposals via API.

#### Scenario: Create proposal
- **WHEN** POST /api/openspec/changes is requested with title, description, projectId
- **THEN** unique change-id is generated (kebab-case, verb-led)
- **AND** directory structure is created: openspec/changes/<id>/
- **AND** proposal.md is scaffolded with title and description
- **AND** tasks.md is created with empty checklist
- **AND** change is validated with openspec CLI

#### Scenario: Invalid change ID
- **WHEN** POST /api/openspec/changes is requested but generated ID already exists
- **THEN** error is returned with suggested alternative ID
- **AND** no files are created

### Requirement: OpenSpec Change Archival
The system SHALL support archiving completed changes.

#### Scenario: Archive change
- **WHEN** POST /api/openspec/changes/:id/archive is requested
- **THEN** openspec archive <id> --yes command is executed
- **AND** change directory is moved to openspec/changes/archive/
- **AND** specs are updated if deltas exist
- **AND** success/failure status is returned

#### Scenario: Archive validation
- **WHEN** archive is requested
- **THEN** openspec validate <id> --strict is run first
- **AND** archive proceeds only if validation passes
- **AND** validation errors are returned if checks fail

### Requirement: Real-Time Spec Updates
The system SHALL stream OpenSpec changes via WebSocket subscriptions.

#### Scenario: Subscribe to changes
- **WHEN** client subscribes to /api/openspec/subscribe with optional projectId
- **THEN** file watcher monitors openspec/changes/ directory
- **AND** new/modified/deleted files trigger subscription events
- **AND** events include change type (created, updated, archived)

#### Scenario: Subscription filtering
- **WHEN** subscription includes projectId
- **THEN** only events from that project's openspec/ directory are sent
- **AND** events from other projects are filtered out
