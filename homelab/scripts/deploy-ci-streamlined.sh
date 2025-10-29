#!/bin/bash
# Streamlined CI/CD Homelab Deployment Script
# Minimal deployment logic - Docker Compose handles most tasks automatically

set -euo pipefail

# Get script directory and source utilities
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/common-utils.sh"

# Configuration
DEPLOY_PATH="${HOMELAB_PATH/#\~/$HOME}"
WORKSPACE_HOMELAB="${GITHUB_WORKSPACE}/homelab"

# Main deployment
main() {
    log "Starting streamlined deployment to $DEPLOY_PATH"

    # 1. Check container runtime
    check_container_runtime

    # 2. Copy files from GitHub workspace to deployment path
    if [ ! -d "$WORKSPACE_HOMELAB" ]; then
        error "Homelab directory not found: $WORKSPACE_HOMELAB"
        exit 1
    fi

    log "Copying files from workspace to $DEPLOY_PATH"
    mkdir -p "$DEPLOY_PATH"

    # Simple rsync with minimal options - let Docker handle permissions
    # IMPORTANT: Preserve .env and other local-only files
    # NOTE: --delete flag removed to prevent deletion of server-only files like .env
    if command -v rsync &> /dev/null; then
        rsync -av \
              --exclude='*.log' \
              --exclude='**/cache' \
              --exclude='**/logs' \
              --exclude='.env' \
              --exclude='*.env.*' \
              --exclude='**/data' \
              --exclude='**/backups' \
              --exclude='**/letsencrypt' \
              --exclude='**/state' \
              --exclude='**/config/*.key' \
              --exclude='**/config/*.pem' \
              --exclude='**/config/*.crt' \
              --exclude-from=<(find "$DEPLOY_PATH" -name ".gitignore" 2>/dev/null | xargs cat 2>/dev/null | grep -v '^#' | grep -v '^$' || true) \
              "$WORKSPACE_HOMELAB/" "$DEPLOY_PATH/" || {
            warning "Some files could not be copied, continuing..."
        }
    else
        # Fallback to cp if rsync not available - preserve .env file
        if [ -f "$DEPLOY_PATH/.env" ]; then
            cp "$DEPLOY_PATH/.env" "/tmp/.env.backup.$$"
        fi

        cp -r "$WORKSPACE_HOMELAB"/* "$DEPLOY_PATH/" || {
            warning "Some files could not be copied, continuing..."
        }

        # Restore .env file if it was backed up
        if [ -f "/tmp/.env.backup.$$" ]; then
            mv "/tmp/.env.backup.$$" "$DEPLOY_PATH/.env"
        fi
    fi

    # 3. Navigate to deployment directory
    cd "$DEPLOY_PATH"

    # 4. Validate docker-compose configuration
    log "Validating docker-compose configuration"
    if ! compose_config -q; then
        error "Invalid docker-compose configuration"
        exit 1
    fi

    # 5. Deploy services (Docker Compose creates directories automatically)
    log "Deploying services..."
    compose_down --remove-orphans 2>/dev/null || true  # Clean stop of project containers only
    compose_pull --quiet  # Pull latest images

    if ! compose_up --remove-orphans; then
        error "Failed to deploy services"
        exit 1
    fi

    # 6. Basic health check for critical services
    log "Checking service health..."
    sleep 10  # Give services time to start

    CRITICAL_SERVICES="traefik"
    for service in $CRITICAL_SERVICES; do
        if compose_ps | grep -q "${service}.*unhealthy"; then
            error "Service $service is unhealthy"
            exit 1
        fi
    done

    # 7. Print summary
    log "✅ Deployment completed successfully!"
    echo "----------------------------------------"
    echo "Deployment Summary:"
    echo "  Time: $(date)"
    echo "  Path: $DEPLOY_PATH"
    echo "----------------------------------------"
    compose_ps
}

# Execute
main "$@"