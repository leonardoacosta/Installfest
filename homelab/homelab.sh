#!/bin/bash

# Homelab Complete Management Script
# Single script for installation and management
# Version: 3.1 - Added unattended mode support

set -e

# ============= Configuration =============
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

GITHUB_REPO="leonardoacosta/Installfest"
RUNNER_VERSION="2.329.0"
RUNNER_HASH="194f1e1e4bd02f80b7e9633fc546084d8d4e19f3928a324d512ea53430102e1d"

# Setup state tracking
SETUP_STATE_FILE="$SCRIPT_DIR/.setup_state"
ENV_FILE="$SCRIPT_DIR/.env"

# Unattended mode support
UNATTENDED=false
CONFIG_FILE=""
declare -A CONFIG_VALUES

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
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

print_required() {
    echo -e "${MAGENTA}[REQUIRED]${NC} $1"
}

require_input() {
    local prompt="$1"
    local var_name="$2"
    local config_key="$3"  # Optional: key to look up in CONFIG_VALUES
    local value=""

    # Check if value exists in config (unattended mode)
    if [ "$UNATTENDED" = true ] && [ -n "$config_key" ] && [ -n "${CONFIG_VALUES[$config_key]}" ]; then
        value="${CONFIG_VALUES[$config_key]}"
        print_info "Using config value for: $prompt"
        eval "$var_name='$value'"
        return 0
    fi

    # Interactive mode
    while [ -z "$value" ]; do
        read -p "$(echo -e "${MAGENTA}[REQUIRED]${NC} ${prompt}: ")" value
        if [ -z "$value" ]; then
            if [ "$UNATTENDED" = true ]; then
                print_error "Unattended mode: Missing required config value for key: $config_key"
                exit 1
            fi
            print_error "This field is required and cannot be empty"
        fi
    done

    eval "$var_name='$value'"
}

