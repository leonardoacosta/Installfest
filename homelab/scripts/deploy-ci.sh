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

    # Check if we can use sudo without password
    CAN_SUDO=false
    if sudo -n true 2>/dev/null; then
        CAN_SUDO=true
        log "Passwordless sudo available"
    else
        log "Sudo requires password or not available - attempting without sudo"
    fi

    # Fix permissions on existing directories and create missing ones
    log "Ensuring service directories with proper permissions"

    # First, try to fix permissions on the main directory if it exists
    if [ -d "$DEPLOY_PATH/homeassistant" ] && [ ! -w "$DEPLOY_PATH/homeassistant" ]; then
        log "Fixing permissions on existing homeassistant directory"
        if [ "$CAN_SUDO" = true ]; then
            sudo chmod -R 755 "$DEPLOY_PATH/homeassistant" 2>/dev/null || true
            sudo chown -R $(whoami):$(whoami) "$DEPLOY_PATH/homeassistant" 2>/dev/null || true
        fi
    fi

    # Now create all required directories
    for dir in homeassistant/config glance/assets traefik/letsencrypt traefik/config \
               jellyfin/config adguardhome/work adguardhome/conf \
               ollama ollama-webui radarr sonarr lidarr prowlarr bazarr \
               qbittorrent jellyseerr nzbget scripts traefik/dynamic; do

        # Check if parent directory exists but isn't writable
        PARENT_DIR="$(dirname "$DEPLOY_PATH/$dir")"
        if [ -d "$PARENT_DIR" ] && [ ! -w "$PARENT_DIR" ]; then
            if [ "$CAN_SUDO" = true ]; then
                log "Fixing permissions on $PARENT_DIR"
                sudo chmod 755 "$PARENT_DIR" 2>/dev/null || true
                sudo chown -R $(whoami):$(whoami) "$PARENT_DIR" 2>/dev/null || true
            fi
        fi

        # Now create the directory if it doesn't exist
        if [ ! -d "$DEPLOY_PATH/$dir" ]; then
            if [ -w "$DEPLOY_PATH" ] || [ -w "$PARENT_DIR" ]; then
                # We have write permission, create without sudo
                mkdir -p "$DEPLOY_PATH/$dir" 2>/dev/null || {
                    if [ "$CAN_SUDO" = true ]; then
                        sudo mkdir -p "$DEPLOY_PATH/$dir" 2>/dev/null || {
                            warning "Could not create directory: $DEPLOY_PATH/$dir"
                        }
                    else
                        warning "Could not create directory: $DEPLOY_PATH/$dir"
                    fi
                }
            elif [ "$CAN_SUDO" = true ]; then
                # Try with sudo if available
                sudo mkdir -p "$DEPLOY_PATH/$dir" || {
                    warning "Could not create directory with sudo: $DEPLOY_PATH/$dir"
                }
            else
                warning "Cannot create directory: $DEPLOY_PATH/$dir - will continue anyway"
            fi
        fi
    done

    # Fix ownership of deployment directory before copying
    if [ ! -w "$DEPLOY_PATH" ]; then
        if [ "$CAN_SUDO" = true ]; then
            log "Attempting to fix ownership of deployment directory"
            sudo chown -R $(whoami):$(whoami) "$DEPLOY_PATH" 2>/dev/null || {
                warning "Could not change ownership - will attempt copy anyway"
            }
        else
            error "No write permission to $DEPLOY_PATH and sudo not available"
            error "Please run on the server as root:"
            error "  sudo bash $DEPLOY_PATH/scripts/setup-runner-permissions.sh"
            exit 1
        fi
    fi

    # Copy configurations from GitHub workspace BEFORE cd
    log "Copying configurations from GitHub workspace"
    WORKSPACE_HOMELAB="${GITHUB_WORKSPACE}/homelab"

    if [ -d "$WORKSPACE_HOMELAB" ]; then
        log "Copying files from $WORKSPACE_HOMELAB to $DEPLOY_PATH"

        # Use rsync for better permission handling, fall back to cp if rsync not available
        if command -v rsync &> /dev/null; then
            log "Using rsync for file transfer"
            # Use --ignore-errors to continue despite permission issues on some directories
            if [ -w "$DEPLOY_PATH" ]; then
                # Temporarily disable exit on error to handle rsync exit codes
                set +e
                rsync -av --no-perms --no-owner --no-group --ignore-errors "$WORKSPACE_HOMELAB"/ "$DEPLOY_PATH"/ 2>&1
                RSYNC_EXIT=$?
                set -e

                # Handle rsync exit codes
                if [ $RSYNC_EXIT -eq 0 ]; then
                    log "Rsync completed successfully"
                elif [ $RSYNC_EXIT -eq 23 ]; then
                    warning "Rsync completed with some permission errors - continuing deployment"
                    warning "Some files may not have been copied (likely homeassistant/config)"
                    # DO NOT EXIT - continue with deployment
                elif [ $RSYNC_EXIT -eq 24 ]; then
                    warning "Rsync completed with some file vanished warnings - continuing deployment"
                    # DO NOT EXIT - continue with deployment
                else
                    error "Rsync failed with exit code $RSYNC_EXIT"
                    exit 1
                fi
            elif [ "$CAN_SUDO" = true ]; then
                # Run rsync with sudo
                set +e
                sudo rsync -av --no-perms --no-owner --no-group --ignore-errors "$WORKSPACE_HOMELAB"/ "$DEPLOY_PATH"/ 2>&1
                RSYNC_EXIT=$?
                set -e

                # Handle rsync exit codes
                if [ $RSYNC_EXIT -eq 0 ]; then
                    log "Rsync with sudo completed successfully"
                elif [ $RSYNC_EXIT -eq 23 ]; then
                    warning "Rsync with sudo had some permission errors - continuing deployment"
                    warning "Some files may not have been copied (likely homeassistant/config)"
                    # DO NOT EXIT - continue with deployment
                elif [ $RSYNC_EXIT -eq 24 ]; then
                    warning "Rsync with sudo had some file vanished warnings - continuing deployment"
                    # DO NOT EXIT - continue with deployment
                else
                    error "Rsync with sudo failed with exit code $RSYNC_EXIT"
                    exit 1
                fi
            else
                error "No write permission to $DEPLOY_PATH and sudo not available"
                error "Cannot copy files. Please fix permissions first."
                exit 1
            fi
        else
            log "Using cp for file transfer (rsync not available)"
            if [ -w "$DEPLOY_PATH" ]; then
                set +e
                cp -r "$WORKSPACE_HOMELAB"/* "$DEPLOY_PATH"/ 2>&1
                CP_EXIT=$?
                set -e
                if [ $CP_EXIT -ne 0 ]; then
                    warning "Some files could not be copied - continuing anyway"
                fi
            elif [ "$CAN_SUDO" = true ]; then
                log "Using sudo to copy files"
                set +e
                sudo cp -r "$WORKSPACE_HOMELAB"/* "$DEPLOY_PATH"/ 2>&1
                CP_EXIT=$?
                set -e
                if [ $CP_EXIT -ne 0 ]; then
                    warning "Some files could not be copied with sudo - continuing anyway"
                fi
            else
                error "No write permission to $DEPLOY_PATH and sudo not available"
                error "Cannot copy files. Please fix permissions first."
                exit 1
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
    mkdir -p jellyfin/config jellyfin/cache jellyfin/config/logs
    # Try to set ownership, if that fails, make it world-writable
    if ! chown -R $PUID:$PGID jellyfin/ 2>/dev/null; then
        # Can't change ownership, make it writable by everyone
        chmod -R 777 jellyfin/ 2>/dev/null || true
        warning "Could not set jellyfin ownership - using permissive permissions"
    else
        # Successfully changed ownership, set standard permissions
        chmod -R 755 jellyfin/ 2>/dev/null || true
    fi

    # Vaultwarden now uses Docker volume, no directory needed
    # Docker volumes handle permissions automatically

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
    # Special handling for homeassistant since it often has permission issues
    if [ -d homeassistant ] && [ ! -w homeassistant ]; then
        log "Warning: homeassistant directory exists but not writable"
        # Try to fix with sudo if available
        if sudo -n true 2>/dev/null; then
            sudo chmod 755 homeassistant 2>/dev/null || true
            sudo chown -R $PUID:$PGID homeassistant/ 2>/dev/null || true
        fi
    fi

    mkdir -p homeassistant/config 2>/dev/null || {
        # Try with sudo if regular mkdir failed
        if sudo -n true 2>/dev/null; then
            sudo mkdir -p homeassistant/config 2>/dev/null || {
                warning "Could not create homeassistant/config even with sudo - continuing anyway"
            }
            sudo chown -R $PUID:$PGID homeassistant/ 2>/dev/null || true
        else
            warning "Could not create homeassistant/config and sudo not available - continuing"
        fi
    }

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