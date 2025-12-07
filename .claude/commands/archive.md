# Archive Specification with Knowledge Capture

When the user runs `/archive $SPEC_NAME`:

## Pre-Archive Validation

First, verify the specification is complete:

```bash
# Verify all systems green
pnpm tsc --noEmit
pnpm build
pnpm test

# Check tasks.md completion
cat openspec/changes/$SPEC_NAME/tasks.md
```

### Validation Gates

**STOP if ANY of these fail:**

1. **TypeScript Check**: `pnpm tsc --noEmit` must exit 0
2. **Build Check**: `pnpm build` must exit 0
3. **Test Check**: `pnpm test` must exit 0
4. **Tasks Check**: All items in tasks.md must be marked `[x]` complete

If validation fails:
```
Cannot archive $SPEC_NAME - validation failed:
- TypeScript: [PASS/FAIL]
- Build: [PASS/FAIL]
- Tests: [PASS/FAIL]
- Tasks: [X of Y complete]

Run `/parallel-apply $SPEC_NAME` to complete remaining work.
```

---

## Archive Execution

Run the OpenSpec archive command:

```bash
# Archive the specification
cd openspec && openspec archive $SPEC_NAME

# Verify archive completed
ls openspec/archive/$SPEC_NAME/
ls openspec/changes/ | grep -v $SPEC_NAME || echo 'Changes directory clean'
```

---

## Archive Confirmation

```
Specification $SPEC_NAME archived successfully!

Archive Location: openspec/archive/$SPEC_NAME/

Summary:
- Files created: [count]
- Tests added: [count]
- Build status: Passing
- Test status: Passing

---

Next steps:
- View archive: cat openspec/archive/$SPEC_NAME/proposal.md
- Start new feature: /openspec:proposal [description]
- Review learnings: /recall $SPEC_NAME
```

---

## Error Recovery

If archive fails for any reason:

```
Archive failed: [error message]

Recovery options:
1. Fix issue and retry: /archive $SPEC_NAME
2. Force archive (skip validation): /archive $SPEC_NAME --force
3. Abandon and cleanup: /abandon $SPEC_NAME
```

For `--force` flag (use sparingly):
```
Force archiving without full validation.
This should only be used when:
- Tests are intentionally skipped
- Build issues are known and tracked
- Manual verification has been done

Proceeding with force archive...
```
