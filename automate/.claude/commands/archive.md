# Archive Specification with Knowledge Capture

When the user runs `/archive $SPEC_NAME`:

## Pre-Archive Validation

First, verify the specification is complete:

```
[BatchTool]:
// Load completion state
- mcp__claude-flow__memory_retrieve { key: "$SPEC_NAME-completion" }

// Verify all systems green
- Bash("pnpm tsc --noEmit")
- Bash("pnpm build")
- Bash("pnpm test")

// Check tasks.md completion
- Read("openspec/changes/$SPEC_NAME/tasks.md")
```

### Validation Gates

**STOP if ANY of these fail:**

1. **TypeScript Check**: `pnpm tsc --noEmit` must exit 0
2. **Build Check**: `pnpm build` must exit 0
3. **Test Check**: `pnpm test` must exit 0
4. **Tasks Check**: All items in tasks.md must be marked `[x]` complete

If validation fails:
```
❌ Cannot archive $SPEC_NAME - validation failed:
- TypeScript: [PASS/FAIL]
- Build: [PASS/FAIL]
- Tests: [PASS/FAIL]
- Tasks: [X of Y complete]

Run `/apply-batch $SPEC_NAME` to complete remaining work.
```

---

## Knowledge Capture

Before archiving, extract learnings for future reference:

```
[BatchTool]:
// Analyze what was built
- Read("src/db/schema/$SPEC_NAME.ts")
- Read("src/server/api/routers/$SPEC_NAME.ts")
- Read("src/components/$SPEC_NAME/")

// Store comprehensive learnings
- mcp__claude-flow__memory_store {
    key: "$SPEC_NAME-learnings",
    value: {
      feature: "$SPEC_NAME",
      completedAt: "{{timestamp}}",
      
      // Files inventory
      filesCreated: {
        schema: "src/db/schema/$SPEC_NAME.ts",
        types: "src/types/$SPEC_NAME.ts",
        router: "src/server/api/routers/$SPEC_NAME.ts",
        validation: "src/lib/validations/$SPEC_NAME.ts",
        components: ["src/components/$SPEC_NAME/"],
        pages: ["src/app/(dashboard)/$SPEC_NAME/"],
        tests: "tests/$SPEC_NAME.test.ts"
      },
      
      // Patterns used (for skill updates)
      patternsUsed: [
        "Drizzle schema with relations",
        "tRPC protected procedures",
        "Zod validation with inference",
        "react-hook-form with zodResolver",
        "DataTable with pagination"
      ],
      
      // Issues encountered during implementation
      issuesEncountered: [
        // Populate from actual issues hit during apply-batch
      ],
      
      // Relations to other features
      relatedSchemas: [
        // List schemas this feature relates to
      ],
      
      // Performance notes
      executionStats: {
        parallelGroups: 4,
        totalAgentsSpawned: 8,
        buildValidationsPassed: true
      }
    }
  }
```

---

## Archive Execution

Run the OpenSpec archive command:

```
[BatchTool]:
// Archive the specification
- Bash("cd openspec && openspec archive $SPEC_NAME")

// Verify archive completed
- Bash("ls openspec/archive/$SPEC_NAME/")
- Bash("ls openspec/changes/ | grep -v $SPEC_NAME || echo 'Changes directory clean'")
```

---

## Update Project Documentation

If the feature adds significant functionality, update relevant docs:

```
[BatchTool]:
// Check if README needs update
- Read("README.md")

// If feature is user-facing, add to features list
- Edit("README.md", addFeatureToList) // Only if appropriate

// Update API documentation if exists
- Read("docs/api.md") // If exists
- Edit("docs/api.md", addEndpointDocs) // If exists
```

---

## Skill Update Check

Analyze if new patterns emerged that should be added to skills:

```
Evaluate the implementation for new patterns:

1. **Schema Patterns**: Did we use a new Drizzle pattern not in skills?
2. **Router Patterns**: Did we create a new tRPC pattern worth documenting?
3. **Component Patterns**: Did we build a reusable UI pattern?
4. **Test Patterns**: Did we develop new testing approaches?

If YES to any:
```

Ask user:
```
📝 New patterns detected during $SPEC_NAME implementation:

[List specific patterns]

Would you like me to add these to the relevant skill files?
- .claude/skills/drizzle-patterns/SKILL.md
- .claude/skills/trpc-conventions/SKILL.md
- .claude/skills/otaku-domain/SKILL.md

Reply with: "update skills" or "skip"
```

If user says "update skills":
```
[BatchTool]:
- Edit(".claude/skills/trpc-conventions/SKILL.md", addNewPatterns)
- Edit(".claude/skills/drizzle-patterns/SKILL.md", addNewPatterns)
```

---

## Cleanup Swarm Resources

```
[BatchTool]:
// Clean up swarm state for this feature
- mcp__claude-flow__swarm_cleanup { feature: "$SPEC_NAME" }

// Clear working todos (keep learnings)
- mcp__claude-flow__memory_delete { key: "$SPEC_NAME-plan" }
- mcp__claude-flow__memory_delete { key: "$SPEC_NAME-completion" }
// Note: $SPEC_NAME-learnings is KEPT for future reference
```

---

## Archive Confirmation

```
✅ Specification $SPEC_NAME archived successfully!

📁 Archive Location: openspec/archive/$SPEC_NAME/

📊 Summary:
- Files created: [count]
- Tests added: [count]
- Build status: ✅ Passing
- Test status: ✅ Passing

🧠 Learnings stored in claude-flow memory for future reference.

🔗 Related features: [list any related specs]

---

Next steps:
- View archive: cat openspec/archive/$SPEC_NAME/proposal.md
- Start new feature: /openspec:proposal [description]
- Review learnings: /recall $SPEC_NAME
```

---

## Error Recovery

If archive fails for any reason:

```
❌ Archive failed: [error message]

Recovery options:
1. Fix issue and retry: /archive $SPEC_NAME
2. Force archive (skip validation): /archive $SPEC_NAME --force
3. Abandon and cleanup: /abandon $SPEC_NAME
```

For `--force` flag (use sparingly):
```
⚠️  Force archiving without full validation.
This should only be used when:
- Tests are intentionally skipped
- Build issues are known and tracked
- Manual verification has been done

Proceeding with force archive...
```
