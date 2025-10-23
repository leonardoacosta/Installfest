# Vaultwarden Configuration Research

## Service Overview
Vaultwarden is a lightweight, self-hosted password manager server compatible with Bitwarden clients, providing secure password storage and management.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
DOMAIN: "https://vault.example.com"
SIGNUPS_ALLOWED: "false"
INVITATIONS_ALLOWED: "true"
SIGNUPS_VERIFY: "true"
WEBSOCKET_ENABLED: "true"
WEB_VAULT_ENABLED: "true"

# Admin Panel
ADMIN_TOKEN: "${ADMIN_TOKEN}"
DISABLE_ADMIN_TOKEN: "false"

# Security
ROCKET_TLS: '{certs="/ssl/certs.pem",key="/ssl/key.pem"}'
REQUIRE_DEVICE_EMAIL: "true"
IP_HEADER: "X-Real-IP"

# Database
DATABASE_URL: "postgresql://vaultwarden:${DB_PASSWORD}@postgres/vaultwarden"
# Or SQLite:
# DATABASE_URL: "/data/db.sqlite3"

# Email
SMTP_HOST: "smtp.gmail.com"
SMTP_PORT: "587"
SMTP_SECURITY: "starttls"
SMTP_FROM: "vault@example.com"
SMTP_FROM_NAME: "Vaultwarden"
SMTP_USERNAME: "${SMTP_USERNAME}"
SMTP_PASSWORD: "${SMTP_PASSWORD}"

# 2FA
YUBICO_CLIENT_ID: "${YUBICO_CLIENT_ID}"
YUBICO_SECRET_KEY: "${YUBICO_SECRET_KEY}"
DUO_IKEY: "${DUO_IKEY}"
DUO_SKEY: "${DUO_SKEY}"
DUO_HOST: "${DUO_HOST}"
```

## 2. Secrets Management Strategy

```yaml
secrets:
  vaultwarden_admin_token:
    file: ./secrets/vaultwarden/admin_token.txt
  db_password:
    file: ./secrets/vaultwarden/db_password.txt
  smtp_password:
    file: ./secrets/vaultwarden/smtp_password.txt

environment:
  - ADMIN_TOKEN_FILE=/run/secrets/vaultwarden_admin_token
  - DATABASE_PASSWORD_FILE=/run/secrets/db_password
  - SMTP_PASSWORD_FILE=/run/secrets/smtp_password
```

## 3. Volume Mounts and Data Persistence

```yaml
volumes:
  - ./data/vaultwarden:/data:rw
  - ./ssl/vaultwarden:/ssl:ro
  - ./logs/vaultwarden:/logs:rw
  - ./backups/vaultwarden:/backups:rw

ports:
  - "8085:80"      # HTTP
  - "3012:3012"    # WebSocket
```

## 4. Configuration File Template

```toml
# config.json
{
  "domain": "https://vault.example.com",
  "sends_allowed": true,
  "emergency_access_allowed": true,
  "email_2fa_remember": 30,
  "incomplete_2fa_time_limit": 3,
  "disable_icon_download": false,
  "icon_service": "internal",
  "icon_cache_ttl": 2592000,
  "icon_cache_negttl": 259200,
  "icon_download_timeout": 10,
  "icon_blacklist_regex": null,
  "global_domains": "",
  "websocket_enabled": true,
  "websocket_address": "0.0.0.0",
  "websocket_port": 3012,
  "extended_logging": true,
  "log_level": "info",
  "log_file": "/logs/vaultwarden.log",
  "use_syslog": false,
  "job_poll_interval_ms": 30000,
  "send_purge_schedule": "0 5 * * * *",
  "trash_purge_schedule": "0 5 0 * * *",
  "incomplete_2fa_schedule": "30 * * * * *",
  "emergency_notification_reminder_schedule": "0 3 * * * *",
  "emergency_request_timeout_schedule": "0 3 * * * *"
}
```

## 5. Backup and Restore Procedures

```bash
#!/bin/bash
# Backup Script
BACKUP_DIR="/backups/vaultwarden/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Stop Vaultwarden for consistent backup
docker stop vaultwarden

# Backup SQLite database
sqlite3 /data/db.sqlite3 ".backup $BACKUP_DIR/db.sqlite3"

# Backup all data
tar -czf "$BACKUP_DIR/data.tar.gz" /data/

# Backup RSA keys (critical!)
cp -r /data/rsa_key* "$BACKUP_DIR/"

# Start Vaultwarden
docker start vaultwarden

# Restore Script
restore_vaultwarden() {
  RESTORE_FROM="$1"

  # Stop Vaultwarden
  docker stop vaultwarden

  # Restore data
  tar -xzf "$RESTORE_FROM/data.tar.gz" -C /

  # Restore RSA keys
  cp "$RESTORE_FROM/rsa_key"* /data/

  # Start Vaultwarden
  docker start vaultwarden
}
```

## 6. Security Hardening

```yaml
# Fail2ban configuration
fail2ban:
  enabled: true
  maxretry: 5
  bantime: 3600
  findtime: 600

# Rate limiting
rate_limits:
  login_attempts: 5
  login_timeout: 900
  admin_attempts: 3
  admin_timeout: 3600

# Security headers
headers:
  X-Frame-Options: "DENY"
  X-Content-Type-Options: "nosniff"
  X-XSS-Protection: "1; mode=block"
  Strict-Transport-Security: "max-age=31536000"
  Content-Security-Policy: "default-src 'self'"
```

## Security & Performance

- Strong admin token (minimum 48 characters)
- Disable signups after initial setup
- Enable 2FA for all users
- Regular database backups
- RSA key protection
- SSL/TLS mandatory
- IP whitelisting for admin panel
- Regular security updates
- Audit logging enabled