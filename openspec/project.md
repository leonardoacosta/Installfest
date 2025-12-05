# Project Context

## Purpose

Personal dotfiles and homelab infrastructure automation combining:

1. **Mac Development Environment** (`/mac`) - macOS dotfiles, Homebrew packages, system configuration for development productivity
2. **Homelab Infrastructure** (`/homelab`) - Docker-based self-hosted services on Arch Linux server for home automation, media, security, and AI workloads
3. **Better-T-Stack Services** (`/homelab-services`) - Type-safe monorepo with Claude Agent management and Playwright test orchestration

**Goals:**
- Reproducible development environments across machines
- Self-hosted alternative to cloud services
- Automated error detection and remediation via AI agents
- OpenSpec-driven change management for infrastructure evolution
- CI/CD automation via self-hosted GitHub Actions runners

## Tech Stack

### Core Languages & Runtimes
- **TypeScript** - Primary language for all applications
- **Bun** - Package manager and runtime (v1.1+)
- **Node.js** - Secondary runtime for compatibility
- **Bash** - Shell scripts for deployment and automation
- **Zsh** - Interactive shell with Starship prompt

### Frontend Stack (Better-T-Stack)
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with Server Components
- **Tailwind CSS** - Utility-first styling
- **ShadCN UI** - Component library (customized)
- **Framer Motion** - Animation library
- **Monaco Editor** - Code editor component

### Backend Stack (Better-T-Stack)
- **tRPC v11** - Type-safe API layer
- **Drizzle ORM** - Type-safe database ORM
- **SQLite** - Database (claude.db)
- **Better-Auth** - Authentication (planned)
- **React Query** - Data fetching and caching

### Infrastructure & DevOps
- **Docker & Docker Compose** - Container orchestration
- **Traefik** - Reverse proxy and load balancer
- **GitHub Actions** - CI/CD pipelines
- **Self-hosted Runners** - Build and deployment agents
- **Coolify** - PaaS for service management (optional)
- **Tailscale** - VPN and service mesh

### Homelab Services
- **Home Assistant** - Home automation hub
- **AdGuard Home** - DNS server and ad blocker
- **Vaultwarden** - Password manager
- **Jellyfin** - Media server
- **Arr Stack** - Media automation (Sonarr, Radarr, Prowlarr, etc.)
- **qBittorrent** - Download client with VPN
- **Gluetun** - VPN container
- **Ollama** - Local LLM inference
- **Glance** - Dashboard aggregator

### Testing & Quality
- **Playwright** - E2E testing framework
- **Bun Test** - Unit testing
- **TypeScript ESLint** - Linting
- **Prettier** - Code formatting

### Development Tools
- **Turbo** - Monorepo build system
- **WezTerm** - Terminal emulator
- **Zed** - Code editor
- **Git** - Version control

## Project Conventions

### Code Style

**TypeScript:**
- Strict mode enabled (`"strict": true`)
- Prefer `interface` over `type` for object shapes
- Use explicit return types for exported functions
- Prefer functional components and hooks
- Use `const` assertions for immutable objects

**Naming Conventions:**
- Files: `kebab-case.ts` or `kebab-case.tsx`
- Components: `PascalCase.tsx`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Database tables: `snake_case`
- tRPC routers: `camelCase` procedures

**Formatting:**
- Prettier with default settings
- Single quotes for strings
- Semicolons required
- 2-space indentation
- Trailing commas in multi-line

**Import Order:**
1. React/Next.js imports
2. Third-party libraries
3. Internal packages (`@/...`)
4. Relative imports
5. Type imports last

### Architecture Patterns

**Monorepo Structure:**
```
homelab-services/
├── apps/           # Next.js applications
├── packages/       # Shared libraries
│   ├── api/        # tRPC routers and business logic
│   ├── db/         # Database schema and client
│   ├── ui/         # Shared UI components
│   └── validators/ # Zod schemas
```

**Better-T-Stack Patterns:**
- **App Router** - Use server components by default, client components only when needed
- **Server Actions** - Prefer tRPC over Next.js server actions for mutations
- **tRPC Subscriptions** - Real-time updates via EventEmitter + observables
- **Drizzle Queries** - Use prepared statements for performance
- **Zod Schemas** - Single source of truth for validation (reuse in validators package)

**API Layer:**
- All database logic in `packages/api/src/router/*.ts`
- Services in `packages/api/src/services/*.ts` for complex business logic
- Utils in `packages/api/src/utils/*.ts` for pure functions
- Context in `packages/api/src/context.ts` for shared state

**UI Components:**
- ShadCN UI as base, customize in `packages/ui/src/components/ui/*.tsx`
- Composite components in `packages/ui/src/components/*/` (charts, navigation, etc.)
- Export all components via `packages/ui/src/index.ts`
- Dark mode via next-themes (system default)

**Database:**
- Drizzle schema in `packages/db/src/schema/*.ts` (one file per domain)
- Migrations in `packages/db/migrations/*.sql`
- Transactions via `packages/db/src/transactions.ts` helpers
- Pagination via `packages/db/src/pagination.ts` utilities

**Docker Homelab:**
- Service definitions split by category (`compose/*.yml`)
- Environment variables in `.env` (auto-generated by wizard)
- Dynamic Traefik config in `traefik/dynamic/*.yml`
- Service state preserved in Docker volumes

**OpenSpec Change Management:**
- All changes start with `/openspec:proposal`
- Specs in `openspec/specs/<name>/spec.md`
- Active changes in `openspec/changes/<id>-<name>/`
- Archive completed changes via `/openspec:archive`

### Testing Strategy

