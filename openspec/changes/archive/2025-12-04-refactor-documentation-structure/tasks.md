# Implementation Tasks

## Phase 1: Establish Documentation Standards (No Breaking Changes) ✅ COMPLETE

### 1. Documentation Standards

- [x] 1.1 Add documentation standards section to openspec/project.md
- [x] 1.2 Define service documentation template structure
- [x] 1.3 Define cross-reference linking conventions
- [x] 1.4 Define documentation file naming conventions

### 2. Create New Service Documentation Structure

- [x] 2.1 Create docs/dns/ directory and README.md (extract from CLAUDE.md lines 298-413)
- [x] 2.2 Create docs/home-assistant/ directory and README.md (extract from CLAUDE.md lines 427-515)
- [x] 2.3 Create docs/coolify/ directory and README.md (consolidate COOLIFY_QUICKSTART.md + docs/COOLIFY_SETUP.md)
- [x] 2.4 Create docs/deployment/ directory and README.md (extract from CLAUDE.md lines 200-212, deployment flow)
- [x] 2.5 Create docs/github-actions/ directory and README.md (extract from CLAUDE.md lines 126-140)
- [x] 2.6 Create mac/README.md (extract from CLAUDE.md lines 66-123)

### 3. Create Documentation Index

- [x] 3.1 Create docs/INDEX.md with cross-reference map
- [x] 3.2 Document capability → spec → detailed docs relationships
- [x] 3.3 Add quick navigation guides for common tasks

## Phase 2: Create New OpenSpec Specifications ✅ COMPLETE

### 4. DNS Configuration Spec ✅ COMPLETE

- [x] 4.1 Create openspec/specs/dns-configuration/ directory
- [x] 4.2 Write spec.md with requirements for AdGuard and Cloudflare DNS setup
- [x] 4.3 Document DNS resolution, testing, and troubleshooting scenarios
- [x] 4.4 Validate spec with `openspec validate --strict`

### 5. Home Assistant Integration Spec ✅ COMPLETE

- [x] 5.1 Create openspec/specs/home-assistant-integration/ directory
- [x] 5.2 Write spec.md covering HACS, MTR-1, auto-discovery, mobile app
- [x] 5.3 Document integration scenarios and configuration requirements
- [x] 5.4 Validate spec with `openspec validate --strict`

### 6. Coolify PaaS Spec ✅ COMPLETE

- [x] 6.1 Create openspec/specs/coolify-paas/ directory
- [x] 6.2 Write spec.md for Coolify setup, deployment, and integration
- [x] 6.3 Document service deployment and environment variable requirements
- [x] 6.4 Validate spec with `openspec validate --strict`

### 7. Mac Development Environment Spec ✅ COMPLETE

- [x] 7.1 Create openspec/specs/mac-development-environment/ directory
- [x] 7.2 Write spec.md for Mac setup automation and dotfiles
- [x] 7.3 Document Homebrew, Zsh, WezTerm, and Starship requirements
- [x] 7.4 Validate spec with `openspec validate --strict`

### 8. Deployment Orchestration Spec ✅ COMPLETE

- [x] 8.1 Create openspec/specs/deployment-orchestration/ directory
- [x] 8.2 Write spec.md for deployment flow, validation, and rollback
- [x] 8.3 Document backup, health check, and state management requirements
- [x] 8.4 Validate spec with `openspec validate --strict`

### 9. GitHub Actions Workflows Spec ✅ COMPLETE

- [x] 9.1 Create openspec/specs/github-actions-workflows/ directory
- [x] 9.2 Write spec.md for deploy and monitor workflow requirements
- [x] 9.3 Document trigger conditions, runner requirements, and notifications
- [x] 9.4 Validate spec with `openspec validate --strict`

### 10. homelab-services Monorepo Documentation ✅ COMPLETE