require_password() {
    local prompt="$1"
    local var_name="$2"
    local config_key="$3"  # Optional: key to look up in CONFIG_VALUES
    local value=""

    # Check if value exists in config (unattended mode)
    if [ "$UNATTENDED" = true ] && [ -n "$config_key" ] && [ -n "${CONFIG_VALUES[$config_key]}" ]; then
        value="${CONFIG_VALUES[$config_key]}"
        print_info "Using config value for: $prompt"
        eval "$var_name='$value'"
        return 0
    fi

    # Interactive mode
    while [ -z "$value" ]; do
        read -sp "$(echo -e "${MAGENTA}[REQUIRED]${NC} ${prompt}: ")" value
        echo ""
        if [ -z "$value" ]; then
            if [ "$UNATTENDED" = true ]; then
                print_error "Unattended mode: Missing required config value for key: $config_key"
                exit 1
            fi
            print_error "Password is required and cannot be empty"
        elif [ ${#value} -lt 8 ]; then
            print_error "Password must be at least 8 characters"
            value=""
        fi
    done

    eval "$var_name='$value'"
}

save_state() {
    echo "$1" > "$SETUP_STATE_FILE"
}

get_state() {
    if [ -f "$SETUP_STATE_FILE" ]; then
        cat "$SETUP_STATE_FILE"
    else
        echo "fresh"
    fi
}

# ============= Config File Parsing =============
load_config_file() {
    local config_file="$1"

    if [ ! -f "$config_file" ]; then
        print_error "Config file not found: $config_file"
        exit 1
    fi

    print_info "Loading configuration from: $config_file"

    # Check if yq is installed
    if ! command -v yq &> /dev/null; then
        print_error "yq is required for config file parsing but not installed"
        print_info "Install with: sudo pacman -S yq"
        exit 1
    fi

    # Validate YAML syntax
    if ! yq eval '.' "$config_file" > /dev/null 2>&1; then
        print_error "Invalid YAML syntax in config file"
        exit 1
    fi

    # Load configuration values
    CONFIG_VALUES[unattended]=$(yq eval '.unattended // false' "$config_file")
    CONFIG_VALUES[timezone]=$(yq eval '.system.timezone // "America/Chicago"' "$config_file")
    CONFIG_VALUES[domain]=$(yq eval '.system.domain // "local"' "$config_file")

    # Passwords
    CONFIG_VALUES[jellyfin_password]=$(yq eval '.passwords.jellyfin // ""' "$config_file")
    CONFIG_VALUES[vaultwarden_password]=$(yq eval '.passwords.vaultwarden // ""' "$config_file")
    CONFIG_VALUES[adguard_password]=$(yq eval '.passwords.adguard // ""' "$config_file")
    CONFIG_VALUES[samba_password]=$(yq eval '.passwords.samba // ""' "$config_file")
    CONFIG_VALUES[traefik_dashboard_password]=$(yq eval '.passwords.traefik_dashboard // ""' "$config_file")

    # VPN
    CONFIG_VALUES[vpn_provider]=$(yq eval '.vpn.provider // ""' "$config_file")
    CONFIG_VALUES[vpn_username]=$(yq eval '.vpn.username // ""' "$config_file")
    CONFIG_VALUES[vpn_password]=$(yq eval '.vpn.password // ""' "$config_file")

    # Tailscale
    CONFIG_VALUES[tailscale_auth_key]=$(yq eval '.tailscale.auth_key // ""' "$config_file")

    # SMTP
    CONFIG_VALUES[smtp_host]=$(yq eval '.smtp.host // ""' "$config_file")
    CONFIG_VALUES[smtp_port]=$(yq eval '.smtp.port // "587"' "$config_file")
    CONFIG_VALUES[smtp_username]=$(yq eval '.smtp.username // ""' "$config_file")
    CONFIG_VALUES[smtp_password]=$(yq eval '.smtp.password // ""' "$config_file")
    CONFIG_VALUES[smtp_from]=$(yq eval '.smtp.from // ""' "$config_file")

    # GitHub Runner
    CONFIG_VALUES[github_runner_token]=$(yq eval '.github.runner_token // ""' "$config_file")

    print_success "Configuration loaded successfully"

    # If unattended flag is true in config, enable unattended mode
    if [ "${CONFIG_VALUES[unattended]}" = "true" ]; then
        UNATTENDED=true
        print_info "Unattended mode enabled"
    fi
}

# ============= System Check Functions =============
check_arch() {
    if [ ! -f /etc/arch-release ]; then
        print_error "This script is designed for Arch Linux"
        print_info "Detected OS: $(uname -s)"
        exit 1
    fi
}

check_internet() {
    print_step "Checking internet connection..."
    if ! ping -c 1 archlinux.org &> /dev/null; then
        print_error "No internet connection detected"
        print_info "Please ensure you have an active internet connection"
        exit 1
    fi
    print_success "Internet connection verified"
}

check_disk_space() {
    print_step "Checking disk space..."
    local available=$(df / | awk 'NR==2 {print $4}')
    if [ "$available" -lt 20000000 ]; then  # ~20GB
        print_error "Less than 20GB of disk space available"
        print_info "This homelab requires at least 20GB of free space"
        exit 1
    fi
    print_success "Sufficient disk space available ($(echo $available | awk '{print int($1/1048576)}')GB free)"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        return 1
    fi
    if ! docker ps &> /dev/null; then
        return 1
    fi
    return 0
}

# ============= Fresh Installation Functions =============
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

    print_warning "Docker group changes require a new session"
    print_info "After setup completes, run: newgrp docker"

    save_state "prerequisites_installed"
}

setup_github_runner() {
    print_header "Setting Up GitHub Actions Runner"

    # Check if runner already exists
    if [ -d "$HOME/actions-runner" ] && [ -f "$HOME/actions-runner/.runner" ]; then
        print_success "GitHub runner already configured"
        return 0
    fi

    print_info "You need a GitHub personal access token with 'repo' and 'workflow' scopes"
    print_info "Get one from: https://github.com/settings/tokens/new"
    echo ""

    local token=""
    require_password "Enter GitHub Runner Token" token

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
                --token "$token" \
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

    save_state "runner_configured"
}

setup_directory_structure() {
    print_header "Creating Directory Structure"

    cd "$SCRIPT_DIR"

    # Create all required directories
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
        "samba/config"
        "media/movies"
        "media/tv"
        "media/music"
        "media/downloads/complete"
        "media/downloads/incomplete"
        "prowlarr"
        "radarr"
        "sonarr"
        "lidarr"
        "bazarr"
        "jellyseerr"
        "qbittorrent/config"
        "nzbget"
        "backups"
    )

    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
    done

    # Set proper permissions
    sudo chown -R $USER:$USER .
    chmod -R 755 .

    print_success "Directory structure created"
    save_state "directories_created"
}

