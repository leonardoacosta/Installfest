# github-actions-workflows Specification

## Purpose

Automate homelab service deployment and monitoring through GitHub Actions CI/CD workflows with self-hosted runners, health checks, and failure notifications.

## Requirements

### Requirement: Deploy Workflow Configuration

The system SHALL provide automated deployment workflow triggered by code changes.

#### Scenario: Workflow trigger conditions
- **WHEN** code is pushed to dev branch
- **THEN** deploy-homelab.yml workflow triggers
- **AND** workflow only triggers if homelab/** files changed
- **AND** manual workflow_dispatch is also supported
- **AND** concurrent deployments are prevented

#### Scenario: Self-hosted runner execution
- **WHEN** deployment workflow runs
- **THEN** executes on self-hosted Linux X64 homelab runner
- **AND** runs directly on homelab server
- **AND** has access to Docker daemon
- **AND** can execute deployment scripts

### Requirement: Deployment Workflow Steps

The system SHALL execute deployment steps in correct order with validation.

#### Scenario: Checkout and setup
- **WHEN** workflow starts
- **THEN** repository is checked out to runner
- **AND** GITHUB_WORKSPACE is set to repo path
- **AND** working directory permissions are correct
- **AND** Git LFS files are pulled (if present)

#### Scenario: Environment validation
- **WHEN** deployment executes
- **THEN** required environment variables are exported
- **AND** HOMELAB_PATH points to deployment directory
- **AND** GITHUB_WORKSPACE contains checked out code
- **AND** validation script confirms environment

#### Scenario: Deployment execution
- **WHEN** deployment script runs
- **THEN** deploy-ci-streamlined.sh is executed
- **AND** script output is logged in workflow
- **AND** exit code determines workflow success
- **AND** deployment artifacts are available

### Requirement: Health Check and Verification

The system SHALL verify deployment success via health checks.

#### Scenario: Service health verification
- **WHEN** deployment completes
- **THEN** health check script runs
- **AND** critical services checked (traefik, adguardhome, homeassistant)
- **AND** HTTP endpoints validated
- **AND** workflow fails if health checks fail
- **AND** failure triggers rollback

#### Scenario: Health check retry logic
- **WHEN** health check initially fails
- **THEN** retries up to 5 times
- **AND** waits 10 seconds between retries
- **AND** succeeds if any retry passes
- **AND** fails workflow after max retries

### Requirement: Monitor Workflow Configuration

The system SHALL provide scheduled monitoring of homelab services.

#### Scenario: Scheduled execution
- **WHEN** monitor-homelab.yml schedule triggers
- **THEN** workflow runs every 30 minutes
- **AND** also supports manual workflow_dispatch
- **AND** runs on self-hosted homelab runner
- **AND** monitors service health continuously

#### Scenario: Service monitoring checks
- **WHEN** monitoring workflow runs
- **THEN** monitor-ci.sh script executes
- **AND** checks critical services are running
- **AND** validates service health endpoints
- **AND** records service status
- **AND** notifies if services are down

### Requirement: Runner Configuration

The system SHALL configure self-hosted GitHub Actions runners on homelab server.

#### Scenario: Multiple runner deployment
- **WHEN** runners are configured
- **THEN** 4 Docker-based runners are deployed
- **AND** runners named github-runner-1 through github-runner-4
- **AND** each runner has unique token (RUNNER_TOKEN_1-4)
- **AND** each runner has unique labels (runner-1, runner-2, etc.)
- **AND** runners restart automatically on failure

#### Scenario: Runner registration
- **WHEN** runner container starts
- **THEN** runner registers with GitHub using token
- **AND** runner shows as online in repository settings
- **AND** runner accepts jobs with matching labels
- **AND** runner reports status to GitHub

### Requirement: Workflow Notifications

The system SHALL notify on deployment success or failure.

#### Scenario: Deployment success notification
- **WHEN** deployment completes successfully
- **THEN** success status is reported to GitHub
- **AND** commit status is updated
- **AND** notification sent (if configured via integrations)
- **AND** deployment metrics are recorded

#### Scenario: Deployment failure notification
- **WHEN** deployment fails
- **THEN** failure status reported to GitHub
- **AND** workflow error logged with details
- **AND** failure notification sent
- **AND** rollback is triggered
- **AND** incident is logged for review

### Requirement: Workflow Environment Variables

The system SHALL provide necessary environment variables to workflows.

#### Scenario: Environment configuration
- **WHEN** workflow executes
- **THEN** GITHUB_WORKSPACE contains repo path
- **AND** GITHUB_ACTOR contains triggering user
- **AND** GITHUB_SHA contains commit hash
- **AND** GITHUB_REF contains branch/tag reference
- **AND** custom vars like HOMELAB_PATH are set

#### Scenario: Secret management
- **WHEN** sensitive values are needed
- **THEN** GitHub Secrets are used (not env vars)
- **AND** secrets never appear in logs
- **AND** secrets accessible via ${{ secrets.NAME }}
- **AND** runner tokens stored as secrets

### Requirement: Parallel Execution Support

The system SHALL support parallel job execution across multiple runners.

#### Scenario: Matrix strategy for parallel jobs
- **WHEN** workflow uses matrix strategy
- **THEN** jobs distributed across available runners
- **AND** runner-1, runner-2, runner-3, runner-4 used
- **AND** each job runs independently
- **AND** results are aggregated

#### Scenario: Job targeting specific runner
- **WHEN** job requires specific runner
- **THEN** runs-on can specify [self-hosted, Linux, X64, homelab, runner-1]
- **AND** job waits for specified runner
- **AND** job only runs on matching runner

### Requirement: Workflow Permissions

The system SHALL configure minimal required permissions for workflows.

#### Scenario: Deployment workflow permissions
- **WHEN** deploy-homelab.yml runs
- **THEN** contents: read permission granted
- **AND** no write permissions unless needed
- **AND** actions: read for workflow artifacts
- **AND** Docker access inherited from runner

#### Scenario: Monitor workflow permissions
- **WHEN** monitor-homelab.yml runs
- **THEN** contents: read permission granted
- **AND** no deployment permissions needed
- **AND** monitoring data written to runner only

### Requirement: Workflow Timeout and Cancellation

The system SHALL enforce timeouts and handle cancellation.

#### Scenario: Deployment timeout
- **WHEN** deployment takes too long
- **THEN** workflow times out after 30 minutes
- **AND** deployment process is killed
- **AND** failure notification sent
- **AND** manual cleanup may be needed

#### Scenario: Workflow cancellation
- **WHEN** newer commit pushed during deployment
- **THEN** previous deployment can be cancelled
- **AND** cancellation is handled gracefully
- **AND** rollback may be needed
- **AND** state is logged for debugging

### Requirement: Documentation and Maintenance

The system SHALL provide documentation for workflow usage and troubleshooting.

#### Scenario: Workflow documentation
- **WHEN** user needs CI/CD help
- **THEN** docs/github-actions/README.md contains workflow docs
- **AND** CLAUDE.md references GitHub Actions section
- **AND** troubleshooting guide available
- **AND** runner setup documented

#### Scenario: Workflow updates
- **WHEN** workflows need modification
- **THEN** changes are version controlled in .github/workflows/
- **AND** workflow syntax is validated by GitHub
- **AND** test runs can be done on dev branch
- **AND** production workflows are stable

## Related Documentation

- **Workflow Guide**: `/docs/github-actions/README.md` - Complete CI/CD documentation
- **Main Documentation**: `/CLAUDE.md` - GitHub Actions Workflows section (lines 126-140)
- **Deploy Workflow**: `.github/workflows/deploy-homelab.yml` - Automated deployment
- **Monitor Workflow**: `.github/workflows/monitor-homelab.yml` - Health monitoring
- **Runner Config**: `homelab/compose/runners.yml` - Self-hosted runner definitions
- **Deployment Scripts**: `homelab/scripts/` - Scripts executed by workflows
