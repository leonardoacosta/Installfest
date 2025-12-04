# Change: Integrate Product Management into Claude Agent Service

## Why

The Claude agent service currently manages development sessions and captures hook events, but lacks integration with OpenSpec for spec-driven development and doesn't interface with the Playwright server for automated error handling. This creates a gap where spec management and error triage happen outside the agent workflow, missing opportunities for intelligent automation and unified visibility.

By integrating OpenSpec reading/management and Playwright error analysis, the Claude agent service can act as a product owner/PM/consultant that:
- Triages and refines specs across all projects
- Analyzes Playwright test failures and decides between creating a spec proposal or applying a one-off fix
- Provides unified visibility into both planned work (specs) and reactive work (error remediation)

## What Changes

### OpenSpec Integration
- Add ability to read OpenSpec changes and specs from the filesystem
- Parse proposal.md, tasks.md, design.md, and spec delta files
- Display OpenSpec changes in the dashboard with filtering by project/status
- Track which specs are in proposal vs archived state
- Provide CRUD operations for OpenSpec proposals (create, update, archive)

### Playwright Error Analysis
- Subscribe to new Playwright test failures from the existing `reports` and `testFailures` tables
- Classify failures using existing failure classification logic (NEW, FLAKY, RECURRING, PERSISTENT)
- Implement decision engine that determines whether failure requires:
  - **Spec creation**: For architectural issues, missing features, or behavioral changes
  - **One-off fix**: For simple bugs, typos, or environmental issues
- Link remediation attempts to Claude sessions for traceability

### Unified Dashboard
- Create combined view showing both OpenSpec proposals and Playwright errors
- Support filtering by status, project, priority, classification type
- Show task/spec progress alongside error remediation status
- Provide workflow actions (start agent session for spec implementation, trigger remediation)
- Display real-time agent activity feed showing what each agent is working on

### Agent Activity Tracking
- Stream real-time agent activities via send_event hook integration
- Display active agents grid showing current project, work item, and tool execution
- Track tool usage, success rates, and session progress metrics
- Generate activity timelines and summaries for each agent session

### Agent Capabilities
- Add tRPC procedures for OpenSpec operations (list changes, show spec, create proposal, archive)
- Add tRPC procedures for error analysis (classify failure, recommend action, track remediation)
- Extend hook tracking to capture OpenSpec-related operations
- Add session metadata to track whether session is implementing a spec or fixing an error

## Impact

### Affected Specs
- **claude-agent-management**: MODIFIED to add OpenSpec integration and error analysis
- **openspec-integration**: ADDED new capability for spec lifecycle management
- **error-triage**: ADDED new capability for intelligent failure classification
- **unified-dashboard**: ADDED new capability for combined spec/error visibility
- **agent-activity-tracking**: ADDED new capability for real-time agent monitoring

### Affected Code
- `homelab-services/packages/db/src/schema/` - New tables for OpenSpec tracking
- `homelab-services/packages/api/src/router/` - New tRPC routers for OpenSpec and error triage
- `homelab-services/apps/claude-agent-web/src/app/` - New dashboard pages
- `homelab-services/packages/validators/src/` - New Zod schemas for OpenSpec entities
- Integration with existing `reports`, `testFailures`, `failureHistory`, `remediationAttempts` tables

### Breaking Changes
None. This is purely additive functionality.

### Dependencies
- Existing Playwright server infrastructure (reports, failures, remediation)
- Filesystem access to OpenSpec directory (`/openspec`)
- Existing tRPC/Drizzle/Better-T-Stack architecture

### Migration
No database migrations needed beyond adding new tables via Drizzle schema changes.