configure_environment() {
    print_header "Configuring Environment Variables"

    # Start fresh with required variables
    cat > "$ENV_FILE" << 'EOF'
# Homelab Environment Configuration
# Generated by homelab.sh setup wizard

# System Configuration
EOF

    # Get user/group IDs
    echo "PUID=$(id -u)" >> "$ENV_FILE"
    echo "PGID=$(id -g)" >> "$ENV_FILE"

    # Timezone
    print_required "Select your timezone"
    local tz=""
    require_input "Enter timezone (e.g., America/Chicago)" tz
    echo "TZ=$tz" >> "$ENV_FILE"

    # Domain configuration
    print_required "Configure domain settings"
    local domain=""
    require_input "Enter domain name (e.g., homelab.local or your-domain.com)" domain
    echo "DOMAIN=$domain" >> "$ENV_FILE"
    echo "" >> "$ENV_FILE"

    # Core service passwords
    print_header "Setting Service Passwords"
    print_warning "All passwords must be at least 8 characters"
    echo ""

    echo "# Service Passwords" >> "$ENV_FILE"

    local jellyfin_pass=""
    require_password "Jellyfin admin password" jellyfin_pass
    echo "JELLYFIN_PASSWORD=$jellyfin_pass" >> "$ENV_FILE"

    local vaultwarden_token=""
    require_password "Vaultwarden admin token" vaultwarden_token
    echo "VAULTWARDEN_ADMIN_TOKEN=$vaultwarden_token" >> "$ENV_FILE"

    local adguard_pass=""
    require_password "AdGuard Home admin password" adguard_pass
    echo "ADGUARD_PASSWORD=$adguard_pass" >> "$ENV_FILE"

    local samba_pass=""
    require_password "Samba share password" samba_pass
    echo "SAMBA_PASSWORD=$samba_pass" >> "$ENV_FILE"
    echo "SAMBA_USERNAME=homelab" >> "$ENV_FILE"

    echo "" >> "$ENV_FILE"

    # Media paths
    print_header "Configuring Storage Paths"

    local media_path=""
    require_input "Enter media storage path (e.g., /data/media or $SCRIPT_DIR/media)" media_path
    echo "MEDIA_PATH=$media_path" >> "$ENV_FILE"
    mkdir -p "$media_path"/{movies,tv,music}

    local downloads_path=""
    require_input "Enter downloads path (e.g., /data/downloads or $SCRIPT_DIR/media/downloads)" downloads_path
    echo "DOWNLOADS_PATH=$downloads_path" >> "$ENV_FILE"
    mkdir -p "$downloads_path"/{complete,incomplete}

    echo "" >> "$ENV_FILE"

    save_state "environment_configured"
}

