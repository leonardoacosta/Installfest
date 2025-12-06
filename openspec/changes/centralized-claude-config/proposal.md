# Centralized Claude Code Configuration System

## Why

**Problem:** Context loss and inconsistent execution across projects

Every new Claude Code session or `/clear` command loses planning context. Claude improvises instead of following established patterns. Subagents claim work is complete when validation fails. Each project maintains duplicate `.claude/` configurations, leading to:

1. **Context Loss**: Session history doesn't persist, requiring re-explanation of conventions
2. **Inconsistent Execution**: No enforcement of code style, testing, or quality gates
3. **Validation Gaps**: Subagents complete without verifying type-checking, builds, or tests
4. **Configuration Duplication**: Same agents, commands, and skills copied across every project
5. **Sequential Bottleneck**: Tasks execute one-at-a-time instead of parallel batches

**Current State:**
- `.claude/CLAUDE.md` exists with global standards (ES modules, TypeScript strict, conventional commits)
- `.claude/settings.json` has basic hooks (typecheck on file edit, subagent verification)
- `.claude/mcp.json` includes claude-flow for session persistence
- Empty `agents/`, `commands/`, `skills/` directories
- `templates/minimal/` and `templates/nextjs-trpc/` exist but incomplete
- `automate/` folder shows example satellite project pattern from ChatGPT
- `install.sh` exists but doesn't handle Claude config

**Goal:** Transform this repo into a centralized source of truth that satellite projects symlink to, ensuring:
- Persistent context across sessions (via claude-flow MCP)
- Deterministic validation (hooks enforce linting, type-checking, testing)
- Token-efficient pattern libraries (skills load only when relevant)
- Hierarchical configuration (global defaults + project-specific overrides)
- Parallel execution patterns (batch commands in single messages)

## What Changes

### 1. Global Configuration Structure

Create a complete `.claude/` directory structure optimized for T3 Stack monorepos (Next.js, tRPC, Drizzle, Tailwind, ShadCN, Playwright, Vitest), React Native (Expo), and .NET Azure development:

```
.claude/
├── CLAUDE.md (global standards - already exists, enhance)
├── settings.json (hooks and permissions - already exists, enhance)
├── mcp.json (claude-flow integration - already exists)
├── agents/
│   ├── t3-stack-developer.md
│   ├── trpc-backend-engineer.md
│   ├── database-architect.md
│   ├── nextjs-frontend-specialist.md
│   ├── expo-mobile-specialist.md
│   ├── dotnet-azure-specialist.md
│   ├── e2e-test-engineer.md
│   ├── ux-design-specialist.md
│   ├── ui-animation-specialist.md
│   └── redis-cache-architect.md
├── commands/
│   ├── store-context.md (already exists)
│   ├── fix-types.md
│   ├── run-quality-gates.md
│   └── parallel-apply.md
├── skills/
│   ├── t3-patterns/
│   │   ├── trpc-router.md
│   │   ├── drizzle-schema.md
│   │   ├── zod-validation.md
│   │   ├── react-hook-form.md
│   │   ├── state-management.md
│   │   ├── payments.md
│   │   └── monitoring.md
│   ├── testing/
│   │   ├── playwright-e2e.md
│   │   ├── vitest-unit.md
│   │   └── integration-tests.md
│   └── monorepo/
│       ├── turborepo-setup.md
│       └── package-structure.md
└── templates/
    ├── minimal/ (already exists, enhance)
    │   └── CLAUDE.md
    ├── nextjs-trpc/ (already exists, populate)
    │   ├── CLAUDE.md
    │   ├── settings.json
    │   └── skills/ (project-specific overrides)
    ├── expo/
    │   ├── CLAUDE.md
    │   ├── settings.json
    │   └── skills/
    │       └── expo-patterns/
    │           ├── expo-router.md
    │           └── native-modules.md
    └── dotnet/
        ├── CLAUDE.md
        ├── settings.json
        └── skills/
            ├── dotnet-patterns/
            │   ├── ef-dapper.md
            │   ├── azure-functions.md
            │   ├── aspnet-api.md
            │   └── azure-services.md
            └── frontend-patterns/
                └── react-tanstack.md
```

### 2. Enhanced install.sh Script

Update root `install.sh` to:
- Detect if Claude config exists in target project
- Create symlinks to central repository for immediate sync
- Preserve existing `.claude/settings.local.json` (machine-specific)
- Backup existing config before symlinking
- Add `.claude/settings.local.json` to `.gitignore`

### 3. Sync Script for Satellite Projects

Create `sync.sh` (already exists in `automate/`, enhance and move to root):
- `./sync.sh install [template]` - Symlink global config to project with chosen template
- `./sync.sh uninstall` - Remove symlinks and restore backups
- `./sync.sh promote <file>` - Copy project file to central repo global config
- `./sync.sh status` - Show current symlink configuration and template

### 4. Agent Definitions

Create 10 specialized agents for T3 Stack, React Native, and .NET development:

**t3-stack-developer.md**: Full-stack features (React components, tRPC APIs, Drizzle queries, forms with react-hook-form + Zod)

**trpc-backend-engineer.md**: API design, type-safe server implementations, middleware, Node.js backend

**database-architect.md**: PostgreSQL optimization, Drizzle ORM, multi-tenant architectures

