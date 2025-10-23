# Radarr - Service Synergy Analysis

## Service Overview
Radarr is an automated movie collection manager that monitors multiple RSS feeds and torrent/Usenet sites for new releases, automatically downloading, sorting, and renaming them.

## Synergies with Other Services

### Strong Integrations
1. **Prowlarr**: Centralized indexer management and search
2. **qBittorrent/NZBGet**: Automated download handling
3. **Jellyfin**: Library management and media serving
4. **Bazarr**: Automatic subtitle fetching for movies
5. **Jellyseerr**: Request approval and automation
6. **Home Assistant**: Automation triggers and monitoring
7. **Gluetun**: VPN protection for searches and downloads

### Complementary Services
- **Glance**: Movie statistics and upcoming releases
- **Samba**: Direct file access for manual management
- **Ollama**: Movie recommendation and description generation
- **Vaultwarden**: API key and credential storage
- **Nginx Proxy Manager**: Secure external access
- **Tailscale**: Remote management capabilities

## Redundancies
- **Manual Downloads**: Automates what users do manually
- **CouchPotato**: Older alternative (deprecated)
- **Watcher3**: Another movie automation tool
- **Jellyfin Requests**: Basic request features

## Recommended Additional Services

### High Priority
1. **Overseerr**: Alternative request management
2. **Plex Meta Manager**: Collection and metadata automation
3. **Tdarr**: Automated transcoding for optimization
4. **FileBot**: Advanced renaming and organization
5. **RadarrSync**: Sync between multiple Radarr instances

### Medium Priority
1. **Lists Services**: Trakt, IMDb, TMDb list sync
2. **Notifiarr**: Advanced notification system
3. **Organizr**: Unified dashboard for management
4. **Gaps**: Identify missing movies in collections
5. **Requestrr**: Discord/Telegram bot for requests

### Low Priority
1. **Radarr4K**: Separate 4K instance
2. **Collection Manager**: Advanced collection building
3. **Movie Database**: Local metadata caching
4. **Poster Management**: Custom poster organization
5. **Trailer Downloads**: Automatic trailer fetching

## Integration Opportunities

### Movie Pipeline
```mermaid
graph LR
    Request[Jellyseerr Request] --> Approve[Approval]
    Approve --> Search[Radarr Search via Prowlarr]
    Search --> Download[qBittorrent/NZBGet]
    Download --> Import[Radarr Import]
    Import --> Rename[File Organization]
    Rename --> Subtitles[Bazarr Subs]
    Subtitles --> Library[Jellyfin]
```

### Quality Management
1. **Profile Hierarchy**:
   - 4K HDR > 4K > 1080p Blu-ray > 1080p Web
   - Custom formats for specific encoders
   - Size limits per quality

2. **Upgrade Logic**:
   - Monitor for better releases
   - Replace when quality improves
   - Respect size constraints

3. **Collection Building**:
   - Import lists from TMDb/IMDb/Trakt
   - Monitor franchises automatically
   - Smart collection suggestions

## Optimization Recommendations

### File Organization
```
/media/movies/
├── Movie Title (Year)/
│   ├── Movie Title (Year) - [Quality].mkv
│   ├── Movie Title (Year) - [Quality].srt
│   ├── poster.jpg
│   ├── fanart.jpg
│   └── movie.nfo
```

### Quality Profiles
```yaml
Profiles:
  - Any (Testing):
      Min: HDTV-720p
      Max: 4K Remux
      Preferred: 1080p BluRay
  - HD-1080p:
      Min: HDTV-1080p
      Max: BluRay-1080p
      Size: 4GB - 20GB
  - Ultra-HD:
      Min: WEB-2160p
      Max: BluRay-2160p
      Size: 10GB - 60GB
```

### Custom Formats
1. **Release Groups**: Prefer trusted groups
2. **Audio**: DTS-HD, TrueHD, Atmos priority
3. **HDR**: Prefer HDR10+/Dolby Vision
4. **Avoid**: CAM, TS, hardcoded subs
5. **Languages**: Multi-audio tracks preferred

## Service-Specific Features

### Monitoring Options
- **Monitor Movie**: Add and search immediately
- **Monitor & Search**: Include in RSS sync
- **Unmonitor**: Add to library without downloading
- **Missing Only**: Only grab if not present

### Import Lists
```yaml
Lists:
  - TMDb Popular: Auto-add trending movies
  - IMDb Top 250: Classic must-haves
  - Trakt Watchlist: Personal queue
  - Jellyseerr: Approved requests
  - Custom Lists: Genre collections
```

### Metadata Management
1. **NFO Files**: Save metadata locally
2. **Artwork**: Download posters, fanart, logos
3. **Trailers**: Optional trailer downloads
4. **Extras**: Behind-the-scenes content
5. **Subtitles**: Trigger Bazarr on import

## Advanced Automation

### Home Assistant Integration
```yaml
Automations:
  - Notify on movie added
  - Pause downloads during streaming
  - Alert on failed downloads
  - Report storage usage
  - Trigger upgrades off-peak
```

### Collection Automation
1. **Franchise Monitoring**: Add all MCU/Star Wars/etc.
2. **Actor Collections**: Movies by favorite actors
3. **Director Collections**: Auteur filmographies
4. **Genre Collections**: Horror, Sci-Fi, etc.
5. **Award Winners**: Oscar, Cannes, etc.

### Quality Decisions
1. **Size vs. Quality**: Balance storage with quality
2. **Upgrade Timing**: Wait for proper releases
3. **Format Priority**: Remux > Encode > Web
4. **Audio Preferences**: Original language priority
5. **Subtitle Strategy**: Forced subs for foreign parts

## Key Findings

### What Needs to Be Done
1. Configure quality profiles for different use cases
2. Set up import lists for automatic additions
3. Create custom formats for release filtering
4. Configure naming scheme for consistency
5. Set up recycling bin for recovery

### Why These Changes Are Beneficial
1. Automates movie collection management
2. Ensures consistent quality standards
3. Reduces manual searching and downloading
4. Maintains organized media library
5. Enables request-based acquisitions

### How to Implement
1. Deploy Radarr container with persistent config
2. Connect to Prowlarr for indexers
3. Configure download clients (qBittorrent/NZBGet)
4. Set up root folder for movies
5. Create quality profiles for different needs
6. Configure custom formats for filtering
7. Set up naming conventions
8. Add import lists for automation
9. Connect to Jellyfin for library updates
10. Configure Jellyseerr integration