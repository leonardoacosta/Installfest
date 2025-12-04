# Contributing Guide

Guidelines for contributing to the homelab-services monorepo.

## Code of Conduct

This is a personal homelab project, but contributions are welcome. Be respectful, constructive, and follow established patterns.

## Getting Started

1. Read [Architecture Guide](./architecture.md) to understand system design
2. Follow [Development Guide](./development.md) for local setup
3. Review this guide for contribution standards
4. Look for issues tagged `good-first-issue` or `help-wanted`

## Development Process

### 1. Fork and Clone

```bash
# Fork repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/homelab-services.git
cd homelab-services

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/homelab-services.git
```

### 2. Create Feature Branch

```bash
# Update from upstream
git checkout dev
git pull upstream dev

# Create feature branch
git checkout -b feature/descriptive-name

# Examples:
# feature/add-reports-filter
# fix/duplicate-session-bug
# docs/update-api-guide
```

### 3. Make Changes

Follow the code standards in this document.

### 4. Test Your Changes

```bash
# Type check
bun run type-check

# Lint
bun run lint

# Build
bun run build

# Manual testing
bun run dev
```

### 5. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat(api): add filter to reports router"
git commit -m "fix(ui): resolve DataTable sorting issue"
git commit -m "docs: update contributing guide"
```

### 6. Push and Create Pull Request

```bash
git push origin feature/descriptive-name
```

Open PR on GitHub targeting `dev` branch.

## Commit Message Format

### Structure

```
<type>(<scope>): <subject>

<body (optional)>

<footer (optional)>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons)
- **refactor**: Code restructuring without behavior change
- **perf**: Performance improvements
- **test**: Adding or fixing tests
- **chore**: Build process, tooling, dependencies

### Scopes

- **api**: tRPC procedures and routers
- **ui**: Shared UI components
- **db**: Database schemas and utilities
- **validators**: Zod validation schemas
- **claude-agent**: Claude agent app
- **playwright**: Playwright server app
- **docker**: Docker configuration
- **ci**: CI/CD workflows

### Examples

```bash
# Feature
git commit -m "feat(api): add pagination to hooks router"

# Bug fix
git commit -m "fix(ui): DataTable sorting now respects nulls"

# Documentation
git commit -m "docs: add deployment guide"

# Refactor
git commit -m "refactor(db): extract pagination utilities"

# Breaking change
git commit -m "feat(api)!: change reports list response format

BREAKING CHANGE: reports.list now returns paginated result"
```

## Code Standards

### TypeScript

#### Strict Type Safety

```typescript
// ✅ Good: Explicit types
export function createReport(data: NewReport): Promise<Report> {
  return db.insert(reports).values(data).returning();
}

// ❌ Bad: Implicit any
export function createReport(data) {
  return db.insert(reports).values(data).returning();
}
```

#### No Type Assertions Unless Necessary

```typescript
// ✅ Good: Type guard
if (isReport(data)) {
  return data.workflow_name;
}

// ❌ Bad: Unsafe assertion
return (data as Report).workflow_name;
```

#### Use Zod for Runtime Validation

```typescript
// ✅ Good: Runtime + compile-time types
const reportSchema = z.object({
  workflow: z.string(),
  status: z.enum(['passed', 'failed']),
});
type Report = z.infer<typeof reportSchema>;

// ❌ Bad: Only compile-time types
type Report = {
  workflow: string;
  status: 'passed' | 'failed';
};
```

### React Components

#### Prefer Server Components

```typescript
// ✅ Good: Server Component (default)
export default async function ReportsPage() {
  const reports = await trpc.reports.list.query();
  return <div>{reports.map(...)}</div>;
}

// ⚠️ Use Client Components only when needed
'use client';
export function InteractiveTable() {
  const [sort, setSort] = useState('asc');
  // Interactive logic here
}
```

#### Component Props Interface

```typescript
// ✅ Good: Explicit interface
interface ReportCardProps {
  report: Report;
  onSelect?: (id: number) => void;
}

export function ReportCard({ report, onSelect }: ReportCardProps) {
  // ...
}

// ❌ Bad: Inline types
export function ReportCard({ report, onSelect }: {
  report: Report;
  onSelect?: (id: number) => void;
}) {
  // ...
}
```

#### Export Components and Types

