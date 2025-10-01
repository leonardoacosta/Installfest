#!/bin/bash

# Clean Restart Script
# Properly stops all containers and starts fresh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Detect container runtime
if command -v podman-compose &> /dev/null; then
    COMPOSE_CMD="podman-compose"
    RUNTIME="podman"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    RUNTIME="docker"
else
    print_error "Neither podman-compose nor docker-compose found"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   Homeserver Clean Restart Script     ║"
echo "╔════════════════════════════════════════╗"
echo ""

print_info "Using: $COMPOSE_CMD"
echo ""

# Step 1: Stop all containers via compose
print_warning "Step 1: Stopping containers via compose..."
$COMPOSE_CMD down 2>&1 | grep -v "no container" || true
print_success "Compose down complete"

# Step 2: Force stop any remaining containers
echo ""
print_warning "Step 2: Checking for lingering containers..."
if [ "$RUNTIME" = "podman" ]; then
    RUNNING=$(podman ps -q 2>/dev/null || true)
    if [ -n "$RUNNING" ]; then
        print_info "Stopping $(echo "$RUNNING" | wc -l) running containers..."
        echo "$RUNNING" | xargs podman stop 2>/dev/null || true
        print_success "Stopped remaining containers"
    else
        print_info "No running containers found"
    fi
else
    RUNNING=$(docker ps -q 2>/dev/null || true)
    if [ -n "$RUNNING" ]; then
        print_info "Stopping $(echo "$RUNNING" | wc -l) running containers..."
        echo "$RUNNING" | xargs docker stop 2>/dev/null || true
        print_success "Stopped remaining containers"
    else
        print_info "No running containers found"
    fi
fi

# Step 3: Remove all containers (keeps volumes/data)
echo ""
print_warning "Step 3: Removing old containers..."
if [ "$RUNTIME" = "podman" ]; then
    ALL_CONTAINERS=$(podman ps -a -q 2>/dev/null || true)
    if [ -n "$ALL_CONTAINERS" ]; then
        print_info "Removing $(echo "$ALL_CONTAINERS" | wc -l) containers..."
        echo "$ALL_CONTAINERS" | xargs podman rm -f 2>/dev/null || true
        print_success "Removed old containers"
    else
        print_info "No containers to remove"
    fi
else
    ALL_CONTAINERS=$(docker ps -a -q 2>/dev/null || true)
    if [ -n "$ALL_CONTAINERS" ]; then
        print_info "Removing $(echo "$ALL_CONTAINERS" | wc -l) containers..."
        echo "$ALL_CONTAINERS" | xargs docker rm -f 2>/dev/null || true
        print_success "Removed old containers"
    else
        print_info "No containers to remove"
    fi
fi

# Step 4: Verify ports are free
echo ""
print_info "Step 4: Checking port availability..."
PORTS_TO_CHECK="5353 3080 8123 8096 1445"
PORTS_IN_USE=""

for port in $PORTS_TO_CHECK; do
    if lsof -i :$port >/dev/null 2>&1 || ss -tuln 2>/dev/null | grep -q ":$port "; then
        PORTS_IN_USE="$PORTS_IN_USE $port"
    fi
done

if [ -n "$PORTS_IN_USE" ]; then
    print_warning "Ports still in use:$PORTS_IN_USE"
    print_info "Waiting 3 seconds for ports to free up..."
    sleep 3
else
    print_success "All required ports are available"
fi

# Step 5: Start services
echo ""
print_warning "Step 5: Starting services..."
$COMPOSE_CMD up -d

# Step 6: Show status
echo ""
print_info "Step 6: Checking service status..."
sleep 2
$COMPOSE_CMD ps

echo ""
print_success "Clean restart complete!"
echo ""
print_info "Access your services:"
echo "  - Home Assistant: http://localhost:8123"
echo "  - AdGuard Setup:  http://localhost:3000"
echo "  - AdGuard Web:    http://localhost:3080"
echo "  - Jellyfin:       http://localhost:8096"
echo "  - Ollama WebUI:   http://localhost:8081"
echo "  - Samba:          smb://localhost:1445"
echo ""
print_info "View logs: $COMPOSE_CMD logs -f"
echo ""
