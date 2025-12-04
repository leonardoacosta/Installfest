# Architecture Overview

This document describes the architecture of the homelab-services monorepo, built with the **Better-T-Stack** for type-safe, scalable development.

## Tech Stack

The Better-T-Stack provides end-to-end type safety from database to frontend:

- **Framework**: Next.js 14 with App Router
- **API Layer**: tRPC 11 for type-safe procedures
- **Database**: SQLite with Drizzle ORM
- **Validation**: Zod schemas
- **HTTP Server**: Hono (tRPC adapter)
- **Build System**: Turborepo (monorepo orchestration)
- **Runtime**: Bun for fast development and builds

### Why Better-T-Stack?

1. **End-to-End Type Safety**: TypeScript types flow from database schema → API procedures → frontend components
2. **Zero API Boilerplate**: tRPC eliminates REST endpoint definitions, OpenAPI specs, and manual serialization
3. **Fast Iteration**: Turborepo caching + Bun runtime = instant dev server starts and hot reloads
4. **Shared Code**: Common UI components, database utilities, and validators prevent duplication
5. **Database-First**: Drizzle schema is source of truth, generates TypeScript types automatically

## Monorepo Structure

```
homelab-services/
├── apps/
│   ├── claude-agent-web/       # Claude agent dashboard (Next.js + tRPC)
│   └── playwright-server/      # Playwright reports (Next.js + tRPC)
├── packages/
│   ├── api/                    # tRPC routers and procedures
│   ├── db/                     # Drizzle ORM schemas and utilities
│   ├── ui/                     # Shared React components
│   └── validators/             # Zod validation schemas
├── docker/
│   ├── claude.Dockerfile       # Claude agent container
│   └── playwright.Dockerfile   # Playwright server container
└── turbo.json                  # Build pipeline configuration
```

### Apps vs Packages

**Apps** (`apps/`):
- Complete deployable applications
- Have their own Next.js configuration
- Consume packages via `@homelab/*` imports
- Each app has a dedicated port and Docker image

**Packages** (`packages/`):
- Shared libraries imported by multiple apps
- Published to workspace via `@homelab/` namespace
- Must be built before apps that depend on them
- Managed by Turborepo build pipeline

## Application Architecture

Both applications follow the same architectural patterns:

### 1. Database Layer (Drizzle ORM)

**Location**: `packages/db/src/schema/`

Each application has its own database schema:

```typescript
// packages/db/src/schema/claude-agent.ts
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  path: text('path').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

// Drizzle automatically generates TypeScript types:
type Project = typeof projects.$inferSelect;
type NewProject = typeof projects.$inferInsert;
```

**Key Features**:
- Type-safe queries with autocompletion
- Automatic migrations via `drizzle-kit generate`
- Transaction support with `withTransaction()`
- Pagination utilities via `@homelab/db`

**Database Files**:
- Claude Agent: `/app/db/claude.db` (mounted volume)
- Playwright Server: `/app/db/reports.db` (mounted volume)

### 2. Validation Layer (Zod)

**Location**: `packages/validators/src/`

Zod schemas validate input and provide TypeScript types:

```typescript
// packages/validators/src/reports.ts
export const reportFilterSchema = z.object({
  workflow: z.string().optional(),
  status: z.enum(['passed', 'failed', 'flaky']).optional(),
  limit: paginationSchema.shape.limit,
  offset: paginationSchema.shape.offset,
});

export type ReportFilter = z.infer<typeof reportFilterSchema>;
```

**Reusable Schemas**:
- `paginationSchema` - Consistent pagination across all APIs
- `dateRangeSchema` - Date range filtering with validation
- `sortSchema` - Sorting configuration (field + direction)

### 3. API Layer (tRPC)

**Location**: `packages/api/src/router/`

tRPC procedures provide type-safe API endpoints:

