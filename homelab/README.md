# Homelab Stack

Complete Docker-based homelab management for Arch Linux with mandatory configuration wizard.

## 📁 Structure

```
homelab/
├── homelab.sh             # Single management script (setup + management)
├── docker-compose.yml     # Service definitions
├── .env                   # Generated during setup (DO NOT CREATE MANUALLY)
├── .setup_state          # Tracks setup progress
└── [service directories]  # Auto-created during setup
```

## 🚀 Getting Started

### First Run - Automatic Setup

```bash
./homelab.sh
```

**That's it!** The script will:
1. ✅ Detect fresh installation and start setup wizard
2. ✅ Install all prerequisites (Docker, git, GitHub CLI, etc.)
3. ✅ Setup GitHub Actions runner for deployments
4. ✅ Create directory structure
5. ✅ **REQUIRE** all configurations (no skips allowed):
   - System settings (timezone, domain)
   - Service passwords (all mandatory, 8+ characters)
   - VPN configuration (for secure media downloads)
   - Email/SMTP (for password recovery)
   - Tailscale auth (for remote access)
   - Storage paths
6. ✅ Deploy all services via Docker Compose
7. ✅ Configure SSH and Bluetooth

### After Setup - Management

Once configured, run `./homelab.sh` for the management menu:

```bash
# Command line usage
./homelab.sh start              # Start all services
./homelab.sh start jellyfin     # Start specific service
./homelab.sh stop               # Stop all services
./homelab.sh restart            # Restart services
./homelab.sh status             # Show service status
./homelab.sh logs [service]     # View logs
./homelab.sh urls               # Show service URLs
./homelab.sh update             # Update Docker images
./homelab.sh deploy             # Deploy via GitHub Actions
./homelab.sh backup             # Backup configuration
./homelab.sh cleanup            # Clean Docker system
./homelab.sh setup              # Re-run complete setup (WARNING: resets everything)
```

## 🔒 Mandatory Configuration

**This homelab enforces complete configuration** - you cannot skip any step:

### Required During Setup:
- **System**: Timezone, domain name
- **Passwords**: All service passwords (minimum 8 characters)
- **VPN**: Provider credentials for secure media downloading
- **Email**: SMTP configuration for password recovery
- **Tailscale**: Auth key for mesh VPN access
- **Storage**: Media and download paths

### Why Mandatory?
- **Security**: No default passwords allowed
- **Reliability**: All services properly configured
- **Integration**: Services can communicate correctly
- **Recovery**: Email required for password resets

## 🏠 Services Included

### Core Infrastructure
- **Home Assistant** (8123) - Smart home automation
- **AdGuard Home** (3000) - DNS filtering & ad blocking
- **Jellyfin** (8096) - Media streaming server
- **Ollama** (11434) + WebUI (3001) - Local AI/LLM

### Management & Security
- **Glance** (8085) - Service dashboard
- **Traefik** (8080) - Reverse proxy with SSL
- **Vaultwarden** (8222) - Password manager
- **Tailscale** - Mesh VPN for remote access

### Media Automation
- **Radarr** (7878) - Movie management
- **Sonarr** (8989) - TV show management
- **Prowlarr** (9696) - Indexer management
- **Lidarr** (8686) - Music management
- **Bazarr** (6767) - Subtitle management
- **Jellyseerr** (5055) - Media requests
- **qBittorrent** (8090) - Download client (VPN-protected)

### Network Services
- **Gluetun** - VPN gateway for media services
- **Samba** (445) - Network file shares

## 📊 Network Architecture

The stack uses two isolated Docker networks:

- **Homelab Network** (172.20.0.0/16) - Core services
- **Media Network** (172.21.0.0/16) - VPN-protected media services

All torrent/usenet traffic routes through Gluetun VPN with kill switch enabled.

## 🔧 Common Operations

### View Service URLs
```bash
./homelab.sh urls
```

### Monitor Services
```bash
./homelab.sh status
```

### View Logs
```bash
./homelab.sh logs          # All services
./homelab.sh logs jellyfin # Specific service
```

### Update Services
```bash
./homelab.sh update         # Pull latest images
./homelab.sh restart        # Apply updates
```

### Backup Configuration
```bash
./homelab.sh backup
```
Backups stored in `backups/[timestamp]/`

### Re-run Setup
```bash
./homelab.sh setup
```
⚠️ **WARNING**: This resets everything and starts fresh!

## 🚀 GitHub Actions Deployment

After setup, deploy updates via GitHub Actions:

```bash
./homelab.sh deploy
# Or: gh workflow run deploy-homelab
```

Monitor with: `gh run watch`

## 🔧 Troubleshooting

### Docker Permission Issues
```bash
sudo usermod -aG docker $USER
newgrp docker
./homelab.sh  # Re-run
```

### Port Conflicts
```bash
./homelab.sh restart
```

### Service Not Starting
```bash
./homelab.sh logs [service_name]
```

### Reset Specific Service
```bash
docker compose down [service]
rm -rf ./[service]/*
./homelab.sh start [service]
```

## 🛡️ Security Notes

- **No Default Passwords**: Setup wizard enforces unique passwords
- **VPN Protection**: All media downloads route through VPN
- **Kill Switch**: Downloads stop if VPN disconnects
- **HTTPS Ready**: Traefik configured for SSL certificates
- **Remote Access**: Tailscale mesh VPN for secure access

## 📋 System Requirements

- **OS**: Arch Linux (required)
- **RAM**: 4GB minimum, 8GB+ recommended
- **Storage**: 20GB minimum for services
- **Network**: Internet connection required for setup
- **CPU**: x86_64 architecture

## 🔄 State Management

The script tracks setup progress in `.setup_state`:
- Resumes from interruptions automatically
- Prevents re-running completed steps
- Delete to force complete re-setup

## 📝 Important Files

- `homelab.sh` - Main script (DO NOT EDIT)
- `.env` - Configuration (generated, contains passwords)
- `.setup_state` - Progress tracking
- `docker-compose.yml` - Service definitions
- `backups/` - Configuration backups

## 🆘 Support

1. Check logs: `./homelab.sh logs [service]`
2. View status: `./homelab.sh status`
3. Restart services: `./homelab.sh restart`
4. Last resort: `./homelab.sh setup` (complete reset)

## 📄 License

MIT - See individual service licenses for details.