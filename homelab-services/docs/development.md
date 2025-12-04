# Development Guide

Complete guide for setting up and developing in the homelab-services monorepo.

## Prerequisites

### Required Software

- **Bun** >= 1.0.0 ([installation](https://bun.sh/docs/installation))
- **Node.js** >= 18.0.0 (for tooling compatibility)
- **Git** (for version control)
- **Docker** (optional, for testing containerized builds)

### Recommended Tools

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Error Translator
- **Drizzle Kit** (included in dev dependencies)
- **Turbo CLI** (optional): `bun install -g turbo`

## Initial Setup

### 1. Clone Repository

```bash
cd ~/dev
git clone <repository-url> homelab-services
cd homelab-services
```

### 2. Install Dependencies

```bash
# Install all package dependencies
bun install

# Verify installation
bun run --version
```

This installs dependencies for all apps and packages based on `package.json` workspaces.

### 3. Build Packages

```bash
# Build all shared packages
bun run build

# Or build incrementally (Turborepo caching)
bunx turbo build
```

**Build order** (automatic via Turborepo):
1. `packages/validators` (no dependencies)
2. `packages/db` (depends on validators)
3. `packages/ui` (independent)
4. `packages/api` (depends on db + validators)
5. `apps/*` (depends on all packages)

### 4. Initialize Databases

Each app needs its database initialized:

```bash
# Generate migration files
cd packages/db
bun run db:generate

# Apply migrations
bun run db:migrate

# Verify with Drizzle Studio (GUI)
bun run db:studio
```

**Database Locations**:
- Development: `packages/db/data/{app}.db`
- Production: Volume mounts in Docker (`/app/db/`)

## Development Workflow

### Starting Development Servers

```bash
# Start all apps in parallel
bun run dev
```

This starts:
- **Claude Agent**: http://localhost:3002
- **Playwright Server**: http://localhost:3000

Turborepo watches for file changes and hot-reloads automatically.

### Starting Individual Apps

```bash
# Start only Claude Agent
bun run dev --filter=@homelab/claude-agent-web

# Start only Playwright Server
bun run dev --filter=@homelab/playwright-server
```

**Filter syntax**: `--filter=<package-name>` or `--filter=./apps/claude-agent-web`

### Stopping Development Servers

Press `Ctrl+C` in the terminal running `bun run dev`.

Turborepo will gracefully stop all running processes.

## Project Structure

### Workspace Configuration

The monorepo uses Bun workspaces defined in `package.json`:

```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

All packages are linked automatically via `@homelab/` namespace.

### Package Dependencies

Packages declare dependencies on other workspace packages:

```json
// apps/claude-agent-web/package.json
{
  "dependencies": {
    "@homelab/api": "workspace:*",
    "@homelab/db": "workspace:*",
    "@homelab/ui": "workspace:*",
    "@homelab/validators": "workspace:*"
  }
}
```

`workspace:*` means "use the local workspace version" (no npm publish needed).

### Adding External Dependencies

```bash
# Add to specific app
cd apps/claude-agent-web
bun add <package-name>

# Add to shared package
cd packages/ui
bun add <package-name>

# Add dev dependency
bun add -d <package-name>
```

Always install dependencies in the specific package that needs them (not root).

## Working with Packages

### UI Components (`@homelab/ui`)

#### Creating a New Component

```bash
cd packages/ui/src
```

Create component file:

```typescript
// packages/ui/src/my-component.tsx
import React from 'react';

export interface MyComponentProps {
  title: string;
  children?: React.ReactNode;
}

export function MyComponent({ title, children }: MyComponentProps) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}
```

Export from index:

```typescript
// packages/ui/src/index.ts
export { MyComponent, type MyComponentProps } from './my-component';
```

Use in apps:

```typescript
import { MyComponent } from '@homelab/ui';

<MyComponent title="Test">Content here</MyComponent>
```

#### Styling with Tailwind

All UI components use Tailwind CSS classes. Tailwind is configured in each app, not in `@homelab/ui`.

**App Tailwind config** must include UI package:

```javascript
// apps/*/tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',  // Include UI components!
  ],
  // ...
};
```

### Database Utilities (`@homelab/db`)

#### Adding a New Table

Edit schema file:

```typescript
// packages/db/src/schema/claude-agent.ts
export const newTable = sqliteTable('new_table', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
});
```

Generate migration:

```bash
cd packages/db
bun run db:generate
```

This creates a new migration file in `packages/db/drizzle/`.

Apply migration:

```bash
bun run db:migrate
```

Use new table:

```typescript
import { db } from '@homelab/db';
import { newTable } from '@homelab/db/schema/claude-agent';