configure_services() {
    print_header "Service Configuration"

    # VPN Configuration (Required for media services)
    print_header "VPN Configuration (Gluetun)"
    print_info "VPN is required for secure media downloading"
    print_info "Supported providers: Mullvad, NordVPN, ExpressVPN, etc."
    echo ""

    echo "# VPN Configuration" >> "$ENV_FILE"

    local vpn_provider=""
    require_input "Enter VPN provider (e.g., mullvad, nordvpn)" vpn_provider
    echo "VPN_SERVICE_PROVIDER=$vpn_provider" >> "$ENV_FILE"

    if [ "$vpn_provider" == "mullvad" ] || [ "$vpn_provider" == "custom" ]; then
        local wg_private=""
        require_input "Enter WireGuard private key" wg_private
        echo "WIREGUARD_PRIVATE_KEY=$wg_private" >> "$ENV_FILE"

        local wg_address=""
        require_input "Enter WireGuard address (e.g., 10.x.x.x/32)" wg_address
        echo "WIREGUARD_ADDRESS=$wg_address" >> "$ENV_FILE"

        local wg_public=""
        require_input "Enter WireGuard public key" wg_public
        echo "WIREGUARD_PUBLIC_KEY=$wg_public" >> "$ENV_FILE"

        local vpn_endpoint=""
        require_input "Enter VPN endpoint IP" vpn_endpoint
        echo "VPN_ENDPOINT_IP=$vpn_endpoint" >> "$ENV_FILE"
        echo "VPN_ENDPOINT_PORT=51820" >> "$ENV_FILE"
    else
        local vpn_user=""
        require_input "Enter VPN username" vpn_user
        echo "OPENVPN_USER=$vpn_user" >> "$ENV_FILE"

        local vpn_pass=""
        require_password "Enter VPN password" vpn_pass
        echo "OPENVPN_PASSWORD=$vpn_pass" >> "$ENV_FILE"
    fi

    echo "" >> "$ENV_FILE"

    # Vaultwarden SMTP (Required for password recovery)
    print_header "Email Configuration (Vaultwarden)"
    print_info "SMTP is required for password recovery emails"
    echo ""

    echo "# SMTP Configuration" >> "$ENV_FILE"

    local smtp_host=""
    require_input "Enter SMTP host (e.g., smtp.gmail.com)" smtp_host
    echo "VAULTWARDEN_SMTP_HOST=$smtp_host" >> "$ENV_FILE"

    local smtp_port=""
    require_input "Enter SMTP port (e.g., 587)" smtp_port
    echo "VAULTWARDEN_SMTP_PORT=$smtp_port" >> "$ENV_FILE"

    local smtp_user=""
    require_input "Enter SMTP username (email address)" smtp_user
    echo "VAULTWARDEN_SMTP_USERNAME=$smtp_user" >> "$ENV_FILE"
    echo "VAULTWARDEN_SMTP_FROM=$smtp_user" >> "$ENV_FILE"

    local smtp_pass=""
    require_password "Enter SMTP password" smtp_pass
    echo "VAULTWARDEN_SMTP_PASSWORD=$smtp_pass" >> "$ENV_FILE"

    echo "" >> "$ENV_FILE"

    # Tailscale Configuration
    print_header "Tailscale VPN Mesh Configuration"
    print_info "Tailscale provides secure remote access to your homelab"
    print_info "Get an auth key from: https://login.tailscale.com/admin/settings/keys"
    echo ""

    echo "# Tailscale Configuration" >> "$ENV_FILE"

    local ts_key=""
    require_input "Enter Tailscale auth key" ts_key
    echo "TAILSCALE_AUTH_KEY=$ts_key" >> "$ENV_FILE"
    echo "TAILSCALE_HOSTNAME=homelab-$(hostname)" >> "$ENV_FILE"

    echo "" >> "$ENV_FILE"

    # API Keys for Media Services
    print_header "Media Service Configuration"
    print_info "Setting up API keys for service integration"
    echo ""

    echo "# Media Service API Keys" >> "$ENV_FILE"

    # Generate random API keys
    local radarr_api=$(openssl rand -hex 16)
    local sonarr_api=$(openssl rand -hex 16)
    local prowlarr_api=$(openssl rand -hex 16)
    local lidarr_api=$(openssl rand -hex 16)
    local bazarr_api=$(openssl rand -hex 16)
    local jellyseerr_api=$(openssl rand -hex 16)

    echo "RADARR_API_KEY=$radarr_api" >> "$ENV_FILE"
    echo "SONARR_API_KEY=$sonarr_api" >> "$ENV_FILE"
    echo "PROWLARR_API_KEY=$prowlarr_api" >> "$ENV_FILE"
    echo "LIDARR_API_KEY=$lidarr_api" >> "$ENV_FILE"
    echo "BAZARR_API_KEY=$bazarr_api" >> "$ENV_FILE"
    echo "JELLYSEERR_API_KEY=$jellyseerr_api" >> "$ENV_FILE"

    print_success "Generated API keys for media services"

    echo "" >> "$ENV_FILE"

    # Additional required configurations
    echo "# Additional Configuration" >> "$ENV_FILE"
    echo "VAULTWARDEN_SIGNUPS_ALLOWED=false" >> "$ENV_FILE"
    echo "JELLYFIN_PublishedServerUrl=http://$domain:8096" >> "$ENV_FILE"
    echo "HOMEASSISTANT_TRUSTED_PROXIES=172.20.0.0/16" >> "$ENV_FILE"

    save_state "services_configured"
    print_success "All services configured"
}

