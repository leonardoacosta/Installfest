# @homelab/db

Database utilities and Drizzle ORM schemas for SQLite databases.

## Overview

The database package provides type-safe database access, schema definitions, and utility functions for working with SQLite databases across homelab services.

**Features**:
- Drizzle ORM for type-safe queries
- SQLite database engine (better-sqlite3)
- Automatic migrations
- Transaction utilities
- Pagination helpers
- Connection management

## Installation

Already included as workspace dependency:

```json
{
  "dependencies": {
    "@homelab/db": "workspace:*"
  }
}
```

## Database Connection

### Creating a Connection

```typescript
import { createDb, getDb } from '@homelab/db';

// Create new connection
const db = createDb({
  path: '/path/to/database.db',
  schema: yourSchema  // Optional
});

// Get existing connection (singleton)
const db = getDb();
```

### Configuration

```typescript
interface CreateDbOptions {
  path: string;              // Database file path
  schema?: object;           // Drizzle schema object
  logger?: boolean;          // Enable SQL query logging
  readonly?: boolean;        // Read-only mode
}
```

Example:

```typescript
const db = createDb({
  path: process.env.DB_PATH || './data/app.db',
  schema: * as schema,
  logger: process.env.NODE_ENV === 'development'
});
```

---

## Schemas

### Schema Structure

Schemas are defined per application:

```
packages/db/src/schema/
├── claude-agent.ts      # Claude Agent tables
├── playwright.ts        # Playwright Server tables
└── index.ts             # Re-exports
```

### Defining Tables

```typescript
import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const reports = sqliteTable('reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workflow_name: text('workflow_name').notNull(),
  status: text('status', { enum: ['passed', 'failed', 'flaky'] })
    .default('passed')
    .notNull(),
  total_tests: integer('total_tests').default(0).notNull(),
  created_at: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  // Indexes for performance
  workflowIdx: index('idx_workflow').on(table.workflow_name),
  statusIdx: index('idx_status').on(table.status),
  createdIdx: index('idx_created').on(table.created_at),
}));
```

### Type Inference

Drizzle automatically generates TypeScript types:

```typescript
// Infer select type (returned from queries)
type Report = typeof reports.$inferSelect;

// Infer insert type (for creating records)
type NewReport = typeof reports.$inferInsert;

// Use in functions
function createReport(data: NewReport): Promise<Report> {
  return db.insert(reports).values(data).returning();
}
```

### Relationships

Define foreign keys with cascade behavior:

```typescript
export const testFailures = sqliteTable('test_failures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  report_id: integer('report_id')
    .notNull()
    .references(() => reports.id, { onDelete: 'cascade' }),
  test_name: text('test_name').notNull(),
  error: text('error'),
});

// When a report is deleted, all associated test failures are deleted too
```

---

## Querying

### Basic Queries

```typescript
import { db } from '@homelab/db';
import { reports } from '@homelab/db/schema/playwright';
import { eq, desc, and } from 'drizzle-orm';

// Select all
const allReports = await db.select().from(reports);

// Select with conditions
const failedReports = await db.select()
  .from(reports)
  .where(eq(reports.status, 'failed'));

// Select with multiple conditions
const recentFailed = await db.select()
  .from(reports)
  .where(and(
    eq(reports.status, 'failed'),
    eq(reports.workflow_name, 'test')
  ))
  .orderBy(desc(reports.created_at))
  .limit(10);
```

### Query Builder API

```typescript
// Select specific columns
const names = await db.select({
  id: reports.id,
  name: reports.workflow_name
}).from(reports);

// Join tables
const reportsWithFailures = await db.select()
  .from(reports)
  .leftJoin(testFailures, eq(reports.id, testFailures.report_id))
  .where(eq(reports.status, 'failed'));

// Aggregate functions
const stats = await db.select({
  workflow: reports.workflow_name,
  total: count(),
  failed: sum(reports.total_tests)
}).from(reports)
  .groupBy(reports.workflow_name);
```

### Relational Queries

Using Drizzle's relational query API:

```typescript
// Define relations in schema
import { relations } from 'drizzle-orm';

export const reportsRelations = relations(reports, ({ many }) => ({
  failures: many(testFailures),
}));

export const testFailuresRelations = relations(testFailures, ({ one }) => ({
  report: one(reports, {
    fields: [testFailures.report_id],
    references: [reports.id],
  }),
}));

// Query with relations
const reportWithFailures = await db.query.reports.findFirst({
  where: eq(reports.id, 123),
  with: {
    failures: true  // Automatically includes related test failures
  }
});
```

---

## Mutations

### Insert

```typescript
// Insert single record
const result = await db.insert(reports).values({
  workflow_name: 'test',
  status: 'passed',
  total_tests: 10
}).returning();

// Insert multiple records
await db.insert(reports).values([
  { workflow_name: 'test1', status: 'passed' },
  { workflow_name: 'test2', status: 'failed' }
]);
```