**nextjs-frontend-specialist.md**: Next.js development, ShadCN UI, react-hook-form integration

**expo-mobile-specialist.md**: React Native development, Expo Router, native modules, mobile-specific patterns, app store deployment

**dotnet-azure-specialist.md**: .NET 8-10, Azure Functions, ASP.NET Core (API/MVC), Entity Framework, Dapper, Azure Key Vault, Service Bus, Application Insights, Oracle/SQL Server

**e2e-test-engineer.md**: Playwright tests, page object models, CI/CD integration

**ux-design-specialist.md**: Component design, Figma-to-code, responsive layouts, accessibility

**ui-animation-specialist.md**: Framer Motion animations, shadcn customization, micro-interactions

**redis-cache-architect.md**: Caching strategies, tRPC result caching, Upstash Redis, rate limiting

### 5. Command Definitions

**fix-types.md**: Find and fix TypeScript errors across workspace

**run-quality-gates.md**: Execute all quality checks (typecheck, build, test, lint)

**parallel-apply.md**: Apply OpenSpec proposals with task batching for parallel execution

### 6. Skill Libraries

**t3-patterns/**: Token-efficient code patterns for:
- tRPC routers, Drizzle schemas, Zod validations, react-hook-form
- State management (React Query, Zustand, Context patterns)
- Payments integration (Stripe + Polar checkout, webhooks)
- Monitoring setup (Posthog, Sentry, Vercel Analytics, Application Insights)

**testing/**: Playwright E2E patterns, Vitest unit test patterns, integration test setup

**monorepo/**: Turborepo pipeline configuration, package structure conventions, workspace dependencies

### 7. Template Enhancements

**minimal/CLAUDE.md**: Reference global config via `@~/.claude/CLAUDE.md` (already exists)

**nextjs-trpc/CLAUDE.md**: Import global + add T3 Stack tech stack (Next.js, tRPC, Drizzle, Tailwind, ShadCN), domain context, API conventions

**expo/CLAUDE.md**: Import global + add React Native patterns (Expo Router, native modules, mobile-specific tooling)

**dotnet/CLAUDE.md**: Import global + add .NET patterns (.NET 8-10, Azure Functions, ASP.NET Core, Entity Framework, Dapper, Azure services)

### 8. Settings and Hooks

**Enhanced settings.json** with:
- PostToolUse hook: typecheck on Write/Edit of `.ts/.tsx` files (already exists, keep)
- SubagentStop hook: verify completion before allowing exit (already exists, keep)
- PreCommit hook: run quality gates before git commit
- PrePush hook: block push if tests failing

**MCP Integration** (already exists):
- claude-flow for session persistence and context recall

## Impact

### Benefits

1. **Single Source of Truth**: One repo maintains all Claude config, symlinked to satellite projects for instant updates
2. **Instant Sync**: Changes to central repo immediately available in all projects via symlinks
3. **Persistent Context**: claude-flow MCP stores session history in SQLite
4. **Deterministic Validation**: Hooks enforce quality gates automatically
5. **Token Efficiency**: Skills load patterns on-demand instead of cluttering CLAUDE.md
6. **Parallel Execution**: Batch command support for 3x speedup
7. **Multi-Platform Support**: Agents and skills for T3 Stack (Next.js + tRPC + Drizzle), React Native (Expo), and .NET (Azure)
8. **Zero Config Projects**: `sync.sh install nextjs-trpc` sets up complete config in seconds
9. **Cross-Project Learning**: Promote project patterns to global config with `sync.sh promote`
10. **Hierarchical Overrides**: Global defaults + template-specific + local customization via settings.local.json
11. **Consistent Quality**: Same standards enforced across all projects instantly

### Risks

1. **Breaking Changes**: Updating global config instantly affects all symlinked projects
   - **Mitigation**: Test changes in central repo before committing, use semantic versioning for agents
2. **Repo Unavailable**: Projects break if central repo is unavailable (offline, deleted)
   - **Mitigation**: Keep Installfest repo cloned locally, use `sync.sh uninstall` before travel to convert symlinks to copies
3. **Skill Overhead**: Loading too many skills wastes tokens
   - **Mitigation**: Skills load only when explicitly needed via skill tool
4. **Hook Failures**: Strict hooks might block legitimate work
   - **Mitigation**: settings.local.json can override hooks per-machine (always local, never symlinked)

### Migration Path

1. **Phase 1**: Populate global `.claude/` structure (10 agents, 3 commands, 12 skills)
2. **Phase 2**: Create 4 templates (minimal, nextjs-trpc, expo, dotnet)
3. **Phase 3**: Enhance `install.sh` and `sync.sh` for symlink-based distribution
4. **Phase 4**: Test with existing projects (this repo, homelab-services)
5. **Phase 5**: Document workflow in README.md and create migration guide

### Validation

- `openspec validate centralized-claude-config --strict` passes
- All 10 agents load without errors
- `sync.sh install nextjs-trpc` creates symlinks successfully
- `sync.sh install expo` and `sync.sh install dotnet` work correctly
- Hooks trigger correctly on file edits and commits
- Skills load patterns when invoked via skill tool (12 skills)
- Template CLAUDE.md files reference global config correctly
- Symlinks survive git operations and IDE file changes
- settings.local.json overrides work for machine-specific config
