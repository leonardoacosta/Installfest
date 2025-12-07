# Apply Specification with Batch Parallel Execution

When the user runs `/apply $SPEC_NAME`:

Execute the specification using parallel agent groups with validation gates between each phase.

## Step 1: Initialize Orchestration

Load the specification and initialize the swarm:

```
mcp__claude-flow__swarm_init { topology: "hierarchical", maxAgents: 8, strategy: "parallel" }
mcp__claude-flow__memory_retrieve { key: "$SPEC_NAME-plan" }
```

Read the specification files:
- `openspec/changes/$SPEC_NAME/tasks.md`
- `openspec/changes/$SPEC_NAME/MULTI_AGENT_PLAN.md`
- `openspec/changes/$SPEC_NAME/proposal.md`

If memory contains a previous plan, resume from the stored phase. Otherwise, start from Group 1.

## Step 2: Execute Group 1 - Foundation

Execute all foundation tasks in a single batch message. This is critical for performance.

Spawn agents and assign tasks:
- **Schema Expert**: Create database schema following Drizzle patterns
- **Types Expert**: Create TypeScript interfaces matching the schema

Run migrations after schema creation:
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

Update todos to track progress.

## Step 3: Validation Gate 1

After Group 1 completes, run typecheck validation:

```bash
pnpm tsc --noEmit
```

If typecheck fails:
1. Spawn a TypeScript Fixer agent with the error output
2. Do not proceed to Group 2 until typecheck passes
3. Re-run typecheck after fixes

Only proceed when typecheck exits zero.

## Step 4: Execute Group 2 - API Layer

Execute all API tasks in a single batch message.

Spawn agents and assign tasks:
- **API Builder**: Create tRPC router with CRUD procedures
- **Validation Expert**: Create Zod validation schemas

Ensure router is exported from `src/server/api/root.ts`.

## Step 5: Validation Gate 2

After Group 2 completes, run build validation:

```bash
pnpm build
```

If build fails:
1. Spawn a Build Fixer agent with the error output
2. Do not proceed to Group 3 until build passes

## Step 6: Execute Group 3 - UI Layer

Execute all UI tasks in a single batch message.

Spawn agents and assign tasks:
- **UI Builder**: Create form and list components
- **Page Builder**: Create the main page component

Create necessary directories:
```bash
mkdir -p src/components/$SPEC_NAME
mkdir -p src/app/(dashboard)/$SPEC_NAME
```

## Step 7: Validation Gate 3

After Group 3 completes, run build validation again:

```bash
pnpm build
```

If build fails, spawn a fix agent. Do not proceed to Group 4 until build passes.

## Step 8: Execute Group 4 - Quality

Execute all quality tasks in a single batch message.

Spawn agents and assign tasks:
- **Test Writer**: Create comprehensive tests for all procedures

## Step 9: Validation Gate 4

After Group 4 completes, run the full test suite:

```bash
pnpm test
```

If tests fail, spawn a fix agent. Do not report completion until all tests pass.

## Step 10: Store Completion Status

After all groups pass validation, store completion status:

```
mcp__claude-flow__memory_store {
  key: "$SPEC_NAME-completion",
  value: {
    status: "ready-for-archive",
    completedAt: "[timestamp]",
    filesCreated: [...],
    validationsPassed: ["typecheck", "build", "test"]
  }
}
```

Display completion summary:

```
Specification applied: $SPEC_NAME

Files created:
- src/db/schema/$SPEC_NAME.ts
- src/types/$SPEC_NAME.ts
- src/server/api/routers/$SPEC_NAME.ts
- src/lib/validations/$SPEC_NAME.ts
- src/components/$SPEC_NAME/
- src/app/(dashboard)/$SPEC_NAME/page.tsx
- tests/$SPEC_NAME.test.ts

Validations:
- TypeScript: Passing
- Build: Passing
- Tests: Passing

Archive when ready: /archive $SPEC_NAME
```

## Batch Execution Pattern

For each group, submit ALL operations in a single message:
- Agent spawns
- Todo updates
- Task instructions
- File operations
- Bash commands

Never execute sequentially by spawning one agent, waiting, then spawning another.

## Quality Standards

Never accept work that contains:
- TODO or FIXME comments
- Type assertions or explicit `any` types
- Missing exports from index files
- Incomplete implementations

Always verify:
- All assigned files were created
- Validation gates pass before proceeding
