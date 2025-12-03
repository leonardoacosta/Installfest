# Implementation Tasks: Unify Homelab Servers Monorepo

## 1. Repository Restructure

- [x] 1.1 Rename `claude-agent-server/` to `homelab-services/`
- [x] 1.2 Update root package.json with workspace configuration
- [x] 1.3 Move existing `apps/api/` to `apps/claude-agent/`
- [x] 1.4 Update imports in claude-agent to use new paths
- [x] 1.5 Test that claude-agent still builds: `bun run build`

## 2. Shared Packages Scaffolding

- [x] 2.1 Create `packages/ui/` directory structure
- [x] 2.2 Create `packages/ui/package.json` with @homelab/ui name
- [ ] 2.3 Setup shadcn/ui configuration in packages/ui (deferred - basic components working)
- [x] 2.4 Create `packages/db/` directory structure (already existed)
- [x] 2.5 Create `packages/db/package.json` with @homelab/db name
- [x] 2.6 Create `packages/validators/` directory structure (already existed)
- [x] 2.7 Create `packages/validators/package.json` with @homelab/validators name
- [ ] 2.8 Create `packages/config/` for shared TypeScript configs (deferred)
- [x] 2.9 Update turbo.json with package build pipeline (already configured)

## 3. UI Package Implementation

- [x] 3.1 Create `packages/ui/src/data-table.tsx` component
- [x] 3.2 Create `packages/ui/src/date-range-picker.tsx` component
- [x] 3.3 Create `packages/ui/src/stats-card.tsx` component
- [x] 3.4 Create `packages/ui/src/layout.tsx` component
- [x] 3.5 Create `packages/ui/src/search-input.tsx` component
- [ ] 3.6 Setup Tailwind config in packages/ui (deferred - using inline classes)
- [x] 3.7 Add package exports in packages/ui/package.json
- [x] 3.8 Build UI package: `turbo run build --filter=@homelab/ui`

## 4. Database Package Implementation

- [x] 4.1 Create `packages/db/src/connection.ts` with createDb factory (already existed)
- [x] 4.2 Create `packages/db/src/pagination.ts` with pagination helpers
- [x] 4.3 Create `packages/db/src/transaction.ts` with transaction wrappers
- [x] 4.4 Add better-sqlite3 and drizzle-orm to package.json (already existed)
- [x] 4.5 Add package exports in packages/db/package.json
- [x] 4.6 Build DB package: `turbo run build --filter=@homelab/db`

## 5. Validators Package Implementation

- [x] 5.1 Create `packages/validators/src/common.ts` with pagination schema
- [x] 5.2 Create `packages/validators/src/date-range.ts` schema
- [x] 5.3 Create `packages/validators/src/hooks.ts` for claude-agent (already existed)
- [x] 5.4 Create `packages/validators/src/reports.ts` for playwright-server
- [x] 5.5 Add zod dependency to package.json (already existed)
- [x] 5.6 Add package exports in packages/validators/package.json
- [x] 5.7 Build validators package: `turbo run build --filter=@homelab/validators`

## 6. Claude Agent Migration to Shared Packages

- [ ] 6.1 Add @homelab/ui to apps/claude-agent dependencies
- [ ] 6.2 Add @homelab/db to apps/claude-agent dependencies
- [ ] 6.3 Add @homelab/validators to apps/claude-agent dependencies
- [ ] 6.4 Replace database connection code with @homelab/db
- [ ] 6.5 Replace pagination logic with @homelab/db helpers
- [ ] 6.6 Migrate hooks table to use DataTable from @homelab/ui
- [ ] 6.7 Migrate date filtering to use DateRangePicker from @homelab/ui
- [ ] 6.8 Migrate stats display to use StatsCard from @homelab/ui
- [ ] 6.9 Update tRPC schemas to use @homelab/validators
- [ ] 6.10 Test claude-agent builds: `turbo run build --filter=claude-agent`
- [ ] 6.11 Test claude-agent in dev mode: `turbo run dev --filter=claude-agent`

## 7. Playwright Server Integration

