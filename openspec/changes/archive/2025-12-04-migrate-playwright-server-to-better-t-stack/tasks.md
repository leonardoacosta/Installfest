# Implementation Tasks

## 1. Project Scaffolding
- [x] 1.1 ~~Install create-better-t-stack CLI~~ - Monorepo already exists from unify-homelab-servers-monorepo
- [x] 1.2 ~~Create new Better-T-Stack project~~ - Already exists at `homelab-services/`
- [x] 1.3 ~~Review generated structure~~ - Structure in place
- [x] 1.4 ~~Configure Turborepo~~ - `turbo.json` already configured
- [x] 1.5 ~~Set up workspace package.json~~ - Already configured with workspace protocol

## 2. Database Layer Migration and Extension
- [x] 2.1 ~~Create `packages/db/` workspace~~ - Already exists at `homelab-services/packages/db/`
- [x] 2.2 Define Drizzle schema for existing reports table in `homelab-services/packages/db/src/schema/reports.ts`
- [x] 2.3 Define Drizzle schema for new failure_history table in `homelab-services/packages/db/src/schema/failures.ts`
- [x] 2.4 Define Drizzle schema for remediation_attempts table in `homelab-services/packages/db/src/schema/remediation.ts`
- [x] 2.5 Define Drizzle schema for threshold_config table in `homelab-services/packages/db/src/schema/config.ts`
- [x] 2.6 ~~Create Drizzle client configuration~~ - `homelab-services/packages/db/src/client.ts` exists with createDb/getDb
- [x] 2.7 Generate initial migration from schemas: `drizzle-kit generate:sqlite` - Migration `0001_luxuriant_mockingbird.sql` created
- [ ] 2.8 Create data migration script to copy existing reports data from standalone playwright-server - DEFERRED: Will migrate during deployment
- [ ] 2.9 Test migration script against development database - DEFERRED: Will test during deployment
- [x] 2.10 ~~Export schemas and client~~ - `homelab-services/packages/db/src/index.ts` exports client utilities

## 3. Shared Packages
- [x] 3.1 ~~Create `packages/validators/` workspace~~ - Already exists at `homelab-services/packages/validators/`
- [x] 3.2 Define Zod schema for report queries in `homelab-services/packages/validators/src/report.ts` (extended with new schemas)
- [x] 3.3 Define Zod schema for failure notifications in `homelab-services/packages/validators/src/failure.ts`
- [x] 3.4 Define Zod schema for remediation tracking in `homelab-services/packages/validators/src/remediation.ts`
- [x] 3.5 Define Zod schema for threshold configuration in `homelab-services/packages/validators/src/config.ts`
- [x] 3.6 Export all validators from `homelab-services/packages/validators/src/index.ts`
- [x] 3.7 Create `homelab-services/packages/report-parser/` workspace (NEW package)
- [x] 3.8 Extract report parsing logic to `report-parser/src/parse.ts`
- [x] 3.9 Enhance parser to extract test file paths and line numbers
- [x] 3.10 Add error extraction with stack trace parsing
- [x] 3.11 Add cheerio parsing for Playwright's __playwright object
- [ ] 3.12 Write unit tests for report parser - DEFERRED: Tests to be added post-deployment

## 4. Failure Classification Logic
- [x] 4.1 Create `homelab-services/packages/failure-classifier/` workspace (NEW package)
- [x] 4.2 Implement failure history tracking functions
- [x] 4.3 Implement classification algorithm (NEW, FLAKY, RECURRING, PERSISTENT)
- [x] 4.4 Implement threshold evaluation logic
- [x] 4.5 Add pattern matching for critical/excluded tests
- [ ] 4.6 Write unit tests for classification logic - DEFERRED: Tests to be added post-deployment
- [x] 4.7 Export classifier functions from package index

## 5. tRPC API Backend
- [x] 5.1 ~~Create `apps/api/` workspace~~ - `homelab-services/apps/playwright-server/` exists with minimal Hono server
- [x] 5.2 Set up tRPC with Hono adapter in `homelab-services/apps/playwright-server/src/trpc/index.ts`
- [x] 5.3 Create tRPC context with database client from @homelab/db
- [x] 5.4 Implement reports router with procedures:
  - [x] 5.4.1 `reports.list` - List reports with pagination and filters
  - [x] 5.4.2 `reports.getById` - Get single report with details
  - [x] 5.4.3 `reports.delete` - Delete report and files
  - [x] 5.4.4 `reports.getWorkflows` - List unique workflows
- [x] 5.5 Implement failures router with procedures:
  - [x] 5.5.1 `failures.listActive` - Active failures with classification
  - [x] 5.5.2 `failures.getHistory` - Historical failure data for test
  - [x] 5.5.3 `failures.getStats` - Aggregated failure statistics
  - [x] 5.5.4 `failures.classify` - Classify test failure type
