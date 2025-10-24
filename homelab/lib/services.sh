#!/bin/bash
# Service Management Functions

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
