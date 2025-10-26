#!/bin/bash
# Script to test if a service is accessible through Traefik
# Usage: ./test-service.sh service-name.local

set -e

# Get script directory and try to source common utilities if available
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
COMMON_UTILS="$SCRIPT_DIR/../../scripts/common-utils.sh"

# Source common utilities if available, otherwise define colors locally
if [ -f "$COMMON_UTILS" ]; then
    source "$COMMON_UTILS"
else
    # Fallback color definitions if common-utils.sh is not available
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
fi

if [ -z "$1" ]; then
    echo "Usage: $0 domain"
    echo "Example: $0 glance.local"
    exit 1
fi

DOMAIN="$1"
TRAEFIK_IP="172.20.0.81"  # Default Traefik IP on homelab network

echo -e "${BLUE}=== Testing Service: ${DOMAIN} ===${NC}"
echo ""

# Test 1: DNS Resolution
echo -e "${YELLOW}[1/5] Testing DNS resolution...${NC}"
if host "$DOMAIN" &> /dev/null; then
    RESOLVED_IP=$(host "$DOMAIN" | grep "has address" | awk '{print $4}' | head -1)
    echo -e "${GREEN}✓ DNS resolves to: ${RESOLVED_IP}${NC}"
else
    echo -e "${YELLOW}⚠ DNS not configured (this is OK for local testing)${NC}"
    echo "Add to /etc/hosts: $TRAEFIK_IP $DOMAIN"
fi
echo ""

# Test 2: HTTP Redirect
echo -e "${YELLOW}[2/5] Testing HTTP → HTTPS redirect...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "http://$DOMAIN" --max-time 5 --resolve "$DOMAIN:80:$TRAEFIK_IP" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ] || [ "$HTTP_STATUS" = "308" ]; then
    echo -e "${GREEN}✓ HTTP redirect working (Status: ${HTTP_STATUS})${NC}"
else
    echo -e "${RED}✗ HTTP request failed (Status: ${HTTP_STATUS})${NC}"
fi
echo ""

# Test 3: HTTPS Access
echo -e "${YELLOW}[3/5] Testing HTTPS access...${NC}"
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -k "https://$DOMAIN" --max-time 5 --resolve "$DOMAIN:443:$TRAEFIK_IP" 2>/dev/null || echo "000")

if [ "$HTTPS_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ HTTPS working (Status: ${HTTPS_STATUS})${NC}"
elif [ "$HTTPS_STATUS" = "401" ]; then
    echo -e "${GREEN}✓ HTTPS working - requires authentication (Status: ${HTTPS_STATUS})${NC}"
else
    echo -e "${RED}✗ HTTPS request failed (Status: ${HTTPS_STATUS})${NC}"
fi
echo ""

# Test 4: SSL Certificate
echo -e "${YELLOW}[4/5] Testing SSL certificate...${NC}"
CERT_INFO=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null || echo "")

if [ -n "$CERT_INFO" ]; then
    echo -e "${GREEN}✓ SSL certificate found${NC}"
    echo "$CERT_INFO" | sed 's/^/  /'
else
    echo -e "${YELLOW}⚠ Could not retrieve certificate (might be self-signed or not yet issued)${NC}"
fi
echo ""

# Test 5: Security Headers
echo -e "${YELLOW}[5/5] Testing security headers...${NC}"
HEADERS=$(curl -s -I -k "https://$DOMAIN" --max-time 5 --resolve "$DOMAIN:443:$TRAEFIK_IP" 2>/dev/null)

check_header() {
    local header="$1"
    if echo "$HEADERS" | grep -qi "^${header}:"; then
        echo -e "${GREEN}  ✓ ${header}${NC}"
    else
        echo -e "${RED}  ✗ ${header} missing${NC}"
    fi
}

check_header "Strict-Transport-Security"
check_header "X-Content-Type-Options"
check_header "X-Frame-Options"
check_header "Referrer-Policy"

echo ""
echo -e "${BLUE}=== Summary ===${NC}"

# Overall result
if [ "$HTTPS_STATUS" = "200" ] || [ "$HTTPS_STATUS" = "401" ]; then
    echo -e "${GREEN}✓ Service is accessible through Traefik${NC}"
    echo ""
    echo "Access URL: https://$DOMAIN"
else
    echo -e "${RED}✗ Service is NOT accessible through Traefik${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check if service is running: docker ps | grep service-name"
    echo "2. Check Traefik logs: docker logs traefik | grep -i $DOMAIN"
    echo "3. Check service labels: docker inspect service-name | grep traefik"
    echo "4. Test direct access: curl http://service-ip:port"
    echo "5. Check Traefik dashboard: https://traefik.local"
fi

echo ""
echo "Full headers:"
echo "$HEADERS" | sed 's/^/  /'