const items = await db.select().from(newTable);
```

#### Creating Database Utilities

Add utility functions:

```typescript
// packages/db/src/utils/my-util.ts
import { db } from '../index';

export async function findRecent(limit: number = 10) {
  return db.query.reports.findMany({
    orderBy: (reports, { desc }) => [desc(reports.createdAt)],
    limit,
  });
}
```

Export from index:

```typescript
// packages/db/src/index.ts
export * from './utils/my-util';
```

### Validators (`@homelab/validators`)

#### Creating a New Schema

```typescript
// packages/validators/src/my-schema.ts
import { z } from 'zod';

export const mySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().positive(),
  email: z.string().email().optional(),
});

export type MyData = z.infer<typeof mySchema>;
```

Export from index:

```typescript
// packages/validators/src/index.ts
export * from './my-schema';
```

Use in tRPC procedures:

```typescript
import { mySchema } from '@homelab/validators';

export const myRouter = t.router({
  create: t.procedure
    .input(mySchema)
    .mutation(async ({ input }) => {
      // input is fully typed as MyData!
    }),
});
```

### API Procedures (`@homelab/api`)

#### Creating a New Router

```typescript
// packages/api/src/router/my-router.ts
import { t } from '../trpc';
import { mySchema } from '@homelab/validators';
import { db } from '@homelab/db';

export const myRouter = t.router({
  list: t.procedure
    .query(async () => {
      return db.query.myTable.findMany();
    }),

  create: t.procedure
    .input(mySchema)
    .mutation(async ({ input }) => {
      return db.insert(myTable).values(input).returning();
    }),
});
```

Register in root router:

```typescript
// packages/api/src/index.ts
import { myRouter } from './router/my-router';

export const appRouter = t.router({
  // ... existing routers
  myRouter,
});

export type AppRouter = typeof appRouter;
```

Use in frontend:

```typescript
const { data } = trpc.myRouter.list.useQuery();
const create = trpc.myRouter.create.useMutation();
```

## Building and Testing

### Type Checking

```bash
# Check all packages
bun run type-check

# Check specific package
cd apps/claude-agent-web
bun run type-check
```

Fix type errors before committing!

### Linting

```bash
# Lint all packages
bun run lint

# Lint specific package
cd packages/ui
bun run lint

# Auto-fix
bun run lint --fix
```

### Building for Production

```bash
# Build all packages and apps
bun run build

# Build specific app
bun run build --filter=@homelab/claude-agent-web

# Clean and rebuild
bun run clean
bun run build
```

**Output locations**:
- Apps: `apps/*/.next/` (Next.js build)
- Packages: `packages/*/dist/` (TypeScript compiled)

## Database Development

### Drizzle Studio (GUI)

Explore database with visual interface:

```bash
cd packages/db
bun run db:studio
```

Opens: http://localhost:4983

**Features**:
- Browse tables and data
- Execute queries
- Edit records
- View relationships

### Creating Migrations

Workflow for schema changes:

1. **Edit schema**:
```typescript
// packages/db/src/schema/claude-agent.ts
export const projects = sqliteTable('projects', {
  // Add new column
  archived: integer('archived', { mode: 'boolean' }).default(false),
});
```

2. **Generate migration**:
```bash
cd packages/db
bun run db:generate
```

Prompts for migration name, creates `drizzle/0001_*.sql`.

3. **Review migration**:
```sql
-- drizzle/0001_add_archived_column.sql
ALTER TABLE projects ADD COLUMN archived integer DEFAULT 0;
```

4. **Apply migration**:
```bash
bun run db:migrate
```

5. **Verify**:
```bash
bun run db:studio
```

### Rolling Back Migrations

Drizzle doesn't support automatic rollback. Manual process:

1. Delete the migration file from `drizzle/`
2. Drop the column manually via SQL:
```bash
sqlite3 packages/db/data/claude.db
> ALTER TABLE projects DROP COLUMN archived;
```

**Best practice**: Test migrations in development before applying to production!

### Seeding Data

Create seed script:

```typescript
// packages/db/src/seed.ts
import { db } from './index';
import { projects } from './schema/claude-agent';

async function seed() {
  await db.insert(projects).values([
    { name: 'Project 1', path: '/tmp/proj1' },
    { name: 'Project 2', path: '/tmp/proj2' },
  ]);
}

