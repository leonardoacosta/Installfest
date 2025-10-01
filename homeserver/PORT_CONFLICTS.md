# Port Conflicts - Quick Fix

## The Errors You're Seeing

```
Error: unable to start container: rootlessport listen udp 0.0.0.0:5353: bind: address already in use
Error: unable to start container: rootlessport listen udp 0.0.0.0:1900: bind: address already in use
```

## What This Means

**Containers are already running** from a previous `podman-compose up` command. Podman is trying to start new containers on the same ports, causing conflicts.

## Quick Fix - Use the Restart Script

```bash
./restart-clean.sh
```

This automated script will:
1. ✓ Stop all running containers
2. ✓ Remove old containers (keeps data)
3. ✓ Wait for ports to free up
4. ✓ Start everything fresh
5. ✓ Show you the status

**Done in one command!**

## Manual Fix (If You Prefer)

### Step 1: Stop Everything
```bash
podman-compose down
```

### Step 2: Force Remove All Containers
```bash
# List all containers
podman ps -a

# Remove all containers (keeps volumes/data)
podman ps -a -q | xargs podman rm -f 2>/dev/null || true
```

### Step 3: Verify Ports Are Free
```bash
# Check if ports are still in use
ss -tuln | grep -E ':5353|:3080|:8123|:1900'

# If anything shows up, wait a few seconds
sleep 5
```

### Step 4: Start Fresh
```bash
podman-compose up -d
```

## Understanding the Errors

### "no container with name or ID 'homeassistant' found"
- **Harmless warning** - compose tries to stop containers that don't exist
- **Ignore it** - this happens during cleanup

### "address already in use"
- **Real problem** - port is occupied
- **Cause:** Old container still running
- **Fix:** Use restart-clean.sh

## Which Ports Are Being Used?

| Port | Service | What It's For |
|------|---------|---------------|
| 5353 | AdGuard | DNS (UDP) |
| 3080 | AdGuard | Web UI |
| 8123 | Home Assistant | Web UI |
| 8096 | Jellyfin | Media Server |
| 1900 | Jellyfin | DLNA Discovery (UDP) |
| 1445 | Samba | File Sharing |
| 8081 | Ollama | AI Chat UI |
| 11434 | Ollama | API |

## Checking What's Running

### See All Containers
```bash
podman ps -a
```

### See Just Running Containers
```bash
podman ps
```

### See Ports in Use
```bash
# Arch Linux
ss -tuln | grep LISTEN

# Or if lsof is installed
sudo lsof -i -P | grep LISTEN
```

### Stop Specific Container
```bash
podman stop adguardhome
podman stop jellyfin
```

### Remove Specific Container
```bash
podman rm -f adguardhome
podman rm -f jellyfin
```

## Why Does This Happen?

1. **You ran `podman-compose up -d` multiple times**
   - First time: Creates containers
   - Second time: Tries to create duplicates → port conflict

2. **You ran `./start.sh` which calls `podman-compose up -d`**
   - Same as above

3. **Old containers from previous attempts are still running**
   - They're holding the ports
   - New containers can't bind to those ports

## Prevention

### Always Clean Before Starting
```bash
# Instead of just:
podman-compose up -d

# Do this:
podman-compose down
podman-compose up -d

# Or use the restart script:
./restart-clean.sh
```

### Check Status Before Starting
```bash
# See what's running
podman ps

# If anything is there, clean it first
podman-compose down
```

## Complete Cleanup (Nuclear Option)

**Warning:** This removes **everything** including data!

```bash
# Stop and remove ALL containers
podman stop $(podman ps -a -q) 2>/dev/null || true
podman rm $(podman ps -a -q) 2>/dev/null || true

# Remove all volumes (DELETES DATA!)
podman volume rm $(podman volume ls -q) 2>/dev/null || true

# Remove all networks
podman network rm $(podman network ls -q) 2>/dev/null || true

# Start fresh
podman-compose up -d
```

## Summary

✅ **Easiest Fix:** `./restart-clean.sh`
✅ **Manual Fix:** `podman-compose down && podman-compose up -d`
✅ **Check Status:** `podman ps`
✅ **View Logs:** `podman-compose logs -f`

**Bottom Line:** Containers were already running. The restart script will fix it cleanly.
