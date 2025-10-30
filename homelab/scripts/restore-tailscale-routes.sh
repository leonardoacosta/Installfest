#!/bin/bash
# Restore Tailscale IP Routes and iptables Rules
# This script runs after Docker restarts to restore networking rules
# that get flushed when containers are restarted

set -euo pipefail

# Get script directory and source utilities
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -f "$SCRIPT_DIR/common-utils.sh" ]; then
    source "$SCRIPT_DIR/common-utils.sh"
else
    # Fallback logging if common-utils not available
    log() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"; }
    warning() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $*"; }
    error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }
fi

# Configuration
TAILSCALE_SUBNETS="${TS_ROUTES:-172.20.0.0/16,172.21.0.0/16}"
LOG_FILE="/var/log/tailscale-routes-restore.log"

# Logging function
log_to_file() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Check if Tailscale is running
check_tailscale() {
    if ! command -v tailscale &> /dev/null; then
        # Try Docker version
        if docker ps --format '{{.Names}}' | grep -q '^tailscale$'; then
            log_to_file "Tailscale running in Docker"
            return 0
        else
            warning "Tailscale not found (neither host nor Docker)"
            return 1
        fi
    fi

    if ! tailscale status &> /dev/null; then
        warning "Tailscale daemon not running"
        return 1
    fi

    log_to_file "Tailscale is running"
    return 0
}

# Get Tailscale IP address
get_tailscale_ip() {
    local ts_ip=""

    # Try host-level Tailscale first
    if command -v tailscale &> /dev/null; then
        ts_ip=$(tailscale ip -4 2>/dev/null | head -1)
    fi

    # Try Docker Tailscale if host-level failed
    if [ -z "$ts_ip" ] && docker ps --format '{{.Names}}' | grep -q '^tailscale$'; then
        ts_ip=$(docker exec tailscale tailscale ip -4 2>/dev/null | head -1)
    fi

    if [ -z "$ts_ip" ]; then
        error "Could not determine Tailscale IP address"
        return 1
    fi

    log_to_file "Tailscale IP: $ts_ip"
    echo "$ts_ip"
}

# Get Tailscale interface name
get_tailscale_interface() {
    local ts_interface=""

    # Check for tailscale0 interface
    if ip link show tailscale0 &> /dev/null; then
        ts_interface="tailscale0"
    # Check for userspace mode (no interface)
    elif ip link show | grep -q "100\."; then
        # Try to find interface with 100.x.x.x IP (Tailscale CGNAT range)
        ts_interface=$(ip -4 addr show | grep "100\." | awk '{print $NF}' | head -1)
    fi

    if [ -z "$ts_interface" ]; then
        warning "Could not determine Tailscale interface (might be userspace mode)"
        return 1
    fi

    log_to_file "Tailscale interface: $ts_interface"
    echo "$ts_interface"
}

# Restore IP routes
restore_routes() {
    log_to_file "Starting route restoration..."

    local ts_ip
    ts_ip=$(get_tailscale_ip) || return 1

    local ts_interface
    ts_interface=$(get_tailscale_interface) || {
        log_to_file "No Tailscale interface found, skipping route restoration (userspace mode?)"
        return 0
    }

    # Parse subnets from configuration
    IFS=',' read -ra SUBNETS <<< "$TAILSCALE_SUBNETS"

    local routes_added=0
    for subnet in "${SUBNETS[@]}"; do
        # Remove any whitespace
        subnet=$(echo "$subnet" | xargs)

        # Check if route already exists
        if ip route show "$subnet" | grep -q "via $ts_ip"; then
            log_to_file "Route already exists: $subnet via $ts_ip"
        else
            log_to_file "Adding route: $subnet via $ts_ip dev $ts_interface"
            if ip route replace "$subnet" via "$ts_ip" dev "$ts_interface" 2>/dev/null; then
                ((routes_added++))
                log_to_file "✓ Route added successfully"
            else
                warning "Failed to add route for $subnet"
            fi
        fi
    done

    log_to_file "Routes restoration complete: $routes_added new routes added"
}

# Restore iptables rules
restore_iptables() {
    log_to_file "Starting iptables restoration..."

    local ts_interface
    ts_interface=$(get_tailscale_interface) || {
        log_to_file "No Tailscale interface found, skipping iptables restoration"
        return 0
    }

    # Check if MASQUERADE rule exists
    if iptables -t nat -C POSTROUTING -o "$ts_interface" -j MASQUERADE 2>/dev/null; then
        log_to_file "MASQUERADE rule already exists"
    else
        log_to_file "Adding MASQUERADE rule for $ts_interface"
        if iptables -t nat -A POSTROUTING -o "$ts_interface" -j MASQUERADE 2>/dev/null; then
            log_to_file "✓ MASQUERADE rule added successfully"
        else
            warning "Failed to add MASQUERADE rule"
        fi
    fi

    # Ensure IP forwarding is enabled
    local ipv4_forward=$(sysctl -n net.ipv4.ip_forward 2>/dev/null || echo "0")
    if [ "$ipv4_forward" != "1" ]; then
        log_to_file "Enabling IPv4 forwarding"
        sysctl -w net.ipv4.ip_forward=1 &>/dev/null || warning "Could not enable IPv4 forwarding"
    fi

    local ipv6_forward=$(sysctl -n net.ipv6.conf.all.forwarding 2>/dev/null || echo "0")
    if [ "$ipv6_forward" != "1" ]; then
        log_to_file "Enabling IPv6 forwarding"
        sysctl -w net.ipv6.conf.all.forwarding=1 &>/dev/null || warning "Could not enable IPv6 forwarding"
    fi

    log_to_file "iptables restoration complete"
}

# Main execution
main() {
    log_to_file "=========================================="
    log_to_file "Tailscale Routes Restoration Script"
    log_to_file "=========================================="

    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        error "This script must be run as root"
        exit 1
    fi

    # Wait for Tailscale to be ready (give it up to 30 seconds)
    local wait_count=0
    while ! check_tailscale && [ $wait_count -lt 30 ]; do
        log_to_file "Waiting for Tailscale to be ready... ($wait_count/30)"
        sleep 1
        ((wait_count++))
    done

    if ! check_tailscale; then
        error "Tailscale is not running after 30 seconds, aborting"
        exit 1
    fi

    # Restore routes
    restore_routes || warning "Route restoration had errors"

    # Restore iptables
    restore_iptables || warning "iptables restoration had errors"

    log_to_file "=========================================="
    log_to_file "Restoration complete"
    log_to_file "=========================================="
}

# Run main function
main "$@"
