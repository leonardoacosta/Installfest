# Deployment Guide

Complete guide for building and deploying homelab-services to production.

## Overview

Both applications deploy as Docker containers in the homelab stack, managed by Docker Compose and deployed via GitHub Actions CI/CD.

**Deployment targets**:
- Claude Agent → `http://claude.local` (port 3002)
- Playwright Server → `http://playwright.local` (port 3000)

## Docker Architecture

### Multi-Stage Builds

Both Dockerfiles use optimized multi-stage builds:

1. **deps**: Install dependencies
2. **builder**: Build applications
3. **runner**: Production image (minimal)

### Claude Agent Dockerfile

```dockerfile
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lockb ./
COPY packages/*/package.json ./packages/
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN bun run build --filter=@homelab/claude-agent-web

FROM oven/bun:1 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/claude-agent-web/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3002
CMD ["bun", "run", "start"]
```

### Playwright Server Dockerfile

Similar structure, builds `@homelab/playwright-server` instead.

## Local Docker Builds

### Building Images

```bash
# Build Claude Agent
docker build -f docker/claude.Dockerfile -t homelab/claude-agent:latest .

# Build Playwright Server
docker build -f docker/playwright.Dockerfile -t homelab/playwright-server:latest .

# Build with specific tag
docker build -f docker/claude.Dockerfile -t homelab/claude-agent:v1.2.3 .
```

### Testing Images Locally

```bash
# Run Claude Agent
docker run -p 3002:3002 \
  -v $(pwd)/data/claude:/app/db \
  -v $(pwd)/.claude:/app/.claude \
  -e PORT=3002 \
  -e DB_PATH=/app/db/claude.db \
  homelab/claude-agent:latest

# Run Playwright Server
docker run -p 3000:3000 \
  -v $(pwd)/data/reports:/reports \
  -v $(pwd)/data/playwright:/app/db \
  -e PORT=3000 \
  -e DB_PATH=/app/db/reports.db \
  -e REPORTS_DIR=/reports \
  homelab/playwright-server:latest
```

### Debugging Builds

```bash
# Show detailed build logs
docker build -f docker/claude.Dockerfile . --progress=plain

# No cache (force rebuild)
docker build -f docker/claude.Dockerfile . --no-cache

# Build specific stage
docker build -f docker/claude.Dockerfile . --target builder

# Inspect image
docker inspect homelab/claude-agent:latest

# Run shell in image
docker run -it homelab/claude-agent:latest /bin/sh
```

## Docker Compose Configuration

### Claude Agent Service

```yaml
# homelab/compose/claude-agent-server.yml
services:
  claude-agent-web:
    image: claude-agent-web:latest
    container_name: claude-agent-web
    restart: unless-stopped
    networks:
      homelab:
        ipv4_address: 172.20.0.110
    volumes:
      - claude-agent-db:/app/db
      - /home/leo/dev/projects:/projects
      - ${PWD}/.claude:/app/.claude
    environment:
      - PORT=3002
      - DB_PATH=/app/db/claude.db
      - CLAUDE_API_URL=http://localhost:3002/api/trpc/hooks.ingest
      - NODE_ENV=production
      - CORS_ORIGINS=http://localhost:3002,http://claude.local
      - LOG_LEVEL=info
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.claude.rule=Host(`claude.local`)"
      - "traefik.http.services.claude.loadbalancer.server.port=3002"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  claude-agent-db:
    driver: local
```

### Playwright Server Service

```yaml
# homelab/compose/playwright-server.yml
services:
  playwright-server:
    image: playwright-server:latest
    container_name: playwright-server
    restart: unless-stopped
    networks:
      homelab:
        ipv4_address: 172.20.0.120
    volumes:
      - playwright-reports:/reports
      - playwright-db:/app/db
    environment:
      - PORT=3000
      - DB_PATH=/app/db/reports.db
      - REPORTS_DIR=/reports
      - NODE_ENV=production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.playwright.rule=Host(`playwright.local`)"
      - "traefik.http.services.playwright.loadbalancer.server.port=3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  playwright-reports:
    external: true  # Shared with GitHub runners
  playwright-db:
    driver: local
```

