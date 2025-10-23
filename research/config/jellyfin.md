# Jellyfin Configuration Research

## Service Overview
Jellyfin is a free and open-source media server that allows you to organize, stream, and access your media collection from any device.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
PUID: "1000"                              # User ID for file permissions
PGID: "1000"                              # Group ID for file permissions
TZ: "America/New_York"                    # Timezone
UMASK: "022"                              # File creation mask

# Network Configuration
JELLYFIN_PublishedServerUrl: "https://jellyfin.example.com"
JELLYFIN_HTTP_PORT: "8096"               # HTTP port
JELLYFIN_HTTPS_PORT: "8920"              # HTTPS port
JELLYFIN_SERVICE_PORT: "7359"            # Service discovery port

# Transcoding
JELLYFIN_FFmpeg: "/usr/lib/jellyfin-ffmpeg/ffmpeg"
JELLYFIN_CACHE_DIR: "/cache/transcodes"
NVIDIA_VISIBLE_DEVICES: "all"            # GPU access
NVIDIA_DRIVER_CAPABILITIES: "compute,video,utility"

# Performance
JELLYFIN_CONCURRENT_SCANS: "2"           # Library scan threads
JELLYFIN_SCAN_THROTTLE: "1000"           # Scan throttle in ms
JELLYFIN_MAX_STREAMING_BITRATE: "120000000"  # Max bitrate in bps

# Features
JELLYFIN_ENABLE_DLNA: "true"             # DLNA server
JELLYFIN_ENABLE_CHROMECAST: "true"       # Chromecast support
JELLYFIN_ENABLE_METRICS: "true"          # Prometheus metrics
```

## 2. Secrets Management Strategy

```yaml
# Docker Secrets
secrets:
  jellyfin_api_key:
    file: ./secrets/jellyfin/api_key.txt
  jellyfin_ldap_password:
    file: ./secrets/jellyfin/ldap_password.txt
  jellyfin_smtp_password:
    file: ./secrets/jellyfin/smtp_password.txt

# Environment references
environment:
  - JELLYFIN_API_KEY_FILE=/run/secrets/jellyfin_api_key
  - LDAP_PASSWORD_FILE=/run/secrets/jellyfin_ldap_password
  - SMTP_PASSWORD_FILE=/run/secrets/jellyfin_smtp_password

# External provider API keys
TMDB_API_KEY: "${TMDB_API_KEY}"
TVDB_API_KEY: "${TVDB_API_KEY}"
OMDB_API_KEY: "${OMDB_API_KEY}"
MUSICBRAINZ_API_KEY: "${MUSICBRAINZ_API_KEY}"
```

## 3. Volume Mounts and Data Persistence

```yaml
volumes:
  # Configuration and metadata
  - ./config/jellyfin:/config:rw
  - ./cache/jellyfin:/cache:rw

  # Media libraries
  - /mnt/media/movies:/data/movies:ro
  - /mnt/media/tvshows:/data/tvshows:ro
  - /mnt/media/music:/data/music:ro
  - /mnt/media/photos:/data/photos:ro
  - /mnt/media/books:/data/books:ro

  # Transcoding directory (SSD recommended)
  - /mnt/ssd/jellyfin/transcodes:/config/data/transcodes:rw

  # GPU access for hardware transcoding
  devices:
    - /dev/dri:/dev/dri              # Intel/AMD GPU
    # - /dev/nvidia0:/dev/nvidia0    # NVIDIA GPU
    # - /dev/nvidiactl:/dev/nvidiactl
    # - /dev/nvidia-uvm:/dev/nvidia-uvm

  # Fonts for subtitles
  - /usr/share/fonts:/usr/share/fonts:ro
  - ./fonts/custom:/usr/local/share/fonts:ro
```

## 4. Health Check Configuration

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8096/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s

# API endpoints for monitoring
/health                    # Basic health check
/System/Info              # System information
/System/ActivityLog       # Activity log
/System/Ping             # Simple ping endpoint
/metrics                 # Prometheus metrics (if enabled)
```

## 5. Backup and Restore Procedures