- [x] 7.1 Copy playwright-server source to `apps/playwright-server/`
- [x] 7.2 Create apps/playwright-server/package.json
- [x] 7.3 Create apps/playwright-server/tsconfig.json
- [x] 7.4 Add @homelab/ui to apps/playwright-server dependencies
- [x] 7.5 Add @homelab/db to apps/playwright-server dependencies
- [x] 7.6 Add @homelab/validators to apps/playwright-server dependencies
- [ ] 7.7 Replace database connection with @homelab/db (deferred - basic server works)
- [ ] 7.8 Migrate report list to use DataTable from @homelab/ui (deferred)
- [ ] 7.9 Migrate date filtering to use DateRangePicker from @homelab/ui (deferred)
- [ ] 7.10 Migrate stats display to use StatsCard from @homelab/ui (deferred)
- [ ] 7.11 Update API schemas to use @homelab/validators (deferred)
- [x] 7.12 Test playwright-server builds: `turbo run build --filter=playwright-server`
- [ ] 7.13 Test playwright-server in dev mode: `turbo run dev --filter=playwright-server` (deferred)

## 8. Docker Configuration

- [x] 8.1 Create `docker/claude.Dockerfile` for claude-agent
- [x] 8.2 Create `docker/playwright.Dockerfile` for playwright-server
- [ ] 8.3 Update docker-compose.yml to use new build contexts (deferred - homelab deployment)
- [ ] 8.4 Update docker-compose.yml service names (deferred - homelab deployment)
- [ ] 8.5 Test Docker build for claude-agent: `docker build -f docker/claude.Dockerfile .` (deferred)
- [ ] 8.6 Test Docker build for playwright-server: `docker build -f docker/playwright.Dockerfile .` (deferred)
- [ ] 8.7 Update Traefik routes for new container names (deferred - homelab deployment)
- [ ] 8.8 Test full docker-compose deployment: `docker compose up -d` (deferred - homelab deployment)

## 9. CI/CD Updates

- [ ] 9.1 Update GitHub Actions workflows for monorepo structure
- [ ] 9.2 Add Turborepo remote caching configuration (optional)
- [ ] 9.3 Update deploy script to handle multiple apps
- [ ] 9.4 Test deployment workflow on dev branch
- [ ] 9.5 Update monitoring script for new service names

## 10. Documentation

- [ ] 10.1 Update CLAUDE.md with monorepo structure (deferred - main homelab docs)
- [x] 10.2 Create homelab-services/README.md with architecture overview
- [x] 10.3 Document shared package usage in packages/README.md
- [ ] 10.4 Update homelab deployment docs for new structure (deferred - main homelab docs)
- [ ] 10.5 Add migration notes for other developers (if applicable) (N/A - solo developer)

## 11. Testing & Validation

- [x] 11.1 Run full monorepo build: `turbo run build`
- [ ] 11.2 Test both services in dev mode simultaneously (deferred - runtime testing)
- [ ] 11.3 Verify shared components render correctly in both apps (deferred - UI integration)
- [ ] 11.4 Test Docker deployments on homelab server (deferred - deployment phase)
- [ ] 11.5 Verify Traefik routing works for both services (deferred - deployment phase)
- [ ] 11.6 Verify database operations work in both services
- [ ] 11.7 Load test shared component library (check for bottlenecks)
- [ ] 11.8 Verify hot reload works for package changes

## 12. Cleanup

- [ ] 12.1 Remove old standalone playwright-server directory (if exists)
- [ ] 12.2 Archive migrate-claude-agent-to-better-t-stack change
- [ ] 12.3 Archive migrate-playwright-server-to-better-t-stack change
- [ ] 12.4 Update openspec specs with monorepo architecture
- [ ] 12.5 Clean up any duplicate code between apps
- [ ] 12.6 Run linter across entire monorepo
- [ ] 12.7 Update .gitignore for monorepo patterns

## Notes

- Each phase should be tested before moving to next
- Rollback strategy: Keep existing structure until Phase 7 complete
- All shared packages should be generic (no app-specific logic)
- Use `workspace:*` for internal package dependencies
