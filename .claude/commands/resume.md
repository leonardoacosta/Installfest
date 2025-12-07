# Resume Specification from Stored Context

When the user runs `/resume $SPEC_NAME`:

## Load Current State

```bash
# Verify spec exists
ls openspec/changes/$SPEC_NAME/

# Load proposal and tasks
cat openspec/changes/$SPEC_NAME/proposal.md
cat openspec/changes/$SPEC_NAME/tasks.md

# Check current git state
git status --short
git log -1 --oneline
```

---

## Context Restoration

Analyze the tasks.md to determine current progress:

```
Resuming: $SPEC_NAME

Feature: [summary from proposal.md]

Progress:
[For each phase/group in tasks.md]
- [status icon] Phase 1: [complete/in_progress/pending]
- [status icon] Phase 2: [complete/in_progress/pending]
- [status icon] Phase 3: [complete/in_progress/pending]
- [status icon] Phase 4: [complete/in_progress/pending]

Next Step: [first incomplete task]
```

---

## Determine Resume Point

Based on tasks.md, identify where to continue:

### If Phase 1 (Foundation) incomplete:
```
Resume Point: Phase 1 - Foundation

Remaining tasks:
- [incomplete foundation tasks]

Continue with: /parallel-apply $SPEC_NAME
```

### If Phase 2 (API) incomplete:
```
Resume Point: Phase 2 - API Layer

Foundation complete
API Layer in progress

Remaining tasks:
- [incomplete API tasks]

Continue with: /parallel-apply $SPEC_NAME
```

### If Phase 3 (UI) incomplete:
```
Resume Point: Phase 3 - UI Components

Foundation complete
API Layer complete
UI Components in progress

Remaining tasks:
- [incomplete UI tasks]

Continue with: /parallel-apply $SPEC_NAME
```

### If Phase 4 (Tests) incomplete:
```
Resume Point: Phase 4 - Tests

Foundation complete
API Layer complete
UI Components complete
Tests in progress

Remaining tasks:
- [incomplete test tasks]

Continue with: /parallel-apply $SPEC_NAME
```

### If All Phases complete:
```
Resume Point: Ready to Archive

All phases complete!

Final validation needed. Run:
/archive $SPEC_NAME
```

---

## No Spec Found

If spec doesn't exist:

```
No specification found for: $SPEC_NAME

Possible reasons:
1. Spec name is misspelled
2. Spec was already archived
3. Spec was never created

Available options:

1. Check active specs:
   ls openspec/changes/

2. Check archived specs:
   ls openspec/archive/

3. Create new spec:
   /openspec:proposal [description]
```

---

## Auto-Resume Option

For seamless continuation, user can run:

`/resume $SPEC_NAME --continue`

This will:
1. Load context
2. Display brief summary
3. Automatically run `/parallel-apply $SPEC_NAME`

```
Auto-resuming $SPEC_NAME...

Phase [X] of 4
Continuing with /parallel-apply $SPEC_NAME

---
[Proceeds to parallel-apply]
```
