# playwright-report-server Specification

## Purpose
TBD - created by archiving change add-automated-deployment-system. Update Purpose after archive.
## Requirements
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

### Requirement: Monorepo Architecture
The system SHALL be part of a unified homelab-services monorepo with shared packages.

#### Scenario: Application structure
- **WHEN** codebase is organized
- **THEN** playwright-server exists as apps/playwright-server within monorepo
- **AND** app has independent package.json and tsconfig
- **AND** app can be built and deployed independently

#### Scenario: Shared UI components
- **WHEN** UI components are needed
- **THEN** app imports from @homelab/ui package
- **AND** components include DataTable, DatePicker, StatsCard, Layout
- **AND** components are built with shadcn/ui and Tailwind

#### Scenario: Shared database utilities
- **WHEN** database operations are needed
- **THEN** app imports connection factory from @homelab/db
- **AND** app imports pagination helpers from @homelab/db
- **AND** app maintains its own schema definitions

#### Scenario: Shared validators
- **WHEN** API input validation is needed
- **THEN** app imports common schemas from @homelab/validators
- **AND** app can define app-specific schemas (report filters)
- **AND** validators are built with Zod

#### Scenario: Independent Docker build
- **WHEN** Docker image is built
- **THEN** Turborepo prunes dependencies to only playwright-server requirements
- **AND** multi-stage Dockerfile optimizes build layers
- **AND** final image contains only runtime dependencies

### Requirement: Workspace Build System
The system SHALL use Turborepo for build orchestration and caching.

#### Scenario: Development build
- **WHEN** `turbo run dev --filter=playwright-server` is executed
- **THEN** only playwright-server and its dependencies are built
- **AND** shared packages are watched for changes
- **AND** hot reload works for both app and packages

#### Scenario: Production build
- **WHEN** `turbo run build --filter=playwright-server` is executed
- **THEN** app is built with optimizations enabled
- **AND** shared packages are built first (dependency order)
- **AND** build artifacts are cached for future builds

#### Scenario: Package changes trigger rebuild
- **WHEN** file in @homelab/ui is modified
- **THEN** Turborepo detects change via content hashing
- **AND** playwright-server rebuild is triggered
- **AND** cached layers are reused where possible

### Requirement: Shared Component Library Integration
The web UI SHALL use shared UI components from @homelab/ui.

#### Scenario: Report list table
- **WHEN** report list is rendered
- **THEN** DataTable component from @homelab/ui is used
- **AND** table supports sorting by workflow, timestamp, pass rate
- **AND** table supports filtering by workflow name
- **AND** styling is consistent with other homelab dashboards

#### Scenario: Date range filtering
- **WHEN** user filters reports by date
- **THEN** DateRangePicker from @homelab/ui is used
- **AND** component provides consistent UX with claude-agent dashboard

#### Scenario: Test statistics display
- **WHEN** report statistics are shown
- **THEN** StatsCard component from @homelab/ui is used
- **AND** cards show total tests, pass rate, average duration
- **AND** cards match design system of other homelab services

