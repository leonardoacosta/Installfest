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

# Install/verify Tailscale routes restoration system
setup_tailscale_routes_restoration() {
    log "Checking Tailscale routes restoration system..."

    local script_source="$DEPLOY_PATH/scripts/restore-tailscale-routes.sh"
    local script_target="/usr/local/bin/restore-tailscale-routes.sh"
    local service_source="$DEPLOY_PATH/systemd/restore-tailscale-routes.service"
    local service_target="/etc/systemd/system/restore-tailscale-routes.service"
    local path_source="$DEPLOY_PATH/systemd/restore-tailscale-routes.path"
    local path_target="/etc/systemd/system/restore-tailscale-routes.path"

    local changes_made=false

    # 1. Install restoration script
    if [ ! -f "$script_target" ] || ! cmp -s "$script_source" "$script_target"; then
        log "Installing Tailscale routes restoration script..."
        sudo cp "$script_source" "$script_target"
        sudo chmod +x "$script_target"
        sudo chown root:root "$script_target"
        changes_made=true
        log "✓ Script installed to $script_target"
    else
        log "✓ Restoration script already up-to-date"
    fi

    # 2. Install systemd service unit
    if [ ! -f "$service_target" ] || ! cmp -s "$service_source" "$service_target"; then
        log "Installing systemd service unit..."
        sudo cp "$service_source" "$service_target"
        sudo chmod 644 "$service_target"
        sudo chown root:root "$service_target"
        changes_made=true
        log "✓ Service unit installed"
    else
        log "✓ Service unit already up-to-date"
    fi

    # 3. Install systemd path unit (optional auto-trigger)
    if [ ! -f "$path_target" ] || ! cmp -s "$path_source" "$path_target"; then
        log "Installing systemd path unit..."
        sudo cp "$path_source" "$path_target"
        sudo chmod 644 "$path_target"
        sudo chown root:root "$path_target"
        changes_made=true
        log "✓ Path unit installed"
    else
        log "✓ Path unit already up-to-date"
    fi

    # 4. Reload systemd if changes were made
    if [ "$changes_made" = true ]; then
        log "Reloading systemd daemon..."
        sudo systemctl daemon-reload
    fi

    # 5. Enable services if not already enabled
    if ! systemctl is-enabled restore-tailscale-routes.service &>/dev/null; then
        log "Enabling restoration service..."
        sudo systemctl enable restore-tailscale-routes.service
    fi

    if ! systemctl is-enabled restore-tailscale-routes.path &>/dev/null; then
        log "Enabling path monitoring..."
        sudo systemctl enable restore-tailscale-routes.path
    fi

    # 6. Start path unit if not running
    if ! systemctl is-active restore-tailscale-routes.path &>/dev/null; then
        log "Starting path monitoring..."
        sudo systemctl start restore-tailscale-routes.path
    fi

    # 7. Run restoration script immediately
    log "Running Tailscale routes restoration..."
    sudo systemctl start restore-tailscale-routes.service || warning "Route restoration had issues (this is normal if Tailscale isn't running)"

    log "✅ Tailscale routes restoration system configured"
}

# Update infrastructure services separately (manual trigger only)
update_infrastructure() {
    log "⚠️  Updating infrastructure services (DNS will be temporarily unavailable)"
    log "This should only be run manually, not during CI/CD"

    INFRASTRUCTURE_SERVICES="traefik adguardhome"

    for service in $INFRASTRUCTURE_SERVICES; do
        log "Updating $service..."
        compose_up --no-deps --force-recreate "$service"
        sleep 5  # Brief pause between infrastructure updates
    done

    log "✅ Infrastructure services updated"
}

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

    # IMPORTANT: Never restart infrastructure services during deployment
    # to prevent DNS outage (AdGuard) and network disruption (Traefik)
    INFRASTRUCTURE_SERVICES="traefik adguardhome"

    # Pull latest images first (doesn't disrupt running services)
    compose_pull --quiet

    # Restart only non-infrastructure services using rolling update
    log "Performing rolling update (keeping infrastructure running)..."
    if ! compose_up --no-deps --remove-orphans; then
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

    # 7. Setup Tailscale routes restoration (prevents iptables conflicts)
    setup_tailscale_routes_restoration

    # 8. Print summary
    log "✅ Deployment completed successfully!"
    echo "----------------------------------------"
    echo "Deployment Summary:"
    echo "  Time: $(date)"
    echo "  Path: $DEPLOY_PATH"
    echo "----------------------------------------"
    compose_ps
}

# Execute
if [ "${1:-}" = "--infrastructure" ]; then
    log "Running infrastructure update mode"
    cd "$DEPLOY_PATH"
    update_infrastructure
else
    main "$@"
fi