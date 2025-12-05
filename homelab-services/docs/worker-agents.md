# Worker Agent Coordination

Worker agents are specialized sub-agents spawned by Claude Code sessions to autonomously implement approved OpenSpec changes. This document describes the worker agent system architecture, agent types, and workflows.

## Overview

The worker agent system enables parallel, autonomous implementation work by spawning specialized agents via Claude Code's Task tool. Each worker is assigned to a specific OpenSpec specification and monitored for progress, completion, and failures.

## Architecture

### Components

1. **WorkerAgentService** (`packages/api/src/services/worker-agent.ts`)
   - Spawns workers via Task tool
   - Builds worker prompts from spec content
   - Manages worker lifecycle (spawn, cancel, complete, fail)
   - Implements retry logic with fallback strategies

2. **WorkerSelectorService** (`packages/api/src/services/worker-selector.ts`)
   - Analyzes spec content keywords
   - Selects best agent type for implementation
   - Returns confidence score and reasoning

3. **WorkerMonitorService** (`packages/api/src/services/worker-monitor.ts`)
   - Tracks progress via hook analysis
   - Detects completion and failure signals
   - Calculates metrics (files changed, tests run, etc.)
   - Triggers lifecycle transitions

4. **WorkerEventEmitter** (`packages/api/src/events.ts`)
   - Publishes real-time worker events
   - Supports tRPC subscriptions for dashboard updates

## Agent Types

The system supports 14 specialized agent types, selected automatically based on spec content:

| Agent Type | Keywords | Use Case |
|------------|----------|----------|
| **t3-stack-developer** | trpc, t3, typescript, react, nextjs | Full-stack T3 development |
| **e2e-test-engineer** | test, e2e, playwright, vitest | End-to-end testing |
| **database-architect** | database, schema, migration, drizzle, sql | Database design and migrations |
| **ux-design-specialist** | ui, ux, design, component, shadcn | UI/UX design and implementation |
| **docker-network-architect** | docker, compose, container, network | Docker orchestration |
| **redis-cache-architect** | redis, cache, upstash, performance | Caching strategies |
| **nextjs-frontend-specialist** | nextjs, frontend, app router | Next.js frontend work |
| **trpc-backend-engineer** | trpc, api, backend, server | tRPC API development |
| **csharp-infrastructure-consultant** | c#, csharp, .net, infrastructure | C# architecture analysis |
| **accessible-ui-designer** | accessibility, a11y, wcag, aria | Accessible UI design |
| **azure-bicep-architect** | azure, bicep, infrastructure | Azure cloud architecture |
| **sdlc-manager** | jira, sprint, project management | Project coordination |
| **general-purpose** | (fallback) | Generic implementation work |

### Agent Selection Logic

The `WorkerSelectorService` analyzes three sources:
- **Proposal Content**: Why section and description
- **Tasks Content**: Implementation checklist
- **Design Content**: Technical design details

Selection algorithm:
1. Extract and lowercase all content
2. Count keyword matches per agent type
3. Score agents by match count
4. Return highest-scoring agent with confidence level:
   - `high`: 5+ keyword matches
   - `medium`: 3-4 keyword matches
   - `low`: 1-2 keyword matches

## Worker Lifecycle

```
┌─────────┐  spawn   ┌─────────┐  first hook  ┌────────┐  completion  ┌───────────┐
│ spawned ├─────────>│ spawned ├────────────->│ active ├────────────->│ completed │
└─────────┘          └─────────┘              └────┬───┘              └───────────┘
                                                    │
                                               failure│
                                                    ↓
                                              ┌─────────┐  retry  ┌─────────┐
                                              │ failed  ├────────>│ spawned │
                                              └─────────┘         └─────────┘
                                                                  (retryCount+1)
```

### Status Transitions

1. **spawned** → **active**: First hook event received
2. **active** → **completed**: Completion signal detected or all tasks marked `[x]`
3. **active** → **failed**: Error detected or 20-minute timeout
4. **failed** → **spawned**: Automatic retry (up to 3 attempts)
5. **any** → **cancelled**: Manual cancellation or session stop

## Worker Spawning

### Spawn Request

```typescript
await trpc.workerAgent.spawn.mutate({
  sessionId: number,     // Active Claude Code session
  specId: string,        // OpenSpec specification ID
  agentType?: AgentType  // Optional: override auto-selection
});
```

### Worker Prompt Structure

