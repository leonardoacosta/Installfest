# Homelab Service Inventory

## Complete Service List by Category

### 🏗️ Infrastructure Services (`compose/infrastructure.yml`)
Total: 4 services

| Service | Container | IP Address | Ports | Description |
|---------|-----------|------------|-------|-------------|
| **Traefik** | traefik | 172.20.0.81 (homelab)<br>172.21.0.81 (media) | 80, 443, 8080 | Reverse proxy & SSL termination |
| **AdGuard Home** | adguardhome | 172.20.0.53 | 82, 8443, 3000, 853, 5443, etc | DNS filtering & ad blocking |
| **Home Assistant** | homeassistant | 172.20.0.123 | 8123 | Smart home automation |
| **Vaultwarden** | vaultwarden | 172.20.0.22 | 8222, 3012 | Password manager |

### 📺 Media Stack (`compose/media.yml`)
Total: 10 services

| Service | Container | IP Address | Ports | Description |
|---------|-----------|------------|-------|-------------|
| **Jellyfin** | jellyfin | 172.20.0.96 (homelab)<br>172.21.0.96 (media) | 8096, 8920, 7359, 1900 | Media streaming server |
| **Radarr** | radarr | 172.21.0.78 | 7878 | Movie management |
| **Sonarr** | sonarr | 172.21.0.89 | 8989 | TV show management |
| **Lidarr** | lidarr | 172.21.0.86 | 8686 | Music management |
| **Bazarr** | bazarr | 172.21.0.67 | 6767 | Subtitle management |
| **Jellyseerr** | jellyseerr | 172.20.0.55 (homelab)<br>172.21.0.55 (media) | 5055 | Media request management |
| **Prowlarr** | prowlarr | via Gluetun | 9696 (via Gluetun) | Indexer management (VPN) |
| **qBittorrent** | qbittorrent | via Gluetun | 8090 (via Gluetun) | Torrent client (VPN) |
| **NZBGet** | nzbget | via Gluetun | 6789 (via Gluetun) | Usenet client (VPN) |

### 🔒 VPN Services (`compose/vpn.yml`)
Total: 2 services

| Service | Container | IP Address | Ports | Description |
|---------|-----------|------------|-------|-------------|
| **Tailscale** | tailscale | host network | N/A | Mesh VPN |
| **Gluetun** | gluetun | 172.21.0.2 | 8888, 8388, 9696, 8090, 6789 | VPN client for media services |

### 📊 Monitoring (`compose/monitoring.yml`)
Total: 1 service

| Service | Container | IP Address | Ports | Description |
|---------|-----------|------------|-------|-------------|
| **Glance** | glance | 172.20.0.85 (homelab)<br>172.21.0.85 (media) | 8085 | Homelab dashboard |

### 🤖 AI Services (`compose/ai.yml`)
Total: 2 services

| Service | Container | IP Address | Ports | Description |
|---------|-----------|------------|-------|-------------|
| **Ollama** | ollama | 172.20.0.11 | 11434 | Local LLM server |
| **Open WebUI** | ollama-webui | 172.20.0.12 | 8081 | Web interface for Ollama |

### 💾 Storage Services (`compose/storage.yml`)
Total: 1 service

| Service | Container | IP Address | Ports | Description |
|---------|-----------|------------|-------|-------------|
| **Samba** | samba | 172.20.0.45 | 445, 139 | Network file sharing |

---

## Service Summary

**Total Services: 20**

### By Network
- **Homelab network only:** 8 services
- **Media network only:** 5 services
- **Both networks:** 4 services (Traefik, Jellyfin, Glance, Jellyseerr)
- **Host network:** 1 service (Tailscale)
- **Via Gluetun:** 3 services (Prowlarr, qBittorrent, NZBGet)

### By Restart Policy
- **All services:** `unless-stopped`

### Services with Healthchecks: 19/20
- Only Tailscale lacks a healthcheck (uses host network)

### Services with Traefik Integration: 16/20
- Disabled for: Tailscale (host network), Samba (SMB protocol), Prowlarr/qBittorrent/NZBGet (behind VPN)

---

## Port Allocation Map

### External Ports (Host → Container)

