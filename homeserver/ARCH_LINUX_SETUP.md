# Arch Linux Specific Setup Guide

## Critical Issues Fixed

### 1. Rootless Podman Port Restrictions

**Problem:** Rootless Podman cannot bind to privileged ports (< 1024) without sysctl changes.

**Solution Applied:** Changed AdGuard ports to unprivileged range:
- DNS: `53` → `5353` (use this in your router/clients)
- Web UI: `80` → `3080` (access at http://localhost:3080)
- HTTPS: `443` → `3443`

**Alternative (Root Access Required):**
```bash
# Allow rootless containers to use ports < 1024
echo 'net.ipv4.ip_unprivileged_port_start=53' | sudo tee /etc/sysctl.d/99-unprivileged-ports.conf
sudo sysctl --system

# Then revert ports in podman-compose.yml to original values
```

### 2. Missing Device Files

**Problem:** `/dev/ttyUSB0` doesn't exist unless you have USB devices (Zigbee/Z-Wave).

**Solution:** Commented out the device mapping in `podman-compose.yml`.

**To Enable USB Devices:**
```bash
# Check what USB devices you have
ls -la /dev/ttyUSB* /dev/ttyACM*

# Uncomment these lines in podman-compose.yml:
# devices:
#   - /dev/ttyUSB0:/dev/ttyUSB0
```

### 3. Missing Backup Directory

**Problem:** `/backup` directory referenced but doesn't exist.

**Solution:** Commented out backup volume mount in Samba service.

**To Enable Backups:**
```bash
# Create backup directory
sudo mkdir -p /backup
sudo chown -R $USER:$USER /backup

# Uncomment in podman-compose.yml:
# - ${BACKUP_PATH:-/backup}:/backup
```

### 4. Container Name Conflicts

**Problem:** Error messages like "no container with name or ID 'samba' found"

**Cause:** Podman-compose trying to stop old containers that don't exist yet.

**Solution:** Clean start:
```bash
# Remove all old containers and volumes
podman-compose down -v

# Start fresh
podman-compose up -d
```

## First Time Setup on Arch Linux

### 1. Run Installation Script
```bash
cd /path/to/homeserver
./install-arch.sh
```

This will:
- Install Podman/Docker
- Create all required directories
- Set up rootless container support
- Generate `.env` file

### 2. Edit Configuration
```bash
nano .env
```

**Required Changes:**
- Change all passwords (search for "changeme" and "password123")
- Add Tailscale auth key if using VPN
- Add VPN credentials if using media stack

### 3. Clean Start
```bash
# Make sure no old containers exist
podman-compose down -v

# Start services
./start.sh wizard
# Or manually:
podman-compose up -d
```

### 4. Access Services

**Updated URLs for Arch Linux (Rootless Podman):**
- **AdGuard Home Setup:** http://localhost:3000
- **AdGuard Home Web UI:** http://localhost:3080 (not 80!)
- **AdGuard DNS:** Port 5353 (not 53!)
- **Home Assistant:** http://localhost:8123
- **Jellyfin:** http://localhost:8096
- **Ollama WebUI:** http://localhost:8081
- **Samba/NAS:** smb://localhost:1445 (not standard 445!)

**Note:** All privileged ports (<1024) are remapped to >1024 for rootless Podman.

## Using AdGuard DNS on Port 5353

Since DNS is on non-standard port 5353, you have options:

### Option 1: Port Forwarding (Recommended)
```bash
# Forward port 53 → 5353 using iptables
sudo iptables -t nat -A PREROUTING -p udp --dport 53 -j REDIRECT --to-port 5353
sudo iptables -t nat -A PREROUTING -p tcp --dport 53 -j REDIRECT --to-port 5353

# Make permanent (Arch Linux)
sudo pacman -S iptables-persistent
sudo netfilter-persistent save
```

### Option 2: Use Port 5353 Directly
Configure clients to use `your-server-ip:5353` as DNS server.

### Option 3: Enable Privileged Ports (See above)

## Rootless Podman Best Practices on Arch

### Enable Lingering
```bash
# Allows containers to run after logout
sudo loginctl enable-linger $USER
```

### Check Subuid/Subgid
```bash
grep $USER /etc/subuid
grep $USER /etc/subgid
# Should show: username:100000:65536
```

### Fix Permissions
```bash
# For rootless containers, map UID 1000 inside container to your user
podman unshare chown -R 1000:1000 /data
```

### Enable Podman Socket
```bash
systemctl --user enable --now podman.socket
systemctl --user status podman.socket
```

### Auto-Start on Boot
```bash
# Copy systemd service
cp homeserver.service ~/.config/systemd/user/

# Edit WorkingDirectory path
nano ~/.config/systemd/user/homeserver.service

# Enable
systemctl --user daemon-reload
systemctl --user enable homeserver.service
systemctl --user start homeserver.service
```

## Troubleshooting Arch-Specific Issues

### Podman Socket Issues
```bash
# Restart socket
systemctl --user restart podman.socket

# Check status
systemctl --user status podman.socket

# View logs
journalctl --user -u podman.socket -f
```

### Permission Denied Errors
```bash
# Check subuid/subgid
cat /etc/subuid
cat /etc/subgid

# Re-apply permissions
podman unshare chown -R 1000:1000 /data

# Check sysctl settings
sysctl kernel.unprivileged_userns_clone
# Should be 1
```

### Firewall Blocking Ports
```bash
# If using ufw
sudo ufw allow 5353/udp  # AdGuard DNS
sudo ufw allow 3080/tcp  # AdGuard Web UI
sudo ufw allow 8123/tcp  # Home Assistant
sudo ufw allow 8096/tcp  # Jellyfin

# If using firewalld
sudo firewall-cmd --add-port=5353/udp --permanent
sudo firewall-cmd --add-port=3080/tcp --permanent
sudo firewall-cmd --add-port=8123/tcp --permanent
sudo firewall-cmd --add-port=8096/tcp --permanent
sudo firewall-cmd --reload
```

### SELinux Issues (if enabled)
```bash
# Check if SELinux is enabled
sestatus

# Add :z flag to all volume mounts in podman-compose.yml
volumes:
  - ./homeassistant:/config:z
  - /data/media:/media:z
```

### Container Won't Start
```bash
# View detailed logs
podman-compose logs -f SERVICE_NAME

# Check container status
podman ps -a

# Remove and recreate
podman-compose down
podman-compose up -d SERVICE_NAME
```

## Performance Tuning for Arch

Already applied by install-arch.sh:
```bash
# File watching limits
fs.inotify.max_user_watches=524288

# Memory mapping for databases
vm.max_map_count=262144

# Rootless containers
kernel.unprivileged_userns_clone=1
```

## Network Configuration

### Using Host Network (Home Assistant)
Home Assistant uses `network_mode: host` which:
- ✅ Enables device discovery
- ✅ Works with mDNS/Zeroconf
- ⚠️ Cannot be in a pod
- ⚠️ Bypasses network isolation

### Bridge Networks (Everything Else)
Two networks defined:
- `homelab` (172.20.0.0/16) - Core services
- `media` (172.21.0.0/16) - Media stack with VPN

## Updating Services
```bash
# Pull latest images
podman-compose pull

# Recreate containers
podman-compose up -d

# Or use the manager script
./start.sh
# Then choose option 11 (Update all images)
```

## Clean Removal
```bash
# Stop all services
podman-compose down

# Remove volumes (WARNING: deletes all data!)
podman-compose down -v

# Remove images
podman rmi $(podman images -q)
```
