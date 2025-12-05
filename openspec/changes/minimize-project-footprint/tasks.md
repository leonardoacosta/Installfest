# Implementation Tasks: Minimize Project Footprint

## Phase 1: Audit & Planning (Non-Destructive)

### 1.1 Documentation Audit
- [ ] Generate file-by-file usage report (grep references across codebase)
- [ ] Identify duplicate content (diff analysis)
- [ ] Mark migration guides as candidates for archival
- [ ] List all cross-references that will break

### 1.2 Script Audit
- [ ] Check git history for last modification date of each script
- [ ] Grep codebase for script invocations (find active scripts)
- [ ] Identify utility function duplication across scripts
- [ ] Document which scripts are CI-critical

### 1.3 Config Audit
- [ ] Parse all compose files to identify service overlap
- [ ] Count environment variable usage across services
- [ ] Identify unused service definitions
- [ ] Validate all configs: `docker compose config -q`

## Phase 2: Documentation Consolidation

### 2.1 Merge Duplicate Docs
- [ ] VAULTWARDEN: Merge SETUP + SUMMARY into docs/vaultwarden/README.md
- [ ] TRAEFIK: Merge MIGRATION_GUIDE + MIGRATION_SUMMARY, archive to openspec/changes/archive/
- [ ] TAILSCALE: Consolidate ADGUARD-IPTABLES-ISSUE + ROUTES-RESTORATION-SETUP
- [ ] COOLIFY: Move COOLIFY_SETUP.md to docs/coolify/README.md (update cross-refs)
- [ ] GLANCE: Move GLANCE_INTEGRATION_GUIDE.md to docs/glance/README.md

### 2.2 Archive Historical Docs
- [ ] Move TRAEFIK_VS_NPM.md to openspec/changes/archive/ (decision made, historical only)
- [ ] Archive or delete SECURITY_AUDIT.md (if findings addressed, delete; else move to docs/security/)
- [ ] Remove SERVICES.md (redundant with docs/INDEX.md)

### 2.3 Condense CLAUDE.md
- [ ] Remove detailed troubleshooting (keep in service docs only)
- [ ] Simplify architecture summary (link to detailed docs)
- [ ] Remove examples (keep in service docs)
- [ ] Keep only essential commands and cross-refs
- [ ] Target: <200 lines

### 2.4 Consolidate homelab/docs → docs/
- [ ] Move remaining homelab/docs files into docs/ hierarchy
- [ ] Update all cross-references (grep for `homelab/docs/`)
- [ ] Delete empty homelab/docs directory
- [ ] Update docs/INDEX.md with new paths

## Phase 3: Script Simplification

### 3.1 Deployment Script Consolidation
- [ ] Compare deploy-ci.sh vs deploy-ci-streamlined.sh functionality
- [ ] Choose canonical version (likely streamlined)
- [ ] Port any missing features from deprecated script
- [ ] Update CI workflows (.github/workflows/deploy-homelab.yml)
- [ ] Delete deprecated script
- [ ] Update docs references

### 3.2 Remove Archived Feature Scripts
- [ ] Delete setup-bluetooth.sh (if archived in specs/bluetooth-automation)
- [ ] Delete setup-steam.sh (if archived in specs/steam-gaming-setup)
- [ ] Delete setup-hacs.sh (if Home Assistant setup docs cover this)
- [ ] Update any references in homelab.sh wizard

### 3.3 Consolidate Utilities
- [ ] Audit common-utils.sh for unused functions
- [ ] Search all scripts for duplicated utility functions
- [ ] Move duplicates into common-utils.sh
- [ ] Remove dead code from common-utils.sh
- [ ] Document utility function usage

### 3.4 Inline Single-Use Scripts
- [ ] Identify scripts called exactly once
- [ ] Inline into parent script if <30 lines
- [ ] Document decision in commit message

## Phase 4: Config Optimization

### 4.1 Merge Compose Files
- [ ] Merge small compose files (<50 lines) into logical parents:
  - claude-agent-server.yml + playwright-server.yml → compose/apps.yml
  - storage.yml into infrastructure.yml (if only a few services)
- [ ] Keep separate: infrastructure.yml, media.yml, ai.yml, platform.yml, vpn.yml, monitoring.yml
- [ ] Update docker-compose.yml includes
- [ ] Validate: `docker compose config -q`

### 4.2 Consolidate Traefik Configs
- [ ] Merge gluetun-routers.yml into appropriate dynamic config
- [ ] Consolidate middlewares if <5 unique definitions
- [ ] Keep separate: middlewares.yml, tls.yml, routers.yml (if large)
- [ ] Validate Traefik config: `docker compose exec traefik traefik healthcheck`

### 4.3 Deduplicate Environment Variables
- [ ] Audit .env.example for duplicate definitions
- [ ] Use Docker Compose anchors/extensions for repeated values
- [ ] Document shared variables in .env.example comments
- [ ] Validate no hardcoded values remain: `docker compose config --no-interpolate`

## Phase 5: Process Improvements

### 5.1 Pre-Commit Hooks
- [ ] Add file size linter (warn >500 lines for docs, >300 for scripts)
- [ ] Add duplicate content detector (fail on >20% similarity between docs)
- [ ] Add shellcheck for scripts
- [ ] Add yamllint for configs
- [ ] Document in .pre-commit-config.yaml

### 5.2 CI Enforcement
- [ ] Add documentation duplication check to CI
- [ ] Add file size check to CI (fail build on violations)
- [ ] Add unused file detector (fail if file not referenced in 6 months)
- [ ] Update .github/workflows/lint.yml

### 5.3 Documentation Standards
- [ ] Create CONTRIBUTING.md section: "When to Archive Features"
- [ ] Add archival checklist template
- [ ] Document file size targets in project.md
- [ ] Add "split vs consolidate" decision tree
- [ ] Update openspec/project.md Documentation Standards section

## Phase 6: Validation & Rollout

### 6.1 Validation
- [ ] Run full deployment with new configs: `bash scripts/deploy-ci-streamlined.sh`
- [ ] Verify all services healthy
- [ ] Check all cross-references resolve correctly
- [ ] Run `openspec validate --strict` on all specs
- [ ] Verify CI passes with new hooks

### 6.2 Documentation Updates
- [ ] Update CLAUDE.md with new structure
- [ ] Update docs/INDEX.md with merged paths
- [ ] Update README files with archival notices
- [ ] Add migration guide for contributors

### 6.3 Rollout
- [ ] Merge to dev branch
- [ ] Monitor CI deployment
- [ ] Verify services remain healthy
- [ ] Merge to main after 24h soak
- [ ] Archive this change: `openspec archive minimize-project-footprint`

## Non-Goals

- **Not refactoring code logic** - only consolidating files
- **Not changing service behavior** - only documentation/config organization
- **Not optimizing runtime performance** - only maintainability
- **Not removing active features** - only archived/duplicate content

## Rollback Plan

If deployment fails after consolidation:
1. Revert git commit
2. Redeploy previous version: `git checkout HEAD~1 && bash scripts/deploy-ci-streamlined.sh`
3. Restore backups if needed: `~/homelab-backups/backup-latest/`
4. Document failure in openspec/changes/minimize-project-footprint/design.md
