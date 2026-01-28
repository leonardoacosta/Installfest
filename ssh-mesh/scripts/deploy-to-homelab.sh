#!/bin/bash
# Deploy SSH mesh config to Homelab from Mac
# Run: bash deploy-to-homelab.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MESH_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Deploying SSH Mesh to Homelab ==="
echo ""

# Copy keys
echo "Copying SSH keys..."
scp "$MESH_DIR/keys/id_ed25519" homelab:~/.ssh/id_ed25519
scp "$MESH_DIR/keys/id_ed25519.pub" homelab:~/.ssh/id_ed25519.pub

# Copy config
echo "Copying SSH config..."
scp "$MESH_DIR/configs/homelab.config" homelab:~/.ssh/config

# Set permissions and authorized_keys
echo "Setting permissions and authorized_keys..."
ssh homelab 'chmod 700 ~/.ssh && chmod 600 ~/.ssh/id_ed25519 ~/.ssh/config && chmod 644 ~/.ssh/id_ed25519.pub && cat ~/.ssh/id_ed25519.pub > ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Test from homelab:"
echo "  ssh homelab"
echo "  ssh cloudpc  # (from homelab)"
