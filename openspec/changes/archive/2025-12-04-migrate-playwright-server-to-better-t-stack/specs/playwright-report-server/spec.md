# Playwright Report Server Specification

## ADDED Requirements

### Requirement: Monorepo Workspace Structure
The system SHALL organize code as a monorepo using Better-T-Stack conventions with separate apps and shared packages.

#### Scenario: Workspace organization
- **WHEN** the project is structured
- **THEN** it contains `apps/` for applications and `packages/` for shared code
- **AND** uses workspace protocol for internal dependencies

#### Scenario: Build orchestration
- **WHEN** running builds
- **THEN** Turborepo coordinates builds across all workspaces
- **AND** leverages caching for unchanged packages

### Requirement: Type-Safe API Layer with tRPC
The system SHALL provide type-safe API communication using tRPC procedures instead of REST endpoints.

#### Scenario: API procedure definition
- **WHEN** defining an API endpoint
- **THEN** it is implemented as a tRPC procedure with input/output validation
- **AND** types are automatically inferred on the client

#### Scenario: Frontend API consumption
- **WHEN** the frontend calls an API
- **THEN** it uses the tRPC client with full TypeScript autocomplete
- **AND** receives compile-time errors for invalid parameters

### Requirement: Drizzle ORM Database Layer
The system SHALL use Drizzle ORM for type-safe database operations instead of raw SQLite3 queries.

#### Scenario: Schema definition
- **WHEN** defining database tables
- **THEN** schemas are written as Drizzle table definitions in TypeScript
- **AND** migrations are generated from schema changes

#### Scenario: Type-safe queries
- **WHEN** querying the database
- **THEN** Drizzle provides fully typed query builder
- **AND** prevents invalid column references at compile time

### Requirement: Enhanced Report Parsing with Code Context
The system SHALL extract detailed test metadata including file paths and line numbers from Playwright HTML reports.

#### Scenario: Extract test file location
- **WHEN** parsing a Playwright HTML report
- **THEN** extracts test file path (e.g., "tests/auth/login.spec.ts")
- **AND** extracts line number where test is defined
- **AND** stores this metadata in database

#### Scenario: Extract error context
- **WHEN** a test fails
- **THEN** extracts error message and stack trace
- **AND** preserves formatting for readability
- **AND** includes any attached screenshots or videos

#### Scenario: Fallback parsing
- **WHEN** metadata extraction fails
- **THEN** falls back to basic statistics (pass/fail counts)
- **AND** logs warning for debugging
- **AND** stores partial data rather than failing completely

### Requirement: Failure History Tracking
The system SHALL track test failure history to identify patterns and classify failure types.

#### Scenario: Record first failure
- **WHEN** a test fails for the first time
- **THEN** creates failure history record with occurrence count of 1
- **AND** marks as NEW failure type
- **AND** records timestamp as first_seen

#### Scenario: Update failure history
- **WHEN** a previously failed test fails again
- **THEN** increments occurrence count
- **AND** updates last_seen timestamp
- **AND** increments consecutive_failures if no passing run between
- **AND** increments total_runs counter

#### Scenario: Reset consecutive failures
- **WHEN** a previously failed test passes
- **THEN** resets consecutive_failures to 0
- **AND** increments total_runs counter
- **AND** keeps occurrence count and timestamps

### Requirement: Failure Classification
The system SHALL classify test failures as NEW, FLAKY, RECURRING, or PERSISTENT based on historical data.

#### Scenario: Classify new failure
- **WHEN** a test has no failure history
- **THEN** classifies as NEW
- **AND** includes in high-priority notification

#### Scenario: Classify flaky failure
- **WHEN** a test has failure rate < 30% AND consecutive_failures < 3
- **THEN** classifies as FLAKY
- **AND** optionally excludes from auto-remediation

#### Scenario: Classify persistent failure
- **WHEN** a test has consecutive_failures >= 3
- **THEN** classifies as PERSISTENT
- **AND** marks as high-priority for remediation

#### Scenario: Classify recurring failure
- **WHEN** a test has multiple failures but doesn't meet flaky or persistent criteria
- **THEN** classifies as RECURRING
- **AND** includes in standard remediation workflow

### Requirement: Configurable Failure Threshold
The system SHALL evaluate test failures against configurable thresholds to determine if remediation should trigger.

#### Scenario: Evaluate minimum failed tests
- **WHEN** report has fewer failures than minFailedTests threshold
- **THEN** does not trigger remediation
- **AND** logs reason for skipping

