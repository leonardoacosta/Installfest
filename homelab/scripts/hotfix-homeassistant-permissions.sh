#!/bin/bash
# Quick hotfix for Home Assistant config permissions
# Run this on the server to immediately fix the permission issue

set -e

HOMELAB_PATH="${HOMELAB_PATH:-/home/nyaptor/homelab}"
RUNNER_USER="${RUNNER_USER:-runner}"

echo "==================================="
echo "Home Assistant Permission Hotfix"
echo "==================================="

# Create Home Assistant directories with proper permissions
echo "Creating Home Assistant directories..."
sudo mkdir -p "$HOMELAB_PATH/homeassistant/config"
sudo mkdir -p "$HOMELAB_PATH/homeassistant/.storage"
sudo mkdir -p "$HOMELAB_PATH/homeassistant/custom_components"

# Fix ownership - try to detect the correct user
if [ -d "$HOMELAB_PATH/.git" ]; then
    # Get the owner of the git directory
    OWNER=$(stat -c '%U' "$HOMELAB_PATH/.git" 2>/dev/null || stat -f '%Su' "$HOMELAB_PATH/.git" 2>/dev/null || echo "nyaptor")
else
    OWNER="nyaptor"
fi

echo "Setting ownership to $OWNER..."
sudo chown -R "$OWNER:$OWNER" "$HOMELAB_PATH/homeassistant"

# Make directories group-writable
echo "Setting group permissions..."
sudo chmod -R 775 "$HOMELAB_PATH/homeassistant"

# If runner user exists, add to owner's group
if id "$RUNNER_USER" &>/dev/null; then
    echo "Adding $RUNNER_USER to $OWNER group..."
    sudo usermod -a -G "$OWNER" "$RUNNER_USER"
fi

# Also ensure the parent directory is accessible
echo "Ensuring parent directory permissions..."
sudo chmod 755 "$HOMELAB_PATH"

# Create the MTR-1 config file if needed
if [ ! -f "$HOMELAB_PATH/homeassistant/config/mtr1-zones.yaml" ]; then
    echo "Creating MTR-1 zones template..."
    sudo touch "$HOMELAB_PATH/homeassistant/config/mtr1-zones.yaml"
    sudo chown "$OWNER:$OWNER" "$HOMELAB_PATH/homeassistant/config/mtr1-zones.yaml"
fi

echo ""
echo "==================================="
echo "Hotfix completed!"
echo "==================================="
echo ""
echo "Permissions fixed for: $HOMELAB_PATH/homeassistant"
echo ""
echo "Now retry the deployment!"
echo ""