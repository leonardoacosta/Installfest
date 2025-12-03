# Shared Packages

Internal workspace packages shared across homelab applications.

## @homelab/ui

**Purpose**: Shared React UI components for consistent UX across dashboards.

### Components

#### DataTable

Generic sortable/filterable table component.

```typescript
import { DataTable } from '@homelab/ui';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
];

<DataTable data={items} columns={columns} />
```

**Props**:
- `data: T[]` - Array of data objects
- `columns: Array<{ key: keyof T; label: string }>` - Column definitions

#### DateRangePicker

Date range selection component with validation.

```typescript
import { DateRangePicker } from '@homelab/ui';

<DateRangePicker
  from={startDate}
  to={endDate}
  onChange={(from, to) => setRange({ from, to })}
/>
```

**Props**:
- `from?: Date` - Start date
- `to?: Date` - End date
- `onChange: (from?: Date, to?: Date) => void` - Change handler

#### StatsCard

Metric display card with title and value.

```typescript
import { StatsCard } from '@homelab/ui';

<StatsCard
  title="Total Tests"
  value={1234}
  description="Last 7 days"
/>
```

**Props**:
- `title: string` - Card title
- `value: string | number` - Metric value
- `description?: string` - Optional description

#### Layout

Common page layout wrapper.

```typescript
import { Layout } from '@homelab/ui';

<Layout title="Dashboard">
  {children}
</Layout>
```

**Props**:
- `children: ReactNode` - Page content
- `title?: string` - Page title

#### SearchInput

Debounced search input component.

```typescript
import { SearchInput } from '@homelab/ui';

<SearchInput
  value={query}
  onChange={setQuery}
  placeholder="Search..."
  debounce={300}
/>
```

**Props**:
- `value?: string` - Current search value
- `onChange: (value: string) => void` - Change handler
- `placeholder?: string` - Placeholder text
- `debounce?: number` - Debounce delay in ms (default: 300)

---

## @homelab/db

**Purpose**: Database utilities for SQLite with Drizzle ORM.

### Connection Management

```typescript
import { createDb, getDb } from '@homelab/db';

// Initialize database
const db = createDb('/path/to/database.db');

// Get existing instance
const db = getDb();
```

**Functions**:
- `createDb(dbPath: string): Db` - Create/get database instance
- `getDb(): Db` - Get existing database instance

**Features**:
- Singleton pattern (single instance per process)
- WAL mode enabled
- Foreign keys enabled

### Pagination

Helper functions for paginated queries.

```typescript
import {
  getPaginationOffset,
  createPaginatedResult,
  applyPagination
} from '@homelab/db';

// Calculate offset
const offset = getPaginationOffset(page, limit); // (page - 1) * limit

// Wrap results with metadata
const result = createPaginatedResult(data, page, limit, total);
// Returns: { data, pagination: { page, limit, total, totalPages } }

// Apply pagination to SQL query
const paginatedQuery = applyPagination(query, page, limit);
```

**Types**:
```typescript
interface PaginationParams {
  page: number;
  limit: number;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### Transactions

Transaction management utilities.

```typescript
import {
  withTransaction,
  batchTransaction,
  retryTransaction
} from '@homelab/db';

// Single transaction
await withTransaction(db, async (tx) => {
  await tx.insert(users).values({ name: 'John' });
  await tx.insert(posts).values({ userId: 1, title: 'Hello' });
});

// Batch operations
const results = await batchTransaction(db, [
  (tx) => tx.insert(users).values({ name: 'Alice' }),
  (tx) => tx.insert(users).values({ name: 'Bob' }),
]);

// Retry on failure
await retryTransaction(db, async (tx) => {
  // Operation that might fail
}, 3, 100); // 3 retries, 100ms delay
```

---

## @homelab/validators

**Purpose**: Zod validation schemas for type-safe API contracts.

### Common Schemas

```typescript
import {
  paginationSchema,
  sortSchema,
  searchSchema,
  listQuerySchema
} from '@homelab/validators';

// Pagination
const input = paginationSchema.parse({ page: 1, limit: 20 });
type PaginationInput = z.infer<typeof paginationSchema>;

// Sorting
const sort = sortSchema.parse({ sortBy: 'name', sortOrder: 'asc' });
type SortInput = z.infer<typeof sortSchema>;

// Search
const search = searchSchema.parse({ query: 'test' });
type SearchInput = z.infer<typeof searchSchema>;

// Combined
const listQuery = listQuerySchema.parse({
  page: 1,
  limit: 20,
  sortBy: 'created',
  sortOrder: 'desc',
  query: 'search term'
});
type ListQueryInput = z.infer<typeof listQuerySchema>;
```

### Date Range Schemas

```typescript
import { dateRangeSchema, validatedDateRangeSchema } from '@homelab/validators';

// Basic date range
const range = dateRangeSchema.parse({
  from: '2024-01-01T00:00:00Z',
  to: '2024-12-31T23:59:59Z'
});

// With validation (from <= to)
const validatedRange = validatedDateRangeSchema.parse({
  from: '2024-01-01T00:00:00Z',
  to: '2024-12-31T23:59:59Z'
});
```

### Report Schemas

```typescript
import {
  reportFilterSchema,
  createReportSchema,
  reportSchema
} from '@homelab/validators';

// Filter reports
const filters = reportFilterSchema.parse({
  page: 1,
  limit: 20,
  workflow: 'test-suite',
  status: 'passed',
  from: '2024-01-01T00:00:00Z',
  to: '2024-12-31T23:59:59Z'
});

// Create report
const newReport = createReportSchema.parse({
  workflowName: 'test-suite',
  runNumber: 123,
  hash: 'abc123',
  filePath: '/reports/test-suite/123/index.html',
  totalTests: 100,
  passed: 95,
  failed: 5,
  skipped: 0,
  status: 'failed'
});

// Report response
type Report = z.infer<typeof reportSchema>;
// Includes: id, createdAt, and all fields from createReportSchema
```

---

## Adding New Packages

To add a new shared package:

1. Create package directory:
```bash
mkdir -p packages/my-package/src
```

2. Create `package.json`:
```json
{
  "name": "@homelab/my-package",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

3. Create `tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

4. Create source files in `src/`

5. Add to workspace and build:
```bash
bun install
bun run build
```

## Package Development

### Building

```bash
# Build all packages
bun run build

# Build specific package
bun run build --filter=@homelab/ui

# Watch mode
bun run dev --filter=@homelab/ui
```

### Type Checking

```bash
# Check all packages
bun run type-check

# Check specific package
cd packages/ui && bun run type-check
```

### Best Practices

- **Keep packages generic**: No app-specific logic
- **Export everything**: Use index.ts for clean exports
- **Type everything**: Leverage TypeScript fully
- **Document exports**: JSDoc comments for better DX
- **Test utilities**: Unit tests for complex functions
- **Semantic versioning**: Update version on breaking changes
