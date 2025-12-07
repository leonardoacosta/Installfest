# Capability: Hook Validation

## Overview

Automated validation hooks that enforce quality gates during Claude Code development workflow.

## ADDED Requirements

### Requirement: Type-Checking on File Edit

The system SHALL run TypeScript type-checking when TypeScript files are modified.

#### Scenario: PostToolUse hook triggers on .ts file write

**Given** settings.json contains a PostToolUse hook for Write/Edit tools

**When** Claude Code writes or edits a file ending in `.ts` or `.tsx`

**Then** the hook SHALL execute `npx tsc --noEmit` in the project directory

**And** the hook SHALL capture the first 20 lines of output

**And** the hook SHALL display type errors to Claude Code

**And** the hook SHALL allow Claude Code to see errors without blocking the write operation

**Example settings.json:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(echo $CLAUDE_TOOL_INPUT | jq -r '.file_path // .path // empty'); if echo \"$FILE\" | grep -qE '\\.(ts|tsx)$'; then cd \"$CLAUDE_PROJECT_DIR\" && npx tsc --noEmit 2>&1 | head -20 || true; fi",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

#### Scenario: Non-TypeScript file skips typecheck

**Given** settings.json contains PostToolUse hook with file extension check

**When** Claude Code writes a file ending in `.md` or `.json`

**Then** the hook SHALL detect the file is not TypeScript

**And** the hook SHALL not execute `npx tsc`

**And** the hook SHALL complete immediately

### Requirement: Subagent Completion Verification

The system SHALL verify subagent work is complete before allowing exit.

#### Scenario: SubagentStop hook validates completion

**Given** settings.json contains a SubagentStop hook with completion verification

**When** a subagent attempts to exit

**Then** the hook SHALL prompt Claude Code to verify:
  1. All assigned work is done
  2. All files are created
  3. No TODO or FIXME placeholders remain

**And** the hook SHALL require a decision: "allow" or "block"

**And** if decision is "block", the hook SHALL provide specific continuation instructions

**And** if decision is "allow", the hook SHALL permit the subagent to exit

**Example settings.json:**
```json
{
  "hooks": {
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Verify subagent completed ALL tasks. Check: 1) All assigned work done? 2) All files created? 3) No TODO/FIXME placeholders? If incomplete: {\"decision\": \"block\", \"reason\": \"Continue: [specific instruction]\" }. If complete: {\"decision\": \"allow\"}"
          }
        ]
      }
    ]
  }
}
```

### Requirement: Quality Gates on Commit

The system SHALL run comprehensive quality checks before allowing git commits.

#### Scenario: PreCommit hook runs quality gates

**Given** settings.json contains a PreCommit hook

**When** Claude Code attempts to create a git commit

**Then** the hook SHALL execute `.claude/hooks/scripts/quality-gates.sh`

**And** the script SHALL run `pnpm typecheck` and capture errors

**And** the script SHALL run `pnpm lint` and capture errors

**And** the script SHALL run `pnpm build` and verify success

**And** the script SHALL run `pnpm test` and verify all tests pass

**And** if any check fails, the hook SHALL block the commit

**And** if all checks pass, the hook SHALL allow the commit

**Example settings.json:**
```json
{
  "hooks": {
    "PreCommit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/scripts/quality-gates.sh",
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```

### Requirement: Test Validation on Push

The system SHALL block git push if tests are failing.

#### Scenario: PrePush hook validates tests

**Given** settings.json contains a PrePush hook

**When** Claude Code attempts to push to remote

**Then** the hook SHALL execute `pnpm test`

**And** if tests fail, the hook SHALL block the push

**And** if tests pass, the hook SHALL allow the push

### Requirement: Permission Restrictions

The system SHALL prevent access to sensitive files.

#### Scenario: Deny access to .env files

**Given** settings.json contains permissions.deny rules for .env files

**When** Claude Code attempts to read `.env` or `.env.*` files

**Then** the permission check SHALL block the operation

**And** Claude Code SHALL receive an error message

**Example settings.json:**
```json
{
  "permissions": {
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Write(.env)",
      "Write(.env.*)"
    ]
  }
}
```

#### Scenario: Prevent --no-verify flag in git commands

**Given** settings.json contains permission.deny for Bash(*--no-verify*)

**When** Claude Code attempts to run `git commit --no-verify`

**Then** the permission check SHALL block the command

**And** Claude Code SHALL not be able to bypass hooks

### Requirement: Hook Script Management

Hook scripts SHALL be maintained in `.claude/hooks/scripts/` directory.

#### Scenario: Quality gates script structure

**Given** a hook references `.claude/hooks/scripts/quality-gates.sh`

**When** the script is executed

**Then** the script SHALL be a bash script with executable permissions

**And** the script SHALL run `pnpm typecheck` and capture exit code

**And** the script SHALL run `pnpm lint` and capture exit code

**And** the script SHALL run `pnpm build` and capture exit code

**And** the script SHALL run `pnpm test` and capture exit code

**And** the script SHALL exit with code 1 if any check fails

**And** the script SHALL exit with code 0 if all checks pass

**And** the script SHALL print colored output (errors in red, success in green)

### Requirement: Local Hook Overrides

Projects SHALL be able to override hooks via settings.local.json.

#### Scenario: Disable hook for debugging

**Given** a developer needs to bypass PreCommit hook for debugging

**When** the developer adds to `.claude/settings.local.json`:
```json
{
  "hooks": {
    "PreCommit": []
  }
}
```

**Then** the PreCommit hook SHALL not execute

**And** other hooks SHALL continue to function normally

**And** the override SHALL only apply to the local machine (file is gitignored)

#### Scenario: Custom timeout for slow tests

**Given** a project has slow tests requiring longer timeout

**When** the developer adds to `.claude/settings.local.json`:
```json
{
  "hooks": {
    "PreCommit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/scripts/quality-gates.sh",
            "timeout": 600
          }
        ]
      }
    ]
  }
}
```

**Then** the PreCommit hook SHALL use 600-second timeout

**And** the override SHALL merge with global settings

## Cross-References

- **Related to**: Template System (templates include settings.json with hooks)
- **Related to**: Sync Tool (sync tool copies hook scripts)
- **Related to**: Agent System (hooks validate agent output)
