# Samba - Networking Analysis

## 1. Current Network Configuration Analysis
- **Container Network**: homelab (bridge)
- **IP Address**: 172.20.0.45 (static)
- **Port Mappings**:
  - 445:445/tcp (SMB/CIFS)
  - 139:139/tcp (NetBIOS Session)
- **Volume Mounts**: Media and backup directories
- **User Management**: Basic auth with configurable users

## 2. Optimal Network Placement
**Recommended Zone**: Storage VLAN (Internal)
- Should be in dedicated Storage/NAS VLAN (e.g., VLAN 60)
- No direct internet access needed
- High bandwidth network segment
- Close to media services for performance

## 3. Reverse Proxy Requirements
**Not Applicable**:
- SMB/CIFS protocol not HTTP-based
- Cannot be reverse proxied
- Direct network access required
- Consider VPN for remote access

**Alternative Remote Access**:
- Tailscale for secure SMB access
- VPN tunnel for remote mounting
- WebDAV as HTTP alternative (separate service)

## 4. Security Considerations for External Exposure
**Critical Security Requirements**:
- **NEVER expose SMB directly to internet**
- Use SMB3 encryption (minimum SMB2)
- Disable SMB1 completely
- Strong password policy
- Limit concurrent connections
- IP-based access control
- Regular security updates
- Monitor for ransomware patterns
- Implement file versioning/snapshots

**Authentication Security**:
- Consider Active Directory integration
- Use dedicated service accounts
- Rotate passwords regularly
- Audit file access logs

## 5. Port Management and Conflicts
**Required Ports**:
- 445/tcp: SMB over TCP (modern)
- 139/tcp: NetBIOS session (legacy)
- 137/udp: NetBIOS name service (optional)
- 138/udp: NetBIOS datagram (optional)

**Potential Conflicts**:
- Ports 445/139 may conflict with host OS
- Solution: Use different ports or container isolation

## 6. DNS and Service Discovery
**Name Resolution**:
- NetBIOS name broadcast (legacy)
- DNS entry: `nas.local` or `samba.local`
- mDNS/Avahi for discovery
- WINS server (if needed for legacy)

**Service Discovery**:
- Network neighborhood browsing
- WS-Discovery for Windows 10+
- Avahi/Bonjour for macOS
- Manual mounting for Linux

## 7. VLAN Segmentation Recommendations
**Proposed VLAN Structure**:
- **VLAN 60 (Storage)**: Samba placement
- **VLAN 20 (Users)**: Read/write access
- **VLAN 40 (Media)**: Read-only access
- **VLAN 41 (Downloads)**: Write access for downloads

**Access Matrix**:
```
Users → Storage: Allow (445, 139)
Media → Storage: Allow (445, read-only)
Downloads → Storage: Allow (445, write to specific shares)
IoT → Storage: Deny
Internet → Storage: Deny
```

## 8. Firewall Rules Required
**Inbound Rules**:
```
# SMB from Users VLAN
Allow TCP 445,139 from 192.168.20.0/24 to Samba

# SMB from Media VLAN (read-only shares)
Allow TCP 445 from 192.168.40.0/24 to Samba

# SMB from Downloads VLAN (specific shares)
Allow TCP 445 from 192.168.41.0/24 to Samba

# NetBIOS discovery (optional)
Allow UDP 137,138 from 192.168.20.0/24 to Samba

# Block all other access
Deny All from Any to Samba
```

**Outbound Rules**:
```
# DNS resolution
Allow UDP 53 from Samba to DNS_Server

# LDAP/AD if integrated
Allow TCP 389,636 from Samba to DC

# NTP for Kerberos
Allow UDP 123 from Samba to NTP_Server
```

## 9. Inter-Service Communication Requirements
**Storage Provider For**:
- **Jellyfin**: Media library (read-only)
- **Sonarr/Radarr**: Media management (read/write)
- **qBittorrent**: Download destination
- **Backup Services**: Backup storage
- **Home Assistant**: Config backups

**Access Patterns**:
- High read throughput for media
- Burst writes for downloads
- Sequential access for backups
- Random access for documents

## 10. Performance Optimization
**Protocol Optimizations**:
```ini
# smb.conf optimizations
[global]
# Performance
socket options = TCP_NODELAY IPTOS_LOWDELAY SO_RCVBUF=131072 SO_SNDBUF=131072
use sendfile = yes
min receivefile size = 16384
aio read size = 16384
aio write size = 16384
write cache size = 262144

# SMB3 Multi-Channel
server multi channel support = yes

# Disable unnecessary features
disable netbios = yes
disable spoolss = yes
```

**Network Optimizations**:
- Enable jumbo frames (MTU 9000)
- Use SMB3 multichannel
- NIC teaming for throughput
- QoS for storage traffic

**Resource Recommendations**:
- Network bandwidth: 1-10 Gbps recommended
- Concurrent users: 10-50
- Memory: 1-2GB for caching
- CPU: 2-4 cores
- IOPS requirement: 500+ for good performance

## Share Configuration Examples
```ini
[Media]
   path = /media
   browseable = yes
   read only = yes
   guest ok = no
   valid users = @media
   force group = media

[Downloads]
   path = /downloads
   browseable = yes
   read only = no
   guest ok = no
   valid users = @downloaders
   force group = downloads
   create mask = 0664
   directory mask = 0775

[Backups]
   path = /backups
   browseable = no
   read only = no
   guest ok = no
   valid users = backup_user
   create mask = 0600
   directory mask = 0700
```

## Security Hardening
```ini
[global]
# Security
server min protocol = SMB2
server max protocol = SMB3
client min protocol = SMB2
client max protocol = SMB3
disable netbios = yes
smb encrypt = required
server signing = mandatory
restrict anonymous = 2
map to guest = never
null passwords = no
```

## Monitoring and Logging
**Metrics to Monitor**:
- Connection count
- Transfer rates
- Failed authentication attempts
- File locks
- Share usage
- Protocol versions in use

**Logging Configuration**:
```ini
[global]
log file = /var/log/samba/log.%m
max log size = 1000
log level = 1 auth:3 winbind:3
```

## Backup Considerations
- Snapshot shares before backup
- Use VSS for open file handling
- Consider ZFS for snapshots
- Regular share permission audits
- Document share structure

## Migration Notes
1. Audit current share usage
2. Plan share structure and permissions
3. Create user accounts and groups
4. Configure SMB3 and disable SMB1
5. Test with single client first
6. Migrate shares incrementally
7. Update client mount points
8. Configure monitoring
9. Document share access matrix
10. Set up automated backups
11. Test performance with large files
12. Implement snapshot schedule