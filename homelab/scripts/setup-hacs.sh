#!/bin/bash
# HACS (Home Assistant Community Store) Installation Script
# This script installs HACS into a running Home Assistant container
# Must be run after Home Assistant container is started

set -e

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common-utils.sh"

# Configuration
HA_CONTAINER_NAME="${HA_CONTAINER_NAME:-homeassistant}"
HACS_CHECK_FILE="/config/.hacs_installed"

print_header "HACS Installation for Home Assistant"

# Function to check if HACS is already installed
check_hacs_installed() {
    print_info "Checking if HACS is already installed..."

    # Check if the marker file exists in the container
    if docker exec "$HA_CONTAINER_NAME" test -f "$HACS_CHECK_FILE" 2>/dev/null; then
        print_success "HACS is already installed"
        return 0
    fi

    # Check if HACS directory exists
    if docker exec "$HA_CONTAINER_NAME" test -d "/config/custom_components/hacs" 2>/dev/null; then
        print_success "HACS directory found - marking as installed"
        docker exec "$HA_CONTAINER_NAME" touch "$HACS_CHECK_FILE"
        return 0
    fi

    return 1
}

# Function to wait for Home Assistant to be ready
wait_for_homeassistant() {
    print_info "Waiting for Home Assistant to be ready..."
    local max_attempts=60
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker exec "$HA_CONTAINER_NAME" curl -s -o /dev/null -w "%{http_code}" http://localhost:8123/api/ 2>/dev/null | grep -q "200\|401"; then
            print_success "Home Assistant is ready"
            return 0
        fi

        attempt=$((attempt + 1))
        print_info "Waiting for Home Assistant... (attempt $attempt/$max_attempts)"
        sleep 5
    done

    print_error "Home Assistant did not become ready in time"
    return 1
}

# Function to install HACS
install_hacs() {
    print_info "Installing HACS into Home Assistant container..."

    # Download and run HACS installation script inside the container
    docker exec "$HA_CONTAINER_NAME" bash -c "
        set -e
        echo 'Downloading HACS installation script...'
        wget -O - https://get.hacs.xyz | bash -

        # Create marker file to indicate HACS is installed
        touch $HACS_CHECK_FILE

        echo 'HACS installation completed successfully'
    " || {
        print_error "Failed to install HACS"
        return 1
    }

    print_success "HACS installed successfully"
    return 0
}

# Function to restart Home Assistant
restart_homeassistant() {
    print_info "Restarting Home Assistant to apply HACS installation..."

    # Restart the Home Assistant container
    docker restart "$HA_CONTAINER_NAME"

    # Wait for it to come back up
    sleep 10
    wait_for_homeassistant

    print_success "Home Assistant restarted successfully"
}

# Function to provide setup instructions
provide_setup_instructions() {
    print_header "HACS Setup Instructions"

    cat << EOF
========================================
HACS has been installed successfully!
========================================

To complete the HACS setup:

1. Access Home Assistant at: http://$HOMELAB_IP:8123

2. Navigate to: Settings > Devices & Services

3. Clear your browser cache (Ctrl+F5 or Cmd+Shift+R)

4. Click "+ Add Integration" and search for "HACS"

5. Accept the terms and conditions

6. Authenticate with GitHub:
   - Copy the device code provided
   - Visit: https://github.com/login/device
   - Enter the device code
   - Authorize HACS

7. Complete the setup wizard

After setup, you can install:
- Plotly Graph Card (required for MTR-1 zones)
- Other community integrations and cards

For MTR-1 setup, install Plotly via:
HACS > Frontend > Search "Plotly" > Install

========================================
EOF
}

# Main execution
main() {
    print_info "Starting HACS installation process..."

    # Check if container exists
    if ! docker ps -a --format "{{.Names}}" | grep -q "^${HA_CONTAINER_NAME}$"; then
        print_error "Home Assistant container '$HA_CONTAINER_NAME' not found"
        exit 1
    fi

    # Check if container is running
    if ! docker ps --format "{{.Names}}" | grep -q "^${HA_CONTAINER_NAME}$"; then
        print_info "Starting Home Assistant container..."
        docker start "$HA_CONTAINER_NAME"
        sleep 5
    fi

    # Wait for Home Assistant to be ready
    wait_for_homeassistant || exit 1

    # Check if HACS is already installed
    if check_hacs_installed; then
        print_info "HACS is already installed - skipping installation"
        provide_setup_instructions
        exit 0
    fi

    # Install HACS
    install_hacs || exit 1

    # Restart Home Assistant
    restart_homeassistant || exit 1

    # Provide setup instructions
    provide_setup_instructions

    print_success "HACS installation process completed!"
}

# Run main function
main "$@"