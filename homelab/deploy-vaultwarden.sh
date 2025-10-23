#!/bin/bash
#
# Vaultwarden Deployment Script
# This script helps you deploy Vaultwarden with proper security configuration
#

set -e  # Exit on error

homelab_DIR="/Users/leonardoacosta/Personal/Installfest/homelab"
ENV_FILE="$homelab_DIR/.env"
DATA_DIR="$homelab_DIR/vaultwarden"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}  Vaultwarden Deployment Script${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# Check if running from correct directory
if [ ! -f "$homelab_DIR/docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found in $homelab_DIR${NC}"
    exit 1
fi

cd "$homelab_DIR"

# Step 1: Check if admin token is configured
echo -e "${YELLOW}[1/6] Checking admin token configuration...${NC}"
ADMIN_TOKEN=$(grep "^VAULTWARDEN_ADMIN_TOKEN=" .env | cut -d'=' -f2)

if [ "$ADMIN_TOKEN" = "CHANGE_ME_TO_SECURE_TOKEN" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}Admin token not configured!${NC}"
    echo -e "${YELLOW}Generating secure admin token...${NC}"

    # Generate token
    NEW_TOKEN=$(openssl rand -base64 48)

    # Update .env file
    if grep -q "^VAULTWARDEN_ADMIN_TOKEN=" .env; then
        # Replace existing line
        sed -i.bak "s|^VAULTWARDEN_ADMIN_TOKEN=.*|VAULTWARDEN_ADMIN_TOKEN=$NEW_TOKEN|" .env
    else
        # Add new line
        echo "VAULTWARDEN_ADMIN_TOKEN=$NEW_TOKEN" >> .env
    fi

    echo -e "${GREEN}Admin token generated and saved to .env${NC}"
    echo -e "${YELLOW}IMPORTANT: Your admin token is:${NC}"
    echo -e "${GREEN}$NEW_TOKEN${NC}"
    echo -e "${YELLOW}Save this token securely! You'll need it to access /admin${NC}"
    echo ""
    read -p "Press Enter to continue..."
else
    echo -e "${GREEN}Admin token already configured${NC}"
fi

# Step 2: Configure domain
echo ""
echo -e "${YELLOW}[2/6] Configuring domain...${NC}"
CURRENT_DOMAIN=$(grep "^VAULTWARDEN_DOMAIN=" .env | cut -d'=' -f2)
echo -e "Current domain: ${BLUE}$CURRENT_DOMAIN${NC}"
echo ""
echo "Options:"
echo "  1) Keep current domain"
echo "  2) Use local IP (http://$(hostname -I | awk '{print $1}'):8222)"
echo "  3) Use custom domain (e.g., https://vault.yourdomain.com)"
echo ""
read -p "Choose option [1-3]: " domain_choice

case $domain_choice in
    2)
        LOCAL_IP=$(hostname -I | awk '{print $1}')
        NEW_DOMAIN="http://${LOCAL_IP}"
        sed -i.bak "s|^VAULTWARDEN_DOMAIN=.*|VAULTWARDEN_DOMAIN=$NEW_DOMAIN|" .env
        echo -e "${GREEN}Domain set to: $NEW_DOMAIN${NC}"
        ;;
    3)
        read -p "Enter your domain (e.g., https://vault.yourdomain.com): " custom_domain
        sed -i.bak "s|^VAULTWARDEN_DOMAIN=.*|VAULTWARDEN_DOMAIN=$custom_domain|" .env
        echo -e "${GREEN}Domain set to: $custom_domain${NC}"
        ;;
    *)
        echo -e "${GREEN}Keeping current domain${NC}"
        ;;
esac

# Step 3: Create data directory
echo ""
echo -e "${YELLOW}[3/6] Creating data directory...${NC}"

if [ -d "$DATA_DIR" ]; then
    echo -e "${YELLOW}Directory already exists: $DATA_DIR${NC}"
else
    mkdir -p "$DATA_DIR"
    echo -e "${GREEN}Created directory: $DATA_DIR${NC}"
fi

# Set proper permissions
PUID=$(grep "^PUID=" .env | cut -d'=' -f2)
PGID=$(grep "^PGID=" .env | cut -d'=' -f2)
PUID=${PUID:-1000}
PGID=${PGID:-1000}

chown -R ${PUID}:${PGID} "$DATA_DIR" 2>/dev/null || {
    echo -e "${YELLOW}Note: Could not set ownership (requires sudo). This is okay if running rootless Docker.${NC}"
}

