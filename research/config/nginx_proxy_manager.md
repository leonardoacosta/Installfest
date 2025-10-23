# Nginx Proxy Manager Configuration Research

## Service Overview
Nginx Proxy Manager provides a user-friendly interface for managing Nginx reverse proxy configurations, SSL certificates, and access control for your homelab services.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
TZ: "America/New_York"                    # Timezone
PUID: "1000"                              # User ID
PGID: "1000"                              # Group ID
DB_MYSQL_HOST: "npm_db"                   # MySQL host
DB_MYSQL_PORT: "3306"                     # MySQL port
DB_MYSQL_USER: "npm"                      # MySQL user
DB_MYSQL_PASSWORD: "${DB_PASSWORD}"       # MySQL password
DB_MYSQL_NAME: "npm"                      # MySQL database name

# Performance
NGINX_WORKER_PROCESSES: "auto"            # Worker processes
NGINX_WORKER_CONNECTIONS: "1024"          # Worker connections
CLIENT_MAX_BODY_SIZE: "100M"             # Maximum upload size

# Security
DISABLE_IPV6: "false"                     # IPv6 support
FORCE_COLOR: "1"                          # Color output in logs
```

## 2. Secrets Management Strategy

```yaml
# Docker Secrets
secrets:
  npm_db_password:
    file: ./secrets/npm/db_password.txt
  npm_admin_password:
    file: ./secrets/npm/admin_password.txt
  cloudflare_api_token:
    file: ./secrets/npm/cloudflare_token.txt

# Environment references
environment:
  - DB_MYSQL_PASSWORD_FILE=/run/secrets/npm_db_password
  - INITIAL_ADMIN_PASSWORD_FILE=/run/secrets/npm_admin_password
  - CF_API_TOKEN_FILE=/run/secrets/cloudflare_api_token

# SSL Certificate storage
ssl_certificates:
  letsencrypt:
    email: "${LETSENCRYPT_EMAIL}"
    staging: false
  cloudflare:
    api_token: "${CF_API_TOKEN}"
    zone_id: "${CF_ZONE_ID}"
```

## 3. Volume Mounts and Data Persistence

```yaml
volumes:
  # Configuration and data
  - ./data/npm:/data:rw
  - ./letsencrypt:/etc/letsencrypt:rw

  # Custom Nginx configurations
  - ./config/npm/nginx:/data/nginx/custom:rw

  # SSL certificates
  - ./ssl/npm:/data/custom_ssl:rw

  # Logs
  - ./logs/npm:/data/logs:rw

# Database volumes
npm_db:
  volumes:
    - ./data/npm_db:/var/lib/mysql:rw
    - ./config/npm_db:/etc/mysql/conf.d:ro
```

## 4. Health Check Configuration

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:81/api"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s

# API endpoints
/api                      # API status
/api/nginx/proxy-hosts   # Proxy hosts
/api/nginx/certificates  # SSL certificates
/api/nginx/access-lists  # Access lists
/api/reports/hosts       # Host reports
```

## 5. Backup and Restore Procedures

```bash
#!/bin/bash
# Backup Script
BACKUP_DIR="/backups/npm/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database
docker exec npm_db mysqldump -u npm -p${DB_PASSWORD} npm \
  > "$BACKUP_DIR/npm_database.sql"

# Backup configuration and certificates
tar -czf "$BACKUP_DIR/npm_data.tar.gz" \
  /data/ \
  /etc/letsencrypt/

# Backup custom Nginx configs
tar -czf "$BACKUP_DIR/custom_configs.tar.gz" \
  /data/nginx/custom/

# Export proxy hosts configuration
docker exec npm curl -X GET http://localhost:81/api/nginx/proxy-hosts \
  -H "Authorization: Bearer ${API_TOKEN}" \
  > "$BACKUP_DIR/proxy_hosts.json"

# Restore Script
restore_npm() {
  RESTORE_FROM="$1"

  # Stop services
  docker-compose down npm npm_db

  # Restore database
  docker-compose up -d npm_db
  sleep 10
  docker exec -i npm_db mysql -u npm -p${DB_PASSWORD} npm \
    < "$RESTORE_FROM/npm_database.sql"

  # Restore data and certificates
  tar -xzf "$RESTORE_FROM/npm_data.tar.gz" -C /
  tar -xzf "$RESTORE_FROM/custom_configs.tar.gz" -C /

  # Start NPM
  docker-compose up -d npm

  # Reload Nginx
  docker exec npm nginx -s reload
}
```

## 6. Service Dependencies and Startup Order

```yaml
npm:
  depends_on:
    npm_db:
      condition: service_healthy
  networks:
    - proxy_network
    - internal

npm_db:
  networks:
    - internal

# Ports configuration
ports:
  - "80:80"       # HTTP
  - "443:443"     # HTTPS
  - "81:81"       # Admin interface

# Startup priority: 3 (critical infrastructure)
```

