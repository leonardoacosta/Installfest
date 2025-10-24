#!/bin/bash
# Backup and Restore Library
# Consolidated backup/restore logic for homelab deployments

# Get script directory to source dependencies
BACKUP_LIB_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Source logging if not already loaded
if ! command -v log &> /dev/null; then
    source "$BACKUP_LIB_DIR/logging.sh"
fi

# Configuration (can be overridden by calling scripts)
DEPLOY_PATH="${DEPLOY_PATH:-$(pwd)}"
BACKUP_DIR="${BACKUP_DIR:-$DEPLOY_PATH/.backups}"
TIMESTAMP="${TIMESTAMP:-$(date +%Y%m%d_%H%M%S)}"
BACKUP_PATH="${BACKUP_PATH:-$BACKUP_DIR/backup_$TIMESTAMP}"
MAX_BACKUPS="${MAX_BACKUPS:-5}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

# ============= Backup Functions =============

create_backup() {
    log "Creating backup at $BACKUP_PATH"
    mkdir -p "$BACKUP_DIR"

    if [ -f "$DEPLOY_PATH/$COMPOSE_FILE" ]; then
        mkdir -p "$BACKUP_PATH"

        # Backup docker-compose files
        cp "$DEPLOY_PATH/$COMPOSE_FILE" "$BACKUP_PATH/"
        [ -f "$DEPLOY_PATH/.env" ] && cp "$DEPLOY_PATH/.env" "$BACKUP_PATH/" || true

        # Save current running services state
        cd "$DEPLOY_PATH"
        docker-compose -f "$COMPOSE_FILE" ps --format json > "$BACKUP_PATH/services_state.json" 2>/dev/null || true

        # Save docker volumes list (for reference)
        docker volume ls --format json > "$BACKUP_PATH/volumes_list.json" 2>/dev/null || true

        # Create a restore script for this backup
        cat > "$BACKUP_PATH/restore.sh" << 'RESTORE_EOF'
#!/bin/bash
# Restore script for this backup
# Usage: ./restore.sh [target_directory]

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TARGET_DIR="${1:-$SCRIPT_DIR/../..}"

echo "=========================================="
echo "  Homelab Backup Restore"
echo "=========================================="
echo "Restoring backup from: $SCRIPT_DIR"
echo "Target directory: $TARGET_DIR"
echo ""

# Confirm
read -p "Continue with restore? [y/N]: " confirm
if [[ "$confirm" != "y" ]]; then
    echo "Restore cancelled"
    exit 0
fi

# Restore files
echo "Restoring configuration files..."
cp "$SCRIPT_DIR/docker-compose.yml" "$TARGET_DIR/" || cp "$SCRIPT_DIR/docker-compose-optimized.yml" "$TARGET_DIR/docker-compose.yml"
[ -f "$SCRIPT_DIR/.env" ] && cp "$SCRIPT_DIR/.env" "$TARGET_DIR/"

# Restart services
echo "Restarting services..."
cd "$TARGET_DIR"
docker-compose down
docker-compose up -d

echo ""
echo "Restore completed successfully!"
echo "Check service status with: docker-compose ps"
RESTORE_EOF
        chmod +x "$BACKUP_PATH/restore.sh"

        success "Backup created successfully at $BACKUP_PATH"
        return 0
    else
        warning "No existing $COMPOSE_FILE found, skipping backup"
        return 0
    fi
}

# Cleanup old backups keeping only MAX_BACKUPS most recent
cleanup_backups() {
    log "Cleaning up old backups (keeping last $MAX_BACKUPS)"

    if [ ! -d "$BACKUP_DIR" ]; then
        info "No backup directory found, skipping cleanup"
        return 0
    fi

    cd "$BACKUP_DIR"
    local backup_count=$(ls -1 | wc -l)

    if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
        ls -t1 | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -rf
        success "Cleaned up $((backup_count - MAX_BACKUPS)) old backup(s)"
    else
        info "No cleanup needed ($backup_count backups, max: $MAX_BACKUPS)"
    fi
}

