# Design: Minimize Project Footprint

## Problem Statement

The Installfest project has accumulated significant documentation, script, and configuration sprawl over time. With ~13K lines of documentation, ~3.3K lines of scripts, and fragmented configs, the project suffers from:

1. **High cognitive load** - contributors must navigate duplicate/overlapping docs
2. **Maintenance overhead** - changes require updates across multiple files
3. **Slow onboarding** - new contributors overwhelmed by volume
4. **Drift risk** - duplicate content diverges over time
5. **CI/CD bloat** - processing unnecessary files slows pipelines

Target: **30%+ reduction** across documentation, scripts, and configs while preserving all essential information and functionality.

## Design Principles

### 1. Single Source of Truth
Every piece of information should exist in exactly one canonical location. Duplication through cross-references, not copy-paste.

### 2. Hierarchy Enforcement
Three-tier documentation structure must be strictly enforced:
- **CLAUDE.md** - Minimal quick reference (<200 lines)
- **docs/[service]/** - Detailed documentation and guides
- **openspec/specs/** - Formal behavioral specifications

### 3. Archive, Don't Delete (Initially)
Content moves to `openspec/changes/archive/` before deletion to preserve git history and enable recovery if needed.

### 4. Automation Over Guidelines
Pre-commit hooks and CI checks enforce standards automatically, not through documentation pleas.

### 5. Progressive Consolidation
Start with obvious duplicates and low-risk merges. Aggressive consolidation comes after validation of initial wins.

## Architecture

### Documentation Consolidation Strategy

```
BEFORE:
CLAUDE.md (321 lines)
homelab/docs/ (11 files, 5974 lines)
  ├── COOLIFY_SETUP.md
  ├── VAULTWARDEN_SETUP.md
  ├── VAULTWARDEN_SUMMARY.md (duplicate)
  ├── TRAEFIK_MIGRATION_GUIDE.md
  ├── TRAEFIK_MIGRATION_SUMMARY.md (duplicate)
  └── ... 6 more files
docs/ (service-specific)
homelab-services/docs/ (monorepo)

AFTER:
CLAUDE.md (<200 lines) - essentials only
docs/ (unified hierarchy)
  ├── INDEX.md
  ├── coolify/README.md (merged from homelab)
  ├── vaultwarden/README.md (merged SETUP + SUMMARY)
  ├── traefik/README.md
  └── [service]/README.md
homelab-services/docs/ (unchanged - monorepo docs stay)
openspec/changes/archive/ (historical migrations)
```

**Consolidation Rules:**
1. Merge `homelab/docs/[TOPIC]*.md` → `docs/[topic]/README.md`
2. Delete duplicates after content merge
3. Archive migration guides >1 month old
4. Cross-reference instead of duplicate between tiers

### Script Consolidation Strategy

```
BEFORE:
homelab/scripts/
  ├── deploy-ci.sh (342 lines)
  ├── deploy-ci-streamlined.sh (221 lines) - duplicate
  ├── setup-bluetooth.sh (224 lines) - archived feature
  ├── setup-steam.sh (169 lines) - archived feature
  ├── common-utils.sh (374 lines)
  └── ... 6 more scripts

AFTER:
homelab/scripts/
  ├── deploy.sh (250 lines) - consolidated
  ├── common-utils.sh (300 lines) - consolidated utilities
  ├── monitor-ci.sh (294 lines)
  └── [active scripts only]
```

**Consolidation Rules:**
1. Standardize on `deploy.sh` (based on streamlined version)
2. Remove scripts for archived features (setup-bluetooth.sh, setup-steam.sh)
3. Consolidate duplicated utility functions into common-utils.sh
4. Inline single-use scripts <30 lines
5. Deprecate old deployment script for 3 months, then delete

### Config Consolidation Strategy

```
BEFORE:
compose/
  ├── infrastructure.yml
  ├── media.yml
  ├── ai.yml
  ├── claude-agent-server.yml (small)
  ├── playwright-server.yml (small)
  ├── storage.yml (small)
  ├── platform.yml
  ├── monitoring.yml
  ├── vpn.yml
  ├── runners.yml
  └── 11 total files

AFTER:
compose/
  ├── infrastructure.yml (merged storage)
  ├── media.yml
  ├── ai.yml
  ├── apps.yml (merged claude + playwright)
  ├── platform.yml
  ├── monitoring.yml
  └── vpn.yml
7 total files (-36% from 11)
```

**Consolidation Rules:**
1. Merge compose files <50 lines into logical parents
2. Keep separate: infrastructure, media, ai, platform, monitoring, vpn, apps
3. Consolidate Traefik dynamic configs from 4 to 3 files
4. Use Docker Compose anchors for repeated environment variables

## Implementation Approach

### Phase 1: Audit (Week 1)
**Goal**: Understand current state without making changes

1. Generate usage report: `rg "homelab/docs/" --files-with-matches`
2. Identify duplicates: `fdupes -r docs/ homelab/docs/`
3. Script last-modified audit: `git log --all --pretty=format: --name-only | sort | uniq -c`
4. Cross-reference mapping: Document all internal links

**Deliverable**: Audit report with consolidation recommendations

### Phase 2: Low-Risk Consolidation (Week 2)
**Goal**: Quick wins without breaking changes

1. Merge obvious duplicates (VAULTWARDEN_SETUP + SUMMARY)
2. Archive completed migration guides
3. Remove setup scripts for archived features
4. Consolidate small compose files

**Deliverable**: 15-20% reduction with zero service disruption

### Phase 3: Aggressive Consolidation (Week 3)
**Goal**: Deep consolidation with validation

1. Condense CLAUDE.md to <200 lines
2. Merge homelab/docs into docs/ hierarchy
3. Consolidate deployment scripts
4. Merge Traefik configs

**Deliverable**: 30%+ reduction target achieved

### Phase 4: Automation (Week 4)
**Goal**: Prevent future bloat

1. Implement pre-commit hooks (file size, duplication detection)
2. Add CI checks (documentation duplication, dead links)
3. Document archival process in CONTRIBUTING.md
4. Update project.md with minimalism standards

**Deliverable**: Automated enforcement of minimalism standards

## Trade-offs & Decisions

### Decision: Archive vs Delete Migration Guides
**Options:**
1. Delete immediately (clean slate)
2. Archive indefinitely (git history preservation)
3. Archive for 6 months, then delete (balanced)

**Choice**: Archive for 6 months, then delete
**Rationale**:
- Git history preserves content even after deletion
- Archive provides easy rollback if migration issues arise
- Time-boxed archival prevents indefinite accumulation
- 6 months sufficient for any rollback scenarios

### Decision: Single Deployment Script
**Options:**
1. Keep both deploy-ci.sh and deploy-ci-streamlined.sh (status quo)
2. Consolidate immediately with hard cutover (risky)
3. Deprecate old script for 3 months, then remove (graceful)

**Choice**: Deprecate for 3 months, then remove
**Rationale**:
- Allows time for CI/automation updates
- Provides fallback if issues discovered
- 3 months sufficient for transition (typical sprint cycle)
- Reduces maintenance burden long-term

### Decision: Compose File Consolidation Threshold
**Options:**
1. Merge all into single docker-compose.yml (extreme consolidation)
2. Merge files <50 lines (moderate)
3. Keep current structure (no change)

**Choice**: Merge files <50 lines
**Rationale**:
- Single file too unwieldy for 20+ services
- <50 lines threshold captures truly small files
- Preserves logical service groupings (media, infrastructure, etc.)
- Reduces file count by ~36% (11 → 7 files)

### Decision: homelab/docs Consolidation
**Options:**
1. Keep separate homelab/docs for homelab-specific content
2. Merge into docs/ hierarchy for unified navigation
3. Move to homelab-services/docs/ (monorepo)

**Choice**: Merge into docs/ hierarchy
**Rationale**:
- Aligns with project.md documentation standards
- Single docs/ entry point reduces confusion
- homelab-services/docs/ is for Better-T-Stack monorepo only
- Eliminates homelab/ vs docs/ ambiguity

## Validation Strategy

### Pre-Deployment Validation
1. **Docker Compose Syntax**: `docker compose config -q`
2. **Cross-Reference Check**: Custom script to validate all markdown links
3. **OpenSpec Validation**: `openspec validate --strict` on all affected specs
4. **CI Pipeline**: All checks must pass before merge

### Post-Deployment Validation
1. **Service Health**: All containers running and healthy
2. **Documentation Accessibility**: Spot-check 10 random cross-references
3. **CI/CD Success**: Next deployment succeeds without issues
4. **User Feedback**: Monitor for 48 hours post-merge

### Rollback Criteria
Rollback if any of:
- Service deployment fails
- >5 broken cross-references discovered
- CI/CD pipeline breaks
- Critical workflow blocked by missing documentation

## Metrics

### Success Metrics
| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| Total doc lines | 13,000 | <9,000 | `find docs -name "*.md" -exec wc -l {} + | tail -1` |
| CLAUDE.md lines | 321 | <200 | `wc -l CLAUDE.md` |
| Script lines | 3,300 | <2,300 | `find homelab/scripts -name "*.sh" -exec wc -l {} + | tail -1` |
| Compose files | 11 | ≤7 | `ls compose/*.yml | wc -l` |
| Duplicate docs | 4+ | 0 | Manual audit |

### Process Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Pre-commit hook failures | >0 | Hook logs on attempted commits |
| CI duplication check failures | >0 | CI logs on pull requests |
| File size warnings | >0 | Pre-commit hook logs |
| Time to find documentation | <30s | User survey (subjective) |

## Risks & Mitigations

### Risk: Broken Cross-References
**Impact**: High - users can't navigate documentation
**Likelihood**: Medium - manual updates prone to errors
**Mitigation**:
- Automated cross-reference checker in CI
- Script to update all references: `rg "homelab/docs/" -l | xargs sed -i 's|homelab/docs/|docs/|g'`
- Manual spot-check of 20 random links post-merge

### Risk: Lost Historical Context
**Impact**: Medium - harder to debug past decisions
**Likelihood**: Low - git history preserved
**Mitigation**:
- Archive to openspec/changes/archive/ before deletion
- Git history remains searchable
- Document archival locations in docs/INDEX.md

### Risk: Service Deployment Failure
**Impact**: High - services down
**Likelihood**: Low - configs validated before merge
**Mitigation**:
- Validate all compose files: `docker compose config -q`
- Test deployment in staging environment
- Rollback plan documented in tasks.md

### Risk: Script Consolidation Breaking CI
**Impact**: High - deployments blocked
**Likelihood**: Medium - CI uses old script names
**Mitigation**:
- 3-month deprecation period for old deployment script
- Update CI workflows before removing old script
- Symlink old name to new script during transition

### Risk: Over-Consolidation
**Impact**: Medium - harder to find specific information
**Likelihood**: Low - following established consolidation rules
**Mitigation**:
- Keep logical service groupings separate
- Add table of contents to large consolidated docs
- Monitor user feedback for navigation issues

## Future Work

Post-consolidation opportunities not in scope for this change:

1. **Automated Documentation Generation**: Generate service README skeletons from compose files
2. **Documentation Search**: Implement full-text search across docs/
3. **Version Pinning**: Document specific versions in environment for reproducibility
4. **Performance Optimization**: Optimize CI to skip unchanged services
5. **Interactive Setup**: Replace homelab.sh wizard with web-based setup UI

## References

- **Project Documentation Standards**: `openspec/project.md#documentation-standards`
- **Deployment Orchestration Spec**: `openspec/specs/deployment-orchestration/spec.md`
- **OpenSpec Integration Spec**: `openspec/specs/openspec-integration/spec.md`
- **Existing Changes**: `openspec list` output shows related active changes
