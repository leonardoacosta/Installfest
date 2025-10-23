# Jellyseerr - Networking Analysis

## 1. Current Network Configuration Analysis
- **Container Networks**: Dual-homed (homelab + media bridges)
  - homelab: 172.20.0.55
  - media: 172.21.0.55
- **Port Mappings**: 5055:5055 (WebUI)
- **Dual Network**: Access to both user-facing and media networks
- **Direct Network**: Not behind VPN

## 2. Optimal Network Placement
**Recommended Zone**: DMZ with Media Access
- Primary in User-facing VLAN
- Secondary interface to Media VLAN
- Can be exposed to internet safely
- Bridge between users and media stack

## 3. Reverse Proxy Requirements
**Configuration**:
- URL: `https://request.domain.com`
- Public facing recommended
- Headers Required:
  ```nginx
  X-Forwarded-For
  X-Real-IP
  X-Forwarded-Proto
  X-Forwarded-Host
  X-Forwarded-Port
  ```
- WebSocket support for notifications

## 4. Security Considerations for External Exposure
**Security Requirements**:
- **Safe for external exposure**
- Built-in authentication (Jellyfin SSO)
- User permission system
- Request approval workflow
- Rate limiting on requests
- No direct media access
- API key protection

**User Management**:
- Jellyfin authentication
- Local users supported
- Permission levels
- Request quotas
- Auto-approval rules

## 5. Port Management and Conflicts
**Ports Used**:
- 5055/tcp: WebUI and API

**API Endpoints**:
- `/api/v1/request`: Media requests
- `/api/v1/user`: User management
- `/api/v1/auth`: Authentication
- `/api/v1/search`: Media search

## 6. DNS and Service Discovery
**DNS Configuration**:
- Public DNS: `request.domain.com`
- Local DNS: `jellyseerr.local`
- SEO-friendly URLs

## 7. VLAN Segmentation Recommendations
**Dual-Homed Configuration**:
- **VLAN 20 (Users)**: Primary interface
- **VLAN 40 (Media)**: Secondary for API calls
- Bridge between public and internal

**Access Pattern**:
```
Internet → DMZ (Jellyseerr) → Media VLAN (Arr apps)
Users → Jellyseerr → Request approval → Automation
```

## 8. Firewall Rules Required
**Inbound Rules**:
```
# Public web access
Allow TCP 5055 from Any to Jellyseerr

# API from Media services
Allow TCP 5055 from 172.21.0.0/16 to Jellyseerr
```

**Outbound Rules**:
```
# Jellyfin API
Allow TCP 8096 from Jellyseerr to Jellyfin

# Radarr API
Allow TCP 7878 from Jellyseerr to Radarr

# Sonarr API
Allow TCP 8989 from Jellyseerr to Sonarr

# TMDB/TVDB APIs
Allow TCP 443 from Jellyseerr to Any

# Email notifications
Allow TCP 587 from Jellyseerr to SMTP

# DNS
Allow UDP 53 from Jellyseerr to DNS
```

## 9. Inter-Service Communication Requirements
**Service Integrations**:
- **Jellyfin**: Authentication & library sync
- **Radarr**: Movie requests
- **Sonarr**: TV show requests
- **SMTP**: Email notifications
- **Discord/Telegram**: Notifications

**Integration Flow**:
1. User searches media
2. Submits request
3. Admin approval (optional)
4. Sends to Radarr/Sonarr
5. Monitors download progress
6. Notifies on availability

## 10. Performance Optimization
**Application Settings**:
```yaml
General:
  - Default Permissions: Request only
  - Auto-approve: Trusted users
  - Request Limits: 10/week
  - Season requests: Allowed

Notifications:
  - Email: SMTP configured
  - Discord: Webhook
  - Telegram: Bot token
  - Push: Web push

Discovery:
  - Trending refresh: Daily
  - Popular refresh: Daily
  - Recommendations: Enabled
```

**Caching**:
- Image cache: 7 days
- API cache: 1 hour
- Search cache: 15 minutes

**Resource Recommendations**:
- Memory: 256-512MB
- CPU: 1-2 cores
- Storage: 1-5GB
- Network: 10-50 Mbps

## User Experience Features
**Discovery Sources**:
- Trending movies/shows
- Popular content
- Recommendations
- Recently requested
- Upcoming releases

**Request Management**:
```yaml
User Quotas:
  - Movies: 5/week
  - TV Seasons: 2/week
  - Auto-approve: Power users

Quality Overrides:
  - 4K requests: Admin only
  - Profile selection: Advanced users
```

## Authentication Methods
**Jellyfin SSO**:
```yaml
Primary:
  - Use Jellyfin users
  - Import permissions
  - Sync library access
```

**Local Authentication**:
```yaml
Fallback:
  - Local admin account
  - Emergency access
  - API user accounts
```

## Notification Configuration
**Email (SMTP)**:
```yaml
SMTP:
  - Host: smtp.gmail.com
  - Port: 587
  - Encryption: STARTTLS
  - From: notifications@domain.com
```

**Discord Integration**:
```yaml
Webhook:
  - URL: Discord webhook
  - Mentions: @requesters
  - Embed: Rich content
```

## API Security
**Rate Limiting**:
```nginx
# Nginx rate limiting
limit_req_zone $binary_remote_addr zone=jellyseerr:10m rate=10r/s;

location / {
    limit_req zone=jellyseerr burst=20;
    proxy_pass http://jellyseerr:5055;
}
```

## Monitoring Points
- Request queue
- Approval pending
- Failed requests
- API response times
- User activity
- Download progress
- Notification delivery
- Cache hit rates

## Database Management
**SQLite Database**:
- Regular backups
- Request history
- User preferences
- Cache data

## Backup Strategy
- Database daily
- Configuration weekly
- User settings
- Request history
- Notification templates

## Migration Notes
1. Deploy in dual-network mode
2. Configure Jellyfin auth
3. Connect to Radarr/Sonarr
4. Set up user permissions
5. Configure notifications
6. Set up reverse proxy
7. Test request workflow
8. Configure discovery sources
9. Set user quotas
10. Enable external access
11. Test approval workflow
12. Monitor request patterns