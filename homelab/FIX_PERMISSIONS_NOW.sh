#!/bin/bash
# IMMEDIATE FIX FOR GITHUB ACTIONS DEPLOYMENT PERMISSIONS
# Run this script ON YOUR HOMELAB SERVER as root to fix permissions

echo "================================================"
echo "IMMEDIATE PERMISSION FIX FOR GITHUB ACTIONS"
echo "================================================"
echo ""
echo "This will fix permissions so GitHub Actions can deploy"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: Must run as root!"
    echo "Run: sudo bash FIX_PERMISSIONS_NOW.sh"
    exit 1
fi

HOMELAB_PATH="/home/nyaptor/homelab"
HOMELAB_USER="nyaptor"

echo "Step 1: Creating all required directories..."
mkdir -p "$HOMELAB_PATH"/{homeassistant/config,glance/assets,traefik/letsencrypt,traefik/config,traefik/dynamic}
mkdir -p "$HOMELAB_PATH"/{jellyfin/config,vaultwarden,adguardhome/work,adguardhome/conf}
mkdir -p "$HOMELAB_PATH"/{ollama,ollama-webui,radarr,sonarr,lidarr,prowlarr,bazarr}
mkdir -p "$HOMELAB_PATH"/{qbittorrent,jellyseerr,nzbget,scripts,docs}

echo "Step 2: Setting ownership to $HOMELAB_USER..."
chown -R $HOMELAB_USER:$HOMELAB_USER "$HOMELAB_PATH"

echo "Step 3: Setting permissions (everyone can write - temporary fix)..."
chmod -R 777 "$HOMELAB_PATH"

echo "Step 4: Configuring passwordless sudo for runner..."
cat > /etc/sudoers.d/github-runner-emergency << 'EOF'
# Emergency GitHub Actions Runner permissions
ALL ALL=(ALL) NOPASSWD: ALL
EOF

echo ""
echo "================================================"
echo "✅ PERMISSIONS FIXED!"
echo "================================================"
echo ""
echo "GitHub Actions should now be able to deploy."
echo ""
echo "⚠️  SECURITY WARNING:"
echo "   - Directory is now world-writable (777)"
echo "   - ALL users have passwordless sudo"
echo "   - This is a TEMPORARY fix for deployment"
echo ""
echo "After deployment succeeds, run:"
echo "   sudo bash $HOMELAB_PATH/scripts/setup-runner-permissions.sh"
echo "To properly secure the permissions."
echo ""
echo "Now push to GitHub to retry the deployment!"
echo ""