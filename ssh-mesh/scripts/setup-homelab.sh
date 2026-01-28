#!/bin/bash
# SSH Mesh Setup Script for Homelab
# Run: bash setup-homelab.sh
# Or from Mac: cat setup-homelab.sh | ssh homelab bash

set -e

echo "=== SSH Mesh Setup for Homelab ==="
echo ""

# Expect keys and config to be passed via stdin or already present
MESH_DIR="${MESH_DIR:-$(pwd)}"

# Create .ssh directory if needed
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Check if we're running with the mesh files available
if [ -f "$MESH_DIR/keys/id_ed25519" ]; then
    echo "Installing from local mesh directory..."
    cp "$MESH_DIR/keys/id_ed25519" ~/.ssh/id_ed25519
    cp "$MESH_DIR/keys/id_ed25519.pub" ~/.ssh/id_ed25519.pub
    cp "$MESH_DIR/configs/homelab.config" ~/.ssh/config
else
    echo "Mesh directory not found. Please ensure keys are installed manually."
    echo "Required files:"
    echo "  ~/.ssh/id_ed25519       (private key)"
    echo "  ~/.ssh/id_ed25519.pub   (public key)"
    echo "  ~/.ssh/config           (SSH config)"
    echo "  ~/.ssh/authorized_keys  (public key for inbound)"
fi

# Set permissions
chmod 600 ~/.ssh/id_ed25519 2>/dev/null || true
chmod 644 ~/.ssh/id_ed25519.pub 2>/dev/null || true
chmod 600 ~/.ssh/config 2>/dev/null || true

# Add public key to authorized_keys for inbound connections
if [ -f ~/.ssh/id_ed25519.pub ]; then
    echo "Setting up authorized_keys for inbound SSH..."
    cat ~/.ssh/id_ed25519.pub > ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Test connections:"
echo "  ssh cloudpc   # → CloudPC (Tailscale)"
echo "  ssh mac       # → Mac (Tailscale)"
