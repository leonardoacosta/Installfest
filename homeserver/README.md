# Homeserver Docker Stack

A comprehensive homelab setup featuring smart home, media management, ad-blocking, local AI, and secure networking services - optimized for Arch Linux with Docker.

**⚠️ Deployment Target: Arch Linux Server with Docker**
This stack uses Docker and is designed for Arch Linux servers. Deploy to your Arch Linux machine using SSH or direct access.

## 🚀 Quick Start

```bash
# One command setup
./homeserver.sh
```

Choose option `1) Setup Wizard` and follow the prompts!

**Or use command line mode:**
```bash
./homeserver.sh setup    # First time setup
./homeserver.sh restart  # Clean restart (fixes port conflicts)
./homeserver.sh status   # Show service status
./homeserver.sh logs     # View logs
```

## 📋 Services Included

### Core Services
- **Home Assistant** - Smart home automation hub (http://localhost:8123)
- **AdGuard Home** - Network-wide ad blocker (http://localhost:80)
- **Nginx Proxy Manager** - Reverse proxy with SSL (http://localhost:81)
- **Ollama + WebUI** - Local LLM server (http://localhost:8081)
- **Jellyfin** - Media streaming server (http://localhost:8096)
- **Tailscale** - Mesh VPN for secure remote access
- **Samba** - Network attached storage (smb://localhost:445)

### Media Stack (\*arr Services)
- **Radarr** - Movie collection manager
- **Sonarr** - TV show collection manager
- **Lidarr** - Music collection manager
- **Bazarr** - Subtitle manager
- **Prowlarr** - Indexer manager
- **Jellyseerr** - Media request management
- **qBittorrent** - Torrent client (VPN-protected)
- **NZBGet** - Usenet client (VPN-protected)
- **Gluetun** - VPN client container
- **Flaresolverr** - Cloudflare bypass for indexers

## 🎯 Common Tasks

| Task | Command |
|------|---------|
| **First time setup** | `./homeserver.sh setup` |
| **Fix port conflicts** | `./homeserver.sh restart` |
| **Start services** | `./homeserver.sh start` |
| **Stop services** | `./homeserver.sh stop` |
| **View status** | `./homeserver.sh status` |
| **View logs** | `./homeserver.sh logs` |
| **Troubleshoot** | `./homeserver.sh` then choose option 7 |

## 📦 Installation (Arch Linux)

The wizard can install everything for you:

```bash
./homeserver.sh install
```

**Or manual installation:**
```bash
# Install Docker
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Log out and back in for group changes
# Then run setup
./homeserver.sh setup
```

## ⚙️ Configuration

The wizard creates `.env` for you, but you can also copy from template:

```bash
cp env.example .env
nano .env
```

**Important:** Change all passwords! Look for:
- `CHANGE_THIS_PASSWORD`
- `changeme`
- `password123`

## 🌐 Service URLs

| Service | URL | Notes |
|---------|-----|-------|
| Home Assistant | http://localhost:8123 | Smart home hub |
| AdGuard Setup | http://localhost:3000 | First-time setup |
| AdGuard Web | http://localhost:80 | DNS admin interface |
| Nginx Proxy Manager | http://localhost:81 | Reverse proxy admin (admin@example.com / changeme) |
| Jellyfin | http://localhost:8096 | Media server |
| Ollama WebUI | http://localhost:8081 | LLM interface |
| Samba | smb://localhost:445 | Network storage |
| qBittorrent | http://localhost:8080 | Via VPN |
| Prowlarr | http://localhost:9696 | Via VPN |
| Radarr | http://localhost:7878 | Movie manager |
| Sonarr | http://localhost:8989 | TV manager |
| Lidarr | http://localhost:8686 | Music manager |
| Bazarr | http://localhost:6767 | Subtitle manager |
| Jellyseerr | http://localhost:5055 | Media requests |

## 🔧 Reverse Proxy Setup

Nginx Proxy Manager provides easy SSL/TLS certificates and subdomain routing:

1. Access http://localhost:81
2. Login with `admin@example.com` / `changeme`
3. Change password immediately
4. Add proxy hosts for your services
5. Request free SSL certificates (Let's Encrypt)

## 🐛 Troubleshooting

### Port Conflicts
```bash
./homeserver.sh restart  # Automatic fix
```

### DBUS Session Warning
```bash
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
# Or just ignore - Podman works fine without it
```

### Permissions Issues
```bash
./homeserver.sh  # Choose option 7, then option 5
```

### View Detailed Logs
```bash
./homeserver.sh logs SERVICE_NAME
# Example: ./homeserver.sh logs adguardhome
```

## 📚 Documentation

- **ARCH_LINUX_SETUP.md** - Complete Arch Linux guide
- **QUICK_START.md** - Fast reference commands
- **PORT_CONFLICTS.md** - Fixing "address already in use"
- **DBUS_FIX.md** - Session bus warnings
- **TROUBLESHOOTING.md** - Common issues
- **START_HERE.md** - Simple getting started

## 🎛️ Interactive Menu

Run without arguments for interactive mode:

```bash
./homeserver.sh
```

Menu options:
1. Setup Wizard - First time setup
2. Clean Restart - Fix port conflicts
3. Start All Services
4. Stop All Services
5. Show Status
6. View Logs
7. Troubleshooting
8. Cleanup
9. Update Images
10. Install (Arch Linux)

## 🔒 Security

1. **Change ALL default passwords** in `.env`
2. **Enable authentication** on \*arr services
3. **Use HTTPS** with reverse proxy (optional)
4. **Configure firewall** for exposed services
5. **Regular updates**: `./homeserver.sh` → option 9

## 🔄 Updates

```bash
./homeserver.sh  # Choose option 9
# Or: podman-compose pull && podman-compose up -d
```

## 📁 Directory Structure

```
homeserver/
├── homeserver.sh          # Main management wizard
├── docker-compose.yml     # Service definitions
├── .env                   # Configuration (create from env.example)
├── env.example           # Configuration template
├── homeassistant/        # Home Assistant config
├── adguardhome/          # AdGuard config
├── nginx-proxy-manager/  # Nginx Proxy Manager config
├── jellyfin/             # Jellyfin config
├── tailscale/            # Tailscale VPN state
└── ...                   # Other service configs

/data/                    # Media and downloads
├── media/{movies,tv,music}
└── downloads/{complete,incomplete}
```

## 💡 Tips

- **First time?** Use the Setup Wizard (`./homeserver.sh setup`)
- **Port conflicts?** Use Clean Restart (`./homeserver.sh restart`)
- **Need help?** Check the interactive Troubleshooting menu
- **Want automation?** Set up as systemd service (see ARCH_LINUX_SETUP.md)

## 🤝 Support

For issues:
1. Check **TROUBLESHOOTING.md**
2. Run: `./homeserver.sh` → option 7 (Troubleshooting)
3. View logs: `./homeserver.sh logs SERVICE_NAME`

## 📝 License

See individual service licenses.
