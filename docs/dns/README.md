# DNS Configuration

## Overview

The homelab uses a two-tier DNS strategy combining AdGuard Home for ad-blocking and local domain resolution with Cloudflare as a reliable fallback. This ensures continuous DNS availability even during AdGuard maintenance or restarts.

## Setup

### AdGuard Home as Primary DNS

AdGuard Home runs at `172.20.0.5` in the homelab network and provides:
- Ad-blocking and tracker blocking
- Custom DNS rules for local services
- DNS-over-HTTPS (DoH) upstream support
- Query logging and statistics

**Access**: http://adguard.local or http://172.20.0.5

### Cloudflare as Fallback DNS

Cloudflare DNS (1.1.1.1) is configured as secondary DNS for:
- AdGuard Home maintenance or restarts
- Network troubleshooting
- Initial boot before AdGuard starts

**Why Cloudflare**:
- Fast, reliable public DNS
- Privacy-focused (1.1.1.1)
- Global anycast network
- DNS-over-HTTPS support

## Configuration

### System-Wide Configuration

**Linux/Arch (systemd-resolved)**:
```bash
# Edit /etc/systemd/resolved.conf
[Resolve]
DNS=172.20.0.5 1.1.1.1
FallbackDNS=1.0.0.1 8.8.8.8
DNSOverTLS=opportunistic

# Restart service
sudo systemctl restart systemd-resolved
```

**Docker Containers**:
```yaml
# In docker-compose.yml or container config
dns:
  - 172.20.0.5
  - 1.1.1.1
```

**Network Clients (DHCP)**:

Configure router/DHCP server to advertise:
- Primary DNS: 172.20.0.5
- Secondary DNS: 1.1.1.1

### Device Configuration

**Set as primary DNS on all devices:**
```
Primary DNS: 172.20.0.5
Secondary DNS: 1.1.1.1
```

## Usage

### Testing DNS Resolution

```bash
# Test AdGuard (should block ads)
dig @172.20.0.5 doubleclick.net

# Test Cloudflare fallback
dig @1.1.1.1 google.com

# Test system DNS
dig google.com

# Verify which DNS is being used
resolvectl status
```

### Managing AdGuard Home

**Accessing Web Interface:**
- Local: http://adguard.local or http://172.20.0.5
- Configure DNS rules, blocklists, and settings

**Viewing Query Logs:**
- Dashboard shows real-time queries and blocked requests
- Statistics available for monitoring

**Exporting Configuration:**
- Settings → General → Export settings
- Store backup securely for disaster recovery

## Troubleshooting

### AdGuard Not Responding

```bash
# Check AdGuard status
docker compose ps adguardhome
docker compose logs adguardhome

# Restart if needed
docker compose restart adguardhome

# Verify container networking
ping 172.20.0.5
```

### DNS Not Resolving

```bash
# Check system DNS config
cat /etc/resolv.conf

# Verify network connectivity
ping 172.20.0.5
ping 1.1.1.1

# Test with explicit DNS server
dig @1.1.1.1 example.com
```

### Fallback Not Working

- Verify secondary DNS configured in system/router
- Check firewall rules allow outbound DNS (port 53)
- Test with: `dig @1.1.1.1 google.com`

### Common Issues

**Port 53 Conflict with systemd-resolved:**
```bash
# Disable systemd-resolved DNS stub listener
sudo mkdir -p /etc/systemd/resolved.conf.d/
echo -e "[Resolve]\nDNSStubListener=no" | sudo tee /etc/systemd/resolved.conf.d/adguardhome.conf
sudo systemctl restart systemd-resolved
```

**AdGuard Container Fails to Start:**
- Check for port 53 conflicts: `sudo netstat -tulpn | grep :53`
- Ensure no other DNS services running
- Verify Docker network configuration

## Best Practices

1. **Always configure fallback**: Prevents total DNS failure if AdGuard is down
2. **Monitor AdGuard logs**: Watch for blocked queries and issues
3. **Test periodically**: Verify both primary and fallback DNS work
4. **Document custom rules**: Keep track of AdGuard custom DNS entries
5. **Backup configuration**: Export AdGuard settings regularly

## References

- **OpenSpec Specification**: [openspec/specs/dns-configuration/spec.md](../../openspec/specs/dns-configuration/spec.md)
- **AdGuard Home Documentation**: https://github.com/AdguardTeam/AdGuardHome/wiki
- **Cloudflare DNS**: https://1.1.1.1/
- **Related Services**:
  - Traefik (reverse proxy with DNS integration)
  - Docker Networking (container DNS configuration)
