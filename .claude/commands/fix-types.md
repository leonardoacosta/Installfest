# Fix TypeScript Errors

When I say `/fix-types`:

1. Run TypeScript compiler to find all errors:
```bash
npx tsc --noEmit 2>&1 | head -100
```

2. Parse the output to identify:
   - File path and line number
   - Error code (e.g., TS2322, TS2345)
   - Error message

3. Group errors by file and fix in order:
   - Start with files that have the most errors
   - Fix related errors together (same type issue)

4. For each error:
   - Read the file context (10 lines around the error)
   - Identify the root cause
   - Apply the minimal fix
   - Verify the fix resolved the error

5. After fixing all errors, run typecheck again to confirm:
```bash
npx tsc --noEmit
```

## Common Fix Patterns

### TS2322: Type not assignable
- Check if type narrowing is needed
- Verify the expected type matches
- Consider using type assertion as last resort

### TS2345: Argument not assignable
- Check function signature
- Verify input matches parameter type
- Consider optional parameters

### TS2339: Property does not exist
- Check if property exists on the type
- Consider using optional chaining
- Verify import is correct

### TS2304: Cannot find name
- Check imports
- Verify package is installed
- Check for typos

## Output

After completion, report:
- Total errors found
- Errors fixed
- Remaining errors (if any) with explanation