```typescript
// packages/api/src/router/reports.ts
export const reportsRouter = t.router({
  list: t.procedure
    .input(reportFilterSchema)
    .query(async ({ input, ctx }) => {
      const reports = await ctx.db
        .select()
        .from(schema.reports)
        .where(input.workflow ? eq(schema.reports.workflow_name, input.workflow) : undefined)
        .limit(input.limit)
        .offset(input.offset);

      return createPaginatedResult(reports, input.offset, input.limit);
    }),
});
```

**Type Safety Flow**:
1. Frontend calls `trpc.reports.list.useQuery({ workflow: 'test' })`
2. TypeScript enforces `reportFilterSchema` input types
3. Return type automatically inferred from query
4. No manual type definitions needed!

**tRPC Features**:
- **Queries**: Read operations (`useQuery`)
- **Mutations**: Write operations (`useMutation`)
- **Subscriptions**: Real-time updates (`useSubscription`)
- **Middleware**: Authentication, logging, error handling
- **Context**: Request-scoped data (database, user session)

### 4. Frontend Layer (Next.js)

**Location**: `apps/*/src/app/`

Next.js 14 App Router with React Server Components:

```typescript
// apps/playwright-server/src/app/reports/page.tsx
import { trpc } from '~/lib/trpc';

export default async function ReportsPage() {
  // Server Component - data fetched on server
  const reports = await trpc.reports.list.query({ limit: 10 });

  return (
    <div>
      {reports.items.map(report => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
```

**Client Components** (interactive):
```typescript
'use client';
import { trpc } from '~/lib/trpc/client';

export function ReportsTable() {
  const { data, isLoading } = trpc.reports.list.useQuery({ limit: 10 });
  // Fully typed! TypeScript knows exact shape of `data`
}
```

### 5. Shared UI Components

**Location**: `packages/ui/src/`

Reusable React components with Tailwind CSS:

```typescript
import { DataTable, StatsCard, DateRangePicker } from '@homelab/ui';

<DataTable
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status' }
  ]}
  data={reports}
  onSort={(key, direction) => { ... }}
/>
```

**Available Components**:
- `DataTable` - Sortable/filterable table with pagination
- `StatsCard` - Metric cards with trend indicators
- `DateRangePicker` - Date range selection with presets
- `SearchInput` - Debounced search with clear button
- `Layout` - Common page layout with nav/header

## Data Flow

### Query Flow (Read Operations)

```
User Action → tRPC Client Hook → tRPC Procedure → Database Query → Drizzle ORM → SQLite
                    ↓                   ↓                  ↓              ↓
               TypeScript         Zod Validation      Type-safe      Raw Data
                 Types              of Input           Query
                    ↓                   ↓                  ↓              ↓
               UI Update ← React State ← Inferred Type ← Query Result ←─┘
```

**Example**:
```typescript
// 1. Frontend calls tRPC hook
const { data } = trpc.reports.list.useQuery({ workflow: 'test', limit: 10 });
//     ^? PaginatedResult<Report[]> (fully typed!)

// 2. tRPC validates input with Zod
reportFilterSchema.parse({ workflow: 'test', limit: 10 });

// 3. Procedure executes type-safe query
const reports = await db.select().from(schema.reports)
  .where(eq(schema.reports.workflow_name, 'test'))
  .limit(10);

// 4. Drizzle returns typed results
// reports: Report[] (TypeScript knows all fields)

// 5. Frontend receives typed data
// data.items[0].workflow_name (autocomplete works!)
```

### Mutation Flow (Write Operations)

```
User Action → tRPC Mutation → Zod Validation → Database Write → Drizzle ORM → SQLite
                    ↓               ↓                  ↓              ↓
              useMutation      Input Schema       Transaction    Auto-commit
                    ↓               ↓                  ↓              ↓
          UI Invalidation ← Success/Error ← Return Value ← Insert Result
```

