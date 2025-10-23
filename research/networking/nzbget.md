# NZBGet - Networking Analysis

## 1. Current Network Configuration Analysis
- **Network Mode**: service:gluetun (shares Gluetun's network)
- **No Direct IP**: Uses Gluetun's IP (172.21.0.2)
- **Port Access**: Through Gluetun's port 6789
- **VPN Protection**: All traffic routed through Gluetun
- **Volume Mounts**: Downloads directory

## 2. Optimal Network Placement
**Recommended Zone**: Download VLAN (through VPN)
- Must remain behind Gluetun VPN
- Usenet traffic protection
- No direct network access
- Isolated from trusted networks

## 3. Reverse Proxy Requirements
**Configuration**:
- URL: `https://nzbget.domain.com` (internal only)
- **Should NOT be exposed externally**
- Access through VPN or Tailscale only
- Headers Required:
  ```nginx
  X-Forwarded-For
  X-Real-IP
  X-Forwarded-Proto
  Authorization (for API)
  ```

## 4. Security Considerations for External Exposure
**Critical Security Requirements**:
- **NEVER expose directly to internet**
- Must remain behind VPN
- Strong username/password
- SSL connections to news servers
- IP whitelisting for WebUI
- Monitor bandwidth usage
- Regular security updates

## 5. Port Management and Conflicts
**Ports Used**:
- 6789/tcp: WebUI and API (through Gluetun)

**News Server Connections**:
- 563/tcp: NNTP over SSL (standard)
- 443/tcp: NNTP over SSL (alternate)
- 119/tcp: NNTP (unencrypted - avoid)

## 6. DNS and Service Discovery
**DNS Configuration**:
- Uses Gluetun's DNS (VPN provider)
- News server hostname resolution
- No local DNS needed

## 7. VLAN Segmentation Recommendations
**Network Isolation**:
- Inherits Gluetun's network placement
- No direct VLAN assignment
- Complete isolation via VPN

## 8. Firewall Rules Required
**Controlled by Gluetun**:
- No direct firewall rules
- All traffic through VPN tunnel
- Kill switch prevents leaks

## 9. Inter-Service Communication Requirements
**Service Interactions**:
- **Prowlarr**: Receives NZB files
- **Radarr/Sonarr/Lidarr**: Send download requests
- **Jellyfin**: Reads completed downloads
- **File System**: Writes to download path

**API Integration**:
```yaml
# In Radarr/Sonarr settings
Download Client:
  Type: NZBGet
  Host: gluetun
  Port: 6789
  Username: nzbget
  Password: ${NZBGET_PASSWORD}
  Use SSL: No (internal)
```

## 10. Performance Optimization
**Application Settings**:
```ini
# nzbget.conf optimizations
# CONNECTION
ArticleCache=1000
WriteBuffer=1024
CrcCheck=yes
DirectWrite=yes

# NEWS-SERVERS
Server1.Connections=30
Server1.Cipher=TLS1.3
Server1.Encryption=yes
Server1.Port=563

# DOWNLOAD QUEUE
SimultaneousDownloads=3
ArticleTimeout=60
UrlTimeout=60
RemoteTimeout=90

# PERFORMANCE
ParCheck=auto
ParRepair=yes
ParQuick=yes
ParBuffer=256
ParThreads=4
```

**Resource Recommendations**:
- Network bandwidth: 50-1000 Mbps (provider dependent)
- Memory: 512MB-2GB
- CPU: 2-4 cores (for par2 repair)
- Storage: Fast SSD for temp files
- Cache: 1-2GB recommended

## News Server Configuration
**Primary Server**:
```yaml
Server1:
  - Host: news.provider.com
  - Port: 563 (SSL)
  - Connections: 30-50
  - Username: Required
  - Password: Required
  - Encryption: Yes
  - Priority: 0
```

**Backup Server**:
```yaml
Server2:
  - Host: backup.provider.com
  - Port: 563
  - Connections: 10-20
  - Priority: 1 (lower)
```

## Categories Setup
```yaml
Categories:
  - Movies: /downloads/complete/movies
  - Series: /downloads/complete/tv
  - Music: /downloads/complete/music
  - Software: /downloads/complete/software
```

## Post-Processing
**Scripts**:
```bash
# VideoSort script for organization
# Notify scripts for alerts
# Cleanup scripts for maintenance
```

**Unpack Settings**:
- Auto-unrar: Yes
- Delete RAR files: Yes
- Cleanup disk: Yes

## Security Configuration
**Connection Security**:
```ini
# Force SSL
Server1.Encryption=yes
Server1.Cipher=TLS1.3
ControlPort=6789
SecureControl=no  # Behind VPN
```

**Access Control**:
```ini
ControlUsername=nzbget
ControlPassword=${SECURE_PASSWORD}
AddUsername=
AddPassword=
```

## Monitoring Points
- Download speed
- Article cache hit rate
- Completion percentage
- Failed downloads
- Par2 repair statistics
- Server connection health
- Bandwidth usage
- Queue status

## Integration with Indexers
**Supported Indexers**:
- NZBgeek
- NZBFinder
- DrunkenSlug
- NZBPlanet
- Newsgroup.ninja

## Retention and Completion
**Strategies**:
- Multiple servers for redundancy
- Block account + Unlimited
- Different backbones
- Retention periods vary

## Troubleshooting
**Common Issues**:
1. **Incomplete downloads**: Add backup server
2. **Slow speeds**: Increase connections
3. **High CPU**: Reduce ParThreads
4. **SSL errors**: Update certificates
5. **Connection drops**: Check VPN

## Backup Considerations
- Configuration file backup
- Server settings
- Category mappings
- Script configurations
- Download history

## Migration Notes
1. Install through Gluetun
2. Configure news servers
3. Set up SSL connections
4. Configure categories
5. Add to Radarr/Sonarr
6. Test with small NZB
7. Configure post-processing
8. Set up par2 settings
9. Test full workflow
10. Monitor completion rates
11. Optimize connections
12. Document server details