# Store Context Before Clear

When I say `/store-context $SPEC_NAME`:

1. Save current planning state to claude-flow memory:
```
  mcp__claude-flow__memory_store {
    key: "$SPEC_NAME-plan",
    value: {
    feature: "$SPEC_NAME",
    storedAt: "{{timestamp}}",
    currentPhase: "{{1-4}}",
    tasksRemaining: [...],
    decisions: [...]
    }
  }
```
2. Confirm: "Context stored. Safe to /clear."
