# Traefik v3 Migration Guide - From Nginx Proxy Manager

## Overview

This guide provides step-by-step instructions for migrating from nginx-proxy-manager to Traefik v3 for your homelab setup.

## Architecture Changes

### Before (nginx-proxy-manager)

- Manual proxy host configuration via web UI
- SSL certificates managed through GUI
- Routes configured manually
- Port 81 for management interface

### After (Traefik v3)

- Automatic service discovery via Docker labels
- Automatic SSL certificate management with Let's Encrypt
- Dynamic routing without restarts
- Dashboard secured with authentication
- No management port exposed externally

## Prerequisites

**Verify Domain Configuration**

- Determine your domain strategy:
  - **Local network only**: Use `.local` domains
  - **Internet-accessible**: Use your registered domain
  - **Tailscale**: Use `.ts.net` domain

## Migration Steps

### Step 1: Prepare Environment

1. **Update Environment Variables**

   ```bash
   # Copy the new environment file
   cp .env.traefik .env

   # Edit .env and update:
   nano .env
   ```

   Update these critical variables:

   - `DOMAIN`: Your domain (e.g., `local`, `yourdomain.com`, or `your-tailnet.ts.net`)
   - `LETSENCRYPT_EMAIL`: Your email for Let's Encrypt notifications
   - `TRAEFIK_DASHBOARD_USER` and `TRAEFIK_DASHBOARD_PASSWORD`: Dashboard credentials

2. **Create Traefik Directory Structure**

   ```bash
   mkdir -p traefik/{dynamic,letsencrypt,logs}
   chmod 600 traefik/letsencrypt  # Secure certificate directory
   ```

3. **Update Authentication in Middleware File**

   ```bash
   # Generate password hash
   PASSWORD_HASH=$(htpasswd -nb admin your_password | sed -e s/\\$/\\$\\$/g)

   # Edit middlewares.yml and replace the default hash
   nano traefik/dynamic/middlewares.yml
   # Update the 'dashboard-auth' and 'admin-auth' sections
   ```

### Step 2: Configure DNS/Hosts

For local network access, update your DNS or `/etc/hosts`:

**Option A: Local DNS (AdGuard Home)**

1. Access AdGuard Home admin panel
2. Add DNS rewrite rules for each service:
   ```
   traefik.local → 172.20.0.81
   glance.local → 172.20.0.81
   ha.local → 172.20.0.81
   jellyfin.local → 172.20.0.81
   vault.local → 172.20.0.81
   ... (add all services)
   ```

**Option B: /etc/hosts (for testing)**

```bash
# Add to /etc/hosts on your client machine
sudo nano /etc/hosts

# Add entries (replace 172.20.0.81 with your Traefik host IP)
172.20.0.81 traefik.local
172.20.0.81 glance.local dashboard.local
172.20.0.81 ha.local homeassistant.local
172.20.0.81 adguard.local dns.local
172.20.0.81 chat.local ollama-ui.local
172.20.0.81 jellyfin.local media.local
172.20.0.81 vault.local vaultwarden.local
172.20.0.81 jellyseerr.local requests.local
172.20.0.81 radarr.local
172.20.0.81 sonarr.local
172.20.0.81 lidarr.local
172.20.0.81 bazarr.local
172.20.0.81 qbittorrent.local qb.local torrent.local
172.20.0.81 prowlarr.local
172.20.0.81 nzbget.local usenet.local
172.20.0.81 gluetun.local vpn.local
```



### Step 7: SSL Certificate Considerations

**For Local Network (Self-Signed Certificates)**

- Traefik will generate Let's Encrypt certificates using HTTP challenge
- Your browser will show certificate warnings for `.local` domains
- Options:
  1. Accept the certificate warnings
  2. Add Let's Encrypt staging root CA to your system trust store
  3. Use mkcert to generate local trusted certificates (advanced)

**For Internet-Accessible Domains**

- Ensure your domain points to your public IP
- Configure port forwarding: 80, 443 → your Traefik host
- Let's Encrypt will automatically validate and issue certificates
- Consider using Cloudflare DNS challenge for wildcard certs (see below)

### Step 8: Full Stack Deployment

Once testing is complete:

```bash
# Deploy all services
docker-compose up -d

# Monitor startup
docker-compose logs -f

# Verify all services are running
docker-compose ps
```

## Advanced Configuration

### Cloudflare DNS Challenge (Wildcard Certificates)

