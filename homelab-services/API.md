# Claude Agent Server - tRPC API Documentation

Complete reference for the type-safe tRPC API procedures.

## Table of Contents

- [Authentication](#authentication)
- [Projects Router](#projects-router)
- [Sessions Router](#sessions-router)
- [Hooks Router](#hooks-router)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

## Authentication

Currently **no authentication** is required. The API is designed for local/homelab deployment behind Tailscale VPN.

**Future**: Add authentication middleware when exposing to internet.

## Projects Router

Namespace: `projects.*`

### `projects.list()`

List all projects, ordered by creation date (newest first).

**Input**: None

**Output**: `Project[]`

```typescript
interface Project {
  id: number;
  name: string;
  path: string;
  description: string | null;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}
```

**Example**:

```typescript
const projects = await trpc.projects.list.query();
// => [{ id: 1, name: "My Project", path: "/tmp/my-project", ... }]
```

---

### `projects.byId(input)`

Get a single project by ID.

**Input**:

```typescript
{
  id: number;
}
```

**Output**: `Project | undefined`

Returns `undefined` if project not found.

**Example**:

```typescript
const project = await trpc.projects.byId.query({ id: 1 });
if (!project) {
  console.log('Project not found');
}
```

---

### `projects.create(input)`

Create a new project.

**Input**:

```typescript
{
  name: string;          // Unique project name
  path: string;          // Absolute path to project
  description?: string;  // Optional description
}
```

**Output**: `Project`

**Validation**:
- `name` must be unique
- `name` and `path` are required

**Example**:

```typescript
const project = await trpc.projects.create.mutate({
  name: 'Claude Agent Server',
  path: '/home/leo/dev/claude-agent',
  description: 'Management dashboard for Claude sessions',
});
```

---

### `projects.update(input)`

Update an existing project.

**Input**:

```typescript
{
  id: number;
  name?: string;
  path?: string;
  description?: string;
}
```

**Output**: `Project`

**Validation**:
- At least one field besides `id` must be provided
- `name` must be unique if updated

**Example**:

```typescript
const updated = await trpc.projects.update.mutate({
  id: 1,
  description: 'Updated description',
});
```

---

### `projects.delete(input)`

Delete a project and all associated sessions and hooks (cascade).

**Input**:

```typescript
{
  id: number;
}
```

**Output**: `{ success: true }`

**Side Effects**:
- Deletes all sessions for this project
- Deletes all hooks for those sessions

**Example**:

```typescript
await trpc.projects.delete.mutate({ id: 1 });
```

---

## Sessions Router

Namespace: `sessions.*`

### `sessions.list(input?)`

List sessions, optionally filtered by project.

**Input** (optional):

```typescript
{
  projectId?: number;
}
```

**Output**: `SessionWithProject[]`

```typescript
interface SessionWithProject {
  id: number;
  projectId: number;
  agentId: string;
  status: 'running' | 'stopped';
  startedAt: number;  // Unix timestamp
  stoppedAt: number | null;
  errorMessage: string | null;
  projectName: string;
  projectPath: string;
}
```

**Example**:

```typescript
// All sessions
const allSessions = await trpc.sessions.list.query();

// Sessions for specific project
const projectSessions = await trpc.sessions.list.query({ projectId: 1 });
```

---

### `sessions.byId(input)`

Get a single session with hook count.

**Input**:

```typescript
{
  id: number;
}
```

**Output**: `SessionWithHookCount | undefined`

```typescript
interface SessionWithHookCount extends Session {
  hookCount: number;
}
```

**Example**:

```typescript
const session = await trpc.sessions.byId.query({ id: 1 });
console.log(`Session has ${session.hookCount} hooks`);
```

---

### `sessions.start(input)`

Start a new Claude Code session.

**Input**:

```typescript
{
  projectId: number;
  agentId: string;  // Unique identifier for this agent instance
}
```

**Output**: `Session`

**Validation**:
- `projectId` must reference existing project
- `agentId` must be unique (one active session per agent)

**Example**:

```typescript
const session = await trpc.sessions.start.mutate({
  projectId: 1,
  agentId: `agent-${Date.now()}`,
});
```

---

### `sessions.stop(input)`

Stop a running session.

**Input**:

```typescript
{
  id: number;
}
```

**Output**: `Session`

**Side Effects**:
- Sets `status` to `'stopped'`
- Records `stoppedAt` timestamp

**Example**:

```typescript
await trpc.sessions.stop.mutate({ id: 1 });
```

---

## Hooks Router

Namespace: `hooks.*`

### `hooks.list(input?)`

List hook events with filtering and pagination.

**Input** (optional):

```typescript
{
  sessionId?: number;
  hookType?: string;
  limit?: number;    // Default: 50, Max: 100
  offset?: number;   // Default: 0
}
```

**Output**: `Hook[]` or `HookWithContext[]` (if no sessionId filter)

```typescript
interface Hook {
  id: number;
  sessionId: number;
  hookType: string;
  timestamp: number;
  toolName: string | null;
  toolInput: string | null;
  toolOutput: string | null;
  durationMs: number | null;
  success: boolean | null;
  errorMessage: string | null;
  metadata: string | null;
}

interface HookWithContext extends Hook {
  agentId: string;
  projectName: string;
}
```

**Example**:

```typescript
// All hooks for a session
const hooks = await trpc.hooks.list.query({ sessionId: 1 });

// Filtered by type with pagination
const toolUseHooks = await trpc.hooks.list.query({
  sessionId: 1,
  hookType: 'pre_tool_use',
  limit: 20,
  offset: 0,
});
```

---

### `hooks.stats(input?)`

Get aggregated statistics grouped by hook type and tool.

**Input** (optional):

```typescript
{
  sessionId?: number;
}
```

**Output**: `HookStats[]`

```typescript
interface HookStats {
  hookType: string;
  toolName: string | null;
  total: number;
  successful: number;
  failed: number;
  avgDuration: number | null;
}
```

**Example**:

```typescript
const stats = await trpc.hooks.stats.query({ sessionId: 1 });

stats.forEach(stat => {
  console.log(`${stat.hookType} (${stat.toolName}): ${stat.total} calls`);
  console.log(`  Success rate: ${(stat.successful / stat.total * 100).toFixed(1)}%`);
  console.log(`  Avg duration: ${stat.avgDuration}ms`);
});
```

---

### `hooks.ingest(input)`

Ingest a hook event from Python hook scripts. Called automatically by hook system.

**Input**:

```typescript
{
  sessionId: number;
  hookType: string;
  timestamp?: number;
  toolName?: string;
  toolInput?: string;
  toolOutput?: string;
  durationMs?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: string;  // JSON string
}
```

**Output**: `Hook`

**Side Effects**:
- Broadcasts event to `hooks.subscribe` subscribers

**Example** (typically called by Python scripts):

```typescript
await trpc.hooks.ingest.mutate({
  sessionId: 1,
  hookType: 'pre_tool_use',
  toolName: 'Read',
  toolInput: JSON.stringify({ file_path: '/test/file.txt' }),
  success: true,
  timestamp: Date.now(),
});
```

---

### `hooks.subscribe(input?)`

Subscribe to real-time hook events via tRPC subscription.

**Input** (optional):

```typescript
{
  sessionId?: number;  // Filter to specific session
}
```

**Output**: `Observable<Hook>`

Emits a new `Hook` object each time `hooks.ingest` is called.

**Example** (React):

```typescript
import { useEffect } from 'react';

function HookFeed({ sessionId }) {
  const subscription = trpc.hooks.subscribe.useSubscription(
    { sessionId },
    {
      onData: (hook) => {
        console.log('New hook event:', hook);
        // Update UI, show toast notification, etc.
      },
      onError: (err) => {
        console.error('Subscription error:', err);
      },
    }
  );

  return <div>Listening for hooks...</div>;
}
```

---

## Type Definitions

All types are automatically generated from Drizzle schema and tRPC procedures.

### Import Types

```typescript
import type { AppRouter } from '@homelab/api';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

// Examples:
type ProjectCreateInput = RouterInputs['projects']['create'];
type ProjectOutput = RouterOutputs['projects']['byId'];
```

### Drizzle Schema Types

```typescript
import { projects, sessions, hooks } from '@homelab/db';

type Project = typeof projects.$inferSelect;
type NewProject = typeof projects.$inferInsert;

type Session = typeof sessions.$inferSelect;
type Hook = typeof hooks.$inferSelect;
```

---

## Error Handling

### tRPC Errors

All procedures throw `TRPCError` on failure:

```typescript
import { TRPCError } from '@trpc/server';

try {
  const project = await trpc.projects.create.mutate({
    name: 'Duplicate Name',
    path: '/tmp/test',
  });
} catch (error) {
  if (error instanceof TRPCError) {
    console.error('tRPC Error:', error.code);
    console.error('Message:', error.message);
  }
}
```

### Common Error Codes

- `BAD_REQUEST` - Validation error (Zod schema mismatch)
- `NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Database or server error
- `CONFLICT` - Unique constraint violation

### Validation Errors

Zod validation errors include detailed path information:

```typescript
{
  code: 'BAD_REQUEST',
  message: 'Validation failed',
  cause: [
    {
      code: 'invalid_type',
      expected: 'string',
      received: 'undefined',
      path: ['name'],
      message: 'Required'
    }
  ]
}
```

---

## Usage Examples

### React Frontend with tRPC

```typescript
import { trpc } from '@/lib/trpc';

function ProjectList() {
  const { data: projects, isLoading } = trpc.projects.list.useQuery();
  const createProject = trpc.projects.create.useMutation();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {projects?.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
      <button onClick={() => createProject.mutate({
        name: 'New Project',
        path: '/tmp/new-project'
      })}>
        Create Project
      </button>
    </div>
  );
}
```

### Vanilla TypeScript Client

```typescript
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@homelab/api';
import SuperJSON from 'superjson';

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3002/api/trpc',
      transformer: SuperJSON,
    }),
  ],
});

