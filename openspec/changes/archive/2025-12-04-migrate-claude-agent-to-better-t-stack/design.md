# Design Document: Claude Agent Server Migration to Better-T-Stack

## Context

The current `claude-agent-server` is a proof-of-concept Express + SQLite application with infrastructure ready but lacking production-quality architecture. It currently provides:
- Project management (create, list, delete)
- Session tracking for Claude Code agents
- Hook event storage (infrastructure exists, SDK integration pending)
- WebSocket-based real-time log streaming
- Basic web UI for visualization

**Problems with Current Architecture:**
1. No type safety between frontend and backend (REST API with manual typing)
2. Raw SQLite3 queries prone to SQL injection and type mismatches
3. Manual serialization/deserialization of request/response data
4. No shared validation logic between client and server
5. Flat project structure makes scaling difficult
6. No build optimization or caching for monorepo
7. Hook system exists in concept but not integrated with actual Claude Code workflow

**Opportunity:**
Adopt Better-T-Stack architecture to gain type safety, modern tooling, and a scalable foundation while integrating real hook functionality from the claude-code-hooks-multi-agent-observability reference implementation.

## Goals / Non-Goals

**Goals:**
- Full end-to-end type safety from database to frontend
- Modern developer experience with auto-completion and compile-time safety
- Integrated hook system that actually captures Claude Code events
- Scalable monorepo structure for future growth
- Production-ready architecture patterns
- Maintain existing Docker deployment compatibility
- Preserve database data through migration

**Non-Goals:**
- Rewriting existing business logic (project/session/hook management stays the same)
- Changing exposed ports or Docker volume structure (maintain homelab compatibility)
- Adding new features beyond hook integration (pure architectural refactor)
- Migrating to a different database engine (stay with SQLite for simplicity)
- Changing the UI design or layout (only update API calls)

## Decisions

### 1. Monorepo Structure with Turborepo

**Decision:** Use Better-T-Stack's monorepo pattern with `apps/` and `packages/` workspaces orchestrated by Turborepo.

**Why:**
- Clean separation of concerns (API, web, shared utilities)
- Shared packages (db, validators, types) eliminate code duplication
- Turborepo provides intelligent caching and parallel builds
- Scales well for future additions (CLI, mobile app, etc.)

**Structure:**
```
claude-agent-server/
├── apps/
│   ├── api/          # Hono + tRPC backend
│   └── web/          # Next.js or React frontend
├── packages/
│   ├── db/           # Drizzle ORM schemas
│   ├── validators/   # Shared Zod schemas
│   └── types/        # Shared TypeScript types
├── .claude/          # Hook scripts and config
└── turbo.json        # Build orchestration
```

**Alternatives Considered:**
- Polyrepo: Rejected due to code duplication and version drift
- Nx: More complex than needed; Turborepo sufficient for our scale
- Lerna: Outdated, Turborepo is modern standard

### 2. tRPC for Type-Safe API

**Decision:** Replace REST endpoints with tRPC procedures using Hono as HTTP framework.

**Why:**
- End-to-end type safety: client knows server types automatically
- No manual API documentation needed (types are the documentation)
- Automatic input validation with Zod
- Seamless WebSocket subscriptions for real-time features
- Better developer experience with auto-complete

**Example:**
```typescript
// Backend
export const projectsRouter = t.router({
  list: t.procedure.query(async ({ ctx }) => {
    return ctx.db.select().from(projects);
  }),
});

// Frontend - fully typed!
const { data } = trpc.projects.list.useQuery();
//    ^? Project[]
```

**Alternatives Considered:**
- GraphQL: Overkill for our use case; more complex setup
- REST with OpenAPI: Manual schema maintenance, no automatic type sync
- gRPC: Not web-friendly, requires protobuf compilation

### 3. Drizzle ORM for Database Layer

**Decision:** Migrate from raw SQLite3 queries to Drizzle ORM.

**Why:**
- Type-safe query builder with full TypeScript inference
- Schema-as-code with automatic migration generation
- Better SQL injection protection
- Simpler query composition compared to raw SQL
- Lightweight compared to Prisma (no binary bloat)

**Example:**
```typescript
// Define schema
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
  path: text('path').notNull(),
});

// Type-safe query
const allProjects = await db.select().from(projects);
//    ^? { id: number; name: string; path: string }[]
```

**Alternatives Considered:**
- Prisma: Heavier runtime, binaries required, slower startup
- TypeORM: Less type-safe, decorator-based approach not modern
- Raw SQL: Current state - prone to errors and no type safety

### 4. Frontend Framework Choice

**Decision:** Use **Next.js** for frontend application.

**Why:**
- Provides full-stack framework with excellent TypeScript support
- Built-in optimizations (code splitting, image optimization, bundling)
- Strong ecosystem and community support for tRPC integration
- App Router provides modern routing patterns with type safety
- Simplified deployment with single Next.js server process
- Better developer experience with Fast Refresh and integrated tooling
- Can leverage SSR/SSG if needed in future without refactoring

**Alternatives Considered:**
- React + TanStack Router: More lightweight but requires additional tooling setup
- React Router v6: Less type-safe than modern alternatives
- SvelteKit: Team unfamiliar, React already in use

### 5. Hook System Architecture

**Decision:** Implement Python hook scripts in `.claude/` that POST to tRPC API endpoint.

**Why:**
- Follows claude-code-hooks-multi-agent-observability proven pattern
- Python scripts are fast and simple to maintain
- `uv` provides fast package management and script execution
- tRPC endpoint enables type-safe event ingestion
- Hooks run asynchronously without blocking Claude Code

