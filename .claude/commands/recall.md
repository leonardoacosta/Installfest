# Recall Learnings from Past Specifications

When the user runs `/recall $SPEC_NAME`:

Retrieve stored learnings from completed specifications using claude-flow memory.

## Step 1: Retrieve from Memory

First, try to load learnings from persistent memory:

```
mcp__claude-flow__memory_retrieve { key: "$SPEC_NAME-learnings" }
```

## Step 2: Display Learnings

If learnings found in memory:

```
Learnings from: $SPEC_NAME

Archived: [date from learnings]

---

Summary:
[summary from stored learnings]

---

Files Created:
[For each file in filesCreated]
- [path]: [purpose]

---

Patterns Used:
[For each pattern in patterns]
- [pattern]

---

Key Decisions:
[For each decision in decisions]
- [decision]

---

Issues & Solutions:
[For each issue in issues]
- Problem: [problem]
  Solution: [solution]

---

Related Specs:
[For each spec in relatedSpecs]
- [spec name]
```

## Step 3: Fallback to Files

If no learnings in memory, check archived files:

```bash
# Check archived specs
ls openspec/archive/$SPEC_NAME/

# Read the archived proposal
cat openspec/archive/$SPEC_NAME/proposal.md

# Read the archived tasks
cat openspec/archive/$SPEC_NAME/tasks.md
```

Display file-based learnings if found.

## No Learnings Found

If neither memory nor files exist:

```
No learnings found for: $SPEC_NAME

Checked:
1. claude-flow memory (key: $SPEC_NAME-learnings)
2. openspec/archive/$SPEC_NAME/

Possible reasons:
- Spec was never archived (use /archive first)
- Spec name is misspelled
- Spec is still in progress

Try:
- List stored learnings: /recall --list
- List active specs: ls openspec/changes/
```

## List All Stored Learnings

When user runs `/recall --list`:

```
mcp__claude-flow__memory_list { pattern: "*-learnings" }
```

Also check file system:
```bash
ls openspec/archive/
```

Output:
```
Stored Learnings:

From Memory:
- spec-name-1 (archived [date])
- spec-name-2 (archived [date])

From Files:
- spec-name-3 (openspec/archive/)

View specific: /recall [spec-name]
```

## Search Learnings

When user runs `/recall --search [pattern]`:

```
mcp__claude-flow__memory_search { pattern: "[pattern]" }
```

Output:
```
Search Results for: [pattern]

Matching Learnings:

1. spec-name-1:
   - Pattern: [matching pattern]
   - Decision: [matching decision]

2. spec-name-2:
   - Issue: [matching issue]
   - Solution: [matching solution]

View full: /recall [spec-name]
```

## Apply Learnings to New Spec

When working on a similar feature, reference past learnings:

```
I'm working on a new feature similar to $SPEC_NAME.

Based on the learnings:

Recommended Approach:
1. Use these patterns: [patterns from learnings]
2. Consider relations to: [related specs]
3. Watch out for: [issues encountered]

Would you like me to structure the new spec similarly?
```

## Companion Commands

- `/archive $SPEC_NAME` - Archive spec and store learnings
- `/feature [description]` - Start a new feature
- `/resume $SPEC_NAME` - Resume in-progress work