### Update

```typescript
// Update with condition
await db.update(reports)
  .set({ status: 'flaky' })
  .where(eq(reports.id, 123));

// Update multiple fields
await db.update(reports)
  .set({
    status: 'passed',
    total_tests: 15,
    updated_at: new Date()
  })
  .where(eq(reports.workflow_name, 'test'));
```

### Delete

```typescript
// Delete with condition
await db.delete(reports)
  .where(eq(reports.id, 123));

// Delete all matching
await db.delete(reports)
  .where(eq(reports.status, 'failed'));
```

---

## Transactions

### Basic Transactions

```typescript
import { withTransaction } from '@homelab/db';

await withTransaction(db, async (tx) => {
  // Both operations succeed or both fail
  const [report] = await tx.insert(reports).values({
    workflow_name: 'test',
    status: 'failed'
  }).returning();

  await tx.insert(testFailures).values({
    report_id: report.id,
    test_name: 'should work',
    error: 'Expected true, got false'
  });
});
```

### Batch Transactions

```typescript
import { batchTransaction } from '@homelab/db';

await batchTransaction(db, [
  db.insert(reports).values({ workflow_name: 'test1' }),
  db.insert(reports).values({ workflow_name: 'test2' }),
  db.insert(reports).values({ workflow_name: 'test3' })
]);
```

### Retry Transactions

For handling database locking:

```typescript
import { retryTransaction } from '@homelab/db';

await retryTransaction(
  db,
  async (tx) => {
    // Operation that might conflict
    await tx.update(reports)
      .set({ status: 'passed' })
      .where(eq(reports.id, 123));
  },
  {
    maxRetries: 3,
    delayMs: 100
  }
);
```

---

## Pagination

### Offset-Based Pagination

```typescript
import { createPaginatedResult, getPaginationOffset } from '@homelab/db';

async function listReports(page: number = 1, limit: number = 20) {
  const offset = getPaginationOffset(page, limit);

  const reports = await db.select()
    .from(schema.reports)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(schema.reports.created_at));

  return createPaginatedResult(reports, offset, limit);
}

// Returns:
// {
//   items: Report[],
//   pagination: {
//     offset: 0,
//     limit: 20,
//     total: 100,  // Optional
//     hasMore: true
//   }
// }
```

### Cursor-Based Pagination

```typescript
async function listReportsCursor(cursor?: number, limit: number = 20) {
  const reports = await db.select()
    .from(schema.reports)
    .where(cursor ? lt(schema.reports.id, cursor) : undefined)
    .orderBy(desc(schema.reports.id))
    .limit(limit + 1);  // Fetch one extra to check hasMore

  const hasMore = reports.length > limit;
  const items = hasMore ? reports.slice(0, limit) : reports;
  const nextCursor = hasMore ? items[items.length - 1].id : undefined;

  return { items, nextCursor, hasMore };
}
```

---

## Migrations

### Generating Migrations

After modifying schema, generate migration:

```bash
cd packages/db
bun run db:generate
```

Prompts for migration name, creates SQL file in `drizzle/`.

### Migration Files

```sql
-- drizzle/0001_add_status_column.sql
ALTER TABLE reports ADD COLUMN status TEXT DEFAULT 'passed' NOT NULL;
CREATE INDEX idx_status ON reports(status);
```

### Applying Migrations

```bash
bun run db:migrate
```

Applies all pending migrations to the database.

### Migration Strategies

**Development**:
- Iterate quickly with `db:generate` and `db:migrate`
- Drop database and recreate if needed
- Test migrations before applying to production

**Production**:
- Run migrations during deployment
- Backup database before migrations
- Test migrations on staging first
- Consider down migrations for rollback

---

## Utilities

### Connection Management

```typescript
// Singleton pattern
let dbInstance: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = createDb({
      path: process.env.DB_PATH || './data/app.db',
      schema: * as schema
    });
  }
  return dbInstance;
}

// Close connection
export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
```

### Query Logging

Enable SQL query logging:

```typescript
const db = createDb({
  path: './data/app.db',
  schema,
  logger: true  // Logs all SQL queries to console
});

// Example output:
// Query: SELECT * FROM reports WHERE status = ? ['failed']
```

### Database Health Check

```typescript
export async function checkDbHealth(db) {
  try {
    await db.execute(sql`SELECT 1`);
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}
```

---

## Best Practices

### Use Indexes

Add indexes to frequently queried columns:

```typescript
export const reports = sqliteTable('reports', {
  // columns...
}, (table) => ({
  // Index for WHERE status = ?
  statusIdx: index('idx_status').on(table.status),

  // Composite index for WHERE workflow = ? ORDER BY created_at
  workflowCreatedIdx: index('idx_workflow_created')
    .on(table.workflow_name, table.created_at),
}));
```

### Avoid N+1 Queries

