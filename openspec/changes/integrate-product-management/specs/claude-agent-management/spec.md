## ADDED Requirements

### Requirement: Session Type Classification
Agent sessions SHALL be classified by the type of work being performed.

#### Scenario: Create typed session
- **WHEN** POST /api/sessions is requested with optional sessionType parameter
- **THEN** session is created with type ('manual', 'spec_implementation', 'error_remediation')
- **AND** session type is stored in sessions.session_type column
- **AND** session type affects UI indicators and filtering

#### Scenario: Link session to spec
- **WHEN** session is created with type='spec_implementation'
- **THEN** session metadata includes specChangeId
- **AND** session detail view shows linked spec proposal
- **AND** spec implementation progress is tracked

#### Scenario: Link session to error
- **WHEN** session is created with type='error_remediation'
- **THEN** errorTriage.assignedSessionId is updated
- **AND** session detail view shows linked error details
- **AND** remediation progress is tracked in remediationAttempts

### Requirement: Session Metadata Enrichment
Sessions SHALL store additional metadata about their purpose and linked work.

#### Scenario: Spec implementation metadata
- **WHEN** session is created for spec implementation
- **THEN** metadata includes: specChangeId, projectId, affectedCapabilities[]
- **AND** metadata is queryable via API

#### Scenario: Error remediation metadata
- **WHEN** session is created for error remediation
- **THEN** metadata includes: errorTriageId, testName, classificationType
- **AND** remediation attempt is created linking session

## MODIFIED Requirements

### Requirement: Session Persistence
Agent sessions and hook data SHALL be persisted in SQLite database.

#### Scenario: Database schema
- **WHEN** server starts
- **THEN** database schema is created if not exists
- **AND** schema includes projects, sessions, hooks tables
- **AND** sessions table includes session_type column (TEXT)
- **AND** sessions table includes metadata column (JSON/TEXT) for work item links
- **AND** foreign key constraints are enforced
- **AND** indexes exist for query performance

#### Scenario: Session recovery
- **WHEN** server restarts
- **THEN** stopped sessions remain stopped (ephemeral agents)
- **AND** hook history is preserved
- **AND** session type and metadata are preserved
- **AND** projects are still accessible

### Requirement: Web Dashboard
The system SHALL provide web UI for managing agents and viewing hooks.

#### Scenario: Session management
- **WHEN** user clicks "Start Agent" on project
- **THEN** modal prompts for session type selection
- **AND** if 'spec_implementation', user selects OpenSpec change
- **AND** if 'error_remediation', user selects triaged error
- **AND** new agent session is created with appropriate type and metadata
- **AND** session appears in active sessions list with type indicator
- **AND** user can stop session via UI

#### Scenario: Session list view
- **WHEN** sessions are listed
- **THEN** each session shows type badge (Manual, Spec, Error)
- **AND** sessions can be filtered by type
- **AND** spec sessions show linked change title
- **AND** error sessions show linked test name

#### Scenario: Session detail view
- **WHEN** user clicks on session
- **THEN** hook history for that session is displayed in table
- **AND** if spec session, spec proposal is shown in sidebar
- **AND** if error session, error details are shown in sidebar
- **AND** session type is prominently displayed
