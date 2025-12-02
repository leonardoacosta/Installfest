#!/bin/bash
# Generate Coolify environment variables
# Run this script to generate secure credentials for Coolify

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/../.env"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Coolify Environment Variable Generator${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Warning: .env file not found at $ENV_FILE${NC}"
    echo "Creating from .env.example..."
    cp "$SCRIPT_DIR/../.env.example" "$ENV_FILE"
fi

# Generate values
echo -e "${GREEN}Generating secure credentials...${NC}"
echo ""

COOLIFY_APP_ID=$(openssl rand -hex 16)
COOLIFY_APP_KEY="base64:$(openssl rand -base64 32)"
COOLIFY_DB_PASSWORD=$(openssl rand -base64 32)
COOLIFY_REDIS_PASSWORD=$(openssl rand -base64 32)
COOLIFY_PUSHER_APP_ID=$(openssl rand -hex 16)
COOLIFY_PUSHER_APP_KEY=$(openssl rand -hex 32)
COOLIFY_PUSHER_APP_SECRET=$(openssl rand -hex 32)

# Display generated values
echo "Generated values:"
echo "----------------------------------------"
echo "COOLIFY_APP_ID=$COOLIFY_APP_ID"
echo "COOLIFY_APP_KEY=$COOLIFY_APP_KEY"
echo "COOLIFY_DB_PASSWORD=$COOLIFY_DB_PASSWORD"
echo "COOLIFY_REDIS_PASSWORD=$COOLIFY_REDIS_PASSWORD"
echo "COOLIFY_PUSHER_APP_ID=$COOLIFY_PUSHER_APP_ID"
echo "COOLIFY_PUSHER_APP_KEY=$COOLIFY_PUSHER_APP_KEY"
echo "COOLIFY_PUSHER_APP_SECRET=$COOLIFY_PUSHER_APP_SECRET"
echo "----------------------------------------"
echo ""

# Ask if user wants to update .env
read -p "Update .env file with these values? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if Coolify variables already exist
    if grep -q "COOLIFY_APP_ID=" "$ENV_FILE"; then
        echo -e "${YELLOW}Coolify variables already exist in .env${NC}"
        read -p "Overwrite existing values? (y/n): " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Update existing values
            sed -i.bak "s|^COOLIFY_APP_ID=.*|COOLIFY_APP_ID=$COOLIFY_APP_ID|" "$ENV_FILE"
            sed -i.bak "s|^COOLIFY_APP_KEY=.*|COOLIFY_APP_KEY=$COOLIFY_APP_KEY|" "$ENV_FILE"
            sed -i.bak "s|^COOLIFY_DB_PASSWORD=.*|COOLIFY_DB_PASSWORD=$COOLIFY_DB_PASSWORD|" "$ENV_FILE"
            sed -i.bak "s|^COOLIFY_REDIS_PASSWORD=.*|COOLIFY_REDIS_PASSWORD=$COOLIFY_REDIS_PASSWORD|" "$ENV_FILE"
            sed -i.bak "s|^COOLIFY_PUSHER_APP_ID=.*|COOLIFY_PUSHER_APP_ID=$COOLIFY_PUSHER_APP_ID|" "$ENV_FILE"
            sed -i.bak "s|^COOLIFY_PUSHER_APP_KEY=.*|COOLIFY_PUSHER_APP_KEY=$COOLIFY_PUSHER_APP_KEY|" "$ENV_FILE"
            sed -i.bak "s|^COOLIFY_PUSHER_APP_SECRET=.*|COOLIFY_PUSHER_APP_SECRET=$COOLIFY_PUSHER_APP_SECRET|" "$ENV_FILE"
            rm "$ENV_FILE.bak"
            echo -e "${GREEN}✓ Updated existing Coolify variables in .env${NC}"
        else
            echo "Keeping existing values"
        fi
    else
        # Append new values
        echo "" >> "$ENV_FILE"
        echo "# Coolify - Generated $(date)" >> "$ENV_FILE"
        echo "COOLIFY_APP_ID=$COOLIFY_APP_ID" >> "$ENV_FILE"
        echo "COOLIFY_APP_KEY=$COOLIFY_APP_KEY" >> "$ENV_FILE"
        echo "COOLIFY_APP_URL=http://coolify.local" >> "$ENV_FILE"
        echo "COOLIFY_DB_PASSWORD=$COOLIFY_DB_PASSWORD" >> "$ENV_FILE"
        echo "COOLIFY_REDIS_PASSWORD=$COOLIFY_REDIS_PASSWORD" >> "$ENV_FILE"
        echo "COOLIFY_PUSHER_APP_ID=$COOLIFY_PUSHER_APP_ID" >> "$ENV_FILE"
        echo "COOLIFY_PUSHER_APP_KEY=$COOLIFY_PUSHER_APP_KEY" >> "$ENV_FILE"
        echo "COOLIFY_PUSHER_APP_SECRET=$COOLIFY_PUSHER_APP_SECRET" >> "$ENV_FILE"
        echo -e "${GREEN}✓ Added Coolify variables to .env${NC}"
    fi

    echo ""
    echo -e "${GREEN}Configuration complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review COOLIFY_APP_URL in .env (set your domain if needed)"
    echo "2. Deploy Coolify: docker compose up -d coolify"
    echo "3. Access at http://<server-ip>:8000"
    echo "4. Create your admin account"
else
    echo "Values not saved. Copy them manually if needed."
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
