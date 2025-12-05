## ADDED Requirements

### Requirement: Automatic Error Proposal Generation
The system SHALL automatically generate spec proposals from Playwright test failures.

#### Scenario: Generate proposal from test failure
- **WHEN** a new test failure is detected in testFailures table
- **THEN** system automatically generates a spec proposal without user intervention
- **AND** proposal includes: title, why section, what changes, tasks
- **AND** proposal is written to filesystem as change/{id}/proposal.md, tasks.md
- **AND** proposal is synced to database with status='proposing'
- **AND** errorProposals table links testFailureId to specId

#### Scenario: Proposal content generation
- **WHEN** spec proposal is generated from test failure
- **THEN** proposal.md includes:
  - **Title**: "Fix: {cleanTestName}" (extracted from stack trace)
  - **Why section**:
    - Error classification (PERSISTENT/RECURRING/FLAKY/NEW)
    - Error message (full, in code block)
    - Stack trace (relevant lines, in code block)
    - Failure pattern: "{N} occurrences, first seen {date}, last seen {date}"
  - **What Changes**: Inferred from error type
  - **Impact**: Affected files and systems
- **AND** tasks.md includes auto-generated tasks:
  - "Investigate {affectedFile} - understand the error"
  - "Implement fix for {issue}"
  - "Add test coverage"
  - "Run tests to verify fix"
  - Each task as checkbox item: `- [ ] 1. Task name`

#### Scenario: Error classification priority mapping
- **WHEN** proposal is generated
- **THEN** priority is calculated from classification:
  - PERSISTENT failures (100% failure rate) → Priority 5 (critical)
  - RECURRING failures (3+ occurrences) → Priority 4 (high)
  - FLAKY failures (inconsistent) → Priority 3 (medium)
  - NEW failures (first occurrence) → Priority 2 (low)

### Requirement: Duplicate Detection and Linking
The system SHALL detect related failures and link them to the same proposal.

#### Scenario: Detect duplicate error
- **WHEN** new test failure detected with same test name as existing proposal
- **THEN** system compares error messages
- **AND** if error message is identical: Link to existing proposal
- **AND** if error message differs: Create new proposal (different issue)

#### Scenario: Update on recurrence
- **WHEN** duplicate error detected (same test, same error message)
- **THEN** errorProposals.lastFailureAt is updated to current time
- **AND** errorProposals.occurrenceCount is incremented
- **AND** event error_proposal_updated is emitted
- **AND** related testFailure is linked to errorProposal

#### Scenario: Link to existing spec
- **WHEN** error is related to existing spec being implemented
- **THEN** user can call errorProposals.link({ errorProposalId, existingSpecId })
- **AND** errorProposals.specId is set to existing spec
- **AND** testFailureId is still linked to errorProposal
- **AND** automatic proposal generation is skipped for related failures

### Requirement: Priority Escalation
The system SHALL increase priority when same error recurs.

#### Scenario: Escalate priority on recurrence
- **WHEN** duplicate error detected and occurrenceCount incremented
- **THEN** system recalculates priority:
  - NEW (1st occurrence) → Priority 2
  - After 2nd occurrence (FLAKY) → Priority 3
  - After 3rd occurrence (RECURRING) → Priority 4
  - After 4th+ occurrences (PERSISTENT) → Priority 5
  - PERSISTENT stays at 5 (no further escalation)
- **AND** work queue item priority is updated if spec already queued
- **AND** event error_priority_escalated is emitted with new priority

#### Scenario: Work queue priority update
- **WHEN** error priority escalates and spec is in work queue
- **THEN** work queue item priority is updated
- **AND** queue is re-sorted by new priority
- **AND** higher-priority items move up in queue

### Requirement: Failure Watcher
The system SHALL continuously monitor for new test failures and generate proposals.

#### Scenario: Monitor for new failures
- **WHEN** server starts
- **THEN** failure watcher subscribes to testFailures table
- **AND** scans for failures without corresponding errorProposal entries
- **AND** processes them periodically (every 30 seconds)

#### Scenario: Process failure batch
- **WHEN** failure watcher scans for pending failures
- **THEN** for each new failure:
  - Extract test name, error message, stack trace
  - Check for existing errorProposal
  - If not exists: Generate new proposal
  - If exists: Update existing (recurrence)
- **AND** handle errors gracefully (continue processing others on failure)
- **AND** log summary: "{N} failures processed, {N} new proposals, {N} updates"

### Requirement: Error Analysis
The system SHALL analyze test failures to infer fix requirements.

