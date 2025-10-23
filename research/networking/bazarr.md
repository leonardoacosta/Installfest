# Bazarr - Networking Analysis

## 1. Current Network Configuration Analysis
- **Container Network**: media (bridge)
- **IP Address**: 172.21.0.67 (static)
- **Port Mappings**: 6767:6767 (WebUI/API)
- **Volume Mounts**: Media library (for subtitle files)
- **Direct Network**: Not behind VPN

## 2. Optimal Network Placement
**Recommended Zone**: Media Management VLAN
- Should be in Media VLAN (e.g., VLAN 40)
- Does NOT need VPN (subtitle providers)
- Requires media library write access
- Works alongside Radarr/Sonarr

## 3. Reverse Proxy Requirements
**Configuration**:
- URL: `https://bazarr.domain.com`
- Generally internal use only
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
- Authentication required if exposed
- API key for all API access
- Generally keep internal only
- Rate limiting on subtitle downloads
- Monitor provider usage limits
- Anti-captcha service integration

## 5. Port Management and Conflicts
**Ports Used**:
- 6767/tcp: WebUI and API

**API Endpoints**:
- `/api/episodes`: Episode subtitle management
- `/api/movies`: Movie subtitle management
- `/api/providers`: Provider status
- `/api/history`: Download history

## 6. DNS and Service Discovery
**DNS Configuration**:
- Local DNS: `bazarr.local`
- Subtitle provider DNS resolution
- Anti-captcha service DNS

## 7. VLAN Segmentation Recommendations
**VLAN Placement**:
- **VLAN 40 (Media)**: Primary placement
- Same VLAN as Radarr/Sonarr
- Direct file system access required
- No special isolation needed

## 8. Firewall Rules Required
**Inbound Rules**:
```
# WebUI from Users
Allow TCP 6767 from 192.168.20.0/24 to Bazarr

# API from Radarr/Sonarr
Allow TCP 6767 from 172.21.0.0/16 to Bazarr

# Admin access
Allow TCP 6767 from 192.168.10.0/24 to Bazarr
```

**Outbound Rules**:
```
# Subtitle providers
Allow TCP 443 from Bazarr to Any

# Anti-Captcha services
Allow TCP 443 from Bazarr to Any

# Radarr/Sonarr APIs
Allow TCP 7878,8989 from Bazarr to Media_VLAN

# DNS
Allow UDP 53 from Bazarr to DNS
```

## 9. Inter-Service Communication Requirements
**Service Integrations**:
- **Radarr**: Movie monitoring
- **Sonarr**: TV show monitoring
- **Jellyfin**: Notification on download
- **File System**: Direct subtitle writing

**Integration Flow**:
1. Radarr/Sonarr adds media
2. Bazarr detects new content
3. Searches for subtitles
4. Downloads and places .srt files
5. Notifies media server

## 10. Performance Optimization
**Application Settings**:
```yaml
General:
  - Path Mappings: Match Radarr/Sonarr
  - Scan Interval: 1 hour
  - Upgrade Subtitles: Yes
  - Days to upgrade: 7

Languages:
  - Primary: English
  - Secondary: Spanish (optional)
  - Hearing Impaired: Prefer non-HI

Providers:
  - OpenSubtitles (account required)
  - Subscene
  - TVSubtitles
  - Podnapisi
  - Addic7ed (account required)

Anti-Captcha:
  - Service: Anti-Captcha or 2captcha
  - For providers requiring it
```

**Resource Recommendations**:
- Memory: 256-512MB
- CPU: 1 core
- Storage: 100MB-1GB
- Network: 1-10 Mbps

## Provider Configuration
**OpenSubtitles**:
```yaml
Settings:
  - Username: Required
  - Password: Required
  - VIP: Better limits
  - Trust score minimum: 0.9
```

**Addic7ed**:
```yaml
Settings:
  - Username: Required
  - Password: Required
  - Rate limit aware
```

## Subtitle Management
**Naming Convention**:
```
Movie.Name.2024.1080p.BluRay.x264.en.srt
Movie.Name.2024.1080p.BluRay.x264.en.forced.srt
Movie.Name.2024.1080p.BluRay.x264.en.hi.srt
```

**Quality Preferences**:
- Sync: Prefer synchronized
- Hearing Impaired: User preference
- Forced: For foreign parts only
- Score threshold: 90%

## Advanced Features
**Custom Scripts**:
```python
# Post-processing scripts
- Subtitle synchronization
- Format conversion
- Encoding fixes
- Language detection
```

**Filters**:
```yaml
Exclusions:
  - Releases: CAM, TS, TC
  - Tags: LEAKED, SCREENER
  - Size: Under 100MB
```

## Database Management
**SQLite Optimization**:
- Regular VACUUM
- Index maintenance
- History cleanup
- Cache management

## API Integration Examples
**Search Subtitles Request**:
```json
{
  "movieId": 123,
  "language": "en",
  "hi": false,
  "forced": false,
  "providers": ["opensubtitles", "subscene"]
}
```

## Monitoring Points
- Provider availability
- Download success rate
- API quota usage
- Search performance
- Upgrade statistics
- Missing subtitles count
- Provider response times

## Troubleshooting
**Common Issues**:
1. **Provider blocks**: Use anti-captcha
2. **Rate limits**: Spread searches
3. **Sync issues**: Manual adjustment
4. **Wrong subtitles**: Improve matching
5. **Missing languages**: Add providers

## Backup Strategy
- Configuration backup
- Provider settings
- Language profiles
- Custom scripts
- Path mappings

## Migration Notes
1. Install in Media VLAN
2. Configure path mappings
3. Set up language profiles
4. Add subtitle providers
5. Configure anti-captcha
6. Connect to Radarr/Sonarr
7. Set up scan schedule
8. Test subtitle download
9. Configure upgrade rules
10. Set up notifications
11. Monitor provider health
12. Document custom settings