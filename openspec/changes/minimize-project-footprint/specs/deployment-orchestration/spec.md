# Specification Delta: Deployment Orchestration

## MODIFIED Requirements

### Requirement: Deployment Script Standardization

The project SHALL maintain a single canonical deployment script to reduce maintenance overhead and prevent drift.

#### Scenario: Single deployment entrypoint
**WHEN** a deployment is triggered (CI or manual)
**THEN** it MUST execute `scripts/deploy.sh` (consolidated from deploy-ci-streamlined.sh)

#### Scenario: Legacy script removal
**WHEN** deploy-ci.sh is invoked
**THEN** it MUST print deprecation warning and redirect to deploy.sh
**AND** after 3 months deprecation period, MUST be deleted

#### Scenario: Feature parity validation
**WHEN** deploying with consolidated deploy.sh
**THEN** it MUST provide all functionality from both previous deployment scripts:
- Environment validation
- Docker Compose syntax check
- Pre-deployment backup
- Graceful service shutdown
- Image updates
- Health checks
- Automatic rollback on failure
- Backup retention (keep last 5)

### Requirement: Deployment Script Modularity

Deployment logic SHALL be modular with clear phase separation to enable testing and reuse.

#### Scenario: Phase extraction
**WHEN** deployment script exceeds 300 lines
**THEN** individual phases MUST be extracted to functions in common-utils.sh

#### Scenario: Shared utility usage
**WHEN** deployment script needs logging, error handling, or validation
**THEN** it MUST source common-utils.sh and use shared functions

#### Scenario: Inline scripts elimination
**WHEN** a deployment sub-task is <30 lines and used once
**THEN** it MUST be inlined into main deployment script, NOT a separate file

## ADDED Requirements

### Requirement: Deployment Script Size Limits

Deployment scripts SHALL be concise and leverage shared utilities to prevent bloat.

#### Scenario: Main deployment script size
**WHEN** deploy.sh is modified
**THEN** it MUST remain under 300 lines (excluding comments)

#### Scenario: Utility function reuse
**WHEN** a function is needed by 2+ scripts
**THEN** it MUST be in common-utils.sh, NOT duplicated

## REMOVED Requirements

None - existing deployment orchestration requirements remain, with additions for consolidation.