seed();
```

Run seed:

```bash
cd packages/db
bun run src/seed.ts
```

## Frontend Development

### App Router Structure

Next.js 14 App Router layout:

```
apps/claude-agent-web/src/app/
├── layout.tsx          # Root layout (HTML, body)
├── page.tsx            # Home page (/)
├── projects/
│   ├── page.tsx        # Projects list (/projects)
│   └── [id]/
│       └── page.tsx    # Project detail (/projects/123)
└── api/
    └── trpc/
        └── [trpc]/
            └── route.ts  # tRPC endpoint
```

### Server Components vs Client Components

**Server Components** (default):
- Fetch data on server
- No interactivity (no `onClick`, `useState`)
- Better performance (smaller JS bundle)

```typescript
// app/projects/page.tsx
import { trpc } from '~/lib/trpc/server';

export default async function ProjectsPage() {
  const projects = await trpc.projects.list.query();

  return (
    <div>
      {projects.map(p => <div key={p.id}>{p.name}</div>)}
    </div>
  );
}
```

**Client Components** (`'use client'`):
- Interactive (hooks, event handlers)
- Run in browser
- Use React Query hooks

```typescript
'use client';
import { trpc } from '~/lib/trpc/client';

export function ProjectsList() {
  const { data, isLoading } = trpc.projects.list.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.map(p => <div key={p.id}>{p.name}</div>)}
    </div>
  );
}
```

### tRPC Client Setup

Each app has two tRPC clients:

**Server Client**:
```typescript
// lib/trpc/server.ts
import { appRouter } from '@homelab/api';

export const trpc = appRouter.createCaller({ db });
```

**Client-Side Client**:
```typescript
// lib/trpc/client.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@homelab/api';

export const trpc = createTRPCReact<AppRouter>();
```

### Adding a New Page

1. Create page file:
```typescript
// apps/claude-agent-web/src/app/settings/page.tsx
export default function SettingsPage() {
  return <div>Settings</div>;
}
```

2. Add navigation link:
```typescript
// apps/claude-agent-web/src/app/layout.tsx
<nav>
  <Link href="/settings">Settings</Link>
</nav>
```

3. Access: http://localhost:3002/settings

### Styling Pages

Use Tailwind utility classes:

```typescript
export default function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Title</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">Card 1</div>
        <div className="rounded-lg border p-4">Card 2</div>
      </div>
    </div>
  );
}
```

Import shared components:

```typescript
import { DataTable, StatsCard } from '@homelab/ui';
```

## Debugging

### Server-Side Debugging

Add console logs in server components or tRPC procedures:

```typescript
export const myRouter = t.router({
  list: t.procedure.query(async () => {
    console.log('[DEBUG] Fetching projects');
    const projects = await db.query.projects.findMany();
    console.log('[DEBUG] Found projects:', projects.length);
    return projects;
  }),
});
```

View logs in terminal running `bun run dev`.

### Client-Side Debugging

Use browser DevTools:

```typescript
'use client';
export function MyComponent() {
  const { data } = trpc.projects.list.useQuery();

  console.log('[DEBUG] Projects data:', data);

  return <div>...</div>;
}
```

View logs in browser console.

### Database Debugging

Enable query logging:

```typescript
// packages/db/src/index.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';

export const db = drizzle(sqlite, {
  schema,
  logger: true,  // Enable SQL query logging
});
```

All queries will log to console:

```
Query: SELECT * FROM projects WHERE id = ? [123]
```

### Network Debugging

Inspect tRPC requests in browser DevTools:

1. Open DevTools → Network tab
2. Filter by `trpc`
3. Click request to see:
   - Request payload
   - Response data
   - Timing

### React Query DevTools

Add React Query DevTools for debugging queries:

```typescript
// apps/*/src/app/layout.tsx
'use client';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ReactQueryDevtools />
      </body>
    </html>
  );
}
```

Shows:
- Active queries
- Cache state
- Query history
- Refetch controls

## Common Issues

### Issue: "Cannot find module '@homelab/ui'"

**Cause**: Packages not built yet

**Fix**:
```bash
bun run build
```

### Issue: "Port already in use"

**Cause**: Previous dev server still running

**Fix**:
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Kill process using port 3002
lsof -ti:3002 | xargs kill -9
```

### Issue: Database locked

**Cause**: Multiple processes accessing SQLite database

**Fix**:
```bash
# Close Drizzle Studio
# Stop all dev servers
# Restart dev server
bun run dev
```

### Issue: Type errors after schema change

