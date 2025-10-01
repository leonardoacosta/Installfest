#!/bin/bash

# Homeserver Stack Manager Script
# Manages Home Assistant, AdGuard, Jellyfin, Ollama, Media Stack, and more

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Functions
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

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}   $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

# Detect OS and distribution
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/arch-release ]; then
            OS="Arch Linux"
        elif [ -f /etc/debian_version ]; then
            OS="Debian/Ubuntu"
        elif [ -f /etc/fedora-release ]; then
            OS="Fedora"
        else
            OS="Linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
    else
        OS="Unknown"
    fi
}

# Check if podman or docker is installed
check_container_runtime() {
    if command -v podman &> /dev/null; then
        COMPOSE_CMD="podman-compose"
        RUNTIME="podman"
        print_success "Podman detected"
    elif command -v docker &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        RUNTIME="docker"
        print_success "Docker detected"
    else
        print_error "Neither Podman nor Docker is installed"
        echo "Install one of them:"
        
        # Detect OS and provide appropriate instructions
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            if [ -f /etc/arch-release ]; then
                echo "  Arch Linux:"
                echo "    Podman: sudo pacman -S podman podman-compose"
                echo "    Docker: sudo pacman -S docker docker-compose"
            elif [ -f /etc/debian_version ]; then
                echo "  Debian/Ubuntu:"
                echo "    Podman: sudo apt install podman podman-compose"
                echo "    Docker: sudo apt install docker.io docker-compose"
            elif [ -f /etc/fedora-release ]; then
                echo "  Fedora:"
                echo "    Podman: sudo dnf install podman podman-compose"
                echo "    Docker: sudo dnf install docker docker-compose"
            else
                echo "  Linux: Check your distribution's package manager"
            fi
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  macOS: brew install podman podman-compose"
            echo "  or:    brew install docker docker-compose"
        fi
        exit 1
    fi
}

# Check if compose is installed
check_compose() {
    if ! command -v $COMPOSE_CMD &> /dev/null; then
        print_error "$COMPOSE_CMD is not installed"
        if [ "$RUNTIME" = "podman" ]; then
            if [[ "$OSTYPE" == "linux-gnu"* ]] && [ -f /etc/arch-release ]; then
                echo "Install it: sudo pacman -S podman-compose"
            elif [[ "$OSTYPE" == "darwin"* ]]; then
                echo "Install it: brew install podman-compose"
            else
                echo "Install it using your package manager or pip: pip install podman-compose"
            fi
        else
            if [[ "$OSTYPE" == "linux-gnu"* ]] && [ -f /etc/arch-release ]; then
                echo "Install it: sudo pacman -S docker-compose"
            elif [[ "$OSTYPE" == "darwin"* ]]; then
                echo "Install it: brew install docker-compose"
            else
                echo "Install it using your package manager"
            fi
        fi
        exit 1
    fi
    print_success "$COMPOSE_CMD is installed"
}

