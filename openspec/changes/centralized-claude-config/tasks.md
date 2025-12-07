# Implementation Tasks

## Phase 1: Agent Definitions

### 1.1 T3 Stack Specialized Agents

- [x] 1.1.1 Create `.claude/agents/t3-stack-developer.md` with React, tRPC, Drizzle, form patterns
- [x] 1.1.2 Create `.claude/agents/trpc-backend-engineer.md` for API design and middleware
- [x] 1.1.3 Create `.claude/agents/database-architect.md` for PostgreSQL + Drizzle optimization
- [x] 1.1.4 Create `.claude/agents/nextjs-frontend-specialist.md` for Next.js + ShadCN UI
- [x] 1.1.5 Create `.claude/agents/e2e-test-engineer.md` for Playwright testing
- [x] 1.1.6 Create `.claude/agents/ux-design-specialist.md` for design systems and Figma-to-code
- [x] 1.1.7 Create `.claude/agents/ui-animation-specialist.md` for Framer Motion and micro-interactions
- [x] 1.1.8 Create `.claude/agents/redis-cache-architect.md` for caching strategies and Upstash Redis

### 1.2 Mobile and Enterprise Agents

- [x] 1.2.1 Create `.claude/agents/expo-mobile-specialist.md` for React Native, Expo Router, native modules
- [x] 1.2.2 Create `.claude/agents/dotnet-azure-specialist.md` for .NET 8-10, Azure Functions, ASP.NET Core, Entity Framework

## Phase 2: Command Definitions

### 2.1 Quality and Workflow Commands

- [x] 2.1.1 Create `.claude/commands/fix-types.md` to find and fix TypeScript errors
- [x] 2.1.2 Create `.claude/commands/run-quality-gates.md` to execute typecheck, build, test, lint
- [x] 2.1.3 Create `.claude/commands/parallel-apply.md` for batch task execution in OpenSpec

### 2.2 Context Management Commands

- [x] 2.2.1 Enhance `.claude/commands/store-context.md` with comprehensive context capture
- [x] 2.2.2 Create `.claude/commands/resume.md` to resume work from stored context
- [x] 2.2.3 Create `.claude/commands/recall.md` to view learnings from archived specs
- [x] 2.2.4 Create `.claude/commands/archive.md` to archive completed specs with validation

## Phase 3: Skill Libraries

### 3.1 T3 Core Patterns

- [x] 3.1.1 Create `.claude/skills/t3-patterns/trpc-router.md` with router creation patterns
- [x] 3.1.2 Create `.claude/skills/t3-patterns/drizzle-schema.md` with table definition patterns
- [x] 3.1.3 Create `.claude/skills/t3-patterns/zod-validation.md` with schema patterns
- [x] 3.1.4 Create `.claude/skills/t3-patterns/react-hook-form.md` with form patterns

### 3.2 T3 Advanced Patterns

- [x] 3.2.1 Create `.claude/skills/t3-patterns/state-management.md` with React Query, Zustand, Context patterns
- [x] 3.2.2 Create `.claude/skills/t3-patterns/payments.md` with Stripe + Polar integration patterns
- [x] 3.2.3 Create `.claude/skills/t3-patterns/monitoring.md` with Posthog, Sentry, Vercel Analytics setup

### 3.3 Testing Patterns

- [x] 3.3.1 Create `.claude/skills/testing/playwright-e2e.md` with E2E test patterns
- [x] 3.3.2 Create `.claude/skills/testing/vitest-unit.md` with unit test patterns
- [x] 3.3.3 Create `.claude/skills/testing/integration-tests.md` with integration patterns

### 3.4 Monorepo Patterns

- [x] 3.4.1 Create `.claude/skills/monorepo/turborepo-setup.md` with Turborepo pipeline configuration
- [x] 3.4.2 Create `.claude/skills/monorepo/package-structure.md` with workspace conventions

## Phase 4: Template Creation

### 4.1 Next.js + tRPC Template

- [x] 4.1.1 Create `.claude/templates/nextjs-trpc/CLAUDE.md` importing global + T3 Stack specifics
- [x] 4.1.2 Create `.claude/templates/nextjs-trpc/settings.json` with T3 Stack hooks
- [x] 4.1.3 Create `.claude/templates/nextjs-trpc/skills/` directory for project-specific patterns

### 4.2 Expo Mobile Template

