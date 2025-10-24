# Traefik v3 vs Nginx Proxy Manager - Comparison

## Quick Comparison

| Feature | Nginx Proxy Manager | Traefik v3 |
|---------|-------------------|------------|
| **Configuration** | Web GUI | Docker labels + YAML files |
| **Service Discovery** | Manual | Automatic |
| **SSL Certificates** | GUI management | Automatic (Let's Encrypt) |
| **Reload Required** | Yes (for changes) | No (dynamic reload) |
| **Learning Curve** | Easy (GUI) | Moderate (labels/YAML) |
| **Performance** | Good | Excellent |
| **Resource Usage** | ~150MB RAM | ~100-200MB RAM |
| **Management Port** | 81 | None (secure dashboard) |
| **WebSocket Support** | Manual config | Built-in |
| **Docker Integration** | None | Native |
| **Load Balancing** | Limited | Advanced |
| **Middleware** | Basic | Extensive |
| **Monitoring** | Basic logs | Prometheus metrics |
| **Rate Limiting** | Manual | Built-in |
| **Security Headers** | Manual | Built-in |
| **Auto-Discovery** | No | Yes |
| **Multi-Network** | Manual | Automatic |

## Why Migrate to Traefik?

### 1. Automation & Efficiency
**Nginx Proxy Manager:**
- Add service → Log into GUI → Create proxy host → Configure SSL → Save
- Repeat for every service
- Manual updates required for changes

**Traefik:**
- Add service with labels → Done
- Automatically discovers service
- Automatically manages SSL certificates
- Changes reload without restart

### 2. Docker-Native Integration
**Nginx Proxy Manager:**
```yaml
# Service configuration
ports:
  - "8080:8080"

# Then manually configure in NPM GUI:
# - Domain name
# - Forward hostname
# - Forward port
# - SSL settings
```

**Traefik:**
```yaml
# Everything in docker-compose
ports:
  - "8080:8080"
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.myservice.rule=Host(`myservice.local`)"
  - "traefik.http.routers.myservice.entrypoints=websecure"
  - "traefik.http.routers.myservice.tls.certresolver=letsencrypt"
  - "traefik.http.services.myservice.loadbalancer.server.port=8080"
```

### 3. Infrastructure as Code
**Nginx Proxy Manager:**
- Configuration stored in database
- Hard to version control
- Difficult to replicate across environments
- Manual backup/restore process

**Traefik:**
- Configuration in docker-compose.yml and YAML files
- Easy to version control with Git
- Identical setup across dev/staging/prod
- Simple backup (copy YAML files)

### 4. Advanced Features

#### Load Balancing
**NPM:** Basic upstream support
**Traefik:** Advanced load balancing with health checks, sticky sessions, weighted routing

#### Middleware Chains
**NPM:** Limited to basic options
**Traefik:** Extensive middleware library:
- Security headers
- Rate limiting (per service)
- Authentication (Basic, Forward, OAuth)
- IP whitelisting
- Compression
- Circuit breakers
- Buffering
- Custom chains

#### Service Discovery
**NPM:** None - manual configuration
**Traefik:** Automatic discovery of:
- Docker containers
- Kubernetes services
- Consul/Etcd services
- Marathon applications

### 5. Security Improvements

**Nginx Proxy Manager:**
- Management interface on port 81
- Basic auth support
- Manual security header configuration
- Limited rate limiting

**Traefik:**
- No exposed management port
- Secured dashboard with authentication
- Built-in security headers (HSTS, CSP, etc.)
- Advanced rate limiting per route
- IP whitelisting per service
- TLS 1.3 support
- Multiple authentication methods

### 6. Performance Benefits

**Nginx Proxy Manager:**
- Each change requires reload
- Database lookups for routing
- Limited connection pooling

**Traefik:**
- Hot reload (no downtime)
- In-memory routing
- Advanced connection pooling (maxIdleConnsPerHost: 200)
- HTTP/2 and HTTP/3 support
- Compression built-in

## Feature-by-Feature Comparison

### SSL Certificate Management

**Nginx Proxy Manager:**
1. Log into web interface
2. Navigate to SSL Certificates
3. Click "Add SSL Certificate"
4. Select Let's Encrypt
5. Enter domain and email
6. Wait for validation
7. Manually attach to proxy host

**Traefik:**
```yaml
# Automatic for all services
labels:
  - "traefik.http.routers.myservice.tls.certresolver=letsencrypt"
```
Done. Certificates automatically issued, renewed, and managed.

### Adding a New Service

**Nginx Proxy Manager:** (7 steps)
1. Start service with port mapping
2. Log into NPM GUI
3. Go to "Proxy Hosts"
4. Click "Add Proxy Host"
5. Fill in domain, IP, port
6. Go to SSL tab
7. Select certificate and enable Force SSL

**Traefik:** (1 step)
```yaml
# Add to docker-compose.yml
myservice:
  image: myimage
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.myservice.rule=Host(`myservice.local`)"
    - "traefik.http.routers.myservice.entrypoints=websecure"
    - "traefik.http.routers.myservice.tls.certresolver=letsencrypt"
```
Deploy. Traefik automatically handles everything.

### Security Headers

**Nginx Proxy Manager:**
1. Edit proxy host
2. Go to "Advanced" tab
3. Manually add Nginx configuration:
```nginx
add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
# ... repeat for each service
```

**Traefik:**
```yaml
# Apply to all services or specific ones
labels:
  - "traefik.http.routers.myservice.middlewares=security-headers@file"
```
Done. Pre-configured security headers applied.

### Rate Limiting

**Nginx Proxy Manager:**
- Requires manual Nginx configuration
- Must understand Nginx rate limiting syntax
- Applied globally or per location

**Traefik:**
```yaml
# Per service, pre-configured
labels:
  - "traefik.http.routers.myservice.middlewares=rate-limit-general@file"

# Or custom:
- "traefik.http.middlewares.myrate.ratelimit.average=100"
- "traefik.http.middlewares.myrate.ratelimit.burst=50"
```

### Multi-Network Support

**Your Setup:**
- homelab network: 172.20.0.0/16
- media network: 172.21.0.0/16

**Nginx Proxy Manager:**
- Connected to both networks (172.20.0.81, 172.21.0.81)
- Manually configure each proxy host with correct IPs
- Must remember which service is on which network

**Traefik:**
- Connected to both networks (172.20.0.81, 172.21.0.81)
- Automatically discovers services on both networks
- Routes correctly without manual configuration
- Single entry point for all services

### Services Behind VPN (Gluetun)

**Nginx Proxy Manager:**
1. Identify Gluetun's IP (172.21.0.2)
2. For each service, create proxy host:
   - qBittorrent: forward to 172.21.0.2:8080
   - Prowlarr: forward to 172.21.0.2:9696
   - NZBGet: forward to 172.21.0.2:6789
3. Update each time port changes

**Traefik:**
```yaml
# One-time setup in gluetun-routers.yml
# Automatically applies to all Gluetun services
# Changes reload automatically
```

## Operational Differences

### Daily Operations

**Nginx Proxy Manager:**
```bash
# Add new service
docker-compose up -d newservice
# Log into NPM GUI at port 81
# Click through wizard
# Configure SSL
# Test

# Update existing service
# Log into GUI
# Find service in list
# Edit settings
# Save
# Test
```

**Traefik:**
```bash
# Add new service
docker-compose up -d newservice
# Done - automatically discovered and routed

# Update existing service
# Edit docker-compose.yml labels
docker-compose up -d newservice
# Done - automatically reloaded
```

### Monitoring & Debugging

**Nginx Proxy Manager:**
- Basic access logs in GUI
- Limited error reporting
- No metrics integration
- Must check individual proxy hosts

**Traefik:**
- Real-time dashboard showing all routes
- Prometheus metrics endpoint
- Detailed access logs
- Visual health status per service
- HTTP/TCP/UDP router visibility

### Backup & Restore

**Nginx Proxy Manager:**
```bash
# Backup
tar -czf npm-backup.tar.gz nginx-proxy-manager/data

# Restore (includes manual steps)
tar -xzf npm-backup.tar.gz
docker-compose restart nginx-proxy-manager
# Hope database is compatible
```

**Traefik:**
```bash
# Backup (simple files)
tar -czf traefik-backup.tar.gz traefik/

# Restore (instant)
tar -xzf traefik-backup.tar.gz
docker-compose restart traefik
# Done - all configuration in files
```

## Migration Benefits for Your Setup

### Current State (NPM)
- 15 services requiring manual proxy host configuration
- Each service needs individual SSL setup
- Services across 2 networks require careful IP management
- Gluetun services need manual IP configuration
- Changes require GUI access
- No infrastructure as code
- Limited automation

### After Traefik Migration
- 15 services automatically discovered
- SSL certificates automatically managed for all
- Multi-network routing handled automatically
- Gluetun services configured once in YAML
- Changes via docker-compose (IaC)
- Full Git version control
- Complete automation

### Time Savings

**Adding a Service:**
- NPM: ~5-10 minutes (GUI navigation, SSL setup, testing)
- Traefik: ~1 minute (add labels to docker-compose)

**Updating a Service:**
- NPM: ~3-5 minutes (find in GUI, update settings)
- Traefik: ~30 seconds (edit YAML, deploy)

**Troubleshooting:**
- NPM: Check GUI logs, search through proxy hosts
- Traefik: Single dashboard showing all services, real-time status

**SSL Renewal:**
- NPM: Automatic (good!)
- Traefik: Automatic (also good!)

**Configuration Backup:**
- NPM: Database backup (complex)
- Traefik: Copy YAML files (simple)

## When to Use Each

### Stick with Nginx Proxy Manager if:
- You prefer GUIs over configuration files
- You have non-Docker services
- You rarely add/remove services
- You have a small number of services (< 5)
- You don't need advanced features
- You're not familiar with YAML

### Switch to Traefik if:
- You use Docker heavily
- You want infrastructure as code
- You add/remove services frequently
- You have many services (> 10)
- You want advanced load balancing
- You need rate limiting per service
- You want automatic service discovery
- You value automation over GUI simplicity
- You want Prometheus metrics
- You need multiple authentication methods

## Your Use Case: Traefik is Better Because:

1. **15+ Services**: Manual configuration overhead is high
2. **Two Networks**: Traefik handles this seamlessly
3. **Gluetun Services**: File-based config easier to manage
4. **Homelab Environment**: Perfect for experimentation and automation
5. **Docker Stack**: Native integration is valuable
6. **Growth Potential**: Easy to add more services
7. **Version Control**: Can track all changes in Git

## Migration Effort

### One-Time Setup: ~2-3 hours
- Configure Traefik static config (traefik.yml)
- Set up middlewares (middlewares.yml)
- Configure TLS options (tls.yml)
- Set up Gluetun routes (gluetun-routers.yml)
- Update environment variables

### Per-Service Migration: ~2-5 minutes each
- Add Traefik labels to docker-compose
- Test service accessibility
- Update DNS if needed

### Total Migration Time: ~3-4 hours
- Includes testing and verification
- Can be done incrementally (service by service)
- Rollback possible at any point

## Post-Migration Advantages

### 1. Faster Service Deployment
- Add service with labels → Done
- No GUI interaction needed

### 2. Better Disaster Recovery
- Entire config in Git
- Restore from backup in minutes
- Identical setup across machines

### 3. Advanced Security
- Per-service rate limiting
- Automatic security headers
- IP whitelisting per route
- Better TLS configuration

### 4. Improved Monitoring
- Prometheus metrics
- Grafana dashboards
- Real-time route status
- Better visibility

### 5. Scalability
- Easy to add more services
- Load balancing ready
- Multi-instance support
- Health checks built-in

## Conclusion

For your homelab setup with 15+ services across multiple networks, **Traefik v3 is the superior choice** because:

1. **Automation**: Saves time on every service addition/modification
2. **Docker Integration**: Native support for your containerized setup
3. **Multi-Network**: Seamless routing across homelab and media networks
4. **Infrastructure as Code**: Version control everything
5. **Advanced Features**: Rate limiting, security headers, load balancing
6. **No Management Port**: More secure than NPM's port 81
7. **Better Monitoring**: Prometheus metrics and real-time dashboard

The initial learning curve is offset by long-term time savings and operational improvements. Your configuration complexity (multiple networks, VPN services, many containers) makes Traefik's automation particularly valuable.

## Quick Migration Decision Matrix

| Your Situation | Recommended Choice |
|----------------|-------------------|
| 15+ Docker services | ✅ Traefik |
| Multiple networks | ✅ Traefik |
| Services behind VPN | ✅ Traefik |
| Want automation | ✅ Traefik |
| Need IaC | ✅ Traefik |
| Prefer GUIs | ⚠️ NPM (but consider Traefik's benefits) |
| Learning curve concerns | ⚠️ NPM (but Traefik isn't that hard) |

**Final Recommendation:** Migrate to Traefik v3 ✅
