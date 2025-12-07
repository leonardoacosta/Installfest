# Store Context with Persistent Memory

When the user runs `/store $SPEC_NAME`:

Persist the current execution context to claude-flow memory so it survives `/clear` commands and session restarts.

## Step 1: Gather Current State

Analyze the current conversation and gather structured context:

```bash
# Read current spec state
cat openspec/changes/$SPEC_NAME/proposal.md
cat openspec/changes/$SPEC_NAME/tasks.md

# Check for multi-agent plan
cat openspec/changes/$SPEC_NAME/MULTI_AGENT_PLAN.md 2>/dev/null || echo 'No plan'

# Get current git state
git status --short
git log -1 --oneline
```

## Step 2: Determine Progress

Parse tasks.md to determine current phase:

```
Phase 1 (Foundation): [complete/in_progress/pending]
Phase 2 (API Layer): [complete/in_progress/pending]
Phase 3 (UI Layer): [complete/in_progress/pending]
Phase 4 (Quality): [complete/in_progress/pending]
```

Count completed vs total tasks in each group.

## Step 3: Capture Key Decisions

From the conversation, extract:
- Architecture decisions made
- Technology choices confirmed
- Trade-offs discussed
- Blockers encountered
- Questions resolved

## Step 4: Store to Persistent Memory

Store structured context using claude-flow:

```
mcp__claude-flow__memory_store {
  key: "$SPEC_NAME-context",
  value: {
    specName: "$SPEC_NAME",
    storedAt: "[timestamp]",

    summary: "[2-3 sentence summary of the feature]",

    progress: {
      currentPhase: [1-4],
      groups: [
        { name: "Foundation", status: "[status]", completed: [X], total: [Y] },
        { name: "API Layer", status: "[status]", completed: [X], total: [Y] },
        { name: "UI Layer", status: "[status]", completed: [X], total: [Y] },
        { name: "Quality", status: "[status]", completed: [X], total: [Y] }
      ]
    },

    decisions: [
      "[key decision 1]",
      "[key decision 2]"
    ],

    blockers: [
      "[any blockers]"
    ],

    filesModified: [
      "[list of files created or modified]"
    ],

    nextAction: "[what to do next when resuming]"
  }
}
```

## Step 5: Confirmation Output

```
Context stored for: $SPEC_NAME

Progress Summary:
- Phase: [X] of 4
- Tasks: [completed]/[total]
- Files modified: [count]

Stored Context:
- Feature summary
- [X] parallel groups with progress
- [Y] key decisions
- [Z] blockers (if any)

---

✅ Safe to clear context now: /clear

To resume later:
1. Start new session
2. Run: /resume $SPEC_NAME

The context is persisted in claude-flow memory and will survive:
- /clear commands
- Session restarts
- Context window limits
```

## Quick Store Option

For quick saves when you just need to preserve minimal state:

When user runs `/store $SPEC_NAME --quick`:

```
mcp__claude-flow__memory_store {
  key: "$SPEC_NAME-quick",
  value: {
    specName: "$SPEC_NAME",
    storedAt: "[timestamp]",
    currentPhase: [X],
    lastAction: "[what was just completed]",
    nextAction: "[what to do next]",
    blockers: "[any blockers]"
  }
}
```

Output:
```
Quick context stored for: $SPEC_NAME

Phase: [X] of 4
Last: [last action]
Next: [next action]

Resume: /resume $SPEC_NAME
```

## Pre-Clear Hook

This command should be suggested before `/clear`:

```
IMPORTANT: Before running /clear, consider:
1. Is there work in progress? Store it: /store $SPEC_NAME
2. Are there unsaved decisions? Document them
3. Then proceed with /clear
```

## Companion Commands

- `/resume $SPEC_NAME` - Load stored context and continue
- `/apply $SPEC_NAME` - Execute with parallel agents
- `/recall $SPEC_NAME` - View learnings from archived specs
