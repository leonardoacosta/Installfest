# Implementation Tasks

## Phase 1: Agent Definitions

### 1.1 T3 Stack Specialized Agents

- [ ] 1.1.1 Create `.claude/agents/t3-stack-developer.md` with React, tRPC, Drizzle, form patterns
- [ ] 1.1.2 Create `.claude/agents/trpc-backend-engineer.md` for API design and middleware
- [ ] 1.1.3 Create `.claude/agents/database-architect.md` for PostgreSQL + Drizzle optimization
- [ ] 1.1.4 Create `.claude/agents/nextjs-frontend-specialist.md` for Next.js + ShadCN UI
- [ ] 1.1.5 Create `.claude/agents/e2e-test-engineer.md` for Playwright testing
- [ ] 1.1.6 Create `.claude/agents/ux-design-specialist.md` for design systems and Figma-to-code
- [ ] 1.1.7 Create `.claude/agents/ui-animation-specialist.md` for Framer Motion and micro-interactions
- [ ] 1.1.8 Create `.claude/agents/redis-cache-architect.md` for caching strategies and Upstash Redis

### 1.2 Mobile and Enterprise Agents

- [ ] 1.2.1 Create `.claude/agents/expo-mobile-specialist.md` for React Native, Expo Router, native modules
- [ ] 1.2.2 Create `.claude/agents/dotnet-azure-specialist.md` for .NET 8-10, Azure Functions, ASP.NET Core, Entity Framework

## Phase 2: Command Definitions

### 2.1 Quality and Workflow Commands

- [ ] 2.1.1 Create `.claude/commands/fix-types.md` to find and fix TypeScript errors
- [ ] 2.1.2 Create `.claude/commands/run-quality-gates.md` to execute typecheck, build, test, lint
- [ ] 2.1.3 Create `.claude/commands/parallel-apply.md` for batch task execution in OpenSpec

## Phase 3: Skill Libraries

### 3.1 T3 Core Patterns

- [ ] 3.1.1 Create `.claude/skills/t3-patterns/trpc-router.md` with router creation patterns
- [ ] 3.1.2 Create `.claude/skills/t3-patterns/drizzle-schema.md` with table definition patterns
- [ ] 3.1.3 Create `.claude/skills/t3-patterns/zod-validation.md` with schema patterns
- [ ] 3.1.4 Create `.claude/skills/t3-patterns/react-hook-form.md` with form patterns

### 3.2 T3 Advanced Patterns

- [ ] 3.2.1 Create `.claude/skills/t3-patterns/state-management.md` with React Query, Zustand, Context patterns
- [ ] 3.2.2 Create `.claude/skills/t3-patterns/payments.md` with Stripe + Polar integration patterns
- [ ] 3.2.3 Create `.claude/skills/t3-patterns/monitoring.md` with Posthog, Sentry, Vercel Analytics setup

### 3.3 Testing Patterns

- [ ] 3.3.1 Create `.claude/skills/testing/playwright-e2e.md` with E2E test patterns
- [ ] 3.3.2 Create `.claude/skills/testing/vitest-unit.md` with unit test patterns
- [ ] 3.3.3 Create `.claude/skills/testing/integration-tests.md` with integration patterns

### 3.4 Monorepo Patterns

- [ ] 3.4.1 Create `.claude/skills/monorepo/turborepo-setup.md` with Turborepo pipeline configuration
- [ ] 3.4.2 Create `.claude/skills/monorepo/package-structure.md` with workspace conventions

## Phase 4: Template Creation

### 4.1 Next.js + tRPC Template

- [ ] 4.1.1 Create `.claude/templates/nextjs-trpc/CLAUDE.md` importing global + T3 Stack specifics
- [ ] 4.1.2 Create `.claude/templates/nextjs-trpc/settings.json` with T3 Stack hooks
- [ ] 4.1.3 Create `.claude/templates/nextjs-trpc/skills/` directory for project-specific patterns

### 4.2 Expo Mobile Template

- [ ] 4.2.1 Create `.claude/templates/expo/CLAUDE.md` importing global + React Native patterns
- [ ] 4.2.2 Create `.claude/templates/expo/settings.json` with mobile-specific hooks
- [ ] 4.2.3 Create `.claude/templates/expo/skills/expo-patterns/expo-router.md`
- [ ] 4.2.4 Create `.claude/templates/expo/skills/expo-patterns/native-modules.md`

### 4.3 .NET Azure Template

- [ ] 4.3.1 Create `.claude/templates/dotnet/CLAUDE.md` importing global + .NET patterns
- [ ] 4.3.2 Create `.claude/templates/dotnet/settings.json` with .NET hooks (dotnet build, dotnet test)
- [ ] 4.3.3 Create `.claude/templates/dotnet/skills/dotnet-patterns/ef-dapper.md`
- [ ] 4.3.4 Create `.claude/templates/dotnet/skills/dotnet-patterns/azure-functions.md`
- [ ] 4.3.5 Create `.claude/templates/dotnet/skills/dotnet-patterns/aspnet-api.md`
- [ ] 4.3.6 Create `.claude/templates/dotnet/skills/dotnet-patterns/azure-services.md` (Key Vault, Service Bus, App Insights)
- [ ] 4.3.7 Create `.claude/templates/dotnet/skills/frontend-patterns/react-tanstack.md` for React + TanStack Query

## Phase 5: Enhanced Settings and Hooks

### 5.1 Global Settings

- [ ] 5.1.1 Enhance `.claude/settings.json` with PreCommit hook for quality gates
- [ ] 5.1.2 Add PrePush hook to block push if tests failing
- [ ] 5.1.3 Document settings.local.json override pattern in comments

