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

**USB Boot Automation**: Two-stage automated deployment system

- Stage 1: `usb-boot/run-install.sh` - Programmatic archinstall execution from USB
- Stage 2: `usb-boot/homelab-bootstrap.sh` - First-boot service that deploys homelab
- Secrets encrypted with GPG (AES256) on USB
- Unattended mode via YAML configuration file
- Systemd oneshot service runs bootstrap after first reboot

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
- `compose/runners.yml` - 4 GitHub Actions self-hosted runners
- `compose/playwright-server.yml` - Playwright test report aggregation server
- `compose/claude-agent-server.yml` - Claude Code agent management dashboard
- `.env` - Environment variables (auto-generated by wizard)
- `.env.example` - Template for manual configuration
- `traefik/traefik.yml` - Static Traefik configuration
- `traefik/dynamic/*.yml` - Dynamic routes, middlewares, TLS
- `glance/glance.yml` - Dashboard configuration
- `homeassistant/config/mtr1-zones.yaml` - MTR-1 presence detection template
- `config/bluetooth-devices.yml` - Bluetooth auto-pairing device list
- `usb-boot/archinstall-config.json` - Arch Linux automated installation config
- `usb-boot/homelab-bootstrap.sh` - First-boot deployment orchestration

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

## USB Boot Automation

### Overview

Two-stage automated deployment that rebuilds homelab from USB boot with minimal manual intervention.

### Stage 1: Arch Installation

**Script**: `homelab/usb-boot/run-install.sh`

Programmatically executes archinstall:

```bash
# Run from bootable USB
./run-install.sh /dev/sdX
```

- Updates archinstall config with target disk
- Copies bootstrap files to new system
- Enables systemd first-boot service
- Reboots into fresh Arch installation

**Configuration**: `homelab/usb-boot/archinstall-config.json`

- Partitioning: EFI (1GB), swap (8GB), root (remaining)
- Packages: docker, git, bluez, steam, yq, base-devel
- Multilib repository enabled
- User with docker group membership

### Stage 2: Homelab Bootstrap

**Script**: `homelab/usb-boot/homelab-bootstrap.sh`

Runs automatically on first boot via systemd service:

1. Mounts USB drive
2. Decrypts `.homelab-secrets.env.gpg` with GPG
3. Clones Installfest repository
4. Generates unattended config file from secrets
5. Executes `homelab.sh --config` for automated setup
6. Securely deletes decrypted secrets (shred -vfz -n 3)
7. Prevents re-run by creating completion marker

**Secrets File**: `.homelab-secrets.env.gpg`

- Encrypted with GPG AES256
- Contains all passwords, API keys, VPN config, runner tokens
- Template: `homelab/.homelab-secrets.env.example`

### Creating Bootable USB

```bash
cd homelab/usb-boot
./create-bootable-usb.sh /dev/sdX /path/to/.homelab-secrets.env
```

Process:
1. Downloads latest Arch ISO
2. Verifies SHA256 checksum
3. Writes ISO to USB with dd
4. Mounts USB and copies automation files
5. Encrypts secrets with GPG (prompts for passphrase)
6. Creates README with boot instructions

### Unattended Mode

The `homelab.sh` script supports `--config` flag for fully automated setup:

```bash
./homelab.sh --config /path/to/config.yml
```

Config file format:

```yaml
unattended: true
system:
  timezone: "America/Chicago"
  domain: "homelab.local"
passwords:
  jellyfin: "password123"
  vaultwarden: "password456"
vpn:
  provider: "custom"
  type: "wireguard"
  # ... additional VPN settings
github:
  repo_owner: "username"
  repo_name: "repository"
  runner_tokens:
    - "token1"
    - "token2"
    - "token3"
    - "token4"
```

## GitHub Actions Multi-Runner

### Overview

4 Docker-based self-hosted GitHub Actions runners for parallel CI/CD execution.

**Access**: Containers `github-runner-1` through `github-runner-4`

### Configuration

File: `homelab/compose/runners.yml`

Each runner:
- Unique token (RUNNER_TOKEN_1-4 from .env)
- Unique labels (runner-1, runner-2, etc.)
- Shared playwright-reports volume
- Docker-in-Docker support via socket mount
- Separate work directories

### Setup

1. Get runner tokens from GitHub:
   - Navigate to: `https://github.com/OWNER/REPO/settings/actions/runners/new`
   - Generate 4 tokens (expire after 1 hour if unused)

2. Add tokens to `.env`:
   ```bash
   RUNNER_TOKEN_1=AAAAAA...
   RUNNER_TOKEN_2=BBBBBB...
   RUNNER_TOKEN_3=CCCCCC...
   RUNNER_TOKEN_4=DDDDDD...
   ```

3. Deploy runners:
   ```bash
   docker compose up -d github-runner-1 github-runner-2 github-runner-3 github-runner-4
   ```

