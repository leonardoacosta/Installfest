# Homelab Stack

Streamlined Docker-based homelab management for Arch Linux.

## 📁 Structure

```
homelab/
├── docker-compose.yml     # Service definitions
├── .env                   # Configuration (create from template)
├── homelab.sh            # Management script
├── install-fresh.sh      # Fresh installation wizard
└── [service directories]  # Service-specific data
```

## 🚀 Quick Start

### Fresh Installation (New Arch Linux System)

```bash
./install-fresh.sh
```

This wizard will:
1. Install prerequisites (Docker, git, GitHub CLI)
2. Setup GitHub Actions runner
3. Configure environment variables
4. Setup selected services
5. Deploy via GitHub Actions
6. Configure SSH and Bluetooth

### Management Commands

```bash
# Interactive menu
./homelab.sh

# Command line usage
./homelab.sh start              # Start all services
./homelab.sh start jellyfin     # Start specific service
./homelab.sh stop               # Stop all services
./homelab.sh restart            # Restart services
./homelab.sh status             # Show status
./homelab.sh logs [service]     # View logs
./homelab.sh urls               # Show service URLs
./homelab.sh update             # Update Docker images
./homelab.sh deploy             # Deploy via GitHub Actions
./homelab.sh backup             # Backup configuration
./homelab.sh cleanup            # Clean Docker system
```

## 🏠 Available Services

### Core Services
- **Home Assistant** (8123) - Home automation
- **AdGuard Home** (3000) - DNS filtering
- **Jellyfin** (8096) - Media server
- **Ollama** (11434) - Local LLMs
- **Ollama WebUI** (3001) - LLM interface

### Dashboard & Management
- **Glance** (8085) - Service dashboard
- **Traefik** (8080) - Reverse proxy

### Security
- **Vaultwarden** (8222) - Password manager
- **Tailscale** - VPN mesh network

### Media Stack
- **Radarr** (7878) - Movie management
- **Sonarr** (8989) - TV show management
- **Prowlarr** (9696) - Indexer management
- **Lidarr** (8686) - Music management
- **Bazarr** (6767) - Subtitle management
- **Jellyseerr** (5055) - Media requests
- **qBittorrent** (8090) - Download client

### Network Services
- **Gluetun** - VPN gateway for media services
- **Samba** (445) - Network file shares

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# User/Group IDs
PUID=1000
PGID=1000

# Timezone
TZ=America/Chicago

# Domain (optional)
DOMAIN=homelab.local

# Service passwords (CHANGE ALL DEFAULTS!)
JELLYFIN_PASSWORD=changeme
VAULTWARDEN_ADMIN_TOKEN=changeme
# ... etc
```

### Service-Specific Setup

#### Vaultwarden
- Configure SMTP for email notifications
- Set strong admin token

#### Tailscale
- Get auth key from: https://login.tailscale.com/admin/settings/keys
- Add to `.env`: `TAILSCALE_AUTH_KEY=tskey-auth-...`

#### Home Assistant
- USB devices (Zigbee/Z-Wave) auto-detected
- Map devices in docker-compose.yml if needed

#### Media Services
- Configure download paths
- Set up API keys between *arr services
- Point to media storage location

## 📊 Service Directory

| Service | Port | Network | Description |
|---------|------|---------|-------------|
| **Core Infrastructure** |
| Home Assistant | 8123 | Host | Smart home automation |
| AdGuard Home | 3000 | 172.20.0.53 | DNS filtering |
| Jellyfin | 8096 | 172.20.0.96 | Media server |
| Ollama | 11434 | 172.20.0.11 | Local LLM server |
| Ollama WebUI | 3001 | 172.20.0.12 | LLM interface |
| **Management** |
| Glance | 8085 | 172.20.0.85 | Dashboard |
| Traefik | 8080 | 172.20.0.81 | Reverse proxy |
| **Security** |
| Vaultwarden | 8222 | 172.20.0.22 | Password manager |
| Tailscale | - | Host | Mesh VPN |
| **Media Automation** |
| Radarr | 7878 | 172.21.0.78 | Movies |
| Sonarr | 8989 | 172.21.0.89 | TV Shows |
| Prowlarr | 9696 | via Gluetun | Indexers |
| Lidarr | 8686 | 172.21.0.86 | Music |
| Bazarr | 6767 | 172.21.0.67 | Subtitles |
| Jellyseerr | 5055 | 172.20.0.55 | Requests |
| qBittorrent | 8090 | via Gluetun | Downloads |
| **Network** |
| Gluetun | - | 172.21.0.2 | VPN gateway |
| Samba | 445 | 172.20.0.45 | File shares |

## 🌐 Network Architecture

The stack uses two isolated Docker networks for security:

- **Homelab Network** (172.20.0.0/16) - Core services and infrastructure
- **Media Network** (172.21.0.0/16) - Media automation and VPN-protected services

Services like qBittorrent, Prowlarr, and NZBGet route through Gluetun VPN for privacy.

## 🔧 Troubleshooting

### Port Conflicts
```bash
./homelab.sh restart
```

### Permission Issues
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Service Logs
```bash
./homelab.sh logs [service_name]
```

### Reset Service
```bash
docker compose down [service]
rm -rf ./[service]/*
./homelab.sh start [service]
```

## 📦 Backup & Restore

### Create Backup
```bash
./homelab.sh backup
```

Backups are stored in `backups/[timestamp]/` with:
- `.env` file
- `docker-compose.yml`
- Service configurations (compressed)

### Restore from Backup
```bash
cp backups/[timestamp]/.env .
tar -xzf backups/[timestamp]/[service].tar.gz
./homelab.sh start
```

## 🔄 Updates

### Update Docker Images
```bash
./homelab.sh update
./homelab.sh restart
```

### Update Scripts
```bash
git pull
./homelab.sh
```

## 🚀 GitHub Actions Deployment

The homelab supports automated deployment via GitHub Actions:

1. **Setup Runner**: The `install-fresh.sh` script configures this automatically
2. **Deploy**:
   ```bash
   ./homelab.sh deploy
   # Or: gh workflow run deploy-homelab
   ```
3. **Monitor**: `gh run watch`

## 🔒 Security Checklist

1. **Change ALL Default Passwords** in `.env`
2. **Enable Service Authentication** where available
3. **Configure VPN** for media services (via Gluetun)
4. **Setup HTTPS** with Traefik reverse proxy
5. **Regular Updates** via `./homelab.sh update`
6. **Backup Regularly** via `./homelab.sh backup`

## 📚 Resources

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose](https://docs.docker.com/compose)
- Individual service documentation (see each service's website)

## 📝 License

MIT - See individual service licenses for details.