deploy_services() {
    print_header "Deploying Services"

    cd "$SCRIPT_DIR"

    # Check Docker access
    if ! docker ps &> /dev/null; then
        print_warning "Docker requires group membership to work"
        print_info "Run: newgrp docker"
        print_info "Then run: ./homelab.sh deploy"
        save_state "pending_deployment"
        return 1
    fi

    print_step "Starting Docker services..."
    docker compose up -d

    print_step "Waiting for services to initialize..."
    sleep 10

    # Health checks
    print_step "Verifying service health..."
    local healthy=0
    local total=0

    for container in $(docker ps --format "{{.Names}}"); do
        total=$((total + 1))
        health=$(docker inspect "$container" --format='{{.State.Health.Status}}' 2>/dev/null || echo "no healthcheck")
        if [[ "$health" == "healthy" ]] || [[ "$health" == "no healthcheck" ]]; then
            healthy=$((healthy + 1))
            print_success "$container is running"
        else
            print_warning "$container: $health"
        fi
    done

    print_info "Services running: $healthy/$total"

    save_state "deployed"
    print_success "Deployment complete!"
}

setup_ssh() {
    print_header "SSH Configuration"

    print_step "Checking for SSH keys..."
    if [ ! -f "$HOME/.ssh/id_ed25519" ]; then
        print_info "Generating new SSH key..."
        ssh-keygen -t ed25519 -C "homelab@$(hostname)" -f "$HOME/.ssh/id_ed25519" -N ""
        print_success "SSH key generated"
    else
        print_success "SSH key already exists"
    fi

    print_step "Starting SSH service..."
    sudo systemctl enable --now sshd

    print_success "SSH service enabled"
    print_info "Your public key:"
    cat "$HOME/.ssh/id_ed25519.pub"
    echo ""
}

setup_bluetooth() {
    print_header "Bluetooth Configuration"

    print_step "Enabling Bluetooth service..."
    sudo systemctl enable --now bluetooth.service

    print_success "Bluetooth service started"

    print_info "To pair Bluetooth devices:"
    echo "  1. Run: bluetoothctl"
    echo "  2. Type: power on"
    echo "  3. Type: scan on"
    echo "  4. Type: pair <device_mac>"
    echo "  5. Type: connect <device_mac>"
    echo "  6. Type: trust <device_mac>"
    echo "  7. Type: quit"
    echo ""
}

# ============= Management Functions =============
start_services() {
    check_docker || {
        print_error "Docker not available"
        return 1
    }

    if [ -n "$1" ]; then
        print_info "Starting selected services: $1"
        docker compose up -d $1
    else
        print_info "Starting all services..."
        docker compose up -d
    fi

    print_success "Services started"
}

stop_services() {
    check_docker || {
        print_error "Docker not available"
        return 1
    }

    print_info "Stopping all services..."
    docker compose down
    print_success "Services stopped"
}

restart_services() {
    stop_services
    start_services "$1"
}

show_status() {
    check_docker || {
        print_error "Docker not available"
        return 1
    }

    print_header "Service Status"
    echo -e "${CYAN}Running Containers:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -20

    echo ""
    echo -e "${CYAN}Service Health:${NC}"
    for container in $(docker ps --format "{{.Names}}"); do
        health=$(docker inspect "$container" --format='{{.State.Health.Status}}' 2>/dev/null || echo "no healthcheck")
        if [[ "$health" == "healthy" ]]; then
            echo -e "  ${GREEN}✓${NC} $container: $health"
        elif [[ "$health" == "no healthcheck" ]]; then
            echo -e "  ${CYAN}-${NC} $container: running"
        else
            echo -e "  ${YELLOW}⚠${NC} $container: $health"
        fi
    done
}

show_logs() {
    check_docker || {
        print_error "Docker not available"
        return 1
    }

    local service="${1:-}"
    if [ -z "$service" ]; then
        docker compose logs -f --tail=100
    else
        docker compose logs -f --tail=100 "$service"
    fi
}

