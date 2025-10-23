# homelab Docker Stack

A comprehensive homelab setup featuring smart home, media management, ad-blocking, local AI, and secure networking services - optimized for Arch Linux with Docker.

**⚠️ Deployment Target: Arch Linux Server with Docker**
This stack uses Docker and is designed for Arch Linux servers. Deploy to your Arch Linux machine using SSH or direct access.

## 🚀 Quick Start

```bash
# One command setup
./homelab.sh
```

Choose option `1) Setup Wizard` and follow the prompts!

**Or use command line mode:**

```bash
./homelab.sh setup    # First time setup
./homelab.sh restart  # Clean restart (fixes port conflicts)
./homelab.sh status   # Show service status
./homelab.sh logs     # View logs
```

## 📋 Services Included

### Core Infrastructure (Homelab Network - 172.20.0.0/16)

- **Home Assistant** (Host Network) - Smart home automation hub with device discovery
- **AdGuard Home** (Host Network) - Network-wide DNS ad blocker with per-device filtering and DNS-over-TLS/QUIC
- **Nginx Proxy Manager** (172.20.0.81, 172.21.0.81) - Reverse proxy with free Let's Encrypt SSL
- **Ollama** (172.20.0.11) - Local LLM inference server (GPU support available)
- **Ollama WebUI** (172.20.0.12) - Web interface for Ollama AI models
- **Jellyfin** (172.20.0.96, 172.21.0.96) - Media streaming server with hardware transcoding
- **Tailscale** (Host Network) - Mesh VPN for secure remote access and subnet routing
- **Samba** (172.20.0.45) - Network attached storage with SMB/CIFS shares
- **Vaultwarden** (172.20.0.22) - Self-hosted Bitwarden password manager

### Media Automation Stack (Media Network - 172.21.0.0/16)

- **Gluetun** (172.21.0.2) - VPN client using Mullvad WireGuard with kill switch
- **qBittorrent** (via Gluetun) - Torrent client, 100% VPN-protected traffic
- **Prowlarr** (via Gluetun) - Indexer manager for torrent/usenet, VPN-protected
- **NZBGet** (via Gluetun) - Usenet client with SSL/TLS, VPN-protected
- **Radarr** (172.21.0.78) - Automated movie collection manager
- **Sonarr** (172.21.0.89) - Automated TV show collection manager
- **Lidarr** (172.21.0.86) - Automated music collection manager
- **Bazarr** (172.21.0.67) - Subtitle download automation for Radarr/Sonarr
- **Jellyseerr** (172.20.0.55, 172.21.0.55) - Media request management with Jellyfin integration
- **Byparr** (via Gluetun) - Cloudflare bypass for Prowlarr indexers (FlareSolverr replacement)

## 🎯 Common Tasks

| Task                   | Command                             |
| ---------------------- | ----------------------------------- |
| **First time setup**   | `./homelab.sh setup`                |
| **Fix port conflicts** | `./homelab.sh restart`              |
| **Start services**     | `./homelab.sh start`                |
| **Stop services**      | `./homelab.sh stop`                 |
| **View status**        | `./homelab.sh status`               |
| **View logs**          | `./homelab.sh logs`                 |
| **Troubleshoot**       | `./homelab.sh` then choose option 7 |

## 📦 Installation (Arch Linux)

The wizard can install everything for you:

```bash
./homelab.sh install
```

**Or manual installation:**

