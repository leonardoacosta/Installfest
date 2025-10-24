#!/bin/bash

# Script to check Let's Encrypt certificate status
# Usage: ./check-certificates.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ACME_FILE="$(dirname "$0")/../letsencrypt/acme.json"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    echo "Install it with: sudo apt-get install jq"
    exit 1
fi

# Check if acme.json exists
if [ ! -f "$ACME_FILE" ]; then
    echo -e "${RED}Error: acme.json not found at $ACME_FILE${NC}"
    echo "Make sure Traefik has requested certificates first"
    exit 1
fi

echo -e "${BLUE}=== Traefik SSL Certificate Status ===${NC}"
echo ""

# Check if file has certificates
CERT_COUNT=$(jq '.letsencrypt.Certificates | length' "$ACME_FILE" 2>/dev/null || echo "0")

if [ "$CERT_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}No certificates found in acme.json${NC}"
    echo "This is normal if:"
    echo "  - This is a fresh installation"
    echo "  - Services haven't been accessed yet"
    echo "  - Using local domains without internet access"
    exit 0
fi

echo -e "${GREEN}Found $CERT_COUNT certificate(s)${NC}"
echo ""

# List all certificates with details
jq -r '.letsencrypt.Certificates[] |
  "Domain: \(.domain.main)\n" +
  "SANs: \(.domain.sans // [] | join(", "))\n" +
  "Certificate: \(.certificate | .[0:60])...\n" +
  "---"' "$ACME_FILE"

echo ""
echo -e "${BLUE}=== Certificate File Permissions ===${NC}"
ls -lh "$ACME_FILE"

# Check permissions
PERMS=$(stat -c %a "$ACME_FILE" 2>/dev/null || stat -f %A "$ACME_FILE" 2>/dev/null)
if [ "$PERMS" != "600" ]; then
    echo -e "${YELLOW}Warning: acme.json has permissions $PERMS, should be 600${NC}"
    echo "Fix with: chmod 600 $ACME_FILE"
else
    echo -e "${GREEN}Permissions are correct (600)${NC}"
fi

echo ""
echo -e "${BLUE}=== Let's Encrypt Rate Limits ===${NC}"
echo "Production: 50 certificates per domain per week"
echo "Staging: No rate limits (use for testing)"
echo "More info: https://letsencrypt.org/docs/rate-limits/"

echo ""
echo -e "${BLUE}=== Useful Commands ===${NC}"
echo "View all domains:"
echo "  jq '.letsencrypt.Certificates[].domain.main' $ACME_FILE"
echo ""
echo "Check certificate expiration:"
echo "  # Extract cert and check with openssl (advanced)"
echo ""
echo "Force certificate renewal:"
echo "  docker-compose restart traefik"
echo "  # Traefik will automatically renew if needed"
