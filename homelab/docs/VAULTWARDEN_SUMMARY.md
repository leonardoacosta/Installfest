# Vaultwarden Installation Summary

## What Was Added

Vaultwarden (Bitwarden-compatible password manager) has been successfully integrated into your Docker homelab stack.

## Files Modified

1. **docker-compose.yml** - Added Vaultwarden service definition
2. **.env** - Added Vaultwarden environment variables

## Files Created

1. **VAULTWARDEN_SETUP.md** - Comprehensive setup and troubleshooting guide
2. **deploy-vaultwarden.sh** - Automated deployment script
3. **nginx-vaultwarden-config.txt** - Nginx Proxy Manager SSL configuration
4. **VAULTWARDEN_SUMMARY.md** - This summary file

## Configuration Details

### Service Specifications

| Property           | Value                                      |
| ------------------ | ------------------------------------------ |
| **Image**          | vaultwarden/server:1.32.5 (pinned version) |
| **Container Name** | vaultwarden                                |
| **Network**        | homelab (172.20.0.0/16)                    |
| **Static IP**      | 172.20.0.22                                |
| **Web Port**       | 8222 (host) → 80 (container)               |
| **WebSocket Port** | 3012 (host) → 3012 (container)             |
| **Data Volume**    | ./vaultwarden:/data                        |
| **User**           | ${PUID}:${PGID} (non-root)                 |

### Security Features Applied

Following your SECURITY_AUDIT.md recommendations:

✅ **Pinned Version**: v1.32.5 (no 'latest' tag)
✅ **Resource Limits**: CPU: 1.0 core, Memory: 512MB max
✅ **Security Options**: no-new-privileges:true
✅ **Non-Root User**: Runs as PUID/PGID
✅ **Health Checks**: Automated monitoring every 30s
✅ **Timezone**: Properly configured via TZ variable

### Environment Variables Required

These variables have been added to your `.env` file:

```bash
# Admin panel access (CRITICAL - must change)
VAULTWARDEN_ADMIN_TOKEN=CHANGE_ME_TO_SECURE_TOKEN

# Domain configuration
VAULTWARDEN_DOMAIN=https://vault.yourdomain.com

# User registration control
VAULTWARDEN_SIGNUPS_ALLOWED=true  # Disable after creating accounts
VAULTWARDEN_INVITATIONS_ALLOWED=true

# Logging
VAULTWARDEN_LOG_LEVEL=info

# Optional: SMTP email configuration
VAULTWARDEN_SMTP_HOST=
VAULTWARDEN_SMTP_FROM=
VAULTWARDEN_SMTP_USERNAME=
VAULTWARDEN_SMTP_PASSWORD=
```

## Quick Start Deployment

### Option 1: Automated Deployment (Recommended)

```bash
cd /Users/leonardoacosta/Personal/Installfest/homelab
./deploy-vaultwarden.sh
```

This script will:

- Generate secure admin token automatically
- Configure domain settings
- Create data directory with proper permissions
- Pull Docker image
- Start container
- Display access information

### Option 2: Manual Deployment

```bash
cd /Users/leonardoacosta/Personal/Installfest/homelab

# 1. Generate admin token
openssl rand -base64 48
# Copy output and paste into .env as VAULTWARDEN_ADMIN_TOKEN

# 2. Edit .env with your settings
nano .env
# Update: VAULTWARDEN_ADMIN_TOKEN, VAULTWARDEN_DOMAIN

# 3. Create data directory
mkdir -p vaultwarden
chown -R ${PUID:-1000}:${PGID:-1000} vaultwarden

# 4. Start Vaultwarden
docker-compose up -d vaultwarden

# 5. Check status
docker-compose logs -f vaultwarden
docker ps | grep vaultwarden  # Should show "healthy"
```

## Access Information

After deployment:

| Endpoint         | URL                       | Purpose              |
| ---------------- | ------------------------- | -------------------- |
| **Web Vault**    | http://YOUR_IP:8222       | Main web interface   |
| **Admin Panel**  | http://YOUR_IP:8222/admin | Management interface |
| **Health Check** | http://YOUR_IP:8222/alive | Status endpoint      |
| **WebSocket**    | ws://YOUR_IP:3012         | Real-time sync       |

## Initial Setup Steps

