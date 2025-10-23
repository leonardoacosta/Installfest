#!/bin/bash
# GitHub Secrets Setup Helper Script
# This script helps you configure GitHub secrets for homelab deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# GitHub CLI check
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        echo -e "${RED}GitHub CLI (gh) is not installed.${NC}"
        echo "Please install it from: https://cli.github.com/"
        echo ""
        echo "Installation commands:"
        echo "  macOS:  brew install gh"
        echo "  Ubuntu: sudo apt install gh"
        echo "  Other:  See https://github.com/cli/cli#installation"
        exit 1
    fi
}

# Function to read input with default value
read_with_default() {
    local prompt=$1
    local default=$2
    local value

    read -p "$prompt [$default]: " value
    echo "${value:-$default}"
}

# Function to read password/secret input
read_secret() {
    local prompt=$1
    local value

    echo -n "$prompt: "
    read -s value
    echo
    echo "$value"
}

# Header
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "           GitHub Secrets Setup for Homelab Deployment"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check for GitHub CLI
check_gh_cli

# Authenticate with GitHub if needed
echo -e "${BLUE}Checking GitHub authentication...${NC}"
if ! gh auth status &>/dev/null; then
    echo -e "${YELLOW}You need to authenticate with GitHub${NC}"
    gh auth login
fi

# Get repository information
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || "")
if [ -z "$REPO" ]; then
    echo -e "${YELLOW}Could not detect repository. Please enter it:${NC}"
    REPO=$(read_with_default "GitHub repository (owner/repo)" "username/repository")
fi

echo -e "${GREEN}✓${NC} Using repository: $REPO"
echo ""

# Collect secret values
echo -e "${BLUE}═══ Homelab Server Configuration ═══${NC}"
echo ""

HOMELAB_HOST=$(read_with_default "Homelab server IP/hostname" "192.168.1.100")
HOMELAB_USER=$(read_with_default "SSH username" "$USER")
HOMELAB_PATH=$(read_with_default "Deployment path on server" "/home/$HOMELAB_USER/Installfest/homelab")

echo ""
echo -e "${BLUE}═══ SSH Key Configuration ═══${NC}"
echo ""

# Check for existing SSH keys
SSH_KEY_PATH=""
if [ -f "$HOME/.ssh/homelab_deploy_key" ]; then
    echo -e "${GREEN}Found existing homelab deployment key${NC}"
    USE_EXISTING=$(read_with_default "Use existing key at ~/.ssh/homelab_deploy_key? (y/n)" "y")
    if [ "$USE_EXISTING" = "y" ]; then
        SSH_KEY_PATH="$HOME/.ssh/homelab_deploy_key"
    fi
elif [ -f "$HOME/.ssh/id_ed25519" ]; then
    echo -e "${YELLOW}Found existing ed25519 key${NC}"
    USE_EXISTING=$(read_with_default "Use existing key at ~/.ssh/id_ed25519? (y/n)" "n")
    if [ "$USE_EXISTING" = "y" ]; then
        SSH_KEY_PATH="$HOME/.ssh/id_ed25519"
    fi
elif [ -f "$HOME/.ssh/id_rsa" ]; then
    echo -e "${YELLOW}Found existing RSA key${NC}"
    USE_EXISTING=$(read_with_default "Use existing key at ~/.ssh/id_rsa? (y/n)" "n")
    if [ "$USE_EXISTING" = "y" ]; then
        SSH_KEY_PATH="$HOME/.ssh/id_rsa"
    fi
fi

# Generate new key if needed
if [ -z "$SSH_KEY_PATH" ]; then
    echo -e "${BLUE}Generating new SSH key pair...${NC}"
    SSH_KEY_PATH="$HOME/.ssh/homelab_deploy_key"

    KEY_TYPE=$(read_with_default "Key type (ed25519/rsa)" "ed25519")

    if [ "$KEY_TYPE" = "ed25519" ]; then
        ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$SSH_KEY_PATH" -N ""
    else
        ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f "$SSH_KEY_PATH" -N ""
    fi

    echo -e "${GREEN}✓${NC} Generated new SSH key pair at $SSH_KEY_PATH"
fi

