#!/bin/bash

# Homelab Fresh Installation Script for Arch Linux
# Streamlined setup for GitHub runner and homelab services
# Version: 1.0

set -e

# ============= Configuration =============
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
GITHUB_REPO="leonardoacosta/Installfest"
RUNNER_VERSION="2.329.0"
RUNNER_HASH="194f1e1e4bd02f80b7e9633fc546084d8d4e19f3928a324d512ea53430102e1d"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============= Helper Functions =============
print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ${CYAN}$1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}→${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✖${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

confirm() {
    local prompt="${1:-Continue?}"
    read -p "$(echo -e "${YELLOW}?${NC} ${prompt} (y/n): ")" -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='⣷⣯⣟⡿⢿⣻⣽⣾'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# ============= System Check Functions =============
check_arch() {
    if [ ! -f /etc/arch-release ]; then
        print_error "This script is designed for Arch Linux"
        exit 1
    fi
}

check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root, some operations may have permission issues"
        print_info "It's recommended to run as a normal user with sudo access"
        confirm "Continue anyway?" || exit 1
    fi
}

check_internet() {
    print_step "Checking internet connection..."
    if ! ping -c 1 archlinux.org &> /dev/null; then
        print_error "No internet connection detected"
        exit 1
    fi
    print_success "Internet connection verified"
}

check_disk_space() {
    print_step "Checking disk space..."
    local available=$(df / | awk 'NR==2 {print $4}')
    if [ "$available" -lt 20000000 ]; then  # ~20GB
        print_warning "Less than 20GB of disk space available"
        confirm "Continue anyway?" || exit 1
    else
        print_success "Sufficient disk space available"
    fi
}

# ============= Installation Functions =============
install_prerequisites() {
    print_header "Installing System Prerequisites"

    print_step "Updating system packages..."
    sudo pacman -Syu --noconfirm

    print_step "Installing required packages..."
    local packages=(
        "docker"
        "docker-compose"
        "git"
        "github-cli"
        "curl"
        "wget"
        "jq"
        "nano"
        "vim"
        "htop"
        "net-tools"
        "openssh"
        "bluez"
        "bluez-utils"
    )

    for pkg in "${packages[@]}"; do
        if ! pacman -Q "$pkg" &> /dev/null; then
            print_info "Installing $pkg..."
            sudo pacman -S --noconfirm "$pkg"
        else
            print_success "$pkg already installed"
        fi
    done

    print_step "Enabling Docker service..."
    sudo systemctl enable --now docker

    print_step "Adding user to docker group..."
    sudo usermod -aG docker $USER

    print_warning "You'll need to logout and login for docker group changes to take effect"
    print_info "Or run: newgrp docker"
}

setup_github_runner() {
    print_header "Setting Up GitHub Actions Runner"

    # Check if runner already exists
    if [ -d "$HOME/actions-runner" ] && [ -f "$HOME/actions-runner/.runner" ]; then
        print_warning "GitHub runner already configured at $HOME/actions-runner"
        if confirm "Reconfigure runner?"; then
            print_step "Stopping existing runner..."
            cd "$HOME/actions-runner"
            sudo ./svc.sh stop 2>/dev/null || true
            sudo ./svc.sh uninstall 2>/dev/null || true
            cd "$HOME"
            rm -rf "$HOME/actions-runner"
        else
            return 0
        fi
    fi

    print_info "You need a GitHub personal access token with 'repo' and 'workflow' scopes"
    print_info "Get one from: https://github.com/settings/tokens/new"
    echo ""
    read -sp "$(echo -e "${YELLOW}?${NC} Enter GitHub Runner Token: ")" RUNNER_TOKEN
    echo ""

    if [ -z "$RUNNER_TOKEN" ]; then
        print_error "Token is required"
        exit 1
    fi

    print_step "Creating runner directory..."
    mkdir -p "$HOME/actions-runner"
    cd "$HOME/actions-runner"

    print_step "Downloading runner..."
    curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz \
        -L "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

    print_step "Verifying runner checksum..."
    echo "${RUNNER_HASH}  actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz" | shasum -a 256 -c

    print_step "Extracting runner..."
    tar xzf "./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
    rm "actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

    print_step "Configuring runner..."
    ./config.sh --url "https://github.com/${GITHUB_REPO}" \
                --token "$RUNNER_TOKEN" \
                --name "homelab-$(hostname)" \
                --work "_work" \
                --labels "self-hosted,Linux,X64,homelab" \
                --unattended \
                --replace

    print_step "Installing runner as service..."
    sudo ./svc.sh install
    sudo ./svc.sh start

    print_success "GitHub runner installed and started"
    cd "$SCRIPT_DIR"
}

setup_homelab_structure() {
    print_header "Setting Up Homelab Directory Structure"

    print_step "Creating directory structure..."
    cd "$SCRIPT_DIR"

    # Create required directories
    local dirs=(
        "glance"
        "homeassistant"
        "adguardhome/conf"
        "adguardhome/data"
        "traefik"
        "ollama"
        "ollama-webui"
        "jellyfin/config"
        "jellyfin/cache"
        "tailscale"
        "vaultwarden"
        "samba"
        "media/movies"
        "media/tv"
        "media/music"
        "media/downloads"
        "prowlarr"
        "radarr"
        "sonarr"
        "lidarr"
        "bazarr"
        "jellyseerr"
        "qbittorrent"
    )

    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        print_success "Created $dir"
    done

    # Set permissions
    print_step "Setting directory permissions..."
    sudo chown -R $USER:$USER .
    chmod -R 755 .
}

configure_env_file() {
    print_header "Configuring Environment Variables"

    if [ -f "$SCRIPT_DIR/.env" ]; then
        print_warning "Existing .env file found"
        if confirm "Backup and create new .env?"; then
            cp "$SCRIPT_DIR/.env" "$SCRIPT_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
            print_success "Backed up existing .env"
        else
            return 0
        fi
    fi

    print_info "Please prepare your .env file with all required variables"
    print_info "You can use the template from the repository"
    echo ""
    echo -e "${CYAN}Required variables include:${NC}"
    echo "  - PUID/PGID (user/group IDs)"
    echo "  - TZ (timezone)"
    echo "  - Domain settings"
    echo "  - Service passwords"
    echo "  - API keys"
    echo "  - Media paths"
    echo ""
    print_warning "Make sure to change ALL default passwords!"
    echo ""
    confirm "Ready to paste your .env content?" || exit 1

    print_info "Paste your .env content below (press Ctrl+D when done):"
    cat > "$SCRIPT_DIR/.env"

    # Validate .env file
    if grep -q "CHANGE_THIS_PASSWORD\|changeme\|password123" "$SCRIPT_DIR/.env" 2>/dev/null; then
        print_error "Default passwords detected in .env!"
        print_warning "Please edit the .env file and change all default passwords"
        ${EDITOR:-nano} "$SCRIPT_DIR/.env"
    fi

    print_success ".env file configured"
}

configure_services() {
    print_header "Service Configuration Wizard"

    echo -e "${CYAN}Available Service Groups:${NC}"
    echo "1. Core Services (Home Assistant, AdGuard, Jellyfin, Ollama)"
    echo "2. Security Services (Vaultwarden, Tailscale, Traefik)"
    echo "3. Media Stack (Radarr, Sonarr, Prowlarr, etc.)"
    echo "4. All Services"
    echo "5. Custom Selection"
    echo ""
    read -p "$(echo -e "${YELLOW}?${NC} Select service groups to deploy (1-5): ")" -n 1 SERVICE_CHOICE
    echo ""

    case $SERVICE_CHOICE in
        1) SERVICES="homeassistant adguardhome jellyfin ollama ollama-webui" ;;
        2) SERVICES="vaultwarden tailscale traefik" ;;
        3) SERVICES="prowlarr radarr sonarr lidarr bazarr jellyseerr qbittorrent" ;;
        4) SERVICES="all" ;;
        5)
            echo "Enter service names (space-separated):"
            read SERVICES
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac

    # Service-specific configuration
    print_header "Service-Specific Configuration"

    # Vaultwarden
    if [[ "$SERVICES" == *"vaultwarden"* ]] || [[ "$SERVICES" == "all" ]]; then
        print_step "Configuring Vaultwarden..."
        if ! grep -q "^VAULTWARDEN_SMTP_HOST=" "$SCRIPT_DIR/.env"; then
            read -p "Enter SMTP host for Vaultwarden (or press Enter to skip): " SMTP_HOST
            if [ -n "$SMTP_HOST" ]; then
                echo "VAULTWARDEN_SMTP_HOST=$SMTP_HOST" >> "$SCRIPT_DIR/.env"
                read -p "Enter SMTP username: " SMTP_USER
                echo "VAULTWARDEN_SMTP_USERNAME=$SMTP_USER" >> "$SCRIPT_DIR/.env"
                read -sp "Enter SMTP password: " SMTP_PASS
                echo ""
                echo "VAULTWARDEN_SMTP_PASSWORD=$SMTP_PASS" >> "$SCRIPT_DIR/.env"
            fi
        fi
    fi

    # Tailscale
    if [[ "$SERVICES" == *"tailscale"* ]] || [[ "$SERVICES" == "all" ]]; then
        print_step "Configuring Tailscale..."
        if ! grep -q "^TAILSCALE_AUTH_KEY=" "$SCRIPT_DIR/.env"; then
            print_info "Get auth key from: https://login.tailscale.com/admin/settings/keys"
            read -sp "Enter Tailscale auth key (or press Enter to skip): " TS_KEY
            echo ""
            if [ -n "$TS_KEY" ]; then
                echo "TAILSCALE_AUTH_KEY=$TS_KEY" >> "$SCRIPT_DIR/.env"
            fi
        fi
    fi

    # Home Assistant
    if [[ "$SERVICES" == *"homeassistant"* ]] || [[ "$SERVICES" == "all" ]]; then
        print_step "Configuring Home Assistant..."
        print_info "Checking for Zigbee/Z-Wave devices..."
        if [ -e /dev/ttyUSB0 ] || [ -e /dev/ttyACM0 ]; then
            print_success "USB devices detected"
            print_warning "Make sure to map devices in docker-compose.yml"
        fi
    fi

    # Media paths
    if [[ "$SERVICES" == *"jellyfin"* ]] || [[ "$SERVICES" == *"radarr"* ]] || [[ "$SERVICES" == "all" ]]; then
        print_step "Configuring media paths..."
        if ! grep -q "^MEDIA_PATH=" "$SCRIPT_DIR/.env"; then
            read -p "Enter media storage path (default: $SCRIPT_DIR/media): " MEDIA_PATH
            MEDIA_PATH=${MEDIA_PATH:-$SCRIPT_DIR/media}
            echo "MEDIA_PATH=$MEDIA_PATH" >> "$SCRIPT_DIR/.env"
            mkdir -p "$MEDIA_PATH"/{movies,tv,music,downloads}
        fi
    fi

    echo "CONFIGURED_SERVICES=\"$SERVICES\"" >> "$SCRIPT_DIR/.env"
    print_success "Service configuration completed"
}

