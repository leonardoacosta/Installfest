#!/bin/bash
# Common Utilities for Homelab Scripts
# Shared functions and variables used across multiple scripts

# ============= Color Definitions =============
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export CYAN='\033[0;36m'
export MAGENTA='\033[0;35m'
export NC='\033[0m' # No Color

# ============= Printing Functions =============
print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ${CYAN}$1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
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

# Legacy aliases for compatibility
log() { print_info "$@"; }
info() { print_info "$@"; }
warning() { print_warning "$@"; }
error() { print_error "$@"; }
success() { print_success "$@"; }
print_status() { print_step "$@"; }

# ============= Docker/Compose Functions =============
# Detect compose command (docker-compose vs docker compose)
get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        return 1
    fi
}

# Compose wrapper functions
compose_up() {
    local cmd=$(get_compose_cmd)
    $cmd up -d "$@"
}

compose_down() {
    local cmd=$(get_compose_cmd)
    $cmd down "$@"
}

compose_ps() {
    local cmd=$(get_compose_cmd)
    $cmd ps "$@"
}

compose_pull() {
    local cmd=$(get_compose_cmd)
    $cmd pull "$@"
}

compose_logs() {
    local cmd=$(get_compose_cmd)
    $cmd logs "$@"
}

compose_config() {
    local cmd=$(get_compose_cmd)
    $cmd config "$@"
}

# Check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        return 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running or you don't have permission"
        print_info "Try: sudo systemctl start docker"
        print_info "Or: sudo usermod -aG docker $USER && newgrp docker"
        return 1
    fi

    return 0
}

# Check if compose is available
check_compose() {
    if ! get_compose_cmd &> /dev/null; then
        print_error "Docker Compose is not installed"
        return 1
    fi
    return 0
}

# Combined check for container runtime
check_container_runtime() {
    check_docker && check_compose
}

