# Parallel Apply

When I say `/parallel-apply [spec-id]`:

Execute OpenSpec tasks with parallel batching for maximum efficiency.

## Process

### 1. Load Tasks
```bash
openspec show [spec-id] --tasks
```

Parse tasks.md to identify:
- Task groups (marked with `[parallel:groupN]`)
- Dependencies (marked with `(depends: X.Y)`)
- Sequential tasks (no parallel marker)

### 2. Build Execution Plan

Create batches of independent tasks:

```
Batch 1: [1.1, 1.2, 1.3] - parallel
Batch 2: [2.1] - sequential (depends on batch 1)
Batch 3: [3.1, 3.2] - parallel
```

### 3. Execute Batches

For each batch:
- If parallel: Execute all tasks in single message with multiple tool calls
- If sequential: Execute one at a time

Example parallel execution:
```
User: Apply batch 1
Claude: [Uses Write tool for 1.1] [Uses Write tool for 1.2] [Uses Write tool for 1.3]
```

### 4. Update Task Status

After each batch completes:
- Mark completed tasks as `- [x]`
- Update tasks.md file

## Task Markers

In tasks.md, use these markers:

```markdown
## Phase 1
- [ ] 1.1 Create file A [parallel:1]
- [ ] 1.2 Create file B [parallel:1]
- [ ] 1.3 Create file C [parallel:1]

## Phase 2
- [ ] 2.1 Update file A (depends: 1.1)
- [ ] 2.2 Update file B (depends: 1.2)
```

## Benefits

- 3x speedup on independent tasks
- Reduced token usage (fewer round trips)
- Clear dependency tracking

## Rules

1. Never parallelize tasks with dependencies
2. Maximum 5 tasks per parallel batch
3. Validate each task before marking complete
4. Stop on first failure in batch

## Output

```
Parallel Apply: centralized-claude-config
=========================================
Batch 1: 1.1, 1.2, 1.3 → ✅ Complete (3 tasks)
Batch 2: 2.1 → ✅ Complete (1 task)
Batch 3: 3.1, 3.2 → ❌ Failed (3.2 had errors)

Progress: 4/6 tasks complete
Remaining: 3.1 (retry), 3.2 (blocked)
```
