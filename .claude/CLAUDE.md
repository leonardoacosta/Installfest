# Global Development Standards

## Code Style

- Use ES modules (import/export), not CommonJS
- Prefer TypeScript strict mode
- Use functional components in React
- Named exports over default exports
- No `any` types - use `unknown` and narrow

## Commits

- Use conventional commits: feat:, fix:, chore:, docs:, refactor:
- Keep commits atomic and focused
- Write descriptive commit messages

## Quality Gates

Before any push:

1. `pnpm typecheck`
2. `pnpm build`
3. `pnpm test`
4. `pnpm lint`

## AI Workflow

- Use OpenSpec for features requiring specs
- Organize tasks into parallel groups before applying
- Store context before clearing: /store-context [name]
- Archive completed specs with /archive [name]

---

## Platform Conventions

### T3 Stack (Next.js + tRPC + Drizzle)

**Project Structure:**
```
apps/web/           # Next.js app (App Router)
packages/api/       # tRPC routers
packages/db/        # Drizzle schema
packages/ui/        # ShadCN components
packages/validators # Zod schemas
```

**Key Patterns:**
- Server Components by default, Client only for interactivity
- tRPC procedures grouped by domain: `userRouter`, `postRouter`
- Forms use react-hook-form + zodResolver
- Use `protectedProcedure` for authenticated endpoints
- All tables have `createdAt` and `updatedAt` timestamps

**Imports:**
```typescript
import { db } from "@repo/db";
import { users } from "@repo/db/schema";
import { createUserSchema } from "@repo/validators";
import { Button } from "@repo/ui/button";
```

### React Native (Expo)

**Project Structure:**
```
app/               # Expo Router screens
  (tabs)/          # Tab navigation
  (auth)/          # Auth flow
components/        # Shared components
lib/               # Utilities, API client
```

**Key Patterns:**
- Use Expo Router for file-based navigation
- NativeWind for styling (Tailwind syntax)
- MMKV for sync storage, SecureStore for secrets
- Always request permissions before native features
- Test on physical devices, not just simulators

### .NET (Azure)

**Project Structure:**
```
src/Api/            # Web API controllers
src/Functions/      # Azure Functions
src/Core/           # Domain models
src/Infrastructure/ # Data access
tests/              # xUnit tests
```

**Key Patterns:**
- Use `IOptions<T>` for configuration
- Secrets in Azure Key Vault, never appsettings
- Entity Framework for CRUD, Dapper for complex queries
- All endpoints return `ActionResult<T>`
- Use structured logging with Application Insights

---

## Skill Usage

Skills are token-efficient code patterns loaded on-demand:

```
# Load a skill when needed
@skill t3-patterns/trpc-router
@skill testing/playwright-e2e
@skill monorepo/turborepo-setup
```

**Available Skills:**
- `t3-patterns/`: trpc-router, drizzle-schema, zod-validation, react-hook-form, state-management, payments, monitoring
- `testing/`: playwright-e2e, vitest-unit, integration-tests
- `monorepo/`: turborepo-setup, package-structure

---

## Agent Usage

Spawn specialized agents for focused work:

```
# Task tool with subagent_type
Task(subagent_type="t3-stack-developer", prompt="...")
Task(subagent_type="e2e-test-engineer", prompt="...")
```

**Available Agents:**
- `t3-stack-developer`: Full-stack T3 features
- `trpc-backend-engineer`: API design, middleware
- `database-architect`: PostgreSQL + Drizzle optimization
- `nextjs-frontend-specialist`: Next.js + ShadCN UI
- `expo-mobile-specialist`: React Native + Expo
- `dotnet-azure-specialist`: .NET + Azure services
- `e2e-test-engineer`: Playwright testing
- `ux-design-specialist`: Design systems, Figma-to-code
- `ui-animation-specialist`: Framer Motion, micro-interactions
- `redis-cache-architect`: Caching strategies, Upstash

---

## Command Usage

Slash commands for workflow automation:

**Quality & Development:**
- `/fix-types`: Find and fix TypeScript errors
- `/run-quality-gates`: Execute typecheck, build, test, lint
- `/parallel-apply [spec-id]`: Apply OpenSpec with parallel batching

**Context Management:**
- `/store-context [name]`: Save context before clearing session
- `/resume [name]`: Resume work from stored context
- `/recall [name]`: View learnings from archived specs

**Spec Lifecycle:**
- `/archive [name]`: Archive completed spec with validation

---

## Parallel Execution

When multiple independent tasks exist, execute in parallel:

```markdown
# In tasks.md, mark parallel tasks:
- [ ] 1.1 Create file A [parallel:group1]
- [ ] 1.2 Create file B [parallel:group1]
- [ ] 1.3 Create file C [parallel:group1]
- [ ] 2.1 Test files (depends: 1.1, 1.2, 1.3)
```

In responses, use multiple tool calls in single message for parallel execution.

---

## Hooks

Automatic validation hooks:

- **PostToolUse (Write/Edit)**: TypeScript type checking on `.ts/.tsx` files
- **SubagentStop**: Verify task completion before exit
- **PreCommit**: Run quality gates (typecheck + lint)
- **PrePush**: Run tests before push

Override locally in `.claude/settings.local.json` (gitignored).

---

## Symlink Configuration

This repo provides centralized config for all projects:

```bash
# Install in satellite project (templates: minimal, t3-expo, dotnet)
cd ~/my-project
~/Personal/Installfest/sync.sh install t3-expo

# Check status
~/Personal/Installfest/sync.sh status

# Promote useful patterns back to central repo
~/Personal/Installfest/sync.sh promote .claude/skills/custom/pattern.md
```

**Templates:**
- `minimal` - Basic global config only
- `t3-expo` - T3 Stack + Expo monorepo (Next.js web + React Native mobile)
- `dotnet` - .NET Azure enterprise apps

Changes to central repo immediately sync to all linked projects.
