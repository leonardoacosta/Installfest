# Homelab Services Monorepo

Unified Better-T-Stack monorepo for homelab management services.

## 🏗️ Architecture

This monorepo contains two main applications with shared infrastructure:

- **Claude Agent** - Claude Code agent management dashboard with hook tracking
- **Playwright Server** - Playwright test report aggregation and viewing

### Structure

```
homelab-services/
├── apps/
│   ├── claude-agent/          # Claude Code agent management
│   └── playwright-server/     # Playwright test reports
├── packages/
│   ├── ui/                    # Shared React components
│   ├── db/                    # Database utilities
│   └── validators/            # Zod validation schemas
└── docker/
    ├── claude.Dockerfile      # Claude Agent Docker build
    └── playwright.Dockerfile  # Playwright Server Docker build
```

## 📦 Shared Packages

### @homelab/ui

Shared React components with Tailwind CSS styling:

- **DataTable** - Generic sortable/filterable table
- **DateRangePicker** - Date range selection
- **StatsCard** - Metric display cards
- **Layout** - Common page layout
- **SearchInput** - Debounced search input

```typescript
import { DataTable, DateRangePicker, StatsCard } from '@homelab/ui';
```

### @homelab/db

Database utilities for SQLite with Drizzle ORM:

- **Connection** - `createDb()`, `getDb()`
- **Pagination** - `getPaginationOffset()`, `createPaginatedResult()`
- **Transactions** - `withTransaction()`, `batchTransaction()`, `retryTransaction()`

```typescript
import { createDb, withTransaction, createPaginatedResult } from '@homelab/db';
```

### @homelab/validators

Zod validation schemas:

- **Common** - `paginationSchema`, `sortSchema`, `searchSchema`, `listQuerySchema`
- **Date Range** - `dateRangeSchema`, `validatedDateRangeSchema`
- **Reports** - `reportFilterSchema`, `createReportSchema`

```typescript
import { paginationSchema, dateRangeSchema } from '@homelab/validators';
```

## 🚀 Getting Started

### Prerequisites

- Bun >= 1.0.0
- Node.js >= 18.0.0

### Installation

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run development mode
bun run dev
```

### Development Commands

```bash
# Build all packages
bun run build

# Build specific package
bun run build --filter=@homelab/claude-agent

# Run in development mode
bun run dev

# Type check
bun run type-check

# Clean build artifacts
bun run clean
```

## 🐳 Docker

### Build Docker Images

```bash
# Build Claude Agent
docker build -f docker/claude.Dockerfile -t homelab/claude-agent .

# Build Playwright Server
docker build -f docker/playwright.Dockerfile -t homelab/playwright-server .
```

### Run Containers

```bash
# Claude Agent
docker run -p 3001:3001 \
  -v $(pwd)/data/claude:/app/data \
  homelab/claude-agent

# Playwright Server
docker run -p 3000:3000 \
  -v $(pwd)/reports:/app/reports \
  homelab/playwright-server
```

## 📝 Application Details

### Claude Agent (@homelab/claude-agent)

**Purpose**: Manage Claude Code development sessions across multiple projects

**Features**:
- Multi-project session management
- Hook event tracking and aggregation
- Real-time WebSocket logging
- tRPC API with type-safe endpoints

**Port**: 3001

**Endpoints**:
- `/health` - Health check
- `/api/projects` - Project management
- `/api/sessions` - Session management
- `/api/hooks` - Hook history

### Playwright Server (@homelab/playwright-server)

**Purpose**: Aggregate and view Playwright test reports from GitHub Actions runners

**Features**:
- Auto-detect new test reports via file watcher
- Extract test statistics from HTML reports
- Filter by workflow, date range, status
- SQLite database for metadata

**Port**: 3000

**Endpoints**:
- `/health` - Health check
- `/api/reports` - List/filter reports
- `/api/workflows` - List workflows

## 🔧 Development Workflow

### Adding a New Shared Component

1. Create component in `packages/ui/src/`:
```typescript
// packages/ui/src/my-component.tsx
export function MyComponent() { ... }
```

2. Export from index:
```typescript
// packages/ui/src/index.ts
export { MyComponent } from './my-component';
```

3. Use in apps:
```typescript
import { MyComponent } from '@homelab/ui';
```

### Adding a New Validator

1. Create schema in `packages/validators/src/`:
```typescript
// packages/validators/src/my-schema.ts
export const mySchema = z.object({ ... });
```

2. Export from index:
```typescript
// packages/validators/src/index.ts
export * from './my-schema';
```

## 🏠 Homelab Deployment

Both services deploy as separate Docker containers in the homelab stack:

- **claude-agent** → `http://claude.local` (via Traefik)
- **playwright-server** → `http://playwright.local` (via Traefik)

See main homelab documentation for deployment details.

## 🛠️ Troubleshooting

### Build Failures

```bash
# Clean and rebuild
bun run clean
rm -rf node_modules
bun install
bun run build
```

### Type Errors

```bash
# Run type check
bun run type-check

# Check specific package
cd apps/claude-agent && bun run type-check
```

### Docker Build Issues

```bash
# Check build context
docker build -f docker/claude.Dockerfile . --no-cache

# View build logs
docker build -f docker/claude.Dockerfile . --progress=plain
```

## 📚 Resources

- [Turborepo Docs](https://turbo.build/repo/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [tRPC](https://trpc.io/)
- [Zod](https://zod.dev/)
- [Hono](https://hono.dev/)

## 🤝 Contributing

This is a personal homelab project, but suggestions welcome via issues!

## 📄 License

MIT
