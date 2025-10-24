#!/bin/bash
# Docker Runtime Detection and Management

# Get script directory to source dependencies
DOCKER_LIB_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Source logging if not already loaded
if ! command -v log &> /dev/null; then
    source "$DOCKER_LIB_DIR/logging.sh"
fi

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

# ============= Docker Compose Wrapper Functions =============

compose_up() {
    $COMPOSE_CMD up -d "$@"
}

compose_down() {
    $COMPOSE_CMD down "$@"
}

compose_pull() {
    $COMPOSE_CMD pull "$@"
}

compose_logs() {
    $COMPOSE_CMD logs "$@"
}

compose_ps() {
    $COMPOSE_CMD ps "$@"
}

compose_restart() {
    $COMPOSE_CMD restart "$@"
}

compose_config() {
    $COMPOSE_CMD config "$@"
}

# ============= Container Management =============

# Stop container by name
stop_container_by_name() {
    local container_name="$1"

    if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
        log "Stopping container: $container_name"
        docker stop "$container_name" 2>/dev/null || true
        docker rm "$container_name" 2>/dev/null || true
        return 0
    else
        info "Container $container_name not found"
        return 1
    fi
}

# Stop multiple containers by name
stop_containers() {
    local containers="$@"

    for container in $containers; do
        stop_container_by_name "$container"
    done
}

# Check if container is running
check_container_running() {
    local container_name="$1"

    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        return 0
    else
        return 1
    fi
}

# Get container health status
get_container_health() {
    local container_name="$1"

    docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "unknown"
}

# ============= Health Check Functions =============

# Check service health (enhanced version from homelab/scripts/deploy.sh)
check_service_health() {
    local service=$1
    local max_retries=${2:-5}
    local delay=${3:-10}

    log "Checking health of service: $service"

    for i in $(seq 1 $max_retries); do
        # Check if container is running
        local status=$(docker-compose ps -q "$service" 2>/dev/null | xargs -r docker inspect -f '{{.State.Status}}' 2>/dev/null)

        if [ "$status" = "running" ]; then
            # Additional health check if the container has a healthcheck defined
            local health_status=$(docker-compose ps -q "$service" 2>/dev/null | xargs -r docker inspect -f '{{.State.Health.Status}}' 2>/dev/null)

            if [ -z "$health_status" ] || [ "$health_status" = "null" ] || [ "$health_status" = "healthy" ]; then
                success "Service $service is healthy"
                return 0
            elif [ "$health_status" = "starting" ]; then
                warning "Service $service is still starting (attempt $i/$max_retries)"
            else
                warning "Service $service health status: $health_status (attempt $i/$max_retries)"
            fi
        else
            warning "Service $service status: ${status:-not running} (attempt $i/$max_retries)"
        fi

        [ $i -lt $max_retries ] && sleep $delay
    done

    error "Service $service failed health check after $max_retries attempts"
    return 1
}

# Wait for container to be healthy
wait_for_healthy() {
    local container_name="$1"
    local max_wait=${2:-60}
    local check_interval=${3:-2}

    log "Waiting for $container_name to be healthy (max ${max_wait}s)..."

    local elapsed=0
    while [ $elapsed -lt $max_wait ]; do
        local health=$(get_container_health "$container_name")

        case "$health" in
            "healthy")
                success "$container_name is healthy"
                return 0
                ;;
            "unhealthy")
                error "$container_name is unhealthy"
                return 1
                ;;
            "starting"|"unknown")
                echo -n "."
                sleep $check_interval
                elapsed=$((elapsed + check_interval))
                ;;
            *)
                warning "Unknown health status: $health"
                sleep $check_interval
                elapsed=$((elapsed + check_interval))
                ;;
        esac
    done

    echo ""
    error "$container_name health check timed out after ${max_wait}s"
    return 1
}

# Check multiple services health
check_critical_services() {
    local services="$@"
    local all_healthy=true

    for service in $services; do
        if docker-compose ps --services | grep -q "^$service$"; then
            if ! check_service_health "$service"; then
                all_healthy=false
            fi
        else
            info "Service $service not found in compose file, skipping"
        fi
    done

    if [ "$all_healthy" = "true" ]; then
        return 0
    else
        return 1
    fi
}
