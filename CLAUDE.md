<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Personal dotfiles and homelab infrastructure automation for macOS and Arch Linux environments. Two main components:

1. **Mac Setup** (`/mac`) - macOS dotfiles, Homebrew packages, and system configuration
2. **Homelab Stack** (`/homelab`) - Docker-based self-hosted services for Arch Linux server

## Architecture

### Homelab (Primary Component)

**Deployment Model**: CI/CD via self-hosted GitHub Actions runner on Arch Linux server

**Network Architecture**: Two isolated Docker networks

- `homelab` (172.20.0.0/16) - Core infrastructure (Home Assistant, DNS, AI, security)
- `media` (172.21.0.0/16) - Media services with VPN-protected downloads via Gluetun

**Cross-Network Services**: Traefik, Glance, Jellyfin, Jellyseerr connect both networks

**Management Script**: `homelab/homelab.sh` - Complete setup wizard and management interface

- First run: Mandatory setup wizard configuring all services, GitHub runner, SSH, Bluetooth
- Subsequent runs: Interactive menu or CLI commands

**Deployment Scripts**:

- `scripts/deploy-ci.sh` - Full deployment with backups and rollback
- `scripts/deploy-ci-streamlined.sh` - Streamlined version for faster deployments
- `scripts/monitor-ci.sh` - Service health monitoring
- `scripts/common-utils.sh` - Shared functions (logging, health checks, backups)

**State Management**: `.setup_state` file tracks wizard progress for resumable setup

### Mac Setup

**Entry Point**: `mac/install.sh` - Interactive installer

- Installs Xcode CLI tools, Homebrew, system packages
- Applies macOS defaults (`scripts/osx-defaults.sh`)
- Creates symlinks for dotfiles

**Dotfile Structure**:

- `zsh/` - Zsh configuration and plugins
- `wezterm/` - Terminal emulator config
- `starship/` - Shell prompt configuration
- `raycast-scripts/` - Raycast automation scripts

## Common Commands

### Homelab Management

```bash
# First-time setup (mandatory wizard)
cd homelab && ./homelab.sh

# Service management
./homelab.sh start [service]    # Start all or specific service
./homelab.sh stop                # Stop all services
./homelab.sh restart [service]   # Restart services
./homelab.sh status              # Show container status
./homelab.sh logs [service]      # View logs
./homelab.sh urls                # Show service access URLs

# Maintenance
./homelab.sh update              # Pull latest Docker images
./homelab.sh backup              # Create configuration backup
./homelab.sh cleanup             # Clean Docker system
./homelab.sh deploy              # Trigger GitHub Actions deployment
./homelab.sh setup               # Re-run setup wizard (⚠️ resets state)

# Direct deployment (used by CI)
cd homelab/scripts
bash deploy-ci.sh                # Full deployment
bash deploy-ci-streamlined.sh    # Streamlined deployment
bash monitor-ci.sh               # Monitor services
```

### Mac Setup

```bash
cd mac
./install.sh                     # Run interactive installer

# Component scripts (called by install.sh)
scripts/prerequisites.sh         # Install Xcode/Homebrew
scripts/brew-install.sh          # Install Homebrew packages
scripts/osx-defaults.sh          # Apply system defaults
scripts/symlinks.sh --create     # Create dotfile symlinks
scripts/symlinks.sh --delete     # Remove existing symlinks
```

## GitHub Actions Workflows

### Deploy to Homelab (`deploy-homelab.yml`)

- **Trigger**: Push to `dev` branch affecting `homelab/**` or manual dispatch
- **Runner**: self-hosted (Arch Linux server)
- **Script**: `deploy-ci-streamlined.sh`
- **Features**: Rollback support, deployment notifications

### Monitor Homelab (`monitor-homelab.yml`)

- **Trigger**: Schedule (every 30min) or manual dispatch
- **Runner**: self-hosted
- **Script**: `monitor-ci.sh`
- **Monitors**: Critical services (traefik, adguardhome, homeassistant)

## Key Configuration Files

### Homelab

- `docker-compose.yml` - Main orchestrator with network definitions and includes
- `compose/platform.yml` - Coolify PaaS services
- `compose/infrastructure.yml` - Core services (Traefik, AdGuard, Home Assistant)
- `compose/media.yml` - Media automation (\*arr stack, Jellyfin)
- `compose/ai.yml` - AI services (Ollama)
- `compose/monitoring.yml` - Glance dashboard
- `compose/vpn.yml` - Tailscale and Gluetun
- `compose/storage.yml` - Samba file sharing
- `.env` - Environment variables (auto-generated by wizard)
- `.env.example` - Template for manual configuration
- `traefik/traefik.yml` - Static Traefik configuration
- `traefik/dynamic/*.yml` - Dynamic routes, middlewares, TLS
- `glance/glance.yml` - Dashboard configuration
- `homeassistant/config/mtr1-zones.yaml` - MTR-1 presence detection template

### Mac

- `homebrew/Brewfile` - Homebrew packages
- `zsh/.zshrc` - Zsh configuration
- `wezterm/wezterm.lua` - Terminal config
- `starship/starship.toml` - Prompt config

## Critical Implementation Details

### Homelab Permission Handling

The deploy script handles permission issues gracefully:

- Attempts operations without sudo first
- Falls back to sudo for directory creation/ownership
- Continues deployment even if some directories have permission errors
- Uses rsync with `--ignore-errors` for resilient file copying
- Exit code 23 (permission errors) treated as warning, not failure

### Service Dependencies

**VPN-Protected Services** use `network_mode: service:gluetun`:

- qBittorrent, Prowlarr, NZBGet, Byparr
- All traffic routes through Gluetun's VPN tunnel
- Accessed via Gluetun's published ports

**Cross-Network Services** bridge both Docker networks:

- Traefik (reverse proxy)
- Glance (monitoring)
- Jellyfin (media server)
- Jellyseerr (media requests)

### Deployment Flow

1. Validate environment and permissions
2. Create service directories with proper ownership
3. Copy files from GitHub workspace to deployment path
4. Create backup of current state
5. Validate docker-compose configuration
6. Stop existing containers
7. Pull latest images
8. Deploy with `docker compose up`
9. Health check critical services (traefik, adguardhome, homeassistant)
10. Rollback on failure, cleanup old backups on success

### State-Based Setup

Setup wizard tracks progress in `.setup_state`:

- `fresh` → `prerequisites_installed` → `runner_configured` → `directories_created` → `environment_configured` → `services_configured` → `deployed`
- Allows resuming after interruption or docker group changes

## Environment Variables

### Required (Auto-Generated by Wizard)

- `PUID/PGID` - User/group IDs for container permissions
- `TZ` - Timezone
- `DOMAIN` - Domain name for services
- Service passwords (Jellyfin, Vaultwarden, AdGuard, Samba)
- VPN configuration (provider, credentials)
- Tailscale auth key
- SMTP settings (Vaultwarden email)

### Auto-Generated API Keys

- Radarr, Sonarr, Lidarr, Prowlarr, Bazarr, Jellyseerr API keys (created by wizard)

## Docker Compose Testing

```bash
# Validate configuration
cd homelab
docker compose config -q

# Validate without .env (ensure no hardcoded values)
docker compose -f docker-compose.yml config --dry-run

# Test specific service
docker compose up -d <service>
docker compose logs -f <service>
```

## Common Issues

### Permission Errors

The deployment script handles these automatically, but manual fix:

```bash
cd homelab
sudo chown -R $(id -u):$(id -g) .
chmod -R 755 .
```

### Docker Group Access

After adding user to docker group:

```bash
newgrp docker
./homelab.sh deploy
```

### Service Won't Start

```bash
./homelab.sh logs <service>
docker compose ps <service>
```

### GitHub Runner Issues

Runner installed at `~/actions-runner`:

```bash
cd ~/actions-runner
sudo ./svc.sh status
sudo ./svc.sh restart
```

## Security Notes

- **Default ports exposed**: 27+ ports open by default
- **Production deployment**: Configure Traefik routes with HTTPS before exposing to internet
- **Secrets**: Never commit `.env` file - use `.env.example` as template
- **Firewall**: Configure UFW to allow only 22, 80, 443, 51820
- **VPN**: All download services protected by Gluetun
- **Access**: Use Tailscale for secure remote access

## Testing Workflows Locally

```bash
# Simulate CI deployment
cd homelab
export GITHUB_WORKSPACE=$(pwd)/..
export HOMELAB_PATH=~/homelab
bash scripts/deploy-ci-streamlined.sh

# Test monitoring
bash scripts/monitor-ci.sh
```

## Home Assistant Integrations

### HACS (Community Store)

Auto-installed by deploy script:

```bash
homelab/scripts/setup-hacs.sh
```

First-time setup requires GitHub authentication via device code flow.

### MTR-1 Presence Detection

Zone visualization template: `homeassistant/config/mtr1-zones.yaml`
Requires Plotly Graph Card from HACS.

## Coolify PaaS

### Quick Setup

```bash
# Generate credentials
cd homelab && ./scripts/generate-coolify-env.sh

# Deploy services
docker compose up -d coolify coolify-db coolify-redis coolify-soketi

# Access UI
http://<server-ip>:8000
```

### Architecture

- **coolify**: Main PaaS application (172.20.0.100:8000)
- **coolify-db**: PostgreSQL 16 database (172.20.0.101)
- **coolify-redis**: Cache layer (172.20.0.102)
- **coolify-soketi**: WebSocket server (172.20.0.103)

### Required Environment Variables

Generate all values before deployment:

- `COOLIFY_APP_ID` - openssl rand -hex 16
- `COOLIFY_APP_KEY` - base64:$(openssl rand -base64 32)
- `COOLIFY_DB_PASSWORD` - openssl rand -base64 32
- `COOLIFY_REDIS_PASSWORD` - openssl rand -base64 32
- `COOLIFY_PUSHER_APP_ID` - openssl rand -hex 16
- `COOLIFY_PUSHER_APP_KEY` - openssl rand -hex 32
- `COOLIFY_PUSHER_APP_SECRET` - openssl rand -hex 32

### Deployment Workflow

1. Create project in Coolify UI
2. Add resource (app/database/service)
3. Connect git repo or specify Docker image
4. Configure environment variables
5. Deploy - Coolify handles build and deployment

### Integration with Homelab

Coolify-deployed apps can access homelab services by connecting to the `homelab` network.

### Documentation

- Quick Start: `homelab/COOLIFY_QUICKSTART.md`
- Full Guide: `homelab/docs/COOLIFY_SETUP.md`
