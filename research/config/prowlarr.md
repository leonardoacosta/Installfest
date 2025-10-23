# Prowlarr Configuration Research

## Service Overview
Prowlarr is an indexer manager that integrates with Sonarr, Radarr, Lidarr, and other arr applications to manage torrent trackers and usenet indexers.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
PUID: "1000"
PGID: "1000"
TZ: "America/New_York"
UMASK: "022"

# Application Settings
PROWLARR_PORT: "9696"
PROWLARR_BRANCH: "master"
PROWLARR_API_KEY: "${PROWLARR_API_KEY}"

# Database
PROWLARR_POSTGRES_HOST: "postgres"
PROWLARR_POSTGRES_PORT: "5432"
PROWLARR_POSTGRES_USER: "prowlarr"
PROWLARR_POSTGRES_PASSWORD: "${DB_PASSWORD}"
PROWLARR_POSTGRES_MAIN_DB: "prowlarr-main"
PROWLARR_POSTGRES_LOG_DB: "prowlarr-log"
```

## 2. Secrets Management Strategy

```yaml
secrets:
  prowlarr_api_key:
    file: ./secrets/prowlarr/api_key.txt
  indexer_api_keys:
    file: ./secrets/prowlarr/indexer_keys.json

environment:
  - PROWLARR_API_KEY_FILE=/run/secrets/prowlarr_api_key
  - INDEXER_KEYS_FILE=/run/secrets/indexer_api_keys
```

## 3. Volume Mounts and Data Persistence

```yaml
volumes:
  - ./config/prowlarr:/config:rw
  - ./logs/prowlarr:/logs:rw
  - ./backups/prowlarr:/backups:rw

network_mode: "service:gluetun"  # Route through VPN
```

## 4. Configuration File Template

```xml
<!-- config.xml -->
<Config>
  <Port>9696</Port>
  <UrlBase></UrlBase>
  <BindAddress>*</BindAddress>
  <SslPort>6969</SslPort>
  <EnableSsl>False</EnableSsl>
  <ApiKey>${API_KEY}</ApiKey>
  <AuthenticationMethod>Forms</AuthenticationMethod>
  <Branch>master</Branch>
  <LogLevel>Info</LogLevel>
  <PostgresHost>postgres</PostgresHost>
  <PostgresPort>5432</PostgresPort>
  <PostgresUser>prowlarr</PostgresUser>
  <PostgresPassword>${DB_PASSWORD}</PostgresPassword>
  <PostgresMainDb>prowlarr-main</PostgresMainDb>
  <PostgresLogDb>prowlarr-log</PostgresLogDb>
</Config>
```

## 5. Indexer Configuration

```yaml
# Indexer sync settings
indexers:
  - name: "NZBGeek"
    type: "newznab"
    url: "https://api.nzbgeek.info"
    api_key: "${NZBGEEK_API_KEY}"
    categories: [2000, 5000, 7000]

  - name: "1337x"
    type: "torrent"
    url: "https://1337x.to"
    categories: [2000, 5000]

sync_apps:
  - name: "Sonarr"
    url: "http://sonarr:8989"
    api_key: "${SONARR_API_KEY}"
    sync_level: "fullSync"

  - name: "Radarr"
    url: "http://radarr:7878"
    api_key: "${RADARR_API_KEY}"
    sync_level: "fullSync"
```

## Security & Performance

- Use VPN for all indexer queries
- Implement rate limiting
- Regular API key rotation
- Monitor failed searches
- Cache indexer results
- Sync profiles optimization