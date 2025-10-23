#!/bin/bash

# Create networking optimization documents for all services
services=(
  "home-assistant:8123:HTTP/WebSocket:High:Yes:Management+IoT"
  "adguard-home:53,3000:DNS+HTTP:Critical:Yes:Management"
  "ollama:11434:HTTP/API:Medium:No:Services"
  "jellyfin:8096:HTTP/HTTPS:High:Yes:Media"
  "nginx-proxy-manager:81,80,443:HTTP/HTTPS:Critical:Yes:DMZ"
  "tailscale:41641:WireGuard:Critical:Special:Management"
  "samba:445,139:SMB/CIFS:High:No:Storage"
  "gluetun:VPN:Multiple:High:No:Secure"
  "qbittorrent:8080:HTTP:Medium:Via-VPN:Download"
  "prowlarr:9696:HTTP:Medium:Optional:Services"
  "radarr:7878:HTTP:Medium:Optional:Services"
  "sonarr:8989:HTTP:Medium:Optional:Services"
  "lidarr:8686:HTTP:Medium:Optional:Services"
  "bazarr:6767:HTTP:Low:Optional:Services"
  "jellyseerr:5055:HTTP:High:Yes:Services"
  "byparr:8191:HTTP:Low:No:Services"
  "vaultwarden:80:HTTP/WebSocket:Critical:Yes:Security"
  "nzbget:6789:HTTP:Medium:Optional:Download"
)

echo "Created networking optimization documentation generation script"
