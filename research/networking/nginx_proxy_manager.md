# Nginx Proxy Manager - Networking Analysis

## 1. Current Network Configuration Analysis
- **Container Networks**: Dual-homed (homelab + media bridges)
  - homelab: 172.20.0.81
  - media: 172.21.0.81
- **Port Mappings**:
  - 81:81/tcp (Admin Interface)
  - 443:443/tcp (HTTPS)
  - 80:80/tcp (HTTP)
- **Volume Mounts**: SSL certificates, configuration data
- **Critical Role**: Central reverse proxy for all services

## 2. Optimal Network Placement
**Recommended Zone**: DMZ VLAN (Edge Network)
- Should be in DMZ VLAN (e.g., VLAN 100)
- Dual-homed with internal network access
- First point of contact for external traffic
- Isolated from internal services

## 3. Reverse Proxy Requirements
**Self-Configuration**:
- Admin panel should proxy through itself
- URL: `https://proxy.domain.com`
- Protect admin interface with:
  - IP whitelist
  - Strong authentication
  - Fail2ban integration
  - Rate limiting

**Service Proxy Features**:
- SSL termination for all services
- Let's Encrypt automation
- WebSocket support
- Custom locations and rewrites
- Access lists and authentication
- Custom SSL certificates

## 4. Security Considerations for External Exposure
**Critical Security Requirements**:
- Admin interface MUST be IP-restricted
- Implement Web Application Firewall (WAF) rules
- Enable HSTS headers
- Configure security headers (CSP, X-Frame-Options, etc.)
- Rate limiting per service
- Fail2ban integration crucial
- Regular SSL/TLS security updates
- Monitor for CVEs
- Implement DDoS protection
- Log all access attempts
- Use strong SSL ciphers only
- Disable TLS 1.0/1.1

## 5. Port Management and Conflicts
**Required Ports**:
- 80/tcp: HTTP (redirect to HTTPS)
- 443/tcp: HTTPS (primary)
- 81/tcp: Admin interface

**High Availability Ports** (if implemented):
- 8080/tcp: Health check endpoint
- 9090/tcp: Metrics endpoint

**No conflicts expected** - These are standard web ports

## 6. DNS and Service Discovery
**DNS Requirements**:
- Wildcard DNS: `*.domain.com` → NPM IP
- Or individual A/CNAME records per service
- Let's Encrypt DNS challenge support
- Internal DNS for `.local` domains

**SSL Certificate Management**:
- Let's Encrypt integration
- Wildcard certificate support
- Custom certificate upload
- Automatic renewal

## 7. VLAN Segmentation Recommendations
**Proposed VLAN Structure**:
- **VLAN 100 (DMZ)**: NPM primary placement
- **All Internal VLANs**: NPM needs route access
- **VLAN 10 (Management)**: Admin interface access

**Network Architecture**:
```
Internet → Firewall → DMZ (NPM) → Internal Services
                          ↓
                    SSL Termination
                          ↓
                  Backend Services (HTTP)
```

## 8. Firewall Rules Required
**Inbound Rules**:
```
# HTTPS from Internet
Allow TCP 443 from Any to NPM

# HTTP for redirect
Allow TCP 80 from Any to NPM

# Admin from Management VLAN only
Allow TCP 81 from 192.168.10.0/24 to NPM

# Health checks from monitoring
Allow TCP 8080 from Monitoring to NPM
```

**Outbound Rules**:
```
# To backend services (all internal VLANs)
Allow TCP Any from NPM to 192.168.0.0/16

# Let's Encrypt validation
Allow TCP 443 from NPM to acme-v02.api.letsencrypt.org

# DNS for certificate validation
Allow UDP 53 from NPM to DNS_Server

# NTP for certificate validity
Allow UDP 123 from NPM to Any
```

## 9. Inter-Service Communication Requirements
**Proxied Services**:
- **Home Assistant**: WebSocket support required
- **Jellyfin**: Large body size, streaming support
- **Vaultwarden**: WebSocket for live sync
- **AdGuard Home**: Admin interface (internal only)
- **Ollama WebUI**: Long timeout for AI queries
- **Jellyseerr**: Standard proxy
- **All *arr apps**: API support

**Backend Requirements**:
- Must reach all internal services
- SSL verification for backend HTTPS
- Custom headers per service
- Path rewriting capabilities

## 10. Performance Optimization
**Proxy Optimizations**:
- Enable HTTP/2 and HTTP/3
- Implement caching for static content
- Gzip compression
- Brotli compression
- Connection pooling to backends
- Optimize buffer sizes
- Enable TCP nodelay
- Implement rate limiting

**SSL/TLS Optimizations**:
- OCSP stapling
- SSL session cache
- TLS 1.3 preferred
- Modern cipher suites only
- HSTS preloading

**Resource Recommendations**:
- Network bandwidth: 100-1000 Mbps
- Concurrent connections: 1000-10000
- Memory: 512MB-2GB
- CPU: 2-4 cores
- Storage: 1-5GB for logs and certificates

## High Availability Configuration
**Options for Redundancy**:
1. Active-Passive with keepalived
2. Multiple instances with shared storage
3. External load balancer
4. CloudFlare as failover

## Monitoring and Logging
**Essential Metrics**:
- Request rate per host
- Response times
- Error rates (4xx, 5xx)
- SSL certificate expiry
- Backend health status
- Bandwidth usage

**Logging Strategy**:
- Access logs per host
- Error logs centralized
- Security event logging
- Failed authentication attempts
- Rate limit violations

## Advanced Features
**Security Enhancements**:
```nginx
# GeoIP blocking
map $geoip_country_code $allowed_country {
    default 0;
    US 1;
    CA 1;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;

# DDoS protection
limit_conn_zone $binary_remote_addr zone=addr:10m;
limit_conn addr 10;
```

## Migration Notes
1. Document all existing proxy configurations
2. Set up DNS records (wildcard or individual)
3. Configure Let's Encrypt with DNS challenge
4. Test SSL certificate generation
5. Migrate services one at a time
6. Configure security headers per service
7. Set up access lists and IP restrictions
8. Implement fail2ban rules
9. Configure monitoring and alerting
10. Test all WebSocket connections
11. Verify streaming services work
12. Document custom configurations
13. Set up automated backups
14. Create disaster recovery plan