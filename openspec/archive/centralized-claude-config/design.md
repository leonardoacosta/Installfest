# Design: Centralized Claude Code Configuration System

## Architecture Overview

This system transforms the Installfest repo into a central configuration hub that satellite projects reference via symlinks. The architecture follows a **symlink-based configuration pattern** with immediate synchronization:

1. **Central Repository** (`Installfest/.claude/` - single source of truth)
2. **Project Layer** (`project/.claude/` - symlinked to central + local overrides)

### Configuration Flow

```
┌─────────────────────────────────────────┐
│  Installfest Repo (.claude/)            │
│  ┌──────────────────────────────────┐   │
│  │ agents/  (10 specialized)        │   │
│  │ commands/ (3 workflow)           │   │
│  │ skills/  (12 pattern files)      │   │
│  │ templates/ (4 project types)     │   │
│  │ CLAUDE.md (global standards)     │   │
│  │ settings.json (hooks)            │   │
│  └──────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
         sync.sh install
          (creates symlinks)
               │
               ▼
┌──────────────────────────────────────────┐
│  Satellite Project (.claude/)            │
│  ┌───────────────────────────────────┐   │
│  │ agents/ → symlink to central      │   │
│  │ commands/ → symlink to central    │   │
│  │ skills/ → symlink to central      │   │
│  │ CLAUDE.md → symlink to template   │   │
│  │ settings.json → symlink template  │   │
│  │ settings.local.json (local only)  │   │
│  └───────────────────────────────────┘   │
└──────────────────────────────────────────┘

Changes in Installfest/.claude/ instantly
available in all projects via symlinks ✨
```

## Key Design Decisions

### 1. Symlink Everything

**Decision:** Use symlinks for all global files, instant sync across projects

**Rationale:**
- Instant synchronization: Changes to central repo immediately available everywhere
- No config drift: All projects always use latest agents, commands, skills
- Zero manual updates: No need to run `sync.sh update`
- Shared learning: Improvements to central repo benefit all projects instantly
- Disk efficiency: One copy of files, multiple references

**Trade-offs:**
- Projects break if central repo unavailable (offline, deleted)
  - **Mitigation:** Keep Installfest cloned locally, use `sync.sh uninstall` before travel
- Breaking changes affect all projects immediately
  - **Mitigation:** Test changes in central repo before committing

**Implementation:**
```bash
# In sync.sh install
ln -s "$INSTALLFEST_PATH/.claude/agents" "./.claude/agents"
ln -s "$INSTALLFEST_PATH/.claude/commands" "./.claude/commands"
ln -s "$INSTALLFEST_PATH/.claude/skills" "./.claude/skills"
ln -s "$INSTALLFEST_PATH/.claude/templates/$TEMPLATE/CLAUDE.md" "./CLAUDE.md"
ln -s "$INSTALLFEST_PATH/.claude/templates/$TEMPLATE/settings.json" "./.claude/settings.json"

# Local override file (never symlinked)
echo '{}' > ./.claude/settings.local.json
```

### 2. Local Overrides via settings.local.json

**Decision:** settings.local.json is always a local file, never symlinked

**Rationale:**
- Machine-specific configuration (paths, disabled hooks for debugging)
- Project-specific overrides without affecting central repo
- Gitignored to prevent committing local preferences
- Merged at runtime with symlinked settings.json

**Merge Order:**
```
templates/{template}/settings.json (symlinked)
  ⬇ (runtime merge by Claude Code)
.claude/settings.local.json (local file)

```

### 3. Template System

**Decision:** Four templates for different platforms and use cases

**Templates:**
1. **minimal**: Bare import of global CLAUDE.md (existing projects)
2. **nextjs-trpc**: T3 Stack monorepo (Next.js, tRPC, Drizzle, Tailwind, ShadCN)
3. **expo**: React Native mobile (Expo Router, native modules)
4. **dotnet**: .NET Azure enterprise (.NET 8-10, Azure Functions, Entity Framework)

**Rationale:**
- Minimal for quick setup or existing projects
- nextjs-trpc for T3 Stack monorepos (primary use case for web)
- expo for React Native mobile development (actively used)
- dotnet for Azure enterprise applications (actively used)

### 4. Agent Specialization

**Decision:** 10 specialized agents for multi-platform development

**Agents:**
1. **t3-stack-developer**: Full-stack features (most common)
2. **trpc-backend-engineer**: API-only work
3. **database-architect**: Schema design and optimization
4. **nextjs-frontend-specialist**: UI-only work
5. **expo-mobile-specialist**: React Native + Expo development
6. **dotnet-azure-specialist**: .NET + Azure enterprise development
7. **e2e-test-engineer**: Testing-focused
8. **ux-design-specialist**: Design systems and Figma
9. **ui-animation-specialist**: Framer Motion and polish
10. **redis-cache-architect**: Caching strategies