# Test SSH connection
echo ""
echo -e "${BLUE}═══ Testing SSH Connection ═══${NC}"
echo ""

echo "Testing connection to $HOMELAB_USER@$HOMELAB_HOST..."
if ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=5 -o StrictHostKeyChecking=no \
    "$HOMELAB_USER@$HOMELAB_HOST" "echo 'Connection successful'" &>/dev/null; then
    echo -e "${GREEN}✓${NC} SSH connection successful"
else
    echo -e "${YELLOW}⚠${NC} SSH connection failed. You may need to:"
    echo "  1. Copy the public key to your server:"
    echo "     ssh-copy-id -i ${SSH_KEY_PATH}.pub $HOMELAB_USER@$HOMELAB_HOST"
    echo "  2. Ensure SSH is enabled on your server"
    echo "  3. Check firewall settings"
    echo ""

    CONTINUE=$(read_with_default "Continue anyway? (y/n)" "y")
    if [ "$CONTINUE" != "y" ]; then
        echo "Setup cancelled. Please fix SSH connection and try again."
        exit 1
    fi
fi

# Read SSH private key
HOMELAB_SSH_KEY=$(cat "$SSH_KEY_PATH")

# Create secrets
echo ""
echo -e "${BLUE}═══ Creating GitHub Secrets ═══${NC}"
echo ""

# Function to create or update a secret
create_secret() {
    local name=$1
    local value=$2

    echo -n "Setting secret $name... "
    if echo "$value" | gh secret set "$name" -R "$REPO" 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        echo -e "${RED}Failed to set secret $name${NC}"
        return 1
    fi
}

# Create all secrets
create_secret "HOMELAB_HOST" "$HOMELAB_HOST"
create_secret "HOMELAB_USER" "$HOMELAB_USER"
create_secret "HOMELAB_PATH" "$HOMELAB_PATH"
create_secret "HOMELAB_SSH_KEY" "$HOMELAB_SSH_KEY"

# Verify secrets
echo ""
echo -e "${BLUE}═══ Verifying Secrets ═══${NC}"
echo ""

SECRETS=$(gh secret list -R "$REPO" 2>/dev/null | awk '{print $1}')
REQUIRED_SECRETS=("HOMELAB_HOST" "HOMELAB_USER" "HOMELAB_PATH" "HOMELAB_SSH_KEY")

ALL_PRESENT=true
for secret in "${REQUIRED_SECRETS[@]}"; do
    if echo "$SECRETS" | grep -q "^$secret$"; then
        echo -e "${GREEN}✓${NC} $secret is configured"
    else
        echo -e "${RED}✗${NC} $secret is missing"
        ALL_PRESENT=false
    fi
done

# Summary
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "                         Setup Summary"
echo "════════════════════════════════════════════════════════════════"
echo ""

if [ "$ALL_PRESENT" = true ]; then
    echo -e "${GREEN}✓ All secrets configured successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Push changes to trigger deployment:"
    echo "   git add ."
    echo "   git commit -m 'feat: add automated homelab deployment'"
    echo "   git push origin main"
    echo ""
    echo "2. Or trigger manually from GitHub Actions:"
    echo "   gh workflow run deploy-homelab.yml"
    echo ""
    echo "3. Monitor the deployment:"
    echo "   gh run watch"
else
    echo -e "${RED}✗ Some secrets are missing. Please check and try again.${NC}"
    exit 1
fi

# Optional: Copy public key to server
echo ""
echo -e "${BLUE}═══ Final Steps ═══${NC}"
echo ""

if [ -f "${SSH_KEY_PATH}.pub" ]; then
    echo "Public key to add to server's ~/.ssh/authorized_keys:"
    echo ""
    cat "${SSH_KEY_PATH}.pub"
    echo ""

    COPY_KEY=$(read_with_default "Attempt to copy key to server now? (y/n)" "y")
    if [ "$COPY_KEY" = "y" ]; then
        if ssh-copy-id -i "${SSH_KEY_PATH}.pub" "$HOMELAB_USER@$HOMELAB_HOST" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} Public key copied to server"
        else
            echo -e "${YELLOW}⚠${NC} Could not copy key automatically. Please copy manually."
        fi
    fi
fi

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""