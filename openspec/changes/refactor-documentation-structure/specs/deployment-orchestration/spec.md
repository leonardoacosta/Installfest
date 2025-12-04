# Deployment Orchestration Specification

## ADDED Requirements

### Requirement: Multi-Phase Deployment Pipeline
Homelab deployment SHALL follow a structured 10-phase pipeline with validation and rollback capabilities.

#### Scenario: Executing full deployment
- **WHEN** deployment script is executed
- **THEN** phases SHALL execute in order: 1) Validate environment and permissions, 2) Create service directories, 3) Copy files from GitHub workspace, 4) Create backup, 5) Validate docker-compose, 6) Stop containers, 7) Pull latest images, 8) Deploy with docker compose up, 9) Health check critical services, 10) Rollback on failure or cleanup backups on success

### Requirement: Pre-Deployment Validation
Deployment SHALL validate environment and Docker Compose configuration before making changes.

#### Scenario: Validating Docker Compose syntax
- **WHEN** deployment validation runs
- **THEN** `docker compose config -q` SHALL pass without errors
- **AND** deployment proceeds only if validation succeeds

#### Scenario: Validating environment variables
- **WHEN** deployment validation runs
- **THEN** required environment variables SHALL be checked for presence
- **AND** deployment fails early if critical variables are missing

### Requirement: Automated Backup and Rollback
Deployment SHALL create backups before changes and automatically rollback on failure.

#### Scenario: Creating pre-deployment backup
- **WHEN** deployment reaches backup phase
- **THEN** current state SHALL be backed up with timestamp
- **AND** backup includes configuration files and docker-compose.yml

#### Scenario: Rolling back failed deployment
- **WHEN** deployment health checks fail
- **THEN** previous backup SHALL be restored automatically
- **AND** services return to pre-deployment state

#### Scenario: Cleaning up old backups
- **WHEN** deployment succeeds
- **THEN** old backups SHALL be removed, keeping last 5
- **AND** disk space is conserved

### Requirement: Health Check Validation
Deployment SHALL verify critical services are healthy after deployment.

#### Scenario: Checking critical service health
- **WHEN** services are deployed
- **THEN** health checks SHALL run for: traefik, adguardhome, homeassistant
- **AND** HTTP endpoints are tested with retries
- **AND** deployment succeeds only if all critical services are healthy

### Requirement: Permission-Aware Deployment
Deployment SHALL handle permission issues gracefully with sudo fallback.

#### Scenario: Creating directories with permission fallback
- **WHEN** deployment creates service directories
- **THEN** creation SHALL be attempted without sudo first
- **AND** falls back to sudo if permission denied
- **AND** deployment continues even if some directories have permission errors

#### Scenario: Resilient file copying
- **WHEN** deployment copies files with rsync
- **THEN** `--ignore-errors` flag SHALL be used
- **AND** exit code 23 (permission errors) treated as warning, not failure

### Requirement: Deployment Script Variants
Deployment SHALL support both full and streamlined deployment modes.

#### Scenario: Running full deployment
- **WHEN** scripts/deploy-ci.sh is executed
- **THEN** comprehensive deployment with all validations runs
- **AND** includes detailed logging and notifications

#### Scenario: Running streamlined deployment
- **WHEN** scripts/deploy-ci-streamlined.sh is executed
- **THEN** faster deployment with essential validations runs
- **AND** suitable for frequent updates with lower risk