| Port | Service | Purpose |
|------|---------|---------|
| 80 | Traefik | HTTP |
| 82 | AdGuard Home | Web UI (alt port) |
| 139 | Samba | NetBIOS |
| 443 | Traefik | HTTPS |
| 445 | Samba | SMB |
| 853 | AdGuard Home | DNS-over-TLS |
| 1900/udp | Jellyfin | DLNA |
| 3000 | AdGuard Home | Initial setup |
| 3012 | Vaultwarden | WebSocket |
| 5055 | Jellyseerr | Web UI |
| 5443 | AdGuard Home | DNSCrypt |
| 6767 | Bazarr | Web UI |
| 6789 | NZBGet | Web UI (via Gluetun) |
| 7359/udp | Jellyfin | Client discovery |
| 7878 | Radarr | Web UI |
| 8080 | Traefik | Dashboard |
| 8081 | Ollama WebUI | Web UI |
| 8085 | Glance | Web UI |
| 8090 | qBittorrent | Web UI (via Gluetun) |
| 8096 | Jellyfin | Web UI |
| 8123 | Home Assistant | Web UI |
| 8222 | Vaultwarden | Web UI |
| 8388 | Gluetun | Shadowsocks |
| 8443 | AdGuard Home | HTTPS UI |
| 8686 | Lidarr | Web UI |
| 8853/udp | AdGuard Home | DNS-over-QUIC |
| 8888 | Gluetun | HTTP proxy |
| 8920 | Jellyfin | HTTPS UI |
| 8989 | Sonarr | Web UI |
| 9696 | Prowlarr | Web UI (via Gluetun) |
| 11434 | Ollama | API |

---

## IP Address Allocation

### Homelab Network (172.20.0.0/24)

| IP | Service |
|----|---------|
| 172.20.0.11 | Ollama |
| 172.20.0.12 | Ollama WebUI |
| 172.20.0.22 | Vaultwarden |
| 172.20.0.45 | Samba |
| 172.20.0.53 | AdGuard Home |
| 172.20.0.55 | Jellyseerr |
| 172.20.0.81 | Traefik |
| 172.20.0.85 | Glance |
| 172.20.0.96 | Jellyfin |
| 172.20.0.123 | Home Assistant |

### Media Network (172.21.0.0/24)

| IP | Service |
|----|---------|
| 172.21.0.2 | Gluetun |
| 172.21.0.55 | Jellyseerr |
| 172.21.0.67 | Bazarr |
| 172.21.0.78 | Radarr |
| 172.21.0.81 | Traefik |
| 172.21.0.85 | Glance |
| 172.21.0.86 | Lidarr |
| 172.21.0.89 | Sonarr |
| 172.21.0.96 | Jellyfin |

---

## Service Dependencies

### Direct Dependencies
- **Ollama WebUI** → Ollama (service_healthy)
- **Prowlarr** → Gluetun (service_healthy)
- **qBittorrent** → Gluetun (service_healthy, restart: true)
- **NZBGet** → Gluetun (service_healthy)

### Network Dependencies
- Services behind Gluetun use `network_mode: service:gluetun`

---

## Volume Mounts

### Shared Volumes
- **Media Path:** `${MEDIA_PATH:-/data/media}` - Used by Jellyfin, Radarr, Sonarr, Lidarr, Bazarr
- **Downloads Path:** `${DOWNLOADS_PATH:-/data/downloads}` - Used by Radarr, Sonarr, Lidarr, qBittorrent, NZBGet
- **Docker Socket:** `/var/run/docker.sock` - Used by Traefik, Glance

### Service-Specific Data Directories
All services store data in `../[service-name]/` relative to compose file location

---

## Environment Variables Required

### Core Variables
- `TZ` - Timezone (default: America/Chicago)
- `DOMAIN` - Domain name (default: local)
- `PUID` - Process User ID (default: 1000)
- `PGID` - Process Group ID (default: 1000)

### Service-Specific Variables
- **Traefik:** `TRAEFIK_DASHBOARD_USER`, `TRAEFIK_DASHBOARD_PASSWORD`
- **Vaultwarden:** `VAULTWARDEN_*` variables
- **Tailscale:** `TS_AUTHKEY`, `TS_ROUTES`
- **Gluetun:** `VPN_ENDPOINT_IP`, `WIREGUARD_*` variables
- **Ollama:** `OLLAMA_*` variables
- **Samba:** `SAMBA_USER`, `SAMBA_PASSWORD`
- **Media Stack:** `MEDIA_PATH`, `MEDIA_PATH2`, `DOWNLOADS_PATH`

---

## Quick Commands


### List Running Containers
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```