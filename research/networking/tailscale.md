# Tailscale - Networking Analysis

## 1. Current Network Configuration Analysis
- **Network Mode**: HOST (full network access)
- **No Container IP**: Uses host networking
- **Capabilities**: NET_ADMIN, SYS_MODULE
- **Routes Advertised**: 172.20.0.0/16, 172.21.0.0/16
- **Exit Node**: Enabled
- **Device Access**: /dev/net/tun

## 2. Optimal Network Placement
**Recommended Zone**: Host Network (Special Case)
- Must run in host mode for VPN functionality
- Acts as network gateway for internal services
- Provides secure remote access
- Can bridge multiple sites

**Alternative Deployment**:
- Consider dedicated VM or physical device
- Separate Tailscale gateway device
- Router-based Tailscale implementation

## 3. Reverse Proxy Requirements
**Not Applicable**:
- Tailscale creates its own secure tunnel
- No reverse proxy needed
- Uses WireGuard protocol
- Direct peer-to-peer connections when possible

**Admin Access**:
- Web console at https://login.tailscale.com
- Local API at http://localhost:9090 (if enabled)

## 4. Security Considerations for External Exposure
**Security Model**:
- Zero Trust Network Access (ZTNA)
- End-to-end encryption (WireGuard)
- Device authentication required
- ACLs managed centrally
- No open inbound ports required
- NAT traversal handled automatically

**Best Practices**:
- Use ACL tags for service grouping
- Implement principle of least privilege
- Regular key rotation
- Monitor for unauthorized devices
- Use MFA on Tailscale account
- Restrict exit node usage

## 5. Port Management and Conflicts
**Required Ports**:
- 41641/udp: WireGuard (outbound only typically)
- No inbound ports required (uses DERP relays)

**DERP Relay Ports** (if self-hosted):
- 443/tcp: HTTPS DERP
- 3478/udp: STUN

**No conflicts** - Uses dynamic port allocation

## 6. DNS and Service Discovery
**MagicDNS Features**:
- Automatic DNS for all Tailscale nodes
- Format: `hostname.tailnet-name.ts.net`
- Split DNS support
- Custom DNS servers per network

**Service Discovery**:
- Automatic node discovery
- Subnet router advertisements
- Exit node discovery
- Tag-based routing

## 7. VLAN Segmentation Recommendations
**Network Architecture**:
```
Tailscale Mesh Network (100.x.x.x)
         ↓
    Host Network
         ↓
  Advertised Subnets:
  - 172.20.0.0/16 (homelab)
  - 172.21.0.0/16 (media)
  - Other local VLANs
```

**Access Control**:
- Use Tailscale ACLs instead of VLANs
- Tag-based access control
- User and group-based policies

## 8. Firewall Rules Required
**Inbound Rules**:
```
# No inbound rules required!
# Tailscale uses outbound connections only
```

**Outbound Rules**:
```
# WireGuard protocol
Allow UDP 41641 from Tailscale to Any

# DERP relay fallback
Allow TCP 443 from Tailscale to *.tailscale.com

# STUN for NAT traversal
Allow UDP 3478 from Tailscale to Any

# DNS
Allow UDP 53 from Tailscale to Any
```

**Forwarding Rules** (for subnet routing):
```
# Allow forwarding from Tailscale interface
Allow Forward from tailscale0 to docker0
Allow Forward from tailscale0 to internal_networks
```

## 9. Inter-Service Communication Requirements
**Service Access via Tailscale**:
- All services accessible via advertised routes
- No service modification required
- Transparent access to Docker networks

**Integration Points**:
- **All Services**: Remote access gateway
- **DNS**: Can use internal DNS servers
- **Monitoring**: Tailscale metrics export

## 10. Performance Optimization
**Network Optimizations**:
- Enable direct connections (avoid DERP)
- Optimize MTU settings (1280 default)
- Use local DERP servers for better performance
- Enable subnet router for local access
- Minimize number of advertised routes

**Routing Optimizations**:
- Place Tailscale node centrally
- Use multiple subnet routers for HA
- Consider site-to-site for multiple locations

**Resource Recommendations**:
- Network bandwidth: 10-100 Mbps
- CPU: Minimal (1 core sufficient)
- Memory: 64-256MB
- Latency: Adds ~1-5ms locally
- Concurrent connections: 100s supported

## ACL Configuration Examples
```json
{
  "groups": {
    "group:admin": ["user@example.com"],
    "group:users": ["user2@example.com"]
  },
  "tagOwners": {
    "tag:server": ["group:admin"],
    "tag:media": ["group:admin"],
    "tag:iot": ["group:admin"]
  },
  "acls": [
    // Admin access to everything
    {
      "action": "accept",
      "src": ["group:admin"],
      "dst": ["*:*"]
    },
    // Users access to media services
    {
      "action": "accept",
      "src": ["group:users"],
      "dst": [
        "tag:media:8096",  // Jellyfin
        "tag:media:5055"   // Jellyseerr
      ]
    }
  ]
}
```

## High Availability Setup
**Multiple Subnet Routers**:
1. Deploy multiple Tailscale nodes
2. Advertise same subnets from each
3. Automatic failover handled by Tailscale
4. Load balancing across nodes

## Use Cases
**Primary Benefits**:
1. **Remote Access**: Secure access to home lab
2. **Site-to-Site**: Connect multiple locations
3. **Exit Node**: Route traffic through home
4. **Development**: Access local services remotely
5. **Backup Access**: When primary access fails

## Monitoring
**Metrics to Track**:
- Connection status
- Peer connectivity
- DERP relay usage
- Bandwidth consumption
- Active connections
- Latency to peers

## Migration Notes
1. Create Tailscale account and tailnet
2. Generate auth key for automated setup
3. Plan subnet advertisements
4. Configure ACLs before deployment
5. Test with single service first
6. Document MagicDNS names
7. Configure exit node if needed
8. Set up key expiry policy
9. Train users on Tailscale client
10. Monitor DERP relay usage
11. Optimize direct connections
12. Document emergency access procedures