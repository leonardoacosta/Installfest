# Traefik - Vaultwarden SSL Configuration

> Complete configuration guide for Vaultwarden with SSL, WebSocket support, and security hardening using Traefik reverse proxy.

## Table of Contents
- [Overview](#overview)
- [Configuration Method](#configuration-method)
- [Docker Compose Configuration](#docker-compose-configuration)
- [Traefik Static Configuration](#traefik-static-configuration)
- [Key Differences from Nginx Proxy Manager](#key-differences-from-nginx-proxy-manager)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Testing & Troubleshooting](#testing--troubleshooting)
- [Security Best Practices](#security-best-practices)
- [Migration from NPM](#migration-from-npm)

## Overview

This configuration provides:
- ✅ Automatic SSL/TLS certificates via Let's Encrypt
- ✅ WebSocket support for real-time sync
- ✅ Security headers and rate limiting
- ✅ Container-native configuration via Docker labels
- ✅ Dynamic service discovery

> **Note**: We've switched from Nginx Proxy Manager to Traefik for better container-native configuration and dynamic service discovery.

## Configuration Method

Traefik uses **Docker labels** on the Vaultwarden container for configuration. All proxy settings are defined directly in `docker-compose.yml`.

## Docker Compose Configuration

### Vaultwarden Service

```yaml
vaultwarden:
  image: vaultwarden/server:latest
  container_name: vaultwarden
  restart: unless-stopped
  environment:
    - DOMAIN=https://vault.${DOMAIN}
    - SIGNUPS_ALLOWED=false
    - INVITATIONS_ALLOWED=true
    - ADMIN_TOKEN=${VAULTWARDEN_ADMIN_TOKEN}
    - WEBSOCKET_ENABLED=true
    - SMTP_HOST=${VAULTWARDEN_SMTP_HOST}
    - SMTP_PORT=${VAULTWARDEN_SMTP_PORT}
    - SMTP_SECURITY=starttls
    - SMTP_FROM=${VAULTWARDEN_SMTP_FROM}
    - SMTP_USERNAME=${VAULTWARDEN_SMTP_USERNAME}
    - SMTP_PASSWORD=${VAULTWARDEN_SMTP_PASSWORD}
  volumes:
    - ./vaultwarden:/data
  networks:
    homelab:
      ipv4_address: 172.20.0.22
  ports:
    - "8222:80"    # Web UI (local access)
    - "3012:3012"  # WebSocket
  labels:
    # Enable Traefik
    - "traefik.enable=true"

    # Router for main web UI
    - "traefik.http.routers.vaultwarden.rule=Host(`vault.${DOMAIN}`)"
    - "traefik.http.routers.vaultwarden.entrypoints=websecure"
    - "traefik.http.routers.vaultwarden.tls=true"
    - "traefik.http.routers.vaultwarden.tls.certresolver=letsencrypt"
    - "traefik.http.routers.vaultwarden.service=vaultwarden"
    - "traefik.http.routers.vaultwarden.middlewares=vaultwarden-headers,vaultwarden-ratelimit"

    # Service for main web UI
    - "traefik.http.services.vaultwarden.loadbalancer.server.port=80"

    # Router for WebSocket notifications
    - "traefik.http.routers.vaultwarden-ws.rule=Host(`vault.${DOMAIN}`) && Path(`/notifications/hub`)"
    - "traefik.http.routers.vaultwarden-ws.entrypoints=websecure"
    - "traefik.http.routers.vaultwarden-ws.tls=true"
    - "traefik.http.routers.vaultwarden-ws.tls.certresolver=letsencrypt"
    - "traefik.http.routers.vaultwarden-ws.service=vaultwarden-ws"

    # Service for WebSocket
    - "traefik.http.services.vaultwarden-ws.loadbalancer.server.port=3012"

    # Security headers middleware
    - "traefik.http.middlewares.vaultwarden-headers.headers.browserXssFilter=true"
    - "traefik.http.middlewares.vaultwarden-headers.headers.contentTypeNosniff=true"
    - "traefik.http.middlewares.vaultwarden-headers.headers.frameDeny=true"
    - "traefik.http.middlewares.vaultwarden-headers.headers.stsIncludeSubdomains=true"
    - "traefik.http.middlewares.vaultwarden-headers.headers.stsPreload=true"
    - "traefik.http.middlewares.vaultwarden-headers.headers.stsSeconds=31536000"
    - "traefik.http.middlewares.vaultwarden-headers.headers.referrerPolicy=same-origin"
    - "traefik.http.middlewares.vaultwarden-headers.headers.contentSecurityPolicy=default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss://vault.${DOMAIN}; frame-ancestors 'self';"

    # Rate limiting middleware
    - "traefik.http.middlewares.vaultwarden-ratelimit.ratelimit.average=10"
    - "traefik.http.middlewares.vaultwarden-ratelimit.ratelimit.burst=20"
    - "traefik.http.middlewares.vaultwarden-ratelimit.ratelimit.period=1s"

    # HTTP to HTTPS redirect (handled globally by Traefik)
    - "traefik.http.routers.vaultwarden-http.rule=Host(`vault.${DOMAIN}`)"
    - "traefik.http.routers.vaultwarden-http.entrypoints=web"
    - "traefik.http.routers.vaultwarden-http.middlewares=redirect-to-https"
```

## Traefik Static Configuration

### Traefik Service

```yaml
traefik:
  image: traefik:latest
  container_name: traefik
  restart: unless-stopped
  command:
    # API & Dashboard
    - "--api.dashboard=true"

    # Docker provider
    - "--providers.docker=true"
    - "--providers.docker.exposedbydefault=false"
    - "--providers.docker.network=homelab"

    # Entrypoints
    - "--entrypoints.web.address=:80"
    - "--entrypoints.websecure.address=:443"

    # Let's Encrypt
    - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
    - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"

    # Logging
    - "--log.level=INFO"
    - "--accesslog=true"
  ports:
    - "80:80"
    - "443:443"
    - "8080:8080"  # Dashboard
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - ./traefik/letsencrypt:/letsencrypt
    - ./traefik/config:/config:ro
  networks:
    homelab:
      ipv4_address: 172.20.0.81
  labels:
    # Global HTTP to HTTPS redirect
    - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
    - "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"
```

## Key Differences from Nginx Proxy Manager

| Feature | Nginx Proxy Manager | Traefik |
|---------|-------------------|---------|
| **Configuration Location** | Web UI | Docker labels in docker-compose.yml |
| **SSL Certificates** | Managed through UI | Automatic via Let's Encrypt resolver |
| **WebSocket Support** | Checkbox in UI | Separate router for WebSocket path |
| **Security Headers** | Advanced tab custom config | Middleware labels |
| **Rate Limiting** | nginx limit_req directives | RateLimit middleware |

## Environment Variables

### Required `.env` Configuration

```bash
# Domain configuration
DOMAIN=yourdomain.com
ACME_EMAIL=your-email@example.com

# Vaultwarden
VAULTWARDEN_ADMIN_TOKEN=your-secure-admin-token-here

# SMTP (optional but recommended)
VAULTWARDEN_SMTP_HOST=smtp.gmail.com
VAULTWARDEN_SMTP_PORT=587
VAULTWARDEN_SMTP_FROM=your-email@example.com
VAULTWARDEN_SMTP_USERNAME=your-email@example.com
VAULTWARDEN_SMTP_PASSWORD=your-app-password
```

## Deployment

### Step-by-Step Deployment

1. **Update .env file** with your domain and configuration

2. **Deploy services**:
   ```bash
   cd /path/to/homelab
   docker-compose up -d traefik
   # Wait for Traefik to start
   sleep 10
   docker-compose up -d vaultwarden
   ```

3. **Verify Traefik routing**:
   ```bash
   # Check if Vaultwarden is registered
   curl http://localhost:8080/api/http/routers | jq '.[] | select(.name | contains("vaultwarden"))'
   ```

4. **Test HTTPS access**:
   ```bash
   curl -I https://vault.yourdomain.com
   ```

## Testing & Troubleshooting

### Testing WebSocket Connection

1. Open browser developer tools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Login to Vaultwarden
5. Should see WebSocket connection to `wss://vault.yourdomain.com/notifications/hub`
6. Status should be "101 Switching Protocols"

### Common Issues

#### Certificate not generating

```bash
# Check Traefik logs
docker logs traefik | grep -i acme

# Verify DNS resolution
dig vault.yourdomain.com

# Check certificate storage
ls -la ./traefik/letsencrypt/acme.json
```

#### WebSocket not connecting

```bash
# Test WebSocket endpoint
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  https://vault.yourdomain.com/notifications/hub

# Check if both routers are active
docker exec traefik wget -O- http://localhost:8080/api/http/routers | grep vaultwarden
```

#### 502 Bad Gateway

```bash
# Verify Vaultwarden is running
docker ps | grep vaultwarden

# Check network connectivity
docker exec traefik ping vaultwarden

# Verify service discovery
docker network inspect homelab | grep vaultwarden
```

#### Rate limiting too strict

Adjust these labels:
```yaml
- "traefik.http.middlewares.vaultwarden-ratelimit.ratelimit.average=100"
- "traefik.http.middlewares.vaultwarden-ratelimit.ratelimit.burst=50"
```

## Traefik Dashboard

### Access Dashboard

- **URL**: `http://YOUR_SERVER_IP:8080`
- Shows all routers, services, and middlewares
- Real-time view of routing rules

### Secure the Dashboard

Add authentication:
```yaml
labels:
  - "traefik.http.routers.traefik.rule=Host(`traefik.${DOMAIN}`)"
  - "traefik.http.routers.traefik.service=api@internal"
  - "traefik.http.routers.traefik.middlewares=auth"
  - "traefik.http.middlewares.auth.basicauth.users=admin:$$2y$$10$$..."
```

Generate password hash:
```bash
htpasswd -nB admin | sed -e 's/\$/\$\$/g'
```

## Security Best Practices

### 1. Hide Version Headers
```yaml
- "traefik.http.middlewares.security.headers.customResponseHeaders.Server="
```

### 2. IP Whitelisting for Admin
```yaml
- "traefik.http.middlewares.admin-whitelist.ipwhitelist.sourcerange=192.168.1.0/24,10.0.0.0/8"
```

### 3. GeoIP Blocking
```yaml
- "traefik.http.middlewares.geoblock.plugin.geoblock.allowedCountries=US,CA"
```

### 4. Request Size Limits
```yaml
- "traefik.http.middlewares.limit.buffering.maxRequestBodyBytes=525000000"  # 525MB for Vaultwarden
```

## Migration from NPM

### Migration Checklist

- [ ] Export NPM proxy host configurations for reference
- [ ] Update docker-compose.yml with Traefik labels
- [ ] Update .env with DOMAIN and ACME_EMAIL
- [ ] Stop NPM: `docker-compose stop nginx-proxy-manager`
- [ ] Start Traefik: `docker-compose up -d traefik`
- [ ] Update DNS records if needed (point to Traefik)
- [ ] Test each service through Traefik
- [ ] Verify SSL certificates are issued
- [ ] Test WebSocket connections
- [ ] Remove NPM container when confirmed working

## Advantages of Traefik over NPM

1. **Container-Native**: Configuration via labels, no separate UI needed
2. **Dynamic Updates**: Changes apply without restart
3. **Better Performance**: Written in Go, lower resource usage
4. **Kubernetes Ready**: Easy migration path to K8s
5. **Middleware System**: Powerful, composable request handling
6. **Metrics Built-in**: Prometheus metrics endpoint available
7. **Multiple Providers**: Docker, File, Kubernetes, Consul, etc.

## Backup Considerations

Important Traefik files to backup:
```bash
# Backup certificates and configuration
tar -czf traefik-backup-$(date +%Y%m%d).tar.gz \
  traefik/letsencrypt/acme.json \
  traefik/config/ \
  docker-compose.yml
```

## Local Development / Testing

For local testing without real domain:

1. **Use Traefik's self-signed certificate**:
   ```yaml
   - "--entrypoints.websecure.http.tls=true"
   ```

2. **Add to /etc/hosts**:
   ```
   127.0.0.1 vault.local
   ```

3. **Configure with `.local` domain**:
   ```yaml
   - "traefik.http.routers.vaultwarden.rule=Host(`vault.local`)"
   ```

## Monitoring with Glance

Add Traefik monitoring to Glance dashboard:

```yaml
- type: docker
  label: Traefik
  container: traefik
  stats:
    - cpu
    - memory
  labels:
    - router_count
    - service_count
    - middleware_count
```

## Additional Resources

- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Vaultwarden Wiki](https://github.com/dani-garcia/vaultwarden/wiki)
- [Traefik + Docker Guide](https://doc.traefik.io/traefik/providers/docker/)