#### Scenario: Evaluate new failures only
- **WHEN** onlyNewFailures is true AND all failures are recurring
- **THEN** does not trigger remediation
- **AND** provides summary of recurring failures

#### Scenario: Evaluate critical test patterns
- **WHEN** any failed test matches criticalTestPatterns regex
- **THEN** triggers remediation regardless of other thresholds
- **AND** marks as high-priority

#### Scenario: Evaluate exclusion patterns
- **WHEN** failed test matches excludeTestPatterns regex
- **THEN** excludes test from remediation consideration
- **AND** logs exclusion reason

### Requirement: Reports API
The system SHALL provide tRPC procedures for querying and managing test reports.

#### Scenario: List reports with filters
- **WHEN** client calls `reports.list` with optional filters
- **THEN** returns paginated reports matching criteria
- **AND** includes total count for pagination
- **AND** orders by timestamp descending

#### Scenario: Get report details
- **WHEN** client calls `reports.getById` with report ID
- **THEN** returns full report metadata
- **AND** includes related test failures
- **AND** includes remediation status if applicable

#### Scenario: Delete report
- **WHEN** client calls `reports.delete` with report ID
- **THEN** removes report from database
- **AND** optionally deletes report files from disk
- **AND** cascades delete to related failures

### Requirement: Failures API
The system SHALL provide tRPC procedures for querying failure history and classifications.

#### Scenario: List active failures
- **WHEN** client calls `failures.listActive`
- **THEN** returns failures from most recent run
- **AND** includes classification for each failure
- **AND** includes remediation status

#### Scenario: Get failure history
- **WHEN** client calls `failures.getHistory` with test name
- **THEN** returns historical failure data
- **AND** calculates failure rate
- **AND** identifies flakiness patterns

#### Scenario: Get failure statistics
- **WHEN** client calls `failures.getStats`
- **THEN** returns aggregated failure metrics
- **AND** groups by classification type
- **AND** includes top failing tests

### Requirement: Environment Configuration
The system SHALL support environment-specific configuration for monorepo workspaces and Claude integration.

#### Scenario: API environment variables
- **WHEN** API server starts
- **THEN** loads configuration from environment variables
- **AND** validates required variables are present
- **AND** provides typed configuration object

#### Scenario: Claude integration toggle
- **WHEN** CLAUDE_INTEGRATION_ENABLED is false
- **THEN** disables failure notification to Claude
- **AND** continues normal report processing
- **AND** logs that integration is disabled

### Requirement: Docker Deployment Compatibility
The system SHALL maintain Docker deployment compatibility with modified build process.

#### Scenario: Monorepo Docker build
- **WHEN** building Docker image
- **THEN** Turborepo builds all dependencies
- **AND** outputs production-ready bundle
- **AND** preserves same port exposure (3000)

#### Scenario: Volume mounts preservation
- **WHEN** deploying in homelab
- **THEN** maintains access to `/reports` volume (shared with runners)
- **AND** persists database to `/app/db` volume
- **AND** file watcher monitors same directory path

### Requirement: File Watching and Auto-Indexing
The system SHALL monitor the reports directory for new Playwright reports and trigger automatic indexing with threshold evaluation.

#### Scenario: Watch for new reports
- **WHEN** server starts
- **THEN** initializes chokidar watcher on REPORTS_DIR
- **AND** processes existing reports (ignoreInitial: false)
- **AND** monitors for new index.html files

#### Scenario: Index and evaluate failures
- **WHEN** new report is detected
- **THEN** parses report with enhanced extraction
- **AND** stores in database
- **AND** evaluates against failure thresholds
- **AND** triggers Claude notification if thresholds met

## MODIFIED Requirements

### Requirement: Report Indexing
The system SHALL parse Playwright HTML reports and store enhanced metadata using Drizzle ORM.

**Previous Implementation:** Basic statistics extraction (total, passed, failed, skipped) stored via raw SQLite3 INSERT

**New Implementation:** Enhanced extraction with code context, stored via Drizzle ORM with type safety

#### Scenario: Index new report with enhanced metadata
- **WHEN** file watcher detects new index.html
- **THEN** parses report using shared report-parser package
- **AND** extracts test statistics, file paths, line numbers, errors
- **AND** stores in database using Drizzle with type validation
- **AND** creates or updates failure history records

#### Scenario: Handle parsing errors gracefully
- **WHEN** report parsing fails
- **THEN** stores basic metadata (workflow, run_id) without test details
- **AND** logs detailed error for debugging
- **AND** marks report as partially_indexed
- **AND** allows manual retry or inspection

## REMOVED Requirements

None. This change enhances existing capabilities without removing features.
