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

## Phase 2: Create New OpenSpec Specifications

### 4. DNS Configuration Spec
- [ ] 4.1 Create openspec/specs/dns-configuration/ directory
- [ ] 4.2 Write spec.md with requirements for AdGuard and Cloudflare DNS setup
- [ ] 4.3 Document DNS resolution, testing, and troubleshooting scenarios
- [ ] 4.4 Validate spec with `openspec validate --strict`

### 5. Home Assistant Integration Spec
- [ ] 5.1 Create openspec/specs/home-assistant-integration/ directory
- [ ] 5.2 Write spec.md covering HACS, MTR-1, auto-discovery, mobile app
- [ ] 5.3 Document integration scenarios and configuration requirements
- [ ] 5.4 Validate spec with `openspec validate --strict`

### 6. Coolify PaaS Spec
- [ ] 6.1 Create openspec/specs/coolify-paas/ directory
- [ ] 6.2 Write spec.md for Coolify setup, deployment, and integration
- [ ] 6.3 Document service deployment and environment variable requirements
- [ ] 6.4 Validate spec with `openspec validate --strict`

### 7. Mac Development Environment Spec
- [ ] 7.1 Create openspec/specs/mac-development-environment/ directory
- [ ] 7.2 Write spec.md for Mac setup automation and dotfiles
- [ ] 7.3 Document Homebrew, Zsh, WezTerm, and Starship requirements
- [ ] 7.4 Validate spec with `openspec validate --strict`

### 8. Deployment Orchestration Spec
- [ ] 8.1 Create openspec/specs/deployment-orchestration/ directory
- [ ] 8.2 Write spec.md for deployment flow, validation, and rollback
- [ ] 8.3 Document backup, health check, and state management requirements
- [ ] 8.4 Validate spec with `openspec validate --strict`

### 9. GitHub Actions Workflows Spec
- [ ] 9.1 Create openspec/specs/github-actions-workflows/ directory
- [ ] 9.2 Write spec.md for deploy and monitor workflow requirements
- [ ] 9.3 Document trigger conditions, runner requirements, and notifications
- [ ] 9.4 Validate spec with `openspec validate --strict`

### 10. homelab-services Monorepo Documentation
- [ ] 10.1 Create homelab-services/docs/ directory structure
- [ ] 10.2 Create docs/architecture.md (Better-T-Stack, tRPC, Drizzle ORM, monorepo structure)
- [ ] 10.3 Create docs/development.md (setup, running apps, testing, debugging)
- [ ] 10.4 Create docs/contributing.md (code style, PR process, monorepo conventions)
- [ ] 10.5 Create docs/packages/ directory
- [ ] 10.6 Create docs/packages/ui.md (shared React components documentation)
- [ ] 10.7 Create docs/packages/db.md (database utilities and patterns)
- [ ] 10.8 Create docs/packages/validators.md (Zod schemas and validation)
- [ ] 10.9 Create docs/deployment.md (Docker builds, environment config, CI/CD)
- [ ] 10.10 Create docs/INDEX.md (documentation navigation for monorepo)
- [ ] 10.11 Update homelab-services/README.md to reference detailed docs

## Phase 3: Update Existing Specs with Documentation References

### 11. Update Existing Specifications
- [ ] 11.1 Add "Documentation References" section to bluetooth-automation spec
- [ ] 11.2 Add "Documentation References" section to claude-agent-management spec
- [ ] 11.3 Add "Documentation References" section to claude-test-failure-integration spec
- [ ] 11.4 Add "Documentation References" section to multi-runner-orchestration spec
- [ ] 11.5 Add "Documentation References" section to playwright-report-server spec
- [ ] 11.6 Add "Documentation References" section to steam-gaming-setup spec
- [ ] 11.7 Add "Documentation References" section to usb-boot-automation spec

## Phase 4: Refactor CLAUDE.md (BREAKING CHANGE)

### 12. Restructure CLAUDE.md
- [ ] 12.1 Create new minimal CLAUDE.md structure (~150 lines)
- [ ] 12.2 Include OpenSpec instructions (keep existing lines 1-18)
- [ ] 12.3 Add repository overview (1 paragraph)
- [ ] 12.4 Add architecture summary (1 paragraph each for homelab/mac)
- [ ] 12.5 Add essential commands only (no detailed explanations)
- [ ] 12.6 Add cross-references to docs/INDEX.md and OpenSpec specs
- [ ] 12.7 Add troubleshooting quick links
- [ ] 12.8 Back up original CLAUDE.md to openspec/changes/archive/

### 13. Update Cross-References
- [ ] 13.1 Update homelab/README.md to reference new docs structure
- [ ] 13.2 Add navigation section at top of CLAUDE.md
- [ ] 13.3 Verify all internal links work correctly
- [ ] 13.4 Update any scripts or tools that reference CLAUDE.md sections
- [ ] 13.5 Update homelab-services documentation cross-references

## Phase 5: Validation and Documentation

### 14. Final Validation
- [ ] 14.1 Run `openspec validate --strict` on all new specs
- [ ] 14.2 Verify all documentation cross-references are valid (both repos)
- [ ] 14.3 Test documentation navigation flow (CLAUDE.md → INDEX → service docs → specs)
- [ ] 14.4 Review documentation for consistency and completeness
- [ ] 14.5 Validate homelab-services documentation structure

### 15. Update Supporting Documentation
- [ ] 15.1 Update openspec/project.md with documentation patterns section
- [ ] 15.2 Create migration guide for users familiar with old CLAUDE.md
- [ ] 15.3 Add documentation maintenance guidelines
- [ ] 15.4 Document homelab-services documentation standards

## Phase 6: Archive Old Structure

### 16. Archive Previous Documentation
- [ ] 16.1 Archive extracted CLAUDE.md sections to openspec/changes/archive/
- [ ] 16.2 Keep git history intact for reference
- [ ] 16.3 Add deprecation notice to any outdated documentation files
- [ ] 16.4 Archive old homelab-services documentation if applicable
