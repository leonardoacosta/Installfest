#!/usr/bin/env bash
# USB Bootable Drive Creation Script
# Creates a bootable USB drive with Arch ISO and homelab automation files

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
WORK_DIR="/tmp/homelab-usb-creation"
ARCH_ISO_URL="https://mirror.pkgbuild.com/iso/latest/"
ISO_NAME="archlinux-x86_64.iso"
USB_LABEL="HOMELAB_USB"

# Main execution
main() {
    log "=========================================="
    log "Homelab USB Creation Tool"
    log "=========================================="
    echo ""

    # 1. Check we're root
    if [ "$(whoami)" != "root" ]; then
        error "This script must be run as root"
        error "Try: sudo bash $0"
        exit 1
    fi

    # 2. Check required tools
    log "Checking required tools..."
    for cmd in wget gpg dd lsblk; do
        if ! command -v $cmd &> /dev/null; then
            error "Required command not found: $cmd"
            exit 1
        fi
    done
    success "All required tools found"

    # 3. Check secrets file exists
    if [ ! -f "$SCRIPT_DIR/../.homelab-secrets.env" ]; then
        warning "Secrets file not found: $SCRIPT_DIR/../.homelab-secrets.env"
        echo ""
        log "You need to create your secrets file first:"
        log "  1. Copy the example: cp homelab/.homelab-secrets.env.example homelab/.homelab-secrets.env"
        log "  2. Edit the file and fill in all values"
        log "  3. Run this script again"
        exit 1
    fi
    success "Secrets file found"

    # 4. Encrypt secrets if not already encrypted
    ENCRYPTED_SECRETS="$SCRIPT_DIR/homelab-secrets.env.gpg"
    if [ ! -f "$ENCRYPTED_SECRETS" ]; then
        log "Encrypting secrets file..."
        echo ""
        warning "You will be prompted to create a passphrase for encryption"
        warning "Remember this passphrase - you'll need it on first boot!"
        echo ""

        if ! gpg --symmetric --cipher-algo AES256 --output "$ENCRYPTED_SECRETS" "$SCRIPT_DIR/../.homelab-secrets.env"; then
            error "Failed to encrypt secrets file"
            exit 1
        fi
        success "Secrets encrypted: $ENCRYPTED_SECRETS"
    else
        success "Using existing encrypted secrets: $ENCRYPTED_SECRETS"
    fi

    # 5. Create working directory
    mkdir -p "$WORK_DIR"
    cd "$WORK_DIR"

    # 6. Download Arch ISO if needed
    if [ ! -f "$WORK_DIR/$ISO_NAME" ]; then
        log "Downloading latest Arch Linux ISO..."
        log "This may take several minutes..."

        # Get the exact ISO filename from the latest directory
        LATEST_ISO=$(wget -q -O - "$ARCH_ISO_URL" | grep -o 'archlinux-[0-9.]\+-x86_64.iso' | head -1)

        if [ -z "$LATEST_ISO" ]; then
            error "Could not determine latest ISO filename"
            exit 1
        fi

        if ! wget "${ARCH_ISO_URL}${LATEST_ISO}" -O "$ISO_NAME"; then
            error "Failed to download Arch ISO"
            exit 1
        fi

        # Download checksum
        wget "${ARCH_ISO_URL}sha256sums.txt" -O sha256sums.txt

        # Verify checksum
        log "Verifying ISO checksum..."
        if ! sha256sum --ignore-missing -c sha256sums.txt; then
            error "ISO checksum verification failed!"
            exit 1
        fi
        success "ISO downloaded and verified"
    else
        success "Using existing ISO: $ISO_NAME"
    fi

    # 7. Show available USB drives
    echo ""
    log "Available USB drives:"
    lsblk -d -o NAME,SIZE,TYPE,TRAN | grep usb || true
    echo ""

    warning "⚠️  WARNING: The selected drive will be COMPLETELY ERASED! ⚠️"
    echo ""
    read -p "Enter USB device name (e.g., sdb, sdc): " USB_DEVICE

    if [ -z "$USB_DEVICE" ]; then
        error "No device specified"
        exit 1
    fi

    USB_DEV="/dev/$USB_DEVICE"

    if [ ! -b "$USB_DEV" ]; then
        error "Device $USB_DEV not found"
        exit 1
    fi

    # 8. Final confirmation
    echo ""
    warning "═══════════════════════════════════════════"
    warning "  FINAL CONFIRMATION"
    warning "═══════════════════════════════════════════"
    warning "This will ERASE ALL DATA on: $USB_DEV"
    lsblk "$USB_DEV"
    warning "═══════════════════════════════════════════"
    echo ""
    read -p "Type 'YES' to proceed: " CONFIRM

    if [ "$CONFIRM" != "YES" ]; then
        error "Operation cancelled"
        exit 0
    fi

    # 9. Unmount any existing partitions
    log "Unmounting any existing partitions..."
    umount "${USB_DEV}"* 2>/dev/null || true
    success "Device unmounted"

    # 10. Write ISO to USB
    log "Writing Arch ISO to USB device..."
    log "This will take several minutes..."

    if ! dd if="$ISO_NAME" of="$USB_DEV" bs=4M status=progress oflag=sync; then
        error "Failed to write ISO to USB"
        exit 1
    fi
    sync
    success "ISO written to USB"

    # 11. Wait for kernel to recognize partitions
    sleep 2
    partprobe "$USB_DEV" 2>/dev/null || true
    sleep 2

    # 12. Mount the USB (should have 2 partitions now)
    log "Mounting USB partitions..."

    # Find the data partition (usually partition 2)
    USB_PARTITION="${USB_DEV}2"

    if [ ! -b "$USB_PARTITION" ]; then
        # Try alternative naming (for nvme, mmc devices)
        USB_PARTITION="${USB_DEV}p2"
    fi

    if [ ! -b "$USB_PARTITION" ]; then
        error "Could not find data partition"
        error "Expected: $USB_PARTITION"
        exit 1
    fi

    MOUNT_POINT="/mnt/homelab-usb"
    mkdir -p "$MOUNT_POINT"

    if ! mount "$USB_PARTITION" "$MOUNT_POINT"; then
        error "Failed to mount USB partition"
        exit 1
    fi
    success "USB mounted at $MOUNT_POINT"

    # 13. Copy homelab automation files
    log "Copying homelab automation files..."

    mkdir -p "$MOUNT_POINT/homelab-usb"

    # Copy all files from usb-boot directory
    cp -r "$SCRIPT_DIR"/* "$MOUNT_POINT/homelab-usb/"

    # Ensure execute permissions
    chmod +x "$MOUNT_POINT/homelab-usb/run-install.sh"
    chmod +x "$MOUNT_POINT/homelab-usb/homelab-bootstrap.sh"

    success "Automation files copied"

    # Copy optional configuration files
    log "Copying optional configuration files..."

    # Copy Bluetooth devices config if it exists
    BLUETOOTH_CONFIG="$SCRIPT_DIR/../config/bluetooth-devices.yml"
    if [ -f "$BLUETOOTH_CONFIG" ]; then
        cp "$BLUETOOTH_CONFIG" "$MOUNT_POINT/homelab-usb/bluetooth-devices.yml"
        success "Bluetooth configuration copied"
    else
        warning "Bluetooth config not found (optional): $BLUETOOTH_CONFIG"
        log "To enable Bluetooth auto-pairing:"
        log "  1. Create homelab/config/bluetooth-devices.yml from example"
        log "  2. Re-run this script to include it on USB"
    fi

    # 14. Create README
    cat > "$MOUNT_POINT/homelab-usb/README.txt" << 'EOF'
HOMELAB AUTOMATED INSTALLATION USB
===================================

BOOT INSTRUCTIONS:
1. Insert this USB and boot from it
2. When you reach the Arch live environment prompt, run:

   sudo bash /run/archiso/bootmnt/homelab-usb/run-install.sh

3. Follow the prompts to select target disk
4. The installation will proceed automatically
5. After reboot, homelab services will deploy automatically

IMPORTANT:
- You will need the GPG passphrase you created when making this USB
- Have your network configured (WiFi or Ethernet)
- The target disk will be COMPLETELY ERASED

For more information, see the Installfest repository:
https://github.com/leonardoacosta/Installfest
EOF

    success "README created"

    # 15. Unmount and cleanup
    log "Finalizing USB..."
    umount "$MOUNT_POINT"
    rmdir "$MOUNT_POINT"
    success "USB unmounted"

    # 16. Success message
    echo ""
    success "═══════════════════════════════════════════"
    success "  USB CREATION COMPLETE!"
    success "═══════════════════════════════════════════"
    echo ""
    log "Your bootable homelab USB is ready!"
    echo ""
    log "To use it:"
    log "  1. Insert USB and boot from it"
    log "  2. At the Arch live prompt, run:"
    log "     sudo bash /run/archiso/bootmnt/homelab-usb/run-install.sh"
    log "  3. Follow the installation prompts"
    log "  4. Reboot and let automation handle the rest!"
    echo ""
    log "Files on USB:"
    log "  • Arch Linux ISO (bootable)"
    log "  • run-install.sh (installation orchestrator)"
    log "  • archinstall-config.json (system configuration)"
    log "  • homelab-bootstrap.sh (first-boot automation)"
    log "  • homelab-secrets.env.gpg (encrypted credentials)"
    log "  • systemd service files"
    log "  • bluetooth-devices.yml (optional, if configured)"
    echo ""
    warning "Keep this USB safe - it contains your encrypted credentials!"
    echo ""
    success "═══════════════════════════════════════════"
    echo ""
}

# Error handler
trap 'error "An error occurred. USB creation failed."; exit 1' ERR

# Run main
main "$@"
