# Documentation Standards Specification

## ADDED Requirements

### Requirement: Three-Tier Documentation Hierarchy
The project SHALL maintain three distinct documentation levels with clear separation of concerns.

#### Scenario: User needs quick command reference
- **WHEN** user opens CLAUDE.md
- **THEN** essential commands are visible within first 150 lines
- **AND** commands include cross-references to detailed documentation

#### Scenario: User needs detailed service configuration
- **WHEN** user navigates to docs/[service]/README.md
- **THEN** comprehensive setup, configuration, and troubleshooting information is provided
- **AND** links to related OpenSpec specs are included

#### Scenario: User needs formal behavioral specification
- **WHEN** user opens openspec/specs/[capability]/spec.md
- **THEN** requirements with scenarios define expected behavior
- **AND** design decisions are documented in design.md when applicable

### Requirement: Service Documentation Structure
Each service SHALL have documentation organized in docs/[service]/ directory following a consistent template.

#### Scenario: Creating documentation for new service
- **WHEN** developer adds a new service to the homelab
- **THEN** a docs/[service]/README.md file SHALL be created
- **AND** README includes sections: Overview, Setup, Configuration, Troubleshooting, References

#### Scenario: Consolidating scattered documentation
- **WHEN** documentation for a service exists in multiple locations
- **THEN** documentation SHALL be consolidated into docs/[service]/
- **AND** cross-references SHALL link to consolidated location

### Requirement: Documentation Index
The project SHALL maintain a cross-reference index at docs/INDEX.md showing relationships between capabilities, specs, and detailed documentation.

#### Scenario: User searches for service documentation
- **WHEN** user opens docs/INDEX.md
- **THEN** all services are listed with links to detailed docs and specs
- **AND** common tasks have quick links to relevant documentation sections

#### Scenario: Discovering related documentation
- **WHEN** user views INDEX.md entry for a capability
- **THEN** related capabilities are cross-referenced
- **AND** links to OpenSpec specs and detailed docs are provided

### Requirement: Cross-Reference Linking Conventions
Documentation SHALL use consistent link formats for cross-referencing other documentation.

#### Scenario: Linking to service documentation
- **WHEN** documentation references another service
- **THEN** link format SHALL be `docs/[service]/README.md`
- **AND** link SHALL include descriptive text, not just URL

#### Scenario: Linking to OpenSpec specifications
- **WHEN** documentation references formal requirements
- **THEN** link format SHALL be `openspec/specs/[capability]/spec.md`
- **AND** specific requirement sections MAY be linked with anchors

#### Scenario: Linking to code locations
- **WHEN** documentation references implementation
- **THEN** link format SHALL be `file.ts:42` or `path/to/file.ts:42`

### Requirement: Minimal CLAUDE.md Structure
CLAUDE.md SHALL serve as a minimal quick reference limited to approximately 150 lines.

#### Scenario: Claude Code needs project overview
- **WHEN** Claude Code opens CLAUDE.md
- **THEN** OpenSpec instructions remain at top (lines 1-18 unchanged)
- **AND** repository overview is provided in 1-2 paragraphs
- **AND** architecture summary fits in 1 paragraph per component

#### Scenario: User needs common command reference
- **WHEN** user searches for frequently used commands
- **THEN** CLAUDE.md includes essential commands without detailed explanations
- **AND** each command section links to detailed documentation

#### Scenario: Claude Code needs detailed information
- **WHEN** Claude Code requires detailed service information
- **THEN** CLAUDE.md provides cross-references to docs/[service]/README.md
- **AND** OpenSpec specs are linked where applicable

### Requirement: Documentation Content Preservation
All content from the original CLAUDE.md SHALL be preserved during refactoring, with no information loss.

#### Scenario: Migrating CLAUDE.md content to new structure
- **WHEN** content is extracted from CLAUDE.md
- **THEN** content SHALL be placed in appropriate docs/[service]/README.md
- **AND** original CLAUDE.md sections SHALL be archived in openspec/changes/archive/
- **AND** git history SHALL preserve all changes for reference

#### Scenario: Validating content migration
- **WHEN** CLAUDE.md is reduced to minimal format
- **THEN** all removed content SHALL exist in new documentation locations
- **AND** a checklist SHALL verify each section is preserved

### Requirement: OpenSpec Coverage for All Capabilities
All major capabilities SHALL have formal OpenSpec specifications with requirements and scenarios.

#### Scenario: Documenting new capability
- **WHEN** a new capability is added to the project
- **THEN** an OpenSpec spec SHALL be created in openspec/specs/[capability]/
- **AND** spec SHALL include at least one requirement with scenarios
- **AND** spec SHALL validate with `openspec validate --strict`

#### Scenario: Discovering capability requirements
- **WHEN** user needs to understand capability behavior
- **THEN** openspec/specs/[capability]/spec.md defines requirements
- **AND** each requirement has at least one scenario with WHEN/THEN format

### Requirement: Documentation Validation
Documentation SHALL be validated for consistency and correctness before finalization.

#### Scenario: Validating OpenSpec specs
- **WHEN** new or modified specs are created
- **THEN** validation SHALL pass `openspec validate --strict`
- **AND** all requirements SHALL have at least one scenario
- **AND** scenarios SHALL use `#### Scenario:` format (4 hashtags)

#### Scenario: Validating cross-references
- **WHEN** documentation is updated
- **THEN** all internal links SHALL resolve correctly
- **AND** cross-references between docs, specs, and code SHALL be verified

#### Scenario: Validating documentation completeness
- **WHEN** reviewing documentation for a service
- **THEN** required sections SHALL be present (Overview, Setup, Configuration, Troubleshooting, References)
- **AND** links to related documentation SHALL be included
