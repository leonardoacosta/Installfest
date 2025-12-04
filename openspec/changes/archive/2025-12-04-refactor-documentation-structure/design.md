# Design: Documentation Structure Refactoring

## Context

The current documentation is centralized in a 1443-line CLAUDE.md file that serves multiple purposes:
- Claude Code instructions and guidance
- Architecture documentation for 12+ capabilities
- Detailed setup and configuration guides
- Troubleshooting and operational procedures
- Command reference and examples

This monolithic structure creates maintenance and scalability challenges as the project grows. Additionally, only 7 of 12+ capabilities have formal OpenSpec specifications, creating inconsistency in documentation quality and discoverability.

**Stakeholders**:
- Claude Code AI assistant (primary consumer of CLAUDE.md)
- Project maintainers (need maintainable documentation)
- New users (need clear onboarding paths)
- Contributors (need consistent documentation patterns)

**Constraints**:
- Must maintain backward compatibility during migration
- Cannot break existing Claude Code workflows
- Must preserve all existing documentation content
- Git history must remain intact for reference

## Goals / Non-Goals

### Goals
1. **Reduce cognitive load**: Users find information quickly without scrolling massive files
2. **Improve maintainability**: Changes to a service don't require editing multiple files
3. **Establish consistency**: All capabilities have formal specs and detailed documentation
4. **Enable scalability**: Documentation structure supports adding new services easily
5. **Preserve content**: All existing documentation content remains accessible
6. **Clear hierarchy**: Documentation flows logically from overview → detailed → implementation

