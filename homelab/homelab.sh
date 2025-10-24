#!/bin/bash

# homelab Management Wizard
# Complete setup, management, and troubleshooting for Docker homelab stack
# Designed for Arch Linux with Docker

set -e

# ============= Configuration =============
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# ============= Colors =============
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============= Print Functions =============
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}   $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

# ============= OS Detection =============
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

# ============= Container Runtime Detection =============
check_container_runtime() {
    if command -v docker &> /dev/null; then
        COMPOSE_CMD="docker compose"
        RUNTIME="docker"
        print_success "Docker detected"
    else
        print_error "Docker is not installed"
        return 1
    fi
}

check_compose() {
    if ! command -v $COMPOSE_CMD &> /dev/null; then
        print_error "$COMPOSE_CMD is not installed"
        return 1
    fi
    print_success "$COMPOSE_CMD is installed"
}

setup_environment() {
    # Set XDG_RUNTIME_DIR if not set (for systemctl --user)
    if [ -z "$XDG_RUNTIME_DIR" ]; then
        export XDG_RUNTIME_DIR="/run/user/$(id -u)"
    fi
}

# ============= Installation Functions =============
install_arch() {
    print_header "Arch Linux Docker Installation"

    print_info "Updating system packages..."
    sudo pacman -Syu --noconfirm

    print_info "Installing Docker..."
    sudo pacman -S --noconfirm docker docker-buildx docker-compose
    sudo systemctl enable --now docker
    sudo usermod -aG docker $USER
    print_warning "Log out and back in for Docker group changes to take effect"
    print_success "Docker installed successfully"

    # Install tools
    sudo pacman -S --noconfirm git curl wget htop nano

    # Create directories
    create_directories

    # Setup environment file
    setup_env_file

    # Performance tuning
    print_info "Applying performance tuning..."
    echo 'fs.inotify.max_user_watches=524288' | sudo tee /etc/sysctl.d/99-inotify.conf
    echo 'vm.max_map_count=262144' | sudo tee /etc/sysctl.d/99-elasticsearch.conf
    sudo sysctl --system

    # Configure DNS for AdGuard Home
    configure_dns_for_adguard

    print_success "Installation complete!"
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

# ============= Service Management =============
clean_restart() {
    print_header "Clean Restart"

    print_warning "Stopping containers..."
    $COMPOSE_CMD down 2>&1 | grep -v "no container" || true

    print_warning "Removing old containers..."
    docker ps -a -q 2>/dev/null | xargs docker rm -f 2>/dev/null || true

    print_info "Waiting for ports to free up..."
    sleep 3

    print_warning "Starting services..."
    $COMPOSE_CMD up -d --remove-orphans

    print_success "Clean restart complete!"

    sleep 2
    show_status
}

start_services() {
    local services="$1"
    print_warning "Starting services..."

    if [ -z "$services" ]; then
        $COMPOSE_CMD up -d
    else
        $COMPOSE_CMD up -d $services
    fi

    print_success "Services started"
}

stop_services() {
    print_warning "Stopping services..."
    $COMPOSE_CMD down
    print_success "Services stopped"
}

show_status() {
    print_header "Service Status"
    $COMPOSE_CMD ps

    echo ""
    print_info "Service URLs:"
    echo "  Home Assistant:   http://localhost:8123"
    echo "  AdGuard Setup:    http://localhost:3000"
    echo "  AdGuard Web:      http://localhost:3080"
    echo "  Jellyfin:         http://localhost:8096"
    echo "  Ollama WebUI:     http://localhost:8081"
    echo "  Samba:            smb://localhost:1445"
}

show_logs() {
    local service="$1"
    if [ -z "$service" ]; then
        $COMPOSE_CMD logs -f
    else
        $COMPOSE_CMD logs -f "$service"
    fi
}

# ============= Cleanup Functions =============
cleanup() {
    print_header "Cleanup"

    print_warning "This will stop and remove all containers"
    read -p "Continue? (y/n): " confirm

    if [[ $confirm != "y" ]]; then
        print_info "Cleanup cancelled"
        return
    fi

    $COMPOSE_CMD down

    echo ""
    print_warning "Delete all data volumes?"
    echo "This will DELETE:"
    echo "  - Home Assistant config"
    echo "  - Jellyfin metadata"
    echo "  - All service configurations"
    read -p "Delete volumes? (yes/no): " delete_volumes

    if [[ $delete_volumes == "yes" ]]; then
        $COMPOSE_CMD down -v
        print_success "Volumes removed"
    else
        print_success "Volumes preserved"
    fi
}

# ============= Troubleshooting =============
troubleshoot() {
    print_header "Troubleshooting"

    echo "1) Check container status"
    echo "2) Check ports in use"
    echo "3) View service logs"
    echo "4) Test connectivity"
    echo "5) Fix permissions"
    echo "6) Back to main menu"
    echo ""
    read -p "Choose: " choice

    case $choice in
        1)
            docker ps -a
            read -p "Press Enter to continue..."
            troubleshoot
            ;;
        2)
            print_info "Checking ports..."
            ss -tuln 2>/dev/null | grep LISTEN || netstat -tuln | grep LISTEN
            read -p "Press Enter to continue..."
            troubleshoot
            ;;
        3)
            echo "Enter service name (or leave blank for all):"
            read service
            show_logs "$service"
            ;;
        4)
            print_info "Testing connectivity..."
            for port in 8123 3080 8096; do
                if timeout 2 bash -c "echo > /dev/tcp/localhost/$port" 2>/dev/null; then
                    print_success "Port $port is responding"
                else
                    print_warning "Port $port not responding"
                fi
            done
            read -p "Press Enter to continue..."
            troubleshoot
            ;;
        5)
            print_info "Fixing permissions..."
            sudo chown -R $USER:$USER ./
            if [ -d "/data" ]; then
                sudo chown -R $USER:$USER /data
            fi
            print_success "Permissions fixed"
            read -p "Press Enter to continue..."
            troubleshoot
            ;;
        6)
            return
            ;;
    esac
}

