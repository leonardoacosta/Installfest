# coolify-paas Specification

## Purpose

Provide a self-hosted PaaS platform via Coolify for deploying applications and services with automated builds, environment management, and monitoring capabilities.

## Requirements

### Requirement: Coolify Service Deployment

The system SHALL deploy Coolify with required dependencies (database, Redis, WebSocket server).

#### Scenario: Service stack deployment
- **WHEN** docker compose up is executed
- **THEN** coolify service runs on 172.20.0.100:8000
- **AND** coolify-db (PostgreSQL 16) runs on 172.20.0.101
- **AND** coolify-redis runs on 172.20.0.102
- **AND** coolify-soketi (WebSocket) runs on 172.20.0.103
- **AND** all services start automatically on boot

#### Scenario: Environment variable configuration
- **WHEN** services are deployed
- **THEN** COOLIFY_APP_ID is set from env
- **AND** COOLIFY_APP_KEY is base64 encoded secret
- **AND** COOLIFY_DB_PASSWORD secures database
- **AND** COOLIFY_REDIS_PASSWORD secures Redis
- **AND** COOLIFY_PUSHER_* credentials are configured
- **AND** all secrets are loaded from .env file

### Requirement: Initial Setup and Authentication

The system SHALL provide web UI for initial setup and authentication.

#### Scenario: First-time access
- **WHEN** user navigates to http://<server-ip>:8000
- **THEN** Coolify web UI loads
- **AND** initial setup wizard appears
- **AND** admin account creation is prompted
- **AND** email and password are required

#### Scenario: User authentication
- **WHEN** admin credentials are entered
- **THEN** user is authenticated
- **AND** dashboard is accessible
- **AND** session is persisted
- **AND** logout functionality works

### Requirement: Application Deployment

The system SHALL support deploying applications from Git repositories or Docker images.

#### Scenario: Create new project
- **WHEN** user creates project in UI
- **THEN** project is created with unique ID
- **AND** project settings are configurable
- **AND** multiple resources can be added
- **AND** project persists in database

#### Scenario: Deploy from Git repository
- **WHEN** user adds Git resource
- **THEN** repository URL is validated
- **AND** branch selection is available
- **AND** build configuration is customizable
- **AND** Coolify clones repository and builds
- **AND** application is deployed to container

#### Scenario: Deploy from Docker image
- **WHEN** user specifies Docker image
- **THEN** image is pulled from registry
- **AND** environment variables are configurable
- **AND** port mappings are defined
- **AND** container is started
- **AND** health checks monitor status

### Requirement: Environment Variable Management

The system SHALL provide secure environment variable management per application.

#### Scenario: Add environment variable
- **WHEN** user adds environment variable in UI
- **THEN** variable is stored encrypted in database
- **AND** variable is injected into application container
- **AND** sensitive values are masked in UI
- **AND** variables persist across deployments

#### Scenario: Update environment variable
- **WHEN** user updates existing variable
- **THEN** application is redeployed with new value
- **AND** previous value is not exposed
- **AND** change is logged in audit trail

### Requirement: Homelab Network Integration

The system SHALL integrate with existing homelab Docker network for service access.

#### Scenario: Network connectivity
- **WHEN** application is deployed via Coolify
- **THEN** application container connects to homelab network
- **AND** can access other homelab services (AdGuard, Home Assistant)
- **AND** services can access deployed application
- **AND** DNS resolution works via AdGuard

#### Scenario: Port allocation
- **WHEN** application requires port mapping
- **THEN** Coolify allocates available port
- **AND** port conflict detection works
- **AND** port is documented in deployment info
- **AND** port can be changed via re-deployment

### Requirement: Build and Deployment Logs

The system SHALL provide real-time logs for build and deployment processes.

#### Scenario: View build logs
- **WHEN** application is building
- **THEN** build logs stream in real-time via WebSocket
- **AND** build steps are clearly shown
- **AND** errors are highlighted
- **AND** log history is retained

#### Scenario: View deployment logs
- **WHEN** application is running
- **THEN** application stdout/stderr is streamed
- **AND** log search and filter options available
- **AND** logs can be downloaded
- **AND** log retention is configurable

### Requirement: Automatic Restarts and Health Checks

The system SHALL monitor deployed applications and restart on failure.

#### Scenario: Health check configuration
- **WHEN** user configures health check
- **THEN** HTTP endpoint can be specified
- **AND** check interval is customizable
- **AND** failure threshold is configurable
- **AND** health status is displayed in UI

#### Scenario: Automatic restart on failure
- **WHEN** application health check fails
- **THEN** Coolify restarts container automatically
- **AND** restart event is logged
- **AND** notification is sent (if configured)
- **AND** restart count is tracked

### Requirement: Database Service Provisioning

The system SHALL allow provisioning database services for applications.

#### Scenario: Create database
- **WHEN** user adds database resource
- **THEN** database type can be selected (PostgreSQL, MySQL, Redis, MongoDB)
- **AND** database version is selectable
- **AND** credentials are auto-generated
- **AND** database container is deployed
- **AND** connection string is provided

#### Scenario: Database backup
- **WHEN** database backup is requested
- **THEN** backup is created via database-specific tool
- **AND** backup is stored in volume
- **AND** restore functionality is available
- **AND** automated backups can be scheduled

### Requirement: Secret Generation

The system SHALL generate secure secrets for Coolify setup.

#### Scenario: Generate Coolify secrets
- **WHEN** generate-coolify-env.sh is executed
- **THEN** COOLIFY_APP_ID is generated with openssl rand -hex 16
- **AND** COOLIFY_APP_KEY is generated with base64:$(openssl rand -base64 32)
- **AND** COOLIFY_DB_PASSWORD is generated with openssl rand -base64 32
- **AND** COOLIFY_REDIS_PASSWORD is generated similarly
- **AND** COOLIFY_PUSHER_* credentials are generated
- **AND** all values are written to .env file

### Requirement: Documentation and Quick Start

The system SHALL provide documentation for setup and usage.

#### Scenario: Quick start guide availability
- **WHEN** user needs to set up Coolify
- **THEN** homelab/COOLIFY_QUICKSTART.md contains setup steps
- **AND** docs/coolify/README.md has detailed guide
- **AND** generate-coolify-env.sh script is documented
- **AND** deployment examples are provided

#### Scenario: Documentation references
- **WHEN** user needs help with Coolify
- **THEN** CLAUDE.md links to Coolify section
- **AND** troubleshooting steps are available
- **AND** common issues are documented
- **AND** integration examples are provided

## Related Documentation

- **Quick Start**: `/homelab/COOLIFY_QUICKSTART.md` - Fast setup guide
- **Detailed Guide**: `/docs/coolify/README.md` - Complete setup and usage documentation
- **Main Documentation**: `/CLAUDE.md` - Coolify PaaS section
- **Docker Compose**: `homelab/compose/platform.yml` - Coolify services definition
- **Environment Generation**: `homelab/scripts/generate-coolify-env.sh` - Secret generation script