# Check if Podman/Docker daemon is running
check_runtime_daemon() {
    if [ "$RUNTIME" = "podman" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS specific podman machine check
            if ! podman machine list | grep -q "Currently running"; then
                print_warning "Podman machine is not running. Starting it..."
                podman machine start
                print_success "Podman machine started"
            else
                print_success "Podman machine is running"
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Set XDG_RUNTIME_DIR if not set (needed for systemctl --user)
            if [ -z "$XDG_RUNTIME_DIR" ]; then
                export XDG_RUNTIME_DIR="/run/user/$(id -u)"
            fi

            # Linux podman socket check
            if systemctl --user is-active --quiet podman.socket 2>/dev/null; then
                print_success "Podman socket is active"
            else
                print_warning "Podman socket check failed (this is OK for rootless Podman)"
                print_info "Podman will work without the socket service"
                # Don't try to start it, might not have session bus
            fi
        fi
    elif [ "$RUNTIME" = "docker" ]; then
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux docker daemon check
            if ! systemctl is-active --quiet docker; then
                print_warning "Docker daemon is not running. Starting it..."
                sudo systemctl start docker
                print_success "Docker daemon started"
            else
                print_success "Docker daemon is running"
            fi
            
            # Check if user is in docker group
            if ! groups | grep -q docker; then
                print_warning "User is not in docker group"
                echo "Run: sudo usermod -aG docker $USER"
                echo "Then log out and back in"
            fi
        fi
    fi
}

# Setup required directories
setup_directories() {
    print_header "Setting Up Directories"
    
    # Service config directories
    local dirs=(
        "homeassistant"
        "adguardhome/work"
        "adguardhome/conf"
        "jellyfin/config"
        "jellyfin/cache"
        "tailscale/state"
        "radarr"
        "sonarr"
        "lidarr"
        "bazarr"
        "prowlarr"
        "jellyseerr"
        "qbittorrent"
        "nzbget"
        "gluetun"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "Created $dir"
        else
            print_info "$dir already exists"
        fi
    done
    
    # Create .env if it doesn't exist
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        if [ -f "$SCRIPT_DIR/env.example" ]; then
            print_warning "No .env file found. Creating from template..."
            cp "$SCRIPT_DIR/env.example" "$SCRIPT_DIR/.env"
            print_warning "IMPORTANT: Edit .env and update all passwords and paths!"
            read -p "Press Enter to continue after editing .env..."
        else
            print_warning "No env.example found, creating minimal .env file..."
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
            read -p "Press Enter to continue after editing .env..."
        fi
    else
        print_success ".env file exists"
    fi
    
    # Check if media directories need to be created
    if [ -f "$SCRIPT_DIR/.env" ]; then
        source "$SCRIPT_DIR/.env"
        
        # Create media directories if they don't exist
        if [ -n "$MEDIA_PATH" ] && [ ! -d "$MEDIA_PATH" ]; then
            print_warning "Creating media directory: $MEDIA_PATH"
            sudo mkdir -p "$MEDIA_PATH"/{movies,tv,music}
            sudo chown -R $USER:$USER "$MEDIA_PATH"
            
            # For Arch Linux with Podman rootless
            if [[ "$OSTYPE" == "linux-gnu"* ]] && [ "$RUNTIME" = "podman" ]; then
                print_info "Setting rootless permissions for Podman"
                podman unshare chown -R 1000:1000 "$MEDIA_PATH" 2>/dev/null || true
            fi
        fi
        
        if [ -n "$DOWNLOADS_PATH" ] && [ ! -d "$DOWNLOADS_PATH" ]; then
            print_warning "Creating downloads directory: $DOWNLOADS_PATH"
            sudo mkdir -p "$DOWNLOADS_PATH"/{complete,incomplete}
            sudo chown -R $USER:$USER "$DOWNLOADS_PATH"
            
            # For Arch Linux with Podman rootless
            if [[ "$OSTYPE" == "linux-gnu"* ]] && [ "$RUNTIME" = "podman" ]; then
                podman unshare chown -R 1000:1000 "$DOWNLOADS_PATH" 2>/dev/null || true
            fi
        fi
    fi
}

# Service management functions
start_services() {
    local services="$1"
    if [ -z "$services" ]; then
        print_warning "Starting all services..."
        $COMPOSE_CMD up -d 2>&1 | tee /tmp/compose-start.log

        # Check for errors in the output
        if grep -qi "error\|failed" /tmp/compose-start.log; then
            print_error "Some services failed to start. Check logs above."
            return 1
        fi
    else
        print_warning "Starting services: $services"
        $COMPOSE_CMD up -d $services 2>&1 | tee /tmp/compose-start.log

        if grep -qi "error\|failed" /tmp/compose-start.log; then
            print_error "Some services failed to start. Check logs above."
            return 1
        fi
    fi
    print_success "Services started (or already running)"
}

stop_services() {
    local services="$1"
    if [ -z "$services" ]; then
        print_warning "Stopping all services..."
        $COMPOSE_CMD down
    else
        print_warning "Stopping services: $services"
        $COMPOSE_CMD stop $services
    fi
    print_success "Services stopped"
}

restart_services() {
    local services="$1"
    if [ -z "$services" ]; then
        print_warning "Restarting all services..."
        $COMPOSE_CMD restart
    else
        print_warning "Restarting services: $services"
        $COMPOSE_CMD restart $services
    fi
    print_success "Services restarted"
}

# Show service URLs
show_urls() {
    print_header "Service URLs"
    echo -e "${CYAN}Core Services:${NC}"
    echo "  Home Assistant:    http://localhost:8123"
    echo "  AdGuard Home:      http://localhost:80 (setup: port 3000)"
    echo "  Ollama WebUI:      http://localhost:8081"
    echo "  Jellyfin:          http://localhost:8096"
    echo "  Samba (SMB):       smb://localhost"
    echo ""
    echo -e "${CYAN}Media Stack:${NC}"
    echo "  Radarr:            http://localhost:7878"
    echo "  Sonarr:            http://localhost:8989"
    echo "  Lidarr:            http://localhost:8686"
    echo "  Bazarr:            http://localhost:6767"
    echo "  Prowlarr:          http://localhost:9696"
    echo "  qBittorrent:       http://localhost:8080"
    echo "  NZBGet:            http://localhost:6789"
    echo "  Jellyseerr:        http://localhost:5055"
    echo "  Flaresolverr:      http://localhost:8191"
}

# Show service status with health checks
show_status() {
    print_header "Service Status"
    $COMPOSE_CMD ps
    
    # For Arch Linux, also show systemd user services status if using Podman
    if [[ "$OS" == "Arch Linux" ]] && [ "$RUNTIME" = "podman" ]; then
        echo ""
        print_info "Podman socket status:"
        systemctl --user status podman.socket --no-pager 2>/dev/null || true
    fi
    
    echo ""
    print_info "Checking service health..."
    
    # Check key services by port (avoid hardcoding container names)
    services=("Home Assistant:8123" "AdGuard:80" "Jellyfin:8096" "Ollama WebUI:8081")

    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        if timeout 2 bash -c "echo > /dev/tcp/localhost/$port" 2>/dev/null; then
            print_success "$name is responding on port $port"
        else
            print_warning "$name may not be ready on port $port (or not started)"
        fi
    done
}

# Pull model for Ollama
pull_ollama_model() {
    print_header "Pull Ollama Model"
    echo "Available models: llama3, llama2, codellama, mistral, neural-chat, phi"
    read -p "Enter model name to pull: " model
    
    if [ -n "$model" ]; then
        print_info "Pulling $model..."
        $RUNTIME exec -it ollama ollama pull $model
        print_success "Model $model pulled successfully"
    else
        print_warning "No model specified"
    fi
}

# Quick setup wizard
setup_wizard() {
    print_header "Quick Setup Wizard"
    
    echo "This wizard will help you set up the homeserver stack."
    echo ""
    
    # Check prerequisites
    print_info "Checking prerequisites..."
    check_container_runtime
    check_compose
    check_runtime_daemon
    
    # Setup directories
    setup_directories
    
    # Check .env file
    print_info "Checking environment configuration..."
    if [ -f "$SCRIPT_DIR/.env" ] && grep -q "changeme\|password123" "$SCRIPT_DIR/.env" 2>/dev/null; then
        print_error "Default passwords found in .env!"
        print_warning "Please edit .env and change all passwords"
        read -p "Open .env in editor? (y/n): " edit_env
        if [[ $edit_env == "y" ]]; then
            ${EDITOR:-nano} "$SCRIPT_DIR/.env"
        fi
    fi
    
    # Ask which services to start
    print_info "Which services would you like to start?"
    echo "1) All services"
    echo "2) Core only (Home Assistant, AdGuard, Jellyfin, Ollama)"
    echo "3) Media stack only (*arr services)"
    echo "4) Custom selection"
    read -p "Choose (1-4): " choice
    
    case $choice in
        1)
            start_services ""
            ;;
        2)
            start_services "homeassistant adguardhome ollama ollama-webui jellyfin samba"
            ;;
        3)
            start_services "gluetun qbittorrent prowlarr radarr sonarr lidarr bazarr jellyseerr"
            ;;
        4)
            echo "Enter service names (space-separated):"
            read -p "> " custom_services
            start_services "$custom_services"
            ;;
        *)
            print_warning "Invalid choice, starting all services"
            start_services ""
            ;;
    esac
    
    echo ""
    show_urls
    echo ""
    print_success "Setup complete! Services are starting up..."
    print_info "Some services may take a few minutes to be fully ready"
}

