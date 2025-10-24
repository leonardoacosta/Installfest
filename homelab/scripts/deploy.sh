#!/bin/bash
# Homelab Deployment Script
# This script handles local and remote deployments of the homelab services

set -euo pipefail

# Configuration (can be overridden by environment variables)
DEPLOY_PATH="${HOMELAB_PATH:-$(pwd)}"
BACKUP_DIR="${BACKUP_DIR:-$DEPLOY_PATH/.backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
MAX_BACKUPS="${MAX_BACKUPS:-5}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

# Health check configuration
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-5}"
HEALTH_CHECK_DELAY="${HEALTH_CHECK_DELAY:-10}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    local missing_tools=()

    # Check for required commands
    for cmd in docker docker-compose git; do
        if ! command -v $cmd &> /dev/null; then
            missing_tools+=($cmd)
        fi
    done

    if [ ${#missing_tools[@]} -gt 0 ]; then
        error "Missing required tools: ${missing_tools[*]}"
        echo "Please install the missing tools and try again."
        exit 1
    fi

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running or you don't have permission to access it"
        exit 1
    fi

    success "All prerequisites met"
}

# Function to create backup
create_backup() {
    log "Creating backup at $BACKUP_PATH"
    mkdir -p "$BACKUP_DIR"

    if [ -f "$DEPLOY_PATH/$COMPOSE_FILE" ]; then
        mkdir -p "$BACKUP_PATH"

        # Backup docker-compose files
        cp "$DEPLOY_PATH/$COMPOSE_FILE" "$BACKUP_PATH/"
        [ -f "$DEPLOY_PATH/.env" ] && cp "$DEPLOY_PATH/.env" "$BACKUP_PATH/"

        # Save current running services state
        cd "$DEPLOY_PATH"
        docker-compose -f "$COMPOSE_FILE" ps --format json > "$BACKUP_PATH/services_state.json" 2>/dev/null || true

        # Save docker volumes list (for reference)
        docker volume ls --format json > "$BACKUP_PATH/volumes_list.json" 2>/dev/null || true

        # Create a restore script
        cat > "$BACKUP_PATH/restore.sh" << 'RESTORE_EOF'
#!/bin/bash
# Restore script for this backup

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TARGET_DIR="${1:-$SCRIPT_DIR/../..}"

echo "Restoring backup from $SCRIPT_DIR to $TARGET_DIR"

# Restore files
cp "$SCRIPT_DIR/docker-compose.yml" "$TARGET_DIR/"
[ -f "$SCRIPT_DIR/.env" ] && cp "$SCRIPT_DIR/.env" "$TARGET_DIR/"

# Restart services
cd "$TARGET_DIR"
docker-compose down
docker-compose up -d

echo "Restore completed!"
RESTORE_EOF
        chmod +x "$BACKUP_PATH/restore.sh"

        success "Backup created successfully at $BACKUP_PATH"
        return 0
    else
        warning "No existing $COMPOSE_FILE found, skipping backup"
        return 0
    fi
}

# Function to cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups (keeping last $MAX_BACKUPS)"
    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        local backup_count=$(ls -1 | wc -l)
        if [ $backup_count -gt $MAX_BACKUPS ]; then
            ls -t1 | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -rf
            success "Cleaned up $((backup_count - MAX_BACKUPS)) old backup(s)"
        else
            info "No cleanup needed ($backup_count backups, max: $MAX_BACKUPS)"
        fi
    fi
}

