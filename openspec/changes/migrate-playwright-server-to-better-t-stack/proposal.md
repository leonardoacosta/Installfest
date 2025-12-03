# Change: Migrate Playwright Report Server to Better-T-Stack and Integrate Claude Auto-Remediation

## Why

The current `playwright-report-server` is a basic Node.js + Express + SQLite application that:
1. Watches for new Playwright test reports from GitHub runners
2. Parses HTML reports and stores test statistics
3. Provides a web UI to view historical test results

**Current Limitations:**
- No type safety between frontend and backend
- Raw SQLite3 queries with manual error handling
- No automated action when tests fail (purely passive viewer)
- Flat project structure makes scaling difficult
- No integration with development workflow automation

**Opportunity:**
By migrating to Better-T-Stack architecture AND integrating with claude-agent-server, we can:
1. Gain type-safe API with tRPC + Drizzle ORM
2. Automatically trigger Claude Code to investigate and fix test failures
3. Create a feedback loop: tests fail → Claude fixes → tests re-run → Claude validates
4. Track failure patterns and remediation success rate
5. Reduce manual test failure triage time

This transforms the server from a passive viewer into an active development automation tool.

## What Changes

**Architecture Migration (Same as claude-agent-server):**
- Restructure to monorepo with Better-T-Stack conventions
- Replace Express REST with tRPC procedures
- Migrate from raw SQLite3 to Drizzle ORM
- Implement TypeScript with shared validators
- Add Turborepo for build orchestration
- Modern React frontend with type-safe API calls

**New: Claude Integration for Auto-Remediation:**
- Detect test failures based on configurable thresholds
- Classify failures: new vs recurring, flaky vs consistent
- Send test failure events to claude-agent-server via tRPC
- Include rich context: test name, error, report URL, code location, historical data
- Track remediation attempts and success rate
- Support custom hook: `.claude/hooks/test_failure.py` (optional)

**Enhanced Report Analysis:**
- Extract detailed test metadata from Playwright reports (test file, line number, error stack)
- Track failure history per test (detect flakiness)
- Generate failure summaries with actionable insights
- Compare runs to identify newly introduced failures vs persistent issues

**Project Structure:**
```
homelab-services/                   # Unified monorepo (already exists)
├── apps/
│   ├── claude-agent/              # Claude agent management (already exists)
│   └── playwright-server/         # Playwright test reports (already exists)
├── packages/
│   ├── ui/                        # Shared React components (already exists)
│   ├── db/                        # Drizzle schema + utilities (already exists)
│   ├── validators/                # Zod schemas (already exists)
│   └── report-parser/             # NEW: Playwright HTML parsing logic
├── docker/
│   ├── claude.Dockerfile          # Already exists
│   └── playwright.Dockerfile      # Already exists
├── turbo.json                     # Already configured
└── package.json                   # Workspace root
```

**Note:** The monorepo infrastructure already exists from the `unify-homelab-servers-monorepo` change. This migration focuses on extending the existing structure with Playwright-specific features.

**Breaking Changes:**
- **BREAKING**: REST API replaced with tRPC procedures
- **BREAKING**: Database schema extended with new tables (migration provided)
- **BREAKING**: Report parsing moved to shared package

**Backward Compatibility:**
- Docker deployment preserved (same ports and volumes)
- Existing reports remain viewable
- File watcher continues monitoring `/reports` volume

## Impact

**Affected Specs:**
- `playwright-report-server` - Complete architectural restructure
- `claude-test-failure-integration` (NEW) - Cross-system integration for auto-remediation

**Affected Code:**
- `homelab-services/apps/playwright-server/src/` - Rewritten as tRPC API (currently minimal Hono server)
- `homelab-services/apps/playwright-server/` - Frontend to be added with React + type-safe queries
- `homelab-services/packages/db/` - Extended with reports, failures, remediation schemas
- `homelab-services/packages/validators/` - Extended with report-specific Zod schemas
- `homelab-services/packages/report-parser/` - NEW: Shared report parsing package
- `homelab/compose/playwright-server.yml` - Environment variables for Claude integration
- `homelab-services/apps/claude-agent/` - Add new tRPC procedure for accepting test failure events

**New Capabilities:**
- Automatic test failure detection and notification
- Claude Code auto-spawning for failure remediation
- Failure classification (new, recurring, flaky)
- Remediation tracking and success metrics
- Rich failure context extraction

**Benefits:**
- Type safety eliminates runtime errors in report parsing
- Automated test failure response reduces manual triage
- Claude learns from test failures and fixes them proactively
- Faster feedback loop: fail → fix → validate
- Historical data helps identify flaky tests

**Risks:**
- Claude may attempt to fix tests that are legitimately failing due to bugs (not test issues)
- Automatic remediation could create noise if threshold not properly tuned
- Integration adds dependency on claude-agent-server availability
- Increased complexity in deployment and configuration

**Migration Strategy:**
- Create Better-T-Stack structure alongside existing code
- Migrate database schema with backward-compatible migrations
- Port API endpoints to tRPC procedures
- Add new tables for failure tracking and remediation
- Implement Claude integration as optional feature (can be disabled)
- Test end-to-end workflow with real test failures
- Deploy with rollback plan ready