For wildcard SSL certificates (\*.yourdomain.com):

1. **Get Cloudflare API credentials**

   - Log into Cloudflare
   - Go to My Profile → API Tokens
   - Create token with Zone:DNS:Edit permissions

2. **Update .env**

   ```bash
   CF_API_EMAIL=your-email@example.com
   CF_API_KEY=your-api-key
   ```

3. **Update traefik.yml**

   ```yaml
   certificatesResolvers:
     letsencrypt:
       acme:
         email: "your-email@example.com"
         storage: "/letsencrypt/acme.json"
         dnsChallenge:
           provider: cloudflare
           delayBeforeCheck: 30s
           resolvers:
             - "1.1.1.1:53"
             - "8.8.8.8:53"
   ```

4. **Restart Traefik**
   ```bash
   docker-compose restart traefik
   ```

### Custom Middleware Chains

Create custom middleware chains for specific services:

```yaml
# In traefik/dynamic/middlewares.yml
http:
  middlewares:
    my-custom-chain:
      chain:
        middlewares:
          - security-headers
          - compression
          - rate-limit-general
          - local-only
```

Apply in docker-compose labels:

```yaml
labels:
  - "traefik.http.routers.myservice.middlewares=my-custom-chain@file"
```

### Monitoring Traefik Metrics

Enable Prometheus metrics (already configured):

```bash
# Access Prometheus metrics
curl http://172.20.0.81:8080/metrics
```

Integrate with Grafana:

- Add Prometheus data source pointing to Traefik
- Import Traefik dashboard: https://grafana.com/grafana/dashboards/

## Troubleshooting

### Issue: Service not accessible

**Check 1: Verify Traefik can reach the service**

```bash
# From inside Traefik container
docker exec -it traefik wget -O- http://172.20.0.85:8080
```

**Check 2: Verify labels are applied**

```bash
docker inspect glance | grep traefik
```

**Check 3: Check Traefik logs**

```bash
docker logs traefik | grep -i error
tail -f traefik/logs/traefik.log
```

### Issue: SSL certificate errors

**For HTTP challenge**

- Ensure port 80 is accessible from the internet
- Check firewall rules
- Verify DNS points to your public IP

**Check certificate status**

```bash
cat traefik/letsencrypt/acme.json | jq .
```

**Use staging environment for testing**

```yaml
# In traefik.yml
certificatesResolvers:
  letsencrypt:
    acme:
      caServer: "https://acme-staging-v02.api.letsencrypt.org/directory"
```

### Issue: Gluetun services unreachable

**Check 1: Verify Gluetun is connected**

```bash
docker logs gluetun | tail -20
# Look for: "Wireguard is up and running"
```

**Check 2: Verify dynamic configuration loaded**

```bash
docker exec -it traefik cat /etc/traefik/dynamic/gluetun-routers.yml
```

**Check 3: Test direct connection**

```bash
# From host
curl http://172.21.0.2:8080  # qBittorrent
curl http://172.21.0.2:9696  # Prowlarr
```

### Issue: Dashboard authentication not working

**Regenerate password hash**

```bash
echo $(htpasswd -nb admin your_password) | sed -e s/\\$/\\$\\$/g
```

**Update middlewares.yml and restart**

```bash
docker-compose restart traefik
```

### Issue: Middleware not applying

**Check middleware syntax in docker-compose**

```yaml
# Correct
- "traefik.http.routers.myservice.middlewares=security-headers@file"

# Wrong (missing @file)
- "traefik.http.routers.myservice.middlewares=security-headers"
```

**Verify middleware exists**

```bash
docker exec -it traefik cat /etc/traefik/dynamic/middlewares.yml | grep -A5 "security-headers:"
```

## Testing Checklist

### Basic Functionality

