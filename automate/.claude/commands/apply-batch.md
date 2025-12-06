# Apply Specification with Batch Parallel Execution

When the user runs `/apply-batch $SPEC_NAME`:

## Prerequisites Check

First, verify the specification exists and is ready:

```bash
# Verify spec exists
ls openspec/changes/$SPEC_NAME/

# Required files
cat openspec/changes/$SPEC_NAME/proposal.md
cat openspec/changes/$SPEC_NAME/tasks.md
```

If tasks.md doesn't have parallel groups, STOP and ask user to organize tasks into parallel groups first.

---

## Phase 0: Initialize Swarm & Load Context

Execute in ONE message:

```
[BatchTool]:
- mcp__claude-flow__swarm_init { topology: "hierarchical", maxAgents: 8, strategy: "parallel" }
- mcp__claude-flow__memory_retrieve { key: "$SPEC_NAME-plan" }
- Read("openspec/changes/$SPEC_NAME/tasks.md")
- Read("openspec/changes/$SPEC_NAME/proposal.md")
```

Parse tasks.md to identify:
- Parallel Group 1 tasks (Foundation: schemas, types, migrations)
- Parallel Group 2 tasks (API: routers, validations, procedures)
- Parallel Group 3 tasks (UI: components, forms, pages)
- Parallel Group 4 tasks (Tests: unit, integration, e2e)

---

## Phase 1: Foundation (Schemas, Types, Migrations)

Execute ALL foundation work in ONE message:

```
[BatchTool]:
// Spawn specialized agents
- mcp__claude-flow__agent_spawn { type: "architect", name: "Schema Expert" }
- mcp__claude-flow__agent_spawn { type: "coder", name: "Types Expert" }

// Create todos for this phase
- TodoWrite { todos: [
    {id: "$SPEC_NAME-schema", content: "Create Drizzle schema for $SPEC_NAME", status: "in_progress", priority: "high"},
    {id: "$SPEC_NAME-relations", content: "Add relations to existing schemas", status: "in_progress", priority: "high"},
    {id: "$SPEC_NAME-types", content: "Create TypeScript interfaces", status: "in_progress", priority: "high"},
    {id: "$SPEC_NAME-migration", content: "Generate and run Drizzle migration", status: "pending", priority: "high"}
  ]}

// Agent tasks (parallel execution)
- Task("Schema Expert: Create src/db/schema/$SPEC_NAME.ts following existing schema patterns. Include all fields from proposal.md. Add proper relations using Drizzle relations() helper. Export from src/db/schema/index.ts. Coordinate via hooks when complete.")
- Task("Types Expert: Create src/types/$SPEC_NAME.ts with TypeScript interfaces matching the schema. Include Create, Update, and Response types. Use Zod inference where possible. Coordinate via hooks when complete.")

// File operations (parallel)
- Write("src/db/schema/$SPEC_NAME.ts", schemaContent)
- Write("src/types/$SPEC_NAME.ts", typesContent)

// Validation commands (parallel)
- Bash("pnpm drizzle-kit generate")
- Bash("pnpm drizzle-kit migrate")
- Bash("pnpm tsc --noEmit")
```

### Phase 1 Gate
STOP. Verify before continuing:
```bash
pnpm tsc --noEmit
```

If TypeScript errors exist:
```
[BatchTool]:
- mcp__claude-flow__agent_spawn { type: "debugger", name: "TypeScript Fixer" }
- Task("TypeScript Fixer: Fix all TypeScript errors in src/db/schema/$SPEC_NAME.ts and src/types/$SPEC_NAME.ts. Run 'pnpm tsc --noEmit' to verify fixes. Do not proceed until zero errors.")
```

Only proceed to Phase 2 when `pnpm tsc --noEmit` exits 0.

---

## Phase 2: API Layer (Routers, Validations, Procedures)

Execute ALL API work in ONE message:

