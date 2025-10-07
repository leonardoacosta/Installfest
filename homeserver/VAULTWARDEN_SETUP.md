# Vaultwarden Setup Guide

## Overview

Vaultwarden has been added to your Docker homelab stack as a secure, self-hosted password manager. It's fully compatible with Bitwarden clients (web vault, browser extensions, mobile apps, desktop apps) but runs as a lightweight alternative written in Rust.

## Configuration Details

### Network Configuration
- **Network**: homelab (172.20.0.0/16)
- **Static IP**: 172.20.0.22
- **Web Interface Port**: 8222 (HTTP)
- **WebSocket Port**: 3012 (for real-time sync)

### Security Hardening Applied

Based on your SECURITY_AUDIT.md recommendations, Vaultwarden includes:

1. **Pinned Version**: `vaultwarden/server:1.32.5` (latest stable)
2. **Resource Limits**:
   - CPU: 1.0 core max
   - Memory: 512MB max, 128MB reserved
3. **Security Options**:
   - `no-new-privileges:true` - Prevents privilege escalation
   - Runs as non-root user (PUID/PGID)
4. **Health Checks**: Automated health monitoring every 30 seconds
5. **Proper Timezone**: Inherited from TZ environment variable

### Volume Mapping
- Host: `./vaultwarden/` (in homeserver directory)
- Container: `/data`
- Contains: SQLite database, attachments, icons, config

## Initial Setup

### Step 1: Generate Admin Token

Before starting Vaultwarden, generate a secure admin token:

```bash
cd /Users/leonardoacosta/Personal/Installfest/homeserver

# Generate a secure random token
openssl rand -base64 48

# Copy the output and update .env file
```

Edit `.env` and replace `VAULTWARDEN_ADMIN_TOKEN=CHANGE_ME_TO_SECURE_TOKEN` with your generated token.

**CRITICAL**: Store this token securely. You'll need it to access the admin panel.

### Step 2: Configure Domain (Optional)

If you plan to access Vaultwarden via a domain name:

```bash
# Edit .env
VAULTWARDEN_DOMAIN=https://vault.yourdomain.com
```

If using locally only, you can leave it as `https://vault.local` or use your local IP.

### Step 3: Start Vaultwarden

```bash
cd /Users/leonardoacosta/Personal/Installfest/homeserver

# Create the data directory with proper permissions
mkdir -p vaultwarden
chown -R ${PUID:-1000}:${PGID:-1000} vaultwarden

# Start Vaultwarden
docker-compose up -d vaultwarden

# Check logs
docker-compose logs -f vaultwarden

# Verify health status
docker ps | grep vaultwarden
# Should show "healthy" status after ~30 seconds
```

### Step 4: Create Your First User

