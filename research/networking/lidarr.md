# Lidarr - Networking Analysis

## 1. Current Network Configuration Analysis
- **Container Network**: media (bridge)
- **IP Address**: 172.21.0.86 (static)
- **Port Mappings**: 8686:8686 (WebUI/API)
- **Volume Mounts**: Media library and downloads
- **Direct Network**: Not behind VPN

## 2. Optimal Network Placement
**Recommended Zone**: Media Management VLAN
- Should be in Media VLAN (e.g., VLAN 40)
- Does NOT need VPN (metadata only)
- Requires access to download clients
- Needs music library write access

## 3. Reverse Proxy Requirements
**Configuration**:
- URL: `https://lidarr.domain.com`
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
- 8686/tcp: WebUI and API

**API Endpoints**:
- `/api/v1/artist`: Artist management
- `/api/v1/album`: Album tracking
- `/api/v1/track`: Track information
- `/api/v1/queue`: Download queue
- `/api/v1/history`: Download history

## 6. DNS and Service Discovery
**DNS Configuration**:
- Local DNS: `lidarr.local`
- Public DNS: `lidarr.domain.com`
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
Allow TCP 8686 from 192.168.20.0/24 to Lidarr

# API from automation
Allow TCP 8686 from 192.168.10.0/24 to Lidarr

# API from music apps
Allow TCP 8686 from 192.168.40.0/24 to Lidarr
```

**Outbound Rules**:
```
# Metadata APIs (MusicBrainz, Last.fm)
Allow TCP 443 from Lidarr to Any

# Prowlarr API
Allow TCP 9696 from Lidarr to Gluetun

# qBittorrent API
Allow TCP 8080 from Lidarr to Gluetun

# NZBGet API
Allow TCP 6789 from Lidarr to Gluetun

# DNS
Allow UDP 53 from Lidarr to DNS
```

## 9. Inter-Service Communication Requirements
**Service Integrations**:
- **Prowlarr**: Indexer searches
- **qBittorrent**: Send torrents
- **NZBGet**: Send NZBs
- **Jellyfin**: Update music library
- **Spotify**: Import playlists
- **Last.fm**: Scrobbling data

## 10. Performance Optimization
**Application Settings**:
```yaml
Media Management:
  - Track Naming: {Artist Name} - {Track Title}
  - Root Folders: /media/music
  - File Management: Hardlink when possible
  - Metadata: Embed in files
  - File Date: Release date

Quality Profiles:
  - FLAC: Lossless preferred
  - MP3 320: Acceptable
  - MP3 V0: Minimum
  - Upgrade: Until FLAC

Metadata Profiles:
  - Standard: Albums + Singles
  - Albums Only: Skip singles
  - Discography: Everything
```

**Resource Recommendations**:
- Memory: 512MB-1GB
- CPU: 1-2 cores
- Storage: 1-5GB for database
- Network: 10-50 Mbps for metadata

## Advanced Configuration
**Release Profiles**:
```yaml
Preferred Words:
  - Score +100: FLAC, 24bit
  - Score +50: WEB, CD
  - Score -50: TAPE, VINYL

Quality Settings:
  - Size limits per track
  - Preferred release groups
  - Remaster preferences
```

**Import Lists**:
```yaml
Spotify:
  - Followed Artists
  - Saved Albums
  - Playlists

Last.fm:
  - User recommendations
  - Similar artists

MusicBrainz:
  - Series collections
  - Artist relationships
```

## Metadata Providers
**MusicBrainz**:
- Primary metadata source
- Album art and artist info
- Release group information

**Last.fm**:
- Artist biography
- Similar artists
- Tag information

**AudioDB**:
- Additional artwork
- Artist backgrounds

## Database Optimization
**For Large Libraries** (10,000+ tracks):
- Consider PostgreSQL
- Regular maintenance
- Index optimization
- Query performance tuning

## API Integration Examples
**Add Artist Request**:
```json
{
  "artistName": "Artist Name",
  "foreignArtistId": "musicbrainz-id",
  "qualityProfileId": 1,
  "metadataProfileId": 1,
  "monitored": true,
  "rootFolderPath": "/media/music",
  "addOptions": {
    "searchForMissingAlbums": true,
    "monitor": "all"
  }
}
```

## Music Organization
**Folder Structure**:
```
/media/music/
  /Artist Name/
    /Album Name (Year)/
      01 - Track Name.flac
      cover.jpg
      folder.jpg
```

## Backup Strategy
- Database backups daily
- Configuration export weekly
- Quality profiles backup
- Metadata profiles
- Import list settings
- Custom formats

## Monitoring Points
- Queue status
- Missing albums count
- Failed downloads
- Disk space usage
- API response times
- Metadata fetch failures
- Import failures
- Database performance

## Special Considerations
**Music-Specific Features**:
- Multi-disc album handling
- Various artist compilations
- Feat. artist parsing
- Remix/remaster detection
- Live album identification

## Migration Notes
1. Install in Media VLAN
2. Configure root folders
3. Set up quality profiles
4. Create metadata profiles
5. Connect to Prowlarr
6. Configure download clients
7. Connect music services
8. Import existing library
9. Set up import lists
10. Configure metadata providers
11. Test album grab workflow
12. Set up backups
13. Configure monitoring