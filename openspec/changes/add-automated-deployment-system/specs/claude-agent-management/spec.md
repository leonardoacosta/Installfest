# Claude Agent Management Specification

## ADDED Requirements

### Requirement: Multi-Agent Session Management
The system SHALL manage multiple concurrent Claude Code agent instances across different projects.

#### Scenario: Agent creation
- **WHEN** POST /api/sessions is requested with project path
- **THEN** new agent instance is spawned using Claude Agent SDK
- **AND** agent is assigned unique session ID
- **AND** agent operates in isolated context
- **AND** session is recorded in database

#### Scenario: Concurrent agents
- **WHEN** multiple agent sessions are active
- **THEN** each agent runs independently
- **AND** agents do not interfere with each other
- **AND** each agent maintains separate state

#### Scenario: Agent termination
- **WHEN** DELETE /api/sessions/:id is requested
- **THEN** agent instance is gracefully stopped
- **AND** session status is updated to "stopped"
- **AND** resources are released

### Requirement: Hook Aggregation
The system SHALL capture and store all hook events from agent instances.

#### Scenario: Pre-tool hook capture
- **WHEN** agent executes pre-tool hook
- **THEN** hook data is captured by HookAggregator
- **AND** hook is stored in SQLite with session ID, timestamp, tool name
- **AND** hook data is available via API

#### Scenario: Post-tool hook capture
- **WHEN** agent executes post-tool hook
- **THEN** hook data is captured including tool results
- **AND** hook is linked to corresponding pre-tool hook
- **AND** execution time is calculated

#### Scenario: User prompt hook capture
- **WHEN** user-prompt-submit hook fires
- **THEN** user input is captured
- **AND** prompt context is stored
- **AND** hook is associated with session

### Requirement: Project Management
The system SHALL manage development projects that agents work on.

#### Scenario: Project registration
- **WHEN** new project is created in /home/leo/dev/projects/
- **THEN** project is automatically detected or manually registered
- **AND** project metadata is stored (name, path, created date)
- **AND** project appears in dashboard

#### Scenario: Project listing
- **WHEN** GET /api/projects is requested
- **THEN** all projects in dev directory are returned
- **AND** each project shows active session count
- **AND** projects are sorted by last activity

### Requirement: Hook Query API
The system SHALL provide API to query hook history with filtering.

#### Scenario: Query by session
- **WHEN** GET /api/hooks?session=123 is requested
- **THEN** all hooks for that session are returned
- **AND** hooks are ordered by timestamp
- **AND** results include hook type, tool name, timestamp, data

#### Scenario: Query by tool
- **WHEN** GET /api/hooks?tool=Read is requested
- **THEN** all hooks for Read tool are returned across all sessions
- **AND** results include which session executed the hook

#### Scenario: Date range filtering
- **WHEN** GET /api/hooks?from=2024-01-01&to=2024-01-31 is requested
- **THEN** hooks within date range are returned

### Requirement: Session Persistence
Agent sessions and hook data SHALL be persisted in SQLite database.

#### Scenario: Database schema
- **WHEN** server starts
- **THEN** database schema is created if not exists
- **AND** schema includes projects, sessions, hooks tables
- **AND** foreign key constraints are enforced
- **AND** indexes exist for query performance

#### Scenario: Session recovery
- **WHEN** server restarts
- **THEN** stopped sessions remain stopped (ephemeral agents)
- **AND** hook history is preserved
- **AND** projects are still accessible

### Requirement: Web Dashboard
The system SHALL provide web UI for managing agents and viewing hooks.

#### Scenario: Project list view
- **WHEN** user accesses claude.local
- **THEN** list of projects is displayed
- **AND** each project shows active sessions
- **AND** user can start new session for any project

#### Scenario: Session management
- **WHEN** user clicks "Start Agent" on project
- **THEN** new agent session is created
- **AND** session appears in active sessions list
- **AND** user can stop session via UI

#### Scenario: Hook viewer
- **WHEN** user clicks on session
- **THEN** hook history for that session is displayed in table
- **AND** table shows hook type, tool, timestamp, summary
- **AND** user can click hook to see full details

#### Scenario: Log streaming
- **WHEN** agent is running
- **THEN** agent output is streamed to UI via WebSocket
- **AND** logs display in real-time
- **AND** connection persists until agent stops

### Requirement: Agent Isolation
Each agent instance SHALL operate in isolated context to prevent interference.

#### Scenario: Separate working directories
- **WHEN** multiple agents run on different projects
- **THEN** each agent operates in its project directory
- **AND** file operations are scoped to that directory
- **AND** agents cannot access other project files

#### Scenario: Independent state
- **WHEN** agent makes API calls or uses tools
- **THEN** state is isolated to that agent instance
- **AND** agents do not share conversation history

### Requirement: Traefik Integration
The dashboard SHALL be accessible via Traefik reverse proxy.

#### Scenario: Domain routing
- **WHEN** user navigates to claude.local
- **THEN** Traefik routes request to claude-agent-server container
- **AND** WebSocket connections are proxied correctly
- **AND** TLS is handled by Traefik

### Requirement: Error Handling
The system SHALL handle agent failures gracefully.

#### Scenario: Agent crash
- **WHEN** agent instance crashes
- **THEN** session status is updated to "error"
- **AND** error details are logged
- **AND** UI displays error message
- **AND** user can restart agent

#### Scenario: SDK errors
- **WHEN** Claude Agent SDK encounters error
- **THEN** error is captured and logged
- **AND** session continues if recoverable
- **AND** session stops if unrecoverable
