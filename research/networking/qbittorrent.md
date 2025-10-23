# qBittorrent - Networking Analysis

## 1. Current Network Configuration Analysis
- **Network Mode**: service:gluetun (shares Gluetun's network)
- **No Direct IP**: Uses Gluetun's IP (172.21.0.2)
- **Port Access**: Through Gluetun's port 8080
- **VPN Protection**: All traffic routed through Gluetun
- **Volume Mounts**: Downloads directory

## 2. Optimal Network Placement
**Recommended Zone**: Download VLAN (through VPN)
- Must remain behind Gluetun VPN
- No direct network access
- Isolated from trusted networks
- Access only through VPN tunnel

## 3. Reverse Proxy Requirements
**Configuration**:
- URL: `https://torrents.domain.com` (internal only)
- **Should NOT be exposed externally**
- Access through VPN or Tailscale only
- Headers Required:
  ```nginx
  X-Forwarded-For
  X-Real-IP
  X-Forwarded-Proto
  X-Forwarded-Host
  ```

## 4. Security Considerations for External Exposure
**Critical Security Requirements**:
- **NEVER expose directly to internet**
- Must remain behind VPN at all times
- Strong WebUI password
- Disable UPnP
- IP whitelisting for WebUI
- Monitor for unauthorized access
- Regular security updates
- Disable unnecessary features

**Download Security**:
- Scan downloads for malware
- Isolate download directory
- Use separate user/group for files
- Set proper file permissions

## 5. Port Management and Conflicts
**Ports Used**:
- 8080/tcp: WebUI (through Gluetun)
- Dynamic/tcp,udp: BitTorrent (VPN port forward)

**Port Configuration**:
- WebUI port configurable
- Torrent port from VPN provider
- Must match Gluetun's FIREWALL_VPN_INPUT_PORTS

## 6. DNS and Service Discovery
**DNS Configuration**:
- Uses Gluetun's DNS (VPN provider)
- No local DNS resolution
- Tracker resolution through VPN

## 7. VLAN Segmentation Recommendations
**Network Isolation**:
- Inherits Gluetun's network placement
- No direct VLAN assignment
- Access controlled through Gluetun

## 8. Firewall Rules Required
**Controlled by Gluetun**:
- No direct firewall rules
- All traffic through VPN tunnel
- Kill switch prevents leaks

## 9. Inter-Service Communication Requirements
**Service Interactions**:
- **Prowlarr**: Receives torrents via API
- **Radarr/Sonarr/Lidarr**: Send download requests
- **Jellyfin**: Reads completed downloads
- **File System**: Writes to shared download path

**API Integration**:
```yaml
# In Radarr/Sonarr settings
Download Client:
  Host: gluetun
  Port: 8080
  Username: admin
  Password: ${QBITTORRENT_PASSWORD}
```

## 10. Performance Optimization
**Download Optimizations**:
```ini
# qBittorrent settings
[Preferences]
# Connection
Connection\GlobalDLLimit=0
Connection\GlobalUPLimit=10240
Connection\PortRangeMin=${VPN_PORT}
Connection\UPnP=false

# BitTorrent
Bittorrent\DHT=true
Bittorrent\PeX=true
Bittorrent\LSD=false
Bittorrent\MaxConnecs=200
Bittorrent\MaxConnecsPerTorrent=50
Bittorrent\MaxUploadsPerTorrent=4

# Queueing
Queueing\MaxActiveDownloads=5
Queueing\MaxActiveTorrents=10
Queueing\MaxActiveUploads=5

# Disk IO
Downloads\PreAllocation=true
Downloads\SavePath=/downloads/complete
Downloads\TempPath=/downloads/incomplete
```

**Resource Recommendations**:
- Network bandwidth: Limited by VPN
- Disk I/O: 100+ IOPS recommended
- Memory: 512MB-2GB
- CPU: 1-2 cores
- Storage: Fast SSD for incomplete

## Advanced Configuration
**Categories Setup**:
```
movies → /downloads/complete/movies
tv → /downloads/complete/tv
music → /downloads/complete/music
books → /downloads/complete/books
```

**Automation Rules**:
- Auto-pause at ratio 1.0 (private trackers)
- Remove completed after seeding
- Move completed to category folder
- RSS auto-download rules

## Security Hardening
**WebUI Security**:
```ini
[Preferences]
WebUI\Enabled=true
WebUI\Address=0.0.0.0
WebUI\Port=8080
WebUI\Username=admin
WebUI\Password_PBKDF2=<hash>
WebUI\LocalHostAuth=false
WebUI\AuthSubnetWhitelist=172.21.0.0/16,172.20.0.0/16
WebUI\BanDuration=3600
WebUI\SessionTimeout=3600
WebUI\ClickjackingProtection=true
WebUI\CSRFProtection=true
WebUI\SecureCookie=true
WebUI\HostHeaderValidation=true
```

## Monitoring Points
- Download/upload speeds
- Active/queued torrents
- Disk space usage
- VPN connection status
- Ratio statistics
- Failed downloads
- API response times

## Integration with Arr Stack
**Radarr/Sonarr Configuration**:
1. Add qBittorrent as download client
2. Configure categories for organization
3. Set up completed download handling
4. Configure remote path mappings
5. Test connection through Gluetun

## Backup Considerations
- Backup configuration files
- Backup torrent session data
- Document category mappings
- Save RSS feed configurations
- Export IP filter lists

## Migration Notes
1. Install through Gluetun network
2. Configure WebUI password immediately
3. Set up categories for organization
4. Configure connection limits
5. Import previous settings if available
6. Test VPN port forwarding
7. Configure Prowlarr integration
8. Set up Radarr/Sonarr connections
9. Test download with legal torrent
10. Verify no IP leaks
11. Configure automatic management
12. Set up monitoring alerts