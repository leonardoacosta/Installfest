#!/bin/bash

# Script to generate Traefik dashboard password hash
# Usage: ./generate-password.sh username password

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if htpasswd is installed
if ! command -v htpasswd &> /dev/null; then
    echo -e "${RED}Error: htpasswd is not installed${NC}"
    echo "Install it with: sudo apt-get install apache2-utils"
    exit 1
fi

# Get username and password
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 username password"
    echo "Example: $0 admin MySecurePassword123"
    exit 1
fi

USERNAME="$1"
PASSWORD="$2"

# Generate password hash
echo -e "${YELLOW}Generating password hash for user: ${USERNAME}${NC}"

# Generate hash and escape for docker-compose
HASH=$(htpasswd -nb "$USERNAME" "$PASSWORD" | sed -e 's/\$/\$\$/g')

echo -e "${GREEN}Success! Use this in your middlewares.yml:${NC}"
echo ""
echo "dashboard-auth:"
echo "  basicAuth:"
echo "    users:"
echo "      - \"${HASH}\""
echo ""
echo -e "${YELLOW}Steps to apply:${NC}"
echo "1. Edit traefik/dynamic/middlewares.yml"
echo "2. Replace the users line under 'dashboard-auth' with the line above"
echo "3. Save the file"
echo "4. Traefik will automatically reload (no restart needed!)"
echo ""
echo -e "${GREEN}You can also save this to a file:${NC}"
echo "$0 $USERNAME $PASSWORD > password-hash.txt"