deploy_homelab() {
    print_header "Deploying Homelab via GitHub Actions"

    print_step "Authenticating with GitHub..."
    if ! gh auth status &> /dev/null; then
        print_info "Please authenticate with GitHub CLI"
        gh auth login
    fi

    print_step "Triggering deployment workflow..."
    cd "$SCRIPT_DIR"

    # Check if we're in a git repository
    if [ ! -d .git ]; then
        print_warning "Not in a git repository"
        print_info "Initializing git repository..."
        git init
        git remote add origin "https://github.com/${GITHUB_REPO}.git"
    fi

    # Commit any local changes
    if [ -n "$(git status --porcelain)" ]; then
        print_step "Committing local changes..."
        git add .
        git commit -m "Local configuration for homelab deployment"
    fi

    print_step "Running deploy-homelab workflow..."
    if gh workflow run deploy-homelab --ref main; then
        print_success "Deployment workflow triggered"

        print_info "Waiting for workflow to start..."
        sleep 5

        # Monitor workflow
        print_info "Monitoring deployment (this may take several minutes)..."
        gh run watch --exit-status || {
            print_error "Deployment failed"
            print_info "Check logs: gh run view"
            return 1
        }

        print_success "Deployment completed successfully!"
    else
        print_error "Failed to trigger workflow"
        print_info "You can manually run: gh workflow run deploy-homelab"
        return 1
    fi
}