```
[BatchTool]:
// Spawn specialized agents
- mcp__claude-flow__agent_spawn { type: "coder", name: "API Builder" }
- mcp__claude-flow__agent_spawn { type: "coder", name: "Validation Expert" }

// Update todos
- TodoWrite { todos: [
    {id: "$SPEC_NAME-schema", content: "Create Drizzle schema", status: "completed", priority: "high"},
    {id: "$SPEC_NAME-types", content: "Create TypeScript interfaces", status: "completed", priority: "high"},
    {id: "$SPEC_NAME-migration", content: "Run Drizzle migration", status: "completed", priority: "high"},
    {id: "$SPEC_NAME-router", content: "Create tRPC router with procedures", status: "in_progress", priority: "high"},
    {id: "$SPEC_NAME-validation", content: "Create Zod validation schemas", status: "in_progress", priority: "high"},
    {id: "$SPEC_NAME-router-export", content: "Export router from appRouter", status: "pending", priority: "high"}
  ]}

// Agent tasks (parallel execution)
- Task("API Builder: Create src/server/api/routers/$SPEC_NAME.ts with tRPC router. Include procedures: list (with pagination), getById, create, update, delete. Use protectedProcedure for mutations. Follow existing router patterns in src/server/api/routers/. Import schema from db, use Zod validation. Coordinate via hooks.")
- Task("Validation Expert: Create src/lib/validations/$SPEC_NAME.ts with Zod schemas: create$SPEC_NAMESchema, update$SPEC_NAMESchema, $SPEC_NAMEFilterSchema. Match TypeScript types. Export for use in router and forms. Coordinate via hooks.")

// File operations (parallel)
- Write("src/server/api/routers/$SPEC_NAME.ts", routerContent)
- Write("src/lib/validations/$SPEC_NAME.ts", validationContent)

// Update root router
- Edit("src/server/api/root.ts", addRouterImportAndExport)

// Validation commands (parallel)
- Bash("pnpm tsc --noEmit")
- Bash("pnpm build")
```

### Phase 2 Gate
STOP. Verify before continuing:
```bash
pnpm build
```

If build fails:
```
[BatchTool]:
- mcp__claude-flow__agent_spawn { type: "debugger", name: "Build Fixer" }
- Task("Build Fixer: Fix all build errors. Check: 1) Router exports correctly from root.ts, 2) All imports resolve, 3) Zod schemas match procedure inputs. Run 'pnpm build' to verify. Do not proceed until build succeeds.")
```

Only proceed to Phase 3 when `pnpm build` exits 0.

---

## Phase 3: UI Components (Forms, Lists, Pages)

Execute ALL UI work in ONE message:

```
[BatchTool]:
// Spawn specialized agents
- mcp__claude-flow__agent_spawn { type: "coder", name: "UI Builder" }
- mcp__claude-flow__agent_spawn { type: "designer", name: "Form Expert" }

// Update todos
- TodoWrite { todos: [
    {id: "$SPEC_NAME-router", content: "Create tRPC router", status: "completed", priority: "high"},
    {id: "$SPEC_NAME-validation", content: "Create Zod schemas", status: "completed", priority: "high"},
    {id: "$SPEC_NAME-form", content: "Create form component", status: "in_progress", priority: "medium"},
    {id: "$SPEC_NAME-list", content: "Create list/table component", status: "in_progress", priority: "medium"},
    {id: "$SPEC_NAME-page", content: "Create page component", status: "in_progress", priority: "medium"}
  ]}

// Agent tasks (parallel execution)
- Task("UI Builder: Create src/components/$SPEC_NAME/$SPEC_NAMEForm.tsx using react-hook-form with zodResolver. Import validation schema. Use existing form patterns from src/components/. Include proper error handling and loading states. Use shadcn/ui components. Coordinate via hooks.")
- Task("UI Builder: Create src/components/$SPEC_NAME/$SPEC_NAMEList.tsx with DataTable pattern. Include pagination, sorting, filtering. Use tRPC useQuery hook. Follow existing list patterns. Coordinate via hooks.")
- Task("Form Expert: Create src/app/(dashboard)/$SPEC_NAME/page.tsx as the main page. Import List component. Add create button that opens form modal or navigates to create page. Coordinate via hooks.")

// File operations (parallel)
- Bash("mkdir -p src/components/$SPEC_NAME")
- Bash("mkdir -p src/app/(dashboard)/$SPEC_NAME")
- Write("src/components/$SPEC_NAME/$SPEC_NAMEForm.tsx", formContent)
- Write("src/components/$SPEC_NAME/$SPEC_NAMEList.tsx", listContent)
- Write("src/components/$SPEC_NAME/index.ts", componentExports)
- Write("src/app/(dashboard)/$SPEC_NAME/page.tsx", pageContent)

// Validation commands
- Bash("pnpm tsc --noEmit")
- Bash("pnpm build")
```

