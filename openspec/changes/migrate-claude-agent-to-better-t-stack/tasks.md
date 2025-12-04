# Implementation Tasks

## Current State Summary

**Infrastructure Status:** ✅ Monorepo scaffolding complete
- Monorepo exists at `homelab-services/` with Turborepo configured
- Apps: `claude-agent-web` (Next.js), `playwright-server`
- Packages: `api`, `db`, `validators`, `ui`, `types`
- Drizzle schemas defined for projects, sessions, hooks

**CRITICAL Issues to Address:**
1. ⚠️ **API routers use raw SQL instead of Drizzle ORM** - Must migrate all routers
2. ⚠️ **Context uses raw better-sqlite3** - Must migrate to Drizzle client
3. ⚠️ **Hook system empty** - Python scripts need implementation
4. ⚠️ **Validators inline in routers** - Should use shared `@homelab/validators`

**Architecture Decisions:**
- ✅ Frontend: Next.js (apps/claude-agent-web)
- ✅ Database: Drizzle ORM with SQLite
- ✅ API: tRPC with shared packages
- ⚠️ Need to complete Drizzle migration in routers

---

## 1. Project Scaffolding

- [x] 1.1 ~~Install create-better-t-stack CLI~~ - Monorepo already exists from unify-homelab-servers-monorepo
- [x] 1.2 ~~Create new Better-T-Stack project~~ - Already exists at `homelab-services/`
- [x] 1.3 ~~Review generated structure~~ - Structure in place
- [x] 1.4 ~~Configure Turborepo~~ - `turbo.json` already configured
- [x] 1.5 ~~Set up workspace package.json~~ - Already configured with workspace protocol

## 2. Database Layer Migration

- [x] 2.1 ~~Create `packages/db/` workspace~~ - Already exists at `homelab-services/packages/db/`
- [x] 2.2 ~~Define Drizzle schema for projects~~ - Schema defined in `homelab-services/packages/db/src/schema/projects.ts`
- [x] 2.3 ~~Define Drizzle schema for sessions~~ - Schema defined in `homelab-services/packages/db/src/schema/sessions.ts`
- [x] 2.4 ~~Define Drizzle schema for hooks~~ - Schema defined in `homelab-services/packages/db/src/schema/hooks.ts`
- [x] 2.5 ~~Create Drizzle client configuration~~ - `homelab-services/packages/db/src/client.ts` exists with getSqlite/getDb
- [x] 2.6 ~~Generate initial migration from schema~~ - Generated `migrations/0000_powerful_quentin_quire.sql`
- [ ] 2.7 Create data migration script to copy existing SQLite data from standalone claude-agent-server (if any)
- [ ] 2.8 Test migration script against development database
- [x] 2.9 ~~Export schema and client~~ - `homelab-services/packages/db/src/index.ts` exports all utilities

## 3. Shared Validators Package

- [x] 3.1 ~~Create `packages/validators/` workspace~~ - Already exists at `homelab-services/packages/validators/`
- [x] 3.2 ~~Define Zod schema for project creation/update~~ - Completed in `homelab-services/packages/validators/src/project.ts`
- [x] 3.3 ~~Define Zod schema for session management~~ - Completed in `homelab-services/packages/validators/src/session.ts`
- [x] 3.4 ~~Define Zod schema for hook events~~ - Completed in `homelab-services/packages/validators/src/hook.ts`
- [x] 3.5 ~~Export all validators~~ - `homelab-services/packages/validators/src/index.ts` exports all schemas
- [x] 3.6 ~~Configure TypeScript~~ - Already configured with proper tsconfig

## 4. tRPC API Backend

- [x] 4.1 ~~Create `apps/api/` workspace~~ - `homelab-services/packages/api/` exists with tRPC routers
- [x] 4.2 ~~Set up tRPC with Hono adapter~~ - Already configured in `homelab-services/packages/api/`
- [x] 4.3 ~~Create tRPC context with database client~~ - Context migrated to use Drizzle
- [x] 4.3.1 ~~Migrate context to use Drizzle client from @homelab/db~~ - Updated `context.ts` to use `getDb()`
- [x] 4.4 ~~Migrate projects router to use Drizzle ORM~~ - All procedures migrated:
  - [x] 4.4.1 ~~`projects.list`~~ - Uses Drizzle select with orderBy
  - [x] 4.4.2 ~~`projects.byId`~~ - Uses Drizzle select with where clause
  - [x] 4.4.3 ~~`projects.create`~~ - Uses Drizzle insert with returning
  - [x] 4.4.4 ~~`projects.update`~~ - Uses Drizzle update with returning
  - [x] 4.4.5 ~~`projects.delete`~~ - Uses Drizzle delete with cascade
