# Store Context Before Clear

When the user runs `/store-context $SPEC_NAME` (or before any `/clear`):

## Purpose

Persist the current planning context to claude-flow memory so it survives:
- `/clear` commands
- Session restarts
- Context window limits
- Multi-day development breaks

---

## Automatic Context Gathering

Analyze the current conversation and gather:

```
[BatchTool]:
// Read current spec state
- Read("openspec/changes/$SPEC_NAME/proposal.md")
- Read("openspec/changes/$SPEC_NAME/tasks.md")

// Check for any spec deltas
- Bash("ls openspec/changes/$SPEC_NAME/spec-deltas/ 2>/dev/null || echo 'No deltas'")

// Get current project state
- Bash("git status --short")
- Bash("git log -1 --oneline")
```

---

## Context Storage

Store comprehensive context for resumption:

```
[BatchTool]:
- mcp__claude-flow__memory_store {
    key: "$SPEC_NAME-plan",
    value: {
      // Feature identification
      feature: "$SPEC_NAME",
      storedAt: "{{timestamp}}",
      gitCommit: "{{current_commit_hash}}",
      
      // Planning state
      proposalSummary: "{{summarize proposal.md in 2-3 sentences}}",
      
      // Parallel execution groups (from tasks.md)
      parallelGroups: {
        group1_foundation: {
          name: "Foundation",
          status: "{{pending|in_progress|completed}}",
          tasks: [
            "{{task 1 from group 1}}",
            "{{task 2 from group 1}}"
          ]
        },
        group2_api: {
          name: "API Layer",
          status: "{{pending|in_progress|completed}}",
          tasks: [
            "{{task 1 from group 2}}"
          ],
          dependsOn: ["group1_foundation"]
        },
        group3_ui: {
          name: "UI Components",
          status: "{{pending|in_progress|completed}}",
          tasks: [
            "{{task 1 from group 3}}"
          ],
          dependsOn: ["group2_api"]
        },
        group4_tests: {
          name: "Tests",
          status: "{{pending|in_progress|completed}}",
          tasks: [
            "{{task 1 from group 4}}"
          ],
          dependsOn: ["group3_ui"]
        }
      },
      
      // File ownership map (prevents conflicts)
      fileOwnership: {
        "schema-expert": ["src/db/schema/$SPEC_NAME.ts"],
        "types-expert": ["src/types/$SPEC_NAME.ts"],
        "api-builder": ["src/server/api/routers/$SPEC_NAME.ts"],
        "validation-expert": ["src/lib/validations/$SPEC_NAME.ts"],
        "ui-builder": ["src/components/$SPEC_NAME/"],
        "test-writer": ["tests/$SPEC_NAME.test.ts"]
      },
      
      // Critical files that must not conflict
      criticalFiles: [
        "src/db/schema/index.ts",
        "src/server/api/root.ts"
      ],
      
      // Known dependencies
      dependencies: {
        schemas: ["{{related schemas}}"],
        packages: ["{{any new packages needed}}"]
      },
      
      // Completion criteria
      completionCriteria: [
        "pnpm build passes",
        "pnpm test passes",
        "All tasks in tasks.md marked complete",
        "Router exported from appRouter"
      ],
      
      // Discussion context (important decisions made)
      decisions: [
        "{{key decision 1 from conversation}}",
        "{{key decision 2 from conversation}}"
      ],
      
      // Open questions (unresolved items)
      openQuestions: [
        "{{any unresolved questions}}"
      ],
      
      // Resume instructions
      resumeInstructions: "Run /apply-batch $SPEC_NAME to continue implementation from {{current_phase}}"
    }
  }
```

---

## Confirmation Output

```
✅ Context stored for $SPEC_NAME

📦 Stored:
- Proposal summary
- {{X}} parallel groups with {{Y}} total tasks
- File ownership map
- Completion criteria
- {{Z}} key decisions

🔑 Memory key: $SPEC_NAME-plan

---

Safe to clear context now: /clear

To resume later:
1. Start new session
2. Run: /resume $SPEC_NAME
   (or manually: /apply-batch $SPEC_NAME)
```

---

## Quick Store (Minimal Context)

For quick saves when you just need to preserve state:

When user runs `/store-context $SPEC_NAME --quick`:

```
[BatchTool]:
- mcp__claude-flow__memory_store {
    key: "$SPEC_NAME-quick",
    value: {
      feature: "$SPEC_NAME",
      storedAt: "{{timestamp}}",
      currentPhase: "{{1-4}}",
      lastAction: "{{what was just completed}}",
      nextAction: "{{what to do next}}",
      blockers: ["{{any blockers}}"]
    }
  }
```

Output:
```
⚡ Quick context stored for $SPEC_NAME
Resume: /apply-batch $SPEC_NAME (Phase {{X}})
```

---

## Pre-Clear Hook Integration

This command can be automatically triggered before `/clear` by adding to CLAUDE.md:

```markdown
## Before Clearing Context

IMPORTANT: Before running /clear, ALWAYS:
1. Ask user: "Store context for [current spec] before clearing?"
2. If yes, run /store-context [spec-name]
3. Then proceed with /clear
```

---

## Companion: Resume Command

Create a `/resume` command that pairs with this:

When user runs `/resume $SPEC_NAME`:

```
[BatchTool]:
// Load stored context
- mcp__claude-flow__memory_retrieve { key: "$SPEC_NAME-plan" }

// Display summary
// Then automatically suggest: /apply-batch $SPEC_NAME
```

Output:
```
🔄 Resuming $SPEC_NAME

📋 Status: Phase {{X}} of 4
- ✅ Foundation: Complete
- 🔄 API Layer: In Progress
- ⏳ UI Components: Pending
- ⏳ Tests: Pending

Last action: {{lastAction}}
Next action: {{nextAction}}

Continue? Run: /apply-batch $SPEC_NAME
```
