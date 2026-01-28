#!/bin/bash
# SSH Mesh Setup Script for Mac
# Run: bash setup-mac.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MESH_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== SSH Mesh Setup for Mac ==="
echo ""

# Create .ssh directory if needed
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Copy private key
echo "Installing private key..."
cp "$MESH_DIR/keys/id_ed25519" ~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_ed25519

# Copy public key
echo "Installing public key..."
cp "$MESH_DIR/keys/id_ed25519.pub" ~/.ssh/id_ed25519.pub
chmod 644 ~/.ssh/id_ed25519.pub

# Backup existing config if present
if [ -f ~/.ssh/config ]; then
    echo "Backing up existing config to ~/.ssh/config.bak"
    cp ~/.ssh/config ~/.ssh/config.bak
fi

# Install SSH config
echo "Installing SSH config..."
cp "$MESH_DIR/configs/mac.config" ~/.ssh/config
chmod 600 ~/.ssh/config

# Add key to SSH agent
echo "Adding key to SSH agent..."
ssh-add ~/.ssh/id_ed25519 2>/dev/null || true

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Test connections:"
echo "  ssh homelab   # → Homelab (LAN/Tailscale)"
echo "  ssh cloudpc   # → CloudPC (Tailscale)"
