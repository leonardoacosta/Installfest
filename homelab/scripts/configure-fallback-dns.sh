#!/bin/bash
# Configure Fallback DNS for GitHub Actions Runner
# This ensures the runner can resolve domains even if AdGuard Home is down

set -euo pipefail

# Get script directory and source utilities
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/common-utils.sh"

# Fallback DNS servers
PRIMARY_DNS="192.168.1.14"  # AdGuard Home (local)
FALLBACK_DNS1="1.1.1.1"     # Cloudflare
FALLBACK_DNS2="8.8.8.8"     # Google

main() {
    print_header "Configuring Fallback DNS"

    # Check if running on systemd-resolved system
    if systemctl is-active --quiet systemd-resolved; then
        print_info "Detected systemd-resolved"
        configure_systemd_resolved
    elif [ -f /etc/resolv.conf ]; then
        print_info "Configuring /etc/resolv.conf directly"
        configure_resolv_conf
    else
        print_error "Unsupported DNS configuration method"
        exit 1
    fi

    print_success "DNS fallback configuration complete"
    print_info "Primary DNS: $PRIMARY_DNS (AdGuard Home)"
    print_info "Fallback 1: $FALLBACK_DNS1 (Cloudflare)"
    print_info "Fallback 2: $FALLBACK_DNS2 (Google)"

    # Test DNS resolution
    test_dns_resolution
}

configure_systemd_resolved() {
    print_step "Configuring systemd-resolved with fallback DNS"

    # Create resolved configuration
    sudo tee /etc/systemd/resolved.conf.d/fallback-dns.conf > /dev/null <<EOF
[Resolve]
DNS=$PRIMARY_DNS $FALLBACK_DNS1 $FALLBACK_DNS2
FallbackDNS=$FALLBACK_DNS1 $FALLBACK_DNS2
#Domains=~.
DNSSEC=no
DNSOverTLS=no
MulticastDNS=yes
LLMNR=yes
Cache=yes
CacheFromLocalhost=yes
EOF

    # Restart systemd-resolved
    print_info "Restarting systemd-resolved"
    sudo systemctl restart systemd-resolved

    print_success "systemd-resolved configured"
}

configure_resolv_conf() {
    print_step "Configuring /etc/resolv.conf with fallback DNS"

    # Backup existing resolv.conf
    if [ -f /etc/resolv.conf ] && [ ! -L /etc/resolv.conf ]; then
        sudo cp /etc/resolv.conf /etc/resolv.conf.backup.$(date +%Y%m%d_%H%M%S)
        print_info "Backed up existing /etc/resolv.conf"
    fi

    # Create new resolv.conf
    sudo tee /etc/resolv.conf > /dev/null <<EOF
# Homelab DNS Configuration with Fallback
# Primary: AdGuard Home (local DNS with ad-blocking)
# Fallback: Cloudflare and Google (external DNS)

nameserver $PRIMARY_DNS
nameserver $FALLBACK_DNS1
nameserver $FALLBACK_DNS2

options timeout:2 attempts:3
EOF

    # Prevent NetworkManager from overwriting
    if command -v nmcli &> /dev/null; then
        print_info "Protecting resolv.conf from NetworkManager"
        sudo chattr +i /etc/resolv.conf 2>/dev/null || print_warning "Could not set immutable flag"
    fi

    print_success "/etc/resolv.conf configured"
}

test_dns_resolution() {
    print_step "Testing DNS resolution"

    local test_domains="google.com github.com jellyfin.local"

    for domain in $test_domains; do
        echo -n "  Testing $domain... "
        if host "$domain" > /dev/null 2>&1; then
            echo "✅"
        else
            echo "❌"
        fi
    done
}

# Show current DNS configuration
show_current_config() {
    print_header "Current DNS Configuration"

    if systemctl is-active --quiet systemd-resolved; then
        echo "systemd-resolved status:"
        systemd-resolve --status | grep -A 5 "DNS Servers" || resolvectl status | grep -A 5 "DNS Servers"
    fi

    echo ""
    echo "/etc/resolv.conf:"
    cat /etc/resolv.conf
}

# Handle arguments
case "${1:-}" in
    --show)
        show_current_config
        ;;
    --test)
        test_dns_resolution
        ;;
    *)
        main
        ;;
esac
