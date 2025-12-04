# Coolify PaaS

## Overview

Coolify is a self-hosted Platform-as-a-Service (PaaS) that provides an alternative to Heroku, Netlify, and Vercel. It enables deploying applications from Git repositories or Docker images with automatic builds, deployments, and SSL certificate management.

## Setup

### Prerequisites

Generate secure credentials before first deployment:

```bash
cd ~/homelab
./scripts/generate-coolify-env.sh
```

This generates credentials for:
- Application encryption key (`COOLIFY_APP_KEY`)
- Database password (`COOLIFY_DB_PASSWORD`)
- Redis password (`COOLIFY_REDIS_PASSWORD`)
- WebSocket authentication (Pusher credentials)

### Deployment

```bash
# Deploy all Coolify services
docker compose up -d coolify coolify-db coolify-redis coolify-soketi

# Check status
docker compose ps | grep coolify

# View logs
docker compose logs -f coolify
```

### Initial Setup

1. Navigate to `http://<server-ip>:8000`
2. Create admin account (first user becomes admin)
3. Configure SSH keys for deployments
4. Connect git providers (GitHub, GitLab, Bitbucket)

## Configuration

### Architecture

Coolify consists of four interconnected services:

| Service | Purpose | Static IP | Port |
|---------|---------|-----------|------|
| coolify | Main application | 172.20.0.100 | 8000 |
| coolify-db | PostgreSQL 16 database | 172.20.0.101 | 5432 |
| coolify-redis | Redis cache | 172.20.0.102 | 6379 |
| coolify-soketi | WebSocket server | 172.20.0.103 | 6001 |

All services connect to the homelab network (172.20.0.0/16).

### Environment Variables

Required in `.env` file:

```env
COOLIFY_APP_ID=<generated-hex-16>
COOLIFY_APP_KEY=base64:<generated-base64-32>
COOLIFY_APP_URL=http://coolify.local
COOLIFY_DB_PASSWORD=<generated-password>
COOLIFY_REDIS_PASSWORD=<generated-password>
COOLIFY_PUSHER_APP_ID=<generated-hex-16>
COOLIFY_PUSHER_APP_KEY=<generated-hex-32>
COOLIFY_PUSHER_APP_SECRET=<generated-hex-32>
```

### Network Integration

Coolify-deployed applications can access homelab services by connecting to the homelab network:

```yaml
# In your app's docker-compose
networks:
  - homelab

# Access services by name
environment:
  DATABASE_URL: postgresql://user:pass@postgres:5432/db
  REDIS_URL: redis://redis:6379
```

## Usage

### Deploying Applications

**From Git Repository:**
1. Create Project in Coolify UI
2. Add Resource → Application
3. Connect GitHub/GitLab repository
4. Configure build settings:
   - Dockerfile location
   - Build arguments
   - Port mapping
5. Deploy → Auto-builds on git push

**From Docker Image:**
1. Create Project
2. Add Resource → Docker Image
3. Specify image name and tag
4. Configure environment variables
5. Deploy

**From Docker Compose:**
1. Create Project
2. Add Resource → Docker Compose
3. Paste compose file or connect repo
4. Set environment variables
5. Deploy → Coolify handles orchestration

### Supported Deployments

- **Web Apps**: Node.js, Python, PHP, Ruby, Go
- **Static Sites**: React, Vue, Svelte, Next.js
- **Databases**: PostgreSQL, MySQL, MongoDB, Redis
- **Services**: MinIO, Plausible, Umami, n8n
- **Custom**: Any Docker image or compose file

### Managing Deployments

**Via Web UI:**
- View deployment logs
- Configure environment variables
- Manage SSL certificates
- Monitor resource usage

**Via CLI:**
```bash
# View Coolify logs
docker compose logs -f coolify

# Restart Coolify
docker compose restart coolify

# Update to latest version
docker compose pull coolify
docker compose up -d coolify
```

## Troubleshooting

### UI Not Accessible

```bash
# Check container status
docker compose ps coolify

# View logs
docker compose logs coolify | tail -50

# Verify port accessibility
curl http://localhost:8000

# Check for port conflicts
sudo netstat -tulpn | grep :8000
```

### Database Connection Errors

```bash
# Test database connection
docker compose exec coolify-db pg_isready -U coolify

# Check credentials match .env
grep COOLIFY_DB_PASSWORD .env

# View database logs
docker compose logs coolify-db
```

### Deployment Failures

**Check application logs:**
- View deployment logs in Coolify UI
- Check build output for errors
- Verify Docker image exists

**Common issues:**
- Incorrect Dockerfile path
- Missing environment variables
- Port conflicts with existing services
- Insufficient resources (memory/CPU)

### Need to Regenerate Credentials

```bash
# Stop services
docker compose down coolify coolify-db coolify-redis coolify-soketi

# Generate new credentials
./scripts/generate-coolify-env.sh

# Remove old data volumes
docker volume rm coolify-postgres coolify-redis

# Redeploy
docker compose up -d coolify coolify-db coolify-redis coolify-soketi
```

### WebSocket Issues

```bash
# Check Soketi status
docker compose ps coolify-soketi
docker compose logs coolify-soketi

# Verify Pusher credentials in .env match
grep COOLIFY_PUSHER .env
```

## Best Practices

1. **Backup Database**: Regularly backup PostgreSQL database
   ```bash
   docker compose exec coolify-db pg_dump -U coolify coolify > backup.sql
   ```

2. **Monitor Resources**: Check container resource usage
   ```bash
   docker stats coolify coolify-db coolify-redis
   ```

3. **Update Regularly**: Keep Coolify updated for security and features
4. **Secure Access**: Use Traefik reverse proxy with HTTPS
5. **Separate Projects**: Organize deployments into logical projects

## References

- **OpenSpec Specification**: [openspec/specs/coolify-paas/spec.md](../../openspec/specs/coolify-paas/spec.md)
- **Coolify Documentation**: https://coolify.io/docs
- **Discord Community**: https://coollabs.io/discord
- **Related Services**:
  - Traefik (reverse proxy for HTTPS)
  - Docker Network (homelab integration)
- **Quick Start Guide**: [homelab/COOLIFY_QUICKSTART.md](../../homelab/COOLIFY_QUICKSTART.md)