# Function to rollback to latest backup
rollback() {
    error "Initiating rollback to previous version"

    if [ ! -d "$BACKUP_DIR" ]; then
        error "No backup directory found"
        return 1
    fi

    LATEST_BACKUP=$(ls -t1 "$BACKUP_DIR" 2>/dev/null | head -n1)
    if [ -n "$LATEST_BACKUP" ] && [ -d "$BACKUP_DIR/$LATEST_BACKUP" ]; then
        log "Restoring from backup: $LATEST_BACKUP"

        # Use the restore script if available
        if [ -x "$BACKUP_DIR/$LATEST_BACKUP/restore.sh" ]; then
            "$BACKUP_DIR/$LATEST_BACKUP/restore.sh" "$DEPLOY_PATH"
        else
            # Manual restore
            cp "$BACKUP_DIR/$LATEST_BACKUP/$COMPOSE_FILE" "$DEPLOY_PATH/"
            [ -f "$BACKUP_DIR/$LATEST_BACKUP/.env" ] && cp "$BACKUP_DIR/$LATEST_BACKUP/.env" "$DEPLOY_PATH/"

            cd "$DEPLOY_PATH"
            docker-compose -f "$COMPOSE_FILE" down
            docker-compose -f "$COMPOSE_FILE" up -d
        fi

        success "Rollback completed"
        return 0
    else
        error "No backup found for rollback"
        return 1
    fi
}

# Function to check service health
check_service_health() {
    local service=$1
    local max_retries=${2:-$HEALTH_CHECK_RETRIES}
    local delay=${3:-$HEALTH_CHECK_DELAY}

    info "Checking health of service: $service"

    for i in $(seq 1 $max_retries); do
        local status=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null | xargs -r docker inspect -f '{{.State.Status}}' 2>/dev/null)

        if [ "$status" = "running" ]; then
            # Additional health check if the container has a healthcheck defined
            local health_status=$(docker-compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null | xargs -r docker inspect -f '{{.State.Health.Status}}' 2>/dev/null)

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

# Function to perform pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks"

    # Check disk space
    local available_space=$(df "$DEPLOY_PATH" | awk 'NR==2 {print $4}')
    local required_space=1048576  # 1GB in KB

    if [ "$available_space" -lt "$required_space" ]; then
        error "Insufficient disk space. Available: ${available_space}KB, Required: ${required_space}KB"
        return 1
    fi

    # Validate docker-compose file
    if ! docker-compose -f "$DEPLOY_PATH/$COMPOSE_FILE" config -q; then
        error "Invalid docker-compose configuration"
        return 1
    fi

    # Check for .env file
    if [ ! -f "$DEPLOY_PATH/.env" ]; then
        warning "No .env file found. Using default values."
    fi

    success "Pre-deployment checks passed"
    return 0
}

# Function to deploy services
deploy_services() {
    log "Starting deployment process"

    # Navigate to deployment directory
    cd "$DEPLOY_PATH"

    # Get list of services before update
    OLD_SERVICES=$(docker-compose -f "$COMPOSE_FILE" ps --services 2>/dev/null | sort)

    # Pull latest images
    log "Pulling latest Docker images"
    if ! docker-compose -f "$COMPOSE_FILE" pull; then
        warning "Some images failed to pull, continuing with cached versions"
    fi

    # Stop and remove old containers
    log "Stopping old containers"
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans

    # Start new containers
    log "Starting services"
    if ! docker-compose -f "$COMPOSE_FILE" up -d; then
        error "Failed to start services"
        return 1
    fi

    # Get list of services after update
    NEW_SERVICES=$(docker-compose -f "$COMPOSE_FILE" ps --services 2>/dev/null | sort)

    # Report changes
    if [ "$OLD_SERVICES" != "$NEW_SERVICES" ]; then
        info "Service changes detected:"

        # Check for removed services
        REMOVED_SERVICES=$(comm -23 <(echo "$OLD_SERVICES") <(echo "$NEW_SERVICES") | tr '\n' ' ')
        [ -n "$REMOVED_SERVICES" ] && warning "Removed services: $REMOVED_SERVICES"

        # Check for new services
        ADDED_SERVICES=$(comm -13 <(echo "$OLD_SERVICES") <(echo "$NEW_SERVICES") | tr '\n' ' ')
        [ -n "$ADDED_SERVICES" ] && success "Added services: $ADDED_SERVICES"
    fi

    return 0
}

# Function to perform health checks
perform_health_checks() {
    log "Performing health checks on critical services"

    # Define critical services (customize based on your setup)
    local CRITICAL_SERVICES="${CRITICAL_SERVICES:-nginx-proxy-manager adguardhome homeassistant gluetun}"
    local all_healthy=true

    for service in $CRITICAL_SERVICES; do
        if docker-compose -f "$COMPOSE_FILE" ps --services | grep -q "^$service$"; then
            if ! check_service_health "$service"; then
                all_healthy=false
            fi
        else
            info "Service $service not found in compose file, skipping"
        fi
    done

    if [ "$all_healthy" = true ]; then
        success "All critical services are healthy"
        return 0
    else
        error "Some services failed health checks"
        return 1
    fi
}

