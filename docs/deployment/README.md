# Deployment Orchestration

## Overview

The homelab deployment system provides automated, resilient deployment with validation, backup, and rollback capabilities. The deployment follows a structured 10-phase pipeline ensuring zero-data-loss and automatic recovery on failure.

## Setup

Deployment scripts are located in `homelab/scripts/`:
- `deploy-ci.sh` - Full deployment with comprehensive validation
- `deploy-ci-streamlined.sh` - Streamlined deployment for frequent updates
- `monitor-ci.sh` - Service health monitoring
- `common-utils.sh` - Shared utility functions

### Prerequisites

**Environment Variables:**
```bash
GITHUB_WORKSPACE=/path/to/repo  # Source directory
HOMELAB_PATH=~/homelab          # Deployment target
```

**Permissions:**
- User must be in docker group for non-root Docker access
- Deployment script handles sudo escalation gracefully when needed

## Configuration

### Deployment Flow

The deployment follows a strict 10-phase process:

1. **Validate Environment** - Check permissions and required variables
2. **Create Service Directories** - Ensure all directories exist with proper ownership
3. **Copy Files** - Rsync files from source to deployment path
4. **Create Backup** - Snapshot current state before changes
5. **Validate Docker Compose** - Syntax check with `docker compose config -q`
6. **Stop Services** - Graceful shutdown of existing containers
7. **Pull Images** - Update to latest Docker images
8. **Deploy** - Start services with `docker compose up -d`
9. **Health Checks** - Verify critical services (traefik, adguardhome, homeassistant)
10. **Finalize** - Rollback on failure or cleanup old backups on success

### Deployment Modes

**Full Deployment (`deploy-ci.sh`):**
- Comprehensive validation
- Detailed logging
- Suitable for major updates or first deployment

**Streamlined Deployment (`deploy-ci-streamlined.sh`):**
- Essential validation only
- Faster execution
- Suitable for frequent updates with low risk

### Permission Handling

The deployment system handles permissions gracefully:

**Attempt without sudo first:**
```bash
mkdir -p /path/to/directory 2>/dev/null || sudo mkdir -p /path/to/directory
```

**Rsync with error resilience:**
```bash
rsync --ignore-errors ...
# Exit code 23 (permission errors) treated as warning, not failure
```

**Permission fallback strategy:**
- Try operation without sudo
- Fall back to sudo if permission denied
- Continue deployment on non-critical errors

## Usage

### Manual Deployment

```bash
cd homelab/scripts

# Full deployment
bash deploy-ci.sh

# Streamlined deployment
bash deploy-ci-streamlined.sh
```

### CI/CD Deployment

Triggered automatically by GitHub Actions when changes pushed to `dev` branch affecting `homelab/**`.

**Workflow:** `.github/workflows/deploy-homelab.yml`

### Monitoring

```bash
# Run health checks
bash scripts/monitor-ci.sh

# Check specific service
docker compose ps traefik
docker compose logs -f traefik
```

### Backup Management

**Manual Backup:**
```bash
cd homelab
./homelab.sh backup
```

**Backup Location:** `~/homelab-backups/backup-YYYY-MM-DD-HHMMSS.tar.gz`

**Retention:** Last 5 backups kept automatically

### Rollback

**Automatic Rollback:**
Deployment automatically rolls back if health checks fail.

**Manual Rollback:**
```bash
# Stop current services
docker compose down

# Extract backup
cd ~/homelab-backups
tar -xzf backup-YYYY-MM-DD-HHMMSS.tar.gz -C ~/homelab

# Restart services
cd ~/homelab
docker compose up -d
```

## Troubleshooting

### Deployment Fails Validation

```bash
# Check Docker Compose syntax
cd homelab
docker compose config -q

# Validate without .env (ensure no hardcoded values)
docker compose -f docker-compose.yml config --dry-run
```

### Permission Errors

```bash
# Fix ownership
cd homelab
sudo chown -R $(id -u):$(id -g) .
chmod -R 755 .

# Verify docker group membership
groups | grep docker

# Add user to docker group if missing
sudo usermod -aG docker $USER
newgrp docker
```

### Health Checks Fail

```bash
# Check service status
docker compose ps

# View service logs
docker compose logs traefik
docker compose logs adguardhome
docker compose logs homeassistant

# Manual health check
curl -f http://traefik.local/api/health || echo "Traefik unhealthy"
```

### Rsync Exit Code 23

Exit code 23 (permission errors) is treated as warning:
- Deployment continues
- Non-critical files may be skipped
- Check logs for specific permission issues

### Rollback Not Working

```bash
# Verify backup exists
ls -lh ~/homelab-backups/

# Check backup integrity
tar -tzf backup-YYYY-MM-DD-HHMMSS.tar.gz | head

# Manual restore
cd ~/homelab-backups
tar -xzf backup-YYYY-MM-DD-HHMMSS.tar.gz -C ~/homelab --overwrite
```

## Best Practices

1. **Test Locally First**: Use local deployment simulation before CI/CD
   ```bash
   export GITHUB_WORKSPACE=$(pwd)/..
   export HOMELAB_PATH=~/homelab
   bash scripts/deploy-ci-streamlined.sh
   ```

2. **Monitor First Deployment**: Watch logs during initial deployment
3. **Verify Backups**: Periodically test backup restoration
4. **Cleanup Old Backups**: Retention policy keeps last 5 automatically
5. **Document Changes**: Update documentation when deployment flow changes

## State Management

### Setup State File

Location: `homelab/.setup_state`

**State Transitions:**
```
fresh → prerequisites_installed → runner_configured →
directories_created → environment_configured →
services_configured → deployed
```

**Resumable Setup:**
- Setup wizard tracks progress
- Can resume after interruptions
- State persists across sessions

## References

- **OpenSpec Specification**: [openspec/specs/deployment-orchestration/spec.md](../../openspec/specs/deployment-orchestration/spec.md)
- **Related Services**:
  - GitHub Actions (CI/CD trigger)
  - Docker Compose (service orchestration)
  - Rsync (file synchronization)
- **Scripts**:
  - [homelab/scripts/deploy-ci.sh](../../homelab/scripts/deploy-ci.sh)
  - [homelab/scripts/deploy-ci-streamlined.sh](../../homelab/scripts/deploy-ci-streamlined.sh)
  - [homelab/scripts/monitor-ci.sh](../../homelab/scripts/monitor-ci.sh)
  - [homelab/scripts/common-utils.sh](../../homelab/scripts/common-utils.sh)
