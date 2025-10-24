#!/bin/bash

# homelab Management Wizard
# Complete setup, management, and troubleshooting for Docker homelab stack
# Designed for Arch Linux with Docker

set -e

# ============= Configuration =============
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# ============= Load Library Functions =============
source "$SCRIPT_DIR/lib/colors.sh"
source "$SCRIPT_DIR/lib/system.sh"
source "$SCRIPT_DIR/lib/docker.sh"
source "$SCRIPT_DIR/lib/services.sh"
source "$SCRIPT_DIR/lib/config.sh"
source "$SCRIPT_DIR/lib/install.sh"
source "$SCRIPT_DIR/lib/troubleshoot.sh"
source "$SCRIPT_DIR/lib/services-setup.sh"

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

    # Configure service-specific system requirements
    configure_service_requirements

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
    echo "2)  Configure Services (Vaultwarden, Glance)"
    echo "3)  Clean Restart (Fix Port Conflicts)"
    echo "4)  Start All Services"
    echo "5)  Stop All Services"
    echo "6)  Show Status"
    echo "7)  View Logs"
    echo "8)  Troubleshooting"
    echo "9)  Cleanup (Remove Containers)"
    echo "10) Update Images"
    echo "11) Install (Arch Linux)"
    echo "12) Exit"
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
                check_container_runtime && check_compose && service_setup_menu
                ;;
            3)
                check_container_runtime && check_compose && clean_restart
                ;;
            4)
                check_container_runtime && check_compose && start_services ""
                ;;
            5)
                check_container_runtime && check_compose && stop_services
                ;;
            6)
                check_container_runtime && check_compose && show_status
                ;;
            7)
                check_container_runtime && check_compose
                echo "Enter service name (or leave blank for all):"
                read service
                show_logs "$service"
                ;;
            8)
                check_container_runtime && check_compose && troubleshoot
                ;;
            9)
                check_container_runtime && check_compose && cleanup
                ;;
            10)
                check_container_runtime && check_compose
                print_info "Pulling latest images..."
                $COMPOSE_CMD pull
                print_success "Images updated"
                ;;
            11)
                install_arch
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

main "$@"