**Example**:
```typescript
// 1. Frontend mutation
const createProject = trpc.projects.create.useMutation();
await createProject.mutateAsync({ name: 'New Project', path: '/tmp' });

// 2. Zod validates input
createProjectSchema.parse({ name: 'New Project', path: '/tmp' });

// 3. Procedure inserts with transaction
const result = await withTransaction(db, async (tx) => {
  return tx.insert(schema.projects).values({
    name: 'New Project',
    path: '/tmp'
  }).returning();
});

// 4. Frontend invalidates query cache
queryClient.invalidateQueries(['projects', 'list']);
```

### Real-Time Flow (Subscriptions)

```
Event Trigger → tRPC Subscription → Event Stream → WebSocket → Client Update
                       ↓                  ↓             ↓            ↓
                  Observable         Server-Sent    Browser    React State
                   Pattern             Events        API
```

**Example** (Claude Agent Hook Tracking):
```typescript
// Server: Emit events
const onHookIngest = new Subject<Hook>();

export const hooksRouter = t.router({
  subscribe: t.procedure.subscription(() => {
    return observable<Hook>((emit) => {
      const sub = onHookIngest.subscribe(emit.next);
      return () => sub.unsubscribe();
    });
  }),
});

// Client: Real-time updates
const { data: hooks } = trpc.hooks.subscribe.useSubscription();
// UI updates automatically when new hooks arrive!
```

## Database Design Patterns

### 1. Timestamps with Auto-Generation

```typescript
export const reports = sqliteTable('reports', {
  created_at: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
});
```

### 2. Foreign Keys with Cascade Deletes

```typescript
export const hooks = sqliteTable('hooks', {
  sessionId: integer('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
});
```

When a session is deleted, all associated hooks are automatically deleted.

### 3. Indexes for Query Performance

```typescript
export const hooks = sqliteTable('hooks', {
  // columns...
}, (table) => ({
  sessionIdx: index('idx_hooks_session').on(table.sessionId, table.timestamp),
  toolIdx: index('idx_hooks_tool').on(table.toolName, table.timestamp),
}));
```

### 4. Enum-Like Fields

```typescript
export const sessions = sqliteTable('sessions', {
  status: text('status', { enum: ['running', 'stopped'] })
    .default('stopped')
    .notNull(),
});
```

### 5. Pagination Utilities

```typescript
// packages/db/src/utils/pagination.ts
export function createPaginatedResult<T>(
  items: T[],
  offset: number,
  limit: number,
  total?: number
) {
  return {
    items,
    pagination: {
      offset,
      limit,
      total: total ?? items.length,
      hasMore: items.length === limit
    }
  };
}
```

## Build Pipeline (Turborepo)

### Task Dependencies

Turborepo orchestrates the build pipeline with smart caching:

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],  // Build dependencies first
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Build Order**:
1. `packages/validators` (no dependencies)
2. `packages/db` (depends on validators)
3. `packages/ui` (depends on nothing)
4. `packages/api` (depends on db, validators)
5. `apps/*` (depends on all packages)

### Caching Strategy

Turborepo caches task outputs based on:
- File hashes (if code unchanged, skip rebuild)
- Environment variables
- Task dependencies

**Result**: Second build is ~10x faster (cached)

### Development Mode

```bash
bun run dev
```

Starts all apps in parallel with hot reload:
- Claude Agent: http://localhost:3002
- Playwright Server: http://localhost:3000

Turborepo watches package changes and rebuilds automatically.

## Docker Architecture

### Multi-Stage Builds

Both Dockerfiles use multi-stage builds for optimized images:

```dockerfile
# Stage 1: Dependencies
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Stage 2: Build
FROM oven/bun:1 AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN bun run build --filter=@homelab/playwright-server

# Stage 3: Production
FROM oven/bun:1 AS runner
WORKDIR /app
COPY --from=builder /app/apps/playwright-server/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
CMD ["bun", "run", "start"]
```

**Optimization Benefits**:
- Smaller final image (only production dependencies)
- Faster builds (layer caching)
- Security (no build tools in production image)

### Volume Mounts

Each service persists data via Docker volumes:

**Claude Agent**:
```yaml
volumes:
  - claude-agent-db:/app/db           # SQLite database
  - /home/leo/dev/projects:/projects  # Project workspace access
  - .claude:/app/.claude              # Hook scripts
```