## 7. Resource Limits and Quotas

```yaml
npm:
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M

npm_db:
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 512M
      reservations:
        cpus: '0.25'
        memory: 256M
```

## 8. Logging Configuration

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "10"
    labels: "service=nginx-proxy-manager"

# Nginx access and error logs
nginx_logs:
  access_log: /data/logs/access.log combined
  error_log: /data/logs/error.log warn

# Log rotation
logrotate:
  /data/logs/*.log:
    rotate: 14
    daily: true
    compress: true
    delaycompress: true
    missingok: true
```

## 9. Update and Maintenance Strategy

```yaml
# Update strategy
labels:
  - "com.centurylinklabs.watchtower.enable=true"
  - "com.centurylinklabs.watchtower.schedule=0 0 2 * * *"

# Update procedure
update_script: |
  #!/bin/bash
  # Backup first
  ./backup_npm.sh

  # Pull new images
  docker pull jc21/nginx-proxy-manager:latest
  docker pull mariadb:latest

  # Update containers
  docker-compose down npm npm_db
  docker-compose up -d npm_db
  sleep 10
  docker-compose up -d npm

  # Test configuration
  docker exec npm nginx -t

  # Reload if successful
  docker exec npm nginx -s reload

# SSL certificate renewal (automated)
certbot_renewal:
  schedule: "0 0 * * *"  # Daily check
  command: "certbot renew --quiet"
```

## 10. Configuration File Templates

### docker-compose.yml
```yaml
version: '3.8'

services:
  npm:
    image: jc21/nginx-proxy-manager:latest
    container_name: npm
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
      - '81:81'
    environment:
      DB_MYSQL_HOST: npm_db
      DB_MYSQL_PORT: 3306
      DB_MYSQL_USER: npm
      DB_MYSQL_PASSWORD: ${DB_PASSWORD}
      DB_MYSQL_NAME: npm
    volumes:
      - ./data/npm:/data
      - ./letsencrypt:/etc/letsencrypt
      - ./config/npm/nginx:/data/nginx/custom
    depends_on:
      - npm_db
    networks:
      - proxy_network
      - internal

  npm_db:
    image: mariadb:latest
    container_name: npm_db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: npm
      MYSQL_USER: npm
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./data/npm_db:/var/lib/mysql
    networks:
      - internal

networks:
  proxy_network:
    external: true
  internal:
    internal: true
```

### Custom Nginx Configuration
```nginx
# /data/nginx/custom/http_top.conf
# Global HTTP settings

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
limit_conn_zone $binary_remote_addr zone=addr:10m;

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript
           application/x-javascript application/xml+rss
           application/javascript application/json;

# SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
```

### Proxy Host Template
```nginx
# /data/nginx/proxy_host/1.conf
server {
    listen 80;
    listen [::]:80;
    server_name service.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name service.example.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/service.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/service.example.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /data/logs/proxy-host-1_access.log;
    error_log /data/logs/proxy-host-1_error.log;

    # Rate limiting
    limit_req zone=general burst=20 nodelay;
    limit_conn addr 10;

    location / {
        proxy_pass http://backend-service:8080;

        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Proxy settings
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # WebSocket support
        proxy_cache_bypass $http_upgrade;

        # File uploads
        client_max_body_size 100M;
    }
}
```

## Security Considerations

1. **Default Credentials**: Change admin@example.com/changeme immediately
2. **Access Lists**: Implement IP whitelisting for admin interface
3. **SSL/TLS**: Use strong ciphers and protocols
4. **Rate Limiting**: Implement per-service rate limits
5. **Fail2ban Integration**: Block repeated failed attempts
6. **API Security**: Use API tokens, not passwords

## Integration Points

- **All Services**: Central reverse proxy for all homelab services
- **Let's Encrypt**: Automated SSL certificate management
- **Cloudflare**: DNS validation for wildcard certificates
- **Authelia/Authentik**: Forward authentication
- **Crowdsec**: Advanced threat detection

## Performance Optimization

1. **Caching**:
   - Enable proxy caching for static content
   - Use Redis for session storage
   - Implement browser caching headers

2. **Connection Handling**:
   - Tune worker processes and connections
   - Enable HTTP/2 and HTTP/3
   - Use keepalive connections

3. **Load Balancing**:
   - Implement upstream health checks
   - Use least_conn or ip_hash methods
   - Configure backup servers

## Troubleshooting Guide

Common issues:
- **502 Bad Gateway**: Check upstream service availability
- **Certificate errors**: Verify DNS records and renewal
- **Slow response**: Check proxy buffer settings
- **WebSocket issues**: Ensure upgrade headers are set
- **Permission errors**: Check file ownership for certificates