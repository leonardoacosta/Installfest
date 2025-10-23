# Jellyfin - Networking Analysis

## 1. Current Network Configuration Analysis
- **Container Networks**: Dual-homed (homelab + media bridges)
  - homelab: 172.20.0.96
  - media: 172.21.0.96
- **Port Mappings**:
  - 8096:8096/tcp (Web Interface/API)
  - 8920:8920/tcp (HTTPS - optional)
  - 7359:7359/udp (Client discovery)
  - 1900:1900/udp (DLNA)
- **Volume Mounts**: Media directories (read-only)
- **Hardware**: Potential GPU/QuickSync for transcoding

## 2. Optimal Network Placement
**Recommended Zone**: Media VLAN with DMZ Access
- Primary placement in Media VLAN (e.g., VLAN 40)
- DMZ interface for external streaming
- Separate from download/torrent services
- High bandwidth network segment required

## 3. Reverse Proxy Requirements
**Configuration**:
- Primary URL: `https://jellyfin.domain.com`
- Internal URL: `https://media.local`
- WebSocket Support: REQUIRED (for sync play)
- Headers Required:
  ```nginx
  X-Real-IP
  X-Forwarded-For
  X-Forwarded-Proto
  X-Forwarded-Protocol
  X-Forwarded-Host
  X-Forwarded-Port
  Host
  ```
- Special configurations:
  ```nginx
  # Large body size for media uploads
  client_max_body_size 20G;

  # Longer timeouts for transcoding
  proxy_connect_timeout 600;
  proxy_send_timeout 600;
  proxy_read_timeout 600;

  # Disable buffering for streaming
  proxy_buffering off;
  proxy_request_buffering off;
  ```

## 4. Security Considerations for External Exposure
**Critical Security Requirements**:
- Strong user authentication (consider LDAP/SSO)
- Limit concurrent streams per user
- Disable password resets from external
- IP-based access control for admin
- Regular security updates
- Monitor for unusual streaming patterns
- Implement fail2ban for brute force
- Consider using Jellyfin's built-in SSL
- Restrict transcoding to prevent DoS
- Audit user access logs

## 5. Port Management and Conflicts
**Required Ports**:
- 8096/tcp: Main HTTP interface (REQUIRED)
- 8920/tcp: HTTPS interface (optional but recommended)
- 7359/udp: Auto-discovery (LAN only)
- 1900/udp: DLNA (optional, LAN only)

**Potential Conflicts**:
- 1900/udp: Conflicts with Home Assistant SSDP
- Solution: Disable DLNA or use VLAN separation

**Additional Ports (if enabled)**:
- 10000-10100/udp: RTP/RTSP streaming
- 1905/tcp: Live TV HDHomeRun

## 6. DNS and Service Discovery
**DNS Requirements**:
- Public DNS: `jellyfin.domain.com`
- Local DNS: `media.local`
- Chromecast discovery (mDNS)
- DLNA discovery (SSDP)

**Service Discovery**:
- mDNS for local client apps
- SSDP for DLNA devices
- Jellyfin app auto-discovery

## 7. VLAN Segmentation Recommendations
**Proposed VLAN Structure**:
- **VLAN 40 (Media)**: Jellyfin primary
- **VLAN 20 (Users)**: Client access
- **VLAN 30 (IoT)**: Smart TV/streaming device access
- **VLAN 41 (Downloads)**: Read-only media access

**Inter-VLAN Rules**:
- Users → Media: Allow (port 8096)
- IoT → Media: Allow (port 8096, restricted)
- Downloads → Media: Deny (one-way mount)
- Media → Internet: Allow (metadata fetching)

## 8. Firewall Rules Required
**Inbound Rules**:
```
# Web interface from Users
Allow TCP 8096,8920 from 192.168.20.0/24 to Jellyfin

# Streaming from IoT devices
Allow TCP 8096 from 192.168.30.0/24 to Jellyfin

# Discovery protocols (LAN only)
Allow UDP 7359 from 192.168.20.0/24 to Jellyfin
Allow UDP 1900 from 192.168.30.0/24 to Jellyfin

# External access through reverse proxy
Allow TCP 443 from ReverseProxy to Jellyfin

# Block direct external access
Deny All from WAN to Jellyfin
```

**Outbound Rules**:
```
# Metadata providers
Allow TCP 443 from Jellyfin to Any

# Subtitle downloads
Allow TCP 443 from Jellyfin to Any

# Plugin repository
Allow TCP 443 from Jellyfin to Any

# DNS
Allow UDP 53 from Jellyfin to DNS_Server

# NTP
Allow UDP 123 from Jellyfin to Any
```

## 9. Inter-Service Communication Requirements
**Direct Communication Needs**:
- **Sonarr/Radarr**: Library updates via API
- **Bazarr**: Subtitle management
- **Jellyseerr**: User request management
- **Nginx Proxy Manager**: Reverse proxy
- **Home Assistant**: Media player integration

**Storage Requirements**:
- Read-only access to media library
- Write access to metadata/cache directory
- Transcoding temporary directory (high-speed recommended)

## 10. Performance Optimization
**Network Optimizations**:
- Enable HTTP/2 for web interface
- Use CDN for static assets (posters, etc.)
- Implement bandwidth throttling per user
- QoS for streaming traffic priority
- Consider multiple network interfaces for load balancing
- Use direct play when possible (avoid transcoding)

**Transcoding Optimizations**:
- Hardware acceleration (GPU/QuickSync)
- Pre-transcoding for common formats
- Transcoding cache on fast storage
- Limit simultaneous transcodes

**Resource Recommendations**:
- Network bandwidth:
  - 4K streaming: 25-50 Mbps per stream
  - 1080p: 8-15 Mbps per stream
  - 720p: 3-5 Mbps per stream
- Storage IOPS: 100+ for smooth playback
- CPU: 2000 PassMark per 1080p transcode
- Memory: 2-4GB base + 1GB per transcode
- Cache: 10-50GB for transcoding temp

## Client-Specific Considerations
**Different Client Requirements**:
- **Web browsers**: Full feature support
- **Mobile apps**: May require transcoding
- **Smart TVs**: Limited codec support
- **Roku/Fire TV**: Specific port requirements
- **Kodi integration**: Direct file access needed

## CDN Integration
**For External Access**:
- CloudFlare for static content
- Bandwidth optimization
- DDoS protection
- Geographic content delivery

## Migration Notes
1. Test bandwidth requirements with expected load
2. Configure hardware acceleration
3. Set up proper media permissions (read-only)
4. Configure reverse proxy with streaming optimizations
5. Test various client types
6. Set up user accounts and permissions
7. Configure metadata providers
8. Test external streaming with bandwidth limits
9. Monitor transcoding performance
10. Document codec support per client type
11. Set up automated library scans
12. Configure backup for Jellyfin database