```typescript
// ❌ Bad: N+1 queries
const reports = await db.select().from(reports);
for (const report of reports) {
  const failures = await db.select()
    .from(testFailures)
    .where(eq(testFailures.report_id, report.id));
}

// ✅ Good: Single join query
const reportsWithFailures = await db.select()
  .from(reports)
  .leftJoin(testFailures, eq(reports.id, testFailures.report_id));
```

### Use Transactions

For multi-step operations:

```typescript
// ✅ Good: Atomic operation
await withTransaction(db, async (tx) => {
  await tx.delete(testFailures).where(eq(testFailures.report_id, id));
  await tx.delete(reports).where(eq(reports.id, id));
});

// ❌ Bad: Can leave inconsistent state
await db.delete(testFailures).where(eq(testFailures.report_id, id));
await db.delete(reports).where(eq(reports.id, id));  // If this fails, failures still exist
```

### Prevent SQL Injection

Drizzle uses parameterized queries (safe by default):

```typescript
// ✅ Safe: Parameterized query
await db.select()
  .from(reports)
  .where(eq(reports.workflow_name, userInput));

// ❌ Dangerous: String interpolation
await db.execute(
  sql`SELECT * FROM reports WHERE workflow_name = '${userInput}'`
);
```

### Type Safety

Always use inferred types:

```typescript
// ✅ Good: Type-safe
type Report = typeof reports.$inferSelect;

function processReport(report: Report) {
  // TypeScript knows all fields
  console.log(report.workflow_name);
}

// ❌ Bad: Loses type safety
function processReport(report: any) {
  console.log(report.workflow_name);  // No autocomplete
}
```

---

## Testing

### In-Memory Database

Use in-memory database for tests:

```typescript
import { createDb } from '@homelab/db';
import * as schema from '@homelab/db/schema/playwright';

const testDb = createDb({
  path: ':memory:',  // In-memory database
  schema
});

// Run migrations
await testDb.migrate();

// Use in tests
test('creates report', async () => {
  const [report] = await testDb.insert(schema.reports).values({
    workflow_name: 'test',
    status: 'passed'
  }).returning();

  expect(report.workflow_name).toBe('test');
});

// Clean up
testDb.close();
```

### Test Fixtures

```typescript
export async function seedTestData(db) {
  const reports = await db.insert(schema.reports).values([
    { workflow_name: 'test1', status: 'passed' },
    { workflow_name: 'test2', status: 'failed' },
    { workflow_name: 'test3', status: 'passed' }
  ]).returning();

  return { reports };
}

// Use in tests
const fixtures = await seedTestData(testDb);
expect(fixtures.reports).toHaveLength(3);
```

---

## Performance Tips

### Batch Inserts

```typescript
// ✅ Fast: Single query
await db.insert(reports).values([
  { workflow_name: 'test1' },
  { workflow_name: 'test2' },
  { workflow_name: 'test3' }
]);

// ❌ Slow: Multiple queries
for (const name of ['test1', 'test2', 'test3']) {
  await db.insert(reports).values({ workflow_name: name });
}
```

### Limit Query Results

Always paginate large result sets:

```typescript
// ✅ Good: Limited results
await db.select()
  .from(reports)
  .limit(100);

// ❌ Bad: Can return millions of rows
await db.select().from(reports);
```

### Use Prepared Statements

For repeated queries:

```typescript
const getReportById = db.select()
  .from(reports)
  .where(eq(reports.id, sql.placeholder('id')))
  .prepare();

// Execute many times (cached query plan)
const report1 = await getReportById.execute({ id: 1 });
const report2 = await getReportById.execute({ id: 2 });
```

---

## Troubleshooting

### Database Locked

**Symptom**: `Error: database is locked`

**Causes**:
- Multiple processes accessing same database
- Long-running transaction holding lock
- Drizzle Studio open while running app

**Solutions**:
```bash
# Close all connections
# Close Drizzle Studio
# Restart application

# Or increase timeout
const db = createDb({
  path: './data/app.db',
  schema,
  timeout: 10000  // 10 seconds
});
```

### Migration Failures

**Symptom**: Migration fails partway through

**Recovery**:
```bash
# Rollback manually via sqlite3
sqlite3 packages/db/data/app.db

# Drop tables or columns added by failed migration
DROP TABLE IF EXISTS new_table;
ALTER TABLE reports DROP COLUMN new_column;

# Delete migration file
rm packages/db/drizzle/0005_failed_migration.sql

# Re-generate and retry
bun run db:generate
bun run db:migrate
```

### Type Errors After Schema Changes

**Symptom**: TypeScript errors after updating schema

**Fix**:
```bash
# Rebuild database package
cd packages/db
bun run build

# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

## Related Documentation

- [Architecture Guide](../architecture.md) - Database architecture design
- [Development Guide](../development.md) - Setup and workflows
- [Validators Package](./validators.md) - Input validation
- [UI Package](./ui.md) - UI components
- [Drizzle ORM Docs](https://orm.drizzle.team/) - Official documentation
