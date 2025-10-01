# Homeserver Podman/Docker Stack

A comprehensive homelab setup featuring smart home, media management, ad-blocking, local AI, and secure networking services.

## 🚀 Services Included

### Core Services

- **Home Assistant** - Smart home automation hub
- **AdGuard Home** - Network-wide ad blocker and DNS server
- **Ollama + WebUI** - Local LLM server with web interface
- **Jellyfin** - Media streaming server
- **Tailscale** - Mesh VPN for secure remote access
- **Samba** - Network attached storage (NAS)

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

## 📋 Prerequisites

1. **Install Podman or Docker**:

   ```bash
   # Arch Linux with Podman
   sudo pacman -S podman podman-compose
   # Enable podman socket (for rootless containers)
   systemctl --user enable --now podman.socket

   # Arch Linux with Docker
   sudo pacman -S docker docker-compose
   sudo systemctl enable --now docker
   sudo usermod -aG docker $USER
   # Log out and back in for group changes to take effect

   # macOS with Podman
   brew install podman podman-compose
   podman machine init --cpus=4 --memory=8192 --disk-size=100
   podman machine start

   # macOS with Docker
   brew install docker docker-compose
   ```

2. **System Requirements**:
   - Minimum 8GB RAM (16GB+ recommended)
   - 100GB+ free disk space
   - x64 or ARM64 processor
   - For Arch Linux: kernel 4.18+ (for cgroup v2 support)

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
# Navigate to homeserver directory
cd homeserver/

# For Arch Linux: Run the automated installer (optional)
./install-arch.sh

# Copy environment template
cp env.example .env

# IMPORTANT: Edit .env and update:
# - All passwords
# - VPN credentials
# - Tailscale auth key
# - File paths
nano .env
```

### 2. Create Required Directories

```bash
# Create service config directories
mkdir -p homeassistant adguardhome/work adguardhome/conf
mkdir -p jellyfin/config jellyfin/cache tailscale/state
mkdir -p radarr sonarr lidarr bazarr prowlarr
mkdir -p qbittorrent nzbget jellyseerr gluetun

# Create media directories (adjust paths as needed)
sudo mkdir -p /data/media/{movies,tv,music}
sudo mkdir -p /data/downloads/{complete,incomplete}
sudo chown -R $USER:$USER /data

# Set proper permissions
chmod 755 /data/media
chmod 755 /data/downloads

# For Arch Linux: Enable user namespaces for rootless containers (if using Podman)
echo 'kernel.unprivileged_userns_clone=1' | sudo tee /etc/sysctl.d/99-rootless.conf
sudo sysctl --system
```

### 3. VPN Setup (Required for Torrenting)

Choose one option:

**Option A: Use existing VPN service**
Edit `.env` with your VPN provider details:

```bash
VPN_PROVIDER=mullvad  # or airvpn, nordvpn, etc.
VPN_TYPE=wireguard
# Add your VPN credentials
```

**Option B: Skip VPN** (Not recommended for torrenting)
Comment out the `gluetun` service and remove `network_mode: service:gluetun` from torrent services.

### 4. Start Services

```bash
# Start all services
podman-compose up -d

# Or start specific services first
podman-compose up -d adguardhome jellyfin
podman-compose up -d radarr sonarr prowlarr

# Check status
podman-compose ps

# View logs
podman-compose logs -f [service_name]
```

## 🌐 Accessing Services

After starting, services are available at:

| Service        | URL                                                  | Default Credentials |
| -------------- | ---------------------------------------------------- | ------------------- |
| Home Assistant | http://localhost:8123                                | Set on first login  |
| AdGuard Home   | http://localhost:3000 (setup)<br>http://localhost:80 | Set during setup    |
| Ollama WebUI   | http://localhost:8081                                | No auth by default  |
| Jellyfin       | http://localhost:8096                                | Set on first login  |
| Radarr         | http://localhost:7878                                | No auth by default  |
| Sonarr         | http://localhost:8989                                | No auth by default  |
| Lidarr         | http://localhost:8686                                | No auth by default  |
| Bazarr         | http://localhost:6767                                | No auth by default  |
| Prowlarr       | http://localhost:9696                                | No auth by default  |
| qBittorrent    | http://localhost:8080                                | admin/adminadmin    |
| NZBGet         | http://localhost:6789                                | nzbget/tegbzn6789   |
| Jellyseerr     | http://localhost:5055                                | Set on first login  |
| Samba/NAS      | smb://localhost                                      | Set in .env         |

## 🔧 Initial Configuration

### Home Assistant

1. Access http://localhost:8123
2. Create admin account
3. Configure your location and units
4. Start adding integrations and devices

### AdGuard Home

1. Access http://localhost:3000 for initial setup
2. Set admin credentials
3. Configure upstream DNS servers (recommend Cloudflare: 1.1.1.1)
4. Update your router's DNS to point to your server's IP

### Jellyfin

1. Access http://localhost:8096
2. Follow setup wizard
3. Add media libraries pointing to `/media`
4. Configure users and access

### Media Stack Setup

1. **Prowlarr**: Add indexers (torrent/usenet sites)
2. **Radarr/Sonarr**:
   - Add Prowlarr as indexer
   - Configure download client (qBittorrent/NZBGet)
   - Set media paths
3. **Jellyseerr**: Connect to Jellyfin and Radarr/Sonarr
4. **qBittorrent**: Set download paths in settings

### Tailscale

1. Get auth key from https://login.tailscale.com/admin/settings/keys
2. Add to `.env` file
3. Restart container: `podman-compose restart tailscale`
4. Access your services remotely via Tailscale IPs

### Ollama

```bash
# Pull models
podman exec -it ollama ollama pull llama3
podman exec -it ollama ollama pull codellama

