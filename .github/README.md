# GitHub Actions - Homelab Deployment

This directory contains GitHub Actions workflows and scripts for automated deployment to your homelab server.

## Quick Start

### 1. Run the Setup Script

The easiest way to configure everything is to run the automated setup script:

```bash
./.github/scripts/setup-secrets.sh
```

This script will:

- Check for GitHub CLI installation
- Authenticate with GitHub
- Generate SSH keys if needed
- Configure all required GitHub secrets
- Test the SSH connection
- Provide next steps

### 2. Manual Setup

If you prefer to set up manually, see [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) for detailed instructions.

## Workflows

### Deploy to Homelab (`deploy-homelab.yml`)

**Purpose:** Automated deployment of homelab services to your homelab

**Triggers:**

- Push to `main` branch when `homelab/` directory changes
- Manual workflow dispatch with options:
  - Force deployment (even without changes)
  - Rollback to previous version

**Features:**

- Automatic backup before deployment
- Health checks for critical services
- Automatic rollback on failure
- Deployment notifications
- Cleanup of old backups

**Usage:**

```bash
# Trigger manually via GitHub CLI
gh workflow run deploy-homelab.yml

# With force deployment
gh workflow run deploy-homelab.yml -f force_deploy=true

# With rollback
gh workflow run deploy-homelab.yml -f rollback=true

# Watch the run
gh run watch
```

### Monitor Homelab Health (`monitor-homelab.yml`)

**Purpose:** Continuous monitoring of homelab services

**Triggers:**

- Every 15 minutes (via cron schedule)
- Manual workflow dispatch with verbose output option

**Features:**

- Health checks for all Docker services
- System resource monitoring (CPU, memory, disk)
- Performance metrics collection
- Automatic alert creation for failures
- Alert resolution when services recover

**Alerts:**

- Creates GitHub issues for persistent failures
- Closes issues automatically when services recover
- Configurable alert threshold (default: 3 consecutive failures)

## Scripts

### `setup-secrets.sh`

Interactive script to configure GitHub secrets for deployment.

**Usage:**

```bash
./.github/scripts/setup-secrets.sh
```

**What it does:**

1. Checks for GitHub CLI installation
2. Authenticates with GitHub
3. Collects server information
4. Generates or uses existing SSH keys
5. Tests SSH connection
6. Creates GitHub secrets
7. Verifies configuration

## Local Deployment

The deployment script can also be used locally:

```bash
cd homelab

# Normal deployment
./deploy.sh

# Create backup only
./deploy.sh --backup-only

# Rollback
./deploy.sh --rollback

# Validate configuration
./deploy.sh --validate
```

See `./deploy.sh --help` for all options.

## Required GitHub Secrets

| Secret            | Description                         |
| ----------------- | ----------------------------------- |
| `HOMELAB_HOST`    | Server IP or hostname               |
| `HOMELAB_USER`    | SSH username                        |
| `HOMELAB_SSH_KEY` | Private SSH key for authentication  |
| `HOMELAB_PATH`    | Path to homelab directory on remote |

## Directory Structure

```
.github/
├── workflows/
│   ├── deploy-homelab.yml      # Main deployment workflow
│   └── monitor-homelab.yml     # Health monitoring workflow
├── scripts/
│   └── setup-secrets.sh        # Secret configuration script
├── DEPLOYMENT_SETUP.md         # Detailed setup documentation
└── README.md                    # This file
```

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**

   - Verify SSH key is added to server's `~/.ssh/authorized_keys`
   - Check firewall allows SSH (port 22)
   - Ensure correct username and hostname

2. **Docker Commands Fail**

   - Ensure user is in docker group: `sudo usermod -aG docker $USER`
   - Verify Docker daemon is running: `sudo systemctl status docker`

3. **Workflow Doesn't Trigger**

   - Check path filters in workflow file
   - Verify you're pushing to the correct branch
   - Ensure workflow file is valid YAML

4. **Health Checks Fail**
   - Review service logs: `docker-compose logs service-name`
   - Check system resources: `df -h`, `free -h`
   - Verify network connectivity

### Viewing Logs

```bash
# View recent workflow runs
gh run list

# View specific run details
gh run view [run-id]

# Download workflow logs
gh run download [run-id]

# Watch a running workflow
gh run watch
```

### Manual Recovery

If automatic deployment fails:

```bash
# SSH to your server
ssh username@your-server

# Navigate to homelab directory
cd /path/to/homelab

# Check current status
docker-compose ps

# Manual rollback
./deploy.sh --rollback

# Or restore from specific backup
cd .backups/backup_YYYYMMDD_HHMMSS
./restore.sh
```

## Security Considerations

- Never commit secrets or credentials to the repository
- Use dedicated SSH keys for deployment
- Regularly rotate SSH keys and tokens
- Enable GitHub's security features (Dependabot, secret scanning)
- Review workflow changes in pull requests
- Use branch protection rules for main/production branches

## Support

For issues or questions:

1. Check the [deployment documentation](./DEPLOYMENT_SETUP.md)
2. Review workflow run logs for errors
3. Create an issue in the repository
4. Check Docker and docker-compose documentation

## License

Part of the Installfest project. See repository license for details.
