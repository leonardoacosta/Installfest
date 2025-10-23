# qBittorrent Configuration Research

## Service Overview
qBittorrent is a feature-rich BitTorrent client with web UI, providing downloading capabilities through VPN connection.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
PUID: "1000"
PGID: "1000"
TZ: "America/New_York"
WEBUI_PORT: "8080"
UMASK: "022"

# Performance
TORRENTING_PORT: "6881"
MAX_ACTIVE_DOWNLOADS: "5"
MAX_ACTIVE_TORRENTS: "10"
MAX_ACTIVE_UPLOADS: "10"
GLOBAL_MAX_RATIO: "2.0"

# Paths
DOWNLOADS_PATH: "/downloads"
INCOMPLETE_PATH: "/downloads/incomplete"
TORRENT_PATH: "/config/qBittorrent/BT_backup"
```

## 2. Secrets Management Strategy

```yaml
secrets:
  qbt_webui_password:
    file: ./secrets/qbittorrent/webui_password.txt

environment:
  - QBT_WEBUI_PASSWORD_FILE=/run/secrets/qbt_webui_password
```

## 3. Volume Mounts and Data Persistence

```yaml
volumes:
  - ./config/qbittorrent:/config:rw
  - /mnt/downloads:/downloads:rw
  - /mnt/downloads/incomplete:/downloads/incomplete:rw
  - /mnt/media/torrents:/torrents:rw

network_mode: "service:gluetun"  # Route through VPN
```

## 4. Configuration File Template

```ini
# qBittorrent.conf
[Preferences]
Connection\PortRangeMin=6881
Connection\UPnP=false
Downloads\SavePath=/downloads/
Downloads\TempPath=/downloads/incomplete/
Downloads\PreAllocation=true
Downloads\UseIncompleteExtension=true
WebUI\Enabled=true
WebUI\Port=8080
WebUI\Username=admin
WebUI\Password_PBKDF2="@ByteArray(HASH_HERE)"
WebUI\CSRFProtection=true
WebUI\ClickjackingProtection=true
WebUI\SecureCookie=true
WebUI\HostHeaderValidation=true

[BitTorrent]
Session\MaxConnections=200
Session\MaxConnectionsPerTorrent=50
Session\MaxUploads=10
Session\MaxUploadsPerTorrent=4
Session\GlobalMaxSeedingMinutes=10080
Session\AlternativeGlobalDLSpeedLimit=0
Session\AlternativeGlobalUPSpeedLimit=0
Session\BTProtocol=TCP
Session\Encryption=1
Session\AnonymousMode=true
Session\DisableAutoTMMByDefault=false
```

## 5. Automation Scripts

```bash
#!/bin/bash
# Auto-import torrents
WATCH_DIR="/torrents/watch"
CATEGORY_RULES="/config/category_rules.json"

# Category management
assign_category() {
  local torrent_name="$1"
  if [[ "$torrent_name" =~ S[0-9]+E[0-9]+ ]]; then
    echo "tv"
  elif [[ "$torrent_name" =~ (1080p|2160p|720p) ]]; then
    echo "movies"
  else
    echo "general"
  fi
}
```

## Security & Performance

- Always use with VPN (Gluetun)
- Enable anonymous mode
- Use encryption
- Implement ratio limits
- Configure connection limits
- Regular cleanup of completed torrents
- Monitor disk space