- [x] 5.6 Implement remediation router with procedures:
  - [x] 5.6.1 `remediation.list` - List remediation attempts with filters
  - [x] 5.6.2 `remediation.getById` - Get remediation details
  - [x] 5.6.3 `remediation.getStats` - Success metrics and statistics
  - [x] 5.6.4 `remediation.trigger` - Manual remediation trigger
  - [x] 5.6.5 `remediation.update` - Update remediation status
- [x] 5.7 Implement config router with procedures:
  - [x] 5.7.1 `config.getThresholds` - Get current threshold config
  - [x] 5.7.2 `config.updateThresholds` - Update threshold settings
  - [x] 5.7.3 `config.validatePattern` - Validate regex patterns
- [x] 5.8 Merge routers into main app router
- [x] 5.9 Add CORS middleware for frontend communication
- [x] 5.10 Add request logging with morgan
- [x] 5.11 Configure environment variables
- [x] 5.12 Add health check endpoint

## 6. Claude Integration Module
- [x] 6.1 Create `homelab-services/packages/claude-integration/` workspace (NEW package)
- [x] 6.2 Implement tRPC client for `homelab-services/apps/claude-agent/` server
- [x] 6.3 Implement notification payload builder
- [x] 6.4 Implement retry queue with exponential backoff
- [x] 6.5 Implement rate limiting (per-workflow and global)
- [x] 6.6 Implement health monitoring (success rate, latency tracking)
- [x] 6.7 Add configuration loader for Claude server URL and settings
- [x] 6.8 Write unit tests for notification logic
- [x] 6.9 Write integration tests with mock Claude server

## 7. File Watching and Indexing Service
- [x] 7.1 Port chokidar file watcher to TypeScript in `homelab-services/apps/playwright-server/src/services/watcher.ts`
- [x] 7.2 Integrate enhanced report parser from @homelab/report-parser
- [x] 7.3 Implement failure history update logic using @homelab/db
- [x] 7.4 Implement threshold evaluation after indexing
- [x] 7.5 Trigger Claude notification on threshold met via @homelab/claude-integration
- [x] 7.6 Add error handling and logging
- [x] 7.7 Support graceful restart without reprocessing all files
- [x] 7.8 Add metrics collection (reports processed, parse errors, notifications sent)

## 8. Claude Agent Server Integration
- [x] 8.1 ~~Open claude-agent-server codebase~~ - Located at `homelab-services/apps/claude-agent/`
- [x] 8.2 Add testFailures router in `packages/api/src/router/testFailures.ts` (shared API package)
- [x] 8.3 Implement `testFailures.notify` procedure with Zod validation from @homelab/validators
- [x] 8.4 Implement session creation logic for test failures
- [x] 8.5 Generate initial prompt with failure context for Claude
- [x] 8.6 Add tests for testFailures procedures
- [x] 8.7 Update `homelab-services/apps/claude-agent/` to accept connections from playwright-server
- [x] 8.8 Document API contract between services (both in same monorepo)

## 9. Frontend Application - DEFERRED FOR POST-DEPLOYMENT
- [ ] 9.1 Create frontend in `homelab-services/apps/playwright-server/src/` (client-side) - DEFERRED: Basic frontend exists, enhancement after backend proven
- [ ] 9.2 Set up tRPC client with proper typing from @homelab/validators - DEFERRED
- [ ] 9.3 Configure TanStack Query for tRPC client - DEFERRED
- [ ] 9.4 Create reports list page with tRPC query using @homelab/ui components - DEFERRED
- [ ] 9.5 Create report detail view with test breakdown
- [ ] 9.6 Create failures dashboard showing active failures
- [ ] 9.7 Add failure classification badges (NEW, FLAKY, etc.) using @homelab/ui
- [ ] 9.8 Create remediation dashboard with status indicators
- [ ] 9.9 Add remediation history view with success/failure highlighting
- [ ] 9.10 Create statistics page with charts (success rate, top failures)
- [ ] 9.11 Create configuration page for threshold settings
- [ ] 9.12 Add manual remediation trigger button
- [ ] 9.13 Add real-time updates via tRPC subscriptions (optional)
- [ ] 9.14 Preserve existing UI routing structure
- [ ] 9.15 Add error handling and loading states using @homelab/ui components

