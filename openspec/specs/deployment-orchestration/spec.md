# deployment-orchestration Specification

## Purpose

Provide reliable homelab service deployment with validation, health checks, backup/rollback capabilities, and state management for unattended and CI/CD deployments.

## Requirements

### Requirement: Deployment Validation

The system SHALL validate configuration and environment before deployment.

#### Scenario: Pre-deployment checks
- **WHEN** deploy-ci.sh or deploy-ci-streamlined.sh runs
- **THEN** docker-compose.yml syntax is validated
- **AND** required environment variables are checked
- **AND** network connectivity is verified
- **AND** disk space is sufficient (> 5GB free)
- **AND** deployment proceeds only if all checks pass

#### Scenario: Docker Compose validation
- **WHEN** docker compose config is executed
- **THEN** YAML syntax errors are caught
- **AND** undefined variables are reported
- **AND** service dependencies are verified
- **AND** network configurations are validated
- **AND** error messages guide fixes

### Requirement: Backup Before Deployment

The system SHALL create backups before deploying changes.

#### Scenario: Configuration backup
- **WHEN** deployment begins
- **THEN** current docker-compose.yml is backed up
- **AND** .env file is backed up
- **AND** service configuration directories are backed up
- **AND** backup includes timestamp in filename
- **AND** backup location is logged

#### Scenario: Database backup
- **WHEN** services with databases are deployed
- **THEN** database volumes are backed up
- **AND** backup is verified before proceeding
- **AND** old backups are retained (last 7 days)
- **AND** backup failures halt deployment

### Requirement: Service Deployment

The system SHALL deploy services using Docker Compose.

#### Scenario: Pull latest images
- **WHEN** deployment executes
- **THEN** docker compose pull fetches latest images
- **AND** image pull progress is shown
- **AND** pull failures are retried (3 attempts)
- **AND** deployment halts if pull fails

#### Scenario: Stop existing services
- **WHEN** services are running
- **THEN** docker compose stop gracefully stops containers
- **AND** 30-second timeout for graceful shutdown
- **AND** containers are forcefully stopped if timeout exceeded
- **AND** stop failures are logged

#### Scenario: Start services
- **WHEN** docker compose up -d is executed
- **THEN** services start in dependency order
- **AND** container creation is logged
- **AND** startup errors are captured
- **AND** service IDs are recorded

### Requirement: Health Check Verification

The system SHALL verify critical services are healthy after deployment.

#### Scenario: HTTP health checks
- **WHEN** deployment completes
- **THEN** Traefik health endpoint is checked (http://localhost:80)
- **AND** AdGuard Home is checked (http://localhost:53 DNS query)
- **AND** Home Assistant is checked (http://localhost:8123/manifest.json)
- **AND** each check retries up to 5 times with 10-second delay
- **AND** deployment fails if critical services unhealthy

#### Scenario: Container status checks
- **WHEN** health checks run
- **THEN** docker compose ps shows all services "running"
- **AND** no services are in "restarting" state
- **AND** restart counts are acceptable (< 3)
- **AND** container ages are recent (< 5 minutes)

### Requirement: Rollback on Failure

The system SHALL rollback to previous state if deployment fails.

#### Scenario: Automatic rollback
- **WHEN** health checks fail
- **THEN** rollback procedure is initiated
- **AND** services are stopped
- **AND** backup configuration is restored
- **AND** services are restarted with old config
- **AND** health checks verify rollback success

#### Scenario: Manual rollback
- **WHEN** user triggers manual rollback
- **THEN** most recent backup is identified
- **AND** user confirms rollback operation
- **AND** restore process executes
- **AND** service restart is performed
- **AND** rollback completion is logged

### Requirement: Permission Handling

The system SHALL handle file permission issues gracefully.

#### Scenario: Directory creation
- **WHEN** deployment needs new directories
- **THEN** attempts creation without sudo first
- **AND** falls back to sudo if permission denied
- **AND** sets correct ownership (user:docker group)
- **AND** continues deployment if directory exists

#### Scenario: File sync with rsync
- **WHEN** files are copied to deployment directory
- **THEN** rsync uses --ignore-errors flag
- **AND** permission errors logged but don't halt deployment
- **AND** exit code 23 (permission errors) treated as warning
- **AND** critical files verified after sync

### Requirement: Deployment Modes

The system SHALL support both full and streamlined deployment modes.

#### Scenario: Full deployment (deploy-ci.sh)
- **WHEN** full deployment is triggered
- **THEN** comprehensive validation runs
- **AND** full backups are created
- **AND** all services are redeployed
- **AND** extensive health checks performed
- **AND** cleanup of old backups/images

#### Scenario: Streamlined deployment (deploy-ci-streamlined.sh)
- **WHEN** streamlined deployment is triggered
- **THEN** quick validation runs
- **AND** minimal backups created
- **AND** only changed services redeployed
- **AND** fast health checks performed
- **AND** faster execution (< 5 minutes)

### Requirement: Monitoring Integration

The system SHALL integrate with monitoring for deployment tracking.

#### Scenario: Deployment notifications
- **WHEN** deployment starts
- **THEN** notification sent to monitoring system
- **AND** deployment status is tracked
- **AND** completion is notified (success/failure)
- **AND** metrics are recorded (duration, services deployed)

#### Scenario: Health monitoring
- **WHEN** deployment completes
- **THEN** monitor-ci.sh can verify status
- **AND** service health is continuously checked
- **AND** alerts trigger if services fail
- **AND** dashboard shows deployment history

### Requirement: State Management

The system SHALL track deployment state for resumable operations.

#### Scenario: State file tracking
- **WHEN** deployment progresses
- **THEN** .setup_state file is updated
- **AND** current phase is recorded
- **AND** completed steps are marked
- **AND** state persists across interruptions

#### Scenario: Resume after failure
- **WHEN** deployment is restarted after failure
- **THEN** state file is read
- **AND** completed steps are skipped
- **AND** deployment continues from last successful step
- **AND** state is reset on successful completion

### Requirement: Common Utilities

The system SHALL provide shared utility functions for deployment scripts.

#### Scenario: Logging functions
- **WHEN** deployment scripts execute
- **THEN** common-utils.sh provides log_info, log_error, log_success
- **AND** logs include timestamps
- **AND** log levels are color-coded
- **AND** logs are written to both console and file

#### Scenario: Health check functions
- **WHEN** health checks are needed
- **THEN** wait_for_service function handles retries
- **AND** check_service_health validates endpoints
- **AND** consistent retry logic across scripts
- **AND** clear error messages on failure

## Related Documentation

- **Deployment Guide**: `/docs/deployment/README.md` - Complete deployment documentation
- **Main Documentation**: `/CLAUDE.md` - Deployment Orchestration section (lines 200-212)
- **CI Script (Full)**: `homelab/scripts/deploy-ci.sh` - Full deployment with backups
- **CI Script (Streamlined)**: `homelab/scripts/deploy-ci-streamlined.sh` - Fast deployment
- **Monitoring Script**: `homelab/scripts/monitor-ci.sh` - Service health monitoring
- **Common Utilities**: `homelab/scripts/common-utils.sh` - Shared functions
