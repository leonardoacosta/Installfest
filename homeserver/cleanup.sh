#!/bin/bash

# Cleanup script for homeserver stack
# Removes all containers, networks, and optionally volumes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Detect container runtime
if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    print_error "Neither podman-compose nor docker-compose found"
    exit 1
fi

echo "Homeserver Stack Cleanup"
echo "========================"
echo ""

print_warning "This will stop and remove all containers and networks"
echo ""
read -p "Continue? (y/n): " confirm

if [[ $confirm != "y" ]]; then
    echo "Cleanup cancelled"
    exit 0
fi

# Stop and remove containers
print_warning "Stopping and removing containers..."
$COMPOSE_CMD down

# Ask about volumes
echo ""
print_warning "Do you want to delete all data volumes?"
echo "This will DELETE ALL DATA including:"
echo "  - Home Assistant configuration"
echo "  - Jellyfin library metadata"
echo "  - AdGuard settings"
echo "  - Ollama models"
echo "  - All service configurations"
echo ""
read -p "Delete volumes? (yes/no): " delete_volumes

if [[ $delete_volumes == "yes" ]]; then
    print_warning "Removing volumes..."
    $COMPOSE_CMD down -v
    print_success "Volumes removed"
else
    print_success "Volumes preserved"
fi

# Remove dangling images
echo ""
read -p "Remove unused images? (y/n): " remove_images

if [[ $remove_images == "y" ]]; then
    print_warning "Removing unused images..."
    if command -v podman &> /dev/null; then
        podman image prune -f
    else
        docker image prune -f
    fi
    print_success "Unused images removed"
fi

echo ""
print_success "Cleanup complete!"
echo ""
echo "To start fresh:"
echo "  ./start.sh wizard"
echo "  or"
echo "  podman-compose up -d"
