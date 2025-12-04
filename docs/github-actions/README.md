# GitHub Actions Workflows

## Overview

The homelab uses GitHub Actions for automated deployment and monitoring with self-hosted runners on the Arch Linux server. Two primary workflows handle continuous deployment and health monitoring.

## Setup

### Self-Hosted Runner

The GitHub Actions runner is installed as a systemd service on the homelab server.

**Installation Location:** `~/actions-runner`

**Service Management:**
```bash
cd ~/actions-runner
sudo ./svc.sh status
sudo ./svc.sh restart
sudo ./svc.sh stop
sudo ./svc.sh start
```

### Runner Configuration

- **Labels**: `self-hosted`, `Linux`, `X64`, `homelab`
- **Repository**: Configured during setup wizard
- **Token**: Generated from GitHub repository settings

## Configuration

### Deploy to Homelab Workflow

**File:** `.github/workflows/deploy-homelab.yml`

**Triggers:**
- Push to `dev` branch affecting `homelab/**`
- Manual dispatch (workflow_dispatch)

**Configuration:**
```yaml
on:
  push:
    branches: [dev]
    paths:
      - 'homelab/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: [self-hosted, Linux, X64, homelab]
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        run: bash homelab/scripts/deploy-ci-streamlined.sh
```

**Features:**
- Automatic rollback on failure
- Deployment notifications
- Environment validation
- Health checks

### Monitor Homelab Workflow

**File:** `.github/workflows/monitor-homelab.yml`

**Triggers:**
- Schedule: Every 30 minutes (`cron: '*/30 * * * *'`)
- Manual dispatch

**Configuration:**
```yaml
on:
  schedule:
    - cron: '*/30 * * * *'
  workflow_dispatch:

jobs:
  monitor:
    runs-on: [self-hosted, Linux, X64, homelab]
    steps:
      - uses: actions/checkout@v4
      - name: Health Check
        run: bash homelab/scripts/monitor-ci.sh
```

**Monitored Services:**
- Traefik (reverse proxy)
- AdGuard Home (DNS)
- Home Assistant (automation hub)

## Usage

### Manual Deployment

Trigger deployment manually from GitHub:

1. Navigate to **Actions** tab
2. Select **Deploy to Homelab** workflow
3. Click **Run workflow**
4. Select `dev` branch
5. Click **Run workflow**

### Manual Monitoring

Trigger health check manually:

1. Navigate to **Actions** tab
2. Select **Monitor Homelab** workflow
3. Click **Run workflow**
4. Click **Run workflow**

### Viewing Workflow Runs

1. Navigate to **Actions** tab
2. Select workflow from left sidebar
3. Click on specific run to view logs
4. Expand steps to see detailed output

### Deployment Notifications

Workflow sends notifications on:
- Successful deployment
- Failed deployment with error details
- Rollback status

## Troubleshooting

### Runner Not Responding

```bash
# Check runner status
cd ~/actions-runner
sudo ./svc.sh status

# View runner logs
tail -f ~/actions-runner/_diag/Runner_*.log

# Restart runner
sudo ./svc.sh restart
```

### Runner Token Expired

Tokens expire after 1 hour if unused or periodically for security:

1. Navigate to GitHub: `https://github.com/OWNER/REPO/settings/actions/runners`
2. Remove old runner
3. Click **New self-hosted runner**
4. Generate new token
5. Reconfigure runner:
   ```bash
   cd ~/actions-runner
   sudo ./svc.sh stop
   ./config.sh remove
   ./config.sh --url https://github.com/OWNER/REPO --token NEW_TOKEN
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```

### Workflow Fails with Permission Error

```bash
# Verify user in docker group
groups | grep docker

# Add user to docker group if missing
sudo usermod -aG docker $USER
newgrp docker

# Restart runner
cd ~/actions-runner
sudo ./svc.sh restart
```

### Deployment Hangs or Times Out

- Check if services are responding:
  ```bash
  docker compose ps
  docker compose logs -f
  ```
- Review deployment script logs in workflow output
- Verify network connectivity
- Check disk space: `df -h`

### Monitor Workflow Reports Failures

```bash
# Manually check service health
bash homelab/scripts/monitor-ci.sh

# Check specific service
docker compose ps traefik
docker compose logs traefik

# Restart unhealthy service
docker compose restart traefik
```

## Best Practices

1. **Test Locally First**: Run deployment scripts locally before pushing
   ```bash
   export GITHUB_WORKSPACE=$(pwd)
   export HOMELAB_PATH=~/homelab
   bash homelab/scripts/deploy-ci-streamlined.sh
   ```

2. **Monitor First Deployment**: Watch workflow logs during initial deployments

3. **Use Manual Dispatch**: Test workflows manually before automation

4. **Keep Runner Updated**: Update runner software periodically
   ```bash
   cd ~/actions-runner
   sudo ./svc.sh stop
   ./config.sh remove
   # Download and extract latest runner
   ./config.sh --url ... --token ...
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```

5. **Backup Runner Config**: Document runner token and configuration

## Workflow Environment Variables

**Available in workflows:**
- `GITHUB_WORKSPACE` - Checked out repository path
- `HOMELAB_PATH` - Target deployment directory (`~/homelab`)
- `GITHUB_SHA` - Commit hash triggering workflow
- `GITHUB_REF` - Branch reference

**Custom variables (set in `.env` or repository secrets):**
- Service credentials
- API keys
- Notification webhooks

## References

- **OpenSpec Specification**: [openspec/specs/github-actions-workflows/spec.md](../../openspec/specs/github-actions-workflows/spec.md)
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Self-Hosted Runners**: https://docs.github.com/en/actions/hosting-your-own-runners
- **Related Documentation**:
  - [Deployment Orchestration](../deployment/README.md)
  - [Multi-Runner Setup](../github-runners/README.md) (if applicable)
- **Workflow Files**:
  - [.github/workflows/deploy-homelab.yml](../../.github/workflows/deploy-homelab.yml)
  - [.github/workflows/monitor-homelab.yml](../../.github/workflows/monitor-homelab.yml)
