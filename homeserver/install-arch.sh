#!/bin/bash

# Arch Linux Installation Script for Homeserver Stack
# This script installs and configures the necessary components for running the homeserver stack

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if running on Arch Linux
if [ ! -f /etc/arch-release ]; then
    print_error "This script is designed for Arch Linux only"
    exit 1
fi

echo "Arch Linux Homeserver Stack Installer"
echo "======================================"
echo ""

# Update system
print_info "Updating system packages..."
sudo pacman -Syu --noconfirm

# Ask user preference
echo "Which container runtime would you like to install?"
echo "1) Podman (recommended - rootless containers)"
echo "2) Docker"
echo "3) Both"
read -p "Choose (1-3): " runtime_choice

case $runtime_choice in
    1)
        print_info "Installing Podman and dependencies..."
        sudo pacman -S --noconfirm podman podman-compose buildah skopeo
        sudo pacman -S --noconfirm fuse-overlayfs slirp4netns
        
        print_info "Configuring rootless containers..."
        # Enable user namespaces
        echo 'kernel.unprivileged_userns_clone=1' | sudo tee /etc/sysctl.d/99-rootless.conf
        sudo sysctl --system

        # Enable lingering for user services (allows services to run without login)
        sudo loginctl enable-linger $USER

        # Set up XDG_RUNTIME_DIR if not already set
        if [ -z "$XDG_RUNTIME_DIR" ]; then
            export XDG_RUNTIME_DIR="/run/user/$(id -u)"
        fi

        # Enable Podman socket for user
        print_info "Enabling Podman socket for user..."
        if systemctl --user enable --now podman.socket 2>/dev/null; then
            print_success "Podman socket enabled"
        else
            print_warning "Could not enable podman socket via systemctl --user"
            print_info "This is normal if you're running via SSH without a login session"
            print_info "The socket will be available after you log in normally"
        fi
        
        print_success "Podman installed and configured"
        ;;
    2)
        print_info "Installing Docker..."
        sudo pacman -S --noconfirm docker docker-compose
        
        print_info "Starting Docker service..."
        sudo systemctl enable --now docker
        
        print_info "Adding user to docker group..."
        sudo usermod -aG docker $USER
        
        print_warning "You need to log out and back in for group changes to take effect"
        print_success "Docker installed and configured"
        ;;
    3)
        print_info "Installing both Podman and Docker..."
        
        # Install Podman
        sudo pacman -S --noconfirm podman podman-compose buildah skopeo
        sudo pacman -S --noconfirm fuse-overlayfs slirp4netns
        echo 'kernel.unprivileged_userns_clone=1' | sudo tee /etc/sysctl.d/99-rootless.conf
        sudo sysctl --system
        sudo loginctl enable-linger $USER

        # Set up XDG_RUNTIME_DIR if not set
        if [ -z "$XDG_RUNTIME_DIR" ]; then
            export XDG_RUNTIME_DIR="/run/user/$(id -u)"
        fi

        # Try to enable socket, don't fail if it errors
        systemctl --user enable --now podman.socket 2>/dev/null || true
        
        # Install Docker
        sudo pacman -S --noconfirm docker docker-compose
        sudo systemctl enable --now docker
        sudo usermod -aG docker $USER
        
        print_success "Both Podman and Docker installed"
        print_warning "You need to log out and back in for Docker group changes to take effect"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Install useful tools
print_info "Installing additional tools..."
sudo pacman -S --noconfirm git curl wget htop neovim nano net-tools bind

# Check for AUR helper and install yay if not present
if ! command -v yay &> /dev/null; then
    print_info "Installing yay AUR helper..."
    git clone https://aur.archlinux.org/yay.git /tmp/yay
    cd /tmp/yay
    makepkg -si --noconfirm
    cd -
    rm -rf /tmp/yay
    print_success "yay installed"
fi

# Create media directories
print_info "Creating media directories..."
sudo mkdir -p /data/media/{movies,tv,music}
sudo mkdir -p /data/downloads/{complete,incomplete}
sudo chown -R $USER:$USER /data

# Set permissions
chmod 755 /data/media
chmod 755 /data/downloads

