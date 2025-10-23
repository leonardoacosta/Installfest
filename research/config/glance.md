# Glance Dashboard Configuration Research

## Service Overview
Glance is a self-hosted dashboard for your homelab services, providing a unified interface to monitor and access various applications.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
TZ: "America/New_York"                    # Timezone configuration
GLANCE_PORT: "8080"                       # Web interface port
GLANCE_CONFIG_PATH: "/app/glance.yml"    # Configuration file path
GLANCE_LOG_LEVEL: "info"                 # Logging verbosity (debug, info, warn, error)

# Theme and UI
GLANCE_THEME: "dark"                     # UI theme (dark, light, auto)
GLANCE_ACCENT_COLOR: "#007bff"           # Accent color for UI elements
GLANCE_BACKGROUND_BLUR: "true"           # Enable background blur effects

# Performance
GLANCE_CACHE_TTL: "300"                  # Cache TTL in seconds
GLANCE_REQUEST_TIMEOUT: "10"             # HTTP request timeout in seconds
GLANCE_MAX_WIDGETS: "50"                 # Maximum number of widgets
```

## 2. Secrets Management Strategy

```yaml
# Docker Secrets Implementation
secrets:
  glance_api_keys:
    file: ./secrets/glance_api_keys.json
  glance_auth_token:
    file: ./secrets/glance_auth_token.txt

# Environment Reference
environment:
  - API_KEYS_FILE=/run/secrets/glance_api_keys
  - AUTH_TOKEN_FILE=/run/secrets/glance_auth_token

# External Vault Integration
# Use HashiCorp Vault or Bitwarden for API keys
VAULT_ADDR: "https://vault.local:8200"
VAULT_TOKEN: "${VAULT_TOKEN}"
VAULT_PATH: "secret/glance"
```

## 3. Volume Mounts and Data Persistence

```yaml
volumes:
  # Configuration persistence
  - ./config/glance:/app/config:rw
  - ./data/glance/cache:/app/cache:rw

  # Custom assets and themes
  - ./assets/glance/themes:/app/themes:ro
  - ./assets/glance/icons:/app/static/icons:ro

  # Logs
  - ./logs/glance:/app/logs:rw

# Named volumes for Docker
volumes:
  glance_config:
    driver: local
  glance_cache:
    driver: local
```

## 4. Health Check Configuration

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s

# Monitoring endpoints
/health          # Basic health check
/metrics         # Prometheus metrics
/api/status      # Detailed status information
```

## 5. Backup and Restore Procedures

```bash
#!/bin/bash
# Backup Script
BACKUP_DIR="/backups/glance/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup configuration
cp -r /app/config/* "$BACKUP_DIR/config/"

# Backup cache if needed
tar -czf "$BACKUP_DIR/cache.tar.gz" /app/cache/

# Backup database if used
if [ -f /app/data/glance.db ]; then
  cp /app/data/glance.db "$BACKUP_DIR/"
fi

# Restore Script
RESTORE_FROM="$1"
docker stop glance
cp -r "$RESTORE_FROM/config/*" /app/config/
tar -xzf "$RESTORE_FROM/cache.tar.gz" -C /
docker start glance
```

## 6. Service Dependencies and Startup Order

```yaml
depends_on:
  - reverse_proxy    # Wait for Nginx Proxy Manager
  - redis           # Optional: For caching

# Docker Compose healthcheck dependencies
depends_on:
  reverse_proxy:
    condition: service_healthy
  redis:
    condition: service_started

# Startup order priority: 10 (UI services start last)
```

## 7. Resource Limits and Quotas

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 256M
    reservations:
      cpus: '0.1'
      memory: 128M

# Process limits
ulimits:
  nofile:
    soft: 20000
    hard: 40000
```

## 8. Logging Configuration

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
    labels: "service=glance"

# Application logging
LOG_FORMAT: "json"
LOG_OUTPUT: "stdout"
LOG_LEVEL: "info"
LOG_FILE_PATH: "/app/logs/glance.log"
LOG_ROTATION_SIZE: "100MB"
LOG_RETENTION_DAYS: "7"
```

## 9. Update and Maintenance Strategy

```yaml
# Watchtower configuration for auto-updates
labels:
  - "com.centurylinklabs.watchtower.enable=true"
  - "com.centurylinklabs.watchtower.schedule=0 0 4 * * *"
  - "com.centurylinklabs.watchtower.rolling-restart=true"

# Manual update procedure
update_script: |
  docker pull glanceapp/glance:latest
  docker-compose down glance
  docker-compose up -d glance
  docker image prune -f
```

## 10. Configuration File Template

```yaml
# glance.yml
server:
  host: 0.0.0.0
  port: 8080
  assets_path: /app/static

theme:
  name: dark
  accent_color: "#007bff"
  custom_css: /app/themes/custom.css

pages:
  - name: Home
    columns:
      - size: small
        widgets:
          - type: weather
            location: "New York"
            units: imperial

          - type: calendar
            feed_url: "https://calendar.example.com/feed.ics"

      - size: full
        widgets:
          - type: monitor
            cache_duration: 1m
            sites:
              - title: Jellyfin
                url: http://jellyfin.local:8096
                icon: si-jellyfin

              - title: Home Assistant
                url: http://homeassistant.local:8123
                icon: si-homeassistant

              - title: AdGuard Home
                url: http://adguard.local:3000
                icon: si-adguard

          - type: bookmarks
            groups:
              - title: Media
                links:
                  - title: Radarr
                    url: http://radarr.local:7878
                  - title: Sonarr
                    url: http://sonarr.local:8989
                  - title: Prowlarr
                    url: http://prowlarr.local:9696

settings:
  custom_footer: "Homelab Dashboard"
  hide_footer: false
  disable_animations: false
  reduced_motion: false

cache:
  enabled: true
  ttl: 300
  redis:
    enabled: false
    host: redis
    port: 6379

monitoring:
  prometheus:
    enabled: true
    port: 9090
    path: /metrics
```

## Security Considerations

1. **Authentication**: Implement OAuth2/OIDC via Authelia or Authentik
2. **HTTPS**: Always use TLS termination at reverse proxy
3. **API Keys**: Store in secrets management system
4. **CORS**: Configure allowed origins properly
5. **CSP Headers**: Implement Content Security Policy

## Integration Points

- **Reverse Proxy**: Nginx Proxy Manager or Traefik
- **Monitoring**: Prometheus + Grafana
- **Authentication**: Authelia/Authentik
- **Service Discovery**: Consul or Docker labels

## Performance Optimization

1. Enable Redis caching for API responses
2. Use CDN for static assets
3. Implement lazy loading for widgets
4. Optimize widget refresh intervals
5. Enable gzip compression

## Troubleshooting Guide

Common issues and solutions:
- Widget timeout: Increase `GLANCE_REQUEST_TIMEOUT`
- High memory usage: Reduce `GLANCE_MAX_WIDGETS`
- Slow loading: Enable Redis caching
- SSL errors: Check reverse proxy configuration