show_urls() {
    print_header "Service URLs"

    # Get the host IP
    local host_ip=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1)

    echo -e "${CYAN}Access your services at:${NC}"
    echo ""
    echo -e "${GREEN}Core Services:${NC}"
    echo "  Home Assistant:  http://$host_ip:8123"
    echo "  AdGuard Home:    http://$host_ip:3000"
    echo "  Jellyfin:        http://$host_ip:8096"
    echo "  Ollama WebUI:    http://$host_ip:3001"
    echo ""
    echo -e "${GREEN}Management:${NC}"
    echo "  Glance:          http://$host_ip:8085"
    echo "  Traefik:         http://$host_ip:8080"
    echo ""
    echo -e "${GREEN}Security:${NC}"
    echo "  Vaultwarden:     http://$host_ip:8222"
    echo ""
    echo -e "${GREEN}Media Services:${NC}"
    echo "  Radarr:          http://$host_ip:7878"
    echo "  Sonarr:          http://$host_ip:8989"
    echo "  Prowlarr:        http://$host_ip:9696"
    echo "  Jellyseerr:      http://$host_ip:5055"
    echo "  qBittorrent:     http://$host_ip:8090"
}

update_images() {
    check_docker || {
        print_error "Docker not available"
        return 1
    }

    print_info "Pulling latest images..."
    docker compose pull
    print_success "Images updated"
    print_warning "Restart services to use new images"
}

backup_config() {
    local backup_dir="$SCRIPT_DIR/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    print_info "Creating backup at: $backup_dir"

    cp .env "$backup_dir/"
    cp docker-compose.yml "$backup_dir/"

    for service in glance homeassistant adguardhome traefik vaultwarden tailscale; do
        if [ -d "$service" ]; then
            tar -czf "$backup_dir/$service.tar.gz" "$service" --exclude="*.log" --exclude="*.db-wal"
        fi
    done

    print_success "Backup completed: $backup_dir"
}

cleanup_system() {
    check_docker || {
        print_error "Docker not available"
        return 1
    }

    print_warning "This will remove stopped containers and unused images"
    read -p "Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi

    docker container prune -f
    docker image prune -a -f
    docker volume prune -f

    print_success "Cleanup completed"
}

quick_deploy() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI not installed"
        return 1
    fi

    print_info "Triggering deployment workflow..."
    gh workflow run deploy-homelab --ref main

    print_success "Deployment triggered"
    print_info "Monitor with: gh run watch"
}

# ============= Complete Setup Flow =============
run_complete_setup() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ${CYAN}🏠 Homelab Complete Setup Wizard${NC}                      ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}  ${CYAN}For Arch Linux${NC}                                        ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    print_warning "This wizard will guide you through EVERY required configuration"
    print_warning "All fields are mandatory - the setup cannot be skipped"
    echo ""
    sleep 2

    # System checks
    print_header "System Verification"
    check_arch
    check_internet
    check_disk_space

    # Get current state
    local state=$(get_state)

    # Execute setup based on state
    case "$state" in
        fresh)
            install_prerequisites
            setup_github_runner
            setup_directory_structure
            configure_environment
            configure_services
            deploy_services
            setup_ssh
            setup_bluetooth
            ;;
        prerequisites_installed)
            setup_github_runner
            setup_directory_structure
            configure_environment
            configure_services
            deploy_services
            setup_ssh
            setup_bluetooth
            ;;
        runner_configured)
            setup_directory_structure
            configure_environment
            configure_services
            deploy_services
            setup_ssh
            setup_bluetooth
            ;;
        directories_created)
            configure_environment
            configure_services
            deploy_services
            setup_ssh
            setup_bluetooth
            ;;
        environment_configured)
            configure_services
            deploy_services
            setup_ssh
            setup_bluetooth
            ;;
        services_configured)
            deploy_services
            setup_ssh
            setup_bluetooth
            ;;
        pending_deployment)
            deploy_services
            setup_ssh
            setup_bluetooth
            ;;
        deployed)
            print_success "Setup already complete!"
            ;;
    esac

    # Final summary
    if [ "$(get_state)" == "deployed" ]; then
        print_header "🎉 Setup Complete!"
        echo -e "${GREEN}Your homelab is fully configured and running!${NC}"
        echo ""
        show_urls
        echo ""
        print_info "Management: Run './homelab.sh' for the management menu"
        print_info "Bluetooth: Run 'bluetoothctl' to pair devices"
        echo ""
    fi
}