### Non-Goals
- **Not rewriting content**: Focus is on structure, not content improvement (that's future work)
- **Not changing tooling**: No new documentation build systems or generators
- **Not changing file formats**: Markdown remains the standard format
- **Not removing CLAUDE.md**: It becomes minimal but remains the entry point

## Decisions

### Decision 1: Three-Tier Documentation Hierarchy

**What**: Establish three documentation levels:
1. **CLAUDE.md** - Minimal quick reference (~150 lines)
   - OpenSpec instructions
   - Essential commands only
   - Cross-references to detailed docs
2. **docs/[service]/README.md** - Detailed service documentation
   - Setup instructions
   - Configuration details
   - Troubleshooting guides
   - Links to OpenSpec specs
3. **openspec/specs/[capability]/spec.md** - Formal specifications
   - Requirements and scenarios
   - Behavioral specifications
   - Design decisions (in design.md)

**Why**: Separation of concerns - quick reference vs. detailed docs vs. formal specs. Users start at appropriate level for their needs.

**Alternatives considered**:
- **Single comprehensive doc** (current state) - Rejected: doesn't scale, hard to maintain
- **Wiki/static site** - Rejected: adds tooling complexity, harder to maintain in repo
- **Inline code documentation** - Rejected: separates docs from code, doesn't work for architecture

### Decision 2: Service-Based Documentation Organization

**What**: Group documentation by service/capability in `docs/[service]/` directories:
```
docs/
├── INDEX.md                    # Cross-reference map
├── dns/
│   └── README.md              # DNS configuration (AdGuard + Cloudflare)
├── home-assistant/
│   └── README.md              # Home Assistant integrations
├── coolify/
│   └── README.md              # Coolify PaaS (consolidates existing docs)
├── deployment/
│   └── README.md              # Deployment orchestration
├── github-actions/
│   └── README.md              # CI/CD workflows
└── ...existing homelab/docs/
```

**Why**:
- Service-centric: Users looking for "Home Assistant" info know exactly where to look
- Isolation: Changes to one service don't affect others
- Scalability: Adding new services follows consistent pattern
- Consolidation: Brings together scattered docs (e.g., Coolify has 2 separate files)

**Alternatives considered**:
- **Keep everything in homelab/docs/** - Rejected: too flat, no clear organization
- **Create docs/ at root level** - **Selected**: Clear separation from code, consistent with conventions
- **Nested by type (setup/, config/, troubleshooting/)** - Rejected: splits related info across directories

### Decision 3: Documentation Index for Navigation

**What**: Create `docs/INDEX.md` as a cross-reference map showing:
- Capability → OpenSpec spec → Detailed docs relationships
- Quick links for common tasks
- Documentation navigation guide

**Why**:
- Single source of truth for "where do I find X?"
- Helps users discover related documentation
- Makes documentation structure explicit and navigable

**Alternatives considered**:
- **README.md navigation** - Rejected: conflates overview with navigation
- **No index, rely on directory structure** - Rejected: requires users to explore, not discover
- **Generated index from specs** - Rejected: adds tooling complexity

### Decision 4: Create Specs for All Capabilities

**What**: Formalize OpenSpec specs for currently undocumented capabilities:
- DNS Configuration
- Home Assistant Integration
- Coolify PaaS
- Mac Development Environment
- Deployment Orchestration
- GitHub Actions Workflows

**Why**:
- Consistency: All capabilities have formal behavioral specifications
- Requirements clarity: Explicit scenarios and acceptance criteria
- Change tracking: Future changes follow OpenSpec delta workflow
- Testing foundation: Specs provide basis for validation

**Alternatives considered**:
- **Leave as detailed docs only** - Rejected: creates two classes of capabilities (spec'd vs. not)
- **Spec only infrastructure, not tools** - Rejected: arbitrary distinction, Mac setup deserves same rigor
- **Wait until needed** - Rejected: better to establish consistency now while refactoring

### Decision 5: Phased Migration to Minimize Breaking Changes

**What**: Six-phase rollout:
1. Create new documentation structure (non-breaking)
2. Create OpenSpec specs (non-breaking)
3. Update existing specs with doc references (non-breaking)
4. Refactor CLAUDE.md with both old and new references (transition)
5. Slim down CLAUDE.md to minimal format (breaking change)
6. Archive old documentation (cleanup)

**Why**:
- Risk mitigation: Each phase is independently reversible
- User adaptation: Users can transition gradually
- Validation points: Can validate each phase before proceeding
- Clear rollback: Any phase can be rolled back without affecting previous phases

**Alternatives considered**:
- **Big bang migration** - Rejected: too risky, hard to validate
- **Feature flag documentation** - Rejected: overly complex for static docs
- **Parallel documentation** - Rejected: maintenance burden of two doc sets

### Decision 6: Documentation Standards in project.md

**What**: Add documentation standards section to `openspec/project.md`:
- Service documentation template structure
- Cross-reference linking conventions (use `docs/[service]/README.md`, `specs/[capability]/spec.md`)
- File naming conventions (README.md for main docs, specific names for specialized docs)
- Required sections (Overview, Setup, Configuration, Troubleshooting, References)

**Why**:
- Consistency: Future documentation follows established patterns
- Maintainability: Clear guidelines prevent documentation drift
- Onboarding: Contributors know how to add documentation
- Quality: Standards ensure minimum documentation quality

**Alternatives considered**:
- **Separate CONTRIBUTING.md** - Rejected: project.md already contains conventions
- **No formal standards** - Rejected: leads to inconsistent documentation over time
- **Automated linting** - Future enhancement, not blocking for this change

## Risks / Trade-offs

### Risk 1: Breaking Existing Claude Code Workflows
**Impact**: High - Claude relies on CLAUDE.md structure
**Mitigation**:
- Phase 4 keeps transition period with both old and new references
- Test Claude Code behavior with new structure before finalizing
- Keep OpenSpec instructions at top of CLAUDE.md (lines 1-18 unchanged)
- Maintain clear cross-references so Claude can find information

### Risk 2: Content Loss During Migration
**Impact**: High - Losing documented knowledge is unacceptable
**Mitigation**:
- Use git to track all changes, can diff against original
- Archive original CLAUDE.md sections in openspec/changes/archive/
- Validate all content moved to new locations before deletion
- Create checklist to verify each CLAUDE.md section is preserved

### Risk 3: Documentation Drift Over Time
**Impact**: Medium - New services might not follow standards
**Mitigation**:
- Document standards clearly in project.md
- Include documentation in OpenSpec change proposals
- Template documentation structure for new services
- Future: Consider automated validation of documentation structure

### Risk 4: Increased Navigation Complexity
**Impact**: Low - Users might need more clicks to find information
**Mitigation**:
- Create clear INDEX.md with quick links
- CLAUDE.md includes most common commands for quick reference
- Each service doc includes back-references to related docs
- Future: Consider search functionality if needed

### Risk 5: OpenSpec Spec Validation Failures
**Impact**: Medium - New specs might not validate correctly
**Mitigation**:
- Validate each spec with `--strict` flag during creation
- Follow existing spec patterns from the 7 existing specs
- Use scenarios format exactly: `#### Scenario: Name`
- Get feedback on spec structure before finalizing

## Migration Plan

### Phase 1: Preparation (Non-Breaking)
1. Create new documentation structure in `docs/` directories
2. Extract content from CLAUDE.md into new service docs
3. Create documentation INDEX.md
4. Validate all links and cross-references work

**Rollback**: Delete new `docs/` directories, CLAUDE.md unchanged

### Phase 2: Spec Creation (Non-Breaking)
1. Create 6 new OpenSpec specs for undocumented capabilities
2. Validate all specs with `openspec validate --strict`
3. Ensure all requirements have scenarios

**Rollback**: Delete new spec directories, no impact on existing functionality

### Phase 3: Spec Enhancement (Non-Breaking)
1. Add "Documentation References" section to 7 existing specs
2. Link specs to detailed docs in `docs/` and existing homelab docs

**Rollback**: Remove added documentation sections from specs

### Phase 4: CLAUDE.md Transition (Gradual Breaking Change)
1. Add cross-references to new docs at top of each section
2. Users can choose to use old format or new docs
3. Monitor for issues or confusion

**Rollback**: Remove cross-references, keep full content

### Phase 5: CLAUDE.md Minimization (Breaking Change)
1. Reduce CLAUDE.md to ~150 lines with essential commands only
2. Keep comprehensive cross-references to detailed docs
3. Archive removed content to openspec/changes/archive/

**Rollback**: Restore original CLAUDE.md from git history or archive

### Phase 6: Cleanup
1. Remove any duplicate or outdated documentation
2. Update all internal references
3. Add deprecation notices where appropriate

**Rollback**: Restore files from git history

### Validation Criteria Per Phase
- **Phase 1**: All CLAUDE.md content exists in new docs (verified via checklist)
- **Phase 2**: All specs validate with `--strict` flag
- **Phase 3**: All spec links resolve correctly
- **Phase 4**: Claude Code can find information via new structure
- **Phase 5**: CLAUDE.md < 200 lines, all essential commands present
- **Phase 6**: No broken links, no duplicate content

## Open Questions

1. **Should we add a docs/ directory at repository root or use homelab/docs/?**
   - Leaning toward root-level `docs/` for consistency and discoverability
   - Answered: Root-level `docs/` is clearer

2. **How much detail should remain in CLAUDE.md "essential commands"?**
   - Proposal: Just the command syntax, no detailed explanations
   - Link to detailed docs for context and troubleshooting
   - Answered: Minimal with links to detailed docs

3. **Should Mac setup documentation also get an OpenSpec spec?**
   - Proposal: Yes, for consistency - all major capabilities get specs
   - Answered: Yes, create specs for all capabilities

4. **Should we consolidate existing homelab/docs/ files into new structure?**
   - Some files like COOLIFY_SETUP.md should move to docs/coolify/
   - Others like SECURITY_AUDIT.md might stay in homelab/docs/
   - Decision: Case-by-case, prioritize active documentation

5. **Do we need a documentation version or changelog?**
   - Git history provides versioning
   - Could add "Last Updated" to documentation files
   - Decision: Not required for initial implementation, can add later if needed
