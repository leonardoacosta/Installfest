# Coolify Quick Start

Add Coolify to your homelab in 5 minutes.

## What is Coolify?

Self-hosted PaaS (Platform as a Service) - deploy apps like Heroku/Vercel without the cloud.

## Installation

### 1. Generate Credentials

```bash
cd ~/homelab
./scripts/generate-coolify-env.sh
```

This creates secure credentials for:
- Application encryption key
- Database password
- Redis password
- WebSocket authentication

### 2. Deploy Services

```bash
# Deploy all Coolify services
docker compose up -d coolify coolify-db coolify-redis coolify-soketi

# Check status
docker compose ps | grep coolify
```

### 3. Initial Setup

1. Navigate to `http://<server-ip>:8000`
2. Create admin account (first user = admin)
3. Configure SSH key for deployments
4. Connect git providers (GitHub/GitLab)

## Quick Deploy Example

### Deploy a Docker Compose App

1. **Create Project** in Coolify UI
2. **Add Resource** → Docker Compose
3. **Paste compose file** or connect git repo
4. **Set environment variables**
5. **Deploy** → Coolify handles everything

### Deploy from GitHub

1. **Create Project**
2. **Add Resource** → Application
3. **Connect GitHub repo**
4. **Configure build settings**
   - Dockerfile location
   - Build arguments
   - Port mapping
5. **Deploy** → Auto-builds on git push

## Access URLs

| Service | Port | URL |
|---------|------|-----|
| Coolify | 8000 | `http://<ip>:8000` |
| Via Traefik | 443 | `https://coolify.<domain>` |

## Common Commands

```bash
# View logs
docker compose logs -f coolify

# Restart Coolify
docker compose restart coolify

# Update to latest version
docker compose pull coolify
docker compose up -d coolify

# Backup database
docker compose exec coolify-db pg_dump -U coolify coolify > backup.sql
```

## Architecture

```
coolify (main app)
├── coolify-db (PostgreSQL 16)
├── coolify-redis (cache)
└── coolify-soketi (WebSocket)
```

All services on homelab network (172.20.0.0/24):
- Coolify: 172.20.0.100
- Database: 172.20.0.101
- Redis: 172.20.0.102
- Soketi: 172.20.0.103

## Troubleshooting

### Can't access UI

```bash
# Check container is running
docker compose ps coolify

# Check logs
docker compose logs coolify | tail -50

# Verify port not blocked
curl http://localhost:8000
```

### Database errors

```bash
# Test database connection
docker compose exec coolify-db pg_isready -U coolify

# Check credentials in .env
grep COOLIFY_DB_PASSWORD .env
```

### Need to regenerate credentials

```bash
# Stop services first
docker compose down coolify coolify-db coolify-redis

# Generate new credentials
./scripts/generate-coolify-env.sh

# Remove old data
docker volume rm coolify-postgres coolify-redis

# Redeploy
docker compose up -d coolify
```

## What Can I Deploy?

- **Web Apps**: Node.js, Python, PHP, Ruby, Go
- **Static Sites**: React, Vue, Svelte, HTML
- **Databases**: PostgreSQL, MySQL, MongoDB, Redis
- **Services**: MinIO, Plausible, Umami, n8n
- **Custom**: Any Docker image or compose file

## Integration with Homelab

Coolify apps can access your homelab services:

```yaml
# In your app's docker-compose
networks:
  - homelab

# Access services by name
DATABASE_URL=postgresql://user:pass@postgres:5432/db
REDIS_URL=redis://redis:6379
```

## Next Steps

- **Full Documentation**: `docs/COOLIFY_SETUP.md`
- **Coolify Docs**: https://coolify.io/docs
- **Discord Community**: https://coollabs.io/discord

---

**Deployed!** Start building with Coolify 🚀
