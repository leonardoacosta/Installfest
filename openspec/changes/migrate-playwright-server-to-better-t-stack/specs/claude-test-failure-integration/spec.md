# Claude Test Failure Integration Specification

## ADDED Requirements

### Requirement: Test Failure Notification to Claude
The system SHALL send test failure notifications to claude-agent-server when configured thresholds are met.

#### Scenario: Evaluate and notify on threshold met
- **WHEN** a report is indexed AND failures meet configured thresholds
- **THEN** constructs failure notification payload
- **AND** calls claude-agent-server tRPC endpoint `testFailures.notify`
- **AND** includes test details, code context, and classification

#### Scenario: Skip notification below threshold
- **WHEN** a report is indexed AND failures do not meet thresholds
- **THEN** logs decision to skip notification with reason
- **AND** stores failures in database for history
- **AND** does not contact claude-agent-server

#### Scenario: Handle Claude server unavailable
- **WHEN** notification call to Claude fails
- **THEN** logs error with retry intent
- **AND** queues notification for retry with exponential backoff
- **AND** continues processing other reports
- **AND** does not block main workflow

### Requirement: Failure Notification Payload
The system SHALL construct rich failure context payload for Claude to investigate.

#### Scenario: Build notification payload
- **WHEN** preparing notification for Claude
- **THEN** includes source identifier ('playwright-server')
- **AND** includes workflow name and run identifiers
- **AND** includes report URL for detailed viewing
- **AND** includes array of failed tests with full context
- **AND** includes summary statistics

#### Scenario: Include per-test context
- **WHEN** building failed test details
- **THEN** includes test name and display title
- **AND** includes test file path and line number
- **AND** includes error message and stack trace
- **AND** includes isFlaky flag based on classification
- **AND** includes previousFailures count from history

#### Scenario: Include historical context
- **WHEN** test has failure history
- **THEN** includes number of previous failures
- **AND** includes classification (NEW, FLAKY, RECURRING, PERSISTENT)
- **AND** includes first seen and last seen timestamps
- **AND** calculates failure rate percentage

### Requirement: Remediation Tracking
The system SHALL track Claude's remediation attempts and outcomes in the database.

#### Scenario: Record remediation attempt initiation
- **WHEN** Claude accepts failure notification
- **THEN** creates remediation_attempts record with status 'pending'
- **AND** stores Claude session ID for tracking
- **AND** records triggered_at timestamp
- **AND** links to source report

#### Scenario: Update remediation progress
- **WHEN** Claude session status changes
- **THEN** updates remediation_attempts status field
- **AND** records completed_at timestamp when finished
- **AND** stores fix_description from Claude
- **AND** stores PR URL if Claude creates pull request

#### Scenario: Validate remediation success
- **WHEN** tests re-run after Claude's fix
- **THEN** links new report to remediation_attempts via rerun_report_id
- **AND** checks if previously failed tests now pass
- **AND** sets rerun_passed boolean
- **AND** calculates remediation success rate

### Requirement: Remediation API
The system SHALL provide tRPC procedures for querying and managing remediation attempts.

#### Scenario: List remediation attempts
- **WHEN** client calls `remediation.list` with optional filters
- **THEN** returns paginated remediation records
- **AND** includes related report and test details
- **AND** supports filtering by status, test name, date range

#### Scenario: Get remediation details
- **WHEN** client calls `remediation.getById` with attempt ID
- **THEN** returns full remediation record
- **AND** includes original failure context
- **AND** includes Claude session details
- **AND** includes rerun results if available

#### Scenario: Get remediation statistics
- **WHEN** client calls `remediation.getStats`
- **THEN** returns aggregated success metrics
- **AND** calculates overall success rate
- **AND** identifies frequently failing tests
- **AND** calculates average time to fix

### Requirement: Retry Queue for Failed Notifications
The system SHALL implement retry mechanism for failed Claude notifications with exponential backoff.

#### Scenario: Queue failed notification
- **WHEN** Claude notification fails due to network error
- **THEN** stores notification in retry queue
- **AND** sets initial retry delay (e.g., 30 seconds)
- **AND** increments attempt counter

#### Scenario: Retry with exponential backoff
- **WHEN** processing retry queue
- **THEN** waits for calculated backoff period (attempt * base_delay)
- **AND** attempts notification again
- **AND** removes from queue on success
- **AND** increases backoff on failure

#### Scenario: Abandon after max retries
- **WHEN** notification retry exceeds max attempts (e.g., 5)
- **THEN** marks notification as permanently failed
- **AND** logs error for manual review
- **AND** removes from retry queue
- **AND** alerts admin if configured

### Requirement: Claude Agent Server Integration API
The claude-agent-server SHALL expose a tRPC procedure for receiving test failure notifications.

#### Scenario: Accept test failure notification
- **WHEN** `testFailures.notify` procedure is called
- **THEN** validates notification payload with Zod schema
- **AND** evaluates whether to create Claude session
- **AND** returns acceptance status and session ID if created

