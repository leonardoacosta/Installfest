# Change Proposal: Minimize Project Footprint

## Why

The Installfest project has grown organically, resulting in documentation, scripts, and configuration sprawl that impacts maintainability and cognitive load. Current state:

**Documentation Bloat (~13K lines):**
- CLAUDE.md exceeds target (321 lines vs ~150 line target in project.md)
- homelab/docs contains 11 files (5974 lines) with duplicates and migration guides
- Multiple duplicate/overlapping docs (VAULTWARDEN_SETUP + VAULTWARDEN_SUMMARY, TRAEFIK_MIGRATION_GUIDE + TRAEFIK_MIGRATION_SUMMARY)
- Historical troubleshooting docs no longer relevant

**Script Duplication (~3.3K lines):**
- Two deployment scripts maintained (deploy-ci.sh: 342 lines, deploy-ci-streamlined.sh: 221 lines)
- Setup scripts for archived features still present
- Utility functions potentially duplicated across scripts

**Config File Fragmentation:**
- 11 separate compose/*.yml files (some <50 lines)
- Multiple small Traefik dynamic configs that could consolidate
- Environment variable duplication across services

**Impact:**
- New contributors face high barrier to understanding system
- Maintenance overhead from updating multiple overlapping docs
- Slower CI/CD from processing unnecessary files
- Higher cognitive load when making changes
- Risk of outdated information in rarely-updated docs

**Target:** 30%+ reduction across all areas while preserving essential information and functionality.

## What Changes

This change introduces aggressive minimization standards and tooling to achieve:

1. **Documentation Consolidation** (~4K line reduction):
   - Merge duplicate/overlapping docs
   - Archive historical migration guides
   - Condense CLAUDE.md to <200 lines
   - Consolidate homelab/docs into docs/ hierarchy

2. **Script Simplification** (~800 line reduction):
   - Standardize on single deployment script
   - Remove setup scripts for archived features
   - Consolidate utility functions
   - Inline small single-use scripts

3. **Config Optimization** (~200 line reduction):
   - Merge small compose files into logical groupings
   - Consolidate Traefik dynamic configs
   - Deduplicate environment variables
   - Remove unused service definitions

4. **Process Improvements**:
   - Add pre-commit hooks to enforce minimalism
   - Create "archival checklist" for retiring features
   - Add file size linting to CI
   - Document when to split vs consolidate

## Success Criteria

**Documentation:**
- [ ] CLAUDE.md < 200 lines
- [ ] homelab/docs merged into docs/ hierarchy
- [ ] Zero duplicate docs (same topic covered >1 place)
- [ ] All migration guides archived or removed
- [ ] Total doc line count < 9K (30% reduction from 13K)

**Scripts:**
- [ ] Single canonical deployment script
- [ ] Zero archived feature setup scripts
- [ ] Shared utilities in single common-utils.sh
- [ ] Total script line count < 2.3K (30% reduction from 3.3K)

**Config Files:**
- [ ] ≤7 compose files (down from 11)
- [ ] Traefik dynamic configs consolidated to 3 files
- [ ] Zero duplicate environment variable definitions
- [ ] All configs validated with docker compose config

**Process:**
- [ ] Pre-commit hooks enforce file size limits
- [ ] CI fails on documentation duplication
- [ ] Archival checklist documented in CONTRIBUTING.md
- [ ] Minimalism standards added to project.md

## Dependencies

**Must Complete Before Starting:**
- Audit all homelab/docs for active references
- Identify which scripts are actively used vs archived
- Validate all compose files are actually deployed

**May Block:**
- Future service additions (must follow new consolidation standards)
- Documentation restructuring efforts

## Open Questions

1. Should we retire deploy-ci.sh entirely or keep for backwards compatibility?
2. Do any Traefik migration docs need to remain for rollback scenarios?
3. Should archived feature docs move to openspec/changes/archive/ or delete entirely?
4. What file size limits should pre-commit hooks enforce?

## Related Changes

- `6-add-work-dashboard` - Work queue management (avoid doc duplication)
- `integrate-product-management` - Project tracking (document minimization standards)

## Specifications Affected

This change will create/modify these specs:

- **NEW**: `documentation-minimalism` - Standards for lean documentation
- **MODIFIED**: `deployment-orchestration` - Single deployment script
- **MODIFIED**: `openspec-integration` - Archival process improvements
