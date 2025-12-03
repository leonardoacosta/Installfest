# Change: Unify Homelab Servers into Better-T-Stack Monorepo

## Why

Currently, claude-agent-server and playwright-server are being migrated to Better-T-Stack as separate monorepos. Both services require similar web dashboards with shared UI patterns (tables, charts, date/time filters, layouts), shared infrastructure (SQLite utilities, tRPC setup), and shared validators/types. Maintaining these as separate repositories duplicates component development effort and creates inconsistent user experiences.

By unifying both servers into a single Better-T-Stack monorepo, we can share a common UI component library, database utilities, and API patterns while maintaining separate deployable applications. This reduces duplication, improves development efficiency, and ensures consistent UX across all homelab management interfaces.

## What Changes

**Architecture:**
- Merge claude-agent-server and playwright-server into unified `homelab-services` monorepo
- Structure with separate apps for each service (claude-agent, playwright-server)
- Create shared packages for UI components, database utilities, validators, and configuration
- Maintain separate Docker builds per service for independent deployment

**Shared Infrastructure:**
- `packages/ui` - Shared shadcn/ui components (tables, charts, filters, layouts)
- `packages/db` - Drizzle ORM schemas and SQLite utilities
- `packages/validators` - Zod validation schemas
- `packages/config` - Shared TypeScript, ESLint, Prettier configs

**Application Structure:**
- `apps/claude-agent` - Claude Code agent management API and dashboard
- `apps/playwright-server` - Playwright test report aggregation API and dashboard

**Build System:**
- Single Turborepo with unified dependency management
- Shared build cache across all packages
- Independent Docker builds per app

## Impact

### Affected Specs
**Modified:**
- `claude-agent-management` - Update architecture to monorepo structure
- `playwright-report-server` - Update architecture to monorepo structure

### Affected Code

**New Structure:**
```
claude-agent-server/  (rename to homelab-services)
├── apps/
│   ├── claude-agent/         # Claude agent management service
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── playwright-server/    # Playwright report service
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── ui/                   # Shared React components
│   ├── db/                   # Shared database utilities
│   ├── validators/           # Shared Zod schemas
│   └── config/              # Shared tooling configs
├── docker/
│   ├── claude.Dockerfile
│   └── playwright.Dockerfile
├── package.json             # Workspace root
├── turbo.json              # Turborepo config
└── bun.lock
```

**Migration Path:**
1. Rename `claude-agent-server/` to `homelab-services/`
2. Move existing `apps/api` to `apps/claude-agent`
3. Create `apps/playwright-server` from standalone playwright-server code
4. Extract shared components to `packages/ui`
5. Extract shared DB utilities to `packages/db`
6. Update docker-compose.yml to use new image build paths
7. Update GitHub Actions workflows for monorepo structure

**Docker Deployment:**
- Both services still deploy as separate containers
- Docker Compose mounts remain independent
- Build context changes to support monorepo structure

**Breaking Changes:**
- Docker image paths change (homelab/claude-agent, homelab/playwright-server)
- Build commands now use `turbo run build`
- Environment variables may need updates for new paths

### System Requirements
- No change to runtime requirements
- Build time may increase slightly due to monorepo overhead
- Development requires understanding Turborepo workspace patterns
