# Specification Delta: OpenSpec Integration

## ADDED Requirements

### Requirement: Archival Process Standards

OpenSpec SHALL provide clear archival workflows to prevent documentation accumulation and maintain project minimalism.

#### Scenario: Feature archival checklist
**WHEN** a capability is retired
**THEN** OpenSpec MUST enforce archival checklist completion:
- [ ] Mark spec as `status: archived` in spec.md frontmatter
- [ ] Remove associated code and scripts
- [ ] Archive or delete service documentation
- [ ] Update cross-references throughout project
- [ ] Move spec to `openspec/specs/[capability]/archived-spec.md` OR delete entirely
- [ ] Update docs/INDEX.md to remove capability entry
- [ ] Add archive notice to CHANGELOG

#### Scenario: Archival decision criteria
**WHEN** deciding whether to archive or delete a capability spec
**THEN** the following criteria MUST guide the decision:
- **Archive** if: Historical context valuable, rollback possible, referenced by other specs
- **Delete** if: Fully replaced by another spec, no historical value, >2 years deprecated

#### Scenario: Archive location structure
**WHEN** a spec is archived (not deleted)
**THEN** it MUST be moved to `openspec/changes/archive/[change-id]/[capability]/spec.md`
**AND** include frontmatter: `archived_date: YYYY-MM-DD`, `archived_reason: "description"`

### Requirement: Minimalism Enforcement

OpenSpec validation SHALL enforce minimalism standards to prevent project bloat.

#### Scenario: File size validation
**WHEN** `openspec validate --strict` runs
**THEN** it MUST check:
- CLAUDE.md < 200 lines
- project.md < 500 lines
- No duplicate scenarios across specs (>80% similarity)
- All cross-references resolve

#### Scenario: Duplicate scenario detection
**WHEN** two specs contain scenarios with >80% identical WHEN/THEN clauses
**THEN** validation MUST fail with suggestion to consolidate or cross-reference

#### Scenario: Orphaned content detection
**WHEN** a file in openspec/ hasn't been modified in 12+ months
**AND** is not referenced by any active spec or change
**THEN** validation MUST warn for manual review

### Requirement: Documentation Cross-Reference Standards

OpenSpec SHALL enforce consistent cross-referencing between specs, detailed docs, and quick reference.

#### Scenario: Spec to detailed docs linking
**WHEN** a spec in `openspec/specs/[capability]/spec.md` is created or updated
**THEN** corresponding `docs/[service]/README.md` MUST exist and be linked in docs/INDEX.md

#### Scenario: Quick reference cross-reference only
**WHEN** CLAUDE.md references a service
**THEN** it MUST use format: `See docs/[service]/README.md for details` (cross-ref only, no duplication)

#### Scenario: Circular reference prevention
**WHEN** docs/ references specs/ and specs/ references docs/
**THEN** validation MUST ensure no circular dependency chains exist

## MODIFIED Requirements

### Requirement: Archival Command Enhancement

The `openspec archive` command SHALL validate archival checklist completion before archiving a change.

#### Scenario: Archival checklist validation
**WHEN** `openspec archive [change-id]` is executed
**THEN** it MUST verify:
- All tasks in tasks.md marked completed
- No unresolved TODOs in spec deltas
- All new specs referenced in docs/INDEX.md
- No broken cross-references in affected files
- Git has no uncommitted changes in affected areas

## REMOVED Requirements

None - this adds archival process constraints without removing existing OpenSpec integration features.