verify_deployment() {
    print_header "Verifying Deployment"

    print_step "Checking Docker containers..."
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    print_step "Checking service health..."
    local services=$(docker ps --format "{{.Names}}")
    for service in $services; do
        if docker inspect "$service" --format='{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then
            print_success "$service is healthy"
        else
            print_warning "$service health status unknown"
        fi
    done

    print_header "Service URLs"
    echo -e "${CYAN}Core Services:${NC}"
    echo "  Home Assistant:  http://localhost:8123"
    echo "  AdGuard Home:    http://localhost:3000"
    echo "  Jellyfin:        http://localhost:8096"
    echo "  Ollama WebUI:    http://localhost:3001"
    echo ""
    echo -e "${CYAN}Dashboard & Management:${NC}"
    echo "  Glance:          http://localhost:8085"
    echo "  Traefik:         http://localhost:8080"
    echo ""
    echo -e "${CYAN}Security:${NC}"
    echo "  Vaultwarden:     http://localhost:8222"
    echo ""

    if [[ "$SERVICES" == *"radarr"* ]] || [[ "$SERVICES" == "all" ]]; then
        echo -e "${CYAN}Media Stack:${NC}"
        echo "  Radarr:          http://localhost:7878"
        echo "  Sonarr:          http://localhost:8989"
        echo "  Prowlarr:        http://localhost:9696"
        echo "  Jellyseerr:      http://localhost:5055"
        echo "  qBittorrent:     http://localhost:8090"
        echo ""
    fi
}