# Main menu
show_menu() {
    print_header "Homeserver Stack Manager"
    echo "1)  Start all services"
    echo "2)  Stop all services"
    echo "3)  Restart all services"
    echo "4)  Show service status"
    echo "5)  Show service URLs"
    echo "6)  View logs (all)"
    echo "7)  View logs (specific service)"
    echo "8)  Start specific services"
    echo "9)  Stop specific services"
    echo "10) Pull Ollama model"
    echo "11) Update all images"
    echo "12) Run setup wizard"
    echo "13) Backup configurations"
    echo "14) Clean up (remove volumes)"
    echo "15) Exit"
    echo ""
    read -p "Choose an option: " choice
}

# Backup configurations
backup_configs() {
    print_header "Backup Configuration"
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="homeserver_backup_${timestamp}.tar.gz"
    
    print_warning "Creating backup: $backup_file"
    
    tar -czf "$backup_file" \
        --exclude='*/cache' \
        --exclude='*/logs' \
        --exclude='*/transcodes' \
        --exclude='*/metadata' \
        homeassistant/ adguardhome/ jellyfin/ radarr/ sonarr/ lidarr/ \
        bazarr/ prowlarr/ qbittorrent/ nzbget/ jellyseerr/ .env \
        2>/dev/null || true
    
    if [ -f "$backup_file" ]; then
        size=$(du -h "$backup_file" | cut -f1)
        print_success "Backup created: $backup_file ($size)"
    else
        print_error "Backup failed"
    fi
}

