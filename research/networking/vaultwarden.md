# Vaultwarden - Networking Analysis

## 1. Current Network Configuration Analysis
- **Container Network**: homelab (bridge)
- **IP Address**: 172.20.0.22 (static)
- **Port Mappings**:
  - 8222:80 (Web Vault)
  - 3012:3012 (WebSocket for live sync)
- **Security**: no-new-privileges enabled
- **User**: Non-root (PUID/PGID)
- **Resource Limits**: CPU 1.0, Memory 512MB

## 2. Optimal Network Placement
**Recommended Zone**: Secure Services VLAN
- Should be in dedicated Security VLAN (e.g., VLAN 25)
- High-security service handling passwords
- Requires careful access control
- Consider air-gapped for ultimate security

## 3. Reverse Proxy Requirements
**Configuration**:
- URL: `https://vault.domain.com`
- **HTTPS ONLY** - Never HTTP
- WebSocket support REQUIRED
- Headers Required:
  ```nginx
  X-Real-IP
  X-Forwarded-For
  X-Forwarded-Proto https
  X-Forwarded-Host
  Connection Upgrade
  Upgrade websocket
  ```

**Special Requirements**:
```nginx
# Large body for file attachments
client_max_body_size 128M;

# WebSocket location
location /notifications/hub {
    proxy_pass http://vaultwarden:3012;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}

# Exact /admin block if not using
location /admin {
    return 404;
}
```

## 4. Security Considerations for External Exposure
**Critical Security Requirements**:
- **HTTPS mandatory** - Self-signed minimum
- Strong admin token (40+ characters)
- Disable registration after setup
- Enable 2FA for all users
- IP whitelist admin panel
- Fail2ban for brute force
- Regular security audits
- Monitor for breaches
- Backup encryption keys

**Additional Hardening**:
- Disable password hints
- Require email verification
- Set strong password policy
- Enable emergency access
- Audit logs enabled

## 5. Port Management and Conflicts
**Ports Used**:
- 80/tcp: Web Vault (mapped to 8222)
- 3012/tcp: WebSocket notifications

**No conflicts expected** with mapped ports

## 6. DNS and Service Discovery
**DNS Configuration**:
- Public DNS: `vault.domain.com`
- Local DNS: `vaultwarden.local`
- CAA records recommended
- DNSSEC if possible

## 7. VLAN Segmentation Recommendations
**Proposed VLAN Structure**:
- **VLAN 25 (Security)**: Vaultwarden placement
- **VLAN 20 (Users)**: Client access
- **VLAN 10 (Management)**: Admin access only
- **NO access from IoT/Guest VLANs**

**Strict Isolation**:
```
Security VLAN → Internet: Allow (updates, SMTP)
Users → Security: Allow (port 80, 3012)
Management → Security: Allow (admin panel)
All others → Security: Deny
```

## 8. Firewall Rules Required
**Inbound Rules**:
```
# Web Vault from Users
Allow TCP 8222,3012 from 192.168.20.0/24 to Vaultwarden

# Admin access from Management only
Allow TCP 8222 from 192.168.10.1 to Vaultwarden

# External through reverse proxy only
Allow TCP 80,3012 from ReverseProxy to Vaultwarden

# Block all other access
Deny All from Any to Vaultwarden
```

**Outbound Rules**:
```
# SMTP for email
Allow TCP 587,465 from Vaultwarden to SMTP_Server

# HTTPS for icons/avatars
Allow TCP 443 from Vaultwarden to Any

# DNS
Allow UDP 53 from Vaultwarden to DNS

# NTP for TOTP
Allow UDP 123 from Vaultwarden to NTP
```

## 9. Inter-Service Communication Requirements
**Minimal Dependencies**:
- **SMTP Server**: Email notifications
- **Reverse Proxy**: HTTPS termination
- **No other service dependencies**

**Integration Options**:
- LDAP/AD authentication (optional)
- SMTP relay for emails
- Syslog for audit logs

## 10. Performance Optimization
**Application Settings**:
```yaml
Performance:
  - Database: SQLite (default)
  - PostgreSQL: For >100 users
  - MySQL: Supported
  - Workers: 10
  - Database connections: 10

Caching:
  - Icon cache: 30 days
  - IP rate limiting: 10/minute
  - Login rate limit: 5/minute
```

**Resource Recommendations**:
- Memory: 256-512MB typical
- CPU: 1 core sufficient
- Storage: 1-10GB (depends on attachments)
- Network: 1-10 Mbps
- Database: 100MB-1GB

## Email Configuration
**SMTP Settings**:
```yaml
SMTP:
  - Host: smtp.gmail.com
  - Port: 587
  - Security: STARTTLS
  - Username: Required
  - Password: App-specific
  - From: noreply@domain.com
```

## Backup Strategy
**Critical Backups**:
```bash
# Database (most important)
/data/db.sqlite3
/data/db.sqlite3-wal
/data/db.sqlite3-shm

# Attachments
/data/attachments/

# RSA Keys (critical!)
/data/rsa_key.der
/data/rsa_key.pem
/data/rsa_key.pub.der

# Icon cache (optional)
/data/icon_cache/
```

**Backup Schedule**:
- Database: Every 6 hours
- Attachments: Daily
- RSA keys: After generation
- Test restore regularly

## Security Monitoring
**Audit Points**:
- Failed login attempts
- Admin panel access
- Password changes
- 2FA disabling
- Emergency access usage
- Organization changes
- API key usage

## High Availability Considerations
**Options**:
1. Active-Passive with shared storage
2. PostgreSQL with replication
3. Regular backup/restore
4. Multiple instances (complex)

## Client Configuration
**Supported Clients**:
- Web browsers
- Mobile apps (iOS/Android)
- Desktop apps (Windows/Mac/Linux)
- Browser extensions
- CLI tools

**Auto-configuration**:
```
https://vault.domain.com
Email: user@domain.com
Master Password: ********
```

## TOTP/2FA Configuration
**Security Keys**:
- WebAuthn support
- FIDO2 keys
- TOTP apps
- Email codes (backup)

## Database Maintenance
**SQLite Optimization**:
```sql
-- Regular maintenance
VACUUM;
REINDEX;
ANALYZE;

-- Backup command
sqlite3 db.sqlite3 ".backup backup.db"
```

## Migration Notes
1. Generate strong ADMIN_TOKEN
2. Configure SMTP first
3. Set up reverse proxy with HTTPS
4. Create first admin account
5. Enable 2FA immediately
6. Disable registration
7. Configure password policy
8. Set up backups
9. Test WebSocket connection
10. Import existing passwords
11. Configure clients
12. Monitor security logs
13. Document recovery procedure
14. Test backup restoration