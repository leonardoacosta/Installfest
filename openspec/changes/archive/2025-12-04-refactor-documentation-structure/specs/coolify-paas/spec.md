# Coolify PaaS Specification

## ADDED Requirements

### Requirement: Coolify Multi-Container Architecture
Coolify SHALL run as four interconnected containers providing PaaS functionality.

#### Scenario: Deploying Coolify services
- **WHEN** Coolify is deployed via docker compose
- **THEN** four containers SHALL start: coolify (172.20.0.100:8000), coolify-db (172.20.0.101), coolify-redis (172.20.0.102), coolify-soketi (172.20.0.103)
- **AND** all containers connect to homelab network

### Requirement: Secure Credential Generation
Coolify credentials SHALL be generated using cryptographically secure random values before deployment.

#### Scenario: Generating Coolify environment variables
- **WHEN** running scripts/generate-coolify-env.sh
- **THEN** secure random values SHALL be generated for: COOLIFY_APP_ID, COOLIFY_APP_KEY, COOLIFY_DB_PASSWORD, COOLIFY_REDIS_PASSWORD, COOLIFY_PUSHER_APP_ID, COOLIFY_PUSHER_APP_KEY, COOLIFY_PUSHER_APP_SECRET
- **AND** values are written to .env file

### Requirement: Application Deployment Workflow
Users SHALL deploy applications from Git repositories or Docker images through Coolify web interface.

#### Scenario: Deploying app from Git repository
- **WHEN** user creates project in Coolify UI
- **AND** connects Git repository
- **THEN** Coolify SHALL clone repository, build, and deploy application
- **AND** automatic SSL certificates are provisioned

#### Scenario: Deploying from Docker image
- **WHEN** user specifies Docker image in Coolify
- **THEN** Coolify SHALL pull image and deploy container
- **AND** environment variables are configurable

### Requirement: Coolify Access and Management
Coolify web interface SHALL be accessible at configured server IP on port 8000.

#### Scenario: Accessing Coolify UI
- **WHEN** user navigates to http://<server-ip>:8000
- **THEN** Coolify web interface SHALL load
- **AND** user can authenticate and manage applications
