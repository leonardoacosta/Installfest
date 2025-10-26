#!/bin/bash
# Setup GitHub Actions Runner Permissions for Homelab Deployment
# Run this script AS ROOT on the homelab server to configure proper permissions

set -e

# Configuration
HOMELAB_USER="${HOMELAB_USER:-nyaptor}"
HOMELAB_PATH="${HOMELAB_PATH:-/home/nyaptor/homelab}"
RUNNER_USER="${RUNNER_USER:-runner}"  # Adjust if your runner uses a different username

echo "============================================"
echo "GitHub Actions Runner Permission Setup"
echo "============================================"
echo "This script will configure permissions for:"
echo "  Homelab User: $HOMELAB_USER"
echo "  Homelab Path: $HOMELAB_PATH"
echo "  Runner User: $RUNNER_USER"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: This script must be run as root (use sudo)"
    exit 1
fi

# Option 1: Configure passwordless sudo for runner (RECOMMENDED)
echo "=== Option 1: Configuring Passwordless Sudo ==="
echo ""

# Check if runner user exists
if id "$RUNNER_USER" &>/dev/null; then
    echo "Adding passwordless sudo for $RUNNER_USER..."

    # Create sudoers file for runner
    cat > /etc/sudoers.d/github-runner << EOF
# GitHub Actions Runner - Passwordless sudo for deployment
$RUNNER_USER ALL=(ALL) NOPASSWD: /bin/mkdir, /bin/chown, /bin/chmod, /usr/bin/rsync, /bin/cp, /usr/bin/docker, /usr/bin/docker-compose
$RUNNER_USER ALL=(ALL) NOPASSWD: /home/$HOMELAB_USER/homelab/scripts/*
EOF

    # Validate sudoers file
    visudo -c -f /etc/sudoers.d/github-runner

    echo "✓ Passwordless sudo configured for specific commands"
else
    echo "⚠ Runner user '$RUNNER_USER' not found"
    echo "  Create the runner user first, then re-run this script"
fi

echo ""
echo "=== Option 2: Directory Ownership Setup ==="
echo ""

# Create homelab directory structure
echo "Creating homelab directory structure..."
mkdir -p "$HOMELAB_PATH"/{homeassistant/config,glance/assets,traefik/letsencrypt,traefik/config,traefik/dynamic}
mkdir -p "$HOMELAB_PATH"/{jellyfin/config,vaultwarden,adguardhome/work,adguardhome/conf}
mkdir -p "$HOMELAB_PATH"/{ollama,ollama-webui,radarr,sonarr,lidarr,prowlarr,bazarr}
mkdir -p "$HOMELAB_PATH"/{qbittorrent,jellyseerr,nzbget,scripts,docs}

# Create a homelab group
echo "Creating homelab group..."
groupadd -f homelab

# Add both users to the homelab group
echo "Adding users to homelab group..."
usermod -a -G homelab "$HOMELAB_USER"
if id "$RUNNER_USER" &>/dev/null; then
    usermod -a -G homelab "$RUNNER_USER"
    echo "✓ Added $RUNNER_USER to homelab group"
fi

# Set ownership and permissions
echo "Setting directory ownership and permissions..."
chown -R "$HOMELAB_USER:homelab" "$HOMELAB_PATH"
chmod -R 775 "$HOMELAB_PATH"

# Set sticky bit to preserve group ownership
find "$HOMELAB_PATH" -type d -exec chmod g+s {} \;

echo "✓ Directory permissions configured"

echo ""
echo "=== Option 3: ACL Setup (Advanced) ==="
echo ""

# Check if ACL is available
if command -v setfacl &> /dev/null; then
    if id "$RUNNER_USER" &>/dev/null; then
        echo "Setting ACL permissions for $RUNNER_USER..."
        setfacl -R -m u:$RUNNER_USER:rwx "$HOMELAB_PATH"
        setfacl -R -d -m u:$RUNNER_USER:rwx "$HOMELAB_PATH"
        echo "✓ ACL permissions set for $RUNNER_USER"
    fi
else
    echo "⚠ ACL tools not installed (install with: apt-get install acl)"
fi

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Verification Steps:"
echo "1. Test sudo access (as $RUNNER_USER):"
echo "   sudo mkdir -p $HOMELAB_PATH/test && sudo rm -rf $HOMELAB_PATH/test"
echo ""
echo "2. Test write access (as $RUNNER_USER):"
echo "   touch $HOMELAB_PATH/test.txt && rm $HOMELAB_PATH/test.txt"
echo ""
echo "3. Check group membership:"
echo "   groups $RUNNER_USER"
echo ""
echo "4. If using systemd for the runner, restart it:"
echo "   systemctl restart actions.runner.*"
echo ""
echo "Note: The runner may need to logout/login for group changes to take effect"
echo ""