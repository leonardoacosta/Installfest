#!/usr/bin/env bash
# Bluetooth Auto-Pairing Setup Script
# Configures Bluetooth service and auto-pairs known devices

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
CONFIG_FILE="${BLUETOOTH_CONFIG:-$SCRIPT_DIR/../config/bluetooth-devices.yml}"

main() {
    log "=========================================="
    log "Bluetooth Auto-Pairing Setup"
    log "=========================================="
    echo ""

    # 1. Check if Bluetooth packages are installed
    if ! command -v bluetoothctl &> /dev/null; then
        error "bluetoothctl not found!"
        log "Installing Bluetooth packages..."
        sudo pacman -S --noconfirm bluez bluez-utils || {
            error "Failed to install Bluetooth packages"
            exit 1
        }
        success "Bluetooth packages installed"
    else
        success "Bluetooth tools are installed"
    fi

    # 2. Enable and start Bluetooth service
    log "Configuring Bluetooth service..."
    sudo systemctl enable bluetooth.service
    sudo systemctl start bluetooth.service
    sleep 2

    if systemctl is-active --quiet bluetooth.service; then
        success "Bluetooth service is running"
    else
        error "Bluetooth service failed to start"
        sudo systemctl status bluetooth.service --no-pager
        exit 1
    fi

    # 3. Check for Bluetooth adapter
    log "Checking for Bluetooth adapter..."
    if ! bluetoothctl list | grep -q "Controller"; then
        error "No Bluetooth adapter found!"
        log "Please ensure Bluetooth hardware is present and enabled in BIOS"
        exit 1
    fi
    success "Bluetooth adapter detected"

    # 4. Power on adapter
    log "Powering on Bluetooth adapter..."
    bluetoothctl power on
    sleep 1
    success "Bluetooth adapter powered on"

    # 5. Check for device configuration file
    if [ ! -f "$CONFIG_FILE" ]; then
        warning "Device configuration file not found: $CONFIG_FILE"
        log "Creating example configuration..."

        mkdir -p "$(dirname "$CONFIG_FILE")"

        cat > "$CONFIG_FILE" << 'EOF'
# Bluetooth Devices Configuration
# Add your devices below in YAML format

devices:
  - name: "Xbox Controller"
    mac: "AA:BB:CC:DD:EE:FF"
    auto_connect: true

  - name: "Bluetooth Headset"
    mac: "11:22:33:44:55:66"
    auto_connect: true

# To find device MAC addresses, run:
#   bluetoothctl
#   scan on
#   (wait for devices to appear)
#   devices
#   scan off
EOF

        warning "Example configuration created at: $CONFIG_FILE"
        warning "Please edit this file with your actual device MAC addresses"
        log ""
        log "To find your device MAC addresses:"
        log "  1. Run: bluetoothctl"
        log "  2. Type: scan on"
        log "  3. Wait for your device to appear"
        log "  4. Type: devices"
        log "  5. Note the MAC address (format: AA:BB:CC:DD:EE:FF)"
        log "  6. Type: scan off"
        log "  7. Type: exit"
        log ""
        log "Then run this script again after updating the config file"
        exit 0
    fi

    success "Device configuration found"

    # 6. Parse configuration and pair devices
    log "Parsing device configuration..."

    # Check if yq is installed for YAML parsing
    if ! command -v yq &> /dev/null; then
        warning "yq not found, installing..."
        sudo pacman -S --noconfirm yq || {
            error "Failed to install yq"
            exit 1
        }
    fi

    # Get device count
    DEVICE_COUNT=$(yq eval '.devices | length' "$CONFIG_FILE")

    if [ "$DEVICE_COUNT" -eq 0 ]; then
        warning "No devices configured in $CONFIG_FILE"
        exit 0
    fi

    log "Found $DEVICE_COUNT device(s) in configuration"
    echo ""

    # 7. Pair each device
    for i in $(seq 0 $((DEVICE_COUNT - 1))); do
        DEVICE_NAME=$(yq eval ".devices[$i].name" "$CONFIG_FILE")
        DEVICE_MAC=$(yq eval ".devices[$i].mac" "$CONFIG_FILE")
        AUTO_CONNECT=$(yq eval ".devices[$i].auto_connect" "$CONFIG_FILE")

        log "Processing: $DEVICE_NAME ($DEVICE_MAC)"

        # Check if device is already paired
        if bluetoothctl info "$DEVICE_MAC" &>/dev/null | grep -q "Paired: yes"; then
            success "$DEVICE_NAME is already paired"

            # Ensure it's trusted
            bluetoothctl trust "$DEVICE_MAC" &>/dev/null || true

            # Try to connect if auto_connect is true
            if [ "$AUTO_CONNECT" = "true" ]; then
                log "Attempting to connect to $DEVICE_NAME..."
                if bluetoothctl connect "$DEVICE_MAC" &>/dev/null; then
                    success "$DEVICE_NAME connected"
                else
                    warning "$DEVICE_NAME not in range or failed to connect"
                fi
            fi
        else
            log "Pairing $DEVICE_NAME..."
            log "Please put device in pairing mode if needed"

            # Attempt pairing
            (
                echo "power on"
                echo "agent on"
                echo "default-agent"
                echo "scan on"
                sleep 5
                echo "scan off"
                echo "pair $DEVICE_MAC"
                sleep 3
                echo "trust $DEVICE_MAC"
                if [ "$AUTO_CONNECT" = "true" ]; then
                    echo "connect $DEVICE_MAC"
                fi
                echo "exit"
            ) | bluetoothctl

            # Check if pairing succeeded
            if bluetoothctl info "$DEVICE_MAC" &>/dev/null | grep -q "Paired: yes"; then
                success "$DEVICE_NAME paired successfully"
            else
                warning "$DEVICE_NAME pairing may have failed"
                log "You may need to manually pair this device"
            fi
        fi

        echo ""
    done

    # 8. Summary
    echo ""
    success "=========================================="
    success "Bluetooth Setup Complete!"
    success "=========================================="
    echo ""
    log "Configured devices:"
    bluetoothctl devices | while read -r line; do
        log "  $line"
    done
    echo ""
    log "Auto-reconnect on boot:"
    log "  Trusted devices will automatically reconnect when in range"
    echo ""
    log "Manual Bluetooth management:"
    log "  GUI:     blueman-manager (if installed)"
    log "  CLI:     bluetoothctl"
    log "  Service: sudo systemctl status bluetooth"
    echo ""
    success "=========================================="
    echo ""
}

# Error handler
trap 'error "Setup failed! Check Bluetooth adapter and configuration."; exit 1' ERR

# Run main
main "$@"
