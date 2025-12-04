# GitHub Actions Workflows Specification

## ADDED Requirements

### Requirement: Homelab Deployment Workflow
GitHub Actions SHALL automatically deploy homelab when changes are pushed to dev branch affecting homelab/.

#### Scenario: Triggering deployment on push
- **WHEN** changes affecting homelab/** are pushed to dev branch
- **THEN** deploy-homelab.yml workflow SHALL trigger
- **AND** runs on self-hosted runner (Arch Linux server)
- **AND** executes scripts/deploy-ci-streamlined.sh

#### Scenario: Manual deployment trigger
- **WHEN** user manually dispatches deploy-homelab workflow
- **THEN** deployment SHALL run regardless of recent pushes
- **AND** allows deployment without code changes

#### Scenario: Deployment rollback support
- **WHEN** deployment fails
- **THEN** automatic rollback SHALL restore previous state
- **AND** deployment notification indicates failure

### Requirement: Homelab Monitoring Workflow
GitHub Actions SHALL periodically monitor homelab service health.

#### Scenario: Scheduled monitoring execution
- **WHEN** 30 minutes elapse since last monitor run
- **THEN** monitor-homelab.yml workflow SHALL trigger
- **AND** runs on self-hosted runner
- **AND** executes scripts/monitor-ci.sh

#### Scenario: Monitoring critical services
- **WHEN** monitor workflow runs
- **THEN** health checks SHALL verify: traefik, adguardhome, homeassistant
- **AND** failures are reported in workflow logs

#### Scenario: Manual monitoring trigger
- **WHEN** user manually dispatches monitor-homelab workflow
- **THEN** immediate health check runs
- **AND** useful for troubleshooting suspected issues

### Requirement: Self-Hosted Runner Requirement
GitHub Actions workflows SHALL run on self-hosted runner, not GitHub-hosted runners.

#### Scenario: Workflow runner configuration
- **WHEN** workflow is triggered
- **THEN** runs-on SHALL specify: [self-hosted, Linux, X64, homelab]
- **AND** ensures deployment happens on Arch Linux server with direct access to services

### Requirement: Workflow Notifications
Workflows SHALL provide deployment status notifications.

#### Scenario: Successful deployment notification
- **WHEN** deployment completes successfully
- **THEN** notification SHALL indicate success
- **AND** includes deployment timestamp and commit hash

#### Scenario: Failed deployment notification
- **WHEN** deployment fails
- **THEN** notification SHALL indicate failure with error details
- **AND** includes rollback status

### Requirement: Workflow Environment Access
Workflows SHALL have access to required environment variables and secrets from GitHub repository settings.

#### Scenario: Accessing deployment secrets
- **WHEN** workflow executes deployment script
- **THEN** required environment variables SHALL be available
- **AND** includes HOMELAB_PATH, GitHub workspace path
- **AND** secrets are loaded from repository settings
