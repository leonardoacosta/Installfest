# Homer Dashboard - Nginx Proxy Manager Configuration

## Setting up Homer with Nginx Proxy Manager

This guide helps you configure Homer dashboard to work with your existing Nginx Proxy Manager setup.

## 1. Basic Proxy Host Configuration

### Access Nginx Proxy Manager
1. Navigate to: `http://172.20.0.81:81` or `http://localhost:81`
2. Log in with your admin credentials

### Create Proxy Host for Homer
1. Go to **Hosts** → **Proxy Hosts** → **Add Proxy Host**
2. Configure the following:

#### Details Tab:
```
Domain Names: homer.yourdomain.local (or homer.yourdomain.com for external)
Scheme: http
Forward Hostname / IP: 172.20.0.85
Forward Port: 8080
Block Common Exploits: ✓ Enabled
Websockets Support: ✓ Enabled (for live status updates)
```

#### SSL Tab (for HTTPS):
```
SSL Certificate: Request a new SSL Certificate
Force SSL: ✓ Enabled
HTTP/2 Support: ✓ Enabled
HSTS Enabled: ✓ Enabled
HSTS Subdomains: ✓ Enabled (if using subdomains)
```

#### Advanced Tab (Optional Custom Nginx Configuration):
```nginx
# Add security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "same-origin" always;

# Enable CORS for API calls (if needed for status checks)
add_header Access-Control-Allow-Origin "$http_origin" always;
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

## 2. Internal-Only Access Configuration

If you want Homer to be accessible only from your local network:

### Option A: Access List (Recommended)
1. Go to **Access Lists** → **Add Access List**
2. Name: `Local Network Only`
3. Add allowed IPs:
   ```
   172.20.0.0/16    # Homelab network
   172.21.0.0/16    # Media network
   192.168.1.0/24   # Your local LAN (adjust as needed)
   10.0.0.0/8       # Private network range
   ```
4. Apply this Access List to the Homer proxy host

### Option B: Geo-blocking
Use Nginx custom configuration to block external access:
```nginx
# Allow local networks
allow 172.20.0.0/16;
allow 172.21.0.0/16;
allow 192.168.0.0/16;
allow 10.0.0.0/8;
allow 127.0.0.1;
deny all;
```

## 3. Authentication Options

### Basic Authentication
1. Create an Access List with **Authorization** enabled
2. Add users with passwords
3. Apply to Homer proxy host

### OAuth/OIDC Integration
If using an authentication provider:
```nginx
# In Advanced configuration
auth_request /oauth2/auth;
error_page 401 = /oauth2/sign_in;

location /oauth2/ {
    proxy_pass http://oauth2-proxy:4180;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Scheme $scheme;
}
```

## 4. Status Page Integration

Homer can check service availability. Configure CORS in Nginx for each service:

### For Each Service Proxy Host:
Add to Advanced configuration:
```nginx
# Enable CORS for Homer status checks
location /api/health {
    add_header Access-Control-Allow-Origin "http://homer.yourdomain.local" always;
    add_header Access-Control-Allow-Methods "GET, HEAD" always;
}
```

## 5. Subdomain vs Path-based Routing

### Subdomain Setup (Recommended):
- `homer.yourdomain.local` → Homer Dashboard
- `jellyfin.yourdomain.local` → Jellyfin
- `ha.yourdomain.local` → Home Assistant

### Path-based Setup:
- `yourdomain.local/` → Homer Dashboard
- `yourdomain.local/jellyfin` → Jellyfin
- `yourdomain.local/ha` → Home Assistant

For path-based, add custom location blocks:
```nginx
location /homer {
    proxy_pass http://172.20.0.85:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 6. Performance Optimization

### Enable Caching
```nginx
# Cache Homer assets
proxy_cache_path /data/nginx/cache levels=1:2 keys_zone=homer_cache:10m max_size=100m inactive=60m;
proxy_cache_key "$scheme$request_method$host$request_uri";

location / {
    proxy_cache homer_cache;
    proxy_cache_valid 200 302 60m;
    proxy_cache_valid 404 1m;
    proxy_cache_bypass $http_pragma $http_authorization;
}
```

### Enable Compression
```nginx
gzip on;
gzip_vary on;
gzip_min_length 10240;
gzip_proxied expired no-cache no-store private auth;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

## 7. Monitoring & Logs

### Custom Log Format for Homer
```nginx
# In Advanced configuration
access_log /data/logs/homer_access.log;
error_log /data/logs/homer_error.log warn;
```

## 8. Backup Configuration

Remember to backup your Nginx Proxy Manager configuration:
```bash
# Backup NPM data
docker exec nginx-proxy-manager sqlite3 /data/database.sqlite ".backup /data/backup.sqlite"

# Backup Homer config
cp -r ./homer/assets/config.yml ./homer/assets/config.yml.backup
```

## 9. Troubleshooting

### Common Issues:

1. **502 Bad Gateway**
   - Verify Homer container is running: `docker ps | grep homer`
   - Check network connectivity: `docker exec nginx-proxy-manager ping 172.20.0.85`

2. **404 Not Found**
   - Verify forward hostname/IP is correct
   - Check Homer is listening on port 8080

3. **SSL Certificate Issues**
   - Ensure domain is resolvable
   - Check Let's Encrypt rate limits
   - Verify port 80/443 are accessible

4. **CORS Errors**
   - Add proper CORS headers in Nginx config
   - Verify origin domains match

## 10. Security Best Practices

1. **Use HTTPS**: Always enable SSL for external access
2. **Restrict Access**: Use Access Lists for internal-only services
3. **Regular Updates**: Keep Homer and NPM containers updated
4. **Strong Passwords**: Use strong passwords for NPM admin
5. **Fail2ban**: Consider implementing fail2ban for brute force protection
6. **Monitoring**: Set up alerts for unauthorized access attempts

## Quick Commands

```bash
# Restart services
docker-compose restart homer
docker-compose restart nginx-proxy-manager

# View logs
docker-compose logs -f homer
docker-compose logs -f nginx-proxy-manager

# Test configuration
docker exec nginx-proxy-manager nginx -t
```