- [ ] Traefik dashboard accessible (https://traefik.local)
- [ ] Dashboard requires authentication
- [ ] HTTP redirects to HTTPS
- [ ] SSL certificates issued (or in staging)

### Service Accessibility

- [ ] Glance dashboard (https://glance.local)
- [ ] Home Assistant (https://ha.local)
- [ ] AdGuard Home (https://adguard.local)
- [ ] Ollama WebUI (https://chat.local)
- [ ] Jellyfin (https://jellyfin.local)
- [ ] Vaultwarden (https://vault.local)
- [ ] Jellyseerr (https://jellyseerr.local)
- [ ] Radarr (https://radarr.local)
- [ ] Sonarr (https://sonarr.local)
- [ ] Lidarr (https://lidarr.local)
- [ ] Bazarr (https://bazarr.local)

### Gluetun Services

- [ ] qBittorrent (https://qbittorrent.local)
- [ ] Prowlarr (https://prowlarr.local)
- [ ] NZBGet (https://nzbget.local)
- [ ] Gluetun control panel (https://gluetun.local)

### Security

- [ ] All services use HTTPS
- [ ] Security headers applied (check browser dev tools)
- [ ] Admin services require authentication
- [ ] Local-only services restricted to local network
- [ ] Rate limiting functional (test with curl loop)

### Performance

- [ ] Compression enabled (check response headers)
- [ ] Response times acceptable
- [ ] No certificate errors (after Let's Encrypt issues certs)
- [ ] WebSockets working (Home Assistant, Vaultwarden)

### Monitoring

- [ ] Access logs being written (traefik/logs/access.log)
- [ ] Error logs being written when errors occur
- [ ] Prometheus metrics accessible
- [ ] Traefik dashboard shows all routes

## Rollback Procedure

If you need to rollback to nginx-proxy-manager:

```bash
# Stop all services
docker-compose down

# Restore original docker-compose
mv docker-compose.yml.npm-backup docker-compose.yml

# Restore nginx-proxy-manager
docker-compose up -d nginx-proxy-manager

# Restore other services
docker-compose up -d
```

## Security Best Practices

### 1. Secure the Dashboard

- Use strong passwords
- Consider restricting to local network only:
  ```yaml
  - "traefik.http.routers.traefik-dashboard.middlewares=local-only@file,dashboard-auth@file"
  ```

### 2. Protect Sensitive Services

- Vaultwarden, AdGuard, and \*arr services should have authentication
- Consider using Authelia or OAuth for SSO (future enhancement)

### 3. Regular Updates

```bash
# Update Traefik
docker-compose pull traefik
docker-compose up -d traefik

# Monitor changelog for security updates
```

### 4. Certificate Management

- Monitor Let's Encrypt rate limits
- Use staging environment for testing
- Backup acme.json regularly:
  ```bash
  cp traefik/letsencrypt/acme.json traefik/letsencrypt/acme.json.backup
  ```

### 5. Network Segmentation

- Keep media services on media network
- Core services on homelab network
- Traefik bridges both networks securely

## Performance Optimization

### 1. Enable HTTP/3 (QUIC)

```yaml
# In traefik.yml
entryPoints:
  websecure:
    address: ":443"
    http3: {}
```

### 2. Adjust Resource Limits

```yaml
# In docker-compose.yml for high-traffic setups
deploy:
  resources:
    limits:
      cpus: "2.0"
      memory: 1G
```

### 3. Enable Access Log Filtering

- Already configured to log only errors (400-599)
- Reduces disk I/O

### 4. Connection Pooling

- Already configured in traefik.yml
- `maxIdleConnsPerHost: 200`

## Next Steps

1. **Add Monitoring Stack**

   - Prometheus for metrics
   - Grafana for visualization
   - Loki for log aggregation

2. **Implement SSO**

   - Add Authelia for centralized authentication
   - Configure OAuth providers

3. **Add Fail2Ban**

   - Monitor Traefik access logs
   - Ban IPs with repeated authentication failures

4. **Implement Rate Limiting**

   - Already configured in middlewares
   - Tune values based on usage patterns

5. **Set Up Alerts**
   - Certificate expiration warnings
   - Service availability alerts
   - Error rate thresholds

## Additional Resources

- [Traefik v3 Documentation](https://doc.traefik.io/traefik/)
- [Docker Provider Guide](https://doc.traefik.io/traefik/providers/docker/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Middleware Reference](https://doc.traefik.io/traefik/middlewares/overview/)
- [Security Headers Guide](https://securityheaders.com/)

## Support

If you encounter issues:

1. Check Traefik logs: `docker logs traefik`
2. Verify configuration: `docker exec -it traefik traefik version`
3. Test connectivity: `docker exec -it traefik ping <service-name>`
4. Review Traefik dashboard for route status
5. Consult Traefik community forums or GitHub issues

---

**Note**: This migration maintains all functionality from nginx-proxy-manager while providing:

- Automatic service discovery
- Better performance with connection pooling
- More granular security controls
- Native Docker integration
- Real-time configuration updates without restarts