### 1. Secure Your Installation

```bash
# Generate and set admin token (if not done)
openssl rand -base64 48
# Update .env with this token
```

### 2. Create Your First User

1. Navigate to: `http://YOUR_IP:8222`
2. Click "Create Account"
3. Use a STRONG master password (20+ characters)
4. Complete registration

### 3. Disable Public Signups

After creating all user accounts:

```bash
# Edit .env
VAULTWARDEN_SIGNUPS_ALLOWED=false

# Restart
docker-compose restart vaultwarden
```

### 4. Configure SSL (Recommended)

See **nginx-vaultwarden-config.txt** for complete Nginx Proxy Manager setup.

Quick steps:

1. Log into NPM: http://YOUR_IP:81
2. Add Proxy Host:
   - Domain: vault.yourdomain.com
   - Forward to: 172.20.0.22:80
   - Enable WebSocket Support
   - Request SSL certificate
3. Update .env with HTTPS domain
4. Restart Vaultwarden

### 5. Install Bitwarden Clients

Download clients from: https://bitwarden.com/download/

Configure with your server URL:

- Local: `http://YOUR_IP:8222`
- SSL: `https://vault.yourdomain.com`

### 6. Enable Two-Factor Authentication

1. Log into web vault
2. Settings → Security → Two-step Login
3. Choose method: Authenticator App (recommended)
4. Scan QR code with authenticator app
5. Enable 2FA

## Integration with Existing Stack

### Network Integration

Vaultwarden is on the **homelab** network (172.20.0.0/16) and can communicate with:

- Nginx Proxy Manager (172.20.0.81) - for SSL/reverse proxy
- AdGuard Home (172.20.0.53) - for DNS resolution
- All other homelab services

### Backup Integration

Add Vaultwarden to your backup strategy:

```bash
# Add to existing backup script
tar -czf vaultwarden_backup_$(date +%Y%m%d).tar.gz vaultwarden/

# Or use dedicated script
./scripts/backup-vaultwarden.sh  # (create this from VAULTWARDEN_SETUP.md)
```

### Monitoring Integration

Health check is configured and compatible with monitoring stacks:

```bash
# Check health status
docker ps | grep vaultwarden  # Shows "healthy" status

# Query health endpoint
curl http://172.20.0.22:80/alive
# Returns: "Alive"
```

### Tailscale VPN Integration

Your existing Tailscale container advertises the homelab network, so you can access Vaultwarden remotely:

1. Connect to Tailscale VPN on remote device
2. Access Vaultwarden at: http://172.20.0.22:80
3. No need to expose ports to internet

## Security Best Practices

### Critical Security Steps

1. **CHANGE ADMIN TOKEN**: Never use default token
2. **STRONG MASTER PASSWORD**: 20+ characters, unique
3. **DISABLE SIGNUPS**: After account creation
4. **ENABLE 2FA**: Use authenticator app or YubiKey
5. **CONFIGURE SSL**: Use HTTPS for external access
6. **REGULAR BACKUPS**: Automate daily backups
7. **MONITOR LOGS**: Check for suspicious activity

### Recommended Security Hardening

```bash
# 1. Restrict admin panel to local network only
# Edit docker-compose.yml ports section:
ports:
  - "127.0.0.1:8222:80"  # Admin only from localhost
  - "3012:3012"          # WebSocket still accessible

# 2. Use firewall rules
sudo ufw allow from 192.168.1.0/24 to any port 8222 proto tcp

# 3. Monitor failed login attempts
docker-compose logs vaultwarden | grep -i "failed\|error"

# 4. Set up automated backups (see VAULTWARDEN_SETUP.md)
```

## Common Commands

```bash
# Start Vaultwarden
docker-compose up -d vaultwarden

# Stop Vaultwarden
docker-compose stop vaultwarden

# Restart Vaultwarden
docker-compose restart vaultwarden

# View logs (live)
docker-compose logs -f vaultwarden

# View last 100 lines
docker-compose logs --tail=100 vaultwarden

# Check health status
docker ps | grep vaultwarden

# Check health endpoint
curl http://172.20.0.22:80/alive

# Access container shell
docker-compose exec vaultwarden sh

# Backup data
tar -czf vaultwarden_backup_$(date +%Y%m%d).tar.gz vaultwarden/

# Update to new version
# 1. Edit docker-compose.yml (change version tag)
# 2. Backup first!
# 3. docker-compose pull vaultwarden
# 4. docker-compose up -d vaultwarden
```