```typescript
// ✅ Good: Export both
export interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  return <div>{title}</div>;
}

// Usage in other files:
import { MyComponent, type MyComponentProps } from './my-component';
```

### Styling

#### Tailwind Class Order

Use consistent ordering (via Prettier plugin):

```typescript
// Recommended order: layout → spacing → typography → colors → effects
<div className="flex items-center gap-4 px-4 py-2 text-lg font-semibold text-white bg-blue-500 rounded-lg shadow-md">
  Content
</div>
```

#### Avoid Inline Styles

```typescript
// ✅ Good: Tailwind classes
<div className="text-red-500">Error</div>

// ❌ Bad: Inline styles
<div style={{ color: 'red' }}>Error</div>
```

#### Extract Repeated Patterns

```typescript
// If same classes used >3 times, create component
const cardClasses = "rounded-lg border bg-white p-4 shadow-sm";

export function Card({ children }: { children: React.ReactNode }) {
  return <div className={cardClasses}>{children}</div>;
}
```

### Database

#### Use Drizzle Query Builder

```typescript
// ✅ Good: Type-safe query builder
const reports = await db
  .select()
  .from(schema.reports)
  .where(eq(schema.reports.status, 'failed'))
  .orderBy(desc(schema.reports.created_at));

// ❌ Bad: Raw SQL (lose type safety)
const reports = await db.execute(
  sql`SELECT * FROM reports WHERE status = 'failed' ORDER BY created_at DESC`
);
```

#### Always Use Transactions for Multi-Step Operations

```typescript
// ✅ Good: Wrapped in transaction
await withTransaction(db, async (tx) => {
  await tx.insert(projects).values(projectData);
  await tx.insert(sessions).values(sessionData);
});

// ❌ Bad: Separate operations (can leave inconsistent state)
await db.insert(projects).values(projectData);
await db.insert(sessions).values(sessionData);
```

#### Index Frequently Queried Columns

```typescript
export const reports = sqliteTable('reports', {
  // columns...
}, (table) => ({
  // Add indexes for filters and sorts
  workflowIdx: index('idx_workflow').on(table.workflow_name),
  statusIdx: index('idx_status').on(table.status),
  createdIdx: index('idx_created').on(table.created_at),
}));
```

### API Design

#### Use Zod Schemas for Input Validation

```typescript
// ✅ Good: Zod schema
const createReportSchema = z.object({
  workflow: z.string().min(1),
  status: z.enum(['passed', 'failed']),
});

export const reportsRouter = t.router({
  create: t.procedure
    .input(createReportSchema)
    .mutation(async ({ input }) => {
      // input is fully typed!
    }),
});
```

#### Return Consistent Response Shapes

```typescript
// ✅ Good: Paginated result
return createPaginatedResult(reports, offset, limit);
// Returns: { items: Report[], pagination: { ... } }

// ❌ Bad: Inconsistent return
return reports; // Just array, no pagination metadata
```

#### Use TRPCError for Error Handling

```typescript
// ✅ Good: Structured error
if (!project) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: `Project with id ${id} not found`,
  });
}

// ❌ Bad: Generic error
throw new Error('Project not found');
```

## File Structure Conventions

### Naming Conventions

- **Components**: PascalCase (`DataTable.tsx`, `ReportCard.tsx`)
- **Utilities**: camelCase (`pagination.ts`, `date-utils.ts`)
- **Types/Interfaces**: PascalCase (`Report.ts`, `PaginationOptions.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `DEFAULT_LIMIT`)

### File Organization

```
packages/ui/src/
├── components/
│   ├── DataTable.tsx
│   ├── StatsCard.tsx
│   └── index.ts         # Re-export all components
├── hooks/
│   ├── useDebounce.ts
│   └── index.ts
├── utils/
│   ├── date-utils.ts
│   └── index.ts
└── index.ts             # Main package export
```

### Barrel Exports

Use `index.ts` files to re-export:

```typescript
// packages/ui/src/components/index.ts
export { DataTable } from './DataTable';
export { StatsCard } from './StatsCard';
export { DateRangePicker } from './DateRangePicker';

// packages/ui/src/index.ts
export * from './components';
export * from './hooks';
export * from './utils';

// Usage in apps:
import { DataTable, useDebounce, formatDate } from '@homelab/ui';
```

## Testing Guidelines

### Unit Tests

Test shared utilities and functions:

```typescript
// packages/db/src/utils/pagination.test.ts
import { describe, test, expect } from 'bun:test';
import { createPaginatedResult } from './pagination';

describe('createPaginatedResult', () => {
  test('creates correct pagination metadata', () => {
    const items = [1, 2, 3];
    const result = createPaginatedResult(items, 0, 10);

    expect(result.items).toEqual([1, 2, 3]);
    expect(result.pagination.offset).toBe(0);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.hasMore).toBe(false);
  });

  test('detects has more when limit reached', () => {
    const items = Array(10).fill(1);
    const result = createPaginatedResult(items, 0, 10);

    expect(result.pagination.hasMore).toBe(true);
  });
});
```

### Integration Tests

Test tRPC procedures:

```typescript
// packages/api/src/router/reports.test.ts
import { describe, test, expect, beforeEach } from 'bun:test';
import { appRouter } from '../index';
import { createTestContext } from '../test-utils';

