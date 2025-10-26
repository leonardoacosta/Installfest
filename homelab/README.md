# Homelab Stack

Complete Docker-based homelab solution for remote server deployment with automated setup, Traefik reverse proxy, and comprehensive security hardening.

> ⚠️ **SECURITY WARNING**: Default configuration exposes 27+ ports. **Must configure Traefik routes** before production deployment. See [Security Considerations](#-security-considerations) for critical hardening steps.

## 📁 Project Structure

```
homelab/
├── homelab.sh                 # Main management script
├── docker-compose.yml         # Service definitions
├── .env                       # Environment variables (auto-generated)
├── .env.example              # Template for environment variables
├── TRAEFIK_VAULTWARDEN_CONFIG.md  # Traefik configuration guide
│
├── scripts/                   # Utility scripts
│   ├── common-utils.sh       # Shared functions for all scripts
│   ├── deploy-ci.sh          # CI/CD deployment script with HACS auto-install
│   ├── monitor-ci.sh         # Service monitoring script
│   ├── fix-permissions.sh    # Permission fixing utility
│   └── setup-hacs.sh         # HACS installer for Home Assistant
│
├── traefik/                   # Traefik configuration
│   ├── traefik.yml           # Static configuration
│   ├── dynamic/              # Dynamic configurations
│   │   ├── middlewares.yml   # Security middlewares
│   │   ├── tls.yml          # TLS configuration
│   │   └── gluetun-routers.yml  # VPN service routes
│   └── scripts/              # Traefik utilities
│       └── test-service.sh   # Service connectivity test
│
├── homeassistant/             # Home Assistant configuration
│   └── config/               # Configuration files
│       └── mtr1-zones.yaml   # MTR-1 zone visualization template
│
├── glance/                    # Dashboard configuration
│   ├── glance.yml           # Dashboard layout & widgets
│   └── assets/              # Static assets
│
├── docs/                      # Documentation
│   ├── SECURITY_AUDIT.md    # Security analysis
│   ├── TRAEFIK_MIGRATION_GUIDE.md  # Migration from NPM
│   └── [service guides]      # Service-specific docs
│
└── [service directories]      # Auto-created data directories
    ├── vaultwarden/          # Password manager data
    ├── jellyfin/             # Media server data
    ├── homeassistant/        # Smart home config
    └── ...                   # Other service data
```

## 🚀 Quick Start

### Prerequisites

- **Omarchy Server** (Arch Base)
- **Docker** 24.0+ with Docker Compose v2
- **Domain** pointed to server IP
- **Ports** 80/443 accessible from internet

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/homelab.git
cd homelab

# Run setup wizard
./homelab.sh

# The script will:
# 1. Install Docker & dependencies
# 2. Configure all services (mandatory)
# 3. Setup GitHub Actions runner
# 4. Deploy services
# 5. Configure SSH & Bluetooth
```

## 🎯 Management Commands

```bash
./homelab.sh start              # Start all services
./homelab.sh start jellyfin     # Start specific service
./homelab.sh stop               # Stop all services
./homelab.sh restart            # Restart services
./homelab.sh status             # Show service status
./homelab.sh logs [service]     # View logs
./homelab.sh urls               # Show service URLs
./homelab.sh update             # Update Docker images
./homelab.sh backup             # Backup configuration
./homelab.sh cleanup            # Clean Docker system
./homelab.sh deploy             # Deploy via GitHub Actions
./homelab.sh setup              # Re-run setup (⚠️ RESETS EVERYTHING)
```

## 🏠 Services

### Core Infrastructure
| Service | Port | Purpose | Access |
|---------|------|---------|--------|
| **Glance** | 8085 | Dashboard & monitoring | `http://<IP>:8085` |
| **Home Assistant** | 8123 | Smart home automation | `http://<IP>:8123` |
| **AdGuard Home** | 82 | DNS ad blocking | `http://<IP>:82` |
| **Traefik** | 80/443 | Reverse proxy with SSL | `https://traefik.<domain>` |

### AI & Knowledge
| Service | Port | Purpose | Access |
|---------|------|---------|--------|
| **Ollama** | 11434 | Local LLM API | `http://<IP>:11434` |
| **Ollama WebUI** | 8081 | Web interface for Ollama | `http://<IP>:8081` |

### Media Services
| Service | Port | Purpose | Access |
|---------|------|---------|--------|
| **Jellyfin** | 8096 | Media streaming server | `http://<IP>:8096` |
| **Jellyseerr** | 5055 | Media request management | `http://<IP>:5055` |

### Security & VPN
| Service | Port | Purpose | Access |
|---------|------|---------|--------|
| **Vaultwarden** | 8222 | Password manager | `http://<IP>:8222` |
| **Tailscale** | - | Mesh VPN | Via Tailscale app |

### Media Automation (Arr Stack)
| Service | Port | Purpose | Access |
|---------|------|---------|--------|
| **Radarr** | 7878 | Movie management | `http://<IP>:7878` |
| **Sonarr** | 8989 | TV show management | `http://<IP>:8989` |
| **Lidarr** | 8686 | Music management | `http://<IP>:8686` |
| **Bazarr** | 6767 | Subtitle management | `http://<IP>:6767` |
| **Prowlarr** | 9696 | Indexer management | `http://<IP>:9696` |

### Download Services (VPN-Protected)
| Service | Port | Purpose | Access |
|---------|------|---------|--------|
| **qBittorrent** | 8080 | Torrent client | `http://<IP>:8080` |
| **NZBGet** | 6789 | Usenet downloader | `http://<IP>:6789` |
| **Gluetun** | 8000 | VPN gateway control | `http://<IP>:8000` |

### File Sharing
| Service | Port | Purpose | Access |
|---------|------|---------|--------|
| **Samba** | 445/139 | Network file shares | `smb://<IP>` |

## 🏠 Home Assistant Integrations

### HACS (Home Assistant Community Store)

HACS provides access to community integrations, themes, and cards not available in the official Home Assistant add-on store.

#### Automatic Installation

HACS is automatically installed during deployment:

```bash
# Installed automatically via deploy-ci.sh
# Or manually install:
./scripts/setup-hacs.sh
```

#### Manual Setup (First Time Only)

1. **Access Home Assistant**: http://192.168.1.14:8123
2. **Clear Browser Cache**: Ctrl+F5 or Cmd+Shift+R
3. **Add Integration**: Settings → Devices & Services → Add Integration
4. **Search for HACS**: Type "HACS" in the search box
5. **GitHub Authentication**:
   - Copy the provided device code
   - Visit: https://github.com/login/device
   - Enter the device code
   - Authorize HACS

#### Installing Community Components

After HACS setup:
- **Frontend Cards**: HACS → Frontend → Explore & Download
- **Integrations**: HACS → Integrations → Explore & Download
- **Themes**: HACS → Frontend → Themes

### Apollo MTR-1 Presence Detection

Advanced mmWave presence detection with zone configuration.

#### Prerequisites

1. Install HACS (see above)
2. Install Plotly Graph Card:
   ```
   HACS → Frontend → Search "Plotly" → Install
   ```
3. Restart Home Assistant

#### Zone Configuration

1. **Configure MTR-1 Device**:
   - Settings → Devices & Services → ESPHome
   - Select your MTR-1 device (e.g., `apollo_r_mtr_1_c64a28`)
   - Configure zones in Configuration section:
     ```
     Zone 1: Living Room
     X: -3000 to 3000 mm
     Y: 0 to 4000 mm

     Zone 2: Kitchen
     X: -3000 to 0 mm
     Y: 4000 to 7000 mm

     Zone 3: Entrance
     X: 0 to 3000 mm
     Y: 4000 to 7000 mm
     ```

2. **Add Visualization Card**:
   - Edit Dashboard → Add Card → Manual
   - Copy configuration from: `homeassistant/config/mtr1-zones.yaml`
   - Replace `apollo_r_mtr_1_XXXXXX` with your device name

#### Zone Parameters

| Parameter | Range | Notes |
|-----------|-------|-------|
| X-axis | -7000 to 7000 mm | Horizontal detection range |
| Y-axis | 0 to 7000 mm | Vertical detection range |
| Zone Type | Detection/Filter/Disabled | Detection mode for presence |
| Multi-Target | Up to 3 targets | Enable for multiple person tracking |

#### Troubleshooting MTR-1

- **No Detection**: Check zone configuration doesn't overlap
- **False Positives**: Use filter zones to exclude areas
- **Imperial Units**: 1 inch = 25.4 mm for conversion

## 📊 Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Internet Gateway                       │
└────────────┬────────────────────┬───────────────────────┘
             │                    │
             ▼                    ▼
     ┌──────────────┐      ┌──────────────┐
     │   Traefik    │      │  Tailscale   │
     │  80/443      │      │   (VPN)      │
     └──────┬───────┘      └──────────────┘
             │
  ┌──────────┴───────────────────────────┐
  │     Homelab Network (172.20.0.0/16)  │
  ├──────────────────────────────────────┤
  │ • Home Assistant  • Glance           │
  │ • AdGuard Home    • Jellyfin         │
  │ • Vaultwarden     • Ollama           │
  │ • Traefik         • Jellyseerr       │
  └──────────────────────────────────────┘
             │
  ┌──────────┴───────────────────────────┐
  │     Media Network (172.21.0.0/16)     │
  │         (VPN Protected)               │
  ├──────────────────────────────────────┤
  │ • Gluetun (VPN)   • Radarr           │
  │ • qBittorrent     • Sonarr           │
  │ • Prowlarr        • Lidarr           │
  │ • NZBGet          • Bazarr           │
  └──────────────────────────────────────┘
```

## 🔒 Security Considerations

### Critical Security Steps

#### 1. Configure Traefik Routes (PRIORITY)

Add labels to services in `docker-compose.yml`:

```yaml
jellyfin:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.jellyfin.rule=Host(`jellyfin.${DOMAIN}`)"
    - "traefik.http.routers.jellyfin.entrypoints=websecure"
    - "traefik.http.routers.jellyfin.tls.certresolver=letsencrypt"
    - "traefik.http.services.jellyfin.loadbalancer.server.port=8096"
```

#### 2. Update Environment Variables

```bash
# Required in .env
DOMAIN=your-domain.com
CF_API_EMAIL=your@email.com
CF_API_KEY=your-cloudflare-key
VAULTWARDEN_ADMIN_TOKEN=$(openssl rand -base64 48)
```

#### 3. Generate Secure Passwords

```bash
# Traefik dashboard password
htpasswd -nb admin YourPassword | sed -e s/\\$/\\$\\$/g
# Add to traefik/dynamic/middlewares.yml
```

#### 4. Configure Firewall

```bash
sudo ufw default deny incoming
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 51820/udp # WireGuard
sudo ufw enable
```

#### 5. Close Unnecessary Ports

After Traefik configuration, comment out port exposures in `docker-compose.yml`:

```yaml
# ports:
#   - "8096:8096"  # Now handled by Traefik
```

### Security Checklist

- [ ] All services behind Traefik with HTTPS
- [ ] Strong passwords (no defaults)
- [ ] Firewall configured
- [ ] VPN for admin access
- [ ] Regular backups enabled
- [ ] Monitoring configured

## 🚀 Deployment

### GitHub Actions Setup

1. **Add GitHub Secrets**:
   ```
   HOMELAB_PATH=/path/to/homelab
   RUNNER_TOKEN=<github-runner-token>
   ```

2. **Deploy Updates**:
   ```bash
   ./homelab.sh deploy
   # Or manually:
   git push origin main
   ```

### Manual Deployment

```bash
ssh user@<server-ip>
cd /path/to/homelab
git pull
docker compose up -d
```

## 📝 Configuration Files

### Key Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (auto-generated) |
| `.env.example` | Template with all required variables |
| `docker-compose.yml` | Service definitions |
| `traefik/traefik.yml` | Traefik static configuration |
| `glance/glance.yml` | Dashboard configuration |

### Scripts

| Script | Purpose |
|--------|---------|
| `homelab.sh` | Main management script |
| `scripts/common-utils.sh` | Shared utility functions |
| `scripts/deploy-ci.sh` | CI/CD deployment with HACS auto-install |
| `scripts/monitor-ci.sh` | Service health monitoring |
| `scripts/fix-permissions.sh` | Fix directory permissions |
| `scripts/setup-hacs.sh` | HACS installation for Home Assistant |

## 🔧 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
./homelab.sh logs <service>
docker compose ps <service>
```

#### Permission Errors
```bash
./scripts/fix-permissions.sh
# Or manually:
sudo chown -R $(id -u):$(id -g) <service-dir>
```

#### Port Conflicts
```bash
sudo lsof -i :<port>
./homelab.sh restart
```

#### Traefik Certificate Issues
```bash
docker logs traefik | grep -i acme
# Check DNS: dig <domain>
```

## 🗄️ Backup & Recovery

### Backup
```bash
./homelab.sh backup
# Creates: backups/backup_YYYYMMDD_HHMMSS/
```

### Restore
```bash
# Stop services
./homelab.sh stop

# Restore data
cp -r backups/backup_*/. .

# Start services
./homelab.sh start
```

## 📋 System Requirements

### Minimum
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Network**: 100Mbps

### Recommended
- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Storage**: 500GB+ SSD
- **Network**: 1Gbps

## 🔄 Updates & Maintenance

### Update Services
```bash
./homelab.sh update
./homelab.sh restart
```

### Clean Docker System
```bash
./homelab.sh cleanup
```

### Monitor Health
```bash
./homelab.sh status
docker system df
```

## 📚 Documentation

### Detailed Guides
- [Traefik Configuration](TRAEFIK_VAULTWARDEN_CONFIG.md)
- [Security Audit](docs/SECURITY_AUDIT.md)
- [Service Documentation](docs/SERVICES.md)
- [Migration from NPM](docs/TRAEFIK_MIGRATION_GUIDE.md)

### Quick Links
- [Traefik Dashboard](https://traefik.yourdomain.com)
- [Glance Dashboard](http://server-ip:8085)
- [Portainer](https://portainer.yourdomain.com) (if configured)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - See LICENSE file for details

## ⚠️ Important Notes

1. **Security First**: Configure Traefik routes before exposing to internet
2. **No Default Passwords**: All passwords must be set during setup
3. **Regular Backups**: Enable automated backups for critical data
4. **Monitor Logs**: Check logs regularly for issues
5. **Update Regularly**: Keep services and OS updated

---

**Need Help?** Check [troubleshooting](#-troubleshooting) or open an issue on GitHub.