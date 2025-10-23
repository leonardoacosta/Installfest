# Sonarr Configuration Research

## Service Overview
Sonarr is a TV series management and automation tool that monitors for new episodes and handles downloading via usenet and torrents.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
PUID: "1000"
PGID: "1000"
TZ: "America/New_York"
UMASK: "022"

# Application Settings
SONARR_PORT: "8989"
SONARR_API_KEY: "${SONARR_API_KEY}"
SONARR_BRANCH: "main"

# Database
SONARR_POSTGRES_HOST: "postgres"
SONARR_POSTGRES_USER: "sonarr"
SONARR_POSTGRES_PASSWORD: "${DB_PASSWORD}"
SONARR_POSTGRES_MAIN_DB: "sonarr-main"
SONARR_POSTGRES_LOG_DB: "sonarr-log"
```

## 2. Volume Mounts and Data Persistence

```yaml
volumes:
  - ./config/sonarr:/config:rw
  - /mnt/media/tvshows:/tv:rw
  - /mnt/downloads:/downloads:rw
  - ./logs/sonarr:/logs:rw
  - ./backups/sonarr:/backups:rw

ports:
  - "8989:8989"
```

## 3. Configuration Templates

```json
// Quality Profiles
{
  "name": "HD-720p/1080p",
  "cutoff": 5,
  "items": [
    {"quality": {"id": 4}, "allowed": true},  // HDTV-720p
    {"quality": {"id": 5}, "allowed": true},  // HDTV-1080p
    {"quality": {"id": 6}, "allowed": true},  // WEB-DL 720p
    {"quality": {"id": 3}, "allowed": true}   // WEB-DL 1080p
  ],
  "upgradeAllowed": true
}

// Naming Convention
{
  "renameSeries": true,
  "replaceIllegalCharacters": true,
  "standardEpisodeFormat": "{Series Title} - S{season:00}E{episode:00} - {Episode Title} {Quality Full}",
  "dailyEpisodeFormat": "{Series Title} - {Air-Date} - {Episode Title} {Quality Full}",
  "seasonFolderFormat": "Season {season:00}"
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
    category: "sonarr"

  - name: "NZBGet"
    type: "nzbget"
    host: "nzbget"
    port: 6789
    category: "tv"

# Post-Processing
connect:
  - name: "Jellyfin"
    type: "jellyfin"
    url: "http://jellyfin:8096"
    api_key: "${JELLYFIN_API_KEY}"
    update_library: true

# Import Lists
import_lists:
  - name: "Trakt Watchlist"
    type: "trakt"
    list_type: "watchlist"
    auth_user: "${TRAKT_USER}"
```

## Security & Performance

- Episode monitoring optimization
- Season pack preferences
- Automatic episode trimming
- Failed download handling
- Media permission management