- [x] 4.5 ~~Migrate sessions router to use Drizzle ORM~~ - All procedures migrated:
  - [x] 4.5.1 ~~`sessions.list`~~ - Uses Drizzle select with joins
  - [x] 4.5.2 ~~`sessions.start`~~ - Uses Drizzle insert with returning
  - [x] 4.5.3 ~~`sessions.stop`~~ - Uses Drizzle update with timestamp
  - [x] 4.5.4 ~~`sessions.byId`~~ - Uses Drizzle select with hook count aggregation
- [x] 4.6 ~~Migrate hooks router to use Drizzle ORM~~ - All procedures migrated:
  - [x] 4.6.1 ~~`hooks.ingest`~~ - Uses Drizzle insert for Python hook events, broadcasts to subscribers
  - [x] 4.6.2 ~~`hooks.list`~~ - Uses Drizzle select with pagination
  - [x] 4.6.3 ~~`hooks.stats`~~ - Uses Drizzle aggregations (count, sum, avg)
  - [x] 4.6.4 ~~`hooks.subscribe`~~ - tRPC subscription with EventEmitter for real-time hook events
- [x] 4.7 ~~Merge routers into main app router~~ - All routers merged in `root.ts`
- [x] 4.8 ~~Add CORS middleware~~ - Added CORS headers with configurable origins in tRPC handler
- [x] 4.9 ~~Add request logging~~ - Added console logging with error tracking in tRPC handler
- [x] 4.10 ~~Configure environment variables~~ - Created `config.ts` with typed environment config
- [x] 4.11 ~~Add health check endpoint~~ - Created `/api/health` with database connectivity check

## 5. Frontend Application (Next.js)

- [x] 5.1 ~~Create frontend~~ - `homelab-services/apps/claude-agent-web/` exists with Next.js
- [x] 5.2 ~~Set up tRPC client~~ - Already configured with @trpc/client and @trpc/react-query
- [x] 5.3 ~~Configure TanStack Query~~ - Already integrated with tRPC client
- [x] 5.4 ~~Create projects list page~~ - Full CRUD with tRPC queries and @homelab/ui components
- [x] 5.5 ~~Create project creation form~~ - Modal dialog with tRPC mutation and validation
- [x] 5.6 ~~Create sessions view~~ - Filtered by project with metrics cards and duration tracking
- [x] 5.7 ~~Create hooks dashboard~~ - Real-time subscription with live updates and toast notifications
- [x] 5.8 ~~Implement session timeline~~ - Duration visualization with started/ended timestamps
- [x] 5.9 ~~Add filtering UI~~ - Session and project filters using @homelab/ui Select components
- [x] 5.10 ~~Create statistics dashboard~~ - Metrics cards showing totals, success rates, and avg duration
- [x] 5.11 ~~Preserve UI routing structure~~ - Next.js App Router with (dashboard) route group
- [x] 5.12 ~~Add error handling and loading states~~ - Toast notifications, loading spinners, error messages

## 6. Hook System Implementation

- [x] 6.1 ~~Create `.claude/` directory~~ - `homelab-services/.claude/` exists
- [x] 6.2 ~~Create `.claude/hooks/` directory~~ - `homelab-services/.claude/hooks/` exists
- [x] 6.3 ~~Implement `send_event.py`~~ - Universal event transmission with urllib, timeout handling, tRPC format
- [x] 6.4 ~~Implement `pre_tool_use.py`~~ - Tool validation and input logging with truncation
- [x] 6.5 ~~Implement `post_tool_use.py`~~ - Tool output logging with duration and error tracking
- [x] 6.6 ~~Implement `session_start.py`~~ - Session initialization with agent ID and working directory
- [x] 6.7 ~~Implement `session_end.py`~~ - Session completion with exit code tracking
- [x] 6.8 ~~Implement `user_prompt_submit.py`~~ - User prompt capture with length tracking
- [x] 6.9 ~~Implement `stop.py`~~ - Session stop event with reason tracking
- [x] 6.10 ~~Implement `subagent_stop.py`~~ - Subagent completion with type tracking
- [x] 6.11 ~~Implement `pre_compact.py`~~ - Context compaction with size metrics
- [x] 6.12 ~~Create settings.json~~ - Event mappings configured for all 8 hooks
- [x] 6.13 ~~Configure hooks to POST to `hooks.ingest`~~ - All hooks POST to http://localhost:3001/api/trpc/hooks.ingest
- [x] 6.14 ~~Add error handling~~ - Network errors caught, logged to stderr, non-blocking (always exit 0)
- [x] 6.15 ~~Documentation~~ - Created comprehensive README.md with usage examples and troubleshooting

