# Implementation Tasks

## 1. Project Scaffolding

- [x] 1.1 ~~Install create-better-t-stack CLI~~ - Monorepo already exists from unify-homelab-servers-monorepo
- [x] 1.2 ~~Create new Better-T-Stack project~~ - Already exists at `homelab-services/`
- [x] 1.3 ~~Review generated structure~~ - Structure in place
- [x] 1.4 ~~Configure Turborepo~~ - `turbo.json` already configured
- [x] 1.5 ~~Set up workspace package.json~~ - Already configured with workspace protocol

## 2. Database Layer Migration

- [x] 2.1 ~~Create `packages/db/` workspace~~ - Already exists at `homelab-services/packages/db/`
- [ ] 2.2 Define Drizzle schema for projects table in `homelab-services/packages/db/src/schema/projects.ts`
- [ ] 2.3 Define Drizzle schema for sessions table in `homelab-services/packages/db/src/schema/sessions.ts`
- [ ] 2.4 Define Drizzle schema for hooks table in `homelab-services/packages/db/src/schema/hooks.ts`
- [x] 2.5 ~~Create Drizzle client configuration~~ - `homelab-services/packages/db/src/client.ts` exists with createDb/getDb
- [ ] 2.6 Generate initial migration from schema: `drizzle-kit generate:sqlite`
- [ ] 2.7 Create data migration script to copy existing SQLite data from standalone claude-agent-server
- [ ] 2.8 Test migration script against development database
- [x] 2.9 ~~Export schema and client~~ - `homelab-services/packages/db/src/index.ts` exports client utilities

## 3. Shared Validators Package

- [x] 3.1 ~~Create `packages/validators/` workspace~~ - Already exists at `homelab-services/packages/validators/`
- [ ] 3.2 Define Zod schema for project creation/update in `homelab-services/packages/validators/src/project.ts`
- [ ] 3.3 Define Zod schema for session management in `homelab-services/packages/validators/src/session.ts`
- [ ] 3.4 Define Zod schema for hook events in `homelab-services/packages/validators/src/hook.ts`
- [x] 3.5 ~~Export all validators~~ - `homelab-services/packages/validators/src/index.ts` exists (update with new schemas)
- [x] 3.6 ~~Configure TypeScript~~ - Already configured with proper tsconfig

## 4. tRPC API Backend

- [x] 4.1 ~~Create `apps/api/` workspace~~ - `homelab-services/apps/claude-agent/` exists (needs tRPC implementation)
- [ ] 4.2 Set up tRPC with Hono adapter in `homelab-services/apps/claude-agent/src/trpc/index.ts`
- [ ] 4.3 Create tRPC context with database client from @homelab/db
- [ ] 4.4 Implement projects router with procedures using @homelab/validators:
  - [ ] 4.4.1 `projects.list` - List all projects with metadata
  - [ ] 4.4.2 `projects.getById` - Get single project by ID
  - [ ] 4.4.3 `projects.create` - Create new project
  - [ ] 4.4.4 `projects.update` - Update project details
  - [ ] 4.4.5 `projects.delete` - Delete project (cascade sessions)
- [ ] 4.5 Implement sessions router with procedures:
  - [ ] 4.5.1 `sessions.list` - List sessions with filters
  - [ ] 4.5.2 `sessions.create` - Create new agent session
  - [ ] 4.5.3 `sessions.stop` - Stop running session
  - [ ] 4.5.4 `sessions.getById` - Get session details
- [ ] 4.6 Implement hooks router with procedures:
  - [ ] 4.6.1 `hooks.ingest` - Accept hook events from Python scripts
  - [ ] 4.6.2 `hooks.list` - Query hooks with pagination and filters
  - [ ] 4.6.3 `hooks.stats` - Aggregated statistics by session
  - [ ] 4.6.4 `hooks.subscribe` - WebSocket subscription for real-time events
- [ ] 4.7 Merge routers into main app router
- [ ] 4.8 Add CORS middleware for frontend communication
- [ ] 4.9 Add request logging with Hono logger middleware
- [ ] 4.10 Configure environment variables for API server
- [ ] 4.11 Add health check endpoint

## 5. Frontend Application

- [ ] 5.1 Create frontend in `homelab-services/apps/claude-agent/src/` (client-side)
- [ ] 5.2 Set up tRPC client with proper typing from @homelab/validators
- [ ] 5.3 Configure TanStack Query for tRPC client
- [ ] 5.4 Create projects list page with tRPC query using @homelab/ui components
- [ ] 5.5 Create project creation form with tRPC mutation using @homelab/ui
- [ ] 5.6 Create sessions view filtered by project
- [ ] 5.7 Create hooks dashboard with real-time subscription
- [ ] 5.8 Implement session timeline visualization
- [ ] 5.9 Add filtering UI for hooks by type, session, tool using @homelab/ui
- [ ] 5.10 Create statistics dashboard with charts
- [ ] 5.11 Preserve existing UI routing structure
- [ ] 5.12 Add error handling and loading states using @homelab/ui components

## 6. Hook System Implementation

- [ ] 6.1 Create `homelab-services/.claude/` directory structure
- [ ] 6.2 Create `homelab-services/.claude/hooks/` directory for Python scripts
- [ ] 6.3 Implement `send_event.py` - Universal event transmission to `homelab-services/apps/claude-agent/` tRPC backend
- [ ] 6.4 Implement `pre_tool_use.py` - Tool validation and logging
- [ ] 6.5 Implement `post_tool_use.py` - Tool result logging
- [ ] 6.6 Implement `session_start.py` - Session initialization event
- [ ] 6.7 Implement `session_end.py` - Session completion event
- [ ] 6.8 Implement `user_prompt_submit.py` - User prompt capture
- [ ] 6.9 Implement `stop.py` - Session stop event
- [ ] 6.10 Implement `subagent_stop.py` - Subagent completion tracking
- [ ] 6.11 Implement `pre_compact.py` - Context compaction event
- [ ] 6.12 Create `homelab-services/.claude/settings.json` with event mappings
- [ ] 6.13 Configure hooks to POST to `hooks.ingest` tRPC endpoint at http://claude.local
- [ ] 6.14 Add error handling for offline/unreachable backend
- [ ] 6.15 Test hooks with local Claude Code session

## 7. Docker & Deployment Configuration

- [x] 7.1 ~~Update Dockerfile~~ - `homelab-services/docker/claude.Dockerfile` already supports monorepo
- [x] 7.2 ~~Add Turborepo build step~~ - Already configured in existing Dockerfile
- [x] 7.3 ~~Configure Docker multi-stage build~~ - Already done (deps → builder → runner)
- [ ] 7.4 Verify volume mounts: `/projects` and `/app/db` preserved in docker-compose
- [ ] 7.5 Update `homelab/compose/claude-agent-server.yml` if needed for tRPC endpoints
- [ ] 7.6 Test Docker build locally with updated code
- [ ] 7.7 Update environment variable documentation
- [x] 7.8 ~~Create `.env.example`~~ - Monorepo structure already has configuration

## 8. Testing & Validation

- [ ] 8.1 Test database migration with production data copy
- [ ] 8.2 Verify all API endpoints with tRPC client
- [ ] 8.3 Test WebSocket subscriptions for real-time events
- [ ] 8.4 Validate hook scripts send events correctly
- [ ] 8.5 Test multi-session concurrent workflows
- [ ] 8.6 Verify Docker deployment in homelab environment
- [ ] 8.7 Load test with multiple concurrent hook events
- [ ] 8.8 Test error scenarios (backend offline, invalid data, etc.)

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
