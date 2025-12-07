# Resume Specification from Persistent Memory

When the user runs `/resume $SPEC_NAME`:

Load stored context from claude-flow memory and continue execution.

## Step 1: Retrieve Stored Context

First, try to load from persistent memory:

```
mcp__claude-flow__memory_retrieve { key: "$SPEC_NAME-context" }
```

If no stored context found, fall back to file-based recovery.

## Step 2: Display Progress Summary

If context was retrieved from memory:

```
Resuming: $SPEC_NAME

Feature: [summary from stored context]

Progress:
✅ Phase 1 (Foundation): [X/Y tasks]
⏳ Phase 2 (API Layer): [X/Y tasks]
⬜ Phase 3 (UI Layer): [X/Y tasks]
⬜ Phase 4 (Quality): [X/Y tasks]

Key Decisions:
- [decision 1 from stored context]
- [decision 2 from stored context]

Blockers:
- [any blockers from stored context]

Last stored: [timestamp]
```

## Step 3: Load Specification Files

Read current file state to validate against stored context:

```bash
# Verify spec still exists
ls openspec/changes/$SPEC_NAME/

# Load current files
cat openspec/changes/$SPEC_NAME/proposal.md
cat openspec/changes/$SPEC_NAME/tasks.md
cat openspec/changes/$SPEC_NAME/MULTI_AGENT_PLAN.md 2>/dev/null || echo 'No plan'

# Check git state
git status --short
```

## Step 4: Determine Resume Point

Compare stored context with current file state:

### If Phase 1 (Foundation) incomplete:
```
Resume Point: Phase 1 - Foundation

Remaining tasks:
- [incomplete foundation tasks]

Continue: /apply $SPEC_NAME
```

### If Phase 2 (API Layer) incomplete:
```
Resume Point: Phase 2 - API Layer

✅ Foundation complete
⏳ API Layer in progress

Remaining tasks:
- [incomplete API tasks]

Continue: /apply $SPEC_NAME
```

### If Phase 3 (UI Layer) incomplete:
```
Resume Point: Phase 3 - UI Layer

✅ Foundation complete
✅ API Layer complete
⏳ UI Layer in progress

Remaining tasks:
- [incomplete UI tasks]

Continue: /apply $SPEC_NAME
```

### If Phase 4 (Quality) incomplete:
```
Resume Point: Phase 4 - Quality

✅ Foundation complete
✅ API Layer complete
✅ UI Layer complete
⏳ Quality in progress

Remaining tasks:
- [incomplete test tasks]

Continue: /apply $SPEC_NAME
```

### If All Phases complete:
```
Resume Point: Ready to Archive

All phases complete!

Validations needed:
- pnpm tsc --noEmit
- pnpm build
- pnpm test

Archive when ready: /archive $SPEC_NAME
```

## Step 5: No Context Found

If no stored context and no spec files exist:

```
No context found for: $SPEC_NAME

Checked:
1. claude-flow memory (key: $SPEC_NAME-context)
2. openspec/changes/$SPEC_NAME/

Possible reasons:
- Spec name is misspelled
- Spec was already archived
- Context was never stored

Available options:

1. List stored contexts:
   mcp__claude-flow__memory_list { pattern: "*-context" }

2. Check active specs:
   ls openspec/changes/

3. Check archived specs:
   ls openspec/archive/

4. Create new spec:
   /feature [description]
```

## Auto-Resume Option

For seamless continuation, user can run:

`/resume $SPEC_NAME --continue`

This will:
1. Load context from memory
2. Display brief summary
3. Automatically run `/apply $SPEC_NAME`

```
Auto-resuming $SPEC_NAME...

Phase [X] of 4 | [Y] tasks remaining
Continuing with /apply $SPEC_NAME

---
[Proceeds to apply]
```

## Companion Commands

- `/apply $SPEC_NAME` - Execute with parallel agents
- `/store $SPEC_NAME` - Save current progress
- `/archive $SPEC_NAME` - Archive completed spec
- `/recall $SPEC_NAME` - View learnings from archived specs
