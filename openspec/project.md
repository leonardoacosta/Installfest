# Project Context

## Purpose

Personal dotfiles and homelab infrastructure automation for self-hosted services. Two main objectives:

1. **Homelab Infrastructure**: Complete Docker-based self-hosted service stack on Arch Linux with automated deployment, monitoring, and rollback capabilities
2. **Mac Development Environment**: Automated macOS setup with dotfiles, Homebrew packages, and system configuration

**Primary Focus**: The homelab stack is the main component, featuring 20+ self-hosted services including media automation, home automation, AI services, VPN, reverse proxy, and PaaS platform.

## Tech Stack

### Homelab (Primary)
- **Infrastructure**: Docker Compose, Arch Linux, Bash scripting
- **CI/CD**: GitHub Actions with self-hosted runner
- **Networking**: Traefik (reverse proxy), Tailscale (VPN), Gluetun (VPN tunnel)
- **Core Services**:
  - Home Assistant (home automation)
  - AdGuard Home (DNS/ad-blocking)
  - Jellyfin (media server)
  - *arr stack (Radarr, Sonarr, Lidarr, Prowlarr - media automation)
  - Ollama (local AI)
  - Coolify (self-hosted PaaS)
  - Vaultwarden (password manager)
  - Glance (dashboard)

### Mac Setup
- **Shell**: Zsh with custom configuration
- **Package Management**: Homebrew
- **Terminal**: WezTerm
- **Prompt**: Starship
- **Scripting**: Bash

### Development Tools
- GitHub Actions (self-hosted runner)
- Docker & Docker Compose
- rsync (deployment)
- systemd (service management)

## Project Conventions

### Code Style

**Bash Scripts**:
- Use `#!/usr/bin/env bash` shebang
- Enable strict mode: `set -euo pipefail` (except where error handling requires flexibility)
- Descriptive function names in `snake_case`
- Global variables in `UPPER_CASE`
- Local variables in `lower_case`
- Comprehensive error handling with clear messages
- Color-coded output (success=green, warning=yellow, error=red, info=blue)
- Logging functions: `log_success`, `log_error`, `log_warning`, `log_info`

**Docker Compose**:
- Split compose files by service category (infrastructure, media, ai, monitoring, etc.)
- Use named networks with explicit subnets
- Static IP assignments for critical services
- Volume mounts prefer named volumes over bind mounts (except config)
- Environment variables always sourced from `.env`, never hardcoded
- Health checks for all critical services
- Restart policy: `unless-stopped` for production services

**File Organization**:
- Configuration files in service-specific directories
- Shared utilities in `scripts/common-utils.sh`
- Deployment scripts prefixed with `deploy-`
- Setup scripts prefixed with `setup-`

### Architecture Patterns

**Network Isolation**:
- Two isolated Docker networks: `homelab` (172.20.0.0/16) and `media` (172.21.0.0/16)
- Cross-network services explicitly connect both networks
- VPN-protected services use `network_mode: service:gluetun`
- All traffic for download clients routes through Gluetun VPN tunnel

**State Management**:
- Setup wizard tracks progress in `.setup_state` file
- State transitions: `fresh` → `prerequisites_installed` → `runner_configured` → `directories_created` → `environment_configured` → `services_configured` → `deployed`
- Resumable setup after interruptions or permission changes

**Deployment Pattern**:
1. Validation (environment, permissions, docker-compose syntax)
2. Pre-deployment backup
3. Graceful service shutdown
4. Image updates
5. Service deployment with health checks
6. Automatic rollback on failure
7. Backup retention (keep last 5)

**Permission Handling**:
- Attempt operations without sudo first
- Graceful fallback to sudo for directory operations
- Continue deployment on non-critical permission errors
- Exit code 23 (rsync permission errors) treated as warning
- Uses `rsync --ignore-errors` for resilient file copying

**Service Discovery**:
- Traefik routes defined in `traefik/dynamic/*.yml`
- Services accessed via domain names (not IP:port)
- Internal DNS resolution via Docker network names

### Testing Strategy

**Pre-Deployment Validation**:
```bash
# Validate compose configuration
docker compose config -q

# Validate without .env (ensure no hardcoded values)
docker compose -f docker-compose.yml config --dry-run
```

**Health Checks**:
- Critical services: traefik, adguardhome, homeassistant
- HTTP endpoint checks with retries
- Service-specific health commands (e.g., `ollama list` for AI service)
- Monitoring workflow runs every 30 minutes

**Local Testing**:
```bash
# Simulate CI deployment locally
export GITHUB_WORKSPACE=$(pwd)/..
export HOMELAB_PATH=~/homelab
bash scripts/deploy-ci-streamlined.sh
```

**Rollback Testing**:
- Automated rollback on deployment failure
- Backup restoration validated before deletion

### Git Workflow

**Branching Strategy**:
- `main` - production-ready state
- `dev` - development branch (triggers homelab deployment)
- Feature branches merged to `dev` for testing

**Deployment Triggers**:
- Push to `dev` affecting `homelab/**` → triggers deployment workflow
- Manual dispatch available for both deploy and monitor workflows

**Commit Conventions**:
- Descriptive commit messages focusing on "why" not "what"
- Co-authored commits include: `Co-Authored-By: Claude <noreply@anthropic.com>`
- Generated commits tagged with: `🤖 Generated with Claude Code`

**CI/CD Workflows**:
- `deploy-homelab.yml` - Full deployment with rollback support
- `monitor-homelab.yml` - Service health monitoring (scheduled)
- Both run on self-hosted runner (Arch Linux server)

