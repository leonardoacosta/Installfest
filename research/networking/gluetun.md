# Gluetun - Networking Analysis

## 1. Current Network Configuration Analysis
- **Container Network**: media (bridge)
- **IP Address**: 172.21.0.2 (static)
- **Port Mappings** (for dependent services):
  - 51820:51820 (WireGuard VPN)
  - 8080:8080 (qBittorrent)
  - 9696:9696 (Prowlarr)
  - 6789:6789 (NZBGet)
- **Capabilities**: NET_ADMIN
- **Device Access**: /dev/net/tun
- **Kill Switch**: Enabled by default

## 2. Optimal Network Placement
**Recommended Zone**: Isolated Download VLAN
- Must be in dedicated download VLAN (e.g., VLAN 41)
- Complete isolation from trusted networks
- VPN-only internet access
- No direct access to sensitive services

## 3. Reverse Proxy Requirements
**Service Proxy Configuration**:
- Services use Gluetun's network namespace
- Proxy connections to dependent services
- No direct proxy to Gluetun itself
- Access services through Gluetun's forwarded ports

**Headers for Proxied Services**:
```nginx
# For services behind Gluetun
proxy_pass http://gluetun:8080;  # qBittorrent
proxy_pass http://gluetun:9696;  # Prowlarr
```

## 4. Security Considerations for External Exposure
**Critical Security Requirements**:
- Kill switch MUST be enabled
- DNS leak protection enabled
- IPv6 disabled if not supported by VPN
- Firewall rules prevent non-VPN traffic
- No port forwarding except through VPN
- Monitor for VPN disconnections
- Automatic reconnection on failure
- Block LAN access except specified subnets

**VPN Security**:
- Use WireGuard over OpenVPN (faster, more secure)
- Regular key rotation
- Monitor for IP leaks
- Test kill switch regularly

## 5. Port Management and Conflicts
**VPN Ports**:
- 51820/udp: WireGuard (or custom)
- 1194/udp: OpenVPN (if used)

**Service Ports** (forwarded):
- 8080/tcp: qBittorrent WebUI
- 9696/tcp: Prowlarr
- 6789/tcp: NZBGet
- Custom ports for torrenting

**Port Forwarding**:
- Configure VPN provider's port forwarding
- Update firewall rules for forwarded port
- Use same port in torrent client

## 6. DNS and Service Discovery
**DNS Configuration**:
- Use VPN provider's DNS
- Prevent DNS leaks
- No local DNS resolution
- Block DoH/DoT to prevent bypassing

**DNS Leak Prevention**:
```yaml
environment:
  - DNS_KEEP_NAMESERVER=off
  - DOT=off
  - DNS_ADDRESS=VPN_PROVIDER_DNS
  - BLOCK_MALICIOUS=on
```

## 7. VLAN Segmentation Recommendations
**Proposed VLAN Structure**:
- **VLAN 41 (Downloads)**: Gluetun + dependent services
- **VLAN 40 (Media)**: One-way access for file moves
- **No access to other VLANs**

**Strict Isolation**:
```
Downloads → Internet: Only through VPN
Downloads → Media: Write-only for completed downloads
Media → Downloads: Read access for imports
All others → Downloads: Deny
```

## 8. Firewall Rules Required
**Inbound Rules**:
```
# Admin access to services (through VPN container)
Allow TCP 8080,9696,6789 from 192.168.10.0/24 to Gluetun

# Media services access for imports
Allow TCP 8080,9696 from 192.168.40.0/24 to Gluetun

# Block all other inbound
Deny All from Any to Gluetun
```

**Outbound Rules**:
```
# VPN connection only
Allow UDP 51820 from Gluetun to VPN_ENDPOINT

# Block all non-VPN traffic (kill switch)
Deny All from Gluetun to Any (except tun0)

# Allow specified local subnets
Allow All from Gluetun to 172.21.0.0/16 (media network)
Allow All from Gluetun to 172.20.0.0/16 (homelab network)
```

## 9. Inter-Service Communication Requirements
**Dependent Services** (using network_mode: service:gluetun):
- **qBittorrent**: Torrent client
- **Prowlarr**: Indexer proxy
- **NZBGet**: Usenet client
- **Byparr**: Cloudflare bypass

**Service Dependencies**:
- All dependent services route through Gluetun
- Health check required before starting dependents
- Automatic restart on VPN failure

## 10. Performance Optimization
**VPN Optimizations**:
- Use WireGuard for better performance
- Optimize MTU settings (1420 typical for WireGuard)
- Enable fast.com speed test
- Use closest VPN server
- Monitor bandwidth usage

**Container Optimizations**:
```yaml
environment:
  - VPN_INTERFACE=wg0
  - FIREWALL_DEBUG=off
  - LOG_LEVEL=info
  - HEALTH_TARGET=google.com
  - HEALTH_INTERVAL=60
```

**Resource Recommendations**:
- Network bandwidth: Limited by VPN
- CPU: 1-2 cores
- Memory: 256-512MB
- Latency: +20-100ms (VPN overhead)

## Health Monitoring
**Health Checks**:
```yaml
healthcheck:
  test: ping -c 1 www.google.com || exit 1
  interval: 20s
  timeout: 10s
  retries: 5
```

**Monitoring Points**:
- VPN connection status
- Public IP address
- DNS leak test results
- Kill switch functionality
- Bandwidth usage
- Connection drops

## VPN Provider Configuration
**WireGuard Example**:
```yaml
environment:
  - VPN_SERVICE_PROVIDER=custom
  - VPN_TYPE=wireguard
  - WIREGUARD_PRIVATE_KEY=${WG_PRIVATE_KEY}
  - WIREGUARD_ADDRESS=${WG_ADDRESS}
  - WIREGUARD_PUBLIC_KEY=${WG_PUBLIC_KEY}
  - VPN_ENDPOINT_IP=${VPN_IP}
  - VPN_ENDPOINT_PORT=51820
  - FIREWALL_VPN_INPUT_PORTS=${FORWARD_PORT}
```

## Kill Switch Testing
**Verify Kill Switch**:
1. Connect to container
2. Kill VPN process
3. Verify no internet access
4. Check DNS resolution fails
5. Confirm local subnet access works

## Common Issues and Solutions
**Connection Issues**:
- Check VPN credentials
- Verify server is active
- Test different servers
- Check firewall rules
- Verify TUN device access

**Performance Issues**:
- Change VPN server location
- Switch protocols (WireGuard/OpenVPN)
- Adjust MTU size
- Check CPU usage

## Migration Notes
1. Set up VPN provider credentials
2. Configure port forwarding at provider
3. Test VPN connection independently
4. Configure kill switch settings
5. Set up health checks
6. Migrate download clients one by one
7. Update firewall rules
8. Test torrent client with test file
9. Verify no IP leaks
10. Configure automatic restart
11. Document VPN server preferences
12. Set up monitoring alerts