# For Podman rootless
if [ $runtime_choice -eq 1 ] || [ $runtime_choice -eq 3 ]; then
    podman unshare chown -R 1000:1000 /data 2>/dev/null || true
fi

print_success "Media directories created"

# Create service config directories
print_info "Creating service configuration directories..."
mkdir -p homeassistant
mkdir -p adguardhome/work adguardhome/conf
mkdir -p jellyfin/config jellyfin/cache
mkdir -p tailscale/state
mkdir -p radarr sonarr lidarr bazarr prowlarr
mkdir -p qbittorrent nzbget jellyseerr gluetun

print_success "Service configuration directories created"

# Configure firewall (if ufw is installed)
if command -v ufw &> /dev/null; then
    print_info "Configuring firewall..."
    sudo ufw allow 22/tcp       # SSH
    sudo ufw allow 8123/tcp     # Home Assistant
    sudo ufw allow 8096/tcp     # Jellyfin
    sudo ufw allow 53/udp       # AdGuard DNS
    sudo ufw allow 80/tcp       # AdGuard Web
    sudo ufw allow 443/tcp      # HTTPS
    sudo ufw allow 445/tcp      # Samba
    sudo ufw allow 139/tcp      # Samba
    print_success "Firewall rules added (remember to enable with: sudo ufw enable)"
fi

# Setup environment file if not exists
if [ ! -f .env ]; then
    if [ -f env.example ]; then
        print_info "Creating .env file from template..."
        cp env.example .env
        print_warning "Please edit .env and update all passwords and settings"
    else
        print_warning "No env.example found, creating minimal .env file..."
        cat > .env <<EOF
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

# Samba Configuration
SAMBA_SHARE1="Media;/media;yes;no;yes;all;none"
SAMBA_SHARE2="Backup;/backup;yes;no;no;all;none"
SAMBA_USER="user;password123"

# Tailscale (Get from https://login.tailscale.com/admin/settings/keys)
TS_AUTHKEY=

# VPN Configuration (if using media stack)
VPN_PROVIDER=custom
VPN_TYPE=wireguard
WIREGUARD_PRIVATE_KEY=
WIREGUARD_ADDRESS=
WIREGUARD_PUBLIC_KEY=
VPN_ENDPOINT_IP=
VPN_ENDPOINT_PORT=51820
FIREWALL_VPN_INPUT_PORTS=51820
EOF
        print_success "Created .env file with defaults"
        print_warning "IMPORTANT: Edit .env and configure your settings!"
    fi
fi

# Create systemd user directory
mkdir -p ~/.config/systemd/user/

# Copy systemd service if it exists
if [ -f homeserver.service ]; then
    cp homeserver.service ~/.config/systemd/user/
    systemctl --user daemon-reload
    print_success "Systemd service file installed"
    print_info "Enable with: systemctl --user enable homeserver.service"
fi

# Performance tuning
print_info "Applying performance tuning..."

# Increase max user watches for file monitoring (useful for development)
echo 'fs.inotify.max_user_watches=524288' | sudo tee /etc/sysctl.d/99-inotify.conf

# Increase max map count for Elasticsearch/OpenSearch if needed
echo 'vm.max_map_count=262144' | sudo tee /etc/sysctl.d/99-elasticsearch.conf

# Apply sysctl settings
sudo sysctl --system

print_success "Performance tuning applied"

# Final instructions
echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your settings:"
echo "   nano .env"
echo ""
echo "2. Start the services:"
echo "   ./start.sh"
echo "   Or use: podman-compose up -d"
echo ""

if [ $runtime_choice -eq 2 ] || [ $runtime_choice -eq 3 ]; then
    echo "3. Log out and back in for Docker group changes to take effect"
    echo ""
fi

echo "4. Access services at:"
echo "   - Home Assistant: http://localhost:8123"
echo "   - Jellyfin: http://localhost:8096"
echo "   - AdGuard: http://localhost:3000 (initial setup)"
echo ""
echo "5. (Optional) Enable systemd service for auto-start:"
echo "   systemctl --user enable homeserver.service"
echo ""

print_success "Setup complete!"
