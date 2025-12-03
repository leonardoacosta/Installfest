# Playwright Report Server Specification

## ADDED Requirements

### Requirement: Report Indexing
The system SHALL automatically detect and index Playwright reports written by GitHub runners.

#### Scenario: New report detection
- **WHEN** runner writes report to /reports/{workflow}/{run_id}/
- **THEN** file watcher detects new directory within 5 seconds
- **AND** report HTML is parsed for metadata
- **AND** metadata is stored in SQLite database

#### Scenario: Metadata extraction
- **WHEN** report HTML is parsed
- **THEN** total test count is extracted
- **AND** passed, failed, skipped counts are extracted
- **AND** test duration is extracted
- **AND** workflow name and run ID are recorded
- **AND** timestamp is recorded

### Requirement: Report Listing API
The system SHALL provide a REST API to query report metadata.

#### Scenario: List all reports
- **WHEN** GET /api/reports is requested
- **THEN** JSON array of reports is returned
- **AND** reports are ordered by timestamp descending
- **AND** each report includes id, workflow, run_id, timestamp, test counts

#### Scenario: Filter by workflow
- **WHEN** GET /api/reports?workflow=test-suite is requested
- **THEN** only reports from that workflow are returned
- **AND** ordering is maintained

#### Scenario: Date range filtering
- **WHEN** GET /api/reports?from=2024-01-01&to=2024-01-31 is requested
- **THEN** only reports within date range are returned

### Requirement: Report Viewing
The system SHALL serve Playwright HTML reports for viewing in browser.

#### Scenario: Report access
- **WHEN** user clicks report in UI
- **THEN** Playwright HTML report is served
- **AND** report renders with full interactivity
- **AND** all test details are accessible

#### Scenario: Static file serving
- **WHEN** report HTML references assets (CSS, JS, images)
- **THEN** all assets are served correctly
- **AND** report displays without broken resources

### Requirement: Web UI
The system SHALL provide a web interface for browsing and viewing reports.

#### Scenario: Report list display
- **WHEN** user accesses playwright.local
- **THEN** table of reports is displayed
- **AND** table shows workflow, run number, timestamp, test counts, pass rate
- **AND** table is paginated

#### Scenario: Workflow filtering
- **WHEN** user selects workflow from dropdown
- **THEN** report list filters to that workflow
- **AND** filter persists across page refreshes

#### Scenario: Search functionality
- **WHEN** user enters search term
- **THEN** reports are filtered by workflow name or run ID
- **AND** results update in real-time

### Requirement: Report Deletion
The system SHALL allow deletion of old reports to manage disk space.

#### Scenario: Delete single report
- **WHEN** DELETE /api/reports/:id is requested
- **THEN** report files are deleted from disk
- **AND** database record is removed
- **AND** 200 status is returned

#### Scenario: Bulk deletion
- **WHEN** multiple reports are selected for deletion
- **THEN** all selected reports are deleted
- **AND** operation is atomic (all or nothing)

### Requirement: Database Persistence
Report metadata SHALL be persisted in SQLite database.

#### Scenario: Database schema
- **WHEN** server starts
- **THEN** database schema is created if not exists
- **AND** schema includes reports table with all required fields
- **AND** indexes are created for query performance

#### Scenario: Data integrity
- **WHEN** report is indexed
- **THEN** database transaction ensures atomicity
- **AND** failures do not leave partial records

### Requirement: Traefik Integration
The server SHALL be accessible via Traefik reverse proxy.

#### Scenario: Domain routing
- **WHEN** user navigates to playwright.local
- **THEN** Traefik routes request to playwright-server container
- **AND** TLS is handled by Traefik
- **AND** response is returned to user

### Requirement: Network Access
The server SHALL be accessible from any device on the local network.

#### Scenario: Cross-device access
- **WHEN** user accesses playwright.local from any network device
- **THEN** UI loads successfully
- **AND** reports are viewable
- **AND** no authentication is required (per user requirement)
