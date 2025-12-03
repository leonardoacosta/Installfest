# claude-agent-management Spec Delta

## ADDED Requirements

### Requirement: Monorepo Architecture
The system SHALL be part of a unified homelab-services monorepo with shared packages.

#### Scenario: Application structure
- **WHEN** codebase is organized
- **THEN** claude-agent exists as apps/claude-agent within monorepo
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
- **AND** app can define app-specific schemas
- **AND** validators are built with Zod

#### Scenario: Independent Docker build
- **WHEN** Docker image is built
- **THEN** Turborepo prunes dependencies to only claude-agent requirements
- **AND** multi-stage Dockerfile optimizes build layers
- **AND** final image contains only runtime dependencies

### Requirement: Workspace Build System
The system SHALL use Turborepo for build orchestration and caching.

#### Scenario: Development build
- **WHEN** `turbo run dev --filter=claude-agent` is executed
- **THEN** only claude-agent and its dependencies are built
- **AND** shared packages are watched for changes
- **AND** hot reload works for both app and packages

#### Scenario: Production build
- **WHEN** `turbo run build --filter=claude-agent` is executed
- **THEN** app is built with optimizations enabled
- **AND** shared packages are built first (dependency order)
- **AND** build artifacts are cached for future builds

#### Scenario: Package changes trigger rebuild
- **WHEN** file in @homelab/ui is modified
- **THEN** Turborepo detects change via content hashing
- **AND** claude-agent rebuild is triggered
- **AND** cached layers are reused where possible

### Requirement: Shared Component Library Integration
The web dashboard SHALL use shared UI components from @homelab/ui.

#### Scenario: Hook history table
- **WHEN** hooks table is rendered
- **THEN** DataTable component from @homelab/ui is used
- **AND** table supports sorting, filtering, pagination
- **AND** styling is consistent with other homelab dashboards

#### Scenario: Date range filtering
- **WHEN** user filters hooks by date
- **THEN** DateRangePicker from @homelab/ui is used
- **AND** component provides consistent UX with playwright dashboard

#### Scenario: Statistics display
- **WHEN** session statistics are shown
- **THEN** StatsCard component from @homelab/ui is used
- **AND** cards show metric name, value, trend indicator
