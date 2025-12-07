# Store Context Before Clear

When the user runs `/store-context $SPEC_NAME` (or before any `/clear`):

## Purpose

Persist the current planning context so it survives:
- `/clear` commands
- Session restarts
- Context window limits
- Multi-day development breaks

---

## Automatic Context Gathering

Analyze the current conversation and gather:

```bash
# Read current spec state
cat openspec/changes/$SPEC_NAME/proposal.md
cat openspec/changes/$SPEC_NAME/tasks.md

# Check for any spec deltas
ls openspec/changes/$SPEC_NAME/spec-deltas/ 2>/dev/null || echo 'No deltas'

# Get current project state
git status --short
git log -1 --oneline
```

---

## Context Summary

Prepare a comprehensive context summary:

```
Storing context for: $SPEC_NAME

Feature Summary: [2-3 sentence summary of proposal.md]

Current Phase: [1-4 based on tasks.md progress]

Parallel Groups:
- Group 1 (Foundation): [pending|in_progress|completed]
- Group 2 (API Layer): [pending|in_progress|completed]
- Group 3 (UI Components): [pending|in_progress|completed]
- Group 4 (Tests): [pending|in_progress|completed]

Key Decisions Made:
- [key decision 1 from conversation]
- [key decision 2 from conversation]

Open Questions:
- [any unresolved questions]

Files Being Modified:
- [list of files currently being worked on]

Resume Instructions: Run /resume $SPEC_NAME to continue from current phase
```

---

## Confirmation Output

```
Context stored for $SPEC_NAME

Stored:
- Proposal summary
- [X] parallel groups with [Y] total tasks
- Completion criteria
- [Z] key decisions

---

Safe to clear context now: /clear

To resume later:
1. Start new session
2. Run: /resume $SPEC_NAME
   (or manually: /parallel-apply $SPEC_NAME)
```

---

## Quick Store (Minimal Context)

For quick saves when you just need to preserve state:

When user runs `/store-context $SPEC_NAME --quick`:

```
Quick context stored for $SPEC_NAME

Current Phase: [X]
Last Action: [what was just completed]
Next Action: [what to do next]
Blockers: [any blockers]

Resume: /parallel-apply $SPEC_NAME (Phase [X])
```

---

## Pre-Clear Hook Integration

This command should be suggested before `/clear`:

```
IMPORTANT: Before running /clear, ALWAYS:
1. Ask user: "Store context for [current spec] before clearing?"
2. If yes, run /store-context [spec-name]
3. Then proceed with /clear
```

---

## Companion Commands

These commands pair with store-context:

- `/resume $SPEC_NAME` - Load stored context and show progress
- `/parallel-apply $SPEC_NAME` - Continue implementation
- `/recall $SPEC_NAME` - View learnings from archived specs
- `/archive $SPEC_NAME` - Archive completed spec
