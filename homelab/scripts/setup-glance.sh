#!/bin/bash
# Glance Dashboard Setup Script for Homelab
# This script helps configure and verify Glance integration

set -e

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LIB_DIR="$SCRIPT_DIR/../lib"

# Source homelab libraries
source "$LIB_DIR/colors.sh"
source "$LIB_DIR/logging.sh"
source "$LIB_DIR/docker.sh"

# Configuration
GLANCE_DIR="./glance"
GLANCE_CONFIG="$GLANCE_DIR/glance.yml"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi

    # Check if running as appropriate user
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root. Consider running as non-root user with docker group membership"
    fi

    print_success "Prerequisites check complete"
}

# Create necessary directories
setup_directories() {
    print_status "Setting up directories..."

    # Create Glance directory
    if [ ! -d "$GLANCE_DIR" ]; then
        mkdir -p "$GLANCE_DIR"
        print_success "Created Glance directory"
    else
        print_status "Glance directory already exists"
    fi

    # Set proper permissions
    if [ -n "${PUID}" ] && [ -n "${PGID}" ]; then
        chown -R "${PUID}:${PGID}" "$GLANCE_DIR" 2>/dev/null || true
        print_success "Set directory permissions"
    fi
}

# Verify configuration file
verify_config() {
    print_status "Verifying Glance configuration..."

    if [ ! -f "$GLANCE_CONFIG" ]; then
        print_error "Glance configuration file not found at $GLANCE_CONFIG"
        print_status "Please ensure glance.yml is in place"
        exit 1
    fi

    # Basic YAML validation (if yq is available)
    if command -v yq &> /dev/null; then
        if yq eval '.' "$GLANCE_CONFIG" > /dev/null 2>&1; then
            print_success "Configuration file is valid YAML"
        else
            print_error "Configuration file has YAML syntax errors"
            exit 1
        fi
    else
        print_warning "yq not installed, skipping YAML validation"
    fi

    print_success "Configuration verified"
}

# Check network configuration
check_networks() {
    print_status "Checking Docker networks..."

    # Check if homelab network exists
    if docker network ls | grep -q "homelab"; then
        print_success "Homelab network exists"
    else
        print_warning "Homelab network not found, it will be created on docker-compose up"
    fi

    # Check if media network exists
    if docker network ls | grep -q "media"; then
        print_success "Media network exists"
    else
        print_warning "Media network not found, it will be created on docker-compose up"
    fi
}

# Update service URLs in config
update_service_urls() {
    print_status "Updating service URLs in configuration..."

    # Get host IP
    HOST_IP=$(hostname -I | awk '{print $1}')

    if [ -z "$HOST_IP" ]; then
        HOST_IP="localhost"
        print_warning "Could not determine host IP, using localhost"
    else
        print_status "Detected host IP: $HOST_IP"
    fi

    # Ask user if they want to use hostname or IP
    read -p "Use hostnames (recommended) or IP addresses? [h/i]: " choice

    if [[ "$choice" == "i" ]]; then
        print_status "Configuration will use IP addresses"
        # Update would happen here if needed
    else
        print_status "Configuration will use hostnames (.local domains)"
    fi

    print_success "Service URLs configured"
}

# Test service connectivity
test_connectivity() {
    print_status "Testing service connectivity..."

    # Define services to test
    declare -a services=(
        "homeassistant:8123:172.20.0.123"
        "jellyfin:8096:172.20.0.96"
        "adguardhome:82:172.20.0.53"
        "nginx-proxy-manager:81:172.20.0.81"
    )

    for service_info in "${services[@]}"; do
        IFS=':' read -r name port ip <<< "$service_info"

        # Check if container is running
        if docker ps | grep -q "$name"; then
            print_success "$name container is running"

            # Try to ping the service
            if docker exec glance ping -c 1 "$ip" &> /dev/null; then
                print_success "$name is reachable at $ip"
            else
                print_warning "$name container running but not reachable at $ip"
            fi
        else
            print_warning "$name container is not running"
        fi
    done
}

