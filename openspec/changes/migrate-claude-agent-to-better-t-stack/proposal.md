# Change: Migrate Claude Agent Server to Better-T-Stack Architecture

## Why

The current `claude-agent-server` uses a basic Express + SQLite + vanilla TypeScript setup that lacks modern development patterns, type safety, and maintainability. By migrating to the Better-T-Stack architecture, we gain:

1. **Type-safe API layer with tRPC**: End-to-end type safety from frontend to backend
2. **Modern ORM with Drizzle**: Type-safe database queries and schema management
3. **Modular monorepo structure**: Clean separation between web UI, API, and shared utilities
4. **Integrated hooks system**: Observability and multi-agent tracking inspired by claude-code-hooks-multi-agent-observability

The current implementation is a proof-of-concept that has infrastructure ready but lacks production-quality architecture for scalability and maintainability.

## What Changes

**Architecture Migration:**
- Restructure from flat Express app to monorepo with Better-T-Stack conventions
- Replace raw Express REST endpoints with tRPC procedures
- Migrate from raw SQLite3 queries to Drizzle ORM with schema definitions
- Implement proper TypeScript configuration with shared tsconfig
- Add build tooling with Turborepo for efficient monorepo builds

**Hook Integration:**
- Create `.claude/` directory structure with Python hook scripts
- Implement `settings.json` for hook event configuration
- Add pre/post tool use hooks for observability
- Integrate session lifecycle hooks (start, stop, compact)
- Connect hooks to tRPC backend for event ingestion

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
│   └── types/                     # Shared TypeScript types (optional)
├── docker/
│   ├── claude.Dockerfile          # Already exists
│   └── playwright.Dockerfile      # Already exists
├── .claude/                       # Hook system for observability (to be added)
│   ├── hooks/                     # Python hook scripts
│   └── settings.json              # Hook configuration
├── turbo.json                     # Already configured
└── package.json                   # Workspace root
```

**Note:** The monorepo infrastructure already exists from the `unify-homelab-servers-monorepo` change. This migration focuses on extending the claude-agent app with tRPC backend and integrating the hook system.

**Breaking Changes:**
- **BREAKING**: REST API endpoints replaced with tRPC procedures
- **BREAKING**: WebSocket API changes to integrate with tRPC subscriptions
- **BREAKING**: Database schema migration from direct SQLite3 to Drizzle
- **BREAKING**: Environment variable structure changes for monorepo

**Backward Compatibility:**
- Docker deployment configuration preserved (same exposed ports)
- Database file location and schema structure maintained (migration scripts provided)
- Frontend UI routes remain the same (http://claude.local)

## Impact

**Affected Specs:**
- `claude-agent-server` - Complete architectural restructure
- `agent-hooks-observability` (NEW) - Hook system for multi-agent tracking

**Affected Code:**
- `homelab-services/apps/claude-agent/src/` - Extend with tRPC API (currently minimal structure)
- `homelab-services/apps/claude-agent/` - Add frontend with type-safe queries using @homelab/ui
- `homelab-services/packages/db/` - Extended with projects, sessions, hooks schemas
- `homelab-services/packages/validators/` - Extended with claude-agent Zod schemas
- `homelab-services/.claude/` - NEW: Hook system directory
- `homelab/compose/claude-agent-server.yml` - Volume mounts may need adjustment
- Database initialization scripts - Migrated to Drizzle migrations

**Benefits:**
- Type safety across entire stack reduces runtime errors
- Faster development with auto-generated API types
- Better code organization and maintainability
- Production-ready architecture supporting future scale
- Integrated observability for debugging multi-agent workflows

**Risks:**
- Migration effort is significant (3-5 days estimated)
- Temporary disruption to any active development workflows
- Learning curve for team members unfamiliar with tRPC/Drizzle
- Increased complexity in build/deployment pipeline

**Migration Strategy:**
- Create new Better-T-Stack structure alongside existing code
- Migrate database schema with backward-compatible migration scripts
- Port API endpoints one feature at a time (projects → sessions → hooks)
- Update Docker configuration to work with monorepo build output
- Deprecate old structure after full migration validation