```bash
#!/bin/bash
# Backup Script
BACKUP_DIR="/backups/jellyfin/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Stop Jellyfin to ensure consistency
docker stop jellyfin

# Backup configuration and database
tar -czf "$BACKUP_DIR/config.tar.gz" \
  /config/data/jellyfin.db \
  /config/data/library.db \
  /config/config \
  /config/metadata \
  /config/plugins

# Backup user data
tar -czf "$BACKUP_DIR/userdata.tar.gz" \
  /config/data/collections \
  /config/data/playlists \
  /config/data/userdata

# Export library paths
docker exec jellyfin sqlite3 /config/data/library.db \
  ".dump" > "$BACKUP_DIR/library_backup.sql"

# Start Jellyfin
docker start jellyfin

# Restore Script
restore_jellyfin() {
  RESTORE_FROM="$1"

  # Stop Jellyfin
  docker stop jellyfin

  # Restore configuration
  tar -xzf "$RESTORE_FROM/config.tar.gz" -C /
  tar -xzf "$RESTORE_FROM/userdata.tar.gz" -C /

  # Restore database if needed
  if [ -f "$RESTORE_FROM/library_backup.sql" ]; then
    docker exec jellyfin sqlite3 /config/data/library.db \
      < "$RESTORE_FROM/library_backup.sql"
  fi

  # Start Jellyfin
  docker start jellyfin

  # Rescan libraries
  docker exec jellyfin /usr/lib/jellyfin/bin/jellyfin --scan
}
```

## 6. Service Dependencies and Startup Order

```yaml
depends_on:
  - reverse_proxy      # For web access
  - postgres           # Optional: External database
  - redis             # Optional: Caching

# Network configuration
networks:
  - media_network
  - proxy_network

# Service discovery
ports:
  - "8096:8096"      # HTTP
  - "8920:8920"      # HTTPS
  - "7359:7359/udp"  # Client discovery
  - "1900:1900/udp"  # DLNA

# Startup priority: 7 (after storage services)
```

## 7. Resource Limits and Quotas

```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 4096M
    reservations:
      cpus: '1.0'
      memory: 1024M
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu, video]

# Transcoding limits
transcode_limits:
  max_concurrent_streams: 3
  max_bitrate: "120 Mbps"
  max_resolution: "4K"
  hardware_acceleration: true
```

## 8. Logging Configuration

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "50m"
    max-file: "10"
    labels: "service=jellyfin"

# Application logging
environment:
  - JELLYFIN_LOG_DIR=/config/log
  - JELLYFIN_LOG_LEVEL=Information
  # Levels: Verbose, Debug, Information, Warning, Error, Fatal

# Log categories
logging_config: |
  {
    "Serilog": {
      "MinimumLevel": {
        "Default": "Information",
        "Override": {
          "Microsoft": "Warning",
          "MediaBrowser.Api": "Information",
          "MediaBrowser.Controller": "Warning"
        }
      }
    }
  }
```

## 9. Update and Maintenance Strategy

```yaml
# Update strategy
labels:
  - "com.centurylinklabs.watchtower.enable=true"
  - "com.centurylinklabs.watchtower.schedule=0 0 4 * * MON"

