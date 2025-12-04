# @homelab/validators

Zod validation schemas for type-safe input validation across homelab services.

## Overview

Provides reusable Zod schemas for validating user input, API requests, and configuration. Ensures runtime type safety and provides TypeScript types automatically.

## Installation

```json
{
  "dependencies": {
    "@homelab/validators": "workspace:*"
  }
}
```

## Common Schemas

### Pagination

```typescript
import { paginationSchema } from '@homelab/validators';

const input = paginationSchema.parse({
  limit: 20,
  offset: 0
});

// Type: { limit: number; offset: number }
// Validation: limit 1-100, offset >= 0
```

### Sort

```typescript
import { sortSchema } from '@homelab/validators';

const input = sortSchema.parse({
  field: 'created_at',
  direction: 'desc'
});

// Type: { field: string; direction: 'asc' | 'desc' }
```

### Search

```typescript
import { searchSchema } from '@homelab/validators';

const input = searchSchema.parse({
  query: 'test',
  fields: ['workflow', 'status']
});

// Type: { query: string; fields?: string[] }
```

### List Query (Combined)

```typescript
import { listQuerySchema } from '@homelab/validators';

// Combines pagination + sort + search
const input = listQuerySchema.parse({
  limit: 20,
  offset: 0,
  sortBy: 'created_at',
  sortDir: 'desc',
  search: 'test'
});
```

## Date Range Schemas

### Basic Date Range

```typescript
import { dateRangeSchema } from '@homelab/validators';

const range = dateRangeSchema.parse({
  from: '2025-01-01',
  to: '2025-01-31'
});

// Type: { from: Date; to: Date }
// Automatically converts strings to Date objects
```

### Validated Date Range

```typescript
import { validatedDateRangeSchema } from '@homelab/validators';

// Ensures 'from' is before 'to'
const range = validatedDateRangeSchema.parse({
  from: '2025-01-01',
  to: '2025-01-31'
});

// Throws error if from > to
```

## Report Schemas

### Report Filter

```typescript
import { reportFilterSchema } from '@homelab/validators';

const filter = reportFilterSchema.parse({
  workflow: 'test',
  status: 'failed',
  limit: 20,
  offset: 0
});

// Type: {
//   workflow?: string;
//   status?: 'passed' | 'failed' | 'flaky';
//   limit: number;
//   offset: number;
// }
```

### Create Report

```typescript
import { createReportSchema } from '@homelab/validators';

const report = createReportSchema.parse({
  workflow_name: 'test',
  run_number: 123,
  total_tests: 10,
  passed: 8,
  failed: 2
});
```

## Project Schemas

### Create Project

```typescript
import { createProjectSchema } from '@homelab/validators';

const project = createProjectSchema.parse({
  name: 'My Project',
  path: '/absolute/path',
  description: 'Optional description'
});

// Validates:
// - name: 1-100 characters
// - path: must be absolute
// - description: optional
```

## Session Schemas

### Create Session

```typescript
import { createSessionSchema } from '@homelab/validators';

const session = createSessionSchema.parse({
  projectId: 1,
  agentId: 'agent-123'
});
```

## Hook Schemas

### Hook Event

```typescript
import { hookEventSchema } from '@homelab/validators';

const event = hookEventSchema.parse({
  sessionId: 1,
  hookType: 'pre_tool_use',
  toolName: 'Read',
  toolInput: JSON.stringify({ file_path: '/test.ts' }),
  timestamp: Date.now()
});
```

## Creating Custom Schemas

### Basic Schema

```typescript
import { z } from 'zod';

export const mySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().positive(),
  email: z.string().email().optional()
});

export type MyData = z.infer<typeof mySchema>;
```

### Schema with Refinements

```typescript
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .refine(
    (val) => /[A-Z]/.test(val),
    'Password must contain uppercase letter'
  )
  .refine(
    (val) => /[0-9]/.test(val),
    'Password must contain number'
  );
```

### Conditional Schemas

```typescript
export const configSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('file'),
    path: z.string()
  }),
  z.object({
    type: z.literal('database'),
    connectionString: z.string()
  })
]);
```

## Using with tRPC

```typescript
import { createReportSchema } from '@homelab/validators';

export const reportsRouter = t.router({
  create: t.procedure
    .input(createReportSchema)
    .mutation(async ({ input }) => {
      // input is fully typed and validated!
      return db.insert(reports).values(input).returning();
    })
});
```

## Error Handling

```typescript
import { ZodError } from 'zod';

try {
  const data = mySchema.parse(userInput);
} catch (error) {
  if (error instanceof ZodError) {
    // Access validation errors
    error.errors.forEach((err) => {
      console.log(err.path, err.message);
    });
  }
}
```

## Best Practices

### Explicit Error Messages

```typescript
// ✅ Good: Clear error messages
z.string().min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')

// ❌ Bad: Generic errors
z.string().min(1).max(100)
```

### Export Types

```typescript
export const mySchema = z.object({ ... });
export type MyData = z.infer<typeof mySchema>;
```

### Coerce Types

```typescript
// Convert strings to numbers
const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100),
  offset: z.coerce.number().min(0)
});

// "?limit=20&offset=0" → { limit: 20, offset: 0 }
```

## Related Documentation

- [Architecture Guide](../architecture.md)
- [Development Guide](../development.md)
- [Database Package](./db.md)
- [Zod Documentation](https://zod.dev/)