## Environment Variables

### Required Variables

**Claude Agent**:
```bash
PORT=3002
DB_PATH=/app/db/claude.db
NODE_ENV=production
CORS_ORIGINS=http://claude.local
```

**Playwright Server**:
```bash
PORT=3000
DB_PATH=/app/db/reports.db
REPORTS_DIR=/reports
NODE_ENV=production
```

### Optional Variables

```bash
# Logging
LOG_LEVEL=info  # debug, info, warn, error

# Database
DB_TIMEOUT=10000  # ms

# Claude Integration (Playwright Server)
CLAUDE_SERVER_URL=http://claude-agent-web:3002
CLAUDE_INTEGRATION_ENABLED=true
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-homelab-services.yml
name: Deploy Homelab Services

on:
  push:
    branches: [dev]
    paths:
      - 'homelab-services/**'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: |
          cd homelab-services
          bun install --frozen-lockfile

      - name: Build packages
        run: |
          cd homelab-services
          bun run build

      - name: Build Docker images
        run: |
          cd homelab-services
          docker build -f docker/claude.Dockerfile -t claude-agent-web:latest .
          docker build -f docker/playwright.Dockerfile -t playwright-server:latest .

      - name: Stop containers
        run: |
          cd homelab
          docker compose stop claude-agent-web playwright-server

      - name: Deploy containers
        run: |
          cd homelab
          docker compose up -d claude-agent-web playwright-server

      - name: Health check
        run: |
          sleep 10
          curl -f http://localhost:3002/health
          curl -f http://localhost:3000/health
```

### Manual Deployment

From homelab server:

```bash
# 1. Pull latest code
cd ~/Installfest
git pull origin dev

# 2. Build images
cd homelab-services
docker build -f docker/claude.Dockerfile -t claude-agent-web:latest .
docker build -f docker/playwright.Dockerfile -t playwright-server:latest .

# 3. Deploy
cd ../homelab
docker compose up -d claude-agent-web playwright-server

# 4. Verify
docker compose ps
docker compose logs -f claude-agent-web
curl http://localhost:3002/health
```

## Database Migrations

### Running Migrations

Migrations run automatically on container start, or manually:

```bash
# Execute in running container
docker exec claude-agent-web bun run db:migrate

# Or run via shell
docker exec -it claude-agent-web sh
cd /app/packages/db
bun run db:migrate
```

### Migration Strategy

**Development**:
1. Generate migration: `bun run db:generate`
2. Test locally: `bun run db:migrate`
3. Commit migration file
4. Push to dev branch

**Production**:
1. CI/CD pulls new code
2. Builds Docker image (includes migrations)
3. Container starts and runs migrations
4. Health check verifies deployment

### Rollback Migrations

Manual rollback process:

```bash
# 1. Stop container
docker compose stop claude-agent-web

# 2. Restore database from backup
cp /path/to/backup/claude.db /var/lib/docker/volumes/claude-agent-db/_data/

# 3. Revert to previous image
docker compose up -d claude-agent-web:previous-tag

# 4. Verify
curl http://localhost:3002/health
```

## Monitoring and Health Checks

### Health Endpoints

**Claude Agent**: `GET http://claude.local/health`

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": 1234567890
}
```

**Playwright Server**: `GET http://playwright.local/health`

```json
{
  "status": "healthy",
  "database": "connected",
  "reports": 1234,
  "timestamp": 1234567890
}
```

### Container Logs

```bash
# View logs
docker compose logs claude-agent-web
docker compose logs playwright-server

# Follow logs
docker compose logs -f claude-agent-web

# Last 100 lines
docker compose logs --tail=100 claude-agent-web

# With timestamps
docker compose logs -t claude-agent-web
```

### Container Status

```bash
# List containers
docker compose ps

# Inspect container
docker inspect claude-agent-web

# Resource usage
docker stats claude-agent-web

# Health status
docker inspect --format='{{.State.Health.Status}}' claude-agent-web
```

