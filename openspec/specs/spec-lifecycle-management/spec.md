# Spec: Spec Lifecycle Management

## Overview

Spec Lifecycle Management provides a 7-state workflow system for tracking OpenSpec specifications from proposal through implementation to archival. The system features manual approval gates at critical decision points and automatic state transitions when objective criteria are met.

## Purpose

Enable clear work status visibility and workflow management for OpenSpec specifications by implementing:
- **7-state lifecycle**: proposing → approved → assigned → in_progress → review → applied → archived
- **Manual approval gates**: User approval required for proposal approval and implementation validation
- **Automatic transitions**: Specs advance automatically when tasks complete
- **State history**: Complete audit trail of all state changes
- **Applied spec tracking**: Track which specs have been implemented in which projects

## Architecture

### State Machine

```
proposing ──(manual approve)──> approved ──(auto)──> assigned ──(auto)──> in_progress
    ↑                               ↑           ↑           ↑                  ↓
    │                               │           │           │                  │
    └───────────(reject)────────────┴───────────┴───────────┴──────────────────┘
                                                                                ↓
                                                                           (auto when tasks done)
                                                                                ↓
                                                                             review
                                                                                ↓
                                                                        (manual validate)
                                                                                ↓
                                                                             applied
                                                                                ↓
                                                                          (user archive)
                                                                                ↓
                                                                            archived
```

### Database Schema

#### openspecSpecs Table (Enhanced)
- `status`: Enum of 7 states (proposing, approved, assigned, in_progress, review, applied, archived)
- `statusChangedAt`: Timestamp of last status change
- `statusChangedBy`: User/session/system that triggered the change

#### specLifecycle Table
Records complete history of all state transitions:
- `specId`: Foreign key to openspecSpecs
- `fromState`: Previous state (nullable for initial state)
- `toState`: New state
- `triggeredBy`: Type of trigger (user, system, worker)
- `triggerUserId`: User ID if user-triggered
- `triggerSessionId`: Session ID if worker-triggered
- `transitionedAt`: Timestamp
- `notes`: Optional context

#### appliedSpecs Table
Tracks which specs have been applied to which projects:
- `specId`: Foreign key to openspecSpecs
- `projectId`: Foreign key to projects
- `appliedAt`: Timestamp
- `appliedBy`: Session that applied the spec
- `verificationStatus`: pending, tests_passed, tests_failed
- `verificationNotes`: Optional notes about verification

## Services

### TransitionRulesEngine
Validates state transitions and detects automatic transition triggers.

**Key Methods**:
- `validateTransition(from, to)`: Check if transition allowed
- `getNextStates(currentState)`: Return possible next states
- `isManualGate(from, to)`: Check if user approval required
- `checkTasksComplete(tasksContent)`: Parse tasks.md for completion
- `shouldAutoTransition(specId)`: Determine if spec should auto-transition

### SpecLifecycleService
Manages state transitions and lifecycle operations.

**Key Methods**:
- `transitionState(specId, toState, triggeredBy, notes)`: Main transition entry point
- `approve(specId, userId)`: Approve proposal (proposing → approved)
- `reject(specId, reason, userId)`: Reject spec (any state → proposing)
- `markApplied(specId, projectId, appliedBy, notes)`: Mark as applied
- `updateVerification(specId, projectId, status, notes)`: Update test results
- `triggerAutomaticTransitions()`: Check all specs for auto-transitions

### LifecycleMonitor
Background job that monitors specs for automatic transitions.

Runs every 30 seconds to check if any specs in `in_progress` state have all tasks complete, then automatically transitions them to `review` state.

## API

### tRPC Router: `lifecycle`

**Queries**:
- `getStatus({ specId })`: Get current status, history, and task completion %
- `getAppliedSpecs({ projectId })`: Get all specs applied to project
- `getSpecApplications({ specId })`: Get all projects where spec applied
- `requiresApproval({ specId })`: Check if spec at manual gate
- `getNextStates({ specId })`: Get possible next states

**Mutations**:
- `transitionTo({ specId, toState, notes })`: Manual state transition
- `approve({ specId, userId })`: Approve proposal
- `reject({ specId, reason, userId })`: Reject spec
- `markApplied({ specId, projectId, verificationNotes })`: Mark as applied
- `updateVerification({ specId, projectId, status, notes })`: Update test status