describe('reports router', () => {
  let testContext;

  beforeEach(() => {
    testContext = createTestContext();
  });

  test('lists reports with filters', async () => {
    const caller = appRouter.createCaller(testContext);

    const result = await caller.reports.list({
      workflow: 'test',
      limit: 10,
    });

    expect(result.items).toBeDefined();
    expect(result.pagination.limit).toBe(10);
  });
});
```

### E2E Tests

Test complete user flows (future):

```typescript
// apps/playwright-server/e2e/reports.spec.ts
import { test, expect } from '@playwright/test';

test('user can filter reports', async ({ page }) => {
  await page.goto('/reports');
  await page.fill('[data-testid="workflow-filter"]', 'test');
  await page.click('[data-testid="apply-filter"]');

  await expect(page.locator('[data-testid="report-row"]')).toHaveCount(5);
});
```

### Test Coverage Goals

- **Utilities**: 80%+ coverage
- **API Procedures**: 70%+ coverage
- **UI Components**: Test critical interactions
- **E2E**: Cover main user flows

## Documentation Standards

### Code Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// Use withTransaction to ensure both inserts succeed or fail together
await withTransaction(db, async (tx) => {
  await tx.insert(projects).values(projectData);
  await tx.insert(sessions).values(sessionData);
});

// ❌ Bad: Obvious comment
// Insert project data
await db.insert(projects).values(projectData);
```

### JSDoc for Public APIs

```typescript
/**
 * Creates a paginated result wrapper for list responses.
 *
 * @param items - Array of items to paginate
 * @param offset - Current offset (for calculating hasMore)
 * @param limit - Items per page
 * @param total - Optional total count (if known)
 * @returns Paginated result with metadata
 *
 * @example
 * const result = createPaginatedResult(reports, 0, 20);
 * console.log(result.pagination.hasMore); // true if 20+ items
 */
export function createPaginatedResult<T>(
  items: T[],
  offset: number,
  limit: number,
  total?: number
) {
  // ...
}
```

### README for Packages

Every package should have a README:

```markdown
# @homelab/ui

Shared React components with Tailwind CSS.

## Components

- **DataTable** - Sortable/filterable table
- **StatsCard** - Metric display card
- **DateRangePicker** - Date range selector

## Usage

\`\`\`typescript
import { DataTable } from '@homelab/ui';

<DataTable
  columns={[{ key: 'name', label: 'Name' }]}
  data={items}
/>
\`\`\`
```

## Pull Request Guidelines

### PR Title Format

Follow commit message format:

```
feat(api): add reports filtering endpoint
fix(ui): resolve DataTable column sorting bug
docs: update contributing guide
```

### PR Description Template

```markdown
## Summary

Brief description of changes.

## Changes

- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing

- [ ] Type check passes
- [ ] Linting passes
- [ ] Manual testing completed
- [ ] Tests added/updated (if applicable)

## Screenshots (if UI changes)

[Attach screenshots]

## Related Issues

Closes #123
```

### PR Checklist

Before submitting:

- [ ] Branch is up-to-date with `dev`
- [ ] Code follows style guidelines
- [ ] Types are explicit (no `any`)
- [ ] Tests pass (if applicable)
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No console.log statements left in code
- [ ] No commented-out code

### Review Process

