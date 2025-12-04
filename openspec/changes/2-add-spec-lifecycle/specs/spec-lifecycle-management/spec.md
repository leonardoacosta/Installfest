# Spec Lifecycle Management Specification

## ADDED Requirements

### Requirement: 7-State Lifecycle Workflow
The system SHALL manage specifications through a 7-state lifecycle from proposal through implementation to archive.

#### Scenario: New spec defaults to proposing
- **WHEN** a new spec is created or synced from filesystem
- **THEN** the system sets status to 'proposing'
- **AND** creates initial lifecycle history entry

#### Scenario: Valid state transition
- **WHEN** a transition is requested from current state to allowed next state
- **THEN** the system updates spec status
- **AND** records transition in lifecycle history with timestamp and trigger
- **AND** emits state_changed event

#### Scenario: Invalid state transition blocked
- **WHEN** a transition is requested that violates state machine rules
- **THEN** the system rejects the transition with error message
- **AND** spec remains in current state
- **AND** no lifecycle history entry created

### Requirement: Manual Approval Gates
The system SHALL require explicit user approval at critical decision points in the lifecycle.

#### Scenario: Proposing to approved requires user action
- **WHEN** a spec is in 'proposing' state
- **THEN** automatic transition to 'approved' is blocked
- **AND** user must explicitly call approve endpoint
- **AND** approval is recorded with user ID in lifecycle history

#### Scenario: Review to applied requires user validation
- **WHEN** a spec is in 'review' state
- **THEN** automatic transition to 'applied' is blocked
- **AND** user must validate implementation and confirm tests pass
- **AND** user can provide verification notes

#### Scenario: Rejection reverts to proposing
- **WHEN** user rejects a spec at manual gate
- **THEN** the system transitions spec back to 'proposing' state
- **AND** records rejection reason in notes
- **AND** creates notification for original submitter

### Requirement: Automatic State Transitions
The system SHALL automatically advance specs when objective criteria are met without requiring user action.

#### Scenario: Approved to assigned on worker pickup
- **WHEN** a worker picks up an approved spec from work queue
- **THEN** the system automatically transitions to 'assigned'
- **AND** records worker session in lifecycle history

#### Scenario: Assigned to in_progress on first task
- **WHEN** an assigned spec's worker starts first task
- **THEN** the system automatically transitions to 'in_progress'
- **AND** records transition with worker session

#### Scenario: In_progress to review on tasks complete
- **WHEN** all tasks in tasks.md are marked `[x]` complete
- **THEN** the system automatically transitions to 'review' state
- **AND** triggers within 30 seconds of last task completion
- **AND** creates notification for reviewer

#### Scenario: Applied to archived on user trigger
- **WHEN** user triggers archive command for applied spec
- **THEN** the system transitions to 'archived' state
- **AND** runs `openspec archive` CLI command
- **AND** moves files to archive/ directory

### Requirement: Task Completion Detection
The system SHALL parse tasks.md to detect when all implementation tasks are complete.

#### Scenario: Calculate task completion percentage
- **WHEN** querying spec with tasks
- **THEN** the system parses tasks.md for checkbox lines `- [ ]` and `- [x]`
- **AND** calculates percentage: (completed / total) * 100
- **AND** returns completion percentage with spec data

#### Scenario: All tasks complete triggers review
- **WHEN** background job checks in_progress specs every 30 seconds
- **AND** spec has all tasks marked `[x]` complete
- **THEN** the system automatically transitions to 'review'
- **AND** logs automatic transition

#### Scenario: Malformed tasks.md handled gracefully
- **WHEN** tasks.md cannot be parsed (invalid markdown)
- **THEN** the system logs error
- **AND** does not auto-transition
- **AND** allows manual transition override

### Requirement: Lifecycle History Audit Trail
The system SHALL maintain complete history of all state transitions for audit and debugging.

#### Scenario: Record every transition
- **WHEN** any state transition occurs
- **THEN** the system records entry in specLifecycle table
- **AND** includes fromState, toState, triggeredBy, timestamp
- **AND** optionally includes trigger user/session and notes

#### Scenario: Query state history for spec
- **WHEN** user requests lifecycle history for a spec
- **THEN** the system returns all transitions chronologically
- **AND** includes who triggered each transition
- **AND** shows time spent in each state

#### Scenario: Real-time state change subscription
- **WHEN** client subscribes to lifecycle events
- **THEN** the system streams state_changed events
- **AND** includes spec details and transition info
- **AND** emits immediately on transition

### Requirement: Applied Spec Tracking
The system SHALL track which specifications have been implemented in each project with verification status.

#### Scenario: Record spec application to project
- **WHEN** spec transitions to 'applied' state
- **THEN** the system creates appliedSpecs record
- **AND** links spec to project where applied
- **AND** records applying session for attribution
- **AND** sets verificationStatus to 'pending'

#### Scenario: Update verification status after testing
- **WHEN** user runs tests after applying spec
- **THEN** user updates verificationStatus to 'tests_passed' or 'tests_failed'
- **AND** provides verification notes
- **AND** system persists status for future reference

#### Scenario: Query specs applied to project
- **WHEN** querying applied specs for a project
- **THEN** the system returns all specs with appliedSpecs records for that project
- **AND** includes verification status and notes
- **AND** sorts by appliedAt timestamp descending

#### Scenario: Prevent duplicate application tracking
- **WHEN** attempting to record spec application to project where already applied
- **THEN** the system updates existing appliedSpecs record
- **AND** does not create duplicate
- **AND** enforced by unique index on projectId + specId