## Troubleshooting Quick Reference

### Container Won't Start

```bash
# Check logs
docker-compose logs vaultwarden

# Check port conflicts
sudo lsof -i :8222
sudo lsof -i :3012

# Fix permissions
chown -R ${PUID:-1000}:${PGID:-1000} vaultwarden

# Verify .env
grep VAULTWARDEN .env
```

### Can't Access Admin Panel

```bash
# Verify admin token is set
grep VAULTWARDEN_ADMIN_TOKEN .env

# Should show a long base64 string, not "CHANGE_ME_TO_SECURE_TOKEN"

# Regenerate if needed
openssl rand -base64 48
```

### WebSocket Not Working

```bash
# Test WebSocket port
curl http://YOUR_IP:3012

# Check NPM configuration
# Verify "Websockets Support" is enabled in NPM Details tab

# Check logs
docker-compose logs vaultwarden | grep -i websocket
```

### Database Issues

```bash
# Check database integrity
sqlite3 vaultwarden/db.sqlite3 "PRAGMA integrity_check;"

# If corrupted, restore from backup
docker-compose stop vaultwarden
cp vaultwarden/db.sqlite3 vaultwarden/db.sqlite3.corrupted
tar -xzf vaultwarden_backup_YYYYMMDD.tar.gz
docker-compose start vaultwarden
```

## Documentation Reference

| Document                         | Purpose                                         |
| -------------------------------- | ----------------------------------------------- |
| **VAULTWARDEN_SETUP.md**         | Complete setup guide with detailed instructions |
| **nginx-vaultwarden-config.txt** | Nginx Proxy Manager SSL configuration           |
| **VAULTWARDEN_SUMMARY.md**       | This quick reference (you are here)             |
| **deploy-vaultwarden.sh**        | Automated deployment script                     |

## Important URLs

- Vaultwarden GitHub: https://github.com/dani-garcia/vaultwarden
- Vaultwarden Wiki: https://github.com/dani-garcia/vaultwarden/wiki
- Bitwarden Clients: https://bitwarden.com/download/
- Bitwarden Help: https://bitwarden.com/help/

## Support and Resources

### Vaultwarden-Specific

- Admin Panel: Access diagnostics and configuration
- Health Check: Monitor service status
- Container Logs: Debug issues

### Community Resources

- Vaultwarden GitHub Discussions
- r/selfhosted on Reddit
- r/Bitwarden on Reddit

## Next Steps After Deployment

1. ✅ Deploy Vaultwarden (you are here)
2. Create your first user account
3. Disable public signups
4. Configure SSL with Nginx Proxy Manager
5. Set up SMTP for email notifications
6. Install Bitwarden clients on all devices
7. Enable 2FA on your account
8. Import passwords from existing password manager
9. Set up automated backups
10. Test restore from backup
11. Document your master password (offline, secure location)
12. Share access with family/team (using Organizations)

## Critical Security Reminders

🔴 **NEVER LOSE YOUR MASTER PASSWORD**

- It encrypts your vault
- No password reset possible
- Write it down, store securely offline

🔴 **BACKUP REGULARLY**

- Database is in ./vaultwarden/db.sqlite3
- Automated backups recommended
- Test restores periodically

🔴 **DISABLE SIGNUPS**

- After creating accounts
- Prevents unauthorized registrations
- Can still invite users if needed

🔴 **USE STRONG ADMIN TOKEN**

- 48+ character random string
- Never commit to git
- Store securely

🔴 **ENABLE 2FA**

- Protects against password theft
- Use authenticator app
- YubiKey even better

## Support

For issues or questions:

1. Check **VAULTWARDEN_SETUP.md** troubleshooting section
2. Review container logs: `docker-compose logs vaultwarden`
3. Check Vaultwarden GitHub issues
4. Check Docker homelab security audit: **SECURITY_AUDIT.md**

---

**Installation Date**: $(date +%Y-%m-%d)
**Vaultwarden Version**: 1.32.5
**Configuration**: Production-ready with security hardening
**Status**: Ready for deployment

🔐 **Your self-hosted password manager is ready!**
