# Change: Refactor Documentation Structure for Scalability and Maintainability

## Why

The current CLAUDE.md file has grown to 1443 lines, containing detailed documentation for 12+ distinct capabilities mixed with high-level guidance. This creates several problems:

1. **Cognitive overload**: Users must scan through massive documentation to find relevant information
2. **Maintenance burden**: Updates to a single service require editing a monolithic file
3. **Missing OpenSpec coverage**: Only 7 of 12+ capabilities have formal specs
4. **Duplication**: Information exists in both CLAUDE.md and scattered docs in homelab/docs/
5. **Discovery challenges**: Related documentation is spread across multiple locations

## What Changes

- **BREAKING**: Restructure CLAUDE.md from comprehensive guide (1443 lines) to minimal quick reference (<200 lines)
- Extract detailed service documentation to `/docs/[service]/` structure
- Create OpenSpec specs for undocumented capabilities:
  - DNS Configuration (AdGuard + Cloudflare)
  - Home Assistant Integrations (HACS, MTR-1, Auto-Discovery, Mobile App)
  - Coolify PaaS
  - Mac Setup Environment
  - Homelab Deployment Orchestration
  - GitHub Actions Workflows
- **NEW**: Create comprehensive documentation structure for homelab-services monorepo:
  - Architecture documentation (Better-T-Stack, tRPC, Drizzle ORM)
  - Development guide (setup, workflows, testing)
  - Contributing guide (code style, PR process, monorepo conventions)
  - Package documentation (shared UI components, database utilities)
  - Deployment guide (Docker builds, CI/CD integration)
- Establish documentation standards in project.md
- Create cross-reference index linking CLAUDE.md → service docs → OpenSpec specs

## Impact

**Affected capabilities**:
- All existing specs (7 capabilities): Updated with enhanced documentation references
- New specs (6 capabilities): DNS, Home Assistant, Coolify, Mac Setup, Deployment, GitHub Workflows

**Affected code/files**:

**Installfest Repository:**
- `CLAUDE.md` - Reduced from 1443 to ~150 lines
- `openspec/project.md` - Add documentation standards
- New: `docs/dns/README.md` - DNS configuration
- New: `docs/home-assistant/README.md` - Home Assistant setup
- New: `docs/coolify/README.md` - Coolify PaaS (consolidate existing docs)
- New: `docs/deployment/README.md` - Deployment patterns
- New: `docs/github-actions/README.md` - CI/CD workflows
- New: `mac/README.md` - Mac setup documentation
- New: `docs/INDEX.md` - Documentation cross-reference map
- Existing: All OpenSpec specs - Add documentation references section

**homelab-services Repository:**
- `README.md` - Update to reference detailed documentation
- New: `docs/architecture.md` - Better-T-Stack architecture overview
- New: `docs/development.md` - Development guide and workflows
- New: `docs/contributing.md` - Contributing guidelines
- New: `docs/packages/ui.md` - Shared UI components documentation
- New: `docs/packages/db.md` - Database utilities documentation
- New: `docs/packages/validators.md` - Validation schemas documentation
- New: `docs/deployment.md` - Docker builds and deployment
- New: `docs/INDEX.md` - Documentation navigation

**Benefits**:
- **Faster navigation**: Users find information in 1-2 clicks instead of scrolling
- **Better maintainability**: Changes isolated to relevant service documentation
- **Consistency**: All capabilities have formal specs and detailed docs
- **Discoverability**: Clear documentation hierarchy with cross-references
- **Onboarding**: New users start with minimal CLAUDE.md, drill down as needed

**Migration path**:
- Phase 1: Create new documentation structure (no breaking changes yet)
- Phase 2: Update CLAUDE.md with links to new docs (users can still use old format)
- Phase 3: Slim down CLAUDE.md to minimal format (breaking change)
- Phase 4: Archive old documentation sections in openspec/changes/archive/
