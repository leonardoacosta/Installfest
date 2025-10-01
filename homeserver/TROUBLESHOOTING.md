# Troubleshooting Guide - Homeserver Stack

## Common Issues on Arch Linux

### "no container with name or ID found" Errors

**Symptom:** When running `./start.sh status`, you see:
```
no container with name or ID "homeassistant" found: no such container
no container with name or ID "samba" found: no such container
```

**Root Causes:**

1. **Services not started yet** - The containers haven't been created because `podman-compose up` hasn't been run
2. **Services commented out** - Some services in `podman-compose.yml` are commented out by default
3. **Health check references non-existent containers** - The script tried to check specific container names

**Solutions:**

✅ **Fixed in latest version** - `start.sh` now:
- Checks services by port availability instead of container names
- Handles missing containers gracefully
- Shows clear error messages when services fail to start

**Manual Steps if Issues Persist:**

1. **Verify services are defined and uncommented in podman-compose.yml:**
   ```bash
   grep -A5 "homeassistant:" podman-compose.yml
   grep -A5 "samba:" podman-compose.yml
   ```

2. **Start services explicitly:**
   ```bash
   podman-compose up -d homeassistant samba
   ```

3. **Check what containers are actually running:**
   ```bash
   podman ps --all
   ```

4. **View logs for specific service:**
   ```bash
   podman-compose logs homeassistant
   podman-compose logs samba
   ```

### Home Assistant Container Issues

**Issue:** Home Assistant uses `network_mode: host` which prevents it from being in a pod.

**Expected behavior:** This is normal. Home Assistant needs host networking for device discovery.

**Verify it's running:**
```bash
curl -I http://localhost:8123
# or
ss -tulpn | grep :8123
```

### Samba/NAS Not Starting

**Common causes:**

1. **Port 445/139 already in use:**
   ```bash
   sudo ss -tulpn | grep -E ':445|:139'
   ```

2. **SELinux blocking (if enabled):**
   ```bash
   # Check SELinux status
   sestatus

   # If enforcing, add :z to volumes in podman-compose.yml
   volumes:
     - ${NAS_PATH:-/data}:/media:z
   ```

3. **Missing environment variables:**
   ```bash
   # Check .env file has required values
   grep SAMBA .env
   ```

### Permission Issues with Rootless Podman

**Symptom:** Permission denied errors when containers try to write to `/data`

**Solution:**
```bash
# Set proper ownership for rootless containers
podman unshare chown -R 1000:1000 /data

# Verify subuid/subgid mappings
grep $USER /etc/subuid
grep $USER /etc/subgid

# Should see something like:
# username:100000:65536
```

### Podman Socket Not Active

**Symptom:** `podman-compose` commands fail with connection errors

**Solution:**
```bash
# Start podman socket
systemctl --user enable --now podman.socket

# Verify it's running
systemctl --user status podman.socket

# Enable lingering (survives logout)
sudo loginctl enable-linger $USER
```

### Services Fail to Start After Reboot

**Solution:** Enable systemd service for auto-start:

```bash
# Copy service file
cp homeserver.service ~/.config/systemd/user/

# Edit paths in service file
nano ~/.config/systemd/user/homeserver.service

# Enable and start
systemctl --user daemon-reload
systemctl --user enable homeserver.service
systemctl --user start homeserver.service

# Check status
systemctl --user status homeserver.service
```

## Installation Issues

### Install Script Doesn't Create All Directories

**Fixed in latest version** - `install-arch.sh` now creates:
- Media directories (`/data/media/{movies,tv,music}`)
- Download directories (`/data/downloads/{complete,incomplete}`)
- All service config directories (homeassistant, jellyfin, etc.)

**If directories are missing:**
```bash
# Run setup wizard in start.sh
./start.sh wizard

# Or manually create
mkdir -p homeassistant adguardhome/{work,conf}
mkdir -p jellyfin/{config,cache} tailscale/state
```

### Missing .env File

**Fixed in latest version** - `install-arch.sh` now:
- Creates `.env` from `env.example` if available
- Generates minimal `.env` with defaults if `env.example` missing
- Warns you to edit the file

**Required .env variables:**
```bash
TZ=America/New_York
PUID=1000
PGID=1000
MEDIA_PATH=/data/media
DOWNLOADS_PATH=/data/downloads
```

## Debugging Commands

### Check All Container Status
```bash
podman ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### View Compose File Validation
```bash
podman-compose config
```

### Check Podman System Info
```bash
podman info
podman system df
```

### View Service Logs
```bash
# All services
podman-compose logs -f

# Specific service
podman-compose logs -f homeassistant

# Last 50 lines
podman-compose logs --tail=50 jellyfin
```

### Test Port Connectivity
```bash
# Check if port is listening
ss -tulpn | grep :8123

# Test connection
timeout 2 bash -c "echo > /dev/tcp/localhost/8123" && echo "Port open" || echo "Port closed"

# Using curl
curl -I http://localhost:8123
```

### Restart Everything Clean
```bash
# Stop all
podman-compose down

# Remove volumes (WARNING: deletes data)
podman-compose down -v

# Start fresh
podman-compose up -d
```

## Getting Help

When asking for help, provide:

1. **OS and version:**
   ```bash
   cat /etc/arch-release
   uname -a
   ```

2. **Podman version:**
   ```bash
   podman --version
   podman-compose --version
   ```

3. **Container status:**
   ```bash
   podman ps -a
   ```

4. **Recent logs:**
   ```bash
   podman-compose logs --tail=100 > logs.txt
   ```

5. **Environment (sanitized - remove passwords):**
   ```bash
   cat .env | grep -v PASSWORD | grep -v KEY | grep -v SECRET
   ```