- [x] 10.1 Create homelab-services/docs/ directory structure
- [x] 10.2 Create docs/architecture.md (Better-T-Stack, tRPC, Drizzle ORM, monorepo structure)
- [x] 10.3 Create docs/development.md (setup, running apps, testing, debugging)
- [x] 10.4 Create docs/contributing.md (code style, PR process, monorepo conventions)
- [x] 10.5 Create docs/packages/ directory
- [x] 10.6 Create docs/packages/ui.md (shared React components documentation)
- [x] 10.7 Create docs/packages/db.md (database utilities and patterns)
- [x] 10.8 Create docs/packages/validators.md (Zod schemas and validation)
- [x] 10.9 Create docs/deployment.md (Docker builds, environment config, CI/CD)
- [x] 10.10 Create docs/INDEX.md (documentation navigation for monorepo)
- [x] 10.11 Update homelab-services/README.md to reference detailed docs

## Phase 3: Update Existing Specs with Documentation References ✅ COMPLETE

### 11. Update Existing Specifications ✅ COMPLETE

- [x] 11.1 Add "Documentation References" section to bluetooth-automation spec
- [x] 11.2 Add "Documentation References" section to claude-agent-management spec
- [x] 11.3 Add "Documentation References" section to claude-test-failure-integration spec
- [x] 11.4 Add "Documentation References" section to multi-runner-orchestration spec
- [x] 11.5 Add "Documentation References" section to playwright-report-server spec
- [x] 11.6 Add "Documentation References" section to steam-gaming-setup spec
- [x] 11.7 Add "Documentation References" section to usb-boot-automation spec

## Phase 4: Refactor CLAUDE.md (BREAKING CHANGE) ✅ COMPLETE

### 12. Restructure CLAUDE.md ✅ COMPLETE

- [x] 12.1 Create new minimal CLAUDE.md structure (~150 lines) - Reduced to 189 lines (87% reduction)
- [x] 12.2 Include OpenSpec instructions (keep existing lines 1-18)
- [x] 12.3 Add repository overview (1 paragraph)
- [x] 12.4 Add architecture summary (1 paragraph each for homelab/mac)
- [x] 12.5 Add essential commands only (no detailed explanations)
- [x] 12.6 Add cross-references to docs/INDEX.md and OpenSpec specs
- [x] 12.7 Add troubleshooting quick links
- [x] 12.8 Back up original CLAUDE.md to openspec/changes/archive/

### 13. Update Cross-References ✅ COMPLETE

- [x] 13.1 Update homelab/README.md to reference new docs structure
- [x] 13.2 Add navigation section at top of CLAUDE.md
- [x] 13.3 Verify all internal links work correctly
- [x] 13.4 Update any scripts or tools that reference CLAUDE.md sections - N/A (no scripts reference CLAUDE.md)
- [x] 13.5 Update homelab-services documentation cross-references - Already complete from Phase 2

## Phase 5: Validation and Documentation ✅ COMPLETE

### 14. Final Validation ✅ COMPLETE

- [x] 14.1 Run `openspec validate --strict` on all new specs
- [x] 14.2 Verify all documentation cross-references are valid (both repos)
- [x] 14.3 Test documentation navigation flow (CLAUDE.md → INDEX → service docs → specs)
- [x] 14.4 Review documentation for consistency and completeness
- [x] 14.5 Validate homelab-services documentation structure

### 15. Update Supporting Documentation ✅ COMPLETE

- [x] 15.1 Update openspec/project.md with documentation patterns section
- [x] 15.2 Add documentation maintenance guidelines
- [x] 15.3 Document homelab-services documentation standards

## Phase 6: Archive Old Structure ✅ COMPLETE

### 16. Archive Previous Documentation ✅ COMPLETE

- [x] 16.1 Archive extracted CLAUDE.md sections to openspec/changes/archive/
- [x] 16.2 Keep git history intact for reference
- [x] 16.3 Add deprecation notice to any outdated documentation files
