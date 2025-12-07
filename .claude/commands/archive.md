# Archive Specification with Knowledge Capture

When the user runs `/archive $SPEC_NAME`:

Archive the completed specification and store learnings for future reference.

## Step 1: Pre-Archive Validation

First, verify the specification is complete:

```bash
# Verify all systems green
pnpm tsc --noEmit
pnpm build
pnpm test

# Check tasks.md completion
cat openspec/changes/$SPEC_NAME/tasks.md
```

### Validation Gates

**STOP if ANY of these fail:**

1. **TypeScript Check**: `pnpm tsc --noEmit` must exit 0
2. **Build Check**: `pnpm build` must exit 0
3. **Test Check**: `pnpm test` must exit 0
4. **Tasks Check**: All items in tasks.md must be marked `[x]` complete

If validation fails:
```
Cannot archive $SPEC_NAME - validation failed:
- TypeScript: [PASS/FAIL]
- Build: [PASS/FAIL]
- Tests: [PASS/FAIL]
- Tasks: [X of Y complete]

Run `/apply $SPEC_NAME` to complete remaining work.
```

## Step 2: Extract Learnings

Before archiving, extract knowledge for future reference:

```
mcp__claude-flow__memory_retrieve { key: "$SPEC_NAME-context" }
mcp__claude-flow__memory_retrieve { key: "$SPEC_NAME-completion" }
```

Compile learnings:
- Files created and their purposes
- Patterns used (schema, router, components)
- Key decisions made
- Issues encountered and solutions
- Related specifications

## Step 3: Store Learnings to Permanent Memory

Store learnings that will persist after archive:

```
mcp__claude-flow__memory_store {
  key: "$SPEC_NAME-learnings",
  value: {
    specName: "$SPEC_NAME",
    archivedAt: "[timestamp]",

    summary: "[2-3 sentence summary of the feature]",

    filesCreated: [
      { path: "src/db/schema/$SPEC_NAME.ts", purpose: "Database schema" },
      { path: "src/server/api/routers/$SPEC_NAME.ts", purpose: "tRPC router" },
      ...
    ],

    patterns: [
      "Drizzle schema with relations",
      "CRUD tRPC procedures",
      "Form with react-hook-form + Zod"
    ],

    decisions: [
      "[key decision 1]",
      "[key decision 2]"
    ],

    issues: [
      { problem: "[issue]", solution: "[how it was solved]" }
    ],

    relatedSpecs: [
      "[related spec names]"
    ]
  }
}
```

## Step 4: Cleanup Temporary Memory

Delete temporary keys that are no longer needed:

```
mcp__claude-flow__memory_delete { key: "$SPEC_NAME-plan" }
mcp__claude-flow__memory_delete { key: "$SPEC_NAME-context" }
mcp__claude-flow__memory_delete { key: "$SPEC_NAME-completion" }
mcp__claude-flow__memory_delete { key: "$SPEC_NAME-quick" }
```

Only the `-learnings` key is preserved for future `/recall`.

## Step 5: Execute OpenSpec Archive

Run the OpenSpec archive command:

```bash
/openspec:archive $SPEC_NAME
```

Or manually:
```bash
# Move spec to archive
mkdir -p openspec/archive/$SPEC_NAME
mv openspec/changes/$SPEC_NAME/* openspec/archive/$SPEC_NAME/
rmdir openspec/changes/$SPEC_NAME

# Verify archive completed
ls openspec/archive/$SPEC_NAME/
```

## Step 6: Archive Confirmation

```
Specification archived: $SPEC_NAME

Archive Location: openspec/archive/$SPEC_NAME/

Summary:
- Files created: [count]
- Tests added: [count]
- Build status: Passing
- Test status: Passing

Learnings stored for future reference.

---

Next steps:
- View learnings: /recall $SPEC_NAME
- Start new feature: /feature [description]
- List archived specs: /recall --list
```

## Error Recovery

If archive fails for any reason:

```
Archive failed: [error message]

Recovery options:
1. Fix issue and retry: /archive $SPEC_NAME
2. Force archive (skip validation): /archive $SPEC_NAME --force
3. Continue work: /apply $SPEC_NAME
```

For `--force` flag (use sparingly):
```
Force archiving without full validation.
This should only be used when:
- Tests are intentionally skipped
- Build issues are known and tracked
- Manual verification has been done

Proceeding with force archive...
```

## Companion Commands

- `/recall $SPEC_NAME` - View learnings from this spec
- `/recall --list` - List all archived specs
- `/feature [description]` - Start a new feature