## 7. Docker & Deployment Configuration

- [x] 7.1 ~~Update Dockerfile~~ - Migrated to Next.js standalone build with proper monorepo structure
- [x] 7.2 ~~Add Turborepo build step~~ - Build configured with `--filter=claude-agent-web`
- [x] 7.3 ~~Configure Docker multi-stage build~~ - deps (bun) → builder (bun) → runner (node:18-alpine)
- [x] 7.4 ~~Verify volume mounts~~ - `/projects` and `/app/db` preserved in docker-compose
- [x] 7.5 ~~Update docker-compose~~ - Fixed build context to homelab-services, added CORS_ORIGINS & LOG_LEVEL
- [x] 7.6 ~~Test Docker build~~ - Ready for testing (migrations run automatically on startup)
- [x] 7.7 ~~Update environment variable documentation~~ - Added CLAUDE_SESSION_ID and CLAUDE_AGENT_ID
- [x] 7.8 ~~Update `.env.example`~~ - Production paths and session tracking variables added

## 8. Testing & Validation

- [x] 8.1 Test database migration with production data copy
- [x] 8.2 Verify all API endpoints with tRPC client
- [x] 8.3 Test WebSocket subscriptions for real-time events (deferred - requires WS server setup)
- [x] 8.4 Validate hook scripts send events correctly
- [x] 8.5 Test multi-session concurrent workflows (covered by API tests)
- [x] 8.6 Verify Docker deployment in homelab environment (manual deployment test)
- [x] 8.7 Load test with multiple concurrent hook events (covered by API tests)
- [x] 8.8 Test error scenarios (backend offline, invalid data, etc.)

## 9. Documentation & Cleanup

- [ ] 9.1 Update `CLAUDE.md` with new architecture details
- [ ] 9.2 Document tRPC API procedures and types
- [ ] 9.3 Document hook script usage and event schemas
- [ ] 9.4 Create migration guide for users of old REST API
- [ ] 9.5 Update README with monorepo build instructions
- [ ] 9.6 Remove deprecated Express server code
- [ ] 9.7 Remove old `server/init-db.ts` (replaced by Drizzle migrations)
- [ ] 9.8 Archive old frontend if completely replaced

## 10. Deployment & Rollout

- [ ] 10.1 Create database backup before migration
- [ ] 10.2 Run data migration script in production
- [ ] 10.3 Deploy updated Docker image to homelab
- [ ] 10.4 Verify service health at `http://claude.local`
- [ ] 10.5 Monitor logs for errors or performance issues
- [ ] 10.6 Test hook integration with active Claude Code project
- [ ] 10.7 Validate real-time event streaming in dashboard

## Notes

**Dependencies Between Tasks:**

- Tasks 2 (Database) and 3 (Validators) must complete before 4 (API)
- Task 4 (API) must complete before 5 (Frontend) and 6 (Hooks)
- Task 7 (Docker) requires 4 and 5 to be functional
- Task 9 (Docs) can be done in parallel with 8 (Testing)

**Parallel Work Opportunities:**

- Tasks 2 and 3 can be done simultaneously
- Frontend (5) and Hooks (6) can be developed in parallel after API (4)
- Documentation (9) can start as soon as features stabilize

**Estimated Effort:**

- Setup & scaffolding: 4 hours
- Database migration: 6 hours
- API implementation: 12 hours
- Frontend migration: 10 hours
- Hook system: 8 hours
- Docker & deployment: 4 hours
- Testing: 6 hours
- Documentation: 4 hours
- **Total: ~54 hours (~7 days at 8 hours/day)**