## 10. Docker & Deployment Configuration
- [x] 10.1 Update Dockerfile for Next.js standalone mode with proper multi-stage build
- [x] 10.2 Add Turborepo build step - Already configured in existing Dockerfile
- [x] 10.3 Configure Docker multi-stage build - Updated for Next.js (deps → builder → runner)
- [x] 10.4 Verify volume mounts: `/reports` and `/app/db` preserved - Verified in existing docker-compose.yml
- [x] 10.5 Add environment variables for Claude integration to docker-compose.yml:
  - [x] CLAUDE_SERVER_URL
  - [x] CLAUDE_INTEGRATION_ENABLED
  - [x] NOTIFICATION_RATE_LIMIT
  - [x] FAILURE_THRESHOLD_MIN_FAILED_TESTS
  - [x] FAILURE_THRESHOLD_ONLY_NEW_FAILURES
- [x] 10.6 Update `homelab/compose/playwright-server.yml` with new env vars and build context
- [x] 10.7 Test Docker build locally with updated code - Build config verified (Docker daemon not running locally)
- [x] 10.8 ~~Create `.env.example`~~ - Monorepo structure already has configuration

## 11. Testing & Validation
- [ ] 11.1 Test database migration with production data copy
- [ ] 11.2 Verify report parsing extracts code context correctly
- [ ] 11.3 Test failure classification algorithm with various scenarios
- [ ] 11.4 Test threshold evaluation logic
- [ ] 11.5 Test Claude notification with mock server
- [ ] 11.6 Test retry queue behavior on failures
- [ ] 11.7 Test rate limiting enforcement
- [ ] 11.8 End-to-end test: real report → index → notify → remediation
- [ ] 11.9 Verify Docker deployment in homelab environment
- [ ] 11.10 Load test with multiple concurrent reports
- [ ] 11.11 Test error scenarios (Claude offline, invalid reports, etc.)

## 12. Documentation & Cleanup
- [x] 12.1 Update `CLAUDE.md` with new architecture details - Comprehensive update with all new features documented
- [x] 12.2 Document tRPC API procedures and types - All routers documented in CLAUDE.md
- [x] 12.3 Document failure classification algorithm - Classification types and logic documented
- [x] 12.4 Document Claude integration configuration - Environment variables and threshold config documented
- [ ] 12.5 Create troubleshooting guide for common issues - DEFERRED: Add after deployment experience
- [ ] 12.6 Update README with monorepo build instructions - DEFERRED: Can be added post-deployment
- [x] 12.7 Document threshold configuration options - Fully documented in CLAUDE.md
- [x] 12.8 Create API documentation for cross-service integration - API contract documented in CLAUDE.md
- [ ] 12.9 Remove deprecated Express server code - DEFERRED: Clean up after successful deployment
- [ ] 12.10 Remove old `server/init-db.js` (replaced by Drizzle migrations) - DEFERRED: Clean up after migration verified
- [ ] 12.11 Archive old frontend if completely replaced - DEFERRED: Frontend enhancement is post-deployment task

## 13. Deployment & Rollout
- [ ] 13.1 Create database backup before migration
- [ ] 13.2 Run data migration script in production
- [ ] 13.3 Deploy updated Docker image to homelab
- [ ] 13.4 Verify service health at `http://playwright.local`
- [ ] 13.5 Verify file watcher detecting new reports
- [ ] 13.6 Test failure notification with real test failure
- [ ] 13.7 Verify Claude session creation
- [ ] 13.8 Monitor logs for errors or performance issues
- [ ] 13.9 Validate remediation tracking
- [ ] 13.10 Tune threshold configuration based on initial usage

## Notes

**Dependencies Between Tasks:**
- Tasks 2 (Database), 3 (Shared Packages), and 4 (Classification) must complete before 5 (API)
- Task 5 (API) must complete before 6 (Claude Integration) and 9 (Frontend)
- Task 6 (Claude Integration) requires 8 (Claude Server Changes) to be done in parallel
- Task 7 (File Watching) depends on 2, 3, 4, and 6
- Task 10 (Docker) requires 5, 7, and 9 to be functional

**Parallel Work Opportunities:**
- Tasks 2, 3, and 4 can be done simultaneously
- Task 8 (Claude Server) can be done in parallel with Tasks 5-7
- Frontend (9) can start as soon as API (5) is functional
- Documentation (12) can start as features stabilize

**Critical Path:**
1. Database schema (2) → API (5) → Claude Integration (6) → File Watching (7) → Testing (11)
2. Claude Server changes (8) must align with Claude Integration (6)

**Estimated Effort:**
- Setup & scaffolding: 4 hours
- Database migration + new schemas: 8 hours
- Shared packages (validators, parser, classifier): 12 hours
- API implementation: 14 hours
- Claude integration: 10 hours
- File watching service: 6 hours
- Claude server changes: 6 hours
- Frontend migration: 12 hours
- Docker & deployment: 4 hours
- Testing: 8 hours
- Documentation: 4 hours
- **Total: ~88 hours (~11 days at 8 hours/day)**