# ============= Setup Wizard =============
setup_wizard() {
    print_header "Setup Wizard"

    # Check prerequisites
    print_info "Checking prerequisites..."
    if ! check_container_runtime; then
        print_error "Container runtime not found"
        echo ""
        read -p "Install on Arch Linux now? (y/n): " install
        if [[ $install == "y" ]]; then
            install_arch
            check_container_runtime
        else
            return 1
        fi
    fi

    if ! check_compose; then
        print_error "Compose tool not found"
        return 1
    fi

    setup_environment

    # Setup directories
    create_directories

    # Setup environment
    setup_env_file

    # Check passwords
    if [ -f "$SCRIPT_DIR/.env" ] && grep -q "CHANGE_THIS_PASSWORD\|changeme\|password123" "$SCRIPT_DIR/.env" 2>/dev/null; then
        print_error "Default passwords found in .env!"
        print_warning "MUST edit .env and change passwords"
        read -p "Open .env in editor now? (y/n): " edit_env
        if [[ $edit_env == "y" ]]; then
            ${EDITOR:-nano} "$SCRIPT_DIR/.env"
        fi
    fi

    # Service selection
    echo ""
    print_info "Which services to start?"
    echo "1) All services (Core + Media Stack)"
    echo "2) Core only (Home Assistant, AdGuard, Jellyfin, Ollama)"
    echo "3) Custom selection"
    read -p "Choose (1-3): " choice

    case $choice in
        1)
            clean_restart
            ;;
        2)
            start_services "homeassistant adguardhome ollama ollama-webui jellyfin samba tailscale"
            ;;
        3)
            echo "Enter service names (space-separated):"
            read services
            start_services "$services"
            ;;
    esac

    echo ""
    print_success "Setup complete!"
    show_status
}

# ============= Main Menu =============
main_menu() {
    clear
    print_header "homelab Management"
    echo -e "${CYAN}Detected: $OS${NC}"
    echo ""
    echo "1)  Setup Wizard (First Time Setup)"
    echo "2)  Clean Restart (Fix Port Conflicts)"
    echo "3)  Start All Services"
    echo "4)  Stop All Services"
    echo "5)  Show Status"
    echo "6)  View Logs"
    echo "7)  Troubleshooting"
    echo "8)  Cleanup (Remove Containers)"
    echo "9)  Update Images"
    echo "10) Install (Arch Linux)"
    echo "11) Exit"
    echo ""
    read -p "Choose an option: " choice
}

# ============= Main Execution =============
main() {
    detect_os
    setup_environment

    # Command line mode
    if [ $# -gt 0 ]; then
        case $1 in
            setup|wizard)
                setup_wizard
                ;;
            start)
                check_container_runtime && check_compose
                start_services "$2"
                ;;
            stop)
                check_container_runtime && check_compose
                stop_services
                ;;
            restart|clean)
                check_container_runtime && check_compose
                clean_restart
                ;;
            status)
                check_container_runtime && check_compose
                show_status
                ;;
            logs)
                check_container_runtime && check_compose
                show_logs "$2"
                ;;
            install)
                install_arch
                ;;
            cleanup)
                check_container_runtime && check_compose
                cleanup
                ;;
            *)
                echo "Usage: $0 [setup|start|stop|restart|status|logs|install|cleanup]"
                exit 1
                ;;
        esac
        exit 0
    fi

    # Interactive mode
    while true; do
        main_menu

        case $choice in
            1)
                setup_wizard
                ;;
            2)
                check_container_runtime && check_compose && clean_restart
                ;;
            3)
                check_container_runtime && check_compose && start_services ""
                ;;
            4)
                check_container_runtime && check_compose && stop_services
                ;;
            5)
                check_container_runtime && check_compose && show_status
                ;;
            6)
                check_container_runtime && check_compose
                echo "Enter service name (or leave blank for all):"
                read service
                show_logs "$service"
                ;;
            7)
                check_container_runtime && check_compose && troubleshoot
                ;;
            8)
                check_container_runtime && check_compose && cleanup
                ;;
            9)
                check_container_runtime && check_compose
                print_info "Pulling latest images..."
                $COMPOSE_CMD pull
                print_success "Images updated"
                ;;
            10)
                install_arch
                ;;
            11)
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac

        if [ "$choice" != "11" ]; then
            echo ""
            read -p "Press Enter to continue..."
        fi
    done
}

main "$@"
