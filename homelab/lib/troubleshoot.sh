#!/bin/bash
# Troubleshooting Functions

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