1. Automated checks run (type check, lint)
2. Maintainer reviews code
3. Address feedback with new commits (don't force push)
4. Maintainer approves and merges

## Code Review Guidelines

### As a Reviewer

**Look for**:
- Type safety (no `any`, proper types)
- Error handling (try/catch, TRPCError)
- Performance (indexes, pagination, caching)
- Security (input validation, SQL injection prevention)
- Consistency with existing code

**Provide**:
- Constructive feedback
- Specific suggestions
- Code examples when helpful
- Approval when ready

### As a Contributor

**Responding to feedback**:
- Be open to suggestions
- Ask questions if unclear
- Make requested changes promptly
- Thank reviewers

**Making changes**:
- Address all comments
- Add new commits (don't force push during review)
- Re-request review when ready

## Monorepo Conventions

### Package Dependencies

- Apps can depend on packages
- Packages can depend on other packages
- Avoid circular dependencies

**Dependency graph**:
```
apps/claude-agent-web
  → @homelab/api
    → @homelab/db
      → @homelab/validators
  → @homelab/ui

apps/playwright-server
  → @homelab/api
    → @homelab/db
      → @homelab/validators
  → @homelab/ui
```

### Shared Code Guidelines

**When to create a shared package**:
- Code used by 2+ apps
- Reusable across projects
- Well-defined API

**When to keep code in app**:
- App-specific logic
- Not reusable elsewhere
- Experimental/unstable

### Versioning

Internal packages use `workspace:*` versioning:

```json
{
  "dependencies": {
    "@homelab/ui": "workspace:*"
  }
}
```

No need to publish to npm or manage versions.

## Performance Considerations

### Database

- Use indexes on filtered/sorted columns
- Paginate large result sets
- Use transactions for multi-step operations
- Avoid N+1 queries (use joins)

### API

- Return only needed data (avoid over-fetching)
- Use pagination for lists
- Cache frequently accessed data (future: Redis)
- Optimize tRPC procedures (batch queries)

### Frontend

- Use Server Components by default
- Client Components only when interactive
- Lazy load heavy components
- Optimize images with Next.js Image

## Security Guidelines

### Input Validation

Always validate user input:

```typescript
// ✅ Good: Zod validation
const schema = z.object({
  workflow: z.string().min(1).max(100),
  limit: z.number().min(1).max(100),
});

// ❌ Bad: No validation
const workflow = req.query.workflow;
```

### SQL Injection Prevention

Use Drizzle ORM (parameterized queries):

```typescript
// ✅ Good: Parameterized
await db.select()
  .from(reports)
  .where(eq(reports.workflow_name, userInput));

// ❌ Dangerous: String interpolation
await db.execute(
  sql`SELECT * FROM reports WHERE workflow_name = '${userInput}'`
);
```

### Environment Variables

Never commit secrets:

```bash
# ✅ Good: .env.local (gitignored)
API_KEY=secret123

# ❌ Bad: Hardcoded
const apiKey = 'secret123';
```

### CORS Configuration

Restrict API origins:

```typescript
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
};
```

## Issue Reporting

### Bug Reports

Include:
- Description of bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, browser, version)
- Screenshots/logs if applicable

### Feature Requests

Include:
- Use case / problem to solve
- Proposed solution
- Alternatives considered
- Willing to implement? (yes/no)

### Questions

- Check documentation first
- Search existing issues
- Provide context in question
- Show what you've tried

## Release Process

Releases are automated via CI/CD:

1. Merge PR to `dev` branch
2. GitHub Actions builds Docker images
3. Images deployed to homelab server
4. Health checks verify deployment
5. Rollback on failure

Manual release steps:

```bash
# Tag release
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# Build images
docker build -f docker/claude.Dockerfile -t homelab/claude-agent:v1.2.3 .
docker build -f docker/playwright.Dockerfile -t homelab/playwright-server:v1.2.3 .

# Push to registry (if using)
docker push homelab/claude-agent:v1.2.3
docker push homelab/playwright-server:v1.2.3
```

## Questions?

- Read [Architecture Guide](./architecture.md)
- Read [Development Guide](./development.md)
- Check [existing issues](https://github.com/OWNER/REPO/issues)
- Open a discussion

## Related Documentation

- [Architecture Guide](./architecture.md)
- [Development Guide](./development.md)
- [Deployment Guide](./deployment.md)
- [Package Documentation](./packages/)
- [Main CLAUDE.md](../../CLAUDE.md)