**Cause**: TypeScript cache stale

**Fix**:
```bash
# Rebuild database package
cd packages/db
bun run build

# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: Tailwind classes not working

**Cause**: Tailwind not configured to scan package files

**Fix**:
```javascript
// apps/*/tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',  // Add this!
  ],
};
```

### Issue: Hot reload not working

**Cause**: File watcher limit exceeded

**Fix** (Linux/Mac):
```bash
# Increase file watcher limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## Performance Tips

### Fast Rebuilds

Turborepo caches build outputs. Use `--filter` to rebuild only what changed:

```bash
# Only rebuild Claude Agent
bun run build --filter=@homelab/claude-agent-web...

# The "..." means "include dependencies"
```

### Fast Package Iteration

When developing a package, use watch mode:

```bash
cd packages/ui
bun run build --watch
```

Changes rebuild automatically, apps pick them up instantly.

### Fast Database Queries

Always use indexes on frequently queried columns:

```typescript
export const reports = sqliteTable('reports', {
  // columns...
}, (table) => ({
  workflowIdx: index('idx_workflow').on(table.workflow_name),
}));
```

### Fast Frontend Development

Use React Server Components by default (faster initial load):

```typescript
// ✅ Server Component (default)
export default async function Page() {
  const data = await trpc.projects.list.query();
  return <div>{data.map(...)}</div>;
}

// ⚠️ Client Component (only when needed)
'use client';
export function InteractivePage() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

## Docker Development

### Building Docker Images Locally

```bash
# Claude Agent
docker build -f docker/claude.Dockerfile -t homelab/claude-agent .

# Playwright Server
docker build -f docker/playwright.Dockerfile -t homelab/playwright-server .
```

### Testing Docker Images

```bash
# Run locally
docker run -p 3002:3002 \
  -v $(pwd)/data:/app/db \
  homelab/claude-agent

# Access: http://localhost:3002
```

### Debugging Docker Builds

```bash
# Show build logs
docker build -f docker/claude.Dockerfile . --progress=plain

# Disable cache
docker build -f docker/claude.Dockerfile . --no-cache

# Build specific stage
docker build -f docker/claude.Dockerfile . --target builder
```

### Inspecting Containers

```bash
# List running containers
docker ps

# View logs
docker logs <container-id>

# Execute shell in container
docker exec -it <container-id> sh

# Inspect filesystem
docker exec <container-id> ls -la /app
```

## Environment Variables

### Development Environment

Create `.env.local` files in each app (not committed):

```bash
# apps/claude-agent-web/.env.local
PORT=3002
DB_PATH=../../packages/db/data/claude.db
NODE_ENV=development
```

Load in Next.js automatically.

### Production Environment

Set environment variables in Docker Compose:

```yaml
# homelab/compose/claude-agent-server.yml
services:
  claude-agent-web:
    environment:
      - PORT=3002
      - DB_PATH=/app/db/claude.db
      - NODE_ENV=production
```

Access in code:

```typescript
const dbPath = process.env.DB_PATH || './data/claude.db';
```

## Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `dev` - Development branch (auto-deploys to homelab)
- `feature/*` - Feature branches

### Commit Messages

Follow conventional commits:

```bash
git commit -m "feat(api): add projects router"
git commit -m "fix(ui): resolve DataTable sorting bug"
git commit -m "docs: update development guide"
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Process

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit
3. Push: `git push origin feature/my-feature`
4. Open PR to `dev` branch
5. Address review feedback
6. Merge when approved

## VS Code Setup

### Recommended Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "mads-hartmann.bash-ide-vscode",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Workspace Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "eslint.workingDirectories": [
    { "pattern": "apps/*/" },
    { "pattern": "packages/*/" }
  ]
}
```

### Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Claude Agent",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/apps/claude-agent-web"
    }
  ]
}
```

## Next Steps

- Read [Architecture Guide](./architecture.md) for system design details
- Read [Contributing Guide](./contributing.md) for code standards
- Read [Deployment Guide](./deployment.md) for production builds
- Explore [Package Documentation](./packages/) for API details

## Getting Help

- Check [Troubleshooting](#common-issues) section
- Review [Architecture Guide](./architecture.md) for design decisions
- Search existing GitHub issues
- Ask in project discussions

## Related Documentation

- [Architecture Guide](./architecture.md)
- [Contributing Guide](./contributing.md)
- [Deployment Guide](./deployment.md)
- [Package Documentation](./packages/)
- [Main CLAUDE.md](../../CLAUDE.md)