```bash
# Install Docker
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Log out and back in for group changes
# Then run setup
./homelab.sh setup
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

### Core Services (Homelab Network)

| Service                 | URL                   | Internal IP  | Default Credentials          | Notes                    |
| ----------------------- | --------------------- | ------------ | ---------------------------- | ------------------------ |
| **Home Assistant**      | http://10.0.0.51:8123 | Host Network | Setup on first visit         | Smart home hub           |
| **AdGuard Setup**       | http://10.0.0.51:3000 | Host Network | Setup wizard                 | First-time setup only    |
| **AdGuard Home**        | http://10.0.0.51:80   | Host Network | Set during setup             | DNS admin (uses port 80) |
| **Nginx Proxy Manager** | http://10.0.0.51:81   | 172.20.0.81  | admin@example.com / changeme | **Change password!**     |
| **Jellyfin**            | http://10.0.0.51:8096 | 172.20.0.96  | Setup on first visit         | Media streaming          |
| **Ollama WebUI**        | http://10.0.0.51:8081 | 172.20.0.12  | No auth by default           | Local AI chat            |
| **Vaultwarden**         | http://10.0.0.51:8222 | 172.20.0.22  | Create account               | Password manager         |
| **Samba**               | smb://10.0.0.51:445   | 172.20.0.45  | Set in .env                  | Network file shares      |

### Media Services (Media Network)

| Service         | URL                   | Internal IP              | Notes                                    |
| --------------- | --------------------- | ------------------------ | ---------------------------------------- |
| **qBittorrent** | http://10.0.0.51:8080 | 172.21.0.2 (via Gluetun) | VPN-protected, default: admin/adminadmin |
| **Prowlarr**    | http://10.0.0.51:9696 | 172.21.0.2 (via Gluetun) | VPN-protected indexer manager            |
| **NZBGet**      | http://10.0.0.51:6789 | 172.21.0.2 (via Gluetun) | VPN-protected usenet client              |
| **Radarr**      | http://10.0.0.51:7878 | 172.21.0.78              | Movie automation                         |
| **Sonarr**      | http://10.0.0.51:8989 | 172.21.0.89              | TV show automation                       |
| **Lidarr**      | http://10.0.0.51:8686 | 172.21.0.86              | Music automation                         |
| **Bazarr**      | http://10.0.0.51:6767 | 172.21.0.67              | Subtitle automation                      |
| **Jellyseerr**  | http://10.0.0.51:5055 | 172.20.0.55              | Media request portal                     |
| **Byparr**      | http://10.0.0.51:8191 | 172.21.0.2 (via Gluetun) | Cloudflare bypass (internal use)         |

## 🔧 Reverse Proxy Setup with Nginx Proxy Manager

Nginx Proxy Manager (172.20.0.81, 172.21.0.81) provides easy SSL/TLS certificates and subdomain routing with access to **both networks**:

### Initial Setup

1. Access http://localhost:81
2. Login with `admin@example.com` / `changeme`
3. **Change password immediately!**
4. Update admin email address

### Adding Proxy Hosts

**For Homelab Network Services** (use 172.20.x.x IPs):

```
Domain: jellyfin.yourdomain.com
Forward Hostname/IP: 172.20.0.96
Forward Port: 8096
```

**For Media Network Services** (use 172.21.x.x IPs):

```
Domain: radarr.yourdomain.com
Forward Hostname/IP: 172.21.0.78
Forward Port: 7878
```

### SSL Certificates

1. In "SSL" tab, select "Request a new SSL Certificate"
2. Enable "Force SSL" and "HTTP/2 Support"
3. Agree to Let's Encrypt TOS
4. Click Save - certificate auto-renews every 90 days

### Network Access

- NPM has IPs on **both networks** (172.20.0.81 + 172.21.0.81)
- Can proxy to services on either network
- Handles all external HTTPS traffic on ports 80/443

## 🐛 Troubleshooting

### Port Conflicts

```bash
./homelab.sh restart  # Automatic fix
```

### DBUS Session Warning

```bash
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
# Or just ignore - Podman works fine without it
```

### Permissions Issues

```bash
./homelab.sh  # Choose option 7, then option 5
```

### View Detailed Logs

```bash
./homelab.sh logs SERVICE_NAME
# Example: ./homelab.sh logs adguardhome
```

## 🌐 Network Architecture

### Network Topology

This stack uses **two isolated Docker bridge networks** for security and organization:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                    │
└────────────────┬────────────────────────────────────────────────────┘
                 │
                 │ WireGuard VPN (Mullvad)
                 │ Endpoint: 146.70.211.130:51820
                 │
        ┌────────▼─────────┐
        │  Gluetun VPN     │ VPN Gateway for Media Services
        │  172.21.0.2      │ Routes: qBittorrent, Prowlarr, NZBGet
        └──────────────────┘
                 │
                 │
┌────────────────┴──────────────────────────────────────────────────┐
│                     Docker Host Network                           │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Homelab Network (172.20.0.0/16)                            │ │
│  │  ─────────────────────────────────────────                  │ │
│  │  • AdGuard Home (Host Mode) - DNS & Ad Blocking             │ │
│  │  • Ollama (172.20.0.11) - Local AI                          │ │
│  │  • Ollama WebUI (172.20.0.12) - AI Interface                │ │
│  │  • Nginx Proxy Manager (172.20.0.81) - Reverse Proxy        │ │
│  │  • Jellyfin (172.20.0.96) - Media Server                    │ │
│  │  • Samba (172.20.0.45) - Network Storage                    │ │
│  │  • Jellyseerr (172.20.0.55) - Media Requests                │ │
│  │  • Vaultwarden (172.20.0.22) - Password Manager             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Media Network (172.21.0.0/16)                              │ │
│  │  ────────────────────────────────────────                   │ │
│  │  • Gluetun (172.21.0.2) - VPN Client                        │ │
│  │  • Radarr (172.21.0.78) - Movie Manager                     │ │
│  │  • Sonarr (172.21.0.89) - TV Manager                        │ │
│  │  • Lidarr (172.21.0.86) - Music Manager                     │ │
│  │  • Bazarr (172.21.0.67) - Subtitle Manager                  │ │
│  │  • Jellyseerr (172.21.0.55) - Media Requests                │ │
│  │  • Byparr (via 172.21.0.2:8191) - Cloudflare Bypass         │ │
│  │  • Nginx Proxy Manager (172.21.0.81) - Reverse Proxy        │ │
│  │  • Jellyfin (172.21.0.96) - Media Server                    │ │
│  │                                                              │ │
│  │  VPN-Protected (network_mode: service:gluetun):             │ │
│  │    → qBittorrent (via 172.21.0.2:8080)                      │ │
│  │    → Prowlarr (via 172.21.0.2:9696)                         │ │
│  │    → NZBGet (via 172.21.0.2:6789)                           │ │
│  │    → Byparr (via 172.21.0.2:8191)                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Host Network (Direct Host Access)                          │ │
│  │  ────────────────────────────────────────────               │ │
│  │  • Home Assistant - Smart Home (requires host network)      │ │
│  │  • AdGuard Home - DNS (sees real client IPs)                │ │
│  │  • Tailscale - Mesh VPN (requires host network)             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### Network Security Design

**Homelab Network (172.20.0.0/16):**

- Core infrastructure services
- Admin interfaces and web UIs
- No direct internet exposure (behind reverse proxy)

**Media Network (172.21.0.0/16):**

- Media acquisition and management services
- Isolated from homelab network for security
- VPN-protected torrent/usenet traffic via Gluetun

**VPN Protection:**

- qBittorrent, Prowlarr, and NZBGet share Gluetun's network namespace
- All their traffic routes through Mullvad WireGuard VPN
- Kill switch enabled: containers stop if VPN connection fails
- Firewall rules allow only VPN tunnel traffic

**Cross-Network Communication:**

- Nginx Proxy Manager bridges both networks (172.20.0.81 + 172.21.0.81)
- Jellyfin bridges both networks (172.20.0.96 + 172.21.0.96)
- Jellyseerr bridges both networks (172.20.0.55 + 172.21.0.55)
- Gluetun allows outbound to both networks via `FIREWALL_OUTBOUND_SUBNETS`

**Host Network Services:**

- Home Assistant uses host network for mDNS device discovery
- AdGuard Home uses host network to see real client IPs (not bridge IP 172.20.0.1)
- Tailscale uses host network for VPN mesh functionality

### Port Mapping Reference

| Service      | Internal IP | External Port           | Purpose                        |
| ------------ | ----------- | ----------------------- | ------------------------------ |
| AdGuard Home | Host        | 53, 80, 3000            | DNS, Web UI, Setup             |
| Nginx Proxy  | 172.20.0.81 | 80, 81, 443             | HTTP, Admin, HTTPS             |
| Jellyfin     | 172.20.0.96 | 8096                    | Media streaming                |
| Gluetun VPN  | 172.21.0.2  | 51820, 8080, 9696, 6789 | WireGuard, qBit, Prowlarr, NZB |
| Radarr       | 172.21.0.78 | 7878                    | Movie management               |
| Sonarr       | 172.21.0.89 | 8989                    | TV management                  |
| Vaultwarden  | 172.20.0.22 | 8222, 3012              | Password vault, WebSocket      |

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
./homelab.sh
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

### Essential Security Checklist

1. **Change ALL Default Passwords**

   - `.env` file: Update all `CHANGE_THIS_PASSWORD` entries
   - Nginx Proxy Manager: Change from `changeme` on first login
   - qBittorrent: Change from default `admin/adminadmin`
   - Vaultwarden: Set strong admin token in `.env`

2. **VPN Protection (Mullvad WireGuard)**

   - **Gluetun container** routes all torrent/indexer traffic through VPN
   - **Kill switch enabled**: If VPN drops, containers stop (no IP leaks)
   - **Services protected**: qBittorrent, Prowlarr, NZBGet, Byparr
   - **DNS leak protection**: Uses Mullvad DNS servers
   - Verify VPN: `docker logs gluetun | grep "ip address"`

3. **Network Isolation**

   - **Homelab network** (172.20.0.0/16): Core services, no P2P traffic
   - **Media network** (172.21.0.0/16): Isolated media services + VPN
   - **Firewall rules**: Gluetun only allows VPN tunnel + local subnets
   - No direct internet access for VPN-protected containers

4. **Enable Service Authentication**

   - **\*arr services**: Enable authentication in settings (Radarr, Sonarr, etc.)
   - **Jellyfin**: Create user accounts, disable guest access
   - **Vaultwarden**: Disable signups after creating accounts
   - **Jellyseerr**: Require Jellyfin login for requests

5. **HTTPS with Reverse Proxy**

   - Use Nginx Proxy Manager for free Let's Encrypt SSL certificates
   - Enable "Force SSL" on all proxy hosts
   - Certificates auto-renew every 90 days
   - Access services via HTTPS subdomains externally

6. **Firewall Configuration**

   ```bash
   # Allow only necessary ports
   sudo ufw allow 80/tcp    # HTTP (redirects to HTTPS)
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw allow 51820/udp # WireGuard (if exposing Tailscale exit node)
   sudo ufw enable
   ```

7. **Regular Maintenance**
   - **Update images**: `./homelab.sh` → option 9
   - **Check logs**: `./homelab.sh logs gluetun` (verify VPN connection)
   - **Monitor VPN**: Ensure no IP leaks with `curl ifconfig.me` from qBittorrent container
   - **Backup configs**: Regular backups of service config directories

### VPN Configuration Security

**Mullvad WireGuard Setup** (in `.env`):

```bash
# Custom WireGuard config from Mullvad
VPN_SERVICE_PROVIDER=custom
WIREGUARD_PRIVATE_KEY=<your_mullvad_key>
WIREGUARD_ADDRESS=<your_assigned_ip>/32
WIREGUARD_PUBLIC_KEY=<mullvad_server_key>
VPN_ENDPOINT_IP=<mullvad_server_ip>
VPN_ENDPOINT_PORT=51820
```

**Verify VPN is working:**

```bash
# Should show Mullvad server IP, NOT your home IP
docker exec qbittorrent curl ifconfig.me
```

### Vaultwarden Security

1. **Generate secure admin token**:

   ```bash
   openssl rand -base64 48
   # Add to .env as VAULTWARDEN_ADMIN_TOKEN
   ```

2. **Disable signups after setup**:

   ```bash
   VAULTWARDEN_SIGNUPS_ALLOWED=false
   ```

3. **Enable SMTP for email verification** (optional but recommended)

4. **Access admin panel**: http://localhost:8222/admin (use admin token)

## 🔄 Updates

```bash
./homelab.sh  # Choose option 9
# Or: podman-compose pull && podman-compose up -d
```

## 📁 Directory Structure

```
homelab/
├── homelab.sh                  # Main management wizard
├── docker-compose.yml             # Service definitions (networks + all containers)
├── .env                           # Your configuration (create from env.example)
├── env.example                    # Configuration template
│
├── Core Infrastructure Configs (Homelab Network):
├── homeassistant/                 # Home Assistant config & automations
├── adguardhome/                   # AdGuard Home DNS config & filters
│   ├── conf/                      # AdGuard configuration
│   └── work/                      # AdGuard data
├── nginx-proxy-manager/           # Reverse proxy config
│   ├── data/                      # NPM database & config
│   └── letsencrypt/               # SSL certificates (shared with Home Assistant)
├── jellyfin/                      # Jellyfin media server
│   ├── config/                    # Server configuration
│   └── cache/                     # Transcoding cache
├── ollama_data/                   # Ollama AI models (Docker volume)
├── ollama_webui_data/             # WebUI data (Docker volume)
├── tailscale/                     # Tailscale mesh VPN state
├── samba/                         # Samba network shares config
├── vaultwarden/                   # Vaultwarden password vault data
│
├── Media Automation Configs (Media Network):
├── gluetun/                       # VPN client config & logs
├── qbittorrent/                   # Torrent client config (VPN-protected)
├── prowlarr/                      # Indexer manager config (VPN-protected)
├── nzbget/                        # Usenet client config (VPN-protected)
├── radarr/                        # Movie automation config
├── sonarr/                        # TV show automation config
├── lidarr/                        # Music automation config
├── bazarr/                        # Subtitle automation config
├── jellyseerr/                    # Media request system config
└── byparr/                        # Cloudflare bypass config (FlareSolverr replacement)

