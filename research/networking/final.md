# Comprehensive Homelab Network Architecture - Final Design

## Executive Summary
This document presents the optimal network architecture for a secure, performant, and maintainable homelab environment. The design implements defense-in-depth with proper VLAN segmentation, strict firewall rules, and service isolation based on security requirements and functional needs.

## 1. Network Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 INTERNET                                     │
└────────────────────┬───────────────────────────────────┬────────────────────┘
                     │                                   │
                     │                                   │
              ┌──────▼──────┐                    ┌──────▼──────┐
              │   FIREWALL  │                    │  TAILSCALE  │
              │  (pfSense)  │                    │   GATEWAY   │
              └──────┬──────┘                    └──────┬──────┘
                     │                                   │
        ┌────────────┴───────────────────────────────────┴────────────┐
        │                      CORE SWITCH (Layer 3)                   │
        └────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┘
             │      │      │      │      │      │      │      │
             │      │      │      │      │      │      │      │
     ┌───────▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼────┐
     │ VLAN 5   │ │V10 │ │V20 │ │V25 │ │V30 │ │V40 │ │V41 │ │V100  │
     │DNS/Infra │ │MGT │ │USR │ │SEC │ │IoT │ │MED │ │DL  │ │DMZ   │
     └───────┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └─┬────┘
             │      │      │      │      │      │      │      │
   Services: │      │      │      │      │      │      │      │
   ┌─────────┴───┐ ┌┴───┐ ┌┴───┐ ┌┴───┐ ┌┴───┐ ┌┴───┐ ┌┴───┐ ┌┴─────┐
   │AdGuard Home │ │SSH │ │Web │ │VW  │ │HA  │ │JF  │ │GLU │ │ NPM  │
   │             │ │GUI │ │Usr │ │    │ │    │ │RDR │ │QB  │ │      │
   └─────────────┘ └────┘ └────┘ └────┘ └────┘ │SNR │ │PRW │ └──────┘
                                               │LDR │ │NZB │
                                               │BZR │ │BYP │
                                               │JSR │ └────┘
                                               └────┘
```

## 2. VLAN Segmentation Strategy

### VLAN Assignments

| VLAN ID | Name | Purpose | IP Range | Services |
|---------|------|---------|----------|----------|
| 5 | Infrastructure | Critical DNS/DHCP | 192.168.5.0/24 | AdGuard Home |
| 10 | Management | Admin access | 192.168.10.0/24 | SSH, Admin panels |
| 20 | Users | Client devices | 192.168.20.0/24 | Workstations, phones |
| 25 | Security | Sensitive services | 192.168.25.0/24 | Vaultwarden |
| 30 | IoT | Smart home devices | 192.168.30.0/24 | Home Assistant, IoT |
| 40 | Media | Media services | 192.168.40.0/24 | Jellyfin, *arr apps |
| 41 | Downloads | Isolated downloads | 192.168.41.0/24 | Gluetun, qBittorrent |
| 50 | Compute | AI/Processing | 192.168.50.0/24 | Ollama, WebUI |
| 60 | Storage | File sharing | 192.168.60.0/24 | Samba |
| 100 | DMZ | Internet-facing | 192.168.100.0/24 | Nginx Proxy Manager |

### Inter-VLAN Communication Matrix

```
From\To    | INFRA | MGMT | USER | SEC | IoT | MEDIA | DL | COMP | STOR | DMZ | WAN
-----------|-------|------|------|-----|-----|-------|----|----|------|-----|-----
INFRA (5)  |   ✓   |  ✓   |  ✓   |  ✓  |  ✓  |   ✓   | ✓  |  ✓  |  ✓   |  ✓  |  ✓
MGMT (10)  |   ✓   |  ✓   |  ✓   |  ✓  |  ✓  |   ✓   | ✓  |  ✓  |  ✓   |  ✓  |  ✓
USER (20)  |   ✓   |  ✗   |  ✓   |  ✓  |  L  |   ✓   | ✗  |  ✓  |  ✓   |  ✗  |  ✓
SEC (25)   |   ✓   |  ✗   |  ✗   |  ✓  |  ✗  |   ✗   | ✗  |  ✗  |  ✗   |  ✗  |  L
IoT (30)   |   ✓   |  ✗   |  ✗   |  ✗  |  ✓  |   L   | ✗  |  ✗  |  ✗   |  ✗  |  L
MEDIA (40) |   ✓   |  ✗   |  ✗   |  ✗  |  ✗  |   ✓   | L  |  ✗  |  ✓   |  ✗  |  ✓
DL (41)    |   ✓   |  ✗   |  ✗   |  ✗  |  ✗  |   L   | ✓  |  ✗  |  L   |  ✗  | VPN
COMP (50)  |   ✓   |  ✗   |  ✗   |  ✗  |  ✗  |   ✗   | ✗  |  ✓  |  ✗   |  ✗  |  ✓
STOR (60)  |   ✓   |  ✗   |  ✗   |  ✗  |  ✗  |   ✓   | ✓  |  ✗  |  ✓   |  ✗  |  ✗
DMZ (100)  |   ✓   |  ✗   |  ✗   |  ✗  |  ✗  |   ✓   | ✓  |  ✓  |  ✗   |  ✓  |  ✓

