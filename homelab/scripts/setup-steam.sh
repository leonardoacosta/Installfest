#!/usr/bin/env bash
# Steam Headless Setup Script
# Installs and configures Steam for Remote Play without GUI

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $*"; }
success() { echo -e "${GREEN}✓${NC} $*"; }
error() { echo -e "${RED}✖${NC} $*"; }
warning() { echo -e "${YELLOW}⚠${NC} $*"; }

# Configuration
STEAM_USER="${STEAM_USER:-$USER}"
STEAM_DIR="$HOME/.steam"
SERVICE_FILE="/etc/systemd/system/steam-headless.service"

main() {
    log "=========================================="
    log "Steam Headless Setup"
    log "=========================================="
    echo ""

    # 1. Check if Steam is installed
    if ! command -v steam &> /dev/null; then
        error "Steam is not installed!"
        log "Steam should be installed via archinstall during USB boot."
        log "To install manually: sudo pacman -S steam"
        exit 1
    fi
    success "Steam is installed"

    # 2. Check multilib repository
    if ! grep -q "^\[multilib\]" /etc/pacman.conf; then
        warning "Multilib repository not enabled"
        log "Enabling multilib repository..."

        sudo bash -c 'cat >> /etc/pacman.conf << EOF

[multilib]
Include = /etc/pacman.d/mirrorlist
EOF'

        sudo pacman -Sy
        success "Multilib repository enabled"
    else
        success "Multilib repository already enabled"
    fi

    # 3. Create Steam directories
    log "Creating Steam directories..."
    mkdir -p "$STEAM_DIR"
    mkdir -p "$HOME/.local/share/Steam"
    success "Steam directories created"

    # 4. Create systemd service for headless Steam
    log "Creating systemd service..."

    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Steam Headless (Remote Play)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$STEAM_USER
Environment="HOME=/home/$STEAM_USER"
Environment="DISPLAY=:0"
ExecStartPre=/bin/sleep 5
ExecStart=/usr/bin/steam -console -noreactlogin -nofriendsui -no-browser
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    success "Systemd service created"

    # 5. Enable and start service
    log "Enabling Steam service..."
    sudo systemctl daemon-reload
    sudo systemctl enable steam-headless.service
    success "Steam service enabled"

    # 6. Configure firewall for Remote Play
    log "Configuring firewall for Steam Remote Play..."

    # Steam Remote Play ports
    STEAM_PORTS=(
        "27031:27036/udp"  # Steam Remote Play discovery
        "27036/tcp"        # Steam Remote Play streaming
        "27037/tcp"        # Steam Remote Play
    )

    if command -v ufw &> /dev/null; then
        for port in "${STEAM_PORTS[@]}"; do
            sudo ufw allow "$port" comment "Steam Remote Play" 2>/dev/null || true
        done
        success "Firewall rules added (UFW)"
    else
        warning "UFW not installed, skipping firewall configuration"
        log "You may need to manually configure firewall rules"
    fi

    # 7. First-time login instructions
    echo ""
    success "=========================================="
    success "Steam Headless Setup Complete!"
    success "=========================================="
    echo ""
    warning "⚠️  IMPORTANT: First-Time Login Required"
    echo ""
    log "Steam requires manual login on first run:"
    log "  1. Start Steam service:"
    log "     sudo systemctl start steam-headless.service"
    log ""
    log "  2. Monitor Steam logs:"
    log "     sudo journalctl -u steam-headless.service -f"
    log ""
    log "  3. You'll see a login prompt in the logs"
    log "  4. If Steam Guard is enabled, you'll need the code"
    log ""
    log "  5. After successful login, credentials are saved"
    log "  6. Future reboots will auto-login"
    echo ""
    log "Steam Remote Play Configuration:"
    log "  • Enable Remote Play in Steam settings (via Steam Link app)"
    log "  • Your server will be discoverable on the local network"
    log "  • Use Steam Link on mobile/TV to connect"
    echo ""
    log "Service Management:"
    log "  Start:   sudo systemctl start steam-headless.service"
    log "  Stop:    sudo systemctl stop steam-headless.service"
    log "  Status:  sudo systemctl status steam-headless.service"
    log "  Logs:    sudo journalctl -u steam-headless.service -f"
    echo ""
    success "=========================================="
    echo ""

    # 8. Offer to start now
    read -p "Start Steam service now? (y/N): " START_NOW
    if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
        log "Starting Steam service..."
        sudo systemctl start steam-headless.service
        sleep 2
        log "Steam status:"
        sudo systemctl status steam-headless.service --no-pager || true
        echo ""
        log "Monitor logs with: sudo journalctl -u steam-headless.service -f"
    else
        log "Steam service not started. Start manually when ready."
    fi
}

# Error handler
trap 'error "Setup failed!"; exit 1' ERR

# Run main
main "$@"