- [x] 4.2.1 Create `.claude/templates/expo/CLAUDE.md` importing global + React Native patterns
- [x] 4.2.2 Create `.claude/templates/expo/settings.json` with mobile-specific hooks
- [x] 4.2.3 Create `.claude/templates/expo/skills/expo-patterns/expo-router.md`
- [x] 4.2.4 Create `.claude/templates/expo/skills/expo-patterns/native-modules.md`

### 4.3 .NET Azure Template

- [x] 4.3.1 Create `.claude/templates/dotnet/CLAUDE.md` importing global + .NET patterns
- [x] 4.3.2 Create `.claude/templates/dotnet/settings.json` with .NET hooks (dotnet build, dotnet test)
- [x] 4.3.3 Create `.claude/templates/dotnet/skills/dotnet-patterns/ef-dapper.md`
- [x] 4.3.4 Create `.claude/templates/dotnet/skills/dotnet-patterns/azure-functions.md`
- [x] 4.3.5 Create `.claude/templates/dotnet/skills/dotnet-patterns/aspnet-api.md`
- [x] 4.3.6 Create `.claude/templates/dotnet/skills/dotnet-patterns/azure-services.md` (Key Vault, Service Bus, App Insights)
- [x] 4.3.7 Create `.claude/templates/dotnet/skills/frontend-patterns/react-tanstack.md` for React + TanStack Query

## Phase 5: Enhanced Settings and Hooks

### 5.1 Global Settings

- [x] 5.1.1 Enhance `.claude/settings.json` with PreCommit hook for quality gates
- [x] 5.1.2 Add PrePush hook to block push if tests failing
- [x] 5.1.3 Document settings.local.json override pattern in comments

### 5.2 Hook Scripts

- [x] 5.2.1 Create `.claude/hooks/scripts/quality-gates.sh` for comprehensive checks
- [x] 5.2.2 Create `.claude/hooks/scripts/type-check.sh` for workspace-wide type checking

## Phase 6: Sync Script (Symlink-Based)

### 6.1 Core Sync Functionality

- [x] 6.1.1 Enhance `sync.sh` with `install [template]` command to create symlinks
- [x] 6.1.2 Add `uninstall` command to remove symlinks and restore backups
- [x] 6.1.3 Add `promote <file>` command to copy project file to central repo
- [x] 6.1.4 Add `status` command to show symlink configuration and template
- [x] 6.1.5 Add template selection support (minimal, nextjs-trpc, expo, dotnet)

### 6.2 Symlink Management

- [x] 6.2.1 Implement symlink creation for `.claude/agents/` → `$INSTALLFEST/.claude/agents/`
- [x] 6.2.2 Implement symlink creation for `.claude/commands/` → `$INSTALLFEST/.claude/commands/`
- [x] 6.2.3 Implement symlink creation for `.claude/skills/` → `$INSTALLFEST/.claude/skills/`
- [x] 6.2.4 Implement symlink creation for `CLAUDE.md` → `$INSTALLFEST/.claude/templates/{template}/CLAUDE.md`
- [x] 6.2.5 Implement symlink creation for `settings.json` → `$INSTALLFEST/.claude/templates/{template}/settings.json`
- [x] 6.2.6 Ensure `.claude/settings.local.json` is always local file (never symlinked)

### 6.3 Installation Integration

- [x] 6.3.1 Update root `install.sh` to detect existing `.claude/` directory
- [x] 6.3.2 Add logic to create symlinks to Claude config files
- [x] 6.3.3 Implement backup creation before symlinking
- [x] 6.3.4 Create `.claude/settings.local.json` as local file
- [x] 6.3.5 Add `.claude/settings.local.json` to `.gitignore`

## Phase 7: Global CLAUDE.md Enhancement

### 7.1 Documentation Updates

- [x] 7.1.1 Enhance `.claude/CLAUDE.md` with T3 Stack conventions (tRPC, Drizzle, ShadCN patterns)
- [x] 7.1.2 Add React Native (Expo) conventions
- [x] 7.1.3 Add .NET Azure conventions
- [x] 7.1.4 Add monorepo workspace structure documentation
- [x] 7.1.5 Add skill invocation examples
- [x] 7.1.6 Add hook behavior documentation
- [x] 7.1.7 Add parallel execution patterns

## Phase 8: Testing and Validation

### 8.1 Local Testing

- [x] 8.1.1 Test `sync.sh install nextjs-trpc` creates valid symlinks
- [x] 8.1.2 Test `sync.sh install expo` creates mobile template symlinks
- [x] 8.1.3 Test `sync.sh install dotnet` creates .NET template symlinks
- [x] 8.1.4 Verify all 10 agents load without errors
- [x] 8.1.5 Verify 12 skills load patterns when invoked
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