Legend: ✓ = Allow, ✗ = Deny, L = Limited (specific ports), VPN = Via VPN only
```

## 3. Port Allocation Table

### Critical Services

| Service | Port(s) | Protocol | VLAN | External | Notes |
|---------|---------|----------|------|----------|-------|
| SSH | 22 | TCP | 10 | No | Management only |
| DNS | 53 | TCP/UDP | 5 | No | Internal only |
| HTTP | 80 | TCP | 100 | Yes | Redirect to HTTPS |
| HTTPS | 443 | TCP | 100 | Yes | Reverse proxy |
| DoT | 853 | TCP | 5 | Limited | DNS over TLS |

### Application Services

| Service | Port(s) | Protocol | VLAN | External | Reverse Proxy |
|---------|---------|----------|------|----------|---------------|
| NPM Admin | 81 | TCP | 100 | No | N/A |
| AdGuard | 82, 8443 | TCP | 5 | No | No |
| Vaultwarden | 8222, 3012 | TCP | 25 | Yes | Yes (HTTPS only) |
| Home Assistant | 8123 | TCP | 30 | Yes | Yes |
| Jellyfin | 8096, 8920 | TCP | 40 | Yes | Yes |
| Jellyseerr | 5055 | TCP | 40 | Yes | Yes |
| Radarr | 7878 | TCP | 40 | Limited | Yes |
| Sonarr | 8989 | TCP | 40 | Limited | Yes |
| Lidarr | 8686 | TCP | 40 | Limited | Yes |
| Bazarr | 6767 | TCP | 40 | No | No |
| Prowlarr | 9696 | TCP | 41 | No | No (VPN) |
| qBittorrent | 8080 | TCP | 41 | No | No (VPN) |
| NZBGet | 6789 | TCP | 41 | No | No (VPN) |
| Ollama | 11434 | TCP | 50 | No | No |
| Ollama WebUI | 8081 | TCP | 50 | Limited | Yes |
| Samba | 445, 139 | TCP | 60 | No | No |
| Glance | 8085 | TCP | 20 | Limited | Yes |

## 4. Reverse Proxy Configuration Matrix

### Public-Facing Services (Priority 1)

| Service | URL | Auth | Headers | Special Config |
|---------|-----|------|---------|----------------|
| Vaultwarden | vault.domain.com | Built-in | WebSocket | HTTPS only, Large body |
| Jellyfin | media.domain.com | Built-in | WebSocket | Streaming, No buffering |
| Jellyseerr | request.domain.com | Jellyfin SSO | Standard | Rate limiting |
| NPM | proxy.domain.com | Built-in | Standard | IP whitelist |

### Internal Services (Priority 2)

| Service | URL | Auth | Access Control |
|---------|-----|------|----------------|
| Home Assistant | ha.domain.com | Built-in + 2FA | Geo-block, Fail2ban |
| Radarr | radarr.domain.com | Basic + API | IP whitelist |
| Sonarr | sonarr.domain.com | Basic + API | IP whitelist |
| Ollama WebUI | ai.domain.com | Basic | Internal only |

### Never Expose

| Service | Reason | Alternative Access |
|---------|--------|-------------------|
| AdGuard Admin | Security | VPN/Tailscale |
| Prowlarr | VPN-protected | VPN/Tailscale |
| qBittorrent | VPN-protected | VPN/Tailscale |
| NZBGet | VPN-protected | VPN/Tailscale |
| Samba | Protocol | VPN/Tailscale |
| Gluetun | Infrastructure | N/A |

## 5. Security Zones and Firewall Rules

### Zone Definitions

#### Zone 1: Untrusted (Internet/DMZ)
- **VLAN 100**: DMZ
- **Services**: Nginx Proxy Manager
- **Policy**: Default deny, explicit allow

#### Zone 2: Semi-Trusted (User/IoT)
- **VLAN 20**: Users
- **VLAN 30**: IoT
- **Policy**: Limited inter-VLAN, internet access

#### Zone 3: Trusted (Services)
- **VLAN 40**: Media
- **VLAN 50**: Compute
- **VLAN 60**: Storage
- **Policy**: Service-specific rules

#### Zone 4: Secure (Critical)
- **VLAN 5**: Infrastructure
- **VLAN 25**: Security
- **Policy**: Minimal access, high monitoring

#### Zone 5: Isolated (Downloads)
- **VLAN 41**: Downloads
- **Policy**: VPN-only egress

### Firewall Rule Priority

```
1. Block all inter-VLAN by default
2. Allow established connections
3. Allow DNS (VLAN 5) from all VLANs
4. Allow specific service ports per matrix
5. Allow management access from VLAN 10
6. Block all remaining traffic
7. Log denied connections
```

## 6. DNS Strategy

### Primary DNS Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Clients   │────▶│  AdGuard    │────▶│  Upstream   │
│  All VLANs  │     │   Home      │     │   DNS       │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Local DNS  │
                    │   Records   │
                    └─────────────┘
```

