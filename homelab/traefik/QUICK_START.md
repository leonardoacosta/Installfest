<!-- # Traefik v3 - Quick Start Guide

## 🚀 Fast Track Migration (30 minutes)

### Step 1: Backup & Prepare (3 minutes)
```bash
cd /Users/leonardoacosta/Personal/Installfest/homelab

# Copy environment file
cp .env.traefik .env
```

### Step 2: Configure Environment (2 minutes)
Edit `.env`:
```bash
nano .env
```

Update these lines:
```bash
DOMAIN=local                           # Change if using real domain
LETSENCRYPT_EMAIL=your-email@example.com  # Your email
```

### Step 3: Set Dashboard Password (2 minutes)
```bash
cd traefik/scripts

# Generate password (replace YourPassword)
./generate-password.sh admin YourPassword -->
<!-- 
# Copy the output line and edit middlewares
nano ../dynamic/middlewares.yml

# Find 'dashboard-auth:' section and replace the users line
# Also update 'admin-auth:' section
```

### Step 4: Stop NPM (1 minute)
```bash
cd /Users/leonardoacosta/Personal/Installfest/homelab

docker-compose stop nginx-proxy-manager
docker-compose rm -f nginx-proxy-manager

# Verify ports released
sudo lsof -i :80
sudo lsof -i :443
``` -->
<!-- 
### Step 5: Deploy Traefik (2 minutes)
```bash
# Backup original compose file
mv docker-compose.yml docker-compose.yml.npm-backup

# Use new Traefik compose file
mv docker-compose-traefik.yml docker-compose.yml

# Start Traefik
docker-compose up -d traefik

# Watch logs (Ctrl+C to exit)
docker logs -f traefik
```

Look for:
- ✅ "Configuration loaded from file"
- ✅ "Server listening on :80"
- ✅ "Server listening on :443"
- ❌ No error messages -->

### Step 6: Configure DNS (5 minutes)

**Option A: AdGuard Home DNS Rewrites (Recommended)**
1. Access AdGuard at http://172.20.0.53:82
2. Go to Filters → DNS rewrites
3. Add these entries (all pointing to 172.20.0.81):
   ```
   traefik.local       → 172.20.0.81
   glance.local        → 172.20.0.81
   dashboard.local     → 172.20.0.81
   ha.local            → 172.20.0.81
   homeassistant.local → 172.20.0.81
   adguard.local       → 172.20.0.81
   dns.local           → 172.20.0.81
   chat.local          → 172.20.0.81
   ollama-ui.local     → 172.20.0.81
   ollama.local        → 172.20.0.81
   jellyfin.local      → 172.20.0.81
   media.local         → 172.20.0.81
   vault.local         → 172.20.0.81
   vaultwarden.local   → 172.20.0.81
   jellyseerr.local    → 172.20.0.81
   requests.local      → 172.20.0.81
   radarr.local        → 172.20.0.81
   sonarr.local        → 172.20.0.81
   lidarr.local        → 172.20.0.81
   bazarr.local        → 172.20.0.81
   qbittorrent.local   → 172.20.0.81
   qb.local            → 172.20.0.81
   torrent.local       → 172.20.0.81
   prowlarr.local      → 172.20.0.81
   nzbget.local        → 172.20.0.81
   usenet.local        → 172.20.0.81
   gluetun.local       → 172.20.0.81
   vpn.local           → 172.20.0.81
   ```

**Option B: /etc/hosts (For Testing)**
```bash
# On your client machine
sudo nano /etc/hosts

# Add all entries
172.20.0.81 traefik.local
172.20.0.81 glance.local dashboard.local
172.20.0.81 ha.local homeassistant.local
172.20.0.81 adguard.local dns.local
172.20.0.81 chat.local ollama-ui.local ollama.local
172.20.0.81 jellyfin.local media.local
172.20.0.81 vault.local vaultwarden.local
172.20.0.81 jellyseerr.local requests.local
172.20.0.81 radarr.local sonarr.local lidarr.local bazarr.local
172.20.0.81 qbittorrent.local qb.local torrent.local
172.20.0.81 prowlarr.local nzbget.local usenet.local
172.20.0.81 gluetun.local vpn.local
```

### Step 7: Test Traefik Dashboard (2 minutes)
```bash
# Test from server
curl -k https://traefik.local

# Or open in browser
# https://traefik.local
# Login: admin / YourPassword (from Step 3)
```

Should see:
- ✅ Login prompt
- ✅ Dashboard loads
- ✅ Shows entrypoints (web, websecure)

### Step 8: Deploy Services (10 minutes)
```bash
# Deploy all services at once
docker-compose up -d

# OR deploy one by one for testing
docker-compose up -d glance
docker-compose up -d homeassistant
docker-compose up -d jellyfin
# ... etc
```

### Step 9: Test Services (5 minutes)
```bash
cd traefik/scripts

# Test each service
./test-service.sh glance.local
./test-service.sh ha.local
./test-service.sh jellyfin.local
./test-service.sh vault.local

# Or test manually
curl -k https://glance.local
curl -k https://ha.local
curl -k https://jellyfin.local
```

### Step 10: Verify Everything (5 minutes)