# Update procedure
update_script: |
  #!/bin/bash
  # Backup before update
  ./backup_jellyfin.sh

  # Pull new image
  docker pull jellyfin/jellyfin:latest

  # Update container
  docker-compose down jellyfin
  docker-compose up -d jellyfin

  # Wait for startup
  sleep 30

  # Verify health
  curl -f http://localhost:8096/health || exit 1

  # Clear cache if needed
  docker exec jellyfin rm -rf /cache/transcodes/*

# Maintenance tasks
maintenance:
  daily:
    - Clear old transcodes
    - Update metadata
  weekly:
    - Library scan
    - Backup configuration
    - Clean image cache
  monthly:
    - Database optimization
    - Update plugins
    - Analyze playback statistics
```

## 10. Configuration File Templates

### system.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<ServerConfiguration xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <LogFileRetentionDays>3</LogFileRetentionDays>
  <IsStartupWizardCompleted>true</IsStartupWizardCompleted>
  <CachePath>/cache</CachePath>
  <PublicPort>8096</PublicPort>
  <HttpsPort>8920</HttpsPort>
  <EnableHttps>false</EnableHttps>
  <EnableNormalizedItemByName>true</EnableNormalizedItemByName>
  <IsPortAuthorized>true</IsPortAuthorized>
  <QuickConnectAvailable>false</QuickConnectAvailable>
  <EnableCaseSensitiveItemIds>true</EnableCaseSensitiveItemIds>
  <MetadataPath>/config/metadata</MetadataPath>
  <PreferredMetadataLanguage>en</PreferredMetadataLanguage>
  <MetadataCountryCode>US</MetadataCountryCode>
  <RemoteClientBitrateLimits>
    <MaxBitrate>120000000</MaxBitrate>
  </RemoteClientBitrateLimits>
  <EnableUPnP>false</EnableUPnP>
  <EnableIPv6>false</EnableIPv6>
  <MinResumePct>5</MinResumePct>
  <MaxResumePct>90</MaxResumePct>
  <MinResumeDurationSeconds>300</MinResumeDurationSeconds>
</ServerConfiguration>
```

### encoding.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<EncodingOptions>
  <TranscodingTempPath>/cache/transcodes</TranscodingTempPath>
  <FallbackFontPath>/usr/share/fonts</FallbackFontPath>
  <EnableFallbackFont>false</EnableFallbackFont>
  <EncodingThreadCount>-1</EncodingThreadCount>
  <TranscodingThreadCount>-1</TranscodingThreadCount>
  <VaapiDevice>/dev/dri/renderD128</VaapiDevice>
  <EnableTonemapping>true</EnableTonemapping>
  <EnableVppTonemapping>true</EnableVppTonemapping>
  <TonemappingAlgorithm>hable</TonemappingAlgorithm>
  <TonemappingRange>auto</TonemappingRange>
  <TonemappingDesat>0</TonemappingDesat>
  <TonemappingPeak>100</TonemappingPeak>
  <TonemappingParam>0</TonemappingParam>
  <H264Crf>23</H264Crf>
  <H265Crf>28</H265Crf>
  <DeinterlaceMethod>yadif</DeinterlaceMethod>
  <EnableDecodingColorDepth10Hevc>true</EnableDecodingColorDepth10Hevc>
  <EnableDecodingColorDepth10Vp9>true</EnableDecodingColorDepth10Vp9>
  <EnableHardwareEncoding>true</EnableHardwareEncoding>
  <AllowHevcEncoding>true</AllowHevcEncoding>
  <EnableSubtitleExtraction>true</EnableSubtitleExtraction>
  <HardwareDecodingCodecs>
    <string>h264</string>
    <string>hevc</string>
    <string>mpeg2video</string>
    <string>vc1</string>
    <string>vp8</string>
    <string>vp9</string>
    <string>av1</string>
  </HardwareDecodingCodecs>
</EncodingOptions>
```

### docker-compose.yml
```yaml
jellyfin:
  image: jellyfin/jellyfin:latest
  container_name: jellyfin
  restart: unless-stopped
  runtime: nvidia  # For NVIDIA GPU
  environment:
    - PUID=1000
    - PGID=1000
    - TZ=America/New_York
    - JELLYFIN_PublishedServerUrl=https://jellyfin.example.com
    - NVIDIA_VISIBLE_DEVICES=all
    - NVIDIA_DRIVER_CAPABILITIES=compute,video,utility
  volumes:
    - ./config/jellyfin:/config
    - ./cache/jellyfin:/cache
    - /mnt/media:/data:ro
    - /dev/shm:/transcodes  # RAM disk for transcoding
  devices:
    - /dev/dri:/dev/dri  # For Intel/AMD GPU
  ports:
    - "8096:8096"
    - "8920:8920"
    - "7359:7359/udp"
    - "1900:1900/udp"
  networks:
    - media_network
    - proxy_network
```

## Security Considerations

1. **Authentication**: Enable and enforce user authentication
2. **API Keys**: Use secure API keys for external access
3. **HTTPS**: Use reverse proxy for SSL termination
4. **Network Isolation**: Separate media network from management
5. **Permissions**: Proper file permissions on media libraries
6. **Rate Limiting**: Implement at reverse proxy level

## Integration Points

- **Arr Stack**: Radarr, Sonarr, Lidarr for content management
- **Jellyseerr**: Request management
- **Nginx Proxy Manager**: Reverse proxy and SSL
- **Home Assistant**: Media player integration
- **Tautulli**: Playback statistics and monitoring

## Performance Optimization

1. **Hardware Acceleration**:
   - Enable GPU transcoding (Intel QSV, NVIDIA NVENC, AMD AMF)
   - Use appropriate codec settings
   - Optimize preset values (faster vs quality)

2. **Storage Optimization**:
   - Use SSD for transcoding directory
   - Separate metadata from media storage
   - Enable direct play when possible

3. **Network Optimization**:
   - Enable HTTP/2 in reverse proxy
   - Optimize chunk size for streaming
   - Use CDN for remote access

## Troubleshooting Guide

Common issues:
- **Transcoding failures**: Check GPU drivers and permissions
- **Library scan issues**: Verify file permissions and paths
- **Playback stuttering**: Check network bandwidth and transcoding settings
- **Metadata issues**: Clear metadata cache and rescan
- **Subtitle problems**: Install additional fonts, check extraction settings