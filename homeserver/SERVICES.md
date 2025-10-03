# Homeserver Services

## Network Configuration
- **homelab**: 172.20.0.0/16
- **media**: 172.21.0.0/16

## Service Directory

### Core Services

| Service | IP Address | Ports | Access URL |
|---------|-----------|-------|------------|
| Home Assistant | Host Network | 8123 | http://HOST_IP:8123 |
| AdGuard Home | 172.20.0.53 | 53, 81, 443, 3000, 853, 784, 8853, 5443 | http://HOST_IP:81 (web), http://HOST_IP:3000 (setup) |
| Nginx Proxy Manager | 172.20.0.81, 172.21.0.81 | 80, 81, 443 | http://HOST_IP:81 (admin), http://HOST_IP:80 (proxy) |
| Tailscale | Host Network | - | - |

### AI Services

| Service | IP Address | Ports | Access URL |
|---------|-----------|-------|------------|
| Ollama | 172.20.0.11 | 11434 | http://172.20.0.11:11434 |
| Ollama WebUI | 172.20.0.12 | 8081 | http://HOST_IP:8081 |

### Media Services

| Service | IP Address | Ports | Access URL |
|---------|-----------|-------|------------|
| Jellyfin | 172.20.0.96, 172.21.0.96 | 8096, 8920, 7359, 1900 | http://HOST_IP:8096 |
| Jellyseerr | 172.20.0.55, 172.21.0.55 | 5055 | http://HOST_IP:5055 |

### Storage

| Service | IP Address | Ports | Access URL |
|---------|-----------|-------|------------|
| Samba | 172.20.0.45 | 445, 139 | smb://HOST_IP/Media |

### VPN & Download Services

| Service | IP Address | Ports | Access URL |
|---------|-----------|-------|------------|
| Gluetun (VPN) | 172.21.0.2 | 51820, 8080, 9696, 6789 | - |
| qBittorrent | via Gluetun | 8080 | http://HOST_IP:8080 |
| Prowlarr | via Gluetun | 9696 | http://HOST_IP:9696 |
| NZBGet | via Gluetun | 6789 | http://HOST_IP:6789 |

### Media Management (Arr Stack)

| Service | IP Address | Ports | Access URL |
|---------|-----------|-------|------------|
| Radarr | 172.21.0.78 | 7878 | http://HOST_IP:7878 |
| Sonarr | 172.21.0.89 | 8989 | http://HOST_IP:8989 |
| Lidarr | 172.21.0.86 | 8686 | http://HOST_IP:8686 |
| Bazarr | 172.21.0.67 | 6767 | http://HOST_IP:6767 |
| Flaresolverr | 172.21.0.91 | 8191 | http://HOST_IP:8191 |

## Port Usage Summary

### External Ports (Host → Container)
- **53**: DNS (AdGuard Home)
- **80**: HTTP (Nginx Proxy Manager)
- **81**: Web UI (AdGuard Home & Nginx Proxy Manager Admin)
- **139**: NetBIOS (Samba)
- **443**: HTTPS (AdGuard Home & Nginx Proxy Manager)
- **445**: SMB (Samba)
- **784**: DNS-over-QUIC (AdGuard Home)
- **853**: DNS-over-TLS/QUIC (AdGuard Home)
- **1900**: DLNA (Jellyfin)
- **3000**: Initial setup (AdGuard Home)
- **5055**: Jellyseerr
- **5443**: DNSCrypt (AdGuard Home)
- **6767**: Bazarr
- **6789**: NZBGet (via Gluetun)
- **7359**: Client discovery (Jellyfin)
- **7878**: Radarr
- **8080**: qBittorrent (via Gluetun)
- **8081**: Ollama WebUI
- **8096**: Jellyfin web
- **8191**: Flaresolverr
- **8686**: Lidarr
- **8853**: DNS-over-QUIC (AdGuard Home)
- **8920**: Jellyfin HTTPS
- **8989**: Sonarr
- **9696**: Prowlarr (via Gluetun)
- **11434**: Ollama API
- **51820**: Wireguard (Gluetun, configurable)

## Notes

- **Home Assistant** and **Tailscale** use host networking for full network access
- **qBittorrent**, **Prowlarr**, and **NZBGet** route through Gluetun VPN container
- Replace `HOST_IP` with your server's actual IP address
- Default credentials should be changed on first setup
