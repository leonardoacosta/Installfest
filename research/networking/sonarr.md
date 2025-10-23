# Sonarr - Networking Analysis

## 1. Current Network Configuration Analysis
- **Container Network**: media (bridge)
- **IP Address**: 172.21.0.89 (static)
- **Port Mappings**: 8989:8989 (WebUI/API)
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
- URL: `https://sonarr.domain.com`
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
- 8989/tcp: WebUI and API

**API Endpoints**:
- `/api/v3/series`: Series management
- `/api/v3/episode`: Episode tracking
- `/api/v3/calendar`: Upcoming episodes
- `/api/v3/queue`: Download queue
- `/api/v3/history`: Download history

## 6. DNS and Service Discovery
**DNS Configuration**:
- Local DNS: `sonarr.local`
- Public DNS: `sonarr.domain.com`
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
Allow TCP 8989 from 192.168.20.0/24 to Sonarr

# API from Jellyseerr
Allow TCP 8989 from Jellyseerr to Sonarr

# API from automation
Allow TCP 8989 from 192.168.10.0/24 to Sonarr
```

**Outbound Rules**:
```
# Metadata APIs (TVDB, etc)
Allow TCP 443 from Sonarr to Any

# Prowlarr API
Allow TCP 9696 from Sonarr to Gluetun

# qBittorrent API
Allow TCP 8080 from Sonarr to Gluetun

# NZBGet API
Allow TCP 6789 from Sonarr to Gluetun

# DNS
Allow UDP 53 from Sonarr to DNS
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
  - Episode Naming: S{season:00}E{episode:00}
  - Root Folders: /media/tv
  - File Management: Hardlink when possible
  - Recycle Bin: 7 days
  - Propers/Repacks: Do not prefer

Quality Profiles:
  - Preferred: 1080p HDTV
  - Minimum: 720p
  - Upgrade until: 1080p WEB-DL
  - Daily episode limit: 5

Series Types:
  - Standard: Regular episodes
  - Daily: News/talk shows
  - Anime: Special handling
```

**Resource Recommendations**:
- Memory: 512MB-1GB
- CPU: 1-2 cores
- Storage: 1-10GB for database
- Network: 10-50 Mbps for metadata

## Advanced Configuration
**Release Profiles**:
```yaml
Preferred Words:
  - Score +100: x265, HEVC
  - Score +50: AMZN, NF
  - Score -50: HDTV

Must Contain:
  - (for specific requirements)

Must Not Contain:
  - DUBBED, SUBBED (unless wanted)
```

**Automation**:
```yaml
Import Lists:
  - Trakt Watchlist
  - IMDB Lists
  - Plex Watchlist
  - Custom lists

Settings:
  - Monitor: All Episodes
  - Quality Profile: HD-1080p
  - Season Folder: Yes
  - Search on Add: Yes
```

## Episode Monitoring
**Monitoring Options**:
- All Episodes
- Future Episodes
- Missing Episodes
- Existing Episodes
- First Season
- Latest Season
- None

## Database Optimization
**For Large Libraries** (1000+ series):
- Consider PostgreSQL over SQLite
- Regular VACUUM operations
- Index optimization
- Query performance monitoring

## API Integration Examples
**Add Series Request**:
```json
{
  "tvdbId": 123456,
  "title": "Series Name",
  "qualityProfileId": 1,
  "seasonFolder": true,
  "monitored": true,
  "rootFolderPath": "/media/tv",
  "addOptions": {
    "searchForMissingEpisodes": true,
    "monitor": "all"
  }
}
```

## Calendar Integration
- iCal feed for upcoming episodes
- Integration with calendar apps
- Email notifications for premieres

## Backup Strategy
- Database backups daily
- Configuration export weekly
- Release profiles backup
- Quality definitions
- Import list settings

## Monitoring Points
- Queue status
- Missing episodes count
- Failed downloads
- Disk space usage
- API response times
- Calendar sync status
- Import list updates
- Database performance

## Migration Notes
1. Install in Media VLAN
2. Configure root folders
3. Set up quality profiles
4. Create release profiles
5. Connect to Prowlarr
6. Configure download clients
7. Set up Jellyfin connection
8. Import existing library
9. Configure import lists
10. Set up Jellyseerr
11. Test episode grab workflow
12. Configure backups
13. Set up monitoring alerts