**Playwright Server**:
```yaml
volumes:
  - playwright-reports:/reports       # Shared with GitHub runners
  - playwright-db:/app/db            # SQLite database
```

### Network Configuration

Both services connect to the `homelab` Docker network:
- Access other homelab services (AdGuard DNS, Home Assistant, etc.)
- Reverse proxy via Traefik
- Internal DNS resolution

## API Design Patterns

### Pagination

All list endpoints use consistent pagination:

```typescript
const listQuerySchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const reportsRouter = t.router({
  list: t.procedure
    .input(listQuerySchema.merge(reportFilterSchema))
    .query(async ({ input, ctx }) => {
      const reports = await ctx.db.query.reports.findMany({
        limit: input.limit,
        offset: input.offset,
      });

      return createPaginatedResult(reports, input.offset, input.limit);
    }),
});
```

### Error Handling

tRPC uses custom error codes:

```typescript
import { TRPCError } from '@trpc/server';

if (!project) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'Project not found'
  });
}

if (!isAuthorized) {
  throw new TRPCError({
    code: 'UNAUTHORIZED',
    message: 'Access denied'
  });
}
```

Frontend automatically handles errors:
```typescript
const { error } = trpc.projects.byId.useQuery({ id: 123 });
if (error) {
  // error.data.code === 'NOT_FOUND'
  // error.message === 'Project not found'
}
```

### Input Validation

Zod schemas validate all inputs with custom error messages:

```typescript
export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  path: z.string()
    .min(1, 'Path is required')
    .refine((p) => path.isAbsolute(p), 'Path must be absolute'),
  description: z.string().optional(),
});
```

tRPC automatically returns validation errors to frontend with field-level detail.

## Performance Considerations

### 1. Database Indexes

All foreign keys and frequently queried fields have indexes:

```typescript
// Fast lookups by session_id
sessionIdx: index('idx_hooks_session').on(table.sessionId)

// Fast filtering by tool name
toolIdx: index('idx_hooks_tool').on(table.toolName)
```

### 2. Query Optimization

Use `where()` clauses efficiently:

```typescript
// ❌ Slow: Load all, filter in memory
const reports = await db.select().from(schema.reports);
const filtered = reports.filter(r => r.status === 'failed');

// ✅ Fast: Filter in database
const failed = await db.select()
  .from(schema.reports)
  .where(eq(schema.reports.status, 'failed'));
```

### 3. Pagination

Always paginate large result sets:

```typescript
const reports = await db.select()
  .from(schema.reports)
  .limit(input.limit)
  .offset(input.offset)
  .orderBy(desc(schema.reports.created_at));
```

### 4. Connection Pooling

Database connections are reused via singleton pattern:

```typescript
// packages/db/src/index.ts
let db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!db) {
    db = createDb();
  }
  return db;
}
```

### 5. React Query Caching

tRPC uses React Query for automatic caching:

```typescript
// First call: Fetches from API
const { data } = trpc.reports.list.useQuery({ limit: 10 });

// Second call (same component): Returns from cache instantly
const { data } = trpc.reports.list.useQuery({ limit: 10 });
```

Cache invalidation on mutations:
```typescript
const createReport = trpc.reports.create.useMutation({
  onSuccess: () => {
    // Refetch reports list
    queryClient.invalidateQueries(['reports', 'list']);
  }
});
```

## Security Considerations

### 1. SQL Injection Prevention

Drizzle ORM uses parameterized queries (safe by default):

```typescript
// ✅ Safe: Parameterized
await db.select()
  .from(schema.reports)
  .where(eq(schema.reports.workflow_name, userInput));

// ❌ Dangerous: String concatenation (never do this!)
await db.execute(sql`SELECT * FROM reports WHERE workflow_name = '${userInput}'`);
```

### 2. Input Validation

All user input validated via Zod schemas before processing.

### 3. CORS Configuration

Restrict API access to known origins:

```typescript
// apps/*/src/server.ts
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
};
```

