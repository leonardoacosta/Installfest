# Deployment Checklist

**Target: Arch Linux Server with Rootless Podman (not macOS/Docker)**

## Pre-Deployment

1. **Copy files to Arch Linux server:**
   ```bash
   scp -r homeserver/ user@arch-server:~/
   ```

2. **SSH to server:**
   ```bash
   ssh user@arch-server
   cd ~/homeserver
   ```

## On Arch Linux Server

1. **Install dependencies:**
   ```bash
   ./homeserver.sh install
   ```

2. **Configure environment:**
   ```bash
   ./homeserver.sh setup
   # Or manually: cp env.example .env && nano .env
   ```

3. **Start services:**
   ```bash
   ./homeserver.sh restart
   ```

4. **Verify status:**
   ```bash
   ./homeserver.sh status
   ```

## Configuration Summary

### Services (VPN-dependent ones commented out)
✅ **Active:**
- homeassistant, adguardhome, ollama, ollama-webui
- jellyfin, samba, tailscale
- radarr, sonarr, lidarr, bazarr, jellyseerr, flaresolverr

❌ **Commented (require VPN config):**
- gluetun, qbittorrent, prowlarr, nzbget

### Port Mappings (Rootless Podman)
- AdGuard DNS: 53 → 5353
- AdGuard Web: 80 → 3080
- AdGuard HTTPS: 443 → 3443
- Samba SMB: 445 → 1445
- Samba NetBIOS: 139 → 1139

## Enable VPN Services (Optional)

1. **Configure VPN in .env:**
   ```bash
   nano .env
   # Add VPN credentials (see env.example)
   ```

2. **Uncomment in podman-compose.yml:**
   - gluetun service
   - qbittorrent service
   - prowlarr service
   - nzbget service

3. **Restart:**
   ```bash
   ./homeserver.sh restart
   ```

## Troubleshooting

See `./homeserver.sh` → option 7 for interactive troubleshooting.