### DNS Records

#### Public DNS
```
A Records:
*.domain.com → Public IP (or Cloudflare proxy)

CNAME Records:
vault.domain.com → domain.com
media.domain.com → domain.com
request.domain.com → domain.com
```

#### Internal DNS
```
A Records:
adguard.local → 192.168.5.53
vault.local → 192.168.25.22
jellyfin.local → 192.168.40.96
ha.local → 192.168.30.123
nas.local → 192.168.60.45

PTR Records:
192.168.5.53 → adguard.local
(etc. for all services)
```

## 7. Implementation Priority

### Phase 1: Foundation (Week 1)
1. **Configure VLANs** on switch/router
2. **Deploy AdGuard Home** (VLAN 5)
3. **Setup Nginx Proxy Manager** (VLAN 100)
4. **Configure basic firewall rules**
5. **Test DNS resolution**

### Phase 2: Security (Week 2)
1. **Deploy Vaultwarden** (VLAN 25)
2. **Configure SSL certificates**
3. **Implement Tailscale** gateway
4. **Setup fail2ban**
5. **Configure backup strategy**

### Phase 3: Media Services (Week 3)
1. **Move Jellyfin** to VLAN 40
2. **Setup Gluetun** VPN container
3. **Configure download stack** behind VPN
4. **Setup Jellyseerr** for requests
5. **Test media workflow**

### Phase 4: Automation (Week 4)
1. **Configure *arr apps** in VLAN 40
2. **Setup Prowlarr** indexers
3. **Configure Bazarr** subtitles
4. **Test automation workflow**
5. **Optimize performance**

### Phase 5: Additional Services (Week 5)
1. **Deploy Home Assistant** (VLAN 30)
2. **Setup Ollama** AI stack (VLAN 50)
3. **Configure Samba** shares (VLAN 60)
4. **Setup Glance** dashboard
5. **Final testing**

## 8. Migration Plan

### Pre-Migration Checklist
- [ ] Backup all service configurations
- [ ] Document current port mappings
- [ ] Export DNS records
- [ ] Save reverse proxy configurations
- [ ] Backup SSL certificates
- [ ] Document API keys and passwords
- [ ] Test backup restoration

### Migration Steps

#### Step 1: Network Preparation
```bash
# Create VLANs on router/switch
# Configure DHCP per VLAN
# Setup inter-VLAN routing
# Configure firewall zones
```

#### Step 2: Service Migration Order
1. **AdGuard Home** (critical - do first)
2. **Nginx Proxy Manager** (needed for others)
3. **Vaultwarden** (standalone, easy)
4. **Jellyfin** (test media access)
5. **Download Stack** (complex, do together)
6. **Arr Apps** (dependent on downloads)
7. **Home Assistant** (many integrations)
8. **Remaining Services**

#### Step 3: Per-Service Migration
```yaml
For each service:
  1. Stop container
  2. Backup data and config
  3. Update docker-compose with new network
  4. Adjust firewall rules
  5. Start container
  6. Test functionality
  7. Update DNS records
  8. Update reverse proxy
  9. Test external access
  10. Monitor for 24 hours
```

### Rollback Plan
- Keep original docker-compose.yml
- Maintain backup of all configs
- Document original network settings
- Test rollback procedure

## 9. Monitoring and Maintenance

### Key Metrics to Monitor

#### Network Level
- Inter-VLAN traffic patterns
- Bandwidth usage per VLAN
- Firewall deny logs
- DNS query statistics
- VPN connection status

#### Service Level
- Container health status
- API response times
- Failed authentication attempts
- Storage usage
- Error rates

### Maintenance Schedule

#### Daily
- Check service health
- Review security logs
- Monitor disk space

#### Weekly
- Update containers
- Check for security advisories
- Review firewall logs
- Test backups

#### Monthly
- Full backup verification
- Security audit
- Performance review
- Update documentation

## 10. Security Best Practices

### Network Security
1. **Default Deny** firewall policy
2. **Least Privilege** access control
3. **Network Segmentation** by function
4. **Encrypted Communications** where possible
5. **Regular Updates** for all services

### Service Security
1. **Strong Authentication** (2FA where possible)
2. **API Key Management** with rotation
3. **Rate Limiting** on all endpoints
4. **Fail2ban** for brute force protection
5. **Regular Backups** with encryption

### Monitoring Security
1. **Centralized Logging** for audit
2. **Anomaly Detection** for unusual patterns
3. **Alert Configuration** for critical events
4. **Regular Audits** of access logs
5. **Incident Response Plan** documented

## Conclusion

This comprehensive network architecture provides:
- **Security** through proper segmentation and access control
- **Performance** through optimized routing and placement
- **Maintainability** through clear documentation and standards
- **Scalability** through modular design and room for growth
- **Reliability** through redundancy and monitoring

The phased implementation approach ensures minimal disruption while building a robust, enterprise-grade homelab network infrastructure.