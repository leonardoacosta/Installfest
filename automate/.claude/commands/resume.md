# Resume Specification from Stored Context

When the user runs `/resume $SPEC_NAME`:

## Load Stored Context

```
[BatchTool]:
// Retrieve stored planning context
- mcp__claude-flow__memory_retrieve { key: "$SPEC_NAME-plan" }

// Also check for quick save
- mcp__claude-flow__memory_retrieve { key: "$SPEC_NAME-quick" }

// Verify spec still exists
- Bash("ls openspec/changes/$SPEC_NAME/ 2>/dev/null || echo 'SPEC_NOT_FOUND'")

// Check current git state
- Bash("git status --short")
- Bash("git log -1 --oneline")
```

---

## Context Restoration

If context found, display summary:

```
🔄 Resuming: $SPEC_NAME

📋 Feature: {{proposalSummary}}

📊 Progress:
{{for each parallelGroup}}
- {{status_icon}} {{group.name}}: {{group.status}}
  {{for each task in group.tasks}}
  - {{task}}
  {{end}}
{{end}}

🔑 Key Decisions Made:
{{for each decision}}
- {{decision}}
{{end}}

❓ Open Questions:
{{for each question}}
- {{question}}
{{end}}

📁 Files Being Modified:
{{for each file in fileOwnership}}
- {{file}} (owned by {{agent}})
{{end}}

⏭️ Next Step: {{resumeInstructions}}
```

---

## Determine Resume Point

Based on stored context, identify where to continue:

### If Phase 1 (Foundation) incomplete:
```
📍 Resume Point: Phase 1 - Foundation

Remaining tasks:
- {{incomplete foundation tasks}}

Continue with: /apply-batch $SPEC_NAME

The batch command will detect Phase 1 is incomplete and resume there.
```

### If Phase 2 (API) incomplete:
```
📍 Resume Point: Phase 2 - API Layer

✅ Foundation complete
🔄 API Layer in progress

Remaining tasks:
- {{incomplete API tasks}}

Continue with: /apply-batch $SPEC_NAME
```

### If Phase 3 (UI) incomplete:
```
📍 Resume Point: Phase 3 - UI Components

✅ Foundation complete
✅ API Layer complete
🔄 UI Components in progress

Remaining tasks:
- {{incomplete UI tasks}}

Continue with: /apply-batch $SPEC_NAME
```

### If Phase 4 (Tests) incomplete:
```
📍 Resume Point: Phase 4 - Tests

✅ Foundation complete
✅ API Layer complete
✅ UI Components complete
🔄 Tests in progress

Remaining tasks:
- {{incomplete test tasks}}

Continue with: /apply-batch $SPEC_NAME
```

### If All Phases complete:
```
📍 Resume Point: Ready to Archive

✅ All phases complete!

Final validation needed. Run:
/archive $SPEC_NAME
```

---

## No Context Found

If memory retrieval returns empty:

```
⚠️ No stored context found for: $SPEC_NAME

Possible reasons:
1. Context was never stored (use /store-context before /clear)
2. Context was cleared after archiving
3. Spec name is misspelled

Available options:

1. Check if spec exists:
   ls openspec/changes/

2. Start fresh (will analyze current state):
   /apply-batch $SPEC_NAME

3. View all stored contexts:
   /list-contexts
```

---

## Git State Check

Before resuming, verify git state matches:

```
Stored git commit: {{gitCommit}}
Current git commit: {{current_commit}}

{{if commits_match}}
✅ Git state matches - safe to resume
{{else}}
⚠️ Git state has changed since context was stored

Changes since stored:
{{git log --oneline stored_commit..HEAD}}

Options:
1. Continue anyway (recommended if changes are unrelated)
2. Review changes first: git diff {{stored_commit}}
3. Reset to stored state: git checkout {{stored_commit}}
{{end}}
```

---

## Auto-Resume Option

For seamless continuation, user can run:

`/resume $SPEC_NAME --continue`

This will:
1. Load context
2. Display brief summary
3. Automatically run `/apply-batch $SPEC_NAME`

```
🔄 Auto-resuming $SPEC_NAME...

📍 Phase {{X}} of 4
⏭️ Continuing with /apply-batch $SPEC_NAME

---
[Proceeds to apply-batch]
```
