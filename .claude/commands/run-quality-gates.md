# Run Quality Gates

When I say `/run-quality-gates`:

Execute all quality checks in order. Stop on first failure unless `--continue` flag is provided.

## Checks

### 1. TypeScript Compilation
```bash
pnpm typecheck || npx tsc --noEmit
```
- Must pass with zero errors
- Warnings are acceptable

### 2. Build
```bash
pnpm build
```
- Must complete successfully
- Check for build warnings

### 3. Tests
```bash
pnpm test
```
- All tests must pass
- Coverage thresholds must be met (if configured)

### 4. Linting
```bash
pnpm lint
```
- No errors allowed
- Warnings should be reviewed

## Options

- `--continue`: Run all checks even if one fails
- `--fix`: Attempt to auto-fix linting issues
- `--skip-tests`: Skip test execution (for quick checks)

## Output Format

```
Quality Gates Report
====================
✅ TypeScript: PASS (0 errors)
✅ Build: PASS (2.3s)
❌ Tests: FAIL (3 failed, 47 passed)
⏭️ Linting: SKIPPED (tests failed)

Overall: FAIL
```

## On Failure

If any check fails:
1. Show the relevant error output
2. Suggest fixes if possible
3. Do NOT proceed with commits or pushes

## Common Issues

### Build Fails
- Check for missing dependencies: `pnpm install`
- Clear cache: `rm -rf .next` or `rm -rf dist`

### Tests Fail
- Run failed tests in isolation
- Check for environment issues
- Review recent changes

### Lint Errors
- Try auto-fix: `pnpm lint --fix`
- Review remaining manual fixes
