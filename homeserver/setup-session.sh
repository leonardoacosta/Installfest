#!/bin/bash

# Session Setup Script for Rootless Podman
# Run this if you get DBUS or XDG_RUNTIME_DIR errors

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "Podman Session Setup"
echo "===================="
echo ""

# Check if we're in a proper login session
if [ -n "$XDG_RUNTIME_DIR" ] && [ -n "$DBUS_SESSION_BUS_ADDRESS" ]; then
    print_success "Session environment is already configured"
    echo "  XDG_RUNTIME_DIR: $XDG_RUNTIME_DIR"
    echo "  DBUS_SESSION_BUS_ADDRESS: $DBUS_SESSION_BUS_ADDRESS"
    exit 0
fi

print_warning "Session environment not configured"
echo ""

# Set XDG_RUNTIME_DIR
if [ -z "$XDG_RUNTIME_DIR" ]; then
    export XDG_RUNTIME_DIR="/run/user/$(id -u)"
    print_info "Set XDG_RUNTIME_DIR=$XDG_RUNTIME_DIR"

    # Create if doesn't exist
    if [ ! -d "$XDG_RUNTIME_DIR" ]; then
        sudo mkdir -p "$XDG_RUNTIME_DIR"
        sudo chown $USER:$USER "$XDG_RUNTIME_DIR"
        sudo chmod 0700 "$XDG_RUNTIME_DIR"
        print_info "Created $XDG_RUNTIME_DIR"
    fi
fi

# Set DBUS_SESSION_BUS_ADDRESS
if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]; then
    # Try to find existing session bus
    if [ -S "$XDG_RUNTIME_DIR/bus" ]; then
        export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"
        print_info "Found existing session bus at $XDG_RUNTIME_DIR/bus"
    else
        print_warning "No session bus found"
        print_info "You may need to log in via a regular shell session"
    fi
fi

echo ""
print_info "Add these to your shell profile (~/.bashrc or ~/.zshrc):"
echo ""
echo "# Rootless Podman session setup"
echo "export XDG_RUNTIME_DIR=\"/run/user/\$(id -u)\""
echo "[ -S \"\$XDG_RUNTIME_DIR/bus\" ] && export DBUS_SESSION_BUS_ADDRESS=\"unix:path=\$XDG_RUNTIME_DIR/bus\""
echo ""

print_info "Or source this script in your current session:"
echo "  source ./setup-session.sh"
echo ""

# Enable lingering if not already enabled
if ! loginctl show-user $USER | grep -q "Linger=yes"; then
    print_warning "User lingering not enabled"
    print_info "Enabling lingering (allows services to run after logout)..."
    sudo loginctl enable-linger $USER
    print_success "Lingering enabled"
fi

# Test if podman works
echo ""
print_info "Testing Podman..."
if podman ps >/dev/null 2>&1; then
    print_success "Podman is working!"
else
    print_warning "Podman test failed, but this might be OK"
    print_info "Try running: podman ps"
fi

echo ""
print_success "Session setup complete"
print_info "You can now run: podman-compose up -d"