### Phase 3 Gate
STOP. Verify before continuing:
```bash
pnpm build
```

---

## Phase 4: Tests (Unit, Integration)

Execute ALL test work in ONE message:

```
[BatchTool]:
// Spawn specialized agents
- mcp__claude-flow__agent_spawn { type: "tester", name: "Test Writer" }

// Update todos
- TodoWrite { todos: [
    {id: "$SPEC_NAME-form", content: "Create form component", status: "completed", priority: "medium"},
    {id: "$SPEC_NAME-list", content: "Create list component", status: "completed", priority: "medium"},
    {id: "$SPEC_NAME-page", content: "Create page component", status: "completed", priority: "medium"},
    {id: "$SPEC_NAME-tests-unit", content: "Create unit tests", status: "in_progress", priority: "medium"},
    {id: "$SPEC_NAME-tests-integration", content: "Create integration tests", status: "in_progress", priority: "medium"}
  ]}

// Agent tasks
- Task("Test Writer: Create tests/$SPEC_NAME.test.ts with Vitest tests for all tRPC procedures. Test: list pagination, getById found/not-found, create with valid/invalid data, update with valid/invalid data, delete. Use test utilities from tests/utils. Mock database appropriately. Coordinate via hooks.")

// File operations
- Write("tests/$SPEC_NAME.test.ts", testContent)

// Run tests
- Bash("pnpm vitest run tests/$SPEC_NAME.test.ts")
```

### Phase 4 Gate
STOP. Verify tests pass:
```bash
pnpm vitest run tests/$SPEC_NAME.test.ts
```

---

## Phase 5: Final Validation & Cleanup

Execute in ONE message:

```
[BatchTool]:
// Final validation suite
- Bash("pnpm tsc --noEmit")
- Bash("pnpm build")
- Bash("pnpm test")
- Bash("pnpm lint")

// Mark all todos complete
- TodoWrite { todos: [
    {id: "$SPEC_NAME-schema", status: "completed"},
    {id: "$SPEC_NAME-types", status: "completed"},
    {id: "$SPEC_NAME-migration", status: "completed"},
    {id: "$SPEC_NAME-router", status: "completed"},
    {id: "$SPEC_NAME-validation", status: "completed"},
    {id: "$SPEC_NAME-form", status: "completed"},
    {id: "$SPEC_NAME-list", status: "completed"},
    {id: "$SPEC_NAME-page", status: "completed"},
    {id: "$SPEC_NAME-tests-unit", status: "completed"},
    {id: "$SPEC_NAME-tests-integration", status: "completed"}
  ]}

// Store completion state in memory
- mcp__claude-flow__memory_store { 
    key: "$SPEC_NAME-completion",
    value: {
      status: "ready-for-archive",
      completedAt: "{{timestamp}}",
      filesCreated: [list all created files],
      testsStatus: "passing"
    }
  }

// Update tasks.md
- Edit("openspec/changes/$SPEC_NAME/tasks.md", markAllTasksComplete)
```

---

## Completion Checklist

Before reporting success, verify:
- [ ] `pnpm tsc --noEmit` exits 0
- [ ] `pnpm build` exits 0
- [ ] `pnpm test` exits 0
- [ ] All files in tasks.md have been created
- [ ] All tasks in tasks.md marked complete
- [ ] Router exported from appRouter
- [ ] Page accessible at /$SPEC_NAME route

If ALL checks pass:
```
✅ Specification $SPEC_NAME applied successfully!

Files created:
- src/db/schema/$SPEC_NAME.ts
- src/types/$SPEC_NAME.ts
- src/server/api/routers/$SPEC_NAME.ts
- src/lib/validations/$SPEC_NAME.ts
- src/components/$SPEC_NAME/
- src/app/(dashboard)/$SPEC_NAME/page.tsx
- tests/$SPEC_NAME.test.ts

Ready to archive: /archive $SPEC_NAME
```

If ANY check fails, report specific failures and suggest fixes.
