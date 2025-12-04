# multi-runner-orchestration Specification

## Purpose
TBD - created by archiving change add-automated-deployment-system. Update Purpose after archive.
## Requirements
### Requirement: Docker-Based Runner Deployment
The system SHALL deploy multiple GitHub Actions runners as Docker containers.

#### Scenario: Four runner deployment
- **WHEN** docker compose up is executed
- **THEN** four GitHub runner containers are created
- **AND** each runner is named homelab-runner-1 through homelab-runner-4
- **AND** each runner uses a unique registration token

#### Scenario: Runner registration
- **WHEN** runner container starts
- **THEN** runner registers with GitHub using provided token
- **AND** runner appears in repository settings as online
- **AND** runner has label "self-hosted"

### Requirement: Runner Isolation
Each runner SHALL operate in an isolated environment to prevent conflicts.

#### Scenario: Separate work directories
- **WHEN** multiple workflows execute simultaneously
- **THEN** each runner uses its own work directory volume
- **AND** workflows do not interfere with each other's files

#### Scenario: Docker-in-Docker support
- **WHEN** workflow requires Docker operations
- **THEN** runner has access to Docker socket
- **AND** can build and run containers as part of workflow

### Requirement: Shared Report Volume
Runners SHALL write Playwright reports to a shared volume accessible by the report server.

#### Scenario: Report output
- **WHEN** workflow generates Playwright report
- **THEN** report is written to /reports/{workflow}/{run_id}/
- **AND** report server can access the files
- **AND** directory structure is preserved

### Requirement: Runner Token Configuration
Runner tokens SHALL be configured via environment variables from a config file.

#### Scenario: Token loading
- **WHEN** compose file is processed
- **THEN** RUNNER_TOKEN_1 through RUNNER_TOKEN_4 are loaded from .env
- **AND** each runner receives its corresponding token
- **AND** tokens are not exposed in logs

#### Scenario: Missing tokens
- **WHEN** any runner token is not set
- **THEN** that runner container fails to start
- **AND** error message indicates which token is missing

### Requirement: Resource Limits
Runners SHALL have resource limits to prevent system exhaustion.

#### Scenario: CPU and memory limits
- **WHEN** runner containers are deployed
- **THEN** each runner has CPU limit defined
- **AND** each runner has memory limit defined
- **AND** limits prevent single workflow from consuming all resources

### Requirement: Health Monitoring
Runner health SHALL be monitored and reported.

#### Scenario: Health checks
- **WHEN** runner is deployed
- **THEN** health check endpoint is available
- **AND** health check verifies runner is registered
- **AND** unhealthy runners trigger restart

#### Scenario: Runner restart on failure
- **WHEN** runner container fails
- **THEN** Docker automatically restarts the container
- **AND** runner re-registers with GitHub
- **AND** workflows can resume on the runner

### Requirement: Parallel Workflow Execution
The system SHALL support concurrent workflow execution across all runners.

#### Scenario: Four parallel workflows
- **WHEN** four workflows are queued
- **THEN** all four execute simultaneously on different runners
- **AND** each completes without interference

#### Scenario: Queue management
- **WHEN** more than four workflows are queued
- **THEN** first four execute immediately
- **AND** remaining workflows wait for available runner
- **AND** workflows execute in queue order



## Related Documentation

- **Main Documentation**: `/CLAUDE.md` - GitHub Actions Multi-Runner section
- **Runner Configuration**: `homelab/compose/runners.yml` - Docker-based runner definitions
- **GitHub Actions Guide**: `docs/github-actions/README.md` - Workflow and runner documentation
- **Workflow Examples**: `.github/workflows/` - Deploy and monitor workflows using runners
- **Setup Instructions**: `/CLAUDE.md` - Runner token generation and deployment steps
- **Troubleshooting**: `/CLAUDE.md` - Runner logs, status checks, and re-registration
