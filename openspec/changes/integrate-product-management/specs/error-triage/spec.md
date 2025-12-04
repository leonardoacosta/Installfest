## ADDED Requirements

### Requirement: Failure Classification Engine
The system SHALL automatically classify test failures and recommend remediation strategy.

#### Scenario: Classify new failure
- **WHEN** new test failure is detected in testFailures table
- **THEN** classification engine analyzes failure history
- **AND** classification type is determined (NEW, FLAKY, RECURRING, PERSISTENT)
- **AND** remediation decision is recommended (needs_spec, one_off_fix, pending)
- **AND** errorTriage record is created with rationale and priority

#### Scenario: Persistent failure detection
- **WHEN** failure has consecutiveFailures >= 5
- **THEN** decision is 'needs_spec'
- **AND** rationale is 'Persistent failure (100% failure rate over 5+ runs)'
- **AND** priority is set to 5 (highest)
- **AND** confidence is 0.95

#### Scenario: Recurring failure detection
- **WHEN** failure has occurrences >= 3 but not persistent
- **THEN** decision is 'needs_spec'
- **AND** rationale is 'Recurring issue (3+ occurrences)'
- **AND** priority is set to 4

#### Scenario: Flaky failure detection
- **WHEN** failure has mixed pass/fail results
- **THEN** decision is 'pending'
- **AND** rationale is 'Flaky test - investigate root cause'
- **AND** priority is set to 3

#### Scenario: New failure detection
- **WHEN** failure is first occurrence
- **THEN** decision is 'one_off_fix'
- **AND** rationale is 'New failure - likely environmental or simple bug'
- **AND** priority is set to 2

### Requirement: Keyword-Based Classification
The system SHALL use error message keywords to improve classification accuracy.

#### Scenario: Feature not implemented
- **WHEN** error message contains 'feature not implemented' or 'not supported'
- **THEN** decision is 'needs_spec' regardless of failure history
- **AND** rationale includes keyword match
- **AND** confidence increases by 0.2

#### Scenario: Test infrastructure
- **WHEN** test file path contains 'setup' or 'teardown'
- **THEN** decision leans toward 'one_off_fix'
- **AND** rationale includes test type analysis

#### Scenario: Integration vs unit test
- **WHEN** test file path contains 'integration' or 'e2e'
- **THEN** decision leans toward 'needs_spec' (more likely architectural)
- **AND** priority increases by 1

### Requirement: Triage Decision Tracking
The system SHALL persist triage decisions and link to remediation efforts.

#### Scenario: Create triage record
- **WHEN** POST /api/errors/triage is requested with failureId and decision
- **THEN** errorTriage record is created
- **AND** decision, rationale, and priority are stored
- **AND** testFailureId foreign key links to original failure

#### Scenario: Assign to session
- **WHEN** PUT /api/errors/:id/assign is requested with sessionId
- **THEN** errorTriage.assignedSessionId is updated
- **AND** session.session_type is set to 'error_remediation'
- **AND** assignment timestamp is recorded

#### Scenario: Link to spec proposal
- **WHEN** spec proposal is created from error triage
- **THEN** errorTriage.specChangeId is set to OpenSpec change ID
- **AND** decision is updated to 'needs_spec'
- **AND** spec proposal metadata references original error

### Requirement: Triage Dashboard
The system SHALL provide UI for reviewing and managing triaged errors.

#### Scenario: List triaged errors
- **WHEN** GET /api/errors/triage is requested
- **THEN** all errorTriage records are returned with JOIN on testFailures
- **AND** results include error message, stack trace, decision, priority
- **AND** results are sortable by priority, date, classification type

#### Scenario: Filter by decision
- **WHEN** GET /api/errors/triage?decision=needs_spec is requested
- **THEN** only errors with 'needs_spec' decision are returned

#### Scenario: Filter by project
- **WHEN** GET /api/errors/triage?projectId=123 is requested
- **THEN** only errors from tests in that project are returned

### Requirement: Manual Override
The system SHALL allow manual override of automated triage decisions.

#### Scenario: Update decision
- **WHEN** PUT /api/errors/:id is requested with new decision
- **THEN** errorTriage decision is updated
- **AND** rationale is updated to include 'Manual override'
- **AND** updated timestamp is recorded

#### Scenario: Update priority
- **WHEN** PUT /api/errors/:id is requested with new priority
- **THEN** errorTriage priority is updated (1-5 range)
- **AND** priority change is logged in metadata

### Requirement: Remediation Tracking Integration
The system SHALL integrate with existing remediationAttempts table.

#### Scenario: Link remediation attempt
- **WHEN** remediation is triggered for triaged error
- **THEN** remediationAttempt record is created with testName
- **AND** claudeSessionId links to assigned session
- **AND** errorTriage status is updated to track remediation progress

#### Scenario: Remediation completion
- **WHEN** remediationAttempt status becomes 'fixed'
- **THEN** errorTriage record is updated with completion timestamp
- **AND** rerun test result is linked via rerunReportId

### Requirement: Real-Time Triage Notifications
The system SHALL stream new triage decisions via WebSocket.

#### Scenario: Subscribe to triage events
- **WHEN** client subscribes to /api/errors/subscribe
- **THEN** new errorTriage records trigger subscription events
- **AND** events include full triage details and linked failure data

#### Scenario: Filter by project
- **WHEN** subscription includes projectId
- **THEN** only triage events for that project's tests are sent