### Usage in Workflows

Target specific runner:

```yaml
jobs:
  test:
    runs-on: [self-hosted, Linux, X64, homelab, runner-1]
```

Parallel execution across all runners:

```yaml
jobs:
  test:
    runs-on: [self-hosted, Linux, X64, homelab]
    strategy:
      matrix:
        runner: [runner-1, runner-2, runner-3, runner-4]
```

### Troubleshooting

```bash
# Check runner status
docker compose ps | grep runner

# View runner logs
docker compose logs -f github-runner-1

# Restart specific runner
docker compose restart github-runner-1

# Re-register runner (if token expired)
# Update RUNNER_TOKEN_X in .env, then:
docker compose up -d --force-recreate github-runner-X
```

## Playwright Report Server

### Overview

Aggregates Playwright test reports from all GitHub runners with searchable web UI.

**Access**: `http://playwright.local` (via Traefik)

### Architecture

- **Backend**: Node.js + Express + SQLite
- **Frontend**: Vanilla JS (no build step required)
- **File Watcher**: Monitors `/reports` volume for new HTML reports
- **Database**: SQLite stores report metadata and test statistics

### How It Works

1. GitHub runners write Playwright reports to shared volume: `/reports`
2. File watcher detects new `index.html` files
3. Parser extracts test statistics using cheerio
4. Metadata indexed in SQLite database
5. Web UI provides filtering by workflow, date, status

### API Endpoints

- `GET /api/reports` - List all reports (filterable)
  - Query params: `workflow`, `status`, `limit`, `offset`
- `GET /api/workflows` - List unique workflow names
- `DELETE /api/reports/:id` - Delete specific report
- `GET /reports-static/:hash/index.html` - Serve report HTML

### Database Schema

```sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_name TEXT,
  run_number INTEGER,
  hash TEXT UNIQUE,
  file_path TEXT,
  total_tests INTEGER,
  passed INTEGER,
  failed INTEGER,
  skipped INTEGER,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Configuration

File: `homelab/compose/playwright-server.yml`

Environment:
- `REPORTS_DIR=/reports` - Shared volume path
- `DB_PATH=/app/db/reports.db` - SQLite database
- `PORT=3000` - Internal port

Volumes:
- `playwright-reports:/reports` - Shared with runners
- `playwright-db:/app/db` - Database persistence

### Development

```bash
# Local development
cd playwright-server
npm install
npm run dev

# Build Docker image
docker build -t playwright-server .

# Run standalone
docker run -p 3000:3000 -v reports:/reports playwright-server
```

## Claude Agent Management Server

### Overview

Centralized management dashboard for Claude Code development sessions across multiple projects.

**Access**: `http://claude.local` (via Traefik)

### Features

- **Project Management**: Create and track development projects
- **Session Tracking**: Start/stop Claude Code agent sessions
- **Hook History**: View tool calls and execution logs (SDK integration pending)
- **WebSocket Logs**: Real-time log streaming (infrastructure ready)

### Architecture

- **Backend**: TypeScript + Express + SQLite + WebSocket
- **Frontend**: Vanilla JS dashboard
- **Database**: SQLite for projects, sessions, hooks
- **Volume Mount**: `/home/leo/dev/projects:/projects` for workspace access

### Database Schema

```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  agent_id TEXT,
  status TEXT DEFAULT 'running',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE hooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  hook_type TEXT,
  tool_name TEXT,
  duration_ms INTEGER,
  success BOOLEAN,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

### API Endpoints

- `GET/POST /api/projects` - Manage projects
- `GET/POST /api/sessions` - Manage sessions
- `DELETE /api/sessions/:id` - Stop session
- `GET /api/hooks` - Hook history (filterable by session)
- `GET /api/hooks/stats` - Aggregated statistics

### WebSocket Events

```typescript
// Client connects
ws.send(JSON.stringify({ type: 'subscribe', sessionId: 123 }));

// Server streams logs (when SDK integrated)
{
  type: 'log',
  sessionId: 123,
  timestamp: '2025-01-15T10:30:00Z',
  level: 'info',
  message: 'Tool call: Read file.txt'
}
```

### Configuration

File: `homelab/compose/claude-agent-server.yml`

Environment:
- `PORT=3001` - Internal port
- `DB_PATH=/app/db/claude.db` - SQLite database
- `PROJECTS_DIR=/projects` - Workspace mount point
- `NODE_ENV=production`

Volumes:
- `/home/leo/dev/projects:/projects` - Development workspace
- `claude-agent-db:/app/db` - Database persistence

### Integration with Claude Agent SDK

**Status**: Infrastructure ready, SDK integration pending

To integrate:

1. Install `@anthropic-ai/sdk` in `claude-agent-server`
2. Implement hook interceptors in SDK config
3. POST hook data to `/api/hooks` endpoint
4. Enable WebSocket log streaming

Example SDK integration (pseudocode):

```typescript
import { ClaudeAgent } from '@anthropic-ai/sdk';