# Test via CLI
podman exec -it ollama ollama run llama3
```

## 📁 Directory Structure

```
homeserver/
├── podman-compose.yml      # Main compose file
├── .env                    # Environment variables (create from env.example)
├── env.example            # Template for environment variables
├── homeassistant/         # Home Assistant config
├── adguardhome/          # AdGuard config and data
├── jellyfin/             # Jellyfin config and cache
├── radarr/               # Radarr config
├── sonarr/               # Sonarr config
├── prowlarr/             # Prowlarr config
├── qbittorrent/          # qBittorrent config
└── ...                   # Other service configs

/data/                    # Media and downloads (configurable)
├── media/
│   ├── movies/
│   ├── tv/
│   └── music/
└── downloads/
    ├── complete/
    └── incomplete/
```

## 🔒 Security Recommendations

1. **Change ALL default passwords** in `.env` file
2. **Enable authentication** on all \*arr services:
   - Settings → General → Authentication
3. **Use HTTPS** with reverse proxy (Traefik/Caddy)
4. **Firewall rules**: Only expose necessary ports

   ```bash
   # Arch Linux with ufw (if installed)
   sudo ufw allow 8096/tcp  # Jellyfin
   sudo ufw allow 8123/tcp  # Home Assistant
   sudo ufw allow 53/udp    # AdGuard DNS
   sudo ufw reload

   # Or with firewalld (if installed)
   sudo firewall-cmd --zone=public --add-port=8096/tcp --permanent
   sudo firewall-cmd --zone=public --add-port=8123/tcp --permanent
   sudo firewall-cmd --zone=public --add-port=53/udp --permanent
   sudo firewall-cmd --reload
   ```

5. **Regular updates**: `podman-compose pull && podman-compose up -d`
6. **Backup configurations** regularly

## 🔄 Common Operations

### Arch Linux: Run as Systemd Service (Optional)

```bash
# Copy the systemd service file
cp homeserver.service ~/.config/systemd/user/

# Edit the service file to match your paths
nano ~/.config/systemd/user/homeserver.service

# Reload systemd and enable the service
systemctl --user daemon-reload
systemctl --user enable homeserver.service
systemctl --user start homeserver.service

# Check status
systemctl --user status homeserver.service

# View logs
journalctl --user -u homeserver.service -f
```

### Update All Services

```bash
podman-compose pull
podman-compose up -d
```

### Backup Configuration

```bash
tar -czf homeserver-backup-$(date +%Y%m%d).tar.gz \
  --exclude='*/cache' --exclude='*/logs' \
  homeassistant/ adguardhome/ jellyfin/ radarr/ sonarr/
```

### View Logs

```bash
# All services
podman-compose logs -f

# Specific service
podman-compose logs -f jellyfin

# Last 100 lines
podman-compose logs --tail=100 radarr
```

### Restart Services

```bash
# All services
podman-compose restart

# Specific service
podman-compose restart jellyfin
```

## 🐛 Troubleshooting

### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER ./
sudo chown -R 1000:1000 /data

# Fix permissions
chmod -R 755 /data/media

# Arch Linux: Fix podman rootless permissions
podman unshare chown -R 1000:1000 /data
```

### VPN Not Connecting

1. Check Gluetun logs: `podman-compose logs gluetun`
2. Verify VPN credentials in `.env`
3. Try different VPN server/endpoint
4. Check firewall rules

### Services Can't Communicate

1. Verify network configuration
2. Check if services are on same network
3. Use container names for internal communication
4. Check firewall/iptables rules

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :PORT_NUMBER  # If lsof is installed
sudo ss -tulpn | grep :PORT_NUMBER  # Alternative for Arch

# Change port in podman-compose.yml
# Example: "8097:8096" to use port 8097 externally
```

### Podman-Specific Issues

#### Arch Linux

```bash
# Enable lingering for user services
sudo loginctl enable-linger $USER

# Check podman socket status
systemctl --user status podman.socket

# Restart podman socket
systemctl --user restart podman.socket

# View podman info
podman info

# If SELinux is enabled, add :z flag to volumes
# Example: - ./data:/data:z

# For rootless containers, check subuid/subgid
grep $USER /etc/subuid /etc/subgid
```

#### macOS

```bash
# Restart podman machine
podman machine stop
podman machine start

# Increase resources
podman machine set --cpus=4 --memory=8192

# Reset podman machine (warning: destroys containers)
podman machine rm
podman machine init --cpus=4 --memory=8192
podman machine start
```

## 📚 Additional Resources

- [Home Assistant Docs](https://www.home-assistant.io/docs/)
- [Jellyfin Docs](https://jellyfin.org/docs/)
- [Servarr Wiki](https://wiki.servarr.com/)
- [Gluetun Wiki](https://github.com/qdm12/gluetun/wiki)
- [AdGuard Home Wiki](https://github.com/AdguardTeam/AdGuardHome/wiki)
- [Ollama Documentation](https://github.com/ollama/ollama/blob/main/docs/README.md)
- [Arch Wiki - Podman](https://wiki.archlinux.org/title/Podman)
- [Arch Wiki - Docker](https://wiki.archlinux.org/title/Docker)

## 🤝 Support

For issues specific to:

- This setup: Check the configuration files and logs
- Individual services: Consult their official documentation
- Podman/Docker: Check their respective documentation

## 📝 Notes

- Media files should be organized: `/media/movies/MovieName (Year)/` and `/media/tv/ShowName/`
- The VPN container (Gluetun) protects torrent/usenet traffic only
- Tailscale provides secure remote access to all services
- Regular backups of configuration directories are recommended
- Monitor disk space, especially `/data/downloads`