# Rollback to latest backup
rollback() {
    error "Initiating rollback to previous version"

    if [ ! -d "$BACKUP_DIR" ]; then
        error "No backup directory found at: $BACKUP_DIR"
        return 1
    fi

    LATEST_BACKUP=$(ls -t1 "$BACKUP_DIR" 2>/dev/null | head -n1)

    if [ -z "$LATEST_BACKUP" ]; then
        error "No backups found in: $BACKUP_DIR"
        return 1
    fi

    if [ ! -d "$BACKUP_DIR/$LATEST_BACKUP" ]; then
        error "Backup directory does not exist: $BACKUP_DIR/$LATEST_BACKUP"
        return 1
    fi

    log "Restoring from backup: $LATEST_BACKUP"

    # Use the restore script if available
    if [ -x "$BACKUP_DIR/$LATEST_BACKUP/restore.sh" ]; then
        log "Using backup's restore script"
        "$BACKUP_DIR/$LATEST_BACKUP/restore.sh" "$DEPLOY_PATH"
    else
        # Manual restore
        log "Performing manual restore"

        # Restore configuration files
        if [ -f "$BACKUP_DIR/$LATEST_BACKUP/$COMPOSE_FILE" ]; then
            cp "$BACKUP_DIR/$LATEST_BACKUP/$COMPOSE_FILE" "$DEPLOY_PATH/"
        else
            error "No $COMPOSE_FILE found in backup"
            return 1
        fi

        [ -f "$BACKUP_DIR/$LATEST_BACKUP/.env" ] && cp "$BACKUP_DIR/$LATEST_BACKUP/.env" "$DEPLOY_PATH/"

        # Restart services
        cd "$DEPLOY_PATH"
        docker-compose -f "$COMPOSE_FILE" down
        docker-compose -f "$COMPOSE_FILE" up -d
    fi

    success "Rollback completed"
    return 0
}

# List all available backups
list_backups() {
    if [ ! -d "$BACKUP_DIR" ]; then
        warning "No backup directory found"
        return 1
    fi

    echo "Available backups in $BACKUP_DIR:"
    echo "----------------------------------------"

    local count=0
    for backup in $(ls -t1 "$BACKUP_DIR" 2>/dev/null); do
        count=$((count + 1))
        local backup_date=$(echo "$backup" | sed 's/backup_//')
        local formatted_date=$(echo "$backup_date" | sed 's/_/ /')
        local size=$(du -sh "$BACKUP_DIR/$backup" 2>/dev/null | cut -f1)
        echo "$count) $formatted_date ($size)"
    done

    if [ "$count" -eq 0 ]; then
        warning "No backups found"
        return 1
    fi

    echo "----------------------------------------"
    echo "Total: $count backup(s)"
    return 0
}

# Restore from a specific backup (by number or name)
restore_specific_backup() {
    local backup_id="$1"

    if [ -z "$backup_id" ]; then
        error "No backup specified"
        list_backups
        return 1
    fi

    if [ ! -d "$BACKUP_DIR" ]; then
        error "No backup directory found"
        return 1
    fi

    # If numeric, get the nth backup
    if [[ "$backup_id" =~ ^[0-9]+$ ]]; then
        SELECTED_BACKUP=$(ls -t1 "$BACKUP_DIR" 2>/dev/null | sed -n "${backup_id}p")
    else
        SELECTED_BACKUP="$backup_id"
    fi

    if [ -z "$SELECTED_BACKUP" ] || [ ! -d "$BACKUP_DIR/$SELECTED_BACKUP" ]; then
        error "Backup not found: $backup_id"
        list_backups
        return 1
    fi

    log "Restoring from backup: $SELECTED_BACKUP"

    if [ -x "$BACKUP_DIR/$SELECTED_BACKUP/restore.sh" ]; then
        "$BACKUP_DIR/$SELECTED_BACKUP/restore.sh" "$DEPLOY_PATH"
    else
        # Manual restore
        cp "$BACKUP_DIR/$SELECTED_BACKUP/$COMPOSE_FILE" "$DEPLOY_PATH/"
        [ -f "$BACKUP_DIR/$SELECTED_BACKUP/.env" ] && cp "$BACKUP_DIR/$SELECTED_BACKUP/.env" "$DEPLOY_PATH/"

        cd "$DEPLOY_PATH"
        docker-compose -f "$COMPOSE_FILE" down
        docker-compose -f "$COMPOSE_FILE" up -d
    fi

    success "Restore completed from: $SELECTED_BACKUP"
    return 0
}
