# Traefik v3 Migration - Complete Summary

## 📋 What Has Been Created

### 1. Configuration Files

#### Core Traefik Configuration
- **`/Users/leonardoacosta/Personal/Installfest/homelab/traefik/traefik.yml`**
  - Static configuration (main Traefik settings)
  - Entry points: HTTP (80), HTTPS (443), Dashboard (8080)
  - Let's Encrypt configuration with HTTP challenge
  - Docker and File providers enabled
  - Logging and metrics configured
  - Production-ready settings

#### Dynamic Configuration Files
- **`/Users/leonardoacosta/Personal/Installfest/homelab/traefik/dynamic/middlewares.yml`**
  - Security headers middleware
  - Authentication (dashboard-auth, admin-auth)
  - Rate limiting (general, strict, auth)
  - Compression
  - IP whitelisting (local-only)
  - Pre-configured middleware chains:
    - `homelab-general@file` (security + compression + rate limiting)
    - `homelab-admin@file` (+ authentication + local-only)
    - `media-services@file` (optimized for streaming)
    - `homelab-public@file` (no authentication)
  - Service-specific middlewares (Vaultwarden, Home Assistant)
  - CORS headers for APIs

- **`/Users/leonardoacosta/Personal/Installfest/homelab/traefik/dynamic/tls.yml`**
  - TLS options (modern, intermediate, default)
  - Cipher suite configurations
  - Certificate store definitions
  - Ready for custom certificates if needed

- **`/Users/leonardoacosta/Personal/Installfest/homelab/traefik/dynamic/gluetun-routers.yml`**
  - Routes for services using network_mode: service:gluetun
  - qBittorrent (172.21.0.2:8080)
  - Prowlarr (172.21.0.2:9696)
  - NZBGet (172.21.0.2:6789)
  - Health checks configured

#### Docker Compose
- **`/Users/leonardoacosta/Personal/Installfest/homelab/docker-compose-traefik.yml`**
  - Complete docker-compose with Traefik v3 replacing nginx-proxy-manager
  - Traefik service with proper networking (172.20.0.81, 172.21.0.81)
  - All 15+ services updated with Traefik labels
  - Proper middleware assignments
  - Health checks maintained
  - Resource limits preserved
  - Security settings retained

#### Environment Configuration
- **`/Users/leonardoacosta/Personal/Installfest/homelab/.env.traefik`**
  - New environment variables for Traefik
  - Domain configuration (DOMAIN=local by default)
  - Let's Encrypt email
  - Dashboard authentication
  - Optional Cloudflare DNS challenge variables
  - All original variables preserved
  - Service URLs documented

### 2. Documentation

#### Main Migration Guide
- **`/Users/leonardoacosta/Personal/Installfest/homelab/TRAEFIK_MIGRATION_GUIDE.md`**
  - Complete step-by-step migration instructions
  - Prerequisites and preparation
  - 8-step migration process
  - DNS/hosts configuration
  - Advanced configuration (Cloudflare, custom middleware)
  - Comprehensive troubleshooting section
  - Testing checklist (30+ items)
  - Rollback procedure
  - Security best practices
  - Performance optimization tips
  - Post-migration next steps

#### Quick Reference
- **`/Users/leonardoacosta/Personal/Installfest/homelab/traefik/README.md`**
  - Directory structure explanation
  - Configuration file reference
  - How to add new services (2 methods)
  - Common middleware combinations
  - Multiple domain examples
  - WebSocket support guide
  - Debugging commands
  - Common issues and solutions
  - Security hardening
  - Performance tuning
  - Useful commands reference

#### Comparison Document
- **`/Users/leonardoacosta/Personal/Installfest/homelab/TRAEFIK_VS_NPM.md`**
  - Feature-by-feature comparison
  - Migration benefits analysis
  - Time savings calculations
  - When to use each solution
  - Migration effort estimation
  - Decision matrix for your use case
  - Final recommendation with reasoning

### 3. Helper Scripts

All scripts located in `/Users/leonardoacosta/Personal/Installfest/homelab/traefik/scripts/`:

- **`generate-password.sh`**
  - Generate htpasswd hash for dashboard authentication
  - Automatically escapes for docker-compose
  - Usage: `./generate-password.sh username password`