# Deploy Glance
deploy_glance() {
    print_status "Deploying Glance dashboard..."

    # Check if Glance is already running
    if docker ps | grep -q "glance"; then
        print_status "Glance is already running"
        read -p "Do you want to restart it? [y/n]: " restart
        if [[ "$restart" == "y" ]]; then
            compose_restart glance
            print_success "Glance restarted"
        fi
    else
        # Start Glance
        print_status "Starting Glance..."
        compose_up glance

        # Wait for container to be healthy
        print_status "Waiting for Glance to be healthy..."
        if ! wait_for_healthy "glance" 60 2; then
            print_warning "Glance health check timed out, but container may still be running"
        fi
    fi

    # Show access information
    print_success "Glance dashboard deployed successfully!"
    echo ""
    echo "========================================="
    echo "Access Glance at:"
    echo "  - http://localhost:8085"
    echo "  - http://${HOST_IP}:8085"
    echo "  - http://glance.local:8085 (if DNS configured)"
    echo "========================================="
}

# Configure local DNS (optional)
setup_local_dns() {
    print_status "Setting up local DNS entries..."

    read -p "Do you want to add local DNS entries to /etc/hosts? [y/n]: " add_dns

    if [[ "$add_dns" == "y" ]]; then
        # Backup hosts file
        sudo cp /etc/hosts /etc/hosts.backup.$(date +%Y%m%d%H%M%S)
        print_status "Backed up /etc/hosts"

        # Add entries if they don't exist
        declare -a dns_entries=(
            "172.20.0.85 glance.local"
            "172.20.0.81 npm.local"
            "172.20.0.96 jellyfin.local"
            "172.20.0.123 homeassistant.local"
            "172.20.0.22 vaultwarden.local"
        )

        for entry in "${dns_entries[@]}"; do
            if ! grep -q "$entry" /etc/hosts; then
                echo "$entry" | sudo tee -a /etc/hosts > /dev/null
                print_success "Added: $entry"
            else
                print_status "Entry already exists: $entry"
            fi
        done

        print_success "Local DNS entries configured"
    fi
}

# Verify deployment
verify_deployment() {
    print_status "Verifying Glance deployment..."

    # Check if container is running
    if docker ps | grep -q "glance"; then
        print_success "Glance container is running"
    else
        print_error "Glance container is not running"
        docker logs glance --tail 50
        exit 1
    fi

    # Check if web interface is accessible
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8085 | grep -q "200"; then
        print_success "Glance web interface is accessible"
    else
        print_warning "Glance web interface not responding on port 8085"
        print_status "Checking container logs..."
        docker logs glance --tail 20
    fi

    # Check network connectivity
    print_status "Checking network assignments..."
    docker inspect glance --format='{{range $net, $conf := .NetworkSettings.Networks}}{{$net}}: {{$conf.IPAddress}}{{println}}{{end}}'
}

# Main menu
show_menu() {
    echo ""
    echo "========================================="
    echo "    Glance Dashboard Setup Script"
    echo "========================================="
    echo "1. Full Setup (Recommended for first time)"
    echo "2. Verify Configuration"
    echo "3. Deploy/Restart Glance"
    echo "4. Test Service Connectivity"
    echo "5. Setup Local DNS"
    echo "6. Show Logs"
    echo "7. Exit"
    echo "========================================="
    read -p "Select an option [1-7]: " choice

    case $choice in
        1)
            check_prerequisites
            setup_directories
            verify_config
            check_networks
            update_service_urls
            deploy_glance
            setup_local_dns
            verify_deployment
            ;;
        2)
            verify_config
            check_networks
            ;;
        3)
            deploy_glance
            verify_deployment
            ;;
        4)
            test_connectivity
            ;;
        5)
            setup_local_dns
            ;;
        6)
            docker logs glance --tail 50 -f
            ;;
        7)
            print_status "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid option"
            show_menu
            ;;
    esac
}

# Main execution
main() {
    # Check if running in the correct directory
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "docker-compose.yml not found in current directory"
        print_status "Please run this script from the homelab directory"
        exit 1
    fi

    # Load environment variables
    if [ -f "$ENV_FILE" ]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
        print_status "Loaded environment variables"
    else
        print_warning ".env file not found, using defaults"
    fi

    # Show menu
    while true; do
        show_menu
    done
}

# Run main function
main "$@"