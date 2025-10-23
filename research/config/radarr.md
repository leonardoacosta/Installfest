# Radarr Configuration Research

## Service Overview
Radarr is a movie collection manager that automatically searches for and downloads movies via usenet and torrents.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
PUID: "1000"
PGID: "1000"
TZ: "America/New_York"
UMASK: "022"

# Application Settings
RADARR_PORT: "7878"
RADARR_API_KEY: "${RADARR_API_KEY}"
RADARR_BRANCH: "master"

# Database
RADARR_POSTGRES_HOST: "postgres"
RADARR_POSTGRES_PORT: "5432"
RADARR_POSTGRES_USER: "radarr"
RADARR_POSTGRES_PASSWORD: "${DB_PASSWORD}"
RADARR_POSTGRES_MAIN_DB: "radarr-main"
RADARR_POSTGRES_LOG_DB: "radarr-log"
```

## 2. Volume Mounts and Data Persistence

```yaml
volumes:
  - ./config/radarr:/config:rw
  - /mnt/media/movies:/movies:rw
  - /mnt/downloads:/downloads:rw
  - ./logs/radarr:/logs:rw
  - ./backups/radarr:/backups:rw

ports:
  - "7878:7878"
```

## 3. Configuration Templates

```json
// Quality Profiles
{
  "name": "HD-1080p",
  "cutoff": 7,
  "items": [
    {"quality": {"id": 3}, "allowed": true},  // WEBDL-1080p
    {"quality": {"id": 7}, "allowed": true},  // Bluray-1080p
    {"quality": {"id": 5}, "allowed": false}  // WEBDL-720p
  ],
  "minFormatScore": 0,
  "upgradeAllowed": true
}

// Root Folders
{
  "path": "/movies",
  "accessible": true,
  "freeSpace": 1000000000000,
  "unmappedFolders": []
}

// Naming Convention
{
  "renameMovies": true,
  "replaceIllegalCharacters": true,
  "colonReplacementFormat": "dash",
  "standardMovieFormat": "{Movie Title} ({Release Year}) {Quality Full}",
  "movieFolderFormat": "{Movie Title} ({Release Year})"
}
```

## 4. Automation & Integration

```yaml
# Download Clients
download_clients:
  - name: "qBittorrent"
    type: "qbittorrent"
    host: "gluetun"
    port: 8080
    username: "admin"
    password: "${QBT_PASSWORD}"
    category: "radarr"
    priority: 1

  - name: "NZBGet"
    type: "nzbget"
    host: "nzbget"
    port: 6789
    username: "admin"
    password: "${NZBGET_PASSWORD}"
    category: "movies"
    priority: 2

# Indexers (via Prowlarr)
indexer_sync:
  prowlarr_url: "http://prowlarr:9696"
  api_key: "${PROWLARR_API_KEY}"
  sync_categories: [2000, 2010, 2020, 2030, 2040, 2050]

# Post-Processing
connect:
  - name: "Jellyfin"
    type: "jellyfin"
    url: "http://jellyfin:8096"
    api_key: "${JELLYFIN_API_KEY}"
    notify_on: ["download", "upgrade", "rename"]

  - name: "Discord"
    type: "webhook"
    url: "${DISCORD_WEBHOOK}"
    method: "POST"
```

## Security & Performance

- API key authentication
- Quality profile optimization
- Disk space monitoring
- Failed download handling
- Backup retention policies
- Media permissions management