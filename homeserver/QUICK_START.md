# Quick Start Guide - Arch Linux

## TL;DR - Get Running Fast

```bash
# Use the automated clean restart script
./restart-clean.sh
```

**That's it!** This script will:
- Stop all running containers
- Remove old containers (keeps your data)
- Free up ports
- Start everything fresh
- Show you the status

**Alternative Manual Method:**
```bash
# 1. Clean any old containers
./cleanup.sh  # Say 'y' to stop, 'no' to preserve volumes

# 2. Start services
podman-compose up -d

# 3. Check status
podman-compose ps
```

**Access URLs:**
- Home Assistant: http://localhost:8123
- Jellyfin: http://localhost:8096
- AdGuard Setup: http://localhost:3000
- AdGuard Web: http://localhost:3080
- Ollama WebUI: http://localhost:8081
- Samba: `smb://localhost:1445`

---

## Current Issues You're Seeing

### "Port 5353 already in use"
**Cause:** Old AdGuard container still running.

**Fix:**
```bash
# Stop all containers
podman-compose down

# Or specifically remove AdGuard
podman stop adguardhome
podman rm adguardhome

# Start fresh
podman-compose up -d
```

### "Error: statfs /run/podman/podman.sock"
**Cause:** Home Assistant config references non-existent socket.

**Fix:** Already fixed in podman-compose.yml (line commented out).

### "Port 139 permission denied"
**Cause:** Samba trying to use privileged port.

**Fix:** Already fixed - now uses port 1445 and 1139.

---

## Clean Start Procedure

```bash
# 1. Stop everything
podman-compose down

# 2. Remove old containers (keeps data)
podman ps -a --format "{{.Names}}" | xargs podman rm -f 2>/dev/null || true

# 3. Start services
podman-compose up -d

# 4. Watch logs
podman-compose logs -f
```

---

## Troubleshooting

### Check What's Running
```bash
podman ps -a
```

### Check Port Conflicts
```bash
# Arch Linux
sudo lsof -i :5353
sudo lsof -i :3080

# Or with netstat
netstat -tuln | grep -E ':5353|:3080|:1445'
```

### View Service Logs
```bash
# All services
podman-compose logs -f

# Specific service
podman-compose logs -f adguardhome
podman-compose logs -f homeassistant
```

### Restart Single Service
```bash
podman-compose restart adguardhome
podman-compose restart samba
```

### Remove and Recreate Service
```bash
podman-compose stop adguardhome
podman-compose rm -f adguardhome
podman-compose up -d adguardhome
```

---

## Port Reference (Rootless Podman)

| Service | Original Port | Mapped Port | Protocol |
|---------|---------------|-------------|----------|
| AdGuard DNS | 53 | **5353** | UDP/TCP |
| AdGuard Web | 80 | **3080** | TCP |
| AdGuard HTTPS | 443 | **3443** | TCP |
| Samba SMB | 445 | **1445** | TCP |
| Samba NetBIOS | 139 | **1139** | TCP |

All other services use standard ports (>1024).

---

## First Time Setup

### 1. AdGuard Home
1. Go to http://localhost:3000
2. Create admin account
3. Set upstream DNS (e.g., 1.1.1.1, 8.8.8.8)
4. Access dashboard at http://localhost:3080

**Configure Clients:**
- Option A: Set DNS to `your-server-ip:5353`
- Option B: Use port forwarding (see ARCH_LINUX_SETUP.md)

### 2. Home Assistant
1. Go to http://localhost:8123
2. Create account
3. Set location and units
4. Add integrations

### 3. Jellyfin
1. Go to http://localhost:8096
2. Create admin account
3. Add media libraries:
   - Movies: `/media/movies`
   - TV: `/media/tv`
   - Music: `/media/music`

### 4. Samba/NAS Access

**Linux:**
```bash
# Mount manually
sudo mount -t cifs //localhost:1445/Media /mnt/media -o port=1445,username=homelab

# Or use file manager
smb://localhost:1445/Media
```

**Windows:**
```powershell
# Map network drive
net use Z: \\localhost@1445\Media /user:homelab password
```

**macOS:**
```bash
# Finder > Go > Connect to Server
smb://localhost:1445/Media
```

---

## Common Commands

```bash
# Start all
podman-compose up -d

# Stop all
podman-compose down

# Restart all
podman-compose restart

# View status
podman-compose ps

# Update images
podman-compose pull
podman-compose up -d

# Clean everything (keeps data)
./cleanup.sh

# Remove everything including data
podman-compose down -v
```

---

## Need More Help?

- Full Arch setup: `ARCH_LINUX_SETUP.md`
- Troubleshooting: `TROUBLESHOOTING.md`
- Main README: `README.md`
