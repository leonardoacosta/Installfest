#!/bin/bash
# CI/CD Homelab Deployment Script
# This script is executed by the GitHub Actions runner to deploy homelab services

set -euo pipefail

# Get script directory and source common utilities
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/common-utils.sh"

# Configuration from environment variables
# Expand tilde in HOMELAB_PATH if present
DEPLOY_PATH="${HOMELAB_PATH/#\~/$HOME}"
BACKUP_DIR="$DEPLOY_PATH/.backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
COMPOSE_FILE="docker-compose.yml"

# Main deployment logic
main() {
    check_container_runtime

    log "Starting deployment to $DEPLOY_PATH"

    # Validate deployment path (must be absolute)
    if [[ ! "$DEPLOY_PATH" = /* ]]; then
        error "DEPLOY_PATH must be an absolute path, got: $DEPLOY_PATH"
        error "Original HOMELAB_PATH was: $HOMELAB_PATH"
        exit 1
    fi

    # Ensure deployment directory exists
    if [ ! -d "$DEPLOY_PATH" ]; then
        error "Deployment directory does not exist: $DEPLOY_PATH"
        log "Creating deployment directory..."
        mkdir -p "$DEPLOY_PATH"
    fi

    # Check if rollback is requested
    if [ "${ROLLBACK:-false}" == "true" ]; then
        cd "$DEPLOY_PATH"
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
    if ! compose_config -q; then
        error "Invalid docker-compose configuration"
        rollback
        exit 1
    fi

    # Stop any existing containers
    log "Stopping any existing containers"
    docker stop $(docker ps -q) 2>/dev/null || true

    log "Removing any existing containers"
    docker rm $(docker ps -a -q) 2>/dev/null || true

    # Get list of services before update
    OLD_SERVICES=$(compose_ps --services 2>/dev/null | sort || true)

    # Pull latest images
    log "Pulling latest Docker images"
    compose_pull --quiet

    # Deploy services
    log "Deploying services"
    if ! compose_up --remove-orphans; then
        error "Failed to deploy services"
        rollback
        exit 1
    fi

    # Get list of services after update
    NEW_SERVICES=$(compose_ps --services 2>/dev/null | sort)

    # Check for removed services
    if [ -n "$OLD_SERVICES" ]; then
        REMOVED_SERVICES=$(comm -23 <(echo "$OLD_SERVICES") <(echo "$NEW_SERVICES") 2>/dev/null || true)
        if [ -n "$REMOVED_SERVICES" ]; then
            warning "The following services were removed: $REMOVED_SERVICES"
        fi

        # Check for new services
        ADDED_SERVICES=$(comm -13 <(echo "$OLD_SERVICES") <(echo "$NEW_SERVICES") 2>/dev/null || true)
        if [ -n "$ADDED_SERVICES" ]; then
            log "The following services were added: $ADDED_SERVICES"
        fi
    fi

    # Health checks for critical services
    CRITICAL_SERVICES="traefik adguardhome homeassistant"

    if ! check_critical_services $CRITICAL_SERVICES; then
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
    compose_ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
    echo "----------------------------------------"
}

# Execute main function
main