#### Scenario: Create Claude session for remediation
- **WHEN** accepting a test failure notification
- **THEN** creates new agent session linked to source project
- **AND** generates initial prompt with failure context
- **AND** includes report URL and test details
- **AND** starts Claude agent with investigation task

#### Scenario: Reject below internal threshold
- **WHEN** notification doesn't meet claude-agent-server's criteria
- **THEN** returns accepted: false with reason
- **AND** logs decision for audit
- **AND** does not create session

### Requirement: Batch Notification for Multiple Failures
The system SHALL batch multiple test failures from the same run into a single notification.

#### Scenario: Batch failures in notification
- **WHEN** multiple tests fail in same report
- **THEN** sends single notification with array of all failures
- **AND** groups by test file or module if possible
- **AND** includes summary of failure distribution

#### Scenario: Prioritize failures in batch
- **WHEN** batching failures
- **THEN** orders by priority (NEW > PERSISTENT > RECURRING > FLAKY)
- **AND** highlights critical test failures at top
- **AND** includes count by classification type

### Requirement: Manual Remediation Trigger
The system SHALL allow manual triggering of remediation from the web UI.

#### Scenario: Trigger remediation from UI
- **WHEN** user clicks "Request Claude Fix" on a failure
- **THEN** bypasses threshold checks
- **AND** sends notification to Claude immediately
- **AND** creates remediation_attempts record
- **AND** shows confirmation with session link

#### Scenario: Manual trigger with custom context
- **WHEN** user provides additional context (e.g., suspected cause)
- **THEN** includes user notes in notification payload
- **AND** passes to Claude as additional investigation hints
- **AND** records user who triggered in remediation record

### Requirement: Remediation Dashboard
The system SHALL provide web UI for viewing active and historical remediation attempts.

#### Scenario: View active remediations
- **WHEN** viewing remediation dashboard
- **THEN** displays in-progress Claude sessions
- **AND** shows test being investigated
- **AND** displays elapsed time
- **AND** provides link to Claude session (if UI available)

#### Scenario: View remediation history
- **WHEN** viewing historical remediations
- **THEN** shows completed attempts with outcomes
- **AND** highlights successful fixes with green indicator
- **AND** shows failed attempts with error details
- **AND** supports filtering by test, status, date

#### Scenario: View success metrics
- **WHEN** viewing remediation statistics
- **THEN** displays overall success rate as percentage
- **AND** shows average time to fix
- **AND** identifies most frequently remediated tests
- **AND** compares success rate by failure classification

### Requirement: Configuration UI
The system SHALL provide web interface for adjusting failure threshold configuration.

#### Scenario: Edit threshold settings
- **WHEN** admin views configuration page
- **THEN** displays current threshold values
- **AND** allows editing minFailedTests, failureRate, flags
- **AND** validates inputs (e.g., percentage 0-100)
- **AND** saves to database or environment config

#### Scenario: Manage test patterns
- **WHEN** admin edits critical or exclusion patterns
- **THEN** provides regex pattern input fields
- **AND** validates regex syntax before saving
- **AND** shows example matches for verification
- **AND** applies immediately to new reports

#### Scenario: Toggle integration
- **WHEN** admin toggles CLAUDE_INTEGRATION_ENABLED
- **THEN** updates configuration in database
- **AND** shows current integration status clearly
- **AND** optionally restarts notification system
- **AND** logs configuration change with timestamp and user

### Requirement: Notification Rate Limiting
The system SHALL limit the rate of notifications sent to Claude to prevent overwhelming.

#### Scenario: Enforce max notifications per workflow
- **WHEN** workflow has sent notification within cooldown period
- **THEN** skips new notification for same workflow
- **AND** logs skip reason with time remaining
- **AND** queues for later if configured

#### Scenario: Enforce global notification limit
- **WHEN** global notification count exceeds limit per time window
- **THEN** queues notifications for later processing
- **AND** prioritizes by failure severity
- **AND** alerts admin if queue grows too large

### Requirement: Integration Health Monitoring
The system SHALL monitor health of Claude integration and alert on issues.

#### Scenario: Track notification success rate
- **WHEN** sending notifications to Claude
- **THEN** tracks success and failure counts
- **AND** calculates success rate over time window
- **AND** alerts if success rate drops below threshold (e.g., 80%)

#### Scenario: Monitor Claude response time
- **WHEN** Claude accepts notifications
- **THEN** measures response time (latency)
- **AND** tracks P95 and P99 percentiles
- **AND** alerts if latency exceeds threshold

#### Scenario: Detect Claude unavailability
- **WHEN** multiple consecutive notifications fail
- **THEN** marks Claude integration as degraded
- **AND** reduces notification frequency automatically
- **AND** sends alert to admin
- **AND** attempts recovery check periodically

## MODIFIED Requirements

None. This is a new capability being added.

## REMOVED Requirements

None. This is a new capability being added.
