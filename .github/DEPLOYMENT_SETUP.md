# Homelab Deployment Setup Guide

This guide explains how to set up automated deployment to your homelab server using GitHub Actions.

## Table of Contents

- [Prerequisites](#prerequisites)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [SSH Key Setup](#ssh-key-setup)
- [Testing the Deployment](#testing-the-deployment)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## Prerequisites

Before setting up the automated deployment, ensure you have:

1. **Homelab Server Requirements:**

   - SSH access to your homelab server
   - Docker and docker-compose installed
   - Git installed and configured
   - Sufficient disk space (minimum 1GB free)
   - User with sudo privileges (for Docker commands)

2. **GitHub Repository:**

   - Admin access to your GitHub repository
   - Ability to add repository secrets

3. **Local Development Environment:**
   - SSH client installed
   - Git configured

## GitHub Secrets Configuration

Navigate to your repository on GitHub and go to **Settings > Secrets and variables > Actions**. Add the following secrets:

### Required Secrets

| Secret Name       | Description                                          | Example Value                            |
| ----------------- | ---------------------------------------------------- | ---------------------------------------- |
| `HOMELAB_HOST`    | IP address or hostname of your homelab server        | `192.168.1.100` or `homelab.example.com` |
| `HOMELAB_USER`    | SSH username for connecting to the server            | `ubuntu` or `pi`                         |
| `HOMELAB_SSH_KEY` | Private SSH key for authentication (see setup below) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `HOMELAB_PATH`    | Absolute path to homelab directory on remote         | `/home/ubuntu/Installfest/homelab`       |

### How to Add Secrets

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Navigate to **Secrets and variables** > **Actions**
4. Click **New repository secret**
5. Enter the secret name and value
6. Click **Add secret**

## SSH Key Setup

### Step 1: Generate SSH Key Pair (if not already existing)

On your local machine, generate a new SSH key pair specifically for deployments:

```bash
# Generate a new SSH key pair (no passphrase for automation)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/homelab_deploy_key -N ""

# Or using RSA (if ed25519 is not supported)
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/homelab_deploy_key -N ""
```

This creates two files:

- `~/.ssh/homelab_deploy_key` (private key)
- `~/.ssh/homelab_deploy_key.pub` (public key)

### Step 2: Add Public Key to Homelab Server

Copy the public key to your homelab server:

```bash
# Method 1: Using ssh-copy-id (recommended)
ssh-copy-id -i ~/.ssh/homelab_deploy_key.pub your_username@your_homelab_ip

# Method 2: Manual copy
# First, display the public key
cat ~/.ssh/homelab_deploy_key.pub

# Then SSH into your homelab server
ssh your_username@your_homelab_ip

# Add the key to authorized_keys
echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Test SSH Connection

Verify the key works:

```bash
ssh -i ~/.ssh/homelab_deploy_key your_username@your_homelab_ip "echo 'SSH connection successful!'"
```

### Step 4: Add Private Key to GitHub Secrets

1. Display your private key:

   ```bash
   cat ~/.ssh/homelab_deploy_key
   ```

2. Copy the entire output, including:

   - `-----BEGIN OPENSSH PRIVATE KEY-----`
   - All the key content
   - `-----END OPENSSH PRIVATE KEY-----`

3. Add this as the `HOMELAB_SSH_KEY` secret in GitHub

### Step 5: Secure Your Keys

After adding to GitHub, secure your local keys:

```bash
# Set appropriate permissions
chmod 600 ~/.ssh/homelab_deploy_key
chmod 644 ~/.ssh/homelab_deploy_key.pub

# Optionally, backup and remove the private key from local machine
# (since it's now stored in GitHub Secrets)
cp ~/.ssh/homelab_deploy_key ~/.ssh/homelab_deploy_key.backup
# rm ~/.ssh/homelab_deploy_key  # Uncomment to remove
```

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

### 3. Verify Deployment

After the workflow runs, verify on your homelab server:

```bash
# SSH into your homelab
ssh your_username@your_homelab_ip

# Check Docker services
cd /path/to/homelab
docker-compose ps

# Check deployment logs
ls -la .backups/  # Should see backup directories

# View recent Git commits
git log --oneline -5
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

#### 1. SSH Connection Fails

**Error:** `Host key verification failed` or `Permission denied`

**Solution:**

- Verify the SSH key is correctly added to GitHub Secrets
- Ensure the public key is in the server's `~/.ssh/authorized_keys`
- Check SSH port (default 22) is open on the server
- Verify the username and host are correct

#### 2. Docker Commands Fail

**Error:** `docker: command not found` or `permission denied`

**Solution:**

- Ensure Docker is installed on the homelab server
- Add user to docker group: `sudo usermod -aG docker $USER`
- Log out and back in for group changes to take effect

#### 3. Git Pull Fails

**Error:** `fatal: not a git repository`

**Solution:**

- Initialize the repository on the homelab server:
  ```bash
  cd /path/to/homelab
  git init
  git remote add origin https://github.com/yourusername/yourrepo.git
  git fetch origin main
  git reset --hard origin/main
  ```

#### 4. Health Checks Fail

**Error:** Services fail health checks after deployment

**Solution:**

- Increase health check retries and delay in workflow
- Check service logs: `docker-compose logs service-name`
- Verify service configurations in docker-compose.yml
- Ensure required ports are not already in use

#### 5. Insufficient Disk Space

**Error:** `Insufficient disk space`

**Solution:**

- Clean up old Docker images: `docker system prune -a`
- Remove old backups manually
- Increase available disk space on the server

### Viewing Workflow Logs

1. Go to **Actions** tab in GitHub
2. Click on the workflow run
3. Click on the job name to see detailed logs
4. Expand any step to see its output

### Manual Rollback

If automatic rollback fails, manually rollback on the server:

```bash
# SSH into homelab
ssh your_username@your_homelab_ip

# Navigate to homelab directory
cd /path/to/homelab

# List available backups
ls -la .backups/

# Restore from a specific backup
./.backups/backup_YYYYMMDD_HHMMSS/restore.sh

# Or manually restore
cp .backups/backup_YYYYMMDD_HHMMSS/docker-compose.yml ./
docker-compose down
docker-compose up -d
```

## Security Best Practices

### 1. SSH Key Security

- **Use dedicated deploy keys:** Don't use your personal SSH keys for automation
- **No passphrase for automation:** GitHub Actions can't enter passphrases
- **Rotate keys periodically:** Generate new keys every 6-12 months
- **Limit key permissions:** Use restricted SSH keys when possible

### 2. Server Security

- **Firewall configuration:** Only allow SSH from known IPs if possible
- **Use non-root user:** Deploy with a dedicated user account
- **Audit logs:** Regularly review deployment logs
- **Fail2ban:** Install to prevent brute force attacks

### 3. GitHub Security

- **Protect branches:** Enable branch protection for main/production
- **Review workflow changes:** Require PR reviews for workflow modifications
- **Limit secret access:** Only give secret access to required workflows
- **Enable 2FA:** Require two-factor authentication for all contributors

### 4. Docker Security

- **Use specific image tags:** Avoid using `latest` tag in production
- **Scan images:** Use tools like Trivy to scan for vulnerabilities
- **Limit container privileges:** Avoid running containers as root
- **Network isolation:** Use proper Docker networks for service isolation

### 5. Backup Security

- **Encrypt sensitive backups:** Consider encrypting backup files
- **Offsite backups:** Store critical backups in multiple locations
- **Test restore process:** Regularly test backup restoration
- **Limit retention:** Don't keep backups longer than necessary

## Monitoring and Alerts

### Setting up Notifications

The workflow includes basic GitHub notifications. For advanced monitoring:

1. **Slack Integration:**

   - Add Slack webhook URL as a secret
   - Modify workflow to send Slack notifications

2. **Email Notifications:**

   - Use GitHub's built-in email notifications
   - Configure in Settings > Notifications

3. **Health Monitoring:**
   - Consider adding Uptime Kuma or similar monitoring
   - Set up alerts for service failures

### Deployment Metrics

Track deployment success with these metrics:

- Deployment frequency
- Success/failure rate
- Rollback frequency
- Average deployment time
- Service availability after deployment

## Advanced Configuration

### Custom Health Checks

Modify the critical services list in the workflow:

```yaml
env:
  CRITICAL_SERVICES: "nginx-proxy-manager adguardhome homeassistant plex"
```

### Parallel Deployments

For multiple homelab servers, create matrix builds:

```yaml
strategy:
  matrix:
    server:
      - host: homelab1.example.com
        user: ubuntu
      - host: homelab2.example.com
        user: pi
```

### Staging Deployments

Create a staging workflow that deploys to a test environment first:

1. Duplicate the workflow file
2. Rename to `deploy-staging.yml`
3. Modify to use staging secrets
4. Test changes in staging before production

## Support and Contributions

### Getting Help

- Check the [Issues](https://github.com/yourusername/yourrepo/issues) section
- Review workflow run logs for detailed error messages
- Consult Docker and docker-compose documentation

### Contributing

Improvements to the deployment process are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### License

This deployment configuration is part of your project and follows the same license.

---

**Last Updated:** 2024
**Version:** 1.0.0