# Check service health
check_service_health() {
    local service="$1"
    local retries="${2:-5}"
    local delay="${3:-10}"

    for i in $(seq 1 $retries); do
        local container_id=$(compose_ps -q "$service" 2>/dev/null)

        if [ -z "$container_id" ]; then
            print_warning "Service $service has no container (attempt $i/$retries)"
        else
            local status=$(docker inspect -f '{{.State.Status}}' "$container_id" 2>/dev/null)

            if [ "$status" = "running" ]; then
                local health=$(docker inspect -f '{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "no healthcheck")

                if [ "$health" = "healthy" ] || [ "$health" = "no healthcheck" ]; then
                    print_success "Service $service is running"
                    return 0
                else
                    print_warning "Service $service health: $health (attempt $i/$retries)"
                fi
            else
                print_warning "Service $service status: $status (attempt $i/$retries)"
            fi
        fi

        [ $i -lt $retries ] && sleep $delay
    done

    return 1
}

# Check multiple critical services
check_critical_services() {
    local all_healthy=true

    for service in "$@"; do
        if ! check_service_health "$service"; then
            print_error "Service $service failed health check"
            all_healthy=false
        fi
    done

    [ "$all_healthy" = true ]
}

# ============= Backup Functions =============
# Create backup of current configuration
create_backup() {
    local backup_dir="${BACKUP_DIR:-./backups}"
    local timestamp="${TIMESTAMP:-$(date +%Y%m%d_%H%M%S)}"
    local backup_path="$backup_dir/backup_$timestamp"

    print_info "Creating backup at $backup_path"

    mkdir -p "$backup_path"

    # Backup compose file
    [ -f "docker-compose.yml" ] && cp "docker-compose.yml" "$backup_path/"

    # Backup .env file
    [ -f ".env" ] && cp ".env" "$backup_path/"

    # Backup service directories (configs only, not data)
    for dir in glance traefik vaultwarden adguardhome homeassistant; do
        if [ -d "$dir" ]; then
            tar -czf "$backup_path/$dir.tar.gz" \
                --exclude="*.log" \
                --exclude="*.db" \
                --exclude="*.db-wal" \
                --exclude="*.db-shm" \
                --exclude="cache" \
                "$dir" 2>/dev/null || true
        fi
    done

    print_success "Backup created: $backup_path"
    export BACKUP_PATH="$backup_path"
}

# Cleanup old backups
cleanup_backups() {
    local backup_dir="${BACKUP_DIR:-./backups}"
    local max_backups="${MAX_BACKUPS:-5}"

    if [ -d "$backup_dir" ]; then
        local backup_count=$(ls -d "$backup_dir"/backup_* 2>/dev/null | wc -l)

        if [ "$backup_count" -gt "$max_backups" ]; then
            print_info "Cleaning up old backups (keeping last $max_backups)"
            ls -dt "$backup_dir"/backup_* | tail -n +$((max_backups + 1)) | xargs rm -rf
        fi
    fi
}

# Rollback to previous backup
rollback() {
    local backup_dir="${BACKUP_DIR:-./backups}"

    # Find latest backup
    local latest_backup=$(ls -dt "$backup_dir"/backup_* 2>/dev/null | head -1)

    if [ -z "$latest_backup" ]; then
        print_error "No backups found to rollback to"
        return 1
    fi

    print_warning "Rolling back to: $latest_backup"

    # Stop current services
    compose_down --remove-orphans 2>/dev/null || true

    # Restore files
    [ -f "$latest_backup/docker-compose.yml" ] && cp "$latest_backup/docker-compose.yml" .
    [ -f "$latest_backup/.env" ] && cp "$latest_backup/.env" .

    # Restore service configs
    for archive in "$latest_backup"/*.tar.gz; do
        [ -f "$archive" ] && tar -xzf "$archive" 2>/dev/null || true
    done

    # Start services
    compose_up

    print_success "Rollback completed"
    return 0
}

# ============= Utility Functions =============
# Get script directory (for sourcing this file)
get_script_dir() {
    echo "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
}

# Check disk space
check_disk_space() {
    local path="${1:-.}"
    local required_gb="${2:-1}"

    local available_space=$(df "$path" | awk 'NR==2 {print $4}')
    local required_space=$((required_gb * 1048576))  # Convert GB to KB

    if [ "$available_space" -lt "$required_space" ]; then
        print_error "Insufficient disk space. Available: ${available_space}KB, Required: ${required_space}KB"
        return 1
    fi

    return 0
}

# Check if running as root
check_not_root() {
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root. Consider running as non-root user with docker group membership"
        return 1
    fi
    return 0
}

# Require input (no empty values)
require_input() {
    local prompt="$1"
    local var_name="$2"
    local value=""

    while [ -z "$value" ]; do
        read -p "$(echo -e "${MAGENTA}[REQUIRED]${NC} ${prompt}: ")" value
        if [ -z "$value" ]; then
            print_error "This field is required and cannot be empty"
        fi
    done

    eval "$var_name='$value'"
}

# Require password (minimum length)
require_password() {
    local prompt="$1"
    local var_name="$2"
    local min_length="${3:-8}"
    local value=""

    while [ -z "$value" ]; do
        read -sp "$(echo -e "${MAGENTA}[REQUIRED]${NC} ${prompt}: ")" value
        echo ""
        if [ -z "$value" ]; then
            print_error "Password is required and cannot be empty"
        elif [ ${#value} -lt $min_length ]; then
            print_error "Password must be at least $min_length characters"
            value=""
        fi
    done

    eval "$var_name='$value'"
}

# Show usage/help template
show_usage_template() {
    local script_name="$1"
    local description="$2"

    cat << EOF
Usage: $script_name [OPTIONS]

$description

OPTIONS:
    -h, --help              Show this help message
    -v, --verbose           Enable verbose output
    -d, --debug             Enable debug output

EOF
}

# Parse common arguments
parse_common_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                return 1  # Signal to show usage
                ;;
            -v|--verbose)
                export VERBOSE=true
                shift
                ;;
            -d|--debug)
                export DEBUG=true
                set -x
                shift
                ;;
            *)
                # Return remaining args
                echo "$@"
                return 0
                ;;
        esac
    done
}

# Export all functions for use in sourcing scripts
export -f print_header print_step print_info print_warning print_error print_success
export -f log info warning error success print_status
export -f get_compose_cmd compose_up compose_down compose_ps compose_pull compose_logs compose_config
export -f check_docker check_compose check_container_runtime
export -f check_service_health check_critical_services
export -f create_backup cleanup_backups rollback
export -f get_script_dir check_disk_space check_not_root
export -f require_input require_password
export -f show_usage_template parse_common_args