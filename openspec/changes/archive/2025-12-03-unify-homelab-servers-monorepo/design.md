# Design: Unified Homelab Services Monorepo

## Context

Two separate Better-T-Stack migration efforts are underway:
- `migrate-claude-agent-to-better-t-stack` (28/89 tasks complete)
- `migrate-playwright-server-to-better-t-stack` (0/126 tasks)

Both services require similar technical infrastructure:
- Web dashboards with tables, charts, and filters
- SQLite database with Drizzle ORM
- tRPC API layer
- Similar deployment patterns (Docker containers in homelab)

**Constraints:**
- Must maintain independent Docker deployments for each service
- Cannot break existing docker-compose integration
- Build time must remain reasonable (< 2 minutes for full rebuild)
- Development experience should improve, not degrade

**Stakeholders:**
- Developer: Leo (solo operator)
- Deployment: Homelab Docker Compose stack
- Consumers: GitHub Actions workflows, homelab users

## Goals / Non-Goals

### Goals
- ✅ Single source of truth for shared UI components
- ✅ Consistent design system across both dashboards
- ✅ Shared database utilities and patterns
- ✅ Unified build and dependency management
- ✅ Independent service deployments
- ✅ Faster development through component reuse

### Non-Goals
- ❌ Coupling business logic between services (they remain independent)
- ❌ Shared database instances (each service keeps its own SQLite DB)
- ❌ Combined Docker container (services deploy separately)
- ❌ Shared API routes (each service has its own tRPC router)

## Decisions

### Decision 1: Monorepo Structure - Turborepo with Apps/Packages

**Choice:** Apps for deployable services, packages for shared libraries

**Why:**
- Clear separation between "what deploys" vs "what's shared"
- Turborepo optimizes builds across workspaces
- Each app can have independent versioning and deployment
- Packages enable proper dependency tracking (app → package changes trigger rebuilds)

**Alternatives Considered:**
- **Lerna:** Older, less optimized for build caching
- **Nx:** More complex than needed for 2 apps
- **Rush:** Overkill for small monorepo

**Implementation:**
```
apps/
  claude-agent/       # Deployable service
  playwright-server/  # Deployable service

packages/
  ui/                 # Shared React components
  db/                 # Database utilities
  validators/         # Zod schemas
  config/            # Tooling configs
```

### Decision 2: Shared UI Package - React with shadcn/ui

**Choice:** Single `packages/ui` with shadcn/ui components

**Why:**
- Both dashboards need identical primitives (Table, Card, Button, DatePicker)
- shadcn/ui provides copy-paste customization (own the code)
- React Server Components compatible
- Tailwind for consistent styling

**Components to Share:**
- `DataTable` - Generic sortable/filterable table
- `DateRangePicker` - Date/time filtering
- `StatsCard` - Metric displays
- `Layout` - Common page structure
- `ChartWrapper` - Recharts integration
- `SearchInput` - Debounced search

**Alternatives Considered:**
- **Separate component libraries per app:** Duplicates code
- **Headless UI library:** More boilerplate needed
- **Material-UI:** Heavier bundle, less customizable

**Implementation:**
```typescript
// packages/ui/src/data-table.tsx
export function DataTable<T>({
  columns,
  data,
  onSort,
  onFilter
}: DataTableProps<T>) { ... }

// apps/claude-agent/src/components/hooks-table.tsx
import { DataTable } from "@homelab/ui";

export function HooksTable() {
  return <DataTable columns={hookColumns} data={hooks} />;
}
```

### Decision 3: Shared DB Package - Drizzle ORM Patterns

**Choice:** Shared utilities, separate schemas per app

**Why:**
- Each service maintains its own SQLite database (independence)
- Common patterns: migrations, connection management, query builders
- Schemas differ (hooks vs reports), but utilities don't

**What's Shared:**
- Connection factory (`createDb()`)
- Migration runner patterns
- Query helpers (pagination, sorting)
- Transaction wrappers

**What's NOT Shared:**
- Schema definitions (each app owns its schema)
- Seed data
- Business-specific queries

**Alternatives Considered:**
- **Shared schemas:** Would couple services
- **No shared package:** Duplicate connection logic

**Implementation:**
```typescript
// packages/db/src/connection.ts
export function createDb(path: string) {
  return drizzle(new Database(path));
}

// packages/db/src/pagination.ts
export function paginate(query, page, limit) { ... }

// apps/claude-agent/src/db/schema.ts (app-specific)
export const hooks = sqliteTable("hooks", { ... });
```

### Decision 4: Docker Build Strategy - Multi-Stage per App

**Choice:** Separate Dockerfiles with shared build context

**Why:**
- Each service needs independent deployment
- Turborepo pruning extracts minimal dependencies per app
- Multi-stage builds cache shared layers
- Allows different runtime requirements if needed

**Build Flow:**
```bash
# Build workspace with turbo
turbo run build --filter=claude-agent

# Prune for Docker (only claude-agent dependencies)
turbo prune claude-agent --out-dir=./dist/claude-agent

# Docker uses pruned output
docker build -f docker/claude.Dockerfile ./dist/claude-agent
```