### 4. Environment Variables

Sensitive configuration via environment variables (never committed):

```bash
# .env.local (not in git)
CLAUDE_API_KEY=secret
DB_PATH=/secure/path
```

### 5. Docker Security

Non-root user in Docker containers:

```dockerfile
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
```

## Testing Strategy

### Unit Tests (Packages)

Test shared utilities in isolation:

```typescript
// packages/db/src/utils/pagination.test.ts
import { createPaginatedResult } from './pagination';

test('creates paginated result', () => {
  const items = [1, 2, 3];
  const result = createPaginatedResult(items, 0, 10);

  expect(result.items).toEqual([1, 2, 3]);
  expect(result.pagination.hasMore).toBe(false);
});
```

### Integration Tests (tRPC Procedures)

Test API procedures with real database:

```typescript
// packages/api/src/router/reports.test.ts
test('lists reports with filters', async () => {
  const caller = appRouter.createCaller(testContext);
  const result = await caller.reports.list({ status: 'failed' });

  expect(result.items).toHaveLength(2);
  expect(result.items[0].status).toBe('failed');
});
```

### E2E Tests (Playwright)

Test full user flows in browser:

```typescript
// apps/playwright-server/e2e/reports.spec.ts
test('displays reports list', async ({ page }) => {
  await page.goto('/reports');
  await expect(page.locator('h1')).toContainText('Test Reports');
  await expect(page.locator('[data-testid="report-row"]')).toHaveCount(10);
});
```

## Deployment Architecture

### Homelab Integration

Both services deploy to Arch Linux server via Docker Compose:

```yaml
# homelab/compose/claude-agent-server.yml
services:
  claude-agent-web:
    image: claude-agent-web:latest
    container_name: claude-agent-web
    networks:
      homelab:
        ipv4_address: 172.20.0.110
    volumes:
      - claude-agent-db:/app/db
      - /home/leo/dev/projects:/projects
    environment:
      - PORT=3002
      - DB_PATH=/app/db/claude.db
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.claude.rule=Host(`claude.local`)"
```

### CI/CD Pipeline

GitHub Actions builds and deploys on push to `dev`:

```yaml
# .github/workflows/deploy-homelab.yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build --filter=@homelab/claude-agent-web
      - run: docker build -f docker/claude.Dockerfile -t claude-agent-web .
      - run: docker save claude-agent-web | ssh homelab docker load
      - run: ssh homelab 'cd homelab && docker compose up -d claude-agent-web'
```

### Health Checks

Both services expose `/health` endpoints for monitoring:

```typescript
// apps/*/src/app/health/route.ts
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ status: 'healthy' });
  } catch (error) {
    return Response.json({ status: 'unhealthy' }, { status: 503 });
  }
}
```

Homelab monitoring script checks health every 30 minutes.

## Future Architecture Considerations

### Potential Enhancements

1. **Redis Caching**: Add Redis for cross-request caching (currently in-memory only)
2. **PostgreSQL Migration**: Switch from SQLite to PostgreSQL for better concurrency
3. **Message Queue**: Add RabbitMQ/Redis for async job processing
4. **Microservices**: Split monorepo into separate services if scaling needs arise
5. **GraphQL**: Consider GraphQL as alternative to tRPC for external API consumers

### Scalability Path

Current architecture supports:
- ✅ Hundreds of projects/sessions
- ✅ Thousands of test reports
- ✅ Tens of concurrent users

Future bottlenecks:
- SQLite write concurrency (mitigate: PostgreSQL)
- File watcher performance (mitigate: Message queue)
- Single-instance deployment (mitigate: Kubernetes)

## Related Documentation

- [Development Guide](./development.md) - Setup and workflows
- [Contributing Guide](./contributing.md) - Code style and PR process
- [Deployment Guide](./deployment.md) - Docker builds and CI/CD
- [Package Documentation](./packages/) - Detailed package APIs
- [Main CLAUDE.md](../../CLAUDE.md) - Overall project documentation
