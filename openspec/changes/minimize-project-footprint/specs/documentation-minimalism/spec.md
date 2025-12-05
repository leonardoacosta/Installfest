# Specification: Documentation Minimalism

## ADDED Requirements

### Requirement: File Size Limits

Documentation files SHALL adhere to maximum line counts to prevent bloat and improve maintainability.

#### Scenario: Quick reference file size enforcement
**WHEN** CLAUDE.md is modified
**THEN** the file MUST remain under 200 lines

#### Scenario: Service documentation size check
**WHEN** a docs/[service]/README.md file exceeds 600 lines
**THEN** CI MUST fail with a suggestion to split into subtopics

#### Scenario: Script size limits
**WHEN** a shell script exceeds 400 lines
**THEN** pre-commit hook MUST warn to consider refactoring or splitting

### Requirement: Duplicate Content Prevention

The project SHALL have zero duplicate documentation covering the same topic in multiple locations.

#### Scenario: Duplicate detection during commit
**WHEN** a commit introduces documentation with >20% similarity to existing docs
**THEN** pre-commit hook MUST fail with file paths showing duplication

#### Scenario: Cross-reference enforcement
**WHEN** similar topics exist in multiple docs
**THEN** one MUST be canonical with others linking via cross-reference

#### Scenario: Migration guide retirement
**WHEN** a migration is complete for >6 months
**THEN** the migration guide MUST be archived or deleted

### Requirement: Archival Process

The project SHALL have a documented process for archiving outdated features and documentation.

#### Scenario: Feature archival checklist
**WHEN** a feature is retired
**THEN** contributor MUST follow archival checklist:
- Remove feature code
- Archive or delete feature documentation
- Remove setup scripts
- Remove configuration files
- Update cross-references
- Add archive notice to CHANGELOG
- Move spec to archived state in OpenSpec

#### Scenario: Archived content location
**WHEN** documentation is archived but not deleted
**THEN** it MUST be moved to `openspec/changes/archive/[capability]/`

#### Scenario: Dead link prevention
**WHEN** documentation is archived or deleted
**THEN** all cross-references MUST be updated or removed before merge

### Requirement: Documentation Hierarchy Enforcement

Documentation SHALL follow the three-tier hierarchy (CLAUDE.md → docs/ → specs/) without duplication between tiers.

#### Scenario: Quick reference limits
**WHEN** CLAUDE.md is updated
**THEN** it MUST only contain:
- OpenSpec instructions
- Essential commands (<5 per service)
- Cross-references to detailed docs
- Architecture summary (<50 lines)

#### Scenario: Detailed documentation location
**WHEN** a service requires >100 lines of documentation
**THEN** it MUST be in `docs/[service]/README.md`, NOT in CLAUDE.md

#### Scenario: Formal specification location
**WHEN** behavioral requirements are documented
**THEN** they MUST be in `openspec/specs/[capability]/spec.md`, NOT in README files

### Requirement: Consolidation Standards

Related documentation SHALL be consolidated into single canonical files with clear ownership.

#### Scenario: Single service documentation file
**WHEN** a service has multiple documentation files
**THEN** they MUST be consolidated into `docs/[service]/README.md` with subtopic sections

#### Scenario: Documentation directory structure
**WHEN** homelab-specific docs exist
**THEN** they MUST be organized under `docs/` hierarchy, NOT scattered in `homelab/docs/`

#### Scenario: Cross-cutting concerns
**WHEN** a topic affects multiple services (e.g., networking, security)
**THEN** it MUST have a dedicated `docs/[topic]/README.md` referenced by service docs

## MODIFIED Requirements

None - this is a new specification introducing documentation minimalism standards.

## REMOVED Requirements

None - this adds new constraints without removing existing ones.
