# Homelab Deployment Setup Guide

This guide explains how to set up automated deployment to your homelab server using GitHub Actions with a self-hosted runner.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Self-Hosted Runner Setup](#self-hosted-runner-setup)
- [Repository Configuration](#repository-configuration)
- [Testing the Deployment](#testing-the-deployment)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## Prerequisites

Before setting up the automated deployment, ensure you have:

1. **Homelab Server Requirements:**

   - Docker and docker-compose installed
   - Git installed and configured
   - Sufficient disk space (minimum 2GB free for runner + services)
   - User with sudo privileges (for Docker commands)
   - Internet connectivity (outbound HTTPS access to GitHub)

2. **GitHub Repository:**

   - Admin access to your GitHub repository
   - Ability to register self-hosted runners

3. **Local Development Environment:**
   - Git configured
   - Access to push to the repository

## Self-Hosted Runner Setup

### Why Self-Hosted Runners?

Self-hosted runners provide superior security and performance for homelab deployments:

- ✅ **No inbound connections** - Runner polls GitHub (outbound only)
- ✅ **No SSH exposure** - No port forwarding or firewall rules needed
- ✅ **Local execution** - Direct Docker API access, faster deployments
- ✅ **Works behind NAT** - No static IP or DDNS required
- ✅ **Secure by design** - Runs within your network perimeter

### Step 1: Download and Configure Runner

On your homelab server, run the following commands:

```bash
# Create a directory for the runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download the latest runner package (check GitHub for latest version)
curl -o actions-runner-linux-x64-2.319.1.tar.gz -L https://github.com/actions/runner/releases/download/v2.319.1/actions-runner-linux-x64-2.319.1.tar.gz

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.319.1.tar.gz
```

### Step 2: Generate Registration Token

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Navigate to **Actions** > **Runners**
4. Click **New self-hosted runner**
5. Select **Linux** as the operating system
6. Copy the registration token provided

### Step 3: Register the Runner

Back on your homelab server:

```bash
# Configure the runner (use the token from GitHub)
./config.sh --url https://github.com/YOUR_USERNAME/Installfest --token YOUR_REGISTRATION_TOKEN

# When prompted:
# - Enter a name for the runner (e.g., "homelab-server")
# - Accept the default work folder or specify a custom path
# - Add labels if desired (e.g., "homelab", "docker")
# - Press Enter to use the runner in the default group
```

### Step 4: Install Runner as a Service

Install the runner as a systemd service for automatic startup:

```bash
# Install the service
sudo ./svc.sh install

# Start the runner service
sudo ./svc.sh start

# Check the status
sudo ./svc.sh status
```

### Step 5: Verify Runner Registration

1. Go back to **Settings** > **Actions** > **Runners** in your GitHub repository
2. You should see your runner listed with a green "Idle" status
3. The runner is now ready to accept jobs

### Alternative: Run as Docker Container

If you prefer to run the runner in Docker:

```bash
docker run -d --restart unless-stopped \
  --name github-runner \
  -e REPO_URL="https://github.com/YOUR_USERNAME/Installfest" \
  -e RUNNER_TOKEN="YOUR_REGISTRATION_TOKEN" \
  -e RUNNER_NAME="homelab-docker-runner" \
  -e RUNNER_WORKDIR="/tmp/runner/work" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /tmp/runner:/tmp/runner \
  myoung34/github-runner:latest
```

## Repository Configuration

### Environment Variables (Optional)

If you need to customize deployment paths, add these as repository variables:

1. Go to **Settings** > **Secrets and variables** > **Actions** > **Variables**
2. Add variables as needed:

| Variable Name  | Description                            | Example Value                      |
| -------------- | -------------------------------------- | ---------------------------------- |
| `HOMELAB_PATH` | Absolute path to homelab directory     | `/home/ubuntu/Installfest/homelab` |
| `MAX_BACKUPS`  | Number of backups to retain            | `5`                                |

### Repository Labels

Ensure your workflow targets the correct runner using labels:

- Default label: `self-hosted`
- Custom labels: Add during runner configuration (e.g., `homelab`, `docker`)

## Testing the Deployment

### 1. Manual Workflow Trigger

Test the deployment using GitHub's manual workflow dispatch:

1. Go to **Actions** tab in your repository
2. Select **Deploy to Homelab** workflow
3. Click **Run workflow**
4. Select the branch (usually `main`)
5. Optionally check **Force deployment** to deploy regardless of changes
6. Click **Run workflow**

### 2. Test via Push

Make a change to any file in the `homelab/` directory:

```bash
# Make a test change
echo "# Test deployment" >> homelab/README.md

# Commit and push
git add homelab/README.md
git commit -m "test: trigger deployment workflow"
git push origin main
```

### 3. Monitor Deployment

Watch the workflow execution in real-time:

1. Go to **Actions** tab in your repository
2. Click on the running workflow
3. Click on the **Deploy to Homelab Server** job
4. Watch the deployment steps execute on your self-hosted runner

### 4. Verify Deployment

After the workflow completes, verify on your homelab server:

```bash
# Check Docker services
cd ~/Installfest/homelab
docker-compose ps

# Check deployment logs
ls -la .backups/  # Should see backup directories

# View recent Git commits
git log --oneline -5

# Check runner logs (if needed)
sudo journalctl -u actions.runner.* -f
```

## Local Deployment Script Usage

The `homelab/deploy.sh` script can also be used locally:

### Basic Usage

```bash
cd homelab

# Normal deployment
./deploy.sh

# Create backup only
./deploy.sh --backup-only

# Rollback to previous version
./deploy.sh --rollback

# Validate configuration
./deploy.sh --validate

# Skip health checks
./deploy.sh --skip-health

# Use custom compose file
./deploy.sh --compose-file docker-compose-prod.yml
```

### Environment Variables

You can customize the deployment behavior using environment variables:

```bash
# Set custom paths and configurations
export HOMELAB_PATH="/custom/path/to/homelab"
export MAX_BACKUPS=10
export HEALTH_CHECK_RETRIES=10
export CRITICAL_SERVICES="nginx-proxy-manager homeassistant"

./deploy.sh
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Runner Not Connecting

**Error:** Runner shows as "Offline" in GitHub

**Solution:**

- Check runner service status: `sudo ./svc.sh status`
- Verify internet connectivity: `curl -I https://github.com`
- Check runner logs: `sudo journalctl -u actions.runner.* -n 50`
- Restart runner service: `sudo ./svc.sh restart`
- Ensure firewall allows outbound HTTPS (port 443)

#### 2. Runner Registration Fails

**Error:** `Failed to register runner` or `Invalid token`

**Solution:**

- Token expires quickly - generate a new registration token from GitHub
- Ensure correct repository URL format
- Check that you have admin permissions on the repository
- Verify runner isn't already registered with the same name

#### 3. Docker Commands Fail

**Error:** `docker: command not found` or `permission denied`

**Solution:**

- Ensure Docker is installed on the homelab server
- Add runner user to docker group: `sudo usermod -aG docker $USER`
- Restart runner service for group changes to take effect
- Verify Docker socket permissions: `ls -l /var/run/docker.sock`

#### 4. Workflow Not Triggering

**Error:** Workflow doesn't run on push or manual dispatch

**Solution:**

- Verify runner is online and idle in GitHub Settings
- Check workflow file syntax is valid
- Ensure push is to the correct branch (`main`)
- Verify `homelab/` path changes are committed
- Check Actions are enabled in repository settings

#### 5. Git Repository Not Found

**Error:** `fatal: not a git repository`

**Solution:**

- Initialize the repository on the homelab server:
  ```bash
  cd ~/Installfest/homelab
  git init
  git remote add origin https://github.com/YOUR_USERNAME/Installfest.git
  git fetch origin main
  git reset --hard origin/main
  ```

#### 6. Health Checks Fail

**Error:** Services fail health checks after deployment

**Solution:**

- Increase health check retries and delay in workflow
- Check service logs: `docker-compose logs service-name`
- Verify service configurations in [docker-compose.yml](../homelab/docker-compose.yml)
- Ensure required ports are not already in use
- Check service dependencies are met

#### 7. Insufficient Disk Space

**Error:** `Insufficient disk space`

**Solution:**

- Clean up old Docker images: `docker system prune -a`
- Remove old backups manually from `.backups/`
- Clean runner work directory: `rm -rf ~/actions-runner/_work/_temp/*`
- Increase available disk space on the server

### Viewing Workflow Logs

1. Go to **Actions** tab in GitHub
2. Click on the workflow run
3. Click on the job name to see detailed logs
4. Expand any step to see its output
5. Logs execute in real-time on your self-hosted runner

### Checking Runner Logs

View detailed runner logs on your homelab server:

```bash
# View recent runner logs
sudo journalctl -u actions.runner.* -n 100

# Follow live runner logs
sudo journalctl -u actions.runner.* -f

# Check runner process status
ps aux | grep Runner.Listener
```

### Manual Rollback

If automatic rollback fails, manually rollback on the server:

```bash
# Navigate to homelab directory
cd ~/Installfest/homelab

# List available backups
ls -la .backups/

# Restore from a specific backup
cp .backups/backup_YYYYMMDD_HHMMSS/docker-compose.yml ./
[ -f .backups/backup_YYYYMMDD_HHMMSS/.env ] && cp .backups/backup_YYYYMMDD_HHMMSS/.env ./

# Restart services with restored configuration
docker-compose down
docker-compose up -d

# Verify services are running
docker-compose ps
```

## Security Best Practices

### 1. Runner Security

- **Dedicated user account:** Run the runner service under a non-root user with limited permissions
- **Isolated environment:** Consider running the runner in a dedicated VM or container
- **Network segmentation:** Use firewall rules to limit runner network access
- **Regular updates:** Keep the runner software updated to the latest version
- **Audit runner logs:** Regularly review runner activity logs
- **Token security:** Never commit runner registration tokens to version control

### 2. Repository Security

- **Protect branches:** Enable branch protection for main/production
- **Review workflow changes:** Require PR reviews for workflow modifications
- **Limit runner access:** Use runner groups to control which repositories can use your runner
- **Enable 2FA:** Require two-factor authentication for all contributors
- **Workflow permissions:** Use minimal permissions in workflow files

### 3. Self-Hosted Runner Best Practices

- **Private repositories only:** Only use self-hosted runners with private repositories
- **No public forks:** Disable workflow runs from forks to prevent code injection
- **Review job logs:** Monitor what commands are being executed
- **Runner labels:** Use specific labels to control job routing
- **Ephemeral runners:** Consider using ephemeral runners that are destroyed after each job

### 4. Docker Security

- **Use specific image tags:** Avoid using `latest` tag in production
- **Scan images:** Use tools like Trivy to scan for vulnerabilities
- **Limit container privileges:** Avoid running containers as root
- **Network isolation:** Use proper Docker networks for service isolation
- **Secrets management:** Use environment variables, never hardcode secrets

### 5. Backup Security

- **Encrypt sensitive backups:** Consider encrypting backup files
- **Offsite backups:** Store critical backups in multiple locations
- **Test restore process:** Regularly test backup restoration
- **Limit retention:** Don't keep backups longer than necessary
- **Secure backup permissions:** Ensure backups are only readable by authorized users

## Monitoring and Alerts

### Setting up Notifications

The workflow includes basic GitHub notifications. For advanced monitoring:

1. **Slack Integration:**

   - Add Slack webhook URL as a repository secret
   - Modify workflow to send Slack notifications on success/failure

2. **Email Notifications:**

   - Use GitHub's built-in email notifications
   - Configure in Settings > Notifications
   - Subscribe to workflow run notifications

3. **Health Monitoring:**
   - Consider adding Uptime Kuma or similar monitoring
   - Set up alerts for service failures
   - Monitor runner health and uptime

### Runner Monitoring

Monitor your self-hosted runner health:

```bash
# Check runner service status
sudo systemctl status actions.runner.*

# Monitor runner resource usage
htop  # or top

# Check runner disk usage
df -h ~/actions-runner

# View runner metrics
docker stats  # if running services
```

### Deployment Metrics

Track deployment success with these metrics:

- Deployment frequency
- Success/failure rate
- Rollback frequency
- Average deployment time
- Service availability after deployment
- Runner uptime and reliability

## Advanced Configuration

### Custom Health Checks

Modify the critical services list in the deployment script:

```bash
# In the deployment script on your server
CRITICAL_SERVICES="nginx-proxy-manager adguardhome homeassistant plex"
```

### Multiple Self-Hosted Runners

For redundancy or multiple homelab servers, set up additional runners:

1. Install runner on each server with unique names
2. Use runner labels to target specific servers
3. Configure workflow to use specific labels:

```yaml
jobs:
  deploy-server-1:
    runs-on: [self-hosted, homelab-1]
  deploy-server-2:
    runs-on: [self-hosted, homelab-2]
```

### Staging Deployments

Create a staging workflow that deploys to a test environment first:

1. Set up a second self-hosted runner with label `staging`
2. Create `deploy-staging.yml` workflow
3. Configure workflow to use staging runner:

```yaml
jobs:
  deploy-staging:
    runs-on: [self-hosted, staging]
```

### Runner Auto-Update

Enable automatic runner updates:

```bash
# On your homelab server
cd ~/actions-runner
sudo ./svc.sh stop
./config.sh remove --token YOUR_REMOVAL_TOKEN
# Re-register with latest version
./config.sh --url https://github.com/YOUR_USERNAME/Installfest --token YOUR_TOKEN
sudo ./svc.sh install
sudo ./svc.sh start
```

## Support and Contributions

### Getting Help

- Check the [Issues](https://github.com/yourusername/yourrepo/issues) section
- Review workflow run logs for detailed error messages
- Check runner logs on your homelab server
- Consult GitHub Actions self-hosted runner documentation
- Consult Docker and docker-compose documentation

### Contributing

Improvements to the deployment process are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with your own self-hosted runner
5. Submit a pull request

### Additional Resources

- [GitHub Actions Self-Hosted Runners Documentation](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

### License

This deployment configuration is part of your project and follows the same license.

---

**Last Updated:** 2024
**Version:** 2.0.0 - Self-Hosted Runner Implementation
