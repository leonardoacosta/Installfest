# Home Assistant - Networking Analysis

## 1. Current Network Configuration Analysis
- **Container Network**: homelab (bridge)
- **IP Address**: 172.20.0.123 (static)
- **Port Mappings**: 8123:8123 (Web Interface)
- **Privileged Mode**: YES (security concern)
- **Volume Mounts**: Includes NPM SSL certificates (read-only)

## 2. Optimal Network Placement
**Recommended Zone**: IoT/Smart Home VLAN (Semi-trusted)
- Should be on dedicated IoT VLAN (e.g., VLAN 30)
- Requires access to IoT devices
- Needs controlled access to internal services
- Must be accessible from user devices

## 3. Reverse Proxy Requirements
**Configuration**:
- Primary URL: `https://homeassistant.domain.com`
- Internal URL: `https://ha.local`
- WebSocket Support: REQUIRED
- Headers Required:
  ```
  X-Forwarded-For
  X-Real-IP
  X-Forwarded-Proto
  X-Forwarded-Host
  Upgrade (for WebSocket)
  Connection (for WebSocket)
  ```
- SSL/TLS: Mandatory for external access
- HTTP/2: Recommended for performance

## 4. Security Considerations for External Exposure
**Critical Security Requirements**:
- Remove privileged mode unless absolutely necessary
- Implement fail2ban for brute force protection
- Use strong authentication (2FA recommended)
- Implement IP whitelist for admin access
- Regular security updates
- Use HTTPS only (disable HTTP)
- Implement rate limiting on API endpoints
- Consider using Cloudflare Tunnel or VPN-only access

## 5. Port Management and Conflicts
**Required Ports**:
- 8123/tcp: Web Interface (can be changed)
- 1900/udp: SSDP for discovery (optional)
- 5353/udp: mDNS for HomeKit (optional)
- 51827/tcp: HomeKit Bridge (optional)

**Potential Conflicts**:
- 1900/udp conflicts with Jellyfin DLNA
- Solution: Use separate VLANs or disable DLNA

## 6. DNS and Service Discovery
**DNS Requirements**:
- Local DNS entry: `homeassistant.local`
- mDNS for device discovery
- Reverse DNS for IP cameras
- Split-horizon DNS recommended

**Service Discovery**:
- Zeroconf/Bonjour for Apple devices
- SSDP for smart home devices
- MQTT discovery for IoT devices

## 7. VLAN Segmentation Recommendations
**Proposed VLAN Structure**:
- **VLAN 30 (IoT)**: Home Assistant + IoT devices
- **VLAN 10 (Management)**: Access for configuration
- **VLAN 20 (Users)**: Access for mobile apps
- **VLAN 40 (Cameras)**: IP camera access (if applicable)

**Inter-VLAN Rules**:
- IoT → Internet: Allow (for integrations)
- IoT → Management: Deny
- Users → IoT: Allow (port 8123 only)
- IoT → Media: Conditional (for media player integrations)

## 8. Firewall Rules Required
**Inbound Rules**:
```
# From Users VLAN
Allow TCP 8123 from 192.168.20.0/24 to HomeAssistant

# From Internet (through reverse proxy only)
Allow TCP 443 from ReverseProxy to HomeAssistant

# From IoT devices
Allow TCP 8123 from 192.168.30.0/24 to HomeAssistant

# mDNS/Discovery
Allow UDP 5353 from 192.168.30.0/24 to HomeAssistant
Allow UDP 1900 from 192.168.30.0/24 to HomeAssistant
```

**Outbound Rules**:
```
# To Internet (for integrations)
Allow TCP 443 from HomeAssistant to Any

# To IoT devices
Allow Any from HomeAssistant to 192.168.30.0/24

# To MQTT broker (if used)
Allow TCP 1883 from HomeAssistant to MQTT_Broker

# DNS
Allow UDP 53 from HomeAssistant to DNS_Server
```

## 9. Inter-Service Communication Requirements
**Direct Communication Needs**:
- **Jellyfin**: Media player integration (port 8096)
- **AdGuard Home**: DNS queries (port 53)
- **MQTT Broker**: If using MQTT (port 1883)
- **Nginx Proxy Manager**: Reverse proxy (port 8123)
- **Zigbee2MQTT**: If using Zigbee devices
- **Database**: If using external DB (PostgreSQL/MariaDB)

## 10. Performance Optimization
**Network Optimizations**:
- Use HTTP/2 for web interface
- Enable WebSocket compression
- Implement caching headers
- Use CDN for static assets
- Database on same VLAN for low latency
- Consider using Unix sockets for local services

**Resource Recommendations**:
- Network bandwidth: 10-50 Mbps typical
- Latency requirement: <50ms for responsive UI
- Concurrent connections: 10-50 typical
- WebSocket connections: 5-20 per client

## Migration Notes
1. Remove privileged mode and test functionality
2. Move to dedicated IoT VLAN
3. Implement proper firewall rules
4. Configure reverse proxy with WebSocket support
5. Set up fail2ban and rate limiting
6. Enable 2FA for all users
7. Regular backup of configuration