### 5.2 Hook Scripts

- [ ] 5.2.1 Create `.claude/hooks/scripts/quality-gates.sh` for comprehensive checks
- [ ] 5.2.2 Create `.claude/hooks/scripts/type-check.sh` for workspace-wide type checking

## Phase 6: Sync Script (Symlink-Based)

### 6.1 Core Sync Functionality

- [ ] 6.1.1 Enhance `sync.sh` with `install [template]` command to create symlinks
- [ ] 6.1.2 Add `uninstall` command to remove symlinks and restore backups
- [ ] 6.1.3 Add `promote <file>` command to copy project file to central repo
- [ ] 6.1.4 Add `status` command to show symlink configuration and template
- [ ] 6.1.5 Add template selection support (minimal, nextjs-trpc, expo, dotnet)

### 6.2 Symlink Management

- [ ] 6.2.1 Implement symlink creation for `.claude/agents/` → `$INSTALLFEST/.claude/agents/`
- [ ] 6.2.2 Implement symlink creation for `.claude/commands/` → `$INSTALLFEST/.claude/commands/`
- [ ] 6.2.3 Implement symlink creation for `.claude/skills/` → `$INSTALLFEST/.claude/skills/`
- [ ] 6.2.4 Implement symlink creation for `CLAUDE.md` → `$INSTALLFEST/.claude/templates/{template}/CLAUDE.md`
- [ ] 6.2.5 Implement symlink creation for `settings.json` → `$INSTALLFEST/.claude/templates/{template}/settings.json`
- [ ] 6.2.6 Ensure `.claude/settings.local.json` is always local file (never symlinked)

### 6.3 Installation Integration

- [ ] 6.3.1 Update root `install.sh` to detect existing `.claude/` directory
- [ ] 6.3.2 Add logic to create symlinks to Claude config files
- [ ] 6.3.3 Implement backup creation before symlinking
- [ ] 6.3.4 Create `.claude/settings.local.json` as local file
- [ ] 6.3.5 Add `.claude/settings.local.json` to `.gitignore`

## Phase 7: Global CLAUDE.md Enhancement

### 7.1 Documentation Updates

- [ ] 7.1.1 Enhance `.claude/CLAUDE.md` with T3 Stack conventions (tRPC, Drizzle, ShadCN patterns)
- [ ] 7.1.2 Add React Native (Expo) conventions
- [ ] 7.1.3 Add .NET Azure conventions
- [ ] 7.1.4 Add monorepo workspace structure documentation
- [ ] 7.1.5 Add skill invocation examples
- [ ] 7.1.6 Add hook behavior documentation
- [ ] 7.1.7 Add parallel execution patterns

## Phase 8: Testing and Validation

### 8.1 Local Testing

- [ ] 8.1.1 Test `sync.sh install nextjs-trpc` creates valid symlinks
- [ ] 8.1.2 Test `sync.sh install expo` creates mobile template symlinks
- [ ] 8.1.3 Test `sync.sh install dotnet` creates .NET template symlinks
- [ ] 8.1.4 Verify all 10 agents load without errors
- [ ] 8.1.5 Verify 12 skills load patterns when invoked
- [ ] 8.1.6 Verify hooks trigger correctly on file edits
- [ ] 8.1.7 Verify PreCommit hook runs quality gates

### 8.2 Integration Testing

- [ ] 8.2.1 Test with existing homelab-services monorepo
- [ ] 8.2.2 Create new test project with `sync.sh install minimal`
- [ ] 8.2.3 Test `sync.sh promote` workflow
- [ ] 8.2.4 Test `sync.sh uninstall` removes symlinks correctly
- [ ] 8.2.5 Verify symlinks survive git operations (clone, pull, checkout)
- [ ] 8.2.6 Verify settings.local.json overrides work

### 8.3 OpenSpec Validation

- [ ] 8.3.1 Run `openspec validate centralized-claude-config --strict`
- [ ] 8.3.2 Resolve any validation errors
- [ ] 8.3.3 Verify all spec deltas are complete

## Phase 9: Documentation

### 9.1 README Updates

- [ ] 9.1.1 Add "Centralized Claude Config" section to README.md
- [ ] 9.1.2 Document sync.sh usage and commands
- [ ] 9.1.3 Add template selection guide (minimal, nextjs-trpc, expo, dotnet)
- [ ] 9.1.4 Document agent, command, and skill usage
- [ ] 9.1.5 Document symlink-based architecture and benefits

### 9.2 Migration Guide

- [ ] 9.2.1 Create `docs/claude-config-migration.md` for existing projects
- [ ] 9.2.2 Document settings.local.json override patterns
- [ ] 9.2.3 Add troubleshooting section for symlink issues
- [ ] 9.2.4 Document uninstall process for offline scenarios

## Phase 10: Final Validation

### 10.1 End-to-End Testing

- [ ] 10.1.1 Create new Next.js project with `sync.sh install nextjs-trpc`
- [ ] 10.1.2 Create new Expo project with `sync.sh install expo`
- [ ] 10.1.3 Create new .NET project with `sync.sh install dotnet`
- [ ] 10.1.4 Verify agent invocations work correctly in each template
- [ ] 10.1.5 Verify skill loading is token-efficient
- [ ] 10.1.6 Verify hooks enforce quality gates
- [ ] 10.1.7 Verify claude-flow MCP persists context across sessions
- [ ] 10.1.8 Test parallel execution with `/parallel-apply` command
- [ ] 10.1.9 Verify instant sync: change in central repo immediately available in projects
- [ ] 10.1.10 Test promote workflow: copy useful project pattern to central repo