## Backups

### Database Backups

```bash
# Backup Claude Agent database
docker run --rm \
  -v claude-agent-db:/source \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/claude-agent-db-$(date +%Y%m%d).tar.gz -C /source .

# Backup Playwright Server database
docker run --rm \
  -v playwright-db:/source \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/playwright-db-$(date +%Y%m%d).tar.gz -C /source .
```

### Automated Backups

Add to homelab backup script:

```bash
#!/bin/bash
# homelab/scripts/backup-databases.sh

BACKUP_DIR="/home/leo/backups/homelab-services"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup Claude Agent
docker run --rm \
  -v claude-agent-db:/source \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/claude-agent-$DATE.tar.gz" -C /source .

# Backup Playwright Server
docker run --rm \
  -v playwright-db:/source \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/playwright-$DATE.tar.gz" -C /source .

# Keep last 7 days
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Backups completed: $DATE"
```

Run daily via cron:

```bash
0 2 * * * /home/leo/homelab/scripts/backup-databases.sh
```

## Rollback Procedures

### Rollback to Previous Image

```bash
# Tag current image
docker tag claude-agent-web:latest claude-agent-web:rollback

# Pull previous working version
docker pull claude-agent-web:v1.2.2

# Tag as latest
docker tag claude-agent-web:v1.2.2 claude-agent-web:latest

# Restart container
docker compose up -d claude-agent-web

# Verify
curl http://localhost:3002/health
```

### Rollback Database

```bash
# Stop container
docker compose stop claude-agent-web

# Restore from backup
docker run --rm \
  -v claude-agent-db:/target \
  -v $(pwd)/backups:/backup \
  alpine sh -c "rm -rf /target/* && tar xzf /backup/claude-agent-20251204.tar.gz -C /target"

# Restart container
docker compose up -d claude-agent-web
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs claude-agent-web

# Check last error
docker inspect claude-agent-web --format='{{.State.Error}}'

# Verify image exists
docker images | grep claude-agent

# Try running manually
docker run -it --rm claude-agent-web:latest sh
```

### Health Check Failing

```bash
# Check endpoint manually
curl -v http://localhost:3002/health

# Check database connection
docker exec claude-agent-web ls -la /app/db

# Check environment variables
docker exec claude-agent-web env | grep DB_PATH
```

### Port Conflicts

```bash
# Check what's using port
lsof -i:3002

# Kill process
lsof -ti:3002 | xargs kill -9

# Or change port in docker-compose.yml
```

### Volume Issues

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect claude-agent-db

# Remove and recreate
docker compose down
docker volume rm claude-agent-db
docker compose up -d
```

## Performance Optimization

### Image Size Optimization

Current sizes:
- Claude Agent: ~250MB
- Playwright Server: ~240MB

Further optimization:
```dockerfile
# Use slim base image
FROM node:18-slim

# Remove dev dependencies in production
RUN bun install --production --frozen-lockfile

# Clean build artifacts
RUN rm -rf .next/cache
```

### Container Resources

Limit resources in docker-compose.yml:

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      memory: 256M
```

### Database Performance

- Regular VACUUM: `PRAGMA optimize`
- Index optimization
- Connection pooling

## Security Considerations

### Non-Root User

Both Dockerfiles use non-root user:

```dockerfile
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
```

### Secrets Management

Never commit secrets:

```bash
# .env (gitignored)
DB_PASSWORD=secret
API_KEY=secret

# Pass to container
docker compose up -d --env-file .env
```

### Network Isolation

Containers on homelab network (172.20.0.0/16):

```yaml
networks:
  homelab:
    external: true
```

Access via Traefik reverse proxy only.

## Related Documentation

- [Architecture Guide](./architecture.md)
- [Development Guide](./development.md)
- [Contributing Guide](./contributing.md)
- [Package Documentation](./packages/)
- [Main Homelab Docs](../../homelab/README.md)
