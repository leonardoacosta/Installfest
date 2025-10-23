# Homer Service Icons

This directory contains icons for the services displayed on the Homer dashboard.

## Icon Requirements

- Recommended size: 64x64 or 128x128 pixels
- Format: PNG with transparency (preferred) or SVG
- File naming: Use lowercase with hyphens (e.g., `home-assistant.png`)

## Default Icons

Homer will use Font Awesome icons if no image is provided. To use custom icons:

1. Download service logos from their official sources
2. Resize to 64x64 or 128x128 pixels
3. Save as PNG with transparent background
4. Place in this directory with appropriate filename

## Quick Download Commands

You can download icons using these commands:

```bash
# Create tools directory if it doesn't exist
mkdir -p /Users/leonardoacosta/Personal/Installfest/homelab/homer/assets/tools

# Download some popular service icons (you'll need to find and download these manually)
# Most services provide brand assets on their GitHub repos or websites

# Example URLs (these are placeholders - find actual icon URLs):
# wget -O home-assistant.png https://github.com/home-assistant/brands/raw/master/core_integrations/homeassistant/icon.png
# wget -O jellyfin.png https://raw.githubusercontent.com/jellyfin/jellyfin-ux/master/branding/SVG/icon-transparent.svg
# wget -O nginx-proxy-manager.png https://nginxproxymanager.com/icon.png
```

## Alternative: Use Dashboard Icons Repository

You can also use the dashboard-icons project which provides a collection of service icons:

```bash
# Clone the dashboard-icons repository
git clone https://github.com/walkxcode/dashboard-icons.git /tmp/dashboard-icons

# Copy needed icons
cp /tmp/dashboard-icons/png/jellyfin.png ./
cp /tmp/dashboard-icons/png/home-assistant.png ./
cp /tmp/dashboard-icons/png/adguard-home.png ./
# ... etc

# Clean up
rm -rf /tmp/dashboard-icons
```

## Fallback Icons

If an icon file is not found, Homer will display:

1. The Font Awesome icon specified in the service configuration
2. A generic placeholder icon
3. The first letter of the service name