#### Scenario: Classify error type
- **WHEN** test failure is analyzed
- **THEN** system classifies error into categories:
  - Type error: "Property X is not assignable to type Y"
  - Missing property: "Property X does not exist on type Y"
  - Assertion failure: "Expected X but got Y"
  - Network error: "timeout", "connection refused", "ECONNREFUSED"
  - Configuration: "config not found", "missing environment variable"
  - Other: Default classification
- **AND** error type is included in proposal for context

#### Scenario: Infer fix from error
- **WHEN** error type is classified
- **THEN** system suggests fix approach in "What Changes" section:
  - Type error → "Update type definitions to match usage"
  - Missing property → "Add {propertyName} field to type definition"
  - Assertion failure → "Implement missing functionality for {feature}"
  - Network error → "Add retry logic and timeout handling"
  - Configuration → "Update configuration file {path} with required setting"

### Requirement: Auto-Queue Error Proposals
The system SHALL automatically add generated proposals to work queue.

#### Scenario: Add generated proposal to queue
- **WHEN** error proposal is generated
- **THEN** corresponding spec is automatically added to work queue
- **AND** work queue item priority matches proposal priority
- **AND** work item status is 'queued'
- **AND** user sees proposal in Approvals tab (or Errors tab with "Approve" action)

### Requirement: Error Proposals Dashboard
The system SHALL display error proposals for user review and action.

#### Scenario: List error proposals
- **WHEN** user navigates to /dashboard/errors (or errors tab in /dashboard/work-queue)
- **THEN** displays table of pending error proposals
- **AND** columns: Test name, Error type, Priority, Classification, Occurrences, First/Last seen, Actions
- **AND** rows color-coded by priority (red=5, orange=4, yellow=3, blue=2)
- **AND** sorted by priority DESC, then occurrences DESC

#### Scenario: Filter error proposals
- **WHEN** user adjusts filters
- **THEN** table updates:
  - Filter by classification checkboxes
  - Filter by priority range slider
  - Search by test name

#### Scenario: Approve error proposal
- **WHEN** user clicks "Approve" on error proposal
- **THEN** associated spec transitions from 'proposing' to 'approved'
- **AND** work queue item marked ready for assignment
- **AND** proposal moves to "Approved" or work queue tab
- **AND** dashboard notification: "Error proposal approved: Fix: {testName}"

#### Scenario: Reject error proposal
- **WHEN** user clicks "Reject" on error proposal
- **THEN** user is shown rejection reason modal
- **AND** on confirm: Spec is archived immediately
- **AND** error proposal is marked as rejected
- **AND** work queue item is removed
- **AND** similar future failures are NOT auto-proposed (skip list)

#### Scenario: View error details
- **WHEN** user clicks "View Related" on error proposal
- **THEN** modal shows:
  - All testFailure records linked to this proposal
  - Original error message and stack trace
  - Occurrence timeline (when each failure occurred)
  - Links to Playwright server test details

### Requirement: Real-Time Error Proposal Events
The system SHALL stream error proposal events to connected clients.

#### Scenario: Subscribe to error proposals
- **WHEN** client calls errorProposals.subscribe({ projectId? })
- **THEN** server streams events for that project's errors
- **AND** event types: proposal_generated, proposal_updated, priority_escalated

#### Scenario: New proposal event
- **WHEN** error proposal is generated
- **THEN** subscription event includes: errorProposalId, testFailureId, specId, priority, classification, testName
- **AND** clients add row to errors table with animation
- **AND** dashboard shows toast: "New error found!"

#### Scenario: Priority escalation event
- **WHEN** error recurs and priority increases
- **THEN** subscription event includes: updated occurrenceCount, new priority
- **AND** clients update row with new priority and occurrenceCount
- **AND** row briefly highlighted to show priority change

## MODIFIED Requirements

### Requirement: Work Queue Management
Work queue SHALL automatically add generated error proposals with calculated priority.

#### Scenario: Queue error proposal
- **WHEN** error proposal is generated
- **THEN** corresponding spec is automatically queued
- **AND** work queue item created with calculated priority
- **AND** work item status is 'queued'
- **AND** user sees item in work queue or approvals tab

#### Scenario: Update queue priority on escalation
- **WHEN** error priority escalates
- **THEN** corresponding work queue item priority is updated
- **AND** work queue is re-sorted
- **AND** higher-priority items may move up in queue

### Requirement: Spec Lifecycle Management
Error proposals SHALL enter lifecycle as 'proposing' status.

#### Scenario: Error proposal in lifecycle
- **WHEN** error proposal is generated
- **THEN** corresponding spec is created with status='proposing'
- **AND** awaits user approval via lifecycle.approve()
- **AND** work queue item created but blocked until approved
- **AND** user can edit proposal before approval (edit proposal.md, tasks.md)