Workers receive a detailed prompt with:
- **Spec Title and ID**
- **Why This Change**: Motivation from proposal
- **What Changes**: Implementation scope
- **Tasks to Complete**: Full checklist with `[ ]` markers
- **Design Details**: Technical specifications (if available)
- **Instructions**: Step-by-step guidance
- **Project Paths**: Key directories and files

Example:
```markdown
# Worker Agent Task: Add User Authentication

**Spec ID**: auth-001
**Agent Type**: t3-stack-developer

## Why This Change

Users need secure login to access protected features...

## What Changes

- Add Better-Auth integration
- Create user sessions table
- Implement login/logout flows

## Tasks to Complete

- [ ] Install Better-Auth package
- [ ] Create auth schema in packages/db
- [ ] Add tRPC auth router
- [ ] Build login UI component

## Instructions

1. Read and understand all tasks listed above
2. Complete each task marked with `[ ]`
3. Update task checkboxes to `[x]` as you complete them
4. Test your changes thoroughly
...
```

## Progress Monitoring

### Hook Analysis

Worker progress is tracked by analyzing hook events:

**Metrics Calculated:**
- **toolsExecuted**: Total hook count
- **successRate**: Percentage of successful hooks
- **filesChanged**: Unique file paths from Edit/Write tools
- **testsRun**: Count of test executions (detected via Bash tool patterns)
- **testsPassed**: Count of successful test runs
- **elapsedMs**: Time from spawn to completion
- **lastActivityAt**: Timestamp of most recent hook
- **currentTool**: Currently executing tool

**Completion Detection:**
- Completion signal in hook output ("all tasks complete", "implementation complete", etc.)
- All tasks marked `[x]` in tasks.md (future enhancement)
- 10+ minutes idle AND tasks complete

**Failure Detection:**
- Hook with `success: false` and error message
- 20+ minutes idle (timeout)
- Failed Bash tool execution

## Retry Logic

### Retry Strategy

Workers automatically retry on failure with this progression:

| Retry Count | Strategy |
|-------------|----------|
| 0 (1st attempt) | Use selected agent type |
| 1 (2nd attempt) | Use same agent type |
| 2 (3rd attempt) | Use same agent type |
| 3 (4th attempt) | Fallback to `general-purpose` |
| 4+ | Return null (manual intervention required) |

### Retry Prompt

Retry attempts include:
- **Previous Failure Context**: Error message from failed worker
- **Retry Attempt Number**: Current attempt count
- **Original Prompt**: Full spec content and instructions

### Manual Override

Force a specific agent type for retry:
```typescript
await trpc.workerAgent.retry.mutate({
  workerId: string,
  forceAgentType?: AgentType  // Override automatic selection
});
```

## Real-Time Updates

### Worker Events

The system emits events via `WorkerEventEmitter`:

```typescript
type WorkerEvent = {
  event: 'worker_spawned' | 'worker_started' | 'worker_progress'
       | 'worker_completed' | 'worker_failed';
  workerId: string;
  status: string;
  timestamp: Date;
  data?: {
    sessionId?: number;
    specId?: string;
    agentType?: string;
    errorMessage?: string;
    // ... additional context
  };
};
```

### Subscription

Frontend subscribes to worker events:
```typescript
trpc.workerAgent.subscribe.useSubscription(
  { sessionId, specId, projectId },
  {
    onData: (event) => {
      // Update UI based on event type
      switch (event.event) {
        case 'worker_spawned':
          toast({ title: 'Worker Spawned', ... });
          break;
        case 'worker_completed':
          toast({ title: 'Worker Completed', ... });
          break;
        // ...
      }
    }
  }
);
```

## Dashboard UI

### Worker Grid (`WorkerGrid.tsx`)

Displays all active workers in responsive grid:
- **Status badges**: Color-coded by worker status
- **Progress indicators**: Task completion percentage
- **Time tracking**: Elapsed time since spawn
- **Retry count**: Visual indicator for retry attempts
- **Actions**: View details, retry, cancel

**Status Colors:**
- Green: `active` (working)
- Yellow: `active` but idle 5+ minutes
- Red: `failed`
- Gray: `completed` or `cancelled`

### Worker Detail Modal (`WorkerDetailModal.tsx`)

Shows detailed worker information:
- **Header**: Worker ID, type, spec, status
- **Progress Metrics**: Tools executed, files changed, tests run
- **Hook Timeline**: Last 20 hook events with timestamps
- **Error Details**: Stack trace and error messages (if failed)
- **Actions**: Retry, cancel, view spec

