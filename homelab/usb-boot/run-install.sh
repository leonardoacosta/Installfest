#!/usr/bin/env bash
# USB Boot Installation Orchestrator
# Run this script from the Arch ISO live environment to kick off automated install

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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHINSTALL_CONFIG="$SCRIPT_DIR/archinstall-config.json"
BOOTSTRAP_SCRIPT="$SCRIPT_DIR/homelab-bootstrap.sh"
SYSTEMD_SERVICE="$SCRIPT_DIR/systemd/homelab-bootstrap.service"
SECRETS_FILE="$SCRIPT_DIR/homelab-secrets.env.gpg"

# Detect target user from config or prompt
TARGET_USER="${1:-leo}"

# Main execution
main() {
    log "=========================================="
    log "Homelab Automated Installation"
    log "=========================================="
    echo ""

    # 1. Verify we're in live environment
    if [ ! -f /etc/arch-release ]; then
        error "This script must be run from Arch ISO live environment"
        exit 1
    fi

    if [ "$(whoami)" != "root" ]; then
        error "This script must be run as root in the live environment"
        error "Try: sudo bash $0"
        exit 1
    fi

    success "Running in Arch ISO live environment"

    # 2. Check files exist
    log "Checking required files..."

    if [ ! -f "$ARCHINSTALL_CONFIG" ]; then
        error "archinstall config not found: $ARCHINSTALL_CONFIG"
        exit 1
    fi
    success "archinstall config found"

    if [ ! -f "$BOOTSTRAP_SCRIPT" ]; then
        error "Bootstrap script not found: $BOOTSTRAP_SCRIPT"
        exit 1
    fi
    success "Bootstrap script found"

    if [ ! -f "$SYSTEMD_SERVICE" ]; then
        error "Systemd service not found: $SYSTEMD_SERVICE"
        exit 1
    fi
    success "Systemd service found"

    if [ ! -f "$SECRETS_FILE" ]; then
        warning "Secrets file not found: $SECRETS_FILE"
        warning "Bootstrap will prompt for secrets location"
    else
        success "Secrets file found"
    fi

    # 3. Show disk selection
    echo ""
    log "Available disks:"
    lsblk -d -o NAME,SIZE,TYPE | grep disk
    echo ""
    warning "The installation will WIPE the selected disk!"
    echo ""
    read -p "Enter target disk (e.g., sda, nvme0n1): " TARGET_DISK

    if [ -z "$TARGET_DISK" ]; then
        error "No disk specified"
        exit 1
    fi

    if [ ! -b "/dev/$TARGET_DISK" ]; then
        error "Disk /dev/$TARGET_DISK not found"
        exit 1
    fi

    # 4. Update archinstall config with selected disk
    log "Updating archinstall config with target disk /dev/$TARGET_DISK..."

    # Create temporary config with correct disk
    TEMP_CONFIG="/tmp/archinstall-config.json"
    sed "s|/dev/sda|/dev/$TARGET_DISK|g" "$ARCHINSTALL_CONFIG" > "$TEMP_CONFIG"
    success "Config updated"

    # 5. Confirm installation
    echo ""
    warning "═══════════════════════════════════════════"
    warning "  FINAL CONFIRMATION"
    warning "═══════════════════════════════════════════"
    warning "This will:"
    warning "  • ERASE ALL DATA on /dev/$TARGET_DISK"
    warning "  • Install Arch Linux"
    warning "  • Create user: $TARGET_USER"
    warning "  • Install Docker, Steam, Bluetooth packages"
    warning "  • Set up automatic homelab deployment"
    warning "═══════════════════════════════════════════"
    echo ""
    read -p "Type 'YES' to proceed: " CONFIRM

    if [ "$CONFIRM" != "YES" ]; then
        error "Installation cancelled"
        exit 0
    fi

    # 6. Ensure network connectivity
    log "Checking network connectivity..."
    if ! ping -c 1 archlinux.org &> /dev/null; then
        error "No internet connection!"
        error "Configure network first (wifi-menu or dhcpcd)"
        exit 1
    fi
    success "Network connectivity verified"

    # 7. Update archinstall (get latest version)
    log "Updating archinstall..."
    pacman -Sy --noconfirm archinstall || warning "Failed to update archinstall, using existing version"

    # 8. Run archinstall with our config
    log "Starting archinstall (this may take 10-30 minutes)..."
    echo ""

    if ! archinstall --config "$TEMP_CONFIG" --silent; then
        error "archinstall failed!"
        error "Check the logs above for details"
        exit 1
    fi

    success "Base system installation completed!"

    # 9. Mount the new installation
    log "Mounting new installation..."
    MOUNT_POINT="/mnt"

    # archinstall should have already mounted to /mnt, verify
    if ! mountpoint -q "$MOUNT_POINT"; then
        error "New system not mounted at $MOUNT_POINT"
        error "Manual intervention required"
        exit 1
    fi
    success "New system mounted"

    # 10. Copy bootstrap files to new system
    log "Installing bootstrap files to new system..."

    # Copy bootstrap script to user's home
    mkdir -p "$MOUNT_POINT/home/$TARGET_USER"
    cp "$BOOTSTRAP_SCRIPT" "$MOUNT_POINT/home/$TARGET_USER/homelab-bootstrap.sh"
    chmod +x "$MOUNT_POINT/home/$TARGET_USER/homelab-bootstrap.sh"

    # Set ownership (get UID/GID from new system's /etc/passwd)
    TARGET_UID=$(grep "^$TARGET_USER:" "$MOUNT_POINT/etc/passwd" | cut -d: -f3)
    TARGET_GID=$(grep "^$TARGET_USER:" "$MOUNT_POINT/etc/passwd" | cut -d: -f4)

    if [ -n "$TARGET_UID" ] && [ -n "$TARGET_GID" ]; then
        chown "$TARGET_UID:$TARGET_GID" "$MOUNT_POINT/home/$TARGET_USER/homelab-bootstrap.sh"
        success "Bootstrap script installed for $TARGET_USER"
    else
        warning "Could not determine UID/GID for $TARGET_USER, using root ownership"
    fi

    # Copy systemd service
    cp "$SYSTEMD_SERVICE" "$MOUNT_POINT/etc/systemd/system/homelab-bootstrap.service"

    # Update service file with actual username
    sed -i "s|User=%i|User=$TARGET_USER|g" "$MOUNT_POINT/etc/systemd/system/homelab-bootstrap.service"
    sed -i "s|ExecStart=/bin/bash /home/%i/|ExecStart=/bin/bash /home/$TARGET_USER/|g" "$MOUNT_POINT/etc/systemd/system/homelab-bootstrap.service"

    success "Systemd service installed"

    # Enable the service
    arch-chroot "$MOUNT_POINT" systemctl enable homelab-bootstrap.service || warning "Failed to enable service"

    # Copy secrets file if it exists
    if [ -f "$SECRETS_FILE" ]; then
        cp "$SECRETS_FILE" "$MOUNT_POINT/home/$TARGET_USER/homelab-secrets.env.gpg"
        chown "$TARGET_UID:$TARGET_GID" "$MOUNT_POINT/home/$TARGET_USER/homelab-secrets.env.gpg" 2>/dev/null || true
        success "Secrets file copied"
    fi

    # 11. Final instructions
    echo ""
    success "═══════════════════════════════════════════"
    success "  INSTALLATION COMPLETE!"
    success "═══════════════════════════════════════════"
    echo ""
    log "Next steps:"
    log "  1. Remove the USB drive"
    log "  2. Type: reboot"
    log "  3. On first boot, the system will:"
    log "     • Prompt for GPG passphrase to decrypt secrets"
    log "     • Clone the Installfest repository"
    log "     • Deploy all homelab services automatically"
    log "  4. This process takes ~10-15 minutes"
    echo ""
    log "After reboot, check progress with:"
    log "  journalctl -u homelab-bootstrap.service -f"
    echo ""
    success "═══════════════════════════════════════════"
    echo ""

    read -p "Press ENTER to reboot now, or Ctrl+C to stay in live environment: "
    reboot
}

# Run main
main "$@"
