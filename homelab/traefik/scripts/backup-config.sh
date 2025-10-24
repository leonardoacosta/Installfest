#!/bin/bash

# Script to backup Traefik configuration and certificates
# Usage: ./backup-config.sh [backup-directory]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default backup directory
BACKUP_DIR="${1:-$HOME/traefik-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="traefik-backup-$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Traefik directory (relative to script location)
TRAEFIK_DIR="$(dirname "$0")/.."

echo -e "${BLUE}=== Traefik Configuration Backup ===${NC}"
echo ""
echo "Backup location: $BACKUP_PATH"
echo ""

# Create backup directory
mkdir -p "$BACKUP_PATH"

# Backup static configuration
echo -e "${YELLOW}[1/4] Backing up static configuration...${NC}"
if [ -f "$TRAEFIK_DIR/traefik.yml" ]; then
    cp "$TRAEFIK_DIR/traefik.yml" "$BACKUP_PATH/"
    echo -e "${GREEN}✓ traefik.yml backed up${NC}"
else
    echo -e "${RED}✗ traefik.yml not found${NC}"
fi

# Backup dynamic configuration
echo -e "${YELLOW}[2/4] Backing up dynamic configuration...${NC}"
if [ -d "$TRAEFIK_DIR/dynamic" ]; then
    cp -r "$TRAEFIK_DIR/dynamic" "$BACKUP_PATH/"
    echo -e "${GREEN}✓ dynamic/ directory backed up${NC}"
else
    echo -e "${RED}✗ dynamic/ directory not found${NC}"
fi

# Backup Let's Encrypt certificates
echo -e "${YELLOW}[3/4] Backing up certificates...${NC}"
if [ -f "$TRAEFIK_DIR/letsencrypt/acme.json" ]; then
    mkdir -p "$BACKUP_PATH/letsencrypt"
    cp "$TRAEFIK_DIR/letsencrypt/acme.json" "$BACKUP_PATH/letsencrypt/"

    # Verify permissions
    chmod 600 "$BACKUP_PATH/letsencrypt/acme.json"

    echo -e "${GREEN}✓ acme.json backed up (with secure permissions)${NC}"
else
    echo -e "${YELLOW}⚠ acme.json not found (no certificates yet?)${NC}"
fi

# Create archive
echo -e "${YELLOW}[4/4] Creating compressed archive...${NC}"
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"

if [ $? -eq 0 ]; then
    # Remove uncompressed backup
    rm -rf "$BACKUP_NAME"

    ARCHIVE_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
    echo -e "${GREEN}✓ Archive created: ${BACKUP_NAME}.tar.gz (${ARCHIVE_SIZE})${NC}"
else
    echo -e "${RED}✗ Failed to create archive${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}=== Backup Complete ===${NC}"
echo "Backup file: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo ""

# List recent backups
echo -e "${BLUE}Recent backups:${NC}"
ls -lth "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -5 || echo "No previous backups found"

echo ""
echo -e "${GREEN}Backup successful!${NC}"
echo ""
echo "To restore this backup:"
echo "  1. Extract: tar -xzf $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "  2. Copy files back to traefik directory"
echo "  3. Restart Traefik: docker-compose restart traefik"
echo ""
echo "To automate backups, add to crontab:"
echo "  0 2 * * * $(readlink -f "$0") > /var/log/traefik-backup.log 2>&1"
