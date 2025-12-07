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

Check for stored context and archived specifications:

```bash
# Check archived specs
ls openspec/archive/$SPEC_NAME/

# Read the archived proposal
cat openspec/archive/$SPEC_NAME/proposal.md

# Read the archived tasks
cat openspec/archive/$SPEC_NAME/tasks.md
```

---

## Display Format

If learnings found:

```
Learnings from: $SPEC_NAME

Completed: [date from archive]

---

Files Created:
[List files from tasks.md]

---

Patterns Used:
[List patterns identified from proposal.md]

---

Related Schemas/Features:
[List any related specs mentioned]
```

---

## No Learnings Found

If archive doesn't exist:

```
No learnings found for: $SPEC_NAME

Possible reasons:
1. Spec was never archived (use /archive first)
2. Spec name is misspelled
3. Spec is still in progress (check openspec/changes/)

Try:
- List archived specs: ls openspec/archive/
- List active specs: ls openspec/changes/
```

---

## List All Archived Specs

When user runs `/recall --list`:

```bash
ls openspec/archive/
```

Output:
```
Archived Specifications:

- spec-name-1 (archived [date])
- spec-name-2 (archived [date])

View specific: /recall [spec-name]
```

---

## Apply Learnings to New Spec

When working on a similar feature, reference past learnings:

```
I'm working on a new feature similar to $SPEC_NAME.
Based on the learnings:

Recommended Approach:
1. Use these patterns: [patterns from archive]
2. Consider relations to: [related schemas]

Would you like me to structure the new spec similarly?
```
