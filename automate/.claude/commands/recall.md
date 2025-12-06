# Recall Learnings from Past Specifications

When the user runs `/recall $SPEC_NAME`:

## Purpose

Retrieve stored learnings from completed specifications to:
- Understand patterns used in past features
- Avoid repeating mistakes
- Inform design decisions for similar features
- Review what files were created

---

## Retrieve Learnings

```
[BatchTool]:
- mcp__claude-flow__memory_retrieve { key: "$SPEC_NAME-learnings" }
```

---

## Display Format

If learnings found:

```
📚 Learnings from: $SPEC_NAME

📅 Completed: {{completedAt}}

---

📁 Files Created:
├── Schema: {{filesCreated.schema}}
├── Types: {{filesCreated.types}}
├── Router: {{filesCreated.router}}
├── Validation: {{filesCreated.validation}}
├── Components: {{filesCreated.components}}
├── Pages: {{filesCreated.pages}}
└── Tests: {{filesCreated.tests}}

---

🎨 Patterns Used:
{{for each pattern in patternsUsed}}
- {{pattern}}
{{end}}

---

⚠️ Issues Encountered:
{{for each issue in issuesEncountered}}
- {{issue}}
{{end}}

{{if no issues}}
✅ No significant issues encountered
{{end}}

---

🔗 Related Schemas:
{{for each schema in relatedSchemas}}
- {{schema}}
{{end}}

---

📊 Execution Stats:
- Parallel Groups: {{executionStats.parallelGroups}}
- Agents Spawned: {{executionStats.totalAgentsSpawned}}
- Build Validations: {{executionStats.buildValidationsPassed ? '✅ All passed' : '⚠️ Some failures'}}
```

---

## No Learnings Found

If memory retrieval returns empty:

```
⚠️ No learnings found for: $SPEC_NAME

Possible reasons:
1. Spec was never archived (learnings stored during /archive)
2. Spec name is misspelled
3. Learnings were manually cleared

Try:
- List all stored learnings: /recall --list
- Check archived specs: ls openspec/archive/
```

---

## List All Learnings

When user runs `/recall --list`:

```
[BatchTool]:
- mcp__claude-flow__memory_list { pattern: "*-learnings" }
```

Output:
```
📚 Stored Learnings:

{{for each learning}}
- {{spec_name}} (completed {{date}})
{{end}}

View specific: /recall [spec-name]
```

---

## Search Learnings by Pattern

When user runs `/recall --search $PATTERN`:

```
[BatchTool]:
- mcp__claude-flow__memory_search { 
    pattern: "*-learnings",
    filter: { patternsUsed: { contains: "$PATTERN" } }
  }
```

Example: `/recall --search "Drizzle relations"`

Output:
```
🔍 Specs using pattern: "Drizzle relations"

1. sponsors (completed 2025-12-01)
   - Used: Drizzle schema with relations, tRPC protected procedures

2. hotels (completed 2025-12-05)
   - Used: Drizzle relations, room block management

View details: /recall [spec-name]
```

---

## Export Learnings

When user runs `/recall $SPEC_NAME --export`:

Create a markdown file with all learnings:

```
[BatchTool]:
- mcp__claude-flow__memory_retrieve { key: "$SPEC_NAME-learnings" }
- Write("docs/learnings/$SPEC_NAME.md", formattedLearnings)
```

Output:
```
📄 Exported learnings to: docs/learnings/$SPEC_NAME.md
```

---

## Apply Learnings to New Spec

When working on a similar feature, reference past learnings:

```
I'm working on a new feature similar to $SPEC_NAME. 
Based on the learnings:

📋 Recommended Approach:
1. Use these patterns: {{patternsUsed}}
2. Avoid these issues: {{issuesEncountered}}
3. Consider relations to: {{relatedSchemas}}

Would you like me to structure the new spec similarly?
```