const agent = new ClaudeAgent({
  hooks: {
    onToolCall: async (data) => {
      await fetch('http://localhost:3001/api/hooks', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          hook_type: 'tool_call',
          tool_name: data.tool,
          timestamp: new Date().toISOString()
        })
      });
    }
  }
});
```

## Steam Headless Setup

### Overview

Runs Steam in headless mode for Remote Play/SteamLink without desktop environment.

**Script**: `homelab/scripts/setup-steam.sh`

### What It Does

1. Verifies Steam installation (should be installed during archinstall)
2. Enables multilib repository if needed
3. Creates systemd service: `steam-headless.service`
4. Configures firewall for Remote Play ports (27031-27037)
5. Provides first-time login instructions

### Systemd Service

File: `/etc/systemd/system/steam-headless.service`

```ini
[Unit]
Description=Steam Headless (Remote Play)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=leo
ExecStart=/usr/bin/steam -console -noreactlogin -nofriendsui -no-browser
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Firewall Rules (UFW)

```bash
sudo ufw allow 27031:27036/udp comment "Steam Remote Play discovery"
sudo ufw allow 27036/tcp comment "Steam Remote Play streaming"
sudo ufw allow 27037/tcp comment "Steam Remote Play"
```

### First-Time Login

Steam requires manual login on first run:

```bash
# Start service
sudo systemctl start steam-headless.service

# Monitor logs for login prompt
sudo journalctl -u steam-headless.service -f

# Enter credentials when prompted
# If Steam Guard is enabled, enter code from authenticator
```

After successful login, credentials are saved and future reboots auto-login.

### Remote Play Setup

1. Enable Remote Play in Steam settings (via Steam Link app)
2. Server will be discoverable on local network
3. Connect using:
   - Steam Link app (mobile/TV)
   - Steam client on other computers

### Service Management

```bash
# Start Steam
sudo systemctl start steam-headless.service

# Stop Steam
sudo systemctl stop steam-headless.service

# View status
sudo systemctl status steam-headless.service

# View logs
sudo journalctl -u steam-headless.service -f

# Enable auto-start on boot
sudo systemctl enable steam-headless.service
```

## Bluetooth Automation

### Overview

Automated Bluetooth device pairing and auto-connection from YAML configuration.

**Script**: `homelab/scripts/setup-bluetooth.sh`

### What It Does

1. Installs bluez/bluez-utils if needed
2. Enables and starts bluetooth.service
3. Powers on Bluetooth adapter
4. Reads device list from YAML config
5. Pairs and trusts each device
6. Auto-connects devices marked with `auto_connect: true`

### Configuration

File: `homelab/config/bluetooth-devices.yml`

```yaml
devices:
  - name: "Xbox Controller"
    mac: "AA:BB:CC:DD:EE:FF"
    auto_connect: true

  - name: "Bluetooth Headset"
    mac: "11:22:33:44:55:66"
    auto_connect: true

  - name: "Bluetooth Keyboard"
    mac: "77:88:99:AA:BB:CC"
    auto_connect: false
```

Template: `homelab/config/bluetooth-devices.yml.example`

### Finding Device MAC Addresses

```bash
# Start bluetoothctl interactive shell
bluetoothctl

# Enable scanning
scan on

# Wait for devices to appear
# Output: [NEW] Device AA:BB:CC:DD:EE:FF Xbox Wireless Controller

# List all discovered devices
devices

# Stop scanning
scan off

# Exit
exit
```

### Pairing Process

The script uses bluetoothctl batch commands:

```bash
bluetoothctl << EOF
power on
agent on
default-agent
scan on
# ... wait ...
scan off
pair AA:BB:CC:DD:EE:FF
trust AA:BB:CC:DD:EE:FF
connect AA:BB:CC:DD:EE:FF
exit
EOF
```

### Auto-Connect Behavior

- `auto_connect: true` - Device connects automatically when in range and powered on
- `auto_connect: false` - Device is paired and trusted but won't auto-connect

Trusted devices will reconnect automatically on system reboot when in range.

### Running the Setup

```bash
cd homelab/scripts
./setup-bluetooth.sh

# Or with custom config path
BLUETOOTH_CONFIG=/custom/path/devices.yml ./setup-bluetooth.sh
```

### Troubleshooting

```bash
# Check Bluetooth service status
sudo systemctl status bluetooth.service

# Check adapter power state
bluetoothctl show

# List paired devices
bluetoothctl devices

# Manually connect to device
bluetoothctl connect AA:BB:CC:DD:EE:FF

# View detailed device info
bluetoothctl info AA:BB:CC:DD:EE:FF

# Remove pairing (to re-pair)
bluetoothctl remove AA:BB:CC:DD:EE:FF
```
