#!/bin/bash
# Docker Runtime Detection and Management

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
