# Coolify Setup Guide

> **⚠️ DEPRECATED**: This documentation has been migrated to the new structure.
>
> **New Location**: [../../docs/coolify/README.md](../../docs/coolify/README.md)
>
> **Archived**: This file is preserved for reference but may contain outdated information.
> See [../../openspec/specs/coolify-paas/spec.md](../../openspec/specs/coolify-paas/spec.md) for formal requirements.

Coolify is a self-hosted Platform-as-a-Service (PaaS) that provides an alternative to Heroku, Netlify, and Vercel. This guide covers deployment in your homelab.

## Overview

**Access URL**: `http://<server-ip>:8000` or `https://coolify.<domain>`

**Network**: Homelab network (172.20.0.0/24)
- Coolify: 172.20.0.100
- PostgreSQL: 172.20.0.101
- Redis: 172.20.0.102
- Soketi: 172.20.0.103

## Architecture

Coolify consists of four services:

1. **coolify** - Main application (port 8000)
2. **coolify-db** - PostgreSQL 16 database
3. **coolify-redis** - Redis cache
4. **coolify-soketi** - WebSocket server for real-time updates

## Prerequisites

### Required Before First Deployment

Generate the following values and add them to your `.env` file:

```bash
# Generate APP_ID (32 character hex)
openssl rand -hex 16

# Generate APP_KEY (base64 encoded)
echo "base64:$(openssl rand -base64 32)"

# Generate database password
openssl rand -base64 32

# Generate Redis password (optional)
openssl rand -base64 32

# Generate Pusher credentials
openssl rand -hex 16  # PUSHER_APP_ID
openssl rand -hex 32  # PUSHER_APP_KEY
openssl rand -hex 32  # PUSHER_APP_SECRET
```

### Add to `.env` file

```env
# Coolify Configuration
COOLIFY_APP_ID=<generated-hex-16>
COOLIFY_APP_KEY=base64:<generated-base64-32>
COOLIFY_APP_URL=http://coolify.local  # or https://coolify.yourdomain.com
COOLIFY_DB_PASSWORD=<generated-password>
COOLIFY_REDIS_PASSWORD=<generated-password>
COOLIFY_PUSHER_APP_ID=<generated-hex-16>
COOLIFY_PUSHER_APP_KEY=<generated-hex-32>
COOLIFY_PUSHER_APP_SECRET=<generated-hex-32>
```

## Deployment

### 1. Initial Setup

```bash
cd ~/homelab

# Ensure environment variables are configured
source .env

# Validate configuration
docker compose config | grep -A 20 coolify

# Deploy Coolify stack
docker compose up -d coolify coolify-db coolify-redis coolify-soketi
```

### 2. First-Time Access

```bash
# Check service health
docker compose ps | grep coolify
docker compose logs -f coolify

# Access web interface
# Local: http://<server-ip>:8000
# Via Traefik: https://coolify.<domain>
```

### 3. Create Admin Account

1. Navigate to `http://<server-ip>:8000`
2. Create your admin account (first user becomes admin)
3. Configure SSH keys for deployments
4. Set up git provider integrations (GitHub, GitLab, Bitbucket)

## Configuration

### Traefik Integration

Coolify is pre-configured with Traefik labels in `compose/platform.yml`:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.coolify.rule=Host(`coolify.${DOMAIN}`)"
  - "traefik.http.routers.coolify.entrypoints=websecure"
  - "traefik.http.routers.coolify.tls=true"
```

To enable HTTPS access:

1. Set `DOMAIN` in `.env` (e.g., `DOMAIN=yourdomain.com`)
2. Ensure Traefik has valid SSL certificates
3. Access via `https://coolify.yourdomain.com`

### SSH Key Setup

Coolify needs SSH access to manage Docker containers:

```bash
# Check generated SSH key
docker exec coolify cat /data/coolify/ssh/keys/[email protected]

# This key is auto-generated on first run
# Use it to configure git repository access
```

### Docker Socket Access

Coolify requires access to the Docker socket to deploy applications:

- Socket mounted as read-only: `/var/run/docker.sock:/var/run/docker.sock:ro`
- Runs with `privileged: true` for container management
- Creates its own Docker network for deployed applications

## Usage

### Deploy Applications

Coolify supports multiple deployment methods:

1. **Git-based deployments**: Connect to GitHub/GitLab repos
2. **Docker Compose**: Upload compose files for multi-container apps
3. **Dockerfile**: Build from Dockerfile in your repo
4. **Pre-built images**: Deploy from Docker Hub or private registry

### Deployment Workflow

1. **Create Project**: Organize related applications
2. **Add Resource**: Select deployment type (app, database, service)
3. **Configure Source**: Connect git repo or specify image
4. **Environment Variables**: Set app configuration
5. **Deploy**: Coolify handles build and deployment

### Manage Services

Deploy pre-configured services via Coolify's service catalog:

- **Databases**: PostgreSQL, MySQL, MongoDB, Redis
- **Utilities**: MinIO, Plausible Analytics, Umami
- **Media**: Plex, Jellyfin (duplicate detection with existing services)

## Networking

### Application Networks

Coolify creates isolated networks for each application:

