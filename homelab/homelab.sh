#!/bin/bash

# Homelab Management Script
# Simplified management for Docker homelab stack
# Version: 2.0

set -e

# ============= Configuration =============
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

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

# ============= Docker Functions =============
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Run: ./install-fresh.sh"
        return 1
    fi
    if ! docker ps &> /dev/null; then
        print_error "Docker daemon not running or no permissions"
        print_info "Try: sudo systemctl start docker"
        print_info "Or: newgrp docker (if just added to group)"
        return 1
    fi
    return 0
}

# ============= Service Management =============
start_services() {
    print_header "Starting Services"
    check_docker || return 1

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
    print_header "Stopping Services"
    check_docker || return 1

    print_info "Stopping all services..."
    docker compose down
    print_success "Services stopped"
}

restart_services() {
    print_header "Restarting Services"
    stop_services
    start_services "$1"
}

show_status() {
    print_header "Service Status"
    check_docker || return 1

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
    local service="${1:-}"
    check_docker || return 1

    if [ -z "$service" ]; then
        docker compose logs -f --tail=100
    else
        docker compose logs -f --tail=100 "$service"
    fi
}

show_urls() {
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
    echo -e "${CYAN}Media Stack:${NC}"
    echo "  Radarr:          http://localhost:7878"
    echo "  Sonarr:          http://localhost:8989"
    echo "  Prowlarr:        http://localhost:9696"
    echo "  Jellyseerr:      http://localhost:5055"
    echo "  qBittorrent:     http://localhost:8090"
}

update_images() {
    print_header "Updating Docker Images"
    check_docker || return 1

    print_info "Pulling latest images..."
    docker compose pull
    print_success "Images updated"
    print_warning "Restart services to use new images"
}

cleanup_system() {
    print_header "System Cleanup"
    check_docker || return 1

    print_warning "This will remove stopped containers and unused images"
    read -p "Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi

    print_info "Removing stopped containers..."
    docker container prune -f

    print_info "Removing unused images..."
    docker image prune -a -f

    print_info "Removing unused volumes..."
    docker volume prune -f

    print_success "Cleanup completed"
}

backup_config() {
    print_header "Backup Configuration"

    local backup_dir="$SCRIPT_DIR/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    print_info "Creating backup at: $backup_dir"

    # Backup essential files
    cp .env "$backup_dir/" 2>/dev/null || print_warning "No .env file found"
    cp docker-compose.yml "$backup_dir/"

    # Backup service configs (only if they exist and aren't too large)
    for service in glance homeassistant adguardhome traefik vaultwarden tailscale; do
        if [ -d "$service" ]; then
            print_info "Backing up $service config..."
            tar -czf "$backup_dir/$service.tar.gz" "$service" --exclude="*.log" --exclude="*.db-wal" --exclude="*.db-shm"
        fi
    done

    print_success "Backup completed: $backup_dir"
}

# ============= Quick Actions =============
quick_deploy() {
    print_header "Quick Deploy via GitHub Actions"

    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI not installed"
        return 1
    fi

    print_info "Triggering deployment workflow..."
    gh workflow run deploy-homelab --ref main

    print_success "Deployment triggered"
    print_info "Monitor with: gh run watch"
}

# ============= Main Menu =============
show_menu() {
    clear
    print_header "🏠 Homelab Management"

    echo "1)  Fresh Installation (New System)"
    echo "2)  Start Services"
    echo "3)  Stop Services"
    echo "4)  Restart Services"
    echo "5)  Show Status"
    echo "6)  View Logs"
    echo "7)  Show URLs"
    echo "8)  Update Images"
    echo "9)  Quick Deploy (GitHub Actions)"
    echo "10) Backup Configuration"
    echo "11) System Cleanup"
    echo "12) Exit"
    echo ""
    read -p "Choose an option: " choice
}

# ============= Main Execution =============
main() {
    # Handle command line arguments
    case "${1:-}" in
        install|fresh)
            exec "$SCRIPT_DIR/install-fresh.sh"
            ;;
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
        --help|-h)
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  install/fresh    - Run fresh installation wizard"
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
                exec "$SCRIPT_DIR/install-fresh.sh"
                ;;
            2)
                echo "Enter services to start (leave blank for all):"
                read services
                start_services "$services"
                ;;
            3)
                stop_services
                ;;
            4)
                echo "Enter services to restart (leave blank for all):"
                read services
                restart_services "$services"
                ;;
            5)
                show_status
                ;;
            6)
                echo "Enter service name (leave blank for all):"
                read service
                show_logs "$service"
                ;;
            7)
                show_urls
                ;;
            8)
                update_images
                ;;
            9)
                quick_deploy
                ;;
            10)
                backup_config
                ;;
            11)
                cleanup_system
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