## Workflow

### 1. Proposal Phase (proposing → approved)
- Spec created in `proposing` state
- User reviews proposal
- **Manual Gate**: User must explicitly approve or reject
- If approved: Transition to `approved`
- If rejected: Revert to `proposing` with rejection reason

### 2. Assignment Phase (approved → assigned)
- Worker picks up spec from queue
- **Automatic**: Transition to `assigned` when worker claims spec

### 3. Implementation Phase (assigned → in_progress → review)
- Worker starts first task
- **Automatic**: Transition to `in_progress` on first tool execution
- Worker completes tasks, marking each `[x]` in tasks.md
- **Automatic**: When all tasks `[x]` complete, transition to `review`

### 4. Review Phase (review → applied)
- User validates implementation
- User runs tests and verifies functionality
- **Manual Gate**: User must explicitly mark as applied
- When marked applied:
  - Transition to `applied` state
  - Record in `appliedSpecs` table
  - Set verification status to `pending`

### 5. Verification Phase
- User runs tests
- User updates verification status:
  - `tests_passed`: Implementation successful
  - `tests_failed`: Implementation has issues
- Notes can be added for context

### 6. Archive Phase (applied → archived)
- User triggers archive action
- Spec moved to `openspec/changes/archive/` directory
- State set to `archived` (terminal state)

## State Transition Rules

### Allowed Transitions
- `proposing` → `approved`, `proposing` (reject)
- `approved` → `assigned`, `proposing` (revert)
- `assigned` → `in_progress`, `proposing` (cancel)
- `in_progress` → `review`, `proposing` (cancel)
- `review` → `applied`, `in_progress` (send back for fixes)
- `applied` → `archived`
- `archived` → (none, terminal state)

### Manual Approval Gates
1. **proposing → approved**: User must review and approve proposal
2. **review → applied**: User must validate implementation and confirm tests pass

### Automatic Transitions
1. **approved → assigned**: Worker picks up from queue
2. **assigned → in_progress**: Worker starts first task
3. **in_progress → review**: All tasks marked complete
4. **applied → archived**: User-triggered action

## Task Completion Detection

Tasks are parsed from `tasks.md` using regex:
- Task line format: `- [ ]` (incomplete) or `- [x]` (complete)
- Completion percentage: `(completed / total) * 100`
- All complete when: `completed === total`

The background monitor checks every 30 seconds for specs in `in_progress` state with 100% task completion.

## Applied Spec Tracking

When a spec is marked as applied:
1. Record created in `appliedSpecs` table
2. Links spec to project where implemented
3. Stores applying session for attribution
4. Sets verification status to `pending`

Users can then update verification status to `tests_passed` or `tests_failed` with optional notes.

This enables:
- Tracking which projects have which specs
- Verification status across projects
- Audit trail of implementations
- Rollback planning if spec fails

## Error Handling

### Task Parsing Errors
- If `tasks.md` is malformed, log error and skip auto-transition
- Manual override available: User can force transition

### Transition Validation Errors
- If invalid transition attempted, throw error with clear message
- Validate state transitions before executing

### Background Job Errors
- Catch and log errors in lifecycle monitor
- Continue to next spec, don't crash job
- Store error in spec for manual investigation

## Configuration

### Background Monitor
- **Interval**: 30 seconds (configurable)
- **Auto-start**: Yes (on app initialization)
- **Graceful shutdown**: Yes (on app termination)

## Testing

### Unit Tests
- `TransitionRulesEngine`: Validate state machine logic
- Task parsing: Test completion detection
- Manual gate detection: Verify approval requirements

### Integration Tests
- Full lifecycle: Walk spec through all states
- Automatic transitions: Verify task completion triggers
- Applied spec tracking: Verify database records

## Migration

Existing specs automatically default to `proposing` status. No breaking changes to existing code.

## Future Enhancements

Potential additions (out of scope for initial implementation):
- State timeout notifications (stale spec alerts)
- Parallel review workflows
- Automated testing integration
- Multi-project spec applications
## Requirements
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