// Type-safe API calls
const projects = await client.projects.list.query();
const project = await client.projects.create.mutate({
  name: 'Test Project',
  path: '/tmp/test',
});
```

### Server-Side Usage

```typescript
import { appRouter } from '@homelab/api';
import { createContext } from '@homelab/api/context';

const ctx = createContext();
const caller = appRouter.createCaller(ctx);

// Call procedures directly
const projects = await caller.projects.list();
const session = await caller.sessions.start({
  projectId: 1,
  agentId: 'server-agent-1',
});
```

---

## API Endpoints (HTTP)

tRPC procedures are exposed via HTTP at:

**Base URL**: `http://localhost:3002/api/trpc`

**Query Procedures** (GET):
```
GET /api/trpc/projects.list
GET /api/trpc/projects.byId?input={"id":1}
GET /api/trpc/sessions.list?input={"projectId":1}
```

**Mutation Procedures** (POST):
```
POST /api/trpc/projects.create
POST /api/trpc/sessions.start
POST /api/trpc/hooks.ingest
```

**Batch Requests**:
```
POST /api/trpc
Body: { "0": { "projects.list": {} }, "1": { "sessions.list": {} } }
```

---

## WebSocket Support

**Note**: WebSocket support for subscriptions is currently infrastructure-ready but requires additional server setup in production.

