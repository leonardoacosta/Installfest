# Glance Dashboard Integration & Homelab Architecture Review

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Network Segmentation Analysis](#network-segmentation-analysis)
3. [Glance Integration](#glance-integration)
4. [Security Recommendations](#security-recommendations)
5. [Nginx Proxy Manager Configuration](#nginx-proxy-manager-configuration)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

### Current Network Design

Your homelab uses a dual-network architecture which is **well-designed** for security and service isolation:

```
┌─────────────────────────────────────────────────────────────┐
│                     Host Network (Physical)                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Homelab Network (172.20.0.0/16)             │  │
│  │                                                      │  │
│  │  • Glance (172.20.0.85)    Dashboard               │  │
│  │  • Home Assistant (172.20.0.123)                   │  │
│  │  • AdGuard Home (172.20.0.53)                     │  │
│  │  • Nginx Proxy Manager (172.20.0.81)              │  │
│  │  • Jellyfin (172.20.0.96)                         │  │
│  │  • Vaultwarden (172.20.0.22)                      │  │
│  │  • Ollama/WebUI (172.20.0.11-12)                  │  │
│  │  • Samba (172.20.0.45)                            │  │
│  │  • Jellyseerr (172.20.0.55)                       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │          Media Network (172.21.0.0/16)              │  │
│  │                                                      │  │
│  │  • Gluetun VPN (172.21.0.2) ← All VPN traffic      │  │
│  │    ├─ qBittorrent (via Gluetun)                    │  │
│  │    ├─ Prowlarr (via Gluetun)                       │  │
│  │    ├─ NZBGet (via Gluetun)                         │  │
│  │    └─ Byparr (via Gluetun)                         │  │
│  │  • Radarr (172.21.0.78)                           │  │
│  │  • Sonarr (172.21.0.89)                           │  │
│  │  • Lidarr (172.21.0.86)                           │  │
│  │  • Bazarr (172.21.0.67)                           │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │        Cross-Network Services (Both Networks)       │  │
│  │                                                      │  │
│  │  • Nginx Proxy Manager (172.20.0.81, 172.21.0.81)  │  │
│  │  • Jellyfin (172.20.0.96, 172.21.0.96)            │  │
│  │  • Jellyseerr (172.20.0.55, 172.21.0.55)          │  │
│  │  • Glance (172.20.0.85, 172.21.0.85) - NEW        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  [Tailscale - Host Network Mode - VPN Mesh]               │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Strengths ✅

1. **Proper Network Isolation**: Media downloading services are isolated behind VPN
2. **Security Segmentation**: Core services separate from potentially risky media services
3. **VPN Protection**: All torrent/usenet traffic routes through Gluetun
4. **Cross-Network Access**: Strategic services have dual-network presence
5. **Static IP Assignment**: Predictable service locations

### Potential Improvements 🔧

1. **Add Resource Limits**: Many services lack memory/CPU limits
2. **Implement Health Checks**: Several services missing health check definitions
3. **Security Hardening**: Add `security_opt` to more containers
4. **Logging Strategy**: Centralized logging not configured
5. **Backup Strategy**: No automated backup configuration visible

## Network Segmentation Analysis

### Current Implementation Assessment

#### ✅ Correctly Implemented:

- **VPN Isolation**: Download clients properly using `network_mode: service:gluetun`
- **DNS Service**: AdGuard on dedicated IP with proper port exposure
- **Cross-Network Bridge**: NPM and Jellyfin accessible from both networks
- **Host Networking**: Tailscale correctly using host network for VPN mesh

#### ⚠️ Recommendations:

1. **Glance Dual-Network Access**: Already configured correctly in my optimized version
2. **Internal DNS**: Configure AdGuard to resolve local service names
3. **Firewall Rules**: Implement iptables rules for additional network isolation
4. **VLAN Tagging**: Consider VLAN support if your hardware permits

## Glance Integration

### 1. Configuration File Location

```bash
# Main configuration file
/Users/leonardoacosta/Personal/Installfest/homelab/glance/glance.yml
```

### 2. Key Integration Points

#### A. Docker Socket Access (Optional for monitoring)

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

This allows Glance to monitor Docker container status directly.

#### B. Network Visibility

Glance needs access to both networks to monitor all services:

```yaml
networks:
  homelab:
    ipv4_address: 172.20.0.85
  media:
    ipv4_address: 172.21.0.85
```

#### C. Service Discovery

The configuration uses static IPs for reliable service discovery:

- Homelab services: `172.20.0.x`
- Media services: `172.21.0.x`
- VPN services: Through Gluetun at `172.21.0.2`

### 3. Widget Configuration Examples

#### Monitor Widget for Health Checks

```yaml
- type: monitor
  title: Service Health
  cache: 1m
  sites:
    - title: Home Assistant
      url: http://172.20.0.123:8123/api/
      icon: si:homeassistant
    - title: Jellyfin
      url: http://172.20.0.96:8096/health
      icon: si:jellyfin
    - title: VPN Status
      url: http://172.21.0.2:8000/v1/publicip
      icon: si:shield
```

#### Service Links with Proper URLs

```yaml
- type: link
  title: Nginx Proxy Manager
  url: http://npm.local:81 # or http://172.20.0.81:81
  description: Reverse Proxy Management
  icon: si:nginx
```

## Security Recommendations

### 1. Authentication & Authorization

#### For Glance:

```yaml
# Add to glance.yml (when auth is implemented)
auth:
  enable: true
  users:
    - username: admin
      password_hash: $2y$10$... # bcrypt hash
  session_secret: "generate-random-secret-here"
```

#### Integration with Authelia (Future):

```yaml
authelia:
  image: authelia/authelia:latest
  container_name: authelia
  networks:
    homelab:
      ipv4_address: 172.20.0.9
```

### 2. HTTPS Configuration

#### Self-Signed SSL (Quick Setup):

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./nginx-proxy-manager/letsencrypt/glance.key \
  -out ./nginx-proxy-manager/letsencrypt/glance.crt \
  -subj "/CN=glance.local"
```

#### Let's Encrypt (Production):

Configure through Nginx Proxy Manager UI:

1. Add Proxy Host for `glance.yourdomain.com`
2. Forward to `http://172.20.0.85:8080`
3. Enable SSL with Let's Encrypt

### 3. Network Security

#### Firewall Rules (iptables):

```bash
# Restrict Glance access to local network only
iptables -A INPUT -p tcp --dport 8085 -s 192.168.0.0/16 -j ACCEPT
iptables -A INPUT -p tcp --dport 8085 -j DROP
```

#### Docker Network Policies:

```yaml
# Add to docker-compose.yml
networks:
  homelab:
    driver_opts:
      com.docker.network.bridge.enable_icc: "false" # Disable inter-container communication
```

## Nginx Proxy Manager Configuration

### 1. Basic Proxy Host Setup

#### Add Proxy Host for Glance:

```nginx
# Domain: glance.yourdomain.com
# Forward Hostname: 172.20.0.85
# Forward Port: 8080
# Enable Websockets Support: Yes
# Block Common Exploits: Yes
```

### 2. Custom Nginx Configuration

Create file: `./nginx-proxy-manager/data/nginx/proxy_host/glance.conf`

```nginx
location / {
    proxy_pass http://172.20.0.85:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket support
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, immutable";
    }
}

# Restrict access to local network
location /api/ {
    allow 192.168.0.0/16;
    allow 172.20.0.0/16;
    allow 172.21.0.0/16;
    deny all;
}
```

### 3. Access Control Lists

#### NPM Access List Configuration:

1. Create Access List: "Local Network Only"
2. Add Authorization:
   - Allow: `192.168.0.0/16`
   - Allow: `172.20.0.0/16`
   - Allow: `172.21.0.0/16`
   - Allow: `10.0.0.0/8` (Tailscale)
3. Apply to Glance proxy host

### 4. SSL/TLS Configuration

#### Force HTTPS:

```nginx
server {
    listen 80;
    server_name glance.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### HSTS Header:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

## Best Practices

### 1. Service Organization

#### Group Services Logically:

- **Infrastructure**: Glance, NPM, AdGuard, Tailscale
- **Smart Home**: Home Assistant, IoT services
- **Media**: Jellyfin, \*arr stack
- **Security**: Vaultwarden, Authelia
- **Development**: Ollama, code servers

### 2. Monitoring & Alerting

#### Add Uptime Kuma:

```yaml
uptime-kuma:
  image: louislam/uptime-kuma:latest
  container_name: uptime-kuma
  volumes:
    - ./uptime-kuma:/app/data
  ports:
    - "3001:3001"
  networks:
    homelab:
      ipv4_address: 172.20.0.30
```

### 3. Backup Strategy

#### Automated Backups:

```yaml
duplicati:
  image: lscr.io/linuxserver/duplicati:latest
  container_name: duplicati
  environment:
    - PUID=1000
    - PGID=1000
  volumes:
    - ./duplicati:/config
    - ./:/source:ro
    - /backup:/backups
  ports:
    - "8200:8200"
  networks:
    homelab:
      ipv4_address: 172.20.0.200
```

### 4. Container Updates

#### Watchtower for Auto-Updates:

```yaml
watchtower:
  image: containrrr/watchtower:latest
  container_name: watchtower
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  environment:
    - WATCHTOWER_CLEANUP=true
    - WATCHTOWER_INCLUDE_RESTARTING=true
    - WATCHTOWER_SCHEDULE=0 0 2 * * * # 2 AM daily
  networks:
    - homelab
```

### 5. DNS Configuration

#### Local DNS Entries (AdGuard):

Add these to AdGuard's DNS rewrites:

```
glance.local          → 172.20.0.85
npm.local            → 172.20.0.81
jellyfin.local       → 172.20.0.96
homeassistant.local  → 172.20.0.123
vault.local          → 172.20.0.22
```

## Troubleshooting

### Common Issues & Solutions

#### 1. Glance Can't Reach Services

**Symptom**: Monitor widgets show services as down
**Solution**:

```bash
# Check network connectivity
docker exec glance ping 172.20.0.96  # Test Jellyfin
docker exec glance curl http://172.20.0.96:8096/health
```

#### 2. Widgets Not Loading

**Symptom**: Blank widgets or loading errors
**Solution**:

```bash
# Check Glance logs
docker logs glance

# Verify configuration
docker exec glance cat /app/data/glance.yml
```

#### 3. Cross-Network Communication Issues

**Symptom**: Media services unreachable from Glance
**Solution**:

```bash
# Ensure Glance is on both networks
docker inspect glance | grep -A 10 Networks

# Add to both networks if missing
docker network connect media glance
```

#### 4. VPN Services Unreachable

**Symptom**: Can't access qBittorrent, Prowlarr, etc.
**Solution**:

```bash
# Access through Gluetun's exposed ports
# qBittorrent: http://your-host:8080
# Prowlarr: http://your-host:9696
# Not through container IPs
```

### Debug Commands

```bash
# Check all container statuses
docker ps -a

# View network details
docker network inspect homelab
docker network inspect media

# Test DNS resolution
docker exec glance nslookup jellyfin

# Check resource usage
docker stats

# View Glance logs
docker logs -f glance --tail 100
```

## Performance Optimization

### 1. Resource Limits

Apply these to prevent resource exhaustion:

```yaml
deploy:
  resources:
    limits:
      cpus: "0.5"
      memory: 256M
    reservations:
      memory: 128M
```

### 2. Cache Configuration

Optimize Glance cache settings:

```yaml
# In glance.yml
cache:
  default: 5m # Default cache duration
  monitor: 30s # Health check frequency
  weather: 30m # Weather widget cache
  rss: 15m # RSS feed cache
```

### 3. Network Optimization

```yaml
# Use macvlan for better performance (optional)
networks:
  homelab_macvlan:
    driver: macvlan
    driver_opts:
      parent: eth0
    ipam:
      config:
        - subnet: 192.168.1.0/24
```

## Conclusion

Your homelab architecture is **well-designed** with proper network segmentation. The addition of Glance as a dashboard provides excellent visibility across both networks. Key recommendations:

1. ✅ **Keep the dual-network design** - it's secure and well-organized
2. ✅ **Glance configuration is optimal** - dual-network access provides full visibility
3. 🔧 **Add authentication** when Glance supports it or use NPM access controls
4. 🔧 **Implement resource limits** on all containers
5. 🔧 **Set up automated backups** for configuration persistence
6. 🔧 **Configure local DNS** for easier service access

The provided configurations should give you a fully functional, secure, and maintainable homelab dashboard with Glance.