# Function to print deployment summary
print_summary() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                   DEPLOYMENT SUMMARY                       ║"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║ Timestamp: $(date +'%Y-%m-%d %H:%M:%S')                   ║"
    echo "║ Path: $DEPLOY_PATH"
    echo "║ Backup: ${BACKUP_PATH:-N/A}"
    echo "╠════════════════════════════════════════════════════════════╣"
    echo "║                    RUNNING SERVICES                        ║"
    echo "╠════════════════════════════════════════════════════════════╣"

    cd "$DEPLOY_PATH"
    docker-compose -f "$COMPOSE_FILE" ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"

    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Homelab Deployment Script - Deploy and manage Docker services

OPTIONS:
    -h, --help              Show this help message
    -b, --backup-only       Only create backup without deploying
    -r, --rollback          Rollback to the latest backup
    -s, --skip-health       Skip health checks
    -c, --cleanup-only      Only cleanup old backups
    -f, --compose-file FILE Use alternate docker-compose file
    -p, --path PATH         Set deployment path (default: current directory)
    -v, --validate          Validate configuration without deploying

ENVIRONMENT VARIABLES:
    HOMELAB_PATH            Deployment directory path
    BACKUP_DIR              Backup directory path
    MAX_BACKUPS             Maximum number of backups to keep (default: 5)
    COMPOSE_FILE            Docker compose file to use (default: docker-compose.yml)
    HEALTH_CHECK_RETRIES    Number of health check retries (default: 5)
    HEALTH_CHECK_DELAY      Delay between health checks in seconds (default: 10)
    CRITICAL_SERVICES       Space-separated list of critical services to health check

EXAMPLES:
    # Normal deployment
    $0

    # Rollback to previous version
    $0 --rollback

    # Create backup only
    $0 --backup-only

    # Deploy with custom compose file
    $0 --compose-file docker-compose-prod.yml

    # Validate configuration
    $0 --validate

EOF
}

# Main function
main() {
    local action="deploy"
    local skip_health=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -b|--backup-only)
                action="backup"
                shift
                ;;
            -r|--rollback)
                action="rollback"
                shift
                ;;
            -s|--skip-health)
                skip_health=true
                shift
                ;;
            -c|--cleanup-only)
                action="cleanup"
                shift
                ;;
            -f|--compose-file)
                COMPOSE_FILE="$2"
                shift 2
                ;;
            -p|--path)
                DEPLOY_PATH="$2"
                shift 2
                ;;
            -v|--validate)
                action="validate"
                shift
                ;;
            *)
                error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Print header
    echo ""
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "                      HOMELAB DEPLOYMENT SCRIPT v1.0"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo ""

    # Check prerequisites
    check_prerequisites

    # Change to deployment directory
    if [ ! -d "$DEPLOY_PATH" ]; then
        error "Deployment directory does not exist: $DEPLOY_PATH"
        exit 1
    fi

    cd "$DEPLOY_PATH"

    # Execute based on action
    case $action in
        backup)
            create_backup
            cleanup_backups
            ;;
        rollback)
            rollback
            ;;
        cleanup)
            cleanup_backups
            ;;
        validate)
            pre_deployment_checks
            info "Configuration is valid"
            ;;
        deploy)
            # Full deployment process
            if ! pre_deployment_checks; then
                exit 1
            fi

            create_backup

            if ! deploy_services; then
                error "Deployment failed, initiating rollback"
                rollback
                exit 1
            fi

            if [ "$skip_health" = false ]; then
                if ! perform_health_checks; then
                    error "Health checks failed, initiating rollback"
                    rollback
                    exit 1
                fi
            fi

            cleanup_backups
            print_summary
            success "Deployment completed successfully!"
            ;;
    esac
}

# Run main function
main "$@"