1. Open your browser and navigate to: `http://YOUR_SERVER_IP:8222`
2. Click "Create Account"
3. Fill in:
   - Email address (doesn't need to be real if SMTP not configured)
   - Name
   - Master Password (CRITICAL: This encrypts your vault, make it strong!)
   - Password Hint (optional)
4. Click "Submit" to create your account

**IMPORTANT SECURITY STEP**: After creating your account(s), disable public signups:

```bash
# Edit .env
VAULTWARDEN_SIGNUPS_ALLOWED=false

# Restart Vaultwarden
docker-compose restart vaultwarden
```

## Access the Admin Panel

The admin panel provides insights into users, diagnostics, and configuration:

1. Navigate to: `http://YOUR_SERVER_IP:8222/admin`
2. Enter your `VAULTWARDEN_ADMIN_TOKEN` from `.env`
3. You'll see:
   - User overview
   - Diagnostics
   - Configuration options

### Admin Panel Features

- **Users**: View all registered users, delete users if needed
- **Diagnostics**: Check DNS resolution, connectivity, version info
- **Configuration**: Review environment variable settings

## Configure Email (Highly Recommended)

Email enables password reset hints and emergency access notifications.

### Gmail Example

1. Create an [App Password](https://myaccount.google.com/apppasswords) in your Google Account
2. Update `.env`:

```bash
VAULTWARDEN_SMTP_HOST=smtp.gmail.com
VAULTWARDEN_SMTP_FROM=your-email@gmail.com
VAULTWARDEN_SMTP_FROM_NAME=Vaultwarden
VAULTWARDEN_SMTP_SECURITY=starttls
VAULTWARDEN_SMTP_PORT=587
VAULTWARDEN_SMTP_USERNAME=your-email@gmail.com
VAULTWARDEN_SMTP_PASSWORD=your-16-char-app-password
VAULTWARDEN_SMTP_TIMEOUT=15
```

3. Restart: `docker-compose restart vaultwarden`
4. Test in admin panel: `/admin` → Diagnostics → Test SMTP

### Other Email Providers

**Outlook/Office365**:
```bash
VAULTWARDEN_SMTP_HOST=smtp.office365.com
VAULTWARDEN_SMTP_PORT=587
VAULTWARDEN_SMTP_SECURITY=starttls
```

**Custom SMTP Server**:
```bash
VAULTWARDEN_SMTP_HOST=mail.yourdomain.com
VAULTWARDEN_SMTP_PORT=587
VAULTWARDEN_SMTP_SECURITY=starttls  # or 'force_tls' or 'off'
```

## Set Up SSL with Nginx Proxy Manager

For secure external access, configure SSL reverse proxy through your existing Nginx Proxy Manager.

### Step 1: Prepare DNS

Option A - Local DNS (AdGuard Home):
1. Log into AdGuard Home: `http://YOUR_SERVER_IP:82`
2. Go to Filters → DNS rewrites
3. Add rewrite: `vault.yourdomain.com` → `172.20.0.81` (NPM IP)

Option B - Public DNS:
1. Add an A record in your DNS provider
2. Point to your public IP
3. Ensure port 443 is forwarded to Nginx Proxy Manager

### Step 2: Configure Nginx Proxy Manager

1. Log into NPM: `http://YOUR_SERVER_IP:81`
   - Default: `admin@example.com` / `changeme` (CHANGE THIS!)

2. Click "Proxy Hosts" → "Add Proxy Host"

3. **Details Tab**:
   - Domain Names: `vault.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname/IP: `172.20.0.22` (Vaultwarden static IP)
   - Forward Port: `80`
   - Cache Assets: ✓ (checked)
   - Block Common Exploits: ✓ (checked)
   - Websockets Support: ✓ (checked) **CRITICAL for sync**

4. **SSL Tab**:
   - SSL Certificate: Request a new SSL certificate
   - Force SSL: ✓ (checked)
   - HTTP/2 Support: ✓ (checked)
   - HSTS Enabled: ✓ (checked)
   - HSTS Subdomains: ✓ (checked if applicable)

5. **Advanced Tab** (optional for additional security):

```nginx
# Rate limiting to prevent brute force attacks
limit_req_zone $binary_remote_addr zone=vaultwarden:10m rate=10r/s;
limit_req zone=vaultwarden burst=20 nodelay;

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "same-origin" always;

# WebSocket support for /notifications/hub
location /notifications/hub {
    proxy_pass http://172.20.0.22:3012;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Pass real client IP
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

6. Click "Save"

### Step 3: Update Vaultwarden Domain

```bash
# Edit .env
VAULTWARDEN_DOMAIN=https://vault.yourdomain.com

# Restart
docker-compose restart vaultwarden
```

### Step 4: Test Access

1. Navigate to: `https://vault.yourdomain.com`
2. Should redirect to HTTPS with valid certificate
3. Log in with your account
4. Test WebSocket sync by:
   - Opening vault in browser
   - Adding an entry in mobile app
   - Verify it appears in browser within seconds

## Install Bitwarden Clients

Vaultwarden is fully compatible with official Bitwarden clients.

### Browser Extensions
- [Chrome/Edge](https://chrome.google.com/webstore/detail/bitwarden/nngceckbapebfimnlniiiahkandclblb)
- [Firefox](https://addons.mozilla.org/firefox/addon/bitwarden-password-manager/)
- [Safari](https://apps.apple.com/app/bitwarden/id1352778147)

**Configuration**:
1. Install extension
2. Click settings (gear icon)
3. Server URL: `https://vault.yourdomain.com` (or `http://YOUR_IP:8222` for local)
4. Click "Log In"

### Mobile Apps
- [iOS](https://apps.apple.com/app/bitwarden-password-manager/id1137397744)
- [Android](https://play.google.com/store/apps/details?id=com.x8bit.bitwarden)

**Configuration**:
1. Open app, tap settings before logging in
2. Self-hosted Environment → Custom Environment
3. Server URL: `https://vault.yourdomain.com`
4. Tap "Save" then log in

### Desktop Apps
- [Windows/Mac/Linux](https://bitwarden.com/download/)

**Configuration**: Same as browser extensions

## Security Best Practices

### 1. Master Password
- Use a strong, unique master password (20+ characters)
- NEVER reuse this password anywhere else
- Write it down and store physically secure (safe/vault)
- Consider using a passphrase: "correct-horse-battery-staple-methodology"

### 2. Two-Factor Authentication (2FA)

Enable 2FA in Vaultwarden (Premium feature, free in Vaultwarden):

1. Log into web vault: `https://vault.yourdomain.com`
2. Settings → Security → Two-step Login
3. Options:
   - **Authenticator App** (recommended): Use Authy/Google Authenticator
   - **YubiKey** (hardware key, most secure)
   - **Email** (if SMTP configured)

### 3. Disable Signups After Setup

```bash
# Edit .env
VAULTWARDEN_SIGNUPS_ALLOWED=false

# Restart
docker-compose restart vaultwarden
```

### 4. Regular Backups

The Vaultwarden data directory contains your encrypted vault:

**Manual Backup**:
```bash
cd /Users/leonardoacosta/Personal/Installfest/homeserver

# Stop Vaultwarden to ensure consistency
docker-compose stop vaultwarden

# Backup
tar -czf vaultwarden_backup_$(date +%Y%m%d).tar.gz vaultwarden/

# Restart
docker-compose start vaultwarden
```

**Automated Backup** (add to cron):
```bash
#!/bin/bash
# /Users/leonardoacosta/Personal/Installfest/homeserver/scripts/backup-vaultwarden.sh

BACKUP_DIR="/backup/vaultwarden"
DATE=$(date +%Y%m%d_%H%M%S)
HOMESERVER_DIR="/Users/leonardoacosta/Personal/Installfest/homeserver"

mkdir -p "$BACKUP_DIR"
cd "$HOMESERVER_DIR"

# Stop container for consistent backup
docker-compose stop vaultwarden

# Backup data directory
tar -czf "$BACKUP_DIR/vaultwarden_${DATE}.tar.gz" vaultwarden/

# Start container
docker-compose start vaultwarden

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "vaultwarden_*.tar.gz" -mtime +30 -delete

echo "Backup completed: vaultwarden_${DATE}.tar.gz"
```

Make it executable and add to cron:
```bash
chmod +x scripts/backup-vaultwarden.sh

# Add to crontab (backup daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /Users/leonardoacosta/Personal/Installfest/homeserver/scripts/backup-vaultwarden.sh
```

### 5. Monitor Logs

```bash
# Watch logs in real-time
docker-compose logs -f vaultwarden

# Check for failed login attempts
docker-compose logs vaultwarden | grep -i "failed\|error"

# View last 100 lines
docker-compose logs --tail=100 vaultwarden
```

### 6. Firewall Configuration

If exposed to internet, restrict admin panel access:

```bash
# Only allow local network to access admin panel
sudo ufw allow from 192.168.1.0/24 to any port 8222 proto tcp

# Or bind admin panel to localhost only (requires NPM config changes)
# Edit docker-compose.yml ports section:
# ports:
#   - "127.0.0.1:8222:80"  # Only accessible from host
#   - "3012:3012"          # WebSocket still needs external access
```

## Troubleshooting

### Issue: Container Won't Start

**Check logs**:
```bash
docker-compose logs vaultwarden
```

**Common causes**:
1. Port conflict (8222 or 3012 already in use)
2. Permission issues on `./vaultwarden` directory
3. Invalid ADMIN_TOKEN in `.env`

**Solutions**:
```bash
# Check port usage
sudo lsof -i :8222
sudo lsof -i :3012

# Fix permissions
chown -R ${PUID:-1000}:${PGID:-1000} vaultwarden

# Verify .env syntax
cat .env | grep VAULTWARDEN
```

### Issue: Can't Access Admin Panel

**Symptom**: 401 Unauthorized on `/admin`

**Solutions**:
1. Verify `VAULTWARDEN_ADMIN_TOKEN` is set in `.env`
2. Token should be base64 encoded string (48+ characters)
3. Check for extra spaces/newlines in `.env`
4. Restart container: `docker-compose restart vaultwarden`

### Issue: WebSocket Not Working (No Real-Time Sync)

**Symptoms**:
- Changes take minutes to sync
- Console shows WebSocket connection errors

**Solutions**:
1. Verify port 3012 is accessible: `curl http://YOUR_IP:3012`
2. Check Nginx Proxy Manager has "WebSocket Support" enabled
3. Verify advanced config includes WebSocket location block (see SSL setup above)
4. Check firewall isn't blocking port 3012

**Test WebSocket**:
```bash
# From another machine on your network
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     http://YOUR_SERVER_IP:3012/
# Should return 101 Switching Protocols (or 400 is okay, means service is running)
```

### Issue: Email Not Sending

**Check admin panel**:
1. Navigate to `/admin`
2. Click "Diagnostics"
3. Scroll to "SMTP Test"
4. Click "Send test email"

**Common issues**:
- App password not configured (Gmail requires app-specific passwords)
- Wrong SMTP port (587 for STARTTLS, 465 for TLS, 25 for plain)
- Firewall blocking outbound SMTP
- SMTP_SECURITY setting incorrect

**Debug**:
```bash
# View detailed SMTP logs
docker-compose logs vaultwarden | grep -i smtp
```

### Issue: Database Corruption

**Symptoms**:
- Container starts but vault won't load
- Errors about database being locked or malformed

**Recovery**:
```bash
cd /Users/leonardoacosta/Personal/Installfest/homeserver

# Stop container
docker-compose stop vaultwarden

# Check database integrity
sqlite3 vaultwarden/db.sqlite3 "PRAGMA integrity_check;"

# If corrupted, restore from backup
cp vaultwarden/db.sqlite3 vaultwarden/db.sqlite3.corrupted
tar -xzf vaultwarden_backup_YYYYMMDD.tar.gz
docker-compose start vaultwarden
```

### Issue: Can't Login After Setup

**Forgot Master Password?**
- NO RECOVERY POSSIBLE - encryption is client-side
- If SMTP configured, use "Password Hint" on login page
- Otherwise, must delete user and start over

**To delete a user**:
1. Access admin panel: `http://YOUR_IP:8222/admin`
2. Go to "Users"
3. Find user and click "Delete"
4. Create new account

## Advanced Configuration

### Disable User Registration Completely

After all users are created:

```bash
# Edit .env
VAULTWARDEN_SIGNUPS_ALLOWED=false
VAULTWARDEN_INVITATIONS_ALLOWED=false

# Restart
docker-compose restart vaultwarden
```

### Enable Organization/Team Vaults

Organizations are FREE in Vaultwarden (premium feature in Bitwarden):

1. Log into web vault
2. Click "New Organization"
3. Name it (e.g., "Family Vault")
4. Invite members via email (or share invite link)
5. Create collections for shared passwords

### YubiKey Support

If you have YubiKey hardware keys:

1. Get YubiKey Client ID and Secret from [Yubico](https://upgrade.yubico.com/getapikey/)
2. Update `.env`:

```bash
VAULTWARDEN_YUBICO_CLIENT_ID=12345
VAULTWARDEN_YUBICO_SECRET_KEY=your_secret_key_here
```

3. Restart: `docker-compose restart vaultwarden`
4. Enable in vault: Settings → Security → Two-step Login → YubiKey

### Custom Icons for Websites

Vaultwarden fetches website icons automatically:

```bash
# To use local icon cache (faster, more privacy)
# No additional config needed - enabled by default

# Icons stored in: ./vaultwarden/icon_cache/
```

### Logging and Monitoring

**Increase log verbosity for debugging**:
```bash
# Edit .env
VAULTWARDEN_LOG_LEVEL=debug

# Restart
docker-compose restart vaultwarden

# Watch logs
docker-compose logs -f vaultwarden
```

**Log to file**:
```bash
# Redirect logs to file
docker-compose logs -f vaultwarden >> ./vaultwarden/vaultwarden.log
```

**Integration with monitoring stack**:
If you add Prometheus monitoring (as suggested in SECURITY_AUDIT.md):

```yaml
# Add to docker-compose.monitoring.yml
  vaultwarden-exporter:
    image: docker.io/vaultwarden/vaultwarden-prometheus-exporter
    container_name: vaultwarden-exporter
    environment:
      - VW_URL=http://172.20.0.22:80
    networks:
      - homelab
```

## Maintenance

### Updating Vaultwarden

```bash
cd /Users/leonardoacosta/Personal/Installfest/homeserver

# Backup first!
docker-compose stop vaultwarden
tar -czf vaultwarden_backup_$(date +%Y%m%d).tar.gz vaultwarden/

# Update image version in docker-compose.yml
# Change: vaultwarden/server:1.32.5
# To:     vaultwarden/server:1.33.0 (or latest version)

# Pull new image
docker-compose pull vaultwarden

# Recreate container
docker-compose up -d vaultwarden

# Check logs
docker-compose logs -f vaultwarden

# Verify health
docker ps | grep vaultwarden
```

### Health Check

Vaultwarden includes automated health checks. Check status:

```bash
# View health status
docker ps | grep vaultwarden

# Healthy output:
# Up X minutes (healthy)

# If unhealthy:
docker inspect vaultwarden | jq '.[0].State.Health'
docker-compose logs vaultwarden
```

### Performance Tuning

For larger vaults (1000+ items):

```bash
# Increase database performance (add to .env)
DATABASE_MAX_CONNS=10
DATABASE_TIMEOUT=30

# Restart
docker-compose restart vaultwarden
```

## Integration with Existing Stack

### Access via Tailscale VPN

Your Tailscale container already advertises the homelab network (172.20.0.0/16):

1. Install Bitwarden client on remote device
2. Connect to Tailscale VPN
3. Configure server URL: `http://172.20.0.22:80` (or use SSL domain)
4. Access Vaultwarden from anywhere securely

### Backup Integration

Include Vaultwarden in your backup strategy:

```bash
# Add to your existing backup script
SERVICES=(
    "homeassistant"
    "adguardhome/conf"
    "nginx-proxy-manager/data"
    "jellyfin/config"
    "vaultwarden"  # Add this
)

for SERVICE in "${SERVICES[@]}"; do
    tar -czf "$BACKUP_DIR/${SERVICE//\//_}_${DATE}.tar.gz" "$SERVICE/"
done
```

### Monitoring Integration

If you deploy Prometheus (recommended in SECURITY_AUDIT.md):

Add health check monitoring:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'vaultwarden'
    static_configs:
      - targets: ['172.20.0.22:80']
    metrics_path: '/alive'
```

## Resources

- [Vaultwarden Wiki](https://github.com/dani-garcia/vaultwarden/wiki)
- [Bitwarden Help Center](https://bitwarden.com/help/)
- [Vaultwarden GitHub](https://github.com/dani-garcia/vaultwarden)
- [Docker Hub](https://hub.docker.com/r/vaultwarden/server)

## Quick Reference

### Ports
- **8222**: Web vault (HTTP)
- **3012**: WebSocket (real-time sync)

### Important Files
- **Config**: `/Users/leonardoacosta/Personal/Installfest/homeserver/.env`
- **Data**: `/Users/leonardoacosta/Personal/Installfest/homeserver/vaultwarden/`
- **Database**: `./vaultwarden/db.sqlite3`
- **Icons**: `./vaultwarden/icon_cache/`
- **Attachments**: `./vaultwarden/attachments/`

### Common Commands
```bash
# Start
docker-compose up -d vaultwarden

# Stop
docker-compose stop vaultwarden

# Restart
docker-compose restart vaultwarden

# View logs
docker-compose logs -f vaultwarden

# Check health
docker ps | grep vaultwarden

# Access shell
docker-compose exec vaultwarden sh

# Backup
tar -czf vaultwarden_backup.tar.gz vaultwarden/

# Update
docker-compose pull vaultwarden && docker-compose up -d vaultwarden
```

### Emergency Contacts
- Admin Panel: `http://YOUR_IP:8222/admin`
- Health Check: `http://YOUR_IP:8222/alive`
- WebSocket Test: `http://YOUR_IP:3012`

---

## Summary Checklist

Setup complete when you've done all of these:

- [ ] Generated secure admin token
- [ ] Updated `.env` with token and domain
- [ ] Created vaultwarden directory with proper permissions
- [ ] Started container and verified health status
- [ ] Created your first user account
- [ ] Disabled public signups in `.env`
- [ ] Configured SSL with Nginx Proxy Manager
- [ ] Tested WebSocket connectivity
- [ ] Installed Bitwarden client (browser/mobile/desktop)
- [ ] Enabled 2FA on your account
- [ ] Configured email (SMTP) for password hints
- [ ] Set up automated backups
- [ ] Tested restore from backup
- [ ] Documented your master password securely (offline!)

**Your Vaultwarden installation is now ready for production use!**