## Domain Context

### Docker Networking
Two isolated networks prevent service interference and improve security:
- **homelab network**: Core infrastructure (DNS, reverse proxy, home automation, AI)
- **media network**: Media services (download clients, media servers, requests)
- Cross-network services bridge both for necessary communication

### VPN Architecture
**Gluetun VPN Tunnel**:
- All download clients route through Gluetun using `network_mode: service:gluetun`
- Services include: qBittorrent, Prowlarr, NZBGet, Byparr
- Accessed via Gluetun's published ports (not individual container ports)
- Provides privacy and security for torrent/usenet traffic

### Service Dependencies
Critical startup order managed via Docker Compose `depends_on`:
1. Traefik (reverse proxy) - must start before services with routes
2. AdGuard Home (DNS) - required for domain resolution
3. Gluetun (VPN) - required before download clients
4. Databases - required before dependent applications

### Home Automation
**Home Assistant**: Central hub for smart home devices
- Integrations: HACS (community store), MTR-1 (presence detection)
- Configuration as code in `homeassistant/config/`
- Zones visualization with Plotly Graph Card

### Media Automation
***arr Stack** (request → download → organize → serve):
1. Jellyseerr - User requests media
2. Radarr/Sonarr/Lidarr - Search indexers via Prowlarr
3. Download clients (qBittorrent/NZBGet) - Download content
4. Automatic organization and renaming
5. Jellyfin - Stream organized content

### PaaS Platform
**Coolify**: Self-hosted Platform-as-a-Service
- Deploy apps from Git repos or Docker images
- Automatic builds, deployments, and SSL
- Integrates with homelab network for service communication
- Replaces need for manual Docker Compose for new apps

## Important Constraints

### Security Requirements
- **Never commit `.env` files** - contain sensitive credentials
- **Use `.env.example`** as template for required variables
- **Firewall configuration**: Allow only ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 51820 (Tailscale)
- **HTTPS enforcement**: Configure Traefik TLS before internet exposure
- **VPN protection**: All download traffic must route through Gluetun
- **Tailscale access**: Prefer Tailscale for secure remote access over port forwarding
- **Default exposure**: 27+ ports exposed by default - production hardening required

### Permission Management
- Containers run as non-root with `PUID`/`PGID` from environment
- Deployment scripts handle permission escalation gracefully
- GitHub Actions runner requires docker group membership
- Service directories must be owned by deployment user
- Backup directories require write permissions

### Resource Constraints
- **Arch Linux server**: Single physical machine hosting all services
- **Network subnets**: Fixed CIDR blocks (172.20.0.0/16, 172.21.0.0/16)
- **Port conflicts**: Avoid conflicts with host services (e.g., port 53 with systemd-resolved)
- **Storage**: Media services require substantial disk space
- **Memory**: AI services (Ollama) memory-intensive

### Deployment Constraints
- **Self-hosted runner**: Deployments must run on Arch Linux server (can't use GitHub-hosted)
- **Idempotent deployments**: Scripts must be safe to run repeatedly
- **Zero-downtime impossible**: Some services require restart during updates
- **Backup retention**: Keep only last 5 backups to conserve space
- **Environment dependencies**: All variables must be set before deployment

### Operational Constraints
- **Setup wizard required**: First-time setup must complete wizard before service usage
- **State persistence**: `.setup_state` must not be deleted during normal operations
- **Docker group requirement**: User must be in docker group for non-root access
- **Systemd integration**: GitHub runner installed as systemd service

## External Dependencies

### Docker Hub Images
Core service images (pulled from Docker Hub):
- `traefik:latest` - Reverse proxy
- `adguard/adguardhome:latest` - DNS/ad-blocking
- `homeassistant/home-assistant:stable` - Home automation
- `jellyfin/jellyfin:latest` - Media server
- `linuxserver/*` images - *arr stack and media services
- `ollama/ollama:latest` - Local AI
- `coollabsio/coolify:latest` - PaaS platform
- `qmcgaw/gluetun:latest` - VPN tunnel
- `tailscale/tailscale:latest` - VPN mesh network

### External Services
- **GitHub**: Repository hosting, Actions CI/CD
- **VPN Provider**: Commercial VPN for Gluetun (user-configured)
- **Tailscale**: Mesh VPN for secure remote access
- **Indexers**: Torrent/Usenet indexers for media automation (user-configured)
- **SMTP Server**: Email delivery for Vaultwarden (user-configured)

### APIs and Integrations
- **Prowlarr API**: Indexer management and search aggregation
- ***arr APIs**: Inter-service communication for media automation
- **Jellyfin API**: Media playback and metadata
- **Home Assistant API**: Smart home control and automation
- **Ollama API**: Local AI model inference
- **Traefik API**: Dynamic routing and service discovery

### System Dependencies (Arch Linux)
- Docker & Docker Compose
- systemd (service management)
- rsync (file synchronization)
- OpenSSL (credential generation)
- curl/wget (health checks)
- git (GitHub Actions runner)

### macOS Dependencies
- Xcode Command Line Tools
- Homebrew (package management)
- Zsh (shell)
- System preferences access (for `osx-defaults.sh`)

### Documentation Resources
- Traefik v3 documentation (reverse proxy configuration)
- Docker Compose v2 specification
- Home Assistant integration docs
- *arr wiki (media automation setup)
- Coolify documentation (PaaS deployment)
