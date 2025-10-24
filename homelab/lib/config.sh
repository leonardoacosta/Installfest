#!/bin/bash
# Configuration and Setup Functions

# ============= Directory Management =============
create_directories() {
    print_header "Creating Directories"

    local dirs=(
        "homeassistant"
        "adguardhome/work"
        "adguardhome/conf"
        "jellyfin/config"
        "jellyfin/cache"
        "tailscale/state"
        "radarr" "sonarr" "lidarr" "bazarr" "prowlarr"
        "jellyseerr" "qbittorrent" "nzbget" "gluetun"
    )

    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "Created $dir"
        else
            print_info "$dir already exists"
        fi
    done

    # Create media directories if .env exists
    if [ -f "$SCRIPT_DIR/.env" ]; then
        source "$SCRIPT_DIR/.env"

        if [ -n "$MEDIA_PATH" ] && [ ! -d "$MEDIA_PATH" ]; then
            print_warning "Creating media directory: $MEDIA_PATH"
            sudo mkdir -p "$MEDIA_PATH"/{movies,tv,music}
            sudo chown -R $USER:$USER "$MEDIA_PATH"
        fi

        if [ -n "$DOWNLOADS_PATH" ] && [ ! -d "$DOWNLOADS_PATH" ]; then
            print_warning "Creating downloads directory: $DOWNLOADS_PATH"
            sudo mkdir -p "$DOWNLOADS_PATH"/{complete,incomplete}
            sudo chown -R $USER:$USER "$DOWNLOADS_PATH"
        fi
    fi
}

# ============= Environment File Management =============
setup_env_file() {
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        if [ -f "$SCRIPT_DIR/env.example" ]; then
            print_warning "Creating .env from template..."
            cp "$SCRIPT_DIR/env.example" "$SCRIPT_DIR/.env"
        else
            print_warning "Creating default .env file..."
            cat > "$SCRIPT_DIR/.env" <<'EOF'
# Timezone
TZ=America/New_York

# User/Group IDs
PUID=1000
PGID=1000

# Paths
MEDIA_PATH=/data/media
DOWNLOADS_PATH=/data/downloads
NAS_PATH=/data
BACKUP_PATH=/backup

# Samba Configuration (IMPORTANT: Keep quotes for semicolon values)
SAMBA_SHARE1="Media;/media;yes;no;yes;all;none"
SAMBA_SHARE2="Backup;/backup;yes;no;no;all;none"
SAMBA_USER="user;CHANGE_THIS_PASSWORD"

# Tailscale (Get from https://login.tailscale.com/admin/settings/keys)
TS_AUTHKEY=

# VPN Configuration (if using media stack)
VPN_PROVIDER=mullvad
VPN_TYPE=wireguard
WIREGUARD_PRIVATE_KEY=
WIREGUARD_ADDRESS=
WIREGUARD_PUBLIC_KEY=
VPN_ENDPOINT_IP=
VPN_ENDPOINT_PORT=51820
FIREWALL_VPN_INPUT_PORTS=51820
EOF
        fi
        print_success "Created .env file"
        print_warning "EDIT .env AND CHANGE ALL PASSWORDS!"
    else
        print_success ".env file exists"
    fi
}

# ============= Service-Specific System Requirements =============
configure_service_requirements() {
    print_header "Configuring Service-Specific System Requirements"

    # Tailscale - IP Forwarding (required for VPN routing with host networking)
    print_info "Configuring IP forwarding for Tailscale..."
    if ! grep -q "net.ipv4.ip_forward=1" /etc/sysctl.d/99-tailscale.conf 2>/dev/null; then
        echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-tailscale.conf > /dev/null
        echo 'net.ipv6.conf.all.forwarding=1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
        sudo sysctl --system > /dev/null
        print_success "IP forwarding enabled for Tailscale"
    else
        print_info "IP forwarding already configured"
    fi

    # Add more service-specific requirements here as needed
    # Example:
    # # Gluetun - VPN Configuration
    # print_info "Configuring settings for Gluetun VPN..."
}

# ============= DNS Configuration for AdGuard =============
configure_dns_for_adguard() {
    print_header "DNS Configuration for AdGuard Home"

    if systemctl is-active --quiet systemd-resolved; then
        print_warning "systemd-resolved is running and will conflict with AdGuard Home (port 53)"
        echo ""
        echo "AdGuard Home needs port 53 for DNS, but systemd-resolved is using it."
        echo ""
        read -p "Disable systemd-resolved to allow AdGuard Home to use port 53? (y/n): " disable_resolved

        if [[ $disable_resolved == "y" ]]; then
            print_info "Disabling systemd-resolved..."
            sudo systemctl stop systemd-resolved
            sudo systemctl disable systemd-resolved

            print_info "Configuring static DNS (fallback until AdGuard is running)..."
            sudo rm -f /etc/resolv.conf
            sudo tee /etc/resolv.conf > /dev/null <<'EOF'
# Temporary DNS configuration
# Will be updated to point to AdGuard Home after setup
nameserver 1.1.1.1
nameserver 8.8.8.8
EOF

            # Prevent NetworkManager from overwriting
            if systemctl is-active --quiet NetworkManager; then
                print_info "Configuring NetworkManager to not manage DNS..."
                sudo mkdir -p /etc/NetworkManager/conf.d
                sudo tee /etc/NetworkManager/conf.d/dns.conf > /dev/null <<'EOF'
[main]
dns=none
systemd-resolved=false
EOF
                sudo systemctl restart NetworkManager 2>/dev/null || true
            fi

            # Prevent dhcpcd from overwriting
            if command -v dhcpcd &> /dev/null; then
                print_info "Configuring dhcpcd to not manage DNS..."
                if ! grep -q "nohook resolv.conf" /etc/dhcpcd.conf 2>/dev/null; then
                    echo "nohook resolv.conf" | sudo tee -a /etc/dhcpcd.conf
                    sudo systemctl restart dhcpcd 2>/dev/null || true
                fi
            fi

            # Make resolv.conf immutable
            sudo chattr +i /etc/resolv.conf 2>/dev/null || true

            print_success "systemd-resolved disabled - AdGuard Home can now use port 53"
            echo ""
            print_info "IMPORTANT: After AdGuard Home is running, update /etc/resolv.conf:"
            print_info "  sudo chattr -i /etc/resolv.conf"
            print_info "  echo 'nameserver 127.0.0.1' | sudo tee /etc/resolv.conf"
            print_info "  sudo chattr +i /etc/resolv.conf"
            echo ""
        else
            print_warning "Skipping systemd-resolved configuration"
            print_info "AdGuard Home may fail to bind to port 53"
            print_info "You can manually disable it later with:"
            print_info "  sudo systemctl stop systemd-resolved"
            print_info "  sudo systemctl disable systemd-resolved"
        fi
    else
        print_success "systemd-resolved is not running - no conflicts expected"
    fi
}
