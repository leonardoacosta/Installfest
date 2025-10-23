# AdGuard Home - Networking Analysis

## 1. Current Network Configuration Analysis
- **Container Network**: homelab (bridge)
- **IP Address**: 172.20.0.53 (static - matching DNS port)
- **Port Mappings**:
  - 53:53/tcp,udp (DNS)
  - 82:82/tcp (Web interface, mapped from 80)
  - 8443:443/tcp (HTTPS web interface)
  - 3000:3000/tcp (Initial setup)
  - 853:853/tcp,udp (DNS-over-TLS/QUIC)
  - 8853:8853/udp (DNS-over-QUIC)
  - 784:784/udp (DNS-over-QUIC)
  - 5443:5443/tcp,udp (DNSCrypt)
- **Extensive port exposure**: Security concern

## 2. Optimal Network Placement
**Recommended Zone**: DMZ/DNS VLAN (Critical Infrastructure)
- Should be on dedicated DNS/Infrastructure VLAN (e.g., VLAN 5)
- Requires access from all VLANs for DNS resolution
- Critical infrastructure component
- Should not be directly exposed to internet

## 3. Reverse Proxy Requirements
**Configuration**:
- Admin Interface: `https://dns.domain.com` (internal only)
- DoH Endpoint: `https://dns.domain.com/dns-query`
- **NOT recommended for external exposure** (admin interface)
- DoH can be exposed with strict rate limiting
- Headers Required:
  ```
  X-Real-IP
  X-Forwarded-For
  X-Forwarded-Proto
  ```

## 4. Security Considerations for External Exposure
**Critical Security Requirements**:
- **Admin interface**: NEVER expose externally
- **DNS Service**: Use DoT/DoH for external clients only
- Implement strict rate limiting (10 queries/second per IP)
- Use fail2ban for abuse prevention
- Whitelist known client IPs where possible
- Enable DNSSEC validation
- Block DNS amplification attacks
- Regular blocklist updates
- Monitor for DNS tunneling attempts

## 5. Port Management and Conflicts
**Required Ports**:
- 53/tcp,udp: Standard DNS (REQUIRED)
- 80/443: Web interface (can be changed)
- 853/tcp: DNS-over-TLS (optional but recommended)
- 5443/tcp,udp: DNSCrypt (optional)
- 784/udp, 8853/udp: DNS-over-QUIC (optional)

**Potential Conflicts**:
- Port 53: May conflict with system DNS resolver
- Port 80/443: Conflicts with Nginx Proxy Manager
- Solution: Use different ports for web interface (82, 8443)

## 6. DNS and Service Discovery
**DNS Configuration**:
- Acts as primary DNS server for entire network
- Local domain: `.local` or custom domain
- Upstream DNS servers: Cloudflare (1.1.1.1), Quad9 (9.9.9.9)
- DNS rewrites for local services
- PTR records for reverse DNS
- Custom filtering rules for malware/ads

**Service Discovery**:
- Provides DNS for all local services
- mDNS relay capabilities
- DHCP integration for automatic DNS records

## 7. VLAN Segmentation Recommendations
**Proposed VLAN Structure**:
- **VLAN 5 (Infrastructure)**: AdGuard Home placement
- **All VLANs**: Must have access to port 53
- **Management VLAN**: Admin interface access only

**Inter-VLAN Rules**:
- All VLANs → DNS (port 53): Allow
- Management → DNS (port 82/8443): Allow
- Internet → DNS: Deny (except DoT/DoH with rate limiting)
- DNS → Internet: Allow (for upstream queries)

## 8. Firewall Rules Required
**Inbound Rules**:
```
# DNS from all internal VLANs
Allow UDP/TCP 53 from 192.168.0.0/16 to AdGuard

# Admin interface from Management only
Allow TCP 82,8443 from 192.168.10.0/24 to AdGuard

# DoT from specific external IPs (if needed)
Allow TCP 853 from WHITELIST to AdGuard

# Block all other external access
Deny All from WAN to AdGuard
```

**Outbound Rules**:
```
# Upstream DNS queries
Allow UDP/TCP 53 from AdGuard to 1.1.1.1, 9.9.9.9
Allow TCP 853 from AdGuard to Any (DoT upstream)

# Updates and blocklist downloads
Allow TCP 443 from AdGuard to Any

# NTP for time sync
Allow UDP 123 from AdGuard to Any
```

## 9. Inter-Service Communication Requirements
**Direct Communication Needs**:
- **All Services**: Provide DNS resolution
- **DHCP Server**: Integration for client registration
- **Nginx Proxy Manager**: DNS for SSL certificate validation
- **Home Assistant**: DNS for integration updates
- **Monitoring**: Prometheus/Grafana metrics export

**Service Dependencies**:
- No dependencies (critical infrastructure)
- Should start before all other services

## 10. Performance Optimization
**Network Optimizations**:
- Enable DNS caching (reduce upstream queries)
- Optimize cache size (512MB recommended)
- Use persistent cache
- Enable parallel requests to upstream
- Implement query rate limiting per client
- Use fastest upstream servers (auto-select)

**Resource Recommendations**:
- Network bandwidth: 1-5 Mbps typical
- Latency requirement: <10ms for cache hits
- Query rate: 100-1000 queries/second capability
- Cache hit ratio target: >80%
- Memory: 512MB-1GB recommended
- CPU: 2 cores for home use

## High Availability Considerations
**Redundancy Options**:
1. Secondary AdGuard Home instance
2. Fallback to router DNS
3. Configure clients with multiple DNS servers
4. Use Keepalived for automatic failover

## Migration Notes
1. Configure as primary DNS before migration
2. Test with single client first
3. Update DHCP to distribute AdGuard as DNS
4. Monitor query logs for issues
5. Gradually enable blocking features
6. Configure local DNS entries for all services
7. Set up DNS-over-HTTPS for external clients
8. Implement monitoring and alerting
9. Document all custom rules and filters