## Integration with Sessions

### Session Stop

When a session stops, all associated workers are automatically cancelled:
```typescript
// packages/api/src/router/sessions.ts
const activeWorkers = await db.select()
  .from(workerAgents)
  .where(eq(workerAgents.sessionId, sessionId));

for (const worker of activeWorkers) {
  if (['spawned', 'active'].includes(worker.status)) {
    await workerService.cancelWorker(worker.id);
  }
}
```

### Spec Lifecycle

Worker completion triggers spec lifecycle transitions:
```
assigned → in_progress → review
```

On `worker_completed`:
1. Transition spec from `assigned` to `in_progress` (if needed)
2. Transition to `review` state
3. Emit `spec_ready_for_review` notification

## API Reference

### tRPC Procedures

**Mutations:**
- `workerAgent.spawn`: Create new worker
- `workerAgent.cancel`: Stop active worker
- `workerAgent.retry`: Retry failed worker

**Queries:**
- `workerAgent.getStatus`: Get worker record
- `workerAgent.getProgress`: Get progress metrics
- `workerAgent.listActive`: List workers with filters
- `workerAgent.getHookTimeline`: Get hook history

**Subscriptions:**
- `workerAgent.subscribe`: Real-time event stream

## Testing

### Unit Tests

Test files in `packages/api/src/services/__tests__/`:
- `worker-selector.test.ts`: Agent selection logic (10 tests)
- `worker-monitor.test.ts`: Progress metrics calculation (23 tests)
- `worker-retry.test.ts`: Retry logic and fallback (14 tests)

Run tests:
```bash
cd packages/api
bun test src/services/__tests__/
```

## Troubleshooting

### Worker Not Starting

**Symptom**: Worker status stuck at `spawned`

**Causes**:
- Task tool not available
- Mock mode enabled without actual implementation
- Session has no hooks

**Solution**:
- Check Task tool availability
- Verify session is running and generating hooks
- Review worker logs for Task tool errors

### Worker Timeout

**Symptom**: Worker marked `failed` after 20 minutes

**Causes**:
- Worker stuck on long-running operation
- No hook activity (worker idle)

**Solution**:
- Review last hook output for errors
- Check if worker needs manual intervention
- Retry with different agent type

### Retry Loop

**Symptom**: Multiple failed retries

**Causes**:
- Spec is too complex for automated implementation
- Missing dependencies or environment issues
- Incorrect agent type selection

**Solution**:
- Review error messages from each attempt
- Force retry with `general-purpose` agent
- Break spec into smaller, focused changes
- Implement manually if automated retry fails

### Progress Not Updating

**Symptom**: Dashboard shows stale progress

**Causes**:
- Subscription disconnected
- Hook events not being emitted
- Frontend polling disabled

**Solution**:
- Check browser console for subscription errors
- Verify workerEvents.emit() calls in service
- Enable polling fallback (10-second interval)

## Best Practices

### Writing Worker-Friendly Specs

1. **Clear Tasks**: Use explicit `[ ]` checkboxes
2. **Specific Keywords**: Include technology names (e.g., "tRPC", "Playwright")
3. **Scoped Work**: Keep changes focused and bounded
4. **Test Instructions**: Include testing steps in tasks

### Agent Selection

1. **Let System Choose**: Default auto-selection works well
2. **Override When Needed**: Use `forceAgentType` for edge cases
3. **Review Reasoning**: Check selection logs for confidence
4. **Refine Specs**: Add keywords if wrong agent selected

### Monitoring

1. **Watch Dashboard**: Real-time updates show progress
2. **Check Hook Timeline**: Diagnose stuck or slow workers
3. **Review Metrics**: Track files changed and tests run
4. **Set Expectations**: Workers take time for complex changes

## Future Enhancements

Planned improvements:
- Parse tasks.md for completion percentage
- Multi-worker coordination for large changes
- Learning-based agent selection
- Automatic spec breakdown for complex changes
- Integration with GitHub PR creation
- Worker performance analytics

## Related Documentation

- [Architecture Guide](./architecture.md) - Overall system design
- [Database Package](./packages/db.md) - Worker schema
- [API Package](./architecture.md#3-api-layer-trpc) - tRPC routers
- [OpenSpec Specifications](../../openspec/specs/) - Formal specs

---

**Last Updated**: 2025-12-04