**When enabled**, subscriptions will use WebSocket protocol:

```
ws://localhost:3002/api/trpc
```

---

## Development Tools

### Drizzle Studio

Inspect database schema and data:

```bash
cd packages/db
bun run db:studio
# Opens http://localhost:4983
```

### tRPC Panel (Coming Soon)

Interactive API playground similar to GraphQL Playground.

```bash
npm install trpc-panel
# Add to Next.js API route
```

---

## Migration from REST API

If migrating from old Express REST API:

| Old REST Endpoint | New tRPC Procedure |
|-------------------|-------------------|
| `GET /api/projects` | `trpc.projects.list.query()` |
| `POST /api/projects` | `trpc.projects.create.mutate()` |
| `GET /api/projects/:id` | `trpc.projects.byId.query({ id })` |
| `PUT /api/projects/:id` | `trpc.projects.update.mutate({ id, ... })` |
| `DELETE /api/projects/:id` | `trpc.projects.delete.mutate({ id })` |
| `GET /api/sessions` | `trpc.sessions.list.query()` |
| `POST /api/sessions` | `trpc.sessions.start.mutate()` |
| `DELETE /api/sessions/:id` | `trpc.sessions.stop.mutate({ id })` |
| `GET /api/hooks` | `trpc.hooks.list.query()` |
| `GET /api/hooks/stats` | `trpc.hooks.stats.query()` |
| `POST /api/hooks` | `trpc.hooks.ingest.mutate()` |

**Benefits of tRPC**:
- ✅ End-to-end type safety
- ✅ No manual API documentation (types = docs)
- ✅ Automatic input validation
- ✅ Better error handling
- ✅ Real-time subscriptions
- ✅ Request batching
