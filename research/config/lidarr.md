# Lidarr Configuration Research

## Service Overview
Lidarr is a music collection manager that automatically searches for and downloads music via usenet and torrents.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
PUID: "1000"
PGID: "1000"
TZ: "America/New_York"
UMASK: "022"

# Application Settings
LIDARR_PORT: "8686"
LIDARR_API_KEY: "${LIDARR_API_KEY}"
LIDARR_BRANCH: "master"

# Database
LIDARR_POSTGRES_HOST: "postgres"
LIDARR_POSTGRES_USER: "lidarr"
LIDARR_POSTGRES_PASSWORD: "${DB_PASSWORD}"
```

## 2. Volume Mounts and Data Persistence

```yaml
volumes:
  - ./config/lidarr:/config:rw
  - /mnt/media/music:/music:rw
  - /mnt/downloads:/downloads:rw
  - ./logs/lidarr:/logs:rw

ports:
  - "8686:8686"
```

## 3. Configuration Templates

```json
// Quality Profiles
{
  "name": "Lossless",
  "cutoff": "FLAC",
  "items": [
    {"quality": "MP3-320", "allowed": true},
    {"quality": "FLAC", "allowed": true},
    {"quality": "ALAC", "allowed": true}
  ]
}

// Metadata Profiles
{
  "name": "Standard",
  "primaryTypes": ["Album", "EP"],
  "secondaryTypes": ["Studio"],
  "releaseStatuses": ["Official"]
}

// Naming Convention
{
  "standardTrackFormat": "{Artist Name} - {Album Title} - {track:00} - {Track Title}",
  "multiDiscTrackFormat": "{Artist Name} - {Album Title} - {medium:00}{track:00} - {Track Title}",
  "artistFolderFormat": "{Artist Name}",
  "albumFolderFormat": "{Artist Name} - {Album Title} ({Release Year})"
}
```

## 4. Integration

```yaml
# MusicBrainz
musicbrainz:
  enabled: true
  host: "musicbrainz.org"

# Download Clients
download_clients:
  - name: "qBittorrent"
    type: "qbittorrent"
    host: "gluetun"
    port: 8080
    category: "lidarr"

# Notifications
connect:
  - name: "Jellyfin"
    type: "jellyfin"
    url: "http://jellyfin:8096"
    update_library: true
```

## Security & Performance

- Metadata provider configuration
- Audio quality preferences
- Failed download handling
- Duplicate detection
- Library scan optimization