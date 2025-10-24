#!/bin/bash
# GitHub Actions Homelab Deployment Script
# This script is executed by the GitHub Actions runner to deploy homelab services

set -euo pipefail

# Configuration from environment variables
DEPLOY_PATH="${HOMELAB_PATH}"
BACKUP_DIR="$DEPLOY_PATH/.backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Function to create backup
create_backup() {
    log "Creating backup at $BACKUP_PATH"
    mkdir -p "$BACKUP_DIR"

    if [ -f "$DEPLOY_PATH/docker-compose.yml" ]; then
        mkdir -p "$BACKUP_PATH"
        cp "$DEPLOY_PATH/docker-compose.yml" "$BACKUP_PATH/"
        cp "$DEPLOY_PATH/.env" "$BACKUP_PATH/" 2>/dev/null || true

        # Save current running services state
        cd "$DEPLOY_PATH"
        docker-compose ps --format json > "$BACKUP_PATH/services_state.json" 2>/dev/null || true

        log "Backup created successfully"
        return 0
    else
        warning "No existing docker-compose.yml found, skipping backup"
        return 0
    fi
}

# Function to cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups (keeping last $MAX_BACKUPS)"
    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        ls -t1 | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -rf
    fi
}

# Function to rollback
rollback() {
    error "Rolling back to previous version"

    LATEST_BACKUP=$(ls -t1 "$BACKUP_DIR" 2>/dev/null | head -n1)
    if [ -n "$LATEST_BACKUP" ] && [ -d "$BACKUP_DIR/$LATEST_BACKUP" ]; then
        log "Restoring from backup: $LATEST_BACKUP"
        cp "$BACKUP_DIR/$LATEST_BACKUP/docker-compose.yml" "$DEPLOY_PATH/"
        [ -f "$BACKUP_DIR/$LATEST_BACKUP/.env" ] && cp "$BACKUP_DIR/$LATEST_BACKUP/.env" "$DEPLOY_PATH/"

        cd "$DEPLOY_PATH"
        docker-compose down
        docker-compose up -d

        log "Rollback completed"
        return 0
    else
        error "No backup found for rollback"
        return 1
    fi
}

# Function to check service health
check_health() {
    local service=$1
    local max_retries=${2:-5}
    local delay=${3:-10}

    log "Checking health of service: $service"

    for i in $(seq 1 $max_retries); do
        if docker-compose ps "$service" 2>/dev/null | grep -q "Up"; then
            log "Service $service is healthy"
            return 0
        fi

        warning "Service $service not ready yet (attempt $i/$max_retries)"
        sleep $delay
    done

    error "Service $service failed health check"
    return 1
}

# Main deployment logic
main() {
    log "Starting deployment to $DEPLOY_PATH"

    # Ensure deployment directory exists
    if [ ! -d "$DEPLOY_PATH" ]; then
        error "Deployment directory does not exist: $DEPLOY_PATH"
        log "Creating deployment directory..."
        mkdir -p "$DEPLOY_PATH"
    fi

    # Check if rollback is requested
    if [ "${ROLLBACK:-false}" == "true" ]; then
        rollback
        exit $?
    fi

    # Copy configurations from GitHub workspace BEFORE cd
    log "Copying configurations from GitHub workspace"
    WORKSPACE_HOMELAB="${GITHUB_WORKSPACE}/homelab"

    if [ -d "$WORKSPACE_HOMELAB" ]; then
        log "Copying files from $WORKSPACE_HOMELAB to $DEPLOY_PATH"
        cp -r "$WORKSPACE_HOMELAB"/* "$DEPLOY_PATH"/
        log "Files copied successfully"
    else
        error "Homelab directory not found in workspace: $WORKSPACE_HOMELAB"
        exit 1
    fi

    cd "$DEPLOY_PATH"

    # Create backup before deployment
    create_backup

    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        error "docker-compose.yml not found in $DEPLOY_PATH"
        exit 1
    fi

    # Validate docker-compose configuration
    log "Validating docker-compose configuration"
    if ! docker-compose config -q; then
        error "Invalid docker-compose configuration"
        rollback
        exit 1
    fi

    # Stop any existing containers with the same names
    log "Stopping any existing containers"
    CONTAINERS_TO_STOP="bazarr gluetun sonarr radarr prowlarr nginx-proxy-manager homeassistant vaultwarden adguardhome jellyfin homer glance qbittorrent"
    for container in $CONTAINERS_TO_STOP; do
        if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
            log "Stopping and removing container: $container"
            docker stop "$container" 2>/dev/null || true
            docker rm "$container" 2>/dev/null || true
        fi
    done

    # Get list of services before update
    OLD_SERVICES=$(docker-compose ps --services 2>/dev/null | sort)

    # Pull latest images
    log "Pulling latest Docker images"
    docker-compose pull --quiet

    # Deploy services
    log "Deploying services"
    if ! docker-compose up -d --remove-orphans; then
        error "Failed to deploy services"
        rollback
        exit 1
    fi

    # Get list of services after update
    NEW_SERVICES=$(docker-compose ps --services 2>/dev/null | sort)

    # Check for removed services
    REMOVED_SERVICES=$(comm -23 <(echo "$OLD_SERVICES") <(echo "$NEW_SERVICES"))
    if [ -n "$REMOVED_SERVICES" ]; then
        warning "The following services were removed: $REMOVED_SERVICES"
    fi

    # Check for new services
    ADDED_SERVICES=$(comm -13 <(echo "$OLD_SERVICES") <(echo "$NEW_SERVICES"))
    if [ -n "$ADDED_SERVICES" ]; then
        log "The following services were added: $ADDED_SERVICES"
    fi

    # Health checks for critical services
    CRITICAL_SERVICES="nginx-proxy-manager adguardhome homeassistant"
    HEALTH_CHECK_FAILED=false

    for service in $CRITICAL_SERVICES; do
        if docker-compose ps --services | grep -q "^$service$"; then
            if ! check_health "$service" "${HEALTH_CHECK_RETRIES}" "${HEALTH_CHECK_DELAY}"; then
                HEALTH_CHECK_FAILED=true
            fi
        fi
    done

    if [ "$HEALTH_CHECK_FAILED" = true ]; then
        error "Some services failed health checks, rolling back"
        rollback
        exit 1
    fi

    # Cleanup old backups
    cleanup_backups

    # Print deployment summary
    log "Deployment completed successfully!"
    echo "----------------------------------------"
    echo "Deployment Summary:"
    echo "  Timestamp: $(date)"
    echo "  Path: $DEPLOY_PATH"
    echo "  Backup: $BACKUP_PATH"
    echo ""
    echo "Running Services:"
    docker-compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
    echo "----------------------------------------"
}

# Execute main function
main