**Alternatives Considered:**
- **Single Dockerfile with build args:** More complex, harder to optimize
- **Docker Compose builds entire monorepo:** Wasteful for single service updates

**Implementation:**
```dockerfile
# docker/claude.Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:20-alpine AS runner
COPY --from=builder /app/apps/claude-agent/dist ./
CMD ["node", "index.js"]
```

### Decision 5: Package Naming - @homelab Scope

**Choice:** `@homelab/ui`, `@homelab/db`, `@homelab/validators`

**Why:**
- Clear namespace (avoids conflicts with npm packages)
- Indicates internal packages
- Consistent with Turborepo patterns

**Implementation:**
```json
// packages/ui/package.json
{
  "name": "@homelab/ui",
  "exports": {
    "./data-table": "./src/data-table.tsx",
    "./date-picker": "./src/date-picker.tsx"
  }
}

// apps/claude-agent/package.json
{
  "dependencies": {
    "@homelab/ui": "workspace:*",
    "@homelab/db": "workspace:*"
  }
}
```

### Decision 6: Shared Validators - Zod with Type Exports

**Choice:** Single validators package with domain-specific modules

**Why:**
- tRPC routes need shared input/output schemas
- Type safety across app boundaries
- Frontend forms use same schemas as backend

**Structure:**
```typescript
// packages/validators/src/common.ts
export const paginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100)
});

// packages/validators/src/hooks.ts
export const createHookSchema = z.object({ ... });

// packages/validators/src/reports.ts
export const reportFilterSchema = z.object({ ... });
```

## Risks / Trade-offs

### Risk 1: Increased Build Complexity
**Impact:** Developers need to understand Turborepo workspace patterns
**Mitigation:**
- Document common workflows in README
- Provide npm scripts for common tasks (`npm run dev`, `npm run build:claude`)
- Turborepo UI for visualizing build graph if needed

### Risk 2: Shared Package Changes Trigger Multi-App Rebuilds
**Impact:** Changing `packages/ui` rebuilds both apps (slower CI/CD)
**Mitigation:**
- Turborepo caching reduces rebuild time
- Deploy only changed apps (check `turbo run build --filter=[HEAD^1]`)
- Separate package versioning triggers selective deploys

### Risk 3: Tighter Coupling Between Services
**Impact:** Shared components might leak service-specific logic
**Mitigation:**
- Strict boundary: packages must be generic, apps are specific
- Code review for package changes
- Keep business logic in apps, only UI/utilities in packages

### Trade-off: Development Setup Complexity vs Long-Term Efficiency
**Decision:** Accept upfront monorepo learning curve for long-term dev speed
**Rationale:**
- Initial setup takes ~2 hours to understand Turborepo
- Saves 30%+ time on new features (reuse components)
- Single source of truth reduces bugs

## Migration Plan

### Phase 1: Repository Structure (Week 1)
1. ✅ Rename `claude-agent-server/` → `homelab-services/`
2. ✅ Update root package.json with workspace config
3. ✅ Move existing apps/api → apps/claude-agent
4. Create packages/ui, packages/db, packages/validators scaffolds
5. Update turbo.json with build pipeline
6. **Test:** `turbo run build` successfully builds claude-agent

### Phase 2: Playwright Integration (Week 2)
1. Copy playwright-server code into apps/playwright-server
2. Update imports to use workspace packages
3. Create Docker build for playwright-server
4. Update docker-compose.yml
5. **Test:** Both services deploy and run independently

### Phase 3: Extract Shared Components (Week 3)
1. Identify common components (DataTable, DatePicker, etc.)
2. Move to packages/ui with proper exports
3. Update both apps to import from @homelab/ui
4. **Test:** No functionality regressions in either app

### Phase 4: Extract Shared Utilities (Week 4)
1. Move DB connection logic to packages/db
2. Move common validators to packages/validators
3. Update imports across apps
4. **Test:** Full integration test of both services

### Rollback Strategy
- Keep existing claude-agent-server structure until Phase 2 complete
- Each phase is independently testable
- Can revert to separate repos if monorepo proves problematic
- Git branches: `main` (stable), `monorepo-migration` (WIP)

### Data Migration
- No database changes (each service keeps its SQLite DB)
- No environment variable changes
- Docker volume mounts unchanged
- Configuration files unchanged

## Open Questions

1. **Component Library Versioning:** Should packages/ui have semantic versioning?
   → **Decision Needed:** Use `workspace:*` for internal packages (always latest)

2. **Shared Config Packages:** Should ESLint/Prettier configs be shared packages?
   → **Decision Needed:** Yes, create `@homelab/config` for DRY tooling

3. **Testing Strategy:** Shared test utilities or per-app?
   → **Decision Needed:** Shared test-utils package for factories/mocks

4. **Deployment Naming:** Keep `claude-agent-server` container name or rename to `claude-agent`?
   → **Decision Needed:** Rename to `claude-agent` for consistency (update docker-compose.yml)