setup_ssh() {
    print_header "Setting Up SSH Access"

    print_step "Checking for existing SSH keys..."
    if [ ! -f "$HOME/.ssh/id_rsa" ] && [ ! -f "$HOME/.ssh/id_ed25519" ]; then
        print_info "No SSH keys found, generating new key..."
        ssh-keygen -t ed25519 -C "homelab@$(hostname)" -f "$HOME/.ssh/id_ed25519" -N ""
        print_success "SSH key generated"
    else
        print_success "SSH keys already exist"
    fi

    print_step "Starting SSH service..."
    sudo systemctl start sshd
    sudo systemctl enable sshd

    print_step "Configuring firewall for SSH..."
    sudo ufw allow ssh 2>/dev/null || true

    print_success "SSH service enabled"
    print_info "Your public key:"
    cat "$HOME/.ssh/id_ed25519.pub" 2>/dev/null || cat "$HOME/.ssh/id_rsa.pub"
}

setup_bluetooth() {
    print_header "Setting Up Bluetooth"

    print_step "Enabling Bluetooth service..."
    sudo systemctl enable bluetooth.service
    sudo systemctl start bluetooth.service

    print_success "Bluetooth service started"
    print_info "Starting Bluetooth device pairing..."
    echo ""
    echo -e "${CYAN}Bluetooth pairing instructions:${NC}"
    echo "1. Type 'power on' to enable Bluetooth"
    echo "2. Type 'scan on' to start scanning"
    echo "3. Wait for your device to appear"
    echo "4. Type 'pair <device_mac>' to pair"
    echo "5. Type 'connect <device_mac>' to connect"
    echo "6. Type 'trust <device_mac>' to auto-connect"
    echo "7. Type 'quit' when done"
    echo ""
    print_warning "Starting bluetoothctl - follow instructions above"
    sleep 3
    bluetoothctl
}

create_backup() {
    print_header "Creating Configuration Backup"

    local backup_dir="$SCRIPT_DIR/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    print_step "Backing up configuration..."
    cp "$SCRIPT_DIR/.env" "$backup_dir/" 2>/dev/null || true
    cp "$SCRIPT_DIR/docker-compose.yml" "$backup_dir/" 2>/dev/null || true

    # Backup service configs
    for service in glance homeassistant adguardhome traefik vaultwarden; do
        if [ -d "$SCRIPT_DIR/$service" ]; then
            cp -r "$SCRIPT_DIR/$service" "$backup_dir/" 2>/dev/null || true
        fi
    done

    print_success "Backup created at: $backup_dir"
}

# ============= Main Installation Flow =============
main() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ${CYAN}🏠 Homelab Fresh Installation Wizard${NC}                  ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}  ${CYAN}For Arch Linux${NC}                                        ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

    # System checks
    print_header "System Checks"
    check_arch
    check_root
    check_internet
    check_disk_space

    # Installation flow
    install_prerequisites

    # Docker group change notice
    if ! groups | grep -q docker; then
        print_warning "You need to logout and login for docker access"
        print_info "Run: newgrp docker"
        print_info "Then run this script again"
        exit 0
    fi

    setup_github_runner
    setup_homelab_structure
    configure_env_file
    configure_services
    deploy_homelab
    verify_deployment
    create_backup
    setup_ssh
    setup_bluetooth

    # Final summary
    print_header "🎉 Installation Complete!"
    echo -e "${GREEN}Your homelab is now running!${NC}"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "1. Access services using the URLs shown above"
    echo "2. Complete initial setup for each service"
    echo "3. Configure domain names and SSL if needed"
    echo "4. Set up regular backups"
    echo ""
    print_success "Enjoy your homelab!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--unattended]"
        echo ""
        echo "Options:"
        echo "  --unattended    Run without prompts (requires pre-configured .env)"
        echo "  --help          Show this help message"
        exit 0
        ;;
    --unattended)
        export UNATTENDED=true
        ;;
esac

# Run main installation
main

# Save installation log
{
    echo "Installation completed at: $(date)"
    echo "Services deployed: ${SERVICES:-all}"
    echo "Script version: 1.0"
} >> "$SCRIPT_DIR/installation.log"