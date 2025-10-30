# Glance Dashboard Integration & Homelab Architecture Review

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

#### Docker Network Policies:

```yaml
# Add to docker-compose.yml
networks:
  homelab:
    driver_opts:
      com.docker.network.bridge.enable_icc: "false" # Disable inter-container communication
```

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
