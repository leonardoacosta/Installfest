# Jellyseerr Configuration Research

## Service Overview
Jellyseerr is a request management and media discovery tool designed to work with Jellyfin, allowing users to request movies and TV shows.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
TZ: "America/New_York"
PORT: "5055"
LOG_LEVEL: "info"

# Jellyfin Integration
JELLYFIN_TYPE: "jellyfin"
JELLYFIN_URL: "http://jellyfin:8096"
JELLYFIN_API_KEY: "${JELLYFIN_API_KEY}"

# Features
ALLOW_ANONYMOUS_REQUESTS: "false"
DEFAULT_PERMISSIONS: "32"
AUTO_APPROVE_MOVIES: "false"
AUTO_APPROVE_TV: "false"
```

## 2. Volume Mounts and Data Persistence

```yaml
volumes:
  - ./config/jellyseerr:/app/config:rw
  - ./logs/jellyseerr:/app/logs:rw

ports:
  - "5055:5055"
```

## 3. Configuration Templates

```json
// settings.json
{
  "main": {
    "apiKey": "${API_KEY}",
    "applicationTitle": "Jellyseerr",
    "applicationUrl": "https://requests.example.com",
    "trustProxy": true,
    "hideAvailable": false,
    "localLogin": true,
    "newPlexLogin": true,
    "region": "US",
    "originalLanguage": ""
  },
  "jellyfin": {
    "name": "Jellyfin",
    "hostname": "jellyfin",
    "port": 8096,
    "useSsl": false,
    "urlBase": "",
    "jellyfinApiKey": "${JELLYFIN_API_KEY}",
    "jellyfinExternalUrl": "https://jellyfin.example.com",
    "jellyfinInternalUrl": "http://jellyfin:8096"
  },
  "radarr": [{
    "name": "Radarr",
    "hostname": "radarr",
    "port": 7878,
    "apiKey": "${RADARR_API_KEY}",
    "useSsl": false,
    "baseUrl": "",
    "activeProfileId": 1,
    "activeDirectory": "/movies",
    "is4k": false,
    "minimumAvailability": "released",
    "isDefault": true
  }],
  "sonarr": [{
    "name": "Sonarr",
    "hostname": "sonarr",
    "port": 8989,
    "apiKey": "${SONARR_API_KEY}",
    "useSsl": false,
    "baseUrl": "",
    "activeProfileId": 1,
    "activeDirectory": "/tv",
    "activeLanguageProfileId": 1,
    "activeAnimeProfileId": null,
    "activeAnimeLanguageProfileId": null,
    "activeAnimeDirectory": null,
    "is4k": false,
    "isDefault": true,
    "enableSeasonFolders": true
  }],
  "public": {
    "initialized": true
  },
  "notifications": {
    "agents": {
      "discord": {
        "enabled": true,
        "types": 4094,
        "options": {
          "webhookUrl": "${DISCORD_WEBHOOK}",
          "username": "Jellyseerr"
        }
      }
    }
  }
}
```

## 4. User Management

```yaml
# User roles and permissions
roles:
  admin:
    - ADMIN
    - MANAGE_REQUESTS
    - REQUEST
    - AUTO_APPROVE

  power_user:
    - REQUEST
    - REQUEST_MOVIE
    - REQUEST_TV
    - AUTO_APPROVE

  user:
    - REQUEST
    - REQUEST_MOVIE
    - REQUEST_TV

# Request limits
limits:
  movie_quota: 10
  tv_quota: 5
  reset_period: "monthly"
```

## Security & Performance

- OAuth/SSO integration
- Request approval workflows
- Quota management
- API rate limiting
- Cache optimization
- Database cleanup schedules