# ============= Main Menu =============
show_menu() {
    clear
    print_header "🏠 Homelab Management"

    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Not configured - Setup will run automatically"
        echo ""
        sleep 2
        run_complete_setup
        return
    fi

    echo "1)  Start Services"
    echo "2)  Stop Services"
    echo "3)  Restart Services"
    echo "4)  Show Status"
    echo "5)  View Logs"
    echo "6)  Show URLs"
    echo "7)  Update Images"
    echo "8)  Deploy (GitHub Actions)"
    echo "9)  Backup Configuration"
    echo "10) System Cleanup"
    echo "11) Re-run Setup Wizard"
    echo "12) Exit"
    echo ""
    read -p "Choose an option: " choice
}

# ============= Main Execution =============
main() {
    # Parse command line arguments for --config flag first
    while [[ $# -gt 0 ]]; do
        case $1 in
            --config)
                CONFIG_FILE="$2"
                if [ -z "$CONFIG_FILE" ]; then
                    print_error "--config requires a file path argument"
                    exit 1
                fi
                load_config_file "$CONFIG_FILE"
                shift 2
                ;;
            *)
                break
                ;;
        esac
    done

    # Check if not configured - force setup
    if [ ! -f "$ENV_FILE" ] && [ "$1" != "--help" ] && [ "$1" != "-h" ]; then
        run_complete_setup
        exit 0
    fi

    # Handle command line arguments
    case "${1:-}" in
        start)
            start_services "${2:-}"
            exit 0
            ;;
        stop)
            stop_services
            exit 0
            ;;
        restart)
            restart_services "${2:-}"
            exit 0
            ;;
        status)
            show_status
            exit 0
            ;;
        logs)
            show_logs "${2:-}"
            exit 0
            ;;
        urls)
            show_urls
            exit 0
            ;;
        update)
            update_images
            exit 0
            ;;
        backup)
            backup_config
            exit 0
            ;;
        deploy)
            quick_deploy
            exit 0
            ;;
        cleanup)
            cleanup_system
            exit 0
            ;;
        setup)
            rm -f "$SETUP_STATE_FILE"
            run_complete_setup
            exit 0
            ;;
        --help|-h)
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "First Run:"
            echo "  Just run ./homelab.sh - setup wizard will start automatically"
            echo ""
            echo "Commands:"
            echo "  setup            - Re-run complete setup wizard"
            echo "  start [service]  - Start all or specific services"
            echo "  stop             - Stop all services"
            echo "  restart [service]- Restart services"
            echo "  status           - Show service status"
            echo "  logs [service]   - View logs"
            echo "  urls             - Show service URLs"
            echo "  update           - Update Docker images"
            echo "  deploy           - Deploy via GitHub Actions"
            echo "  backup           - Backup configuration"
            echo "  cleanup          - Clean Docker system"
            echo ""
            echo "Interactive mode: run without arguments"
            exit 0
            ;;
    esac

    # Interactive menu mode
    while true; do
        show_menu

        case $choice in
            1)
                echo "Enter services to start (leave blank for all):"
                read services
                start_services "$services"
                ;;
            2)
                stop_services
                ;;
            3)
                echo "Enter services to restart (leave blank for all):"
                read services
                restart_services "$services"
                ;;
            4)
                show_status
                ;;
            5)
                echo "Enter service name (leave blank for all):"
                read service
                show_logs "$service"
                ;;
            6)
                show_urls
                ;;
            7)
                update_images
                ;;
            8)
                quick_deploy
                ;;
            9)
                backup_config
                ;;
            10)
                cleanup_system
                ;;
            11)
                rm -f "$SETUP_STATE_FILE"
                run_complete_setup
                ;;
            12)
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac

        if [ "$choice" != "12" ]; then
            echo ""
            read -p "Press Enter to continue..."
        fi
    done
}

# Run main function
main "$@"