External Media Storage (configurable via .env):
/data/                             # Default media root (customize with env vars)
├── media/                         # Organized media library
│   ├── movies/                    # Radarr → Jellyfin
│   ├── tv/                        # Sonarr → Jellyfin
│   └── music/                     # Lidarr → Jellyfin
└── downloads/                     # Download clients write here
    ├── complete/                  # Finished downloads
    └── incomplete/                # In-progress downloads

Environment Variables for Paths:
- MEDIA_PATH=/data/media           # Primary media location
- MEDIA_PATH2=/data/media2         # Optional second media location
- DOWNLOADS_PATH=/data/downloads   # Download location
- NAS_PATH=/data                   # Samba share root
```

### Important Notes

- **Config persistence**: All service configs stored in named directories
- **Docker volumes**: Ollama data uses named volumes for better performance
- **VPN isolation**: Gluetun, qBittorrent, Prowlarr, NZBGet, Byparr in Media network
- **SSL sharing**: NPM's letsencrypt/ mounted read-only in Home Assistant
- **Media organization**: \*arr services automatically organize downloads → media/

## 💡 Tips

- **First time?** Use the Setup Wizard (`./homelab.sh setup`)
- **Port conflicts?** Use Clean Restart (`./homelab.sh restart`)
- **Need help?** Check the interactive Troubleshooting menu
- **Want automation?** Set up as systemd service (see ARCH_LINUX_SETUP.md)

## 🤝 Support

For issues:

1. Check **TROUBLESHOOTING.md**
2. Run: `./homelab.sh` → option 7 (Troubleshooting)
3. View logs: `./homelab.sh logs SERVICE_NAME`

## 📝 License

See individual service licenses.