**✅ Checklist:**
- [ ] Traefik dashboard accessible (https://traefik.local)
- [ ] Dashboard requires authentication
- [ ] Glance dashboard loads (https://glance.local)
- [ ] Home Assistant loads (https://ha.local)
- [ ] Jellyfin loads (https://jellyfin.local)
- [ ] Vaultwarden loads (https://vault.local)
- [ ] All *arr services accessible
- [ ] qBittorrent requires authentication (https://qbittorrent.local)
- [ ] No errors in Traefik logs

**Check logs:**
```bash
docker logs traefik | tail -50
```

**View all routes in dashboard:**
```
https://traefik.local → HTTP → Routers
Should see all services listed
```

## 🎉 Done!

Your services are now accessible via:
- https://traefik.local (dashboard)
- https://glance.local (dashboard)
- https://ha.local (home assistant)
- https://jellyfin.local (media server)
- https://vault.local (password manager)
- https://radarr.local (movies)
- https://sonarr.local (tv shows)
- https://qbittorrent.local (torrents)
- ... etc (see full list in summary)

## ⚠️ Important Notes

### 1. SSL Certificate Warnings
For `.local` domains, you'll see certificate warnings. This is NORMAL. Options:
- Click "Advanced" → "Proceed to site"
- Use a real domain if you want valid certificates
- Certificates will be valid if using real domain + proper DNS

### 2. Change Default Password
The default dashboard password is what you set in Step 3. Make sure it's strong!

### 3. Authentication Required
These services require login (configured with admin-auth middleware):
- AdGuard Home (https://adguard.local)
- qBittorrent (https://qbittorrent.local)
- NZBGet (https://nzbget.local)
- Gluetun Control (https://gluetun.local)

Username: admin
Password: (same as dashboard password from Step 3)

### 4. Service Authentication
Services like Vaultwarden, Jellyfin, Home Assistant have their own authentication. Traefik just routes traffic to them.

## 🐛 Troubleshooting

### Service Not Loading
```bash
# Check if service is running
docker ps | grep service-name

# Check service logs
docker logs service-name

# Check Traefik logs
docker logs traefik | grep service-name

# Test if Traefik can reach service
docker exec -it traefik wget -O- http://service-name:port
```

### Dashboard Not Accessible
```bash
# Check Traefik is running
docker ps | grep traefik

# Check Traefik logs
docker logs traefik

# Verify password hash in middlewares.yml
cat traefik/dynamic/middlewares.yml | grep -A5 "dashboard-auth:"

# Test direct connection
curl -k https://172.20.0.81
```

### SSL Certificate Errors (Real Domain)
```bash
# Check Let's Encrypt logs
docker logs traefik | grep -i acme

# Check certificate file
ls -lh traefik/letsencrypt/acme.json

# View certificate status
./traefik/scripts/check-certificates.sh
```

### Gluetun Services Not Working
```bash
# Check Gluetun is connected
docker logs gluetun | tail -20

# Should see "Wireguard is up and running"

# Test direct access to Gluetun services
curl http://172.21.0.2:8080  # qBittorrent
curl http://172.21.0.2:9696  # Prowlarr
```

## 🔄 Rollback (If Needed)

```bash
# Stop everything
docker-compose down

# Restore original compose file
mv docker-compose.yml docker-compose.yml.traefik-failed
mv docker-compose.yml.npm-backup docker-compose.yml

# Start nginx-proxy-manager
docker-compose up -d nginx-proxy-manager

# Start services
docker-compose up -d
```

## 📚 Next Steps

### 1. Explore Dashboard
- Go to https://traefik.local
- Explore HTTP → Routers (see all services)
- Explore HTTP → Middlewares (see security features)
- Explore HTTP → Services (see backends)

### 2. Customize Middleware
Edit `traefik/dynamic/middlewares.yml`:
- Adjust rate limits
- Add custom security headers
- Create new middleware chains

Changes auto-reload (no restart needed!)

### 3. Add New Service
```yaml
# In docker-compose.yml
myservice:
  image: myimage
  ports:
    - "8080:8080"
  networks:
    homelab:
      ipv4_address: 172.20.0.XXX
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.myservice.rule=Host(`myservice.${DOMAIN}`)"
    - "traefik.http.routers.myservice.entrypoints=websecure"
    - "traefik.http.routers.myservice.tls.certresolver=letsencrypt"
    - "traefik.http.routers.myservice.middlewares=homelab-general@file"
    - "traefik.http.services.myservice.loadbalancer.server.port=8080"

# Deploy
docker-compose up -d myservice

# Add DNS entry
# Done!
```

### 4. Set Up Backups
```bash
# Manual backup
cd traefik/scripts
./backup-config.sh

# Automated backup (crontab)
crontab -e
# Add: 0 2 * * 0 /path/to/backup-config.sh
```

### 5. Monitor Logs
```bash
# Real-time logs
docker logs -f traefik

# Access logs
tail -f traefik/logs/access.log

# Error logs only
docker logs traefik 2>&1 | grep ERROR
```

## 📖 Full Documentation

- **Complete Migration Guide**: `TRAEFIK_MIGRATION_GUIDE.md`
- **Quick Reference**: `traefik/README.md`
- **NPM Comparison**: `TRAEFIK_VS_NPM.md`
- **Full Summary**: `TRAEFIK_MIGRATION_SUMMARY.md`

## 🆘 Need Help?

1. Check Traefik dashboard for errors
2. Read relevant documentation file
3. Use test scripts in `traefik/scripts/`
4. Check Traefik logs
5. Review service-specific logs

## ✅ Success Indicators

You'll know it's working when:
- ✅ All services accessible via HTTPS
- ✅ Traefik dashboard shows all routes
- ✅ No errors in logs
- ✅ Authentication works
- ✅ HTTP redirects to HTTPS
- ✅ Security headers present (check browser dev tools)

## 🎊 Congratulations!

You've successfully migrated from nginx-proxy-manager to Traefik v3!

Benefits you now have:
- ✅ Automatic service discovery
- ✅ Automatic SSL management
- ✅ Better security
- ✅ Infrastructure as code
- ✅ Real-time updates
- ✅ No management port
- ✅ Better monitoring

Enjoy your new reverse proxy setup! 🚀