chmod 755 "$DATA_DIR"
echo -e "${GREEN}Permissions set for UID:GID = ${PUID}:${PGID}${NC}"

# Step 4: Verify Docker Compose configuration
echo ""
echo -e "${YELLOW}[4/6] Verifying Docker Compose configuration...${NC}"

if docker-compose config > /dev/null 2>&1; then
    echo -e "${GREEN}Docker Compose configuration is valid${NC}"
else
    echo -e "${RED}Error: Docker Compose configuration is invalid${NC}"
    echo "Run 'docker-compose config' to see the error"
    exit 1
fi

# Step 5: Pull image
echo ""
echo -e "${YELLOW}[5/6] Pulling Vaultwarden image...${NC}"
docker-compose pull vaultwarden

# Step 6: Start Vaultwarden
echo ""
echo -e "${YELLOW}[6/6] Starting Vaultwarden...${NC}"
docker-compose up -d vaultwarden

# Wait for container to be healthy
echo ""
echo -e "${YELLOW}Waiting for Vaultwarden to become healthy...${NC}"
for i in {1..30}; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' vaultwarden 2>/dev/null || echo "starting")

    if [ "$HEALTH" = "healthy" ]; then
        echo -e "${GREEN}Vaultwarden is healthy!${NC}"
        break
    elif [ "$HEALTH" = "unhealthy" ]; then
        echo -e "${RED}Vaultwarden is unhealthy. Check logs with: docker-compose logs vaultwarden${NC}"
        exit 1
    fi

    echo -n "."
    sleep 2
done

# Display summary
echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Vaultwarden Deployed Successfully!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""

# Get access URLs
DOMAIN=$(grep "^VAULTWARDEN_DOMAIN=" .env | cut -d'=' -f2)
LOCAL_IP=$(hostname -I | awk '{print $1}')
ADMIN_TOKEN=$(grep "^VAULTWARDEN_ADMIN_TOKEN=" .env | cut -d'=' -f2)

echo -e "${BLUE}Access Information:${NC}"
echo -e "  Web Vault (local):  http://${LOCAL_IP}:8222"
echo -e "  Web Vault (config): ${DOMAIN}"
echo -e "  Admin Panel:        http://${LOCAL_IP}:8222/admin"
echo -e "  Health Check:       http://${LOCAL_IP}:8222/alive"
echo ""

echo -e "${BLUE}Network Configuration:${NC}"
echo -e "  Container IP:       172.20.0.22"
echo -e "  Network:            homelab"
echo -e "  Web Port:           8222"
echo -e "  WebSocket Port:     3012"
echo ""

echo -e "${BLUE}Admin Token:${NC}"
echo -e "  ${YELLOW}$ADMIN_TOKEN${NC}"
echo -e "  ${RED}SAVE THIS TOKEN SECURELY!${NC}"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Open web vault: http://${LOCAL_IP}:8222"
echo "  2. Create your first user account"
echo "  3. After creating accounts, disable signups:"
echo "     - Edit .env: VAULTWARDEN_SIGNUPS_ALLOWED=false"
echo "     - Restart: docker-compose restart vaultwarden"
echo "  4. Configure SSL with Nginx Proxy Manager (see VAULTWARDEN_SETUP.md)"
echo "  5. Install Bitwarden clients (browser extension, mobile app)"
echo ""

echo -e "${BLUE}Documentation:${NC}"
echo "  Full setup guide: $homelab_DIR/VAULTWARDEN_SETUP.md"
echo ""

echo -e "${BLUE}Useful Commands:${NC}"
echo "  View logs:     docker-compose logs -f vaultwarden"
echo "  Check status:  docker ps | grep vaultwarden"
echo "  Restart:       docker-compose restart vaultwarden"
echo "  Stop:          docker-compose stop vaultwarden"
echo ""

echo -e "${YELLOW}Security Reminder:${NC}"
echo -e "  ${RED}1. Use a STRONG master password (20+ characters)${NC}"
echo -e "  ${RED}2. Enable 2FA after creating your account${NC}"
echo -e "  ${RED}3. Disable signups after creating accounts${NC}"
echo -e "  ${RED}4. Set up automated backups${NC}"
echo -e "  ${RED}5. Configure SSL for external access${NC}"
echo ""

# Show logs
echo -e "${BLUE}Recent logs:${NC}"
docker-compose logs --tail=20 vaultwarden

echo ""
echo -e "${GREEN}Deployment complete! 🔐${NC}"
