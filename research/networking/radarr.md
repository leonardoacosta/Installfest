# Radarr - Networking Analysis

## 1. Current Network Configuration Analysis
- **Container Network**: media (bridge)
- **IP Address**: 172.21.0.78 (static)
- **Port Mappings**: 7878:7878 (WebUI/API)
- **Volume Mounts**: Media library and downloads
- **Direct Network**: Not behind VPN

## 2. Optimal Network Placement
**Recommended Zone**: Media Management VLAN
- Should be in Media VLAN (e.g., VLAN 40)
- Does NOT need VPN (metadata only)
- Requires access to download clients
- Needs media library write access

## 3. Reverse Proxy Requirements
**Configuration**:
- URL: `https://radarr.domain.com`
- Can be exposed with authentication
- Headers Required:
  ```nginx
  X-Forwarded-For
  X-Real-IP
  X-Forwarded-Proto
  X-Forwarded-Host
  X-Api-Key (for API calls)
  ```

## 4. Security Considerations for External Exposure
**Security Requirements**:
- Strong authentication required
- API key for all API access
- Consider OAuth2/Authelia
- IP whitelisting recommended
- Rate limiting on API
- Monitor for suspicious activity
- Disable user registration

## 5. Port Management and Conflicts
**Ports Used**:
- 7878/tcp: WebUI and API

**API Endpoints**:
- `/api/v3/movie`: Movie management
- `/api/v3/system`: System status
- `/api/v3/history`: Download history
- `/api/v3/queue`: Download queue

## 6. DNS and Service Discovery
**DNS Configuration**:
- Local DNS: `radarr.local`
- Public DNS: `radarr.domain.com`
- API discovery for apps

## 7. VLAN Segmentation Recommendations
**VLAN Placement**:
- **VLAN 40 (Media)**: Primary placement
- Access to Download VLAN for clients
- Access to Storage VLAN for media
- User VLAN access for management

## 8. Firewall Rules Required
**Inbound Rules**:
```
# WebUI from Users
Allow TCP 7878 from 192.168.20.0/24 to Radarr

# API from Jellyseerr
Allow TCP 7878 from Jellyseerr to Radarr

# API from automation
Allow TCP 7878 from 192.168.10.0/24 to Radarr
```

**Outbound Rules**:
```
# Metadata APIs (TMDB, etc)
Allow TCP 443 from Radarr to Any

# Prowlarr API
Allow TCP 9696 from Radarr to Gluetun

# qBittorrent API
Allow TCP 8080 from Radarr to Gluetun

# NZBGet API
Allow TCP 6789 from Radarr to Gluetun

# DNS
Allow UDP 53 from Radarr to DNS
```

## 9. Inter-Service Communication Requirements
**Service Integrations**:
- **Prowlarr**: Indexer searches
- **qBittorrent**: Send torrents
- **NZBGet**: Send NZBs
- **Jellyfin**: Update library
- **Bazarr**: Subtitle downloads
- **Jellyseerr**: Request handling

## 10. Performance Optimization
**Application Settings**:
```yaml
Media Management:
  - File Management: Hardlink when possible
  - Root Folder: /media/movies
  - Recycle Bin: 7 days
  - File Date: Release date

Quality Profiles:
  - Preferred: 1080p
  - Minimum: 720p
  - Maximum: 4K (if storage permits)

Indexers:
  - RSS Sync: 30 minutes
  - Search on add: Yes
  - Prefer protocol: Usenet > Torrent
```

**Resource Recommendations**:
- Memory: 512MB-1GB
- CPU: 1-2 cores
- Storage: 1-5GB for database
- Network: 10-50 Mbps for metadata

## Advanced Configuration
**Custom Formats**:
- HDR preference
- Audio format selection
- Release group scoring
- Language preferences

**Automation**:
```yaml
Lists:
  - Trakt Popular
  - IMDB Top 250
  - Custom Plex lists

Import Settings:
  - Monitor: Movie only
  - Quality: Use list default
  - Add to Radarr: Yes
```

## Database Optimization
**PostgreSQL** (for large libraries):
```sql
-- Better performance than SQLite
-- Supports concurrent access
-- Better for 1000+ movies
```

## API Integration Examples
**Jellyseerr Request**:
```json
{
  "title": "Movie Title",
  "tmdbId": 12345,
  "qualityProfileId": 1,
  "rootFolderPath": "/media/movies",
  "monitored": true,
  "searchForMovie": true
}
```

## Backup Strategy
- Database backups daily
- Configuration export weekly
- Custom format definitions
- Quality profile settings
- List configurations

## Monitoring Points
- Queue status
- Failed downloads
- Disk space usage
- API response times
- Indexer search success
- Import failures
- Database size

## Migration Notes
1. Install in Media VLAN
2. Configure root folders
3. Set up quality profiles
4. Connect to Prowlarr
5. Configure download clients
6. Set up Jellyfin connection
7. Import existing library
8. Configure lists
9. Set up Jellyseerr
10. Test full workflow
11. Configure backups
12. Set up monitoring