**Unit Tests (Bun Test):**
- Co-locate tests with source: `src/__tests__/*.test.ts`
- Use descriptive test names: `"should return error proposals sorted by priority"`
- Mock external dependencies (database, filesystem)
- Aim for >80% coverage on business logic

**Integration Tests:**
- Test API routers with real database (in-memory SQLite)
- Use `beforeEach` to reset database state
- Test happy paths and error cases
- File: `packages/api/src/services/__tests__/*.integration.test.ts`

**E2E Tests (Playwright):**
- Test critical user flows end-to-end
- Use Page Object Model for reusability
- Run against local dev server (port 3002, 3000)
- File: `apps/*/e2e/*.spec.ts`
- Generate reports to `playwright-reports/*.json`

**Test Data:**
- Use factories for consistent test data
- Avoid hardcoded IDs (use auto-increment)
- Clean up after tests (transactions + rollback)

**CI/CD Testing:**
- Run unit tests on every commit
- Run integration tests on PR
- Run E2E tests before deployment
- Auto-generate error proposals from failures

### Git Workflow

**Branching Strategy:**
- `main` - Production-ready code
- Feature branches: `feature/<description>`
- Hotfix branches: `hotfix/<description>`
- No develop branch (CI/CD from main)

**Commit Conventions:**
- Use conventional commits format:
  - `feat: add unified work dashboard`
  - `fix: resolve race condition in worker monitor`
  - `docs: update deployment guide`
  - `refactor: extract error analysis to utils`
  - `test: add E2E tests for dashboard filtering`
  - `chore: update dependencies`

**OpenSpec Commits:**
- Include change ID in commits: `feat: implement change 6 - unified dashboard`
- Reference tasks: `Complete Phase 6.5: Real-time subscriptions`
- Archive marker: `Archive Change 5: Error automation system`

**PR Requirements:**
- Link to OpenSpec change if applicable
- Include screenshots for UI changes
- Pass all CI checks (lint, test, build)
- Update documentation if needed

## Domain Context

**OpenSpec Workflow:**
- **Proposing** → User reviews proposal.md and tasks.md
- **Approved** → Added to work queue with priority
- **Assigned** → Linked to session, worker spawned
- **In Progress** → Worker executing tasks
- **Review** → Worker completed, awaiting validation
- **Applied** → User validated, change deployed
- **Archived** → Rejected or superseded

**Work Queue Priority:**
- 1 (Lowest) - Nice-to-have improvements
- 2 (Low) - Non-critical bugs
- 3 (Medium) - Standard features
- 4 (High) - Important fixes
- 5 (Highest) - Critical errors

**Worker Agent Types:**
- `t3-stack-developer` - Full-stack Better-T-Stack work
- `nextjs-frontend-specialist` - UI/UX implementation
- `trpc-backend-engineer` - API and business logic
- `database-architect` - Schema and query optimization
- `e2e-test-engineer` - Playwright test creation
- `ux-design-specialist` - Design system work
- `docker-network-architect` - Container orchestration

**Error Classification:**
- `type-error` - TypeScript compilation errors
- `missing-property` - Undefined property access
- `assertion-failure` - Test expectation failures
- `network-error` - API/network timeouts
- `configuration-error` - Invalid config/env

**Homelab Networks:**
- `homelab` (172.20.0.0/16) - Core services
- `media` (172.21.0.0/16) - VPN-protected media stack

**Service Discovery:**
- Internal: `http://<service-name>:<port>`
- External: `https://<service>.tail<redacted>.ts.net` (Tailscale)
- Traefik: `https://<service>.local` (via AdGuard DNS rewrite)

## Important Constraints

**Technical Constraints:**
- Homelab runs on single Arch Linux server (resource-limited)
- Mac setup must work without network access
- Database is SQLite (no PostgreSQL for simplicity)
- No public internet exposure (Tailscale VPN only)
- Self-hosted runners have limited concurrency

**Security Constraints:**
- All secrets in `.env` files (never commit)
- Traefik certificates stored in Docker volumes
- VPN required for all external access
- AdGuard Home blocks ads and malware domains
- Vaultwarden for password management

**Operational Constraints:**
- Deployments must be atomic (rollback on failure)
- Service downtime must be minimal (<30s)
- Logs must be accessible via `docker compose logs`
- Configuration must be declarative (GitOps)
- State must survive container restarts

**Development Constraints:**
- Use Bun for all package management (no npm/yarn)
- TypeScript strict mode required
- All APIs must be type-safe (tRPC)
- Real-time features require tRPC subscriptions
- Monaco editor must load dynamically (SSR issue)

## External Dependencies

**Cloud Services:**
- **GitHub** - Git hosting and CI/CD (self-hosted runners)
- **Anthropic Claude API** - AI agent automation (via Claude Code CLI)
- **Tailscale** - VPN and service mesh

**External APIs:**
- **TheTVDB** - TV show metadata (via Sonarr)
- **TheMovieDB** - Movie metadata (via Radarr)
- **MusicBrainz** - Music metadata (via Lidarr)
- **OpenSubtitles** - Subtitle downloads (via Bazarr)
- **Usenet Indexers** - Content search (via Prowlarr)

**DNS Dependencies:**
- **Cloudflare DNS** - Public DNS fallback (1.1.1.1)
- **AdGuard Home** - Local DNS server and filtering
- **Tailscale MagicDNS** - VPN DNS resolution

**Infrastructure Dependencies:**
- **Docker Hub** - Container images
- **GitHub Container Registry** - Custom images (future)
- **Homebrew** - macOS package manager
- **AUR** - Arch Linux package repository

**Development Dependencies:**
- **Context7** - Documentation lookup (MCP server)
- **Playwright MCP** - Browser automation (MCP server)
- **Sequential Thinking MCP** - AI reasoning (MCP server)
