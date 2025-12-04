# steam-gaming-setup Specification Delta

## ADDED Requirements

### Requirement: Documentation References
The steam-gaming-setup capability SHALL reference comprehensive documentation for headless Steam setup and Remote Play.

#### Scenario: Accessing Steam headless documentation
- **WHEN** user needs Steam headless setup documentation
- **THEN** CLAUDE.md SHALL reference docs/steam/README.md
- **AND** detailed documentation includes: overview, systemd service, firewall rules, first-time login, Remote Play setup, service management

#### Scenario: Finding Steam setup in CLAUDE.md
- **WHEN** Claude Code searches for Steam headless configuration
- **THEN** quick reference SHALL include link to detailed docs
- **AND** includes essential systemd commands

#### Scenario: Cross-referencing specification from documentation
- **WHEN** user reads docs/steam/README.md
- **THEN** documentation SHALL reference openspec/specs/steam-gaming-setup/spec.md
- **AND** formal requirements define Steam headless behavior
