# Traefik v3 Configuration Reference

## Quick Overview

This directory contains the Traefik v3 reverse proxy configuration for your homelab.

### Directory Structure

```
traefik/
├── traefik.yml                 # Static configuration (main config)
├── dynamic/                    # Dynamic configuration (auto-reloaded)
│   ├── middlewares.yml         # Reusable middlewares (auth, security, etc.)
│   ├── tls.yml                 # TLS options and certificates
│   └── gluetun-routers.yml     # Routes for services behind Gluetun VPN
├── letsencrypt/                # Let's Encrypt certificates (auto-managed)
│   └── acme.json               # Certificate storage (do not edit manually)
└── logs/                       # Traefik logs
    ├── traefik.log             # General logs
    └── access.log              # HTTP access logs

```

## Configuration Files

### traefik.yml (Static Configuration)

Main Traefik configuration that requires container restart to change:
- Entry points (ports 80, 443, 8080)
- Certificate resolvers (Let's Encrypt)
- Providers (Docker, File)
- Logging configuration
- API/Dashboard settings

**Edit this file when you need to:**
- Change listening ports
- Modify Let's Encrypt settings
- Adjust log levels
- Add/remove providers

**After editing, restart Traefik:**
```bash
docker-compose restart traefik
```

### dynamic/ (Dynamic Configuration)

Files in this directory are auto-reloaded without restarting Traefik:

#### middlewares.yml
Defines reusable middleware for:
- **Security Headers**: HSTS, XSS protection, CSP
- **Authentication**: Basic auth for dashboard/admin
- **Rate Limiting**: General, strict, and auth-specific
- **Compression**: Gzip/Brotli for responses
- **IP Whitelisting**: Local network restrictions
- **Middleware Chains**: Pre-configured combinations

**Common middleware chains:**
- `homelab-general@file`: Security + compression + rate limiting
- `homelab-admin@file`: Above + authentication + local-only
- `media-services@file`: Optimized for media streaming
- `homelab-public@file`: Security + compression (no auth)

#### tls.yml
TLS/SSL configuration:
- **TLS Options**: Modern, intermediate, and default profiles
- **Cipher Suites**: Secure encryption algorithms
- **Certificate Stores**: Custom certificate locations

#### gluetun-routers.yml
Routes for services using `network_mode: service:gluetun`:
- qBittorrent (172.21.0.2:8080)
- Prowlarr (172.21.0.2:9696)
- NZBGet (172.21.0.2:6789)

These services can't use Docker labels, so routes are defined here.

## Service Routing

### How Services Get Routed

**Services with their own network** (most services):
- Use Docker labels in `docker-compose.yml`
- Traefik auto-discovers them
- Example:
  ```yaml
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.myservice.rule=Host(`myservice.local`)"
    - "traefik.http.routers.myservice.entrypoints=websecure"
    - "traefik.http.routers.myservice.tls.certresolver=letsencrypt"
    - "traefik.http.services.myservice.loadbalancer.server.port=8080"
  ```

**Services behind Gluetun** (network_mode: service:gluetun):
- Cannot use Docker labels
- Routes defined in `gluetun-routers.yml`
- Must use Gluetun's IP address (172.21.0.2)

## Adding a New Service

### Method 1: Service with Own Network

Add labels to your service in `docker-compose.yml`:

```yaml
myservice:
  image: myimage:latest
  container_name: myservice
  ports:
    - "8080:8080"
  networks:
    homelab:
      ipv4_address: 172.20.0.100
  labels:
    - "traefik.enable=true"

    # Router configuration
    - "traefik.http.routers.myservice.rule=Host(`myservice.${DOMAIN:-local}`)"
    - "traefik.http.routers.myservice.entrypoints=websecure"
    - "traefik.http.routers.myservice.tls.certresolver=letsencrypt"

    # Middleware (choose appropriate chain)
    - "traefik.http.routers.myservice.middlewares=homelab-general@file"

    # Service configuration (specify internal port)
    - "traefik.http.services.myservice.loadbalancer.server.port=8080"
```

Then:
```bash
docker-compose up -d myservice
```

Traefik will automatically detect and route the service!

### Method 2: Service Behind Gluetun

Add to `dynamic/gluetun-routers.yml`:

```yaml
http:
  routers:
    myservice:
      rule: "Host(`myservice.{{ env \"DOMAIN\" }}`)"
      entryPoints:
        - websecure
      service: myservice-service
      middlewares:
        - homelab-general@file
      tls:
        certResolver: letsencrypt

  services:
    myservice-service:
      loadBalancer:
        servers:
          - url: "http://172.21.0.2:8080"
        passHostHeader: true
```

Traefik will auto-reload the configuration within seconds!

## Common Middleware Combinations

```yaml
# Public service (no auth)
- "traefik.http.routers.myservice.middlewares=homelab-public@file"

# General service (basic protection)
- "traefik.http.routers.myservice.middlewares=homelab-general@file"

# Admin service (auth + local only)
- "traefik.http.routers.myservice.middlewares=homelab-admin@file"

# Media streaming (optimized)
- "traefik.http.routers.myservice.middlewares=media-services@file"

# Custom combination
- "traefik.http.routers.myservice.middlewares=security-headers@file,compression@file,admin-auth@file"
```

## Multiple Domains per Service

You can define multiple domains for a single service:

```yaml
# Single domain
- "traefik.http.routers.myservice.rule=Host(`myservice.local`)"

# Multiple domains (OR)
- "traefik.http.routers.myservice.rule=Host(`myservice.local`) || Host(`service.local`)"

# Domain + path
- "traefik.http.routers.myservice.rule=Host(`myservice.local`) && PathPrefix(`/api`)"
```

## WebSocket Support

For services that need WebSocket support (Home Assistant, Vaultwarden):

```yaml
labels:
  - "traefik.http.services.myservice.loadbalancer.passhostheader=true"
```

Already configured for:
- Home Assistant
- Vaultwarden
- Jellyfin

## Debugging

### Check if Traefik sees your service

```bash
# View Traefik configuration
docker exec -it traefik traefik version

# Check for specific service
docker logs traefik | grep myservice

# View all routers
curl -s http://172.20.0.81:8080/api/http/routers | jq
```

### Test service connectivity from Traefik

```bash
# Test if Traefik can reach the service
docker exec -it traefik wget -O- http://172.20.0.100:8080
docker exec -it traefik ping myservice
```

### View dynamic configuration

```bash
# Check if dynamic config loaded
docker exec -it traefik cat /etc/traefik/dynamic/middlewares.yml
docker exec -it traefik cat /etc/traefik/dynamic/gluetun-routers.yml
```

### Monitor logs in real-time

```bash
# General logs
docker logs -f traefik

# Access logs
tail -f logs/access.log

# Error logs only
docker logs traefik 2>&1 | grep -i error
```

## Common Issues

### Service not accessible

1. **Check if Traefik can reach it:**
   ```bash
   docker exec -it traefik wget -O- http://service-name:8080
   ```

2. **Verify labels are correct:**
   ```bash
   docker inspect myservice | grep traefik
   ```

3. **Check Traefik dashboard:**
   - Go to https://traefik.local
   - Look for your service in HTTP Routers
   - Check if it's showing errors

### SSL Certificate issues

```bash
# Check certificate storage
ls -lh letsencrypt/

# View certificate details
cat letsencrypt/acme.json | jq

# Check Let's Encrypt rate limits
# https://letsencrypt.org/docs/rate-limits/
```

### Middleware not working

```bash
# Verify middleware exists
docker exec -it traefik cat /etc/traefik/dynamic/middlewares.yml | grep -A5 "middleware-name:"

# Check middleware is referenced correctly (needs @file suffix)
# Correct:   homelab-general@file
# Incorrect: homelab-general
```

## Security

### Change Dashboard Password

1. Generate new hash:
   ```bash
   htpasswd -nb admin new_password
   ```

2. Edit `dynamic/middlewares.yml`:
   ```yaml
   dashboard-auth:
     basicAuth:
       users:
         - "admin:$apr1$..." # Paste hash here, replace $ with $$
   ```

3. Wait a few seconds for auto-reload (no restart needed!)

### Restrict Dashboard to Local Network

Already configured! Dashboard uses `local-only@file` middleware which restricts to:
- 172.20.0.0/16 (homelab network)
- 172.21.0.0/16 (media network)
- 10.0.0.0/8, 192.168.0.0/16 (private ranges)

### Review Security Headers

Check your security headers:
```bash
curl -I https://myservice.local
```

Look for:
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`

## Performance

### Monitor Response Times

```bash
# Access logs show response times
tail -f logs/access.log

# Look for high response times (last field)
```

### Adjust Rate Limiting

Edit `dynamic/middlewares.yml`:

```yaml
rate-limit-general:
  rateLimit:
    average: 100  # Requests per second
    period: 1s
    burst: 50     # Burst capacity
```

### Connection Pooling

Already optimized in `traefik.yml`:
```yaml
serversTransport:
  maxIdleConnsPerHost: 200
```

## Useful Commands

```bash
# Restart Traefik
docker-compose restart traefik

# View Traefik version
docker exec -it traefik traefik version

# Validate configuration
docker exec -it traefik traefik healthcheck --ping

# Check certificate expiration
docker exec -it traefik cat /letsencrypt/acme.json | jq '.letsencrypt.Certificates[].domain.main'

# Monitor all container logs
docker-compose logs -f

# Update Traefik to latest version
docker-compose pull traefik
docker-compose up -d traefik
```

## Environment Variables in Dynamic Config

Dynamic config files support environment variables:

```yaml
# Use ${DOMAIN} in your rules
rule: "Host(`service.{{ env \"DOMAIN\" }}`)"
```

This pulls from your `.env` file.

## Advanced Features

### Load Balancing (Multiple Instances)

```yaml
services:
  myservice-lb:
    loadBalancer:
      servers:
        - url: "http://172.20.0.100:8080"
        - url: "http://172.20.0.101:8080"
      healthCheck:
        path: /health
        interval: 30s
```

### Sticky Sessions

```yaml
services:
  myservice:
    loadBalancer:
      sticky:
        cookie:
          name: traefik-sticky
          httpOnly: true
```

### Custom Error Pages

Uncomment in `middlewares.yml`:
```yaml
error-pages:
  errors:
    status:
      - "400-599"
    service: error-pages-service
    query: "/{status}.html"
```

## Resources

- **Traefik Dashboard**: https://traefik.local
- **Documentation**: https://doc.traefik.io/traefik/
- **Docker Provider**: https://doc.traefik.io/traefik/providers/docker/
- **Middleware Reference**: https://doc.traefik.io/traefik/middlewares/overview/
- **Routing Reference**: https://doc.traefik.io/traefik/routing/routers/

## Support

For issues or questions:
1. Check the migration guide: `TRAEFIK_MIGRATION_GUIDE.md`
2. Review Traefik logs: `docker logs traefik`
3. Visit Traefik dashboard for visual debugging
4. Consult official documentation
5. Check Traefik community forums
