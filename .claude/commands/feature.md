# New Feature Command

When the user runs `/feature $DESCRIPTION`:

Create a new feature specification using OpenSpec and prepare it for parallel execution.

## Step 1: Create Initial Proposal

Run the OpenSpec proposal command with the provided description:

```bash
/openspec:proposal $DESCRIPTION
```

Wait for user to iterate on the proposal until satisfied.

## Step 2: Review and Refine

After proposal is created, ask user:

```
Proposal created for: $SPEC_NAME

Options:
1. Refine proposal (edit proposal.md)
2. Proceed to task organization
3. Cancel and start over

Ready to organize tasks for parallel execution?
```

## Step 3: Organize Tasks into Parallel Groups

Once proposal is approved, reorganize tasks.md into 4 standard groups:

```markdown
# Implementation Tasks

## Group 1: Foundation [parallel:foundation]
Tasks that have no dependencies and create base files:
- [ ] 1.1 Create database schema [owner:schema-expert]
- [ ] 1.2 Create TypeScript types [owner:types-expert]
- [ ] 1.3 Create Zod validators [owner:validation-expert]

## Group 2: API Layer [parallel:api]
Tasks that depend on Foundation:
- [ ] 2.1 Create tRPC router [owner:api-builder] (depends: 1.1, 1.2, 1.3)
- [ ] 2.2 Add router to root [owner:api-builder] (depends: 2.1)

## Group 3: UI Layer [parallel:ui]
Tasks that depend on API Layer:
- [ ] 3.1 Create form component [owner:ui-builder] (depends: 2.1)
- [ ] 3.2 Create list component [owner:ui-builder] (depends: 2.1)
- [ ] 3.3 Create page component [owner:page-builder] (depends: 3.1, 3.2)

## Group 4: Quality [parallel:quality]
Tasks that validate the implementation:
- [ ] 4.1 Create unit tests [owner:test-writer] (depends: 2.1)
- [ ] 4.2 Create E2E tests [owner:test-writer] (depends: 3.3)
```

## Step 4: Create MULTI_AGENT_PLAN.md

Generate the multi-agent execution plan:

```markdown
# Multi-Agent Execution Plan: $SPEC_NAME

## Parallel Execution Strategy

### Group 1: Foundation (Parallel)
Spawn agents simultaneously:
- schema-expert → src/db/schema/$SPEC_NAME.ts
- types-expert → src/types/$SPEC_NAME.ts
- validation-expert → src/lib/validations/$SPEC_NAME.ts

Validation Gate: `pnpm tsc --noEmit`

### Group 2: API Layer (Parallel)
Spawn agents after Group 1 validation:
- api-builder → src/server/api/routers/$SPEC_NAME.ts

Validation Gate: `pnpm build`

### Group 3: UI Layer (Parallel)
Spawn agents after Group 2 validation:
- ui-builder → src/components/$SPEC_NAME/*
- page-builder → src/app/(dashboard)/$SPEC_NAME/page.tsx

Validation Gate: `pnpm build`

### Group 4: Quality (Parallel)
Spawn agents after Group 3 validation:
- test-writer → tests/$SPEC_NAME.test.ts

Validation Gate: `pnpm test`

## File Ownership Matrix

| File | Owner | Group | Dependencies |
|------|-------|-------|--------------|
| src/db/schema/$SPEC_NAME.ts | schema-expert | 1 | none |
| src/types/$SPEC_NAME.ts | types-expert | 1 | none |
| src/lib/validations/$SPEC_NAME.ts | validation-expert | 1 | none |
| src/server/api/routers/$SPEC_NAME.ts | api-builder | 2 | Group 1 |
| src/components/$SPEC_NAME/* | ui-builder | 3 | Group 2 |
| src/app/(dashboard)/$SPEC_NAME/page.tsx | page-builder | 3 | Group 2 |
| tests/$SPEC_NAME.test.ts | test-writer | 4 | Group 3 |

## Resume Points

If interrupted, resume from the last incomplete group.
State is persisted via: `mcp__claude-flow__memory_store`
```

## Step 5: Store Plan in Memory

Store the execution plan for resume capability:

```
mcp__claude-flow__memory_store {
  key: "$SPEC_NAME-plan",
  value: {
    specName: "$SPEC_NAME",
    createdAt: "[timestamp]",
    currentGroup: 0,
    groups: [
      { name: "Foundation", status: "pending", tasks: [...] },
      { name: "API Layer", status: "pending", tasks: [...] },
      { name: "UI Layer", status: "pending", tasks: [...] },
      { name: "Quality", status: "pending", tasks: [...] }
    ],
    fileOwnership: {...}
  }
}
```

## Step 6: Present Summary

Display the feature summary and next steps:

```
Feature Ready: $SPEC_NAME

Parallel Groups:
- Group 1 (Foundation): [X] tasks
- Group 2 (API Layer): [Y] tasks
- Group 3 (UI Layer): [Z] tasks
- Group 4 (Quality): [W] tasks

Total: [N] tasks across [M] files

Files to be created:
- src/db/schema/$SPEC_NAME.ts
- src/types/$SPEC_NAME.ts
- src/lib/validations/$SPEC_NAME.ts
- src/server/api/routers/$SPEC_NAME.ts
- src/components/$SPEC_NAME/*
- src/app/(dashboard)/$SPEC_NAME/page.tsx
- tests/$SPEC_NAME.test.ts

---

Ready to implement? Run: /apply $SPEC_NAME

Or refine further:
- Edit tasks: openspec/changes/$SPEC_NAME/tasks.md
- Edit plan: openspec/changes/$SPEC_NAME/MULTI_AGENT_PLAN.md
```

## Companion Commands

- `/apply $SPEC_NAME` - Execute the feature with parallel agents
- `/store $SPEC_NAME` - Save progress before clearing context
- `/resume $SPEC_NAME` - Continue from saved progress