# Execute menu choice
execute_choice() {
    case $1 in
        1) start_services "" ;;
        2) stop_services "" ;;
        3) restart_services "" ;;
        4) show_status ;;
        5) show_urls ;;
        6) 
            print_info "Showing logs (Ctrl+C to exit)..."
            $COMPOSE_CMD logs -f
            ;;
        7)
            $COMPOSE_CMD ps --services
            read -p "Enter service name: " service
            print_info "Showing logs for $service (Ctrl+C to exit)..."
            $COMPOSE_CMD logs -f $service
            ;;
        8)
            $COMPOSE_CMD ps --services --all
            read -p "Enter services to start (space-separated): " services
            start_services "$services"
            ;;
        9)
            $COMPOSE_CMD ps --services
            read -p "Enter services to stop (space-separated): " services
            stop_services "$services"
            ;;
        10) pull_ollama_model ;;
        11)
            print_warning "Pulling latest images..."
            $COMPOSE_CMD pull
            print_success "Images updated. Restart services to apply."
            ;;
        12) setup_wizard ;;
        13) backup_configs ;;
        14)
            print_error "This will DELETE all data volumes!"
            read -p "Are you sure? Type 'yes' to confirm: " confirm
            if [ "$confirm" = "yes" ]; then
                $COMPOSE_CMD down -v
                print_success "Cleanup complete"
            else
                print_info "Cleanup cancelled"
            fi
            ;;
        15)
            print_success "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option"
            ;;
    esac
}

# Main execution
main() {
    # Detect operating system
    detect_os
    # Check if running with arguments
    if [ $# -gt 0 ]; then
        case $1 in
            start) start_services "$2" ;;
            stop) stop_services "$2" ;;
            restart) restart_services "$2" ;;
            status) show_status ;;
            urls) show_urls ;;
            logs) 
                if [ -n "$2" ]; then
                    $COMPOSE_CMD logs -f "$2"
                else
                    $COMPOSE_CMD logs -f
                fi
                ;;
            wizard) setup_wizard ;;
            backup) backup_configs ;;
            *)
                echo "Usage: $0 [start|stop|restart|status|urls|logs|wizard|backup] [service_name]"
                exit 1
                ;;
        esac
        exit 0
    fi
    
    # Interactive mode
    clear
    print_header "Welcome to Homeserver Stack Manager"
    print_info "Detected OS: $OS"
    
    # Initial checks
    check_container_runtime
    check_compose
    check_runtime_daemon
    
    # Menu loop
    while true; do
        show_menu
        execute_choice $choice
        if [ "$choice" != "15" ]; then
            echo ""
            read -p "Press Enter to continue..."
        fi
    done
}

# Run main function
main "$@"