- Network name: `coolify-<app-id>`
- Applications can communicate via service names
- External access via Traefik or exposed ports

### Integration with Existing Services

To allow Coolify-deployed apps to access homelab services:

1. Connect app to `homelab` network in Coolify settings
2. Use service names (e.g., `postgres`, `redis`) or IPs
3. Configure Traefik routes for external access

## Monitoring

### Health Checks

```bash
# Check Coolify status
docker compose ps coolify

# View logs
docker compose logs -f coolify

# Check database
docker compose exec coolify-db psql -U coolify -c "SELECT version();"

# Check Redis
docker compose exec coolify-redis redis-cli ping
```

### Resource Usage

```bash
# Container stats
docker stats coolify coolify-db coolify-redis coolify-soketi

# Disk usage
docker exec coolify du -sh /data/coolify
```

## Backup & Restore

### Backup

```bash
# Backup Coolify data
docker compose exec coolify-db pg_dump -U coolify coolify > coolify-backup-$(date +%Y%m%d).sql

# Backup application data
sudo tar -czf coolify-data-backup-$(date +%Y%m%d).tar.gz coolify-data/
```

### Restore

```bash
# Restore database
docker compose exec -T coolify-db psql -U coolify coolify < coolify-backup-YYYYMMDD.sql

# Restore data directory
sudo tar -xzf coolify-data-backup-YYYYMMDD.tar.gz
docker compose restart coolify
```

## Troubleshooting

### Coolify Won't Start

```bash
# Check environment variables
docker compose config | grep -A 30 coolify

# Verify APP_KEY is set
echo $COOLIFY_APP_KEY

# Check logs for errors
docker compose logs coolify | tail -50
```

### Database Connection Issues

```bash
# Test database connectivity
docker compose exec coolify-db pg_isready -U coolify

# Check database logs
docker compose logs coolify-db

# Verify password in .env matches service config
```

### SSL Certificate Problems

```bash
# Check Traefik logs
docker compose logs traefik | grep coolify

# Verify DNS points to server
dig coolify.yourdomain.com

# Check certificate status
docker compose exec traefik cat /letsencrypt/acme.json | jq '.Certificates[]'
```

### Port Conflicts

```bash
# Check if port 8000 is in use
sudo lsof -i :8000

# Stop conflicting service or change Coolify port in compose/platform.yml
```

### Permission Issues

```bash
# Fix data directory permissions
sudo chown -R $PUID:$PGID ~/homelab/coolify-data

# Check Docker socket permissions
ls -l /var/run/docker.sock
```

## Security Considerations

### Production Deployment

Before exposing Coolify to the internet:

1. **Use HTTPS only**: Configure Traefik with valid SSL
2. **Strong passwords**: All database and admin passwords
3. **Firewall rules**: Restrict access to port 8000
4. **Regular updates**: Keep Coolify updated
5. **Backup schedule**: Automated daily backups

### Authentication

Optional: Add basic auth via Traefik middleware:

```yaml
# In compose/platform.yml
labels:
  - "traefik.http.routers.coolify.middlewares=auth@file"
```

Then configure middleware in `traefik/dynamic/middlewares.yml`.

### SSH Key Security

- Generated keys stored in `/data/coolify/ssh/keys/`
- Protect with proper file permissions (600)
- Rotate keys periodically
- Use deploy keys with read-only access where possible

## Integration with Homelab

### Recommended Use Cases

1. **Development environments**: Quick staging deployments
2. **Personal projects**: Host side projects separate from main stack
3. **Client demos**: Temporary environments for presentations
4. **CI/CD pipelines**: Automated deployment from git

### Avoid Duplicates

Services already in homelab don't need Coolify versions:

- ✅ Use Coolify for: Custom apps, temporary services
- ❌ Avoid duplicating: Jellyfin, databases, monitoring tools

## Updates

### Update Coolify

```bash
# Pull latest image
docker compose pull coolify

# Recreate container
docker compose up -d coolify

# Check version
docker compose exec coolify cat /etc/os-release
```

### Automatic Updates

Configure Watchtower to auto-update Coolify (already labeled):

```yaml
labels:
  - "com.centurylinklabs.watchtower.enable=true"
```

## Additional Resources

- **Official Docs**: https://coolify.io/docs
- **GitHub**: https://github.com/coollabsio/coolify
- **Discord**: https://coollabs.io/discord
- **Demo**: https://demo.coolify.io

## System Requirements

### Minimum

- **CPU**: 2 cores
- **RAM**: 2 GB (for Coolify services only)
- **Storage**: 10 GB for Coolify + deployed apps

### Recommended

- **CPU**: 4+ cores
- **RAM**: 4+ GB
- **Storage**: 50+ GB for multiple applications

## Service URLs

After deployment:

| Service | Port | URL |
|---------|------|-----|
| Coolify Web UI | 8000 | `http://<ip>:8000` |
| Via Traefik | 443 | `https://coolify.<domain>` |
| PostgreSQL | 5432 | Internal only (172.20.0.101) |
| Redis | 6379 | Internal only (172.20.0.102) |
| Soketi | 6001 | Internal only (172.20.0.103) |

---

**Need Help?** Check logs with `docker compose logs -f coolify` or visit the Coolify Discord community.