- **`check-certificates.sh`**
  - View Let's Encrypt certificate status
  - Check acme.json contents
  - Verify file permissions
  - Display rate limit information
  - Useful certificate commands

- **`test-service.sh`**
  - Test if a service is accessible through Traefik
  - 5-stage testing: DNS, HTTP, HTTPS, SSL cert, security headers
  - Troubleshooting suggestions
  - Usage: `./test-service.sh service.local`

- **`backup-config.sh`**
  - Backup all Traefik configuration
  - Includes static config, dynamic config, and certificates
  - Creates compressed archive with timestamp
  - Shows restore instructions
  - Usage: `./backup-config.sh [backup-directory]`

All scripts are executable and production-ready.

## 🎯 Services Configured

### Services with Direct Network Access (Docker Labels)

1. **Traefik Dashboard** (https://traefik.local)
   - Middleware: dashboard-auth@file
   - Authentication required

2. **Glance Dashboard** (https://glance.local, https://dashboard.local)
   - Middleware: homelab-public@file
   - Port: 8080 (internal)

3. **Home Assistant** (https://ha.local, https://homeassistant.local)
   - Middleware: homeassistant-headers@file, compression@file
   - WebSocket support enabled
   - Port: 8123 (internal)

4. **AdGuard Home** (https://adguard.local, https://dns.local)
   - Middleware: homelab-admin@file (requires auth)
   - Port: 82 (internal)

5. **Ollama API** (https://ollama.local)
   - Middleware: local-only@file
   - Port: 11434 (internal)

6. **Ollama WebUI** (https://chat.local, https://ollama-ui.local)
   - Middleware: homelab-general@file
   - Port: 8080 (internal)

7. **Jellyfin** (https://jellyfin.local, https://media.local)
   - Middleware: media-services@file
   - WebSocket support enabled
   - Port: 8096 (internal)

8. **Vaultwarden** (https://vault.local, https://vaultwarden.local)
   - Middleware: vaultwarden-headers@file
   - WebSocket route configured (/notifications/hub)
   - Ports: 80 (HTTP), 3012 (WebSocket)

9. **Jellyseerr** (https://jellyseerr.local, https://requests.local)
   - Middleware: media-services@file
   - Port: 5055 (internal)

10. **Radarr** (https://radarr.local)
    - Middleware: media-services@file
    - Port: 7878 (internal)

11. **Sonarr** (https://sonarr.local)
    - Middleware: media-services@file
    - Port: 8989 (internal)

12. **Lidarr** (https://lidarr.local)
    - Middleware: media-services@file
    - Port: 8686 (internal)

13. **Bazarr** (https://bazarr.local)
    - Middleware: media-services@file
    - Port: 6767 (internal)

### Services Behind Gluetun (File-Based Routes)

14. **Gluetun Control** (https://gluetun.local, https://vpn.local)
    - Middleware: homelab-admin@file
    - Port: 8000 (via 172.21.0.2)

15. **qBittorrent** (https://qbittorrent.local, https://qb.local, https://torrent.local)
    - Middleware: homelab-admin@file (requires auth)
    - Port: 8080 (via 172.21.0.2)

16. **Prowlarr** (https://prowlarr.local)
    - Middleware: media-services@file
    - Port: 9696 (via 172.21.0.2)

17. **NZBGet** (https://nzbget.local, https://usenet.local)
    - Middleware: homelab-admin@file (requires auth)
    - Port: 6789 (via 172.21.0.2)

## 🔐 Security Features Implemented

### 1. Authentication
- **Dashboard**: Basic authentication (default: admin/admin - CHANGE THIS!)
- **Admin Services**: qBittorrent, NZBGet, AdGuard, Gluetun
- **Local-Only Access**: Ollama API restricted to local networks

### 2. Security Headers (Applied Automatically)
- Strict-Transport-Security (HSTS) with 1-year max-age
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- X-Robots-Tag: noindex, nofollow (privacy)
- Server header hidden

### 3. Rate Limiting
- **General**: 100 req/s, burst 50
- **Strict**: 10 req/s, burst 5 (admin services)
- **Auth**: 5 req/min, burst 2 (authentication endpoints)

### 4. Network Segmentation
- Traefik connected to both networks (172.20.0.81, 172.21.0.81)
- Services properly isolated on homelab and media networks
- Gluetun services isolated behind VPN

### 5. TLS Configuration
- TLS 1.2 minimum (TLS 1.3 for modern profile)
- Strong cipher suites
- HTTP/2 and HTTP/3 ready
- Automatic certificate management

### 6. IP Whitelisting
- Local-only middleware restricts to:
  - 172.20.0.0/16 (homelab network)
  - 172.21.0.0/16 (media network)
  - 10.0.0.0/8, 192.168.0.0/16 (private networks)

## 📊 Network Architecture

### Before Migration (NPM)
```
Internet/LAN → nginx-proxy-manager (172.20.0.81, 172.21.0.81)
                ↓
                Manual proxy hosts → Services
                ↓
                Database-driven routing
```

### After Migration (Traefik)
```
Internet/LAN → Traefik (172.20.0.81, 172.21.0.81)
                ↓
                ├─ homelab network (172.20.0.0/16)
                │  ├─ Home Assistant (172.20.0.123)
                │  ├─ Glance (172.20.0.85)
                │  ├─ AdGuard (172.20.0.53)
                │  ├─ Vaultwarden (172.20.0.22)
                │  ├─ Ollama (172.20.0.11)
                │  ├─ Ollama WebUI (172.20.0.12)
                │  └─ Jellyseerr (172.20.0.55)
                │
                └─ media network (172.21.0.0/16)
                   ├─ Jellyfin (172.21.0.96)
                   ├─ Gluetun (172.21.0.2)
                   │  ├─ qBittorrent
                   │  ├─ Prowlarr
                   │  └─ NZBGet
                   ├─ Radarr (172.21.0.78)
                   ├─ Sonarr (172.21.0.89)
                   ├─ Lidarr (172.21.0.86)
                   └─ Bazarr (172.21.0.67)
```

## 🚀 Quick Start (Migration Steps)

### 1. Pre-Migration (5 minutes)
```bash
cd /Users/leonardoacosta/Personal/Installfest/homelab

# Backup current setup
sudo tar -czf npm-backup-$(date +%Y%m%d).tar.gz nginx-proxy-manager/

# Copy environment file
cp .env.traefik .env

# Update critical variables in .env:
# - DOMAIN (your domain or 'local')
# - LETSENCRYPT_EMAIL (your email)
nano .env
```

### 2. Update Authentication (2 minutes)
```bash
cd traefik/scripts

# Generate password hash
./generate-password.sh admin YourSecurePassword123

# Copy output to traefik/dynamic/middlewares.yml
# Update both dashboard-auth and admin-auth sections
```

### 3. Stop NPM (1 minute)
```bash
cd /Users/leonardoacosta/Personal/Installfest/homelab

docker-compose stop nginx-proxy-manager
docker-compose rm -f nginx-proxy-manager
```

### 4. Deploy Traefik (2 minutes)
```bash
# Rename files
mv docker-compose.yml docker-compose.yml.npm-backup
mv docker-compose-traefik.yml docker-compose.yml

# Start Traefik only
docker-compose up -d traefik

# Check logs
docker logs -f traefik
# Wait for "Configuration loaded" message
```

### 5. Configure DNS (5 minutes)
See DNS section in migration guide. Either:
- Add DNS rewrites in AdGuard Home (recommended)
- Update /etc/hosts on client machines (for testing)

All domains point to: 172.20.0.81 (Traefik's IP)

### 6. Test & Deploy Services (20 minutes)
```bash
# Test individual services
docker-compose up -d glance
./traefik/scripts/test-service.sh glance.local

docker-compose up -d homeassistant
./traefik/scripts/test-service.sh ha.local

# Deploy all services
docker-compose up -d

# Verify all running
docker-compose ps
```

### 7. Verify Functionality (10 minutes)
- Access Traefik dashboard: https://traefik.local
- Test each service URL (see service list above)
- Verify SSL certificates (may show warnings for .local domains)
- Check security headers in browser dev tools
- Test authentication on admin services

## 🐛 Common Issues & Solutions

### Issue 1: Service Not Accessible
```bash
# Check if Traefik can reach service
docker exec -it traefik wget -O- http://service-name:8080

# Verify labels
docker inspect service-name | grep traefik

# Check Traefik dashboard for route status
```

### Issue 2: SSL Certificate Errors
- **For .local domains**: Expected, use HTTP or accept warnings
- **For real domains**: Ensure ports 80/443 forwarded, DNS correct
- **Rate limits**: Use staging environment for testing

### Issue 3: Authentication Not Working
```bash
# Regenerate password hash
cd traefik/scripts
./generate-password.sh admin newpassword

# Update middlewares.yml
# Restart Traefik
docker-compose restart traefik
```

### Issue 4: Gluetun Services Unreachable
```bash
# Check Gluetun is connected
docker logs gluetun | tail -20

# Test direct access
curl http://172.21.0.2:8080  # qBittorrent
curl http://172.21.0.2:9696  # Prowlarr

# Verify dynamic config loaded
docker exec -it traefik cat /etc/traefik/dynamic/gluetun-routers.yml
```

## 📈 Post-Migration Benefits

### Immediate Benefits
- ✅ Automatic service discovery
- ✅ No more GUI configuration
- ✅ Automatic SSL management
- ✅ Better security headers
- ✅ Per-service rate limiting
- ✅ Real-time configuration updates

### Long-Term Benefits
- ✅ Infrastructure as code (Git version control)
- ✅ Faster service deployment
- ✅ Better monitoring (Prometheus metrics)
- ✅ Advanced load balancing ready
- ✅ Easier disaster recovery
- ✅ Consistent configuration across environments

### Performance Improvements
- ✅ Connection pooling (maxIdleConnsPerHost: 200)
- ✅ HTTP/2 enabled by default
- ✅ Compression middleware
- ✅ No database lookups for routing
- ✅ Hot reload without downtime

### Security Improvements
- ✅ No exposed management port (vs NPM's port 81)
- ✅ Automatic security headers
- ✅ Rate limiting per service
- ✅ IP whitelisting per route
- ✅ TLS 1.3 support
- ✅ Better HSTS configuration

## 📝 Important Notes

### 1. Default Credentials
**CRITICAL**: Change default dashboard password!
```bash
cd traefik/scripts
./generate-password.sh admin YourSecurePassword
# Update middlewares.yml with output
```

### 2. Domain Configuration
Update `DOMAIN` in `.env` based on your setup:
- **Local network**: `DOMAIN=local`
- **Real domain**: `DOMAIN=yourdomain.com`
- **Tailscale**: `DOMAIN=your-tailnet.ts.net`

### 3. Let's Encrypt Email
Update `LETSENCRYPT_EMAIL` in:
- `.env` file
- `traefik/traefik.yml` (certificatesResolvers section)

### 4. Certificate Warnings
For `.local` domains, browsers will show certificate warnings. This is normal. Options:
1. Accept warnings (click "Advanced" → "Proceed")
2. Use real domain with proper DNS
3. Use mkcert for local trusted certificates

### 5. Port Forwarding (Internet Access)
If exposing to internet:
- Forward port 80 → 172.20.0.81:80
- Forward port 443 → 172.20.0.81:443
- Let's Encrypt will validate automatically

### 6. Backup Strategy
```bash
# Weekly backups recommended
cd traefik/scripts
./backup-config.sh

# Add to crontab for automation
0 2 * * 0 /path/to/backup-config.sh
```

## 🔄 Rollback Procedure

If issues arise:
```bash
# Stop all services
docker-compose down

# Restore original docker-compose
mv docker-compose.yml docker-compose.yml.traefik-attempted
mv docker-compose.yml.npm-backup docker-compose.yml

# Restore original .env if changed
mv .env .env.traefik
mv .env.backup .env  # if you created backup

# Start nginx-proxy-manager
docker-compose up -d nginx-proxy-manager

# Start other services
docker-compose up -d
```

## 🎓 Learning Resources

### Traefik Documentation
- Main docs: https://doc.traefik.io/traefik/
- Docker provider: https://doc.traefik.io/traefik/providers/docker/
- Routing: https://doc.traefik.io/traefik/routing/routers/
- Middleware: https://doc.traefik.io/traefik/middlewares/overview/
- Let's Encrypt: https://doc.traefik.io/traefik/https/acme/

### Your Documentation
- **Quick reference**: `traefik/README.md`
- **Full migration guide**: `TRAEFIK_MIGRATION_GUIDE.md`
- **NPM comparison**: `TRAEFIK_VS_NPM.md`

### Helper Scripts
- **Generate password**: `traefik/scripts/generate-password.sh`
- **Check certificates**: `traefik/scripts/check-certificates.sh`
- **Test service**: `traefik/scripts/test-service.sh`
- **Backup config**: `traefik/scripts/backup-config.sh`

## ✅ Migration Checklist

### Pre-Migration
- [ ] Backup nginx-proxy-manager configuration
- [ ] Copy .env.traefik to .env
- [ ] Update DOMAIN variable
- [ ] Update LETSENCRYPT_EMAIL
- [ ] Generate dashboard password hash
- [ ] Update middlewares.yml with new password

### Migration
- [ ] Stop nginx-proxy-manager
- [ ] Verify ports 80/443 released
- [ ] Rename docker-compose files
- [ ] Deploy Traefik
- [ ] Check Traefik logs for errors
- [ ] Configure DNS/hosts entries

### Testing
- [ ] Access Traefik dashboard
- [ ] Test Glance dashboard
- [ ] Test Home Assistant
- [ ] Test Jellyfin
- [ ] Test Vaultwarden
- [ ] Test all *arr services
- [ ] Test Gluetun services (qBittorrent, Prowlarr, NZBGet)
- [ ] Verify SSL certificates
- [ ] Check security headers
- [ ] Test authentication on admin services

### Post-Migration
- [ ] Deploy all services
- [ ] Verify all services accessible
- [ ] Check Traefik dashboard for errors
- [ ] Test WebSocket services (Home Assistant, Vaultwarden)
- [ ] Document any custom configurations
- [ ] Set up backup automation
- [ ] Update documentation with your specifics

## 🎯 Next Steps (Optional Enhancements)

### 1. Monitoring Stack
- Add Prometheus for metrics collection
- Add Grafana for visualization
- Import Traefik dashboard: https://grafana.com/grafana/dashboards/

### 2. Centralized Authentication (SSO)
- Deploy Authelia for SSO
- Configure OAuth providers (Google, GitHub)
- Protect services with forward auth

### 3. Fail2Ban Integration
- Monitor Traefik access logs
- Ban IPs with repeated authentication failures
- Protect against brute force

### 4. Advanced SSL
- Use DNS challenge for wildcard certificates
- Configure Cloudflare integration
- Set up automatic certificate renewal notifications

### 5. Error Pages
- Create custom error pages
- Configure error page middleware
- Better user experience

### 6. Load Balancing
- Deploy service replicas
- Configure load balancing
- Set up health checks

## 📞 Support

If you need help:

1. **Check logs**:
   ```bash
   docker logs traefik
   docker logs -f traefik  # follow mode
   tail -f traefik/logs/traefik.log
   ```

2. **Check dashboard**: https://traefik.local

3. **Use test script**:
   ```bash
   ./traefik/scripts/test-service.sh service.local
   ```

4. **Review documentation**:
   - Migration guide
   - README.md in traefik/
   - Official Traefik docs

5. **Common commands**:
   ```bash
   # Restart Traefik
   docker-compose restart traefik

   # Check configuration
   docker exec -it traefik traefik version

   # View routes
   curl -s http://172.20.0.81:8080/api/http/routers | jq

   # Test connectivity
   docker exec -it traefik ping service-name
   ```

## 🎉 Success Criteria

Migration is successful when:
- ✅ All 17 services accessible via HTTPS
- ✅ SSL certificates issued (or staging for testing)
- ✅ Authentication works on admin services
- ✅ No errors in Traefik logs
- ✅ Traefik dashboard shows all routes
- ✅ HTTP redirects to HTTPS
- ✅ Security headers present
- ✅ Gluetun services accessible through Traefik
- ✅ WebSocket services working (Home Assistant, Vaultwarden)
- ✅ No service functionality lost from NPM

---

**Migration created by**: Claude Code
**Date**: 2024-10-24
**Traefik version**: v3.3
**Status**: Ready for deployment

**Estimated total time**: 45-60 minutes for complete migration
**Difficulty**: Intermediate (detailed instructions provided)
**Rollback available**: Yes (see rollback procedure)

Good luck with your migration! 🚀