**Data Flow:**
```
Claude Code Event
  ↓
.claude/settings.json (maps event to hook script)
  ↓
Python hook script (pre_tool_use.py, etc.)
  ↓
send_event.py (POSTs JSON to API)
  ↓
tRPC hooks.ingest procedure
  ↓
Drizzle ORM → SQLite
  ↓
WebSocket broadcast to subscribed clients
```

**Alternatives Considered:**
- TypeScript hooks: Would require Node.js execution, slower startup
- Direct database writes: Skips API validation and real-time broadcast
- Message queue (RabbitMQ, etc.): Over-engineered for single-server deployment

### 6. Database Migration Strategy

**Decision:** Use Drizzle introspection + data migration script, not in-place migration.

**Why:**
- Drizzle can introspect existing SQLite schema
- Generate migration SQL that aligns with new schema definitions
- Separate data migration script copies data safely
- Allows testing migration without affecting production database
- Can rollback by restoring backup

**Migration Steps:**
1. Backup current SQLite database
2. Create Drizzle schema definitions matching current structure
3. Generate initial migration: `drizzle-kit generate:sqlite`
4. Create data migration script to copy data
5. Test migration on database copy
6. Apply to production with rollback plan

**Alternatives Considered:**
- In-place ALTER TABLE: Risky, no rollback without backup
- Manual SQL migration: Error-prone, loses type safety benefits
- Export/Import: Downtime required during re-import

## Risks / Trade-offs

### Risk: Migration Effort is Significant
**Impact:** 50+ hours of development time estimated

**Mitigation:**
- Break into small, testable tasks (tasks.md has 10 phases)
- Can pause migration at any phase without losing work
- Database migration is reversible via backup restoration

### Risk: Learning Curve for New Technologies
**Impact:** Team needs to learn tRPC, Drizzle, Turborepo

**Mitigation:**
- Better-T-Stack provides templates and examples
- Technologies are well-documented with strong communities
- Type safety reduces debugging time, offsetting learning investment

### Risk: Docker Build Complexity Increases
**Impact:** Multi-stage builds required for monorepo, longer build times

**Mitigation:**
- Turborepo caching speeds up subsequent builds
- Docker layer caching can be optimized for monorepo
- Build once, deploy many (no rebuild for config changes)

### Risk: Hook Scripts May Miss Events
**Impact:** If hook execution is too slow, Claude Code might proceed without waiting

**Mitigation:**
- Hooks run asynchronously, don't block Claude Code
- Event POST to backend is fast (<10ms typical)
- Failed events are logged locally for debugging
- Can batch events if needed for performance

### Trade-off: Increased Complexity vs Type Safety
**Current:** Simple Express server, easy to understand, but error-prone

**Future:** Monorepo with build orchestration, more complex, but much safer

**Justification:** Type safety prevents entire classes of runtime errors. As project scales, this investment pays dividends in reduced debugging time and fewer production issues.

### Trade-off: Frontend Framework Choice
**Next.js:** Full-stack framework, built-in optimizations, excellent DX, simpler deployment

**React + TanStack Router:** More lightweight, requires additional tooling, more configuration

**Justification:** Next.js provides superior developer experience and integrated tooling that accelerates development. While slightly heavier, the build optimizations and integrated features (routing, bundling, code splitting) outweigh the minimal overhead for a homelab deployment.

## Migration Plan

### Phase 1: Setup & Scaffolding (Day 1)
- Generate Better-T-Stack template
- Configure monorepo workspaces
- Set up Turborepo

### Phase 2: Database Layer (Day 1-2)
- Define Drizzle schemas
- Generate migrations
- Test data migration script

### Phase 3: API Backend (Day 2-4)
- Implement tRPC routers
- Migrate REST endpoints to procedures
- Add WebSocket subscriptions

### Phase 4: Frontend (Day 4-5)
- Set up React + TanStack Router
- Implement tRPC client queries
- Rebuild UI components with type-safe API

### Phase 5: Hook System (Day 5-6)
- Create `.claude/` structure
- Implement Python hook scripts
- Configure settings.json
- Test with real Claude Code session

### Phase 6: Docker & Deployment (Day 6-7)
- Update Dockerfile for monorepo
- Test production build
- Deploy to homelab
- Monitor and fix issues

**Rollback Plan:**
1. Keep old Express server code in separate branch
2. Database backup restoration script ready
3. Docker Compose can quickly switch to old image
4. Estimated rollback time: 15 minutes

## Open Questions

### 1. Should we use Next.js or React + TanStack Router?
**Status:** Decided - Next.js

**Rationale:** Superior developer experience, built-in optimizations, excellent tRPC integration, integrated tooling accelerates development

### 2. Should hooks block on API response or fire-and-forget?
**Status:** Decided - Fire-and-forget with local error logging

**Rationale:** Don't slow down Claude Code, events are non-critical telemetry

### 3. Should we support multiple database backends?
**Status:** Decided - SQLite only for v1

**Rationale:** Keep migration simple, can add PostgreSQL support later with Drizzle's multi-dialect support

### 4. Should we add authentication for the API?
**Status:** Deferred to future change

**Rationale:** Deployed in homelab behind Tailscale, not exposed to internet. Auth can be added later if needed.

### 5. How to handle hook script dependencies?
**Status:** Decided - Use `uv` with inline dependency declarations

**Rationale:** Fast, isolated, no global environment pollution

## Success Metrics

**Technical Metrics:**
- Zero type errors in production
- 100% of API calls are type-safe tRPC procedures
- Hook event ingestion latency <50ms p95
- Frontend build time <30 seconds with Turborepo caching

**Developer Experience:**
- Auto-complete works for all API calls
- Compilation catches API mismatches before runtime
- Hook scripts easy to modify without breaking backend

**Operational Metrics:**
- Docker deployment successful on first try
- No data loss during migration
- Service uptime maintained (rollback available)
- Real-time event streaming latency <100ms
