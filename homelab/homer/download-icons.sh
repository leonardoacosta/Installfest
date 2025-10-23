#!/bin/bash

# Homer Dashboard Icon Download Script
# Downloads service icons from the dashboard-icons repository

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Homer Dashboard Icon Downloader${NC}"
echo "=================================="

# Check if we're in the right directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ASSETS_DIR="${SCRIPT_DIR}/assets/tools"

# Create tools directory if it doesn't exist
mkdir -p "${ASSETS_DIR}"

echo -e "${YELLOW}Downloading icons to: ${ASSETS_DIR}${NC}"

# Function to download icon from dashboard-icons repo
download_icon() {
    local service_name=$1
    local icon_name=${2:-$1}
    local url="https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/png/${icon_name}.png"

    echo -n "Downloading ${service_name}... "

    if curl -s -f -L "${url}" -o "${ASSETS_DIR}/${service_name}.png" 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        # Try with different naming convention
        url="https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/png/${icon_name}-light.png"
        if curl -s -f -L "${url}" -o "${ASSETS_DIR}/${service_name}.png" 2>/dev/null; then
            echo -e "${GREEN}✓${NC}"
            return 0
        else
            echo -e "${RED}✗ (not found)${NC}"
            return 1
        fi
    fi
}

# Download icons for all services
echo ""
echo "Downloading service icons..."
echo "----------------------------"

# Infrastructure
download_icon "nginx-proxy-manager" "nginx-proxy-manager"
download_icon "adguard-home" "adguard-home"
download_icon "tailscale" "tailscale"
download_icon "vaultwarden" "vaultwarden"

# Home Automation
download_icon "home-assistant" "home-assistant"

# AI & Development
download_icon "ollama" "ollama"

# Media & Entertainment
download_icon "jellyfin" "jellyfin"
download_icon "jellyseerr" "jellyseerr"
download_icon "radarr" "radarr"
download_icon "sonarr" "sonarr"
download_icon "lidarr" "lidarr"
download_icon "bazarr" "bazarr"

# Download Management
download_icon "qbittorrent" "qbittorrent"
download_icon "prowlarr" "prowlarr"
download_icon "nzbget" "nzbget"

# Storage
download_icon "samba" "samba"

echo ""
echo "----------------------------"

# Count downloaded icons
ICON_COUNT=$(ls -1 "${ASSETS_DIR}"/*.png 2>/dev/null | wc -l)

if [ ${ICON_COUNT} -gt 0 ]; then
    echo -e "${GREEN}Successfully downloaded ${ICON_COUNT} icons!${NC}"
else
    echo -e "${YELLOW}No icons were downloaded. You may need to manually add icons.${NC}"
fi

echo ""
echo "Missing icons can be manually added to: ${ASSETS_DIR}/"
echo "Recommended icon size: 64x64 or 128x128 pixels (PNG format)"

# Create a default logo.png if it doesn't exist
if [ ! -f "${SCRIPT_DIR}/assets/logo.png" ]; then
    echo ""
    echo -e "${YELLOW}Note: No logo.png found. Consider adding a custom logo to ${SCRIPT_DIR}/assets/logo.png${NC}"
fi

exit 0