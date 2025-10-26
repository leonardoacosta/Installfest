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

    # Ensure deployment directory exists with proper permissions
    if [ ! -d "$DEPLOY_PATH" ]; then
        log "Deployment directory does not exist: $DEPLOY_PATH"
        log "Creating deployment directory..."
        # Try to create directory, use sudo if necessary
        mkdir -p "$DEPLOY_PATH" 2>/dev/null || sudo mkdir -p "$DEPLOY_PATH" || {
            error "Cannot create deployment directory: $DEPLOY_PATH"
            error "Please ensure the parent directory exists and you have permissions"
            exit 1
        }
    fi

    # Ensure we own the deployment directory or have write access
    if [ ! -w "$DEPLOY_PATH" ]; then
        log "Attempting to fix permissions for $DEPLOY_PATH"
        sudo chown -R $(whoami):$(whoami) "$DEPLOY_PATH" 2>/dev/null || {
            warning "Cannot change ownership of $DEPLOY_PATH"
            warning "Will attempt to use sudo for file operations"
        }
    fi

    # Check if rollback is requested
    if [ "${ROLLBACK:-false}" == "true" ]; then
        cd "$DEPLOY_PATH"
        rollback
        exit $?
    fi

    # Pre-create critical directories to avoid permission issues during copy
    log "Pre-creating service directories in deployment path"
    for dir in homeassistant/config glance/assets traefik/letsencrypt traefik/config \
               jellyfin/config vaultwarden adguardhome/work adguardhome/conf \
               ollama ollama-webui radarr sonarr lidarr prowlarr bazarr \
               qbittorrent jellyseerr nzbget scripts traefik/dynamic; do
        if [ ! -d "$DEPLOY_PATH/$dir" ]; then
            mkdir -p "$DEPLOY_PATH/$dir" 2>/dev/null || sudo mkdir -p "$DEPLOY_PATH/$dir" || {
                warning "Could not create directory: $DEPLOY_PATH/$dir"
            }
        fi
    done

    # Fix ownership of deployment directory before copying
    if [ ! -w "$DEPLOY_PATH" ]; then
        log "Fixing ownership of deployment directory"
        sudo chown -R $(whoami):$(whoami) "$DEPLOY_PATH" 2>/dev/null || {
            warning "Could not change ownership - will use sudo for copy"
        }
    fi

    # Copy configurations from GitHub workspace BEFORE cd
    log "Copying configurations from GitHub workspace"
    WORKSPACE_HOMELAB="${GITHUB_WORKSPACE}/homelab"

    if [ -d "$WORKSPACE_HOMELAB" ]; then
        log "Copying files from $WORKSPACE_HOMELAB to $DEPLOY_PATH"

        # Use rsync for better permission handling, fall back to cp if rsync not available
        if command -v rsync &> /dev/null; then
            log "Using rsync for file transfer"
            if [ -w "$DEPLOY_PATH" ]; then
                rsync -av --no-perms --no-owner --no-group "$WORKSPACE_HOMELAB"/ "$DEPLOY_PATH"/ || {
                    error "Rsync failed"
                    exit 1
                }
            else
                sudo rsync -av --no-perms --no-owner --no-group "$WORKSPACE_HOMELAB"/ "$DEPLOY_PATH"/ || {
                    error "Rsync with sudo failed"
                    exit 1
                }
            fi
        else
            log "Using cp for file transfer (rsync not available)"
            if [ -w "$DEPLOY_PATH" ]; then
                cp -r "$WORKSPACE_HOMELAB"/* "$DEPLOY_PATH"/
            else
                log "Using sudo to copy files"
                sudo cp -r "$WORKSPACE_HOMELAB"/* "$DEPLOY_PATH"/ || {
                    error "Failed to copy files even with sudo"
                    exit 1
                }
            fi
        fi
        log "Files copied successfully"
    else
        error "Homelab directory not found in workspace: $WORKSPACE_HOMELAB"
        exit 1
    fi

    cd "$DEPLOY_PATH"

    # Ensure service directories exist with proper permissions
    log "Creating necessary service directories"

    # Get PUID and PGID from .env file or use defaults
    if [ -f .env ]; then
        source .env
    fi
    PUID="${PUID:-501}"
    PGID="${PGID:-20}"

    # Glance assets directory
    mkdir -p glance/assets
    chown -R $PUID:$PGID glance/ 2>/dev/null || true

    # Jellyfin directories with proper permissions
    mkdir -p jellyfin/config jellyfin/cache
    chown -R $PUID:$PGID jellyfin/ 2>/dev/null || true

    # Vaultwarden directory with database file
    mkdir -p vaultwarden
    chown -R $PUID:$PGID vaultwarden/ 2>/dev/null || true
    # if [ ! -f vaultwarden/db.sqlite3 ]; then
    #     touch vaultwarden/db.sqlite3
    # fi
    # chown $PUID:$PGID vaultwarden/db.sqlite3 2>/dev/null || true

    # Traefik directories
    mkdir -p traefik/letsencrypt traefik/config
    chown -R $PUID:$PGID traefik/ 2>/dev/null || true
    chown -R $PUID:$PGID traefik/letsencrypt/ 2>/dev/null || true
    chown -R $PUID:$PGID traefik/config/ 2>/dev/null || true

    # Media stack directories
    mkdir -p radarr sonarr lidarr prowlarr bazarr qbittorrent jellyseerr
    for dir in radarr sonarr lidarr prowlarr bazarr qbittorrent jellyseerr; do
        chown -R $PUID:$PGID $dir/ 2>/dev/null || true
    done

    # AdGuard Home directories
    mkdir -p adguardhome/work adguardhome/conf

    # Home Assistant directory and subdirectories
    mkdir -p homeassistant/config
    if [ -w homeassistant ]; then
        chown -R $PUID:$PGID homeassistant/ 2>/dev/null || true
    else
        log "Warning: Cannot change ownership of homeassistant directory - using sudo"
        sudo mkdir -p homeassistant/config 2>/dev/null || mkdir -p homeassistant/config
        sudo chown -R $PUID:$PGID homeassistant/ 2>/dev/null || true
    fi

    # Ollama directories
    mkdir -p ollama ollama-webui

    log "Service directories created successfully"

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

    # Install HACS for Home Assistant if not already installed
    if [ -f "$SCRIPT_DIR/setup-hacs.sh" ]; then
        log "Checking HACS installation for Home Assistant..."
        if bash "$SCRIPT_DIR/setup-hacs.sh"; then
            log "HACS installation check completed"
        else
            warning "HACS installation check failed - manual setup may be required"
        fi
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