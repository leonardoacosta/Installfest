#!/bin/bash
# Fix deployment permissions for GitHub Actions runner
# Run this on the homelab server to prepare for deployments

set -e

# Configuration
HOMELAB_USER="${HOMELAB_USER:-nyaptor}"
HOMELAB_PATH="${HOMELAB_PATH:-/home/nyaptor/homelab}"
RUNNER_USER="${RUNNER_USER:-runner}"  # GitHub Actions runner user

echo "==================================="
echo "Fixing Homelab Deployment Permissions"
echo "==================================="
echo "Homelab Path: $HOMELAB_PATH"
echo "Homelab User: $HOMELAB_USER"
echo "Runner User: $RUNNER_USER"
echo ""

# Create homelab directory if it doesn't exist
if [ ! -d "$HOMELAB_PATH" ]; then
    echo "Creating homelab directory..."
    sudo mkdir -p "$HOMELAB_PATH"
fi

# Create necessary subdirectories
echo "Creating service directories..."
sudo mkdir -p "$HOMELAB_PATH"/{homeassistant/config,glance/assets,traefik/letsencrypt,jellyfin/config,vaultwarden,adguardhome/{work,conf},ollama,ollama-webui}
sudo mkdir -p "$HOMELAB_PATH"/{radarr,sonarr,lidarr,prowlarr,bazarr,qbittorrent,jellyseerr,nzbget}

# Set ownership to the homelab user
echo "Setting ownership to $HOMELAB_USER..."
sudo chown -R "$HOMELAB_USER:$HOMELAB_USER" "$HOMELAB_PATH"

# Give write permissions to the group
echo "Setting group permissions..."
sudo chmod -R g+w "$HOMELAB_PATH"

# Add runner user to homelab user's group (if runner exists)
if id "$RUNNER_USER" &>/dev/null; then
    echo "Adding $RUNNER_USER to $HOMELAB_USER group..."
    sudo usermod -a -G "$HOMELAB_USER" "$RUNNER_USER"
    echo "Runner user added to group successfully"
else
    echo "Runner user '$RUNNER_USER' not found - skipping group addition"
    echo "If using GitHub Actions self-hosted runner, run this after installing the runner"
fi

# Set sticky bit on directories to preserve group ownership
echo "Setting sticky bit on directories..."
find "$HOMELAB_PATH" -type d -exec sudo chmod g+s {} \;

# Create a .env.example if it doesn't exist
if [ ! -f "$HOMELAB_PATH/.env.example" ]; then
    echo "Creating .env.example..."
    cat > "$HOMELAB_PATH/.env.example" << 'EOF'
# Homelab Environment Configuration
DOMAIN=your-domain.com
TZ=America/Chicago
PUID=1000
PGID=1000

# Add other required environment variables here
EOF
    sudo chown "$HOMELAB_USER:$HOMELAB_USER" "$HOMELAB_PATH/.env.example"
fi

echo ""
echo "==================================="
echo "Permission fix completed!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. If using GitHub Actions self-hosted runner:"
echo "   - Install the runner as user: $RUNNER_USER"
echo "   - Re-run this script after runner installation"
echo ""
echo "2. Ensure GitHub Actions workflow has:"
echo "   - HOMELAB_PATH secret set to: $HOMELAB_PATH"
echo "   - Runner has sudo privileges (if needed)"
echo ""
echo "3. Test deployment with: bash $HOMELAB_PATH/scripts/deploy-ci.sh"
echo ""