**Rationale:**
- Specialized prompts produce better results than generic instructions
- Agents can be spawned in parallel for independent work
- User can select most appropriate agent for task
- Matches actual workflow (frontend, backend, testing, design phases)

### 5. Skill Loading Pattern

**Decision:** Skills are token-efficient, load-on-demand pattern libraries

**Structure:**
```
skills/
├── t3-patterns/
│   ├── trpc-router.md (router creation template)
│   ├── drizzle-schema.md (table definition template)
│   ├── zod-validation.md (schema patterns)
│   └── react-hook-form.md (form patterns)
├── testing/
│   ├── playwright-e2e.md (E2E test structure)
│   ├── vitest-unit.md (unit test patterns)
│   └── integration-tests.md (integration setup)
└── monorepo/
    ├── turborepo-setup.md (Turborepo config)
    └── package-structure.md (workspace conventions)
```

**Rationale:**
- Loading all patterns in CLAUDE.md wastes tokens
- Skills invoked explicitly when needed: `@skill t3-patterns/trpc-router`
- Each skill is focused (200-300 tokens vs 2000+ for everything)
- Extensible: add new skills without bloating base config

### 6. Hook Architecture

**Decision:** Four hook types for progressive validation

**Hooks:**
1. **PostToolUse (Write/Edit)**: Typecheck on `.ts/.tsx` file changes
2. **SubagentStop**: Verify completion before subagent exits
3. **PreCommit**: Run quality gates before git commit
4. **PrePush**: Block push if tests failing

**Rationale:**
- PostToolUse catches type errors immediately (fast feedback)
- SubagentStop prevents incomplete work being marked done
- PreCommit ensures quality before commits (local validation)
- PrePush prevents broken code reaching CI (final gate)

**Implementation:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "FILE=$(echo $CLAUDE_TOOL_INPUT | jq -r '.file_path'); if echo \"$FILE\" | grep -qE '\\.(ts|tsx)$'; then npx tsc --noEmit 2>&1 | head -20; fi",
            "timeout": 60
          }
        ]
      }
    ],
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

### 7. Command vs Agent vs Skill

**Clarity on when to use each:**

| Type | Purpose | Token Cost | Example |
|------|---------|------------|---------|
| **Command** | Workflow automation | Low (200-400) | `/fix-types`, `/run-quality-gates` |
| **Agent** | Autonomous task execution | High (spawns subprocess) | `t3-stack-developer`, `expo-mobile-specialist` |
| **Skill** | Code pattern reference | Low (loaded on-demand) | `@skill t3-patterns/trpc-router` |

**Decision Matrix:**
- **Use Command** when: Single tool invocation or simple checklist
- **Use Agent** when: Multi-step autonomous work requiring context
- **Use Skill** when: Need code template or pattern reference

### 8. sync.sh Commands

**Decision:** Four commands for symlink-based lifecycle management

**Commands:**
1. `sync.sh install [template]`: Create symlinks to central repo
2. `sync.sh uninstall`: Remove symlinks, restore backups
3. `sync.sh promote <file>`: Copy project file to central repo
4. `sync.sh status`: Show symlink configuration and template

**Rationale:**
- `install`: Bootstrap new project with symlinks to chosen template
- `uninstall`: Remove symlinks before offline scenarios or to create standalone copy
- `promote`: Share useful project patterns back to central repo for all projects
- `status`: Quick check of current symlink state and template type
- No `update` needed: symlinks provide instant sync automatically
- No `diff` needed: symlinks prevent drift entirely

### 9. Settings Hierarchy

**Decision:** Two-layer settings with symlink + local override

**Layers:**
1. `.claude/settings.json` (symlinked to template in central repo)
2. `.claude/settings.local.json` (local file, machine-specific, gitignored)

**Runtime Merge:**
```
templates/{template}/settings.json (symlinked, read-only)
  ⬇ (runtime merge by Claude Code)
settings.local.json (local file, overrides symlinked settings)
```

**Rationale:**
- Template settings symlinked for instant updates
- Local file never symlinked to preserve machine-specific config
- Local overrides allow debugging without affecting central repo or other projects
- Gitignored to prevent committing local preferences

### 10. Parallel Execution Pattern

**Decision:** `/parallel-apply` command batches independent tasks

**Implementation:**
```markdown
# In /parallel-apply command

1. Parse tasks.md for parallel groups (marked with `[parallel]`)
2. Batch independent tasks into single message
3. Execute multiple tool calls in parallel
4. Aggregate results and update task statuses

Example tasks.md:
- [ ] 1.1 Create agent A [parallel:group1]
- [ ] 1.2 Create agent B [parallel:group1]
- [ ] 1.3 Create agent C [parallel:group1]
- [ ] 2.1 Test agent A (depends: 1.1)
```

**Rationale:**
- Current sequential execution wastes time (3 agents = 3 turns)
- Parallel tool calls allow batch execution (3 agents = 1 turn)
- 3x speedup on independent tasks
- Dependency tracking ensures correctness

## Data Flow

### Installation Flow

```
User runs: ./sync.sh install nextjs-trpc

1. Check if $INSTALLFEST_PATH exists (default: ~/Personal/Installfest)
2. Backup existing .claude/ if present → ~/.claude-backup-{timestamp}
3. Create .claude/ directory structure
4. Create symlinks:
   - .claude/agents → $INSTALLFEST/.claude/agents
   - .claude/commands → $INSTALLFEST/.claude/commands
   - .claude/skills → $INSTALLFEST/.claude/skills
   - CLAUDE.md → $INSTALLFEST/.claude/templates/nextjs-trpc/CLAUDE.md
   - .claude/settings.json → $INSTALLFEST/.claude/templates/nextjs-trpc/settings.json
5. Create .claude/settings.local.json (local file, empty JSON object)
6. Add .claude/settings.local.json to .gitignore
7. Success message: "Installed nextjs-trpc template with symlinks to $INSTALLFEST_PATH"
```

### Uninstall Flow

```
User runs: ./sync.sh uninstall

1. Check if .claude/ contains symlinks
2. Remove all symlinks:
   - .claude/agents (symlink)
   - .claude/commands (symlink)
   - .claude/skills (symlink)
   - CLAUDE.md (symlink)
   - .claude/settings.json (symlink)
3. Restore from backup if available
4. Keep .claude/settings.local.json (local file, not symlink)
5. Success message: "Removed symlinks, .claude/ is now standalone"
```

### Promote Flow

```
User runs: ./sync.sh promote .claude/skills/custom-patterns/api-versioning.md

1. Validate file exists in project
2. Determine destination (commands/, skills/, or agents/)
3. Copy file to central repo:
   - $INSTALLFEST/.claude/skills/custom-patterns/api-versioning.md
4. Create skill directory if needed
5. Display git commit command:
   cd $INSTALLFEST_PATH
   git add .claude/skills/custom-patterns/api-versioning.md
   git commit -m "promote: api-versioning skill from Project X"
   git push
6. Remind user: "Pattern now available to all projects via symlinks"
```

## Error Handling

### Hook Failures

**Scenario:** PreCommit hook fails due to type errors

**Handling:**
1. Hook blocks commit with error output
2. User fixes types and retries
3. settings.local.json can disable hook for debugging:
   ```json
   {
     "hooks": {
       "PreCommit": []
     }
   }
   ```

### Missing Central Repo

**Scenario:** sync.sh can't find Installfest repo

**Handling:**
1. Check $INSTALLFEST_PATH environment variable
2. Fall back to ~/Personal/Installfest
3. Prompt user to set path or clone repo
4. Exit with helpful error message

### Template Not Found

**Scenario:** User runs `sync.sh install nonexistent`

**Handling:**
1. List available templates
2. Suggest closest match (fuzzy search)
3. Exit with error code 1

## Security Considerations

### .env File Protection

**Already implemented in settings.json:**
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

**Rationale:** Prevent accidental exposure of secrets in prompts

### settings.local.json in .gitignore

**Ensure all projects add to .gitignore:**
```gitignore
.claude/settings.local.json
.swarm/
```

**Rationale:** Machine-specific config may contain paths or API keys

## Future Enhancements

### Phase 2 (Not in current scope):

1. **CLI Tool**: `npm install -g @installfest/claude-sync`
2. **Template Registry**: Community templates in separate repos
3. **Skill Marketplace**: Share skills across teams
4. **Hook Marketplace**: Pre-built hooks for common tools (Prisma, Vitest, etc.)
5. **Config Versioning**: Semantic versioning for breaking changes
6. **Snapshot/Rollback**: `sync.sh snapshot` to create versioned copy before major changes

Note: No auto-update needed with symlinks (instant sync), no update/diff commands needed (symlinks prevent drift).

## Validation Criteria

This design is complete when:

1. ✅ All 10 agents defined with specialized prompts (T3 Stack, Expo, .NET)
2. ✅ All 3 commands implemented with clear workflows
3. ✅ All 12 skills created with token-efficient patterns
4. ✅ 4 templates (minimal, nextjs-trpc, expo, dotnet) complete
5. ✅ sync.sh implements all 4 commands (install, uninstall, promote, status)
6. ✅ install.sh integrates Claude config symlinking
7. ✅ Hooks trigger correctly on file edits and commits
8. ✅ Symlinks work correctly and survive git operations
9. ✅ settings.local.json overrides work for local customization
10. ✅ Documentation covers all workflows
11. ✅ End-to-end test with new projects (nextjs-trpc, expo, dotnet) succeeds
12. ✅ Instant sync verified: change in central repo immediately available in projects
