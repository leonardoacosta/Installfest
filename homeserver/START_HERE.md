# START HERE - Homeserver Setup on Arch Linux

## Your Current Situation

You're seeing port conflicts because containers are already running. Let's fix it in **one command**.

## The One Command You Need

```bash
./restart-clean.sh
```

**That's it!** This will:
- ✓ Stop all running containers
- ✓ Remove old containers (keeps your data safe!)
- ✓ Free up all ports
- ✓ Start everything fresh
- ✓ Show you what's running

## What You'll Get

After running the command, you'll have:

| Service | URL | What It Does |
|---------|-----|--------------|
| **Home Assistant** | http://localhost:8123 | Smart home hub |
| **AdGuard** (setup) | http://localhost:3000 | First-time setup |
| **AdGuard** (web) | http://localhost:3080 | Ad blocker dashboard |
| **Jellyfin** | http://localhost:8096 | Media server |
| **Ollama WebUI** | http://localhost:8081 | Local AI chat |
| **Samba** | smb://localhost:1445 | File sharing |

## After Everything Starts

### 1. Set Up AdGuard (DNS Ad Blocker)
```
1. Go to http://localhost:3000
2. Create admin username/password
3. Set upstream DNS: 1.1.1.1, 8.8.8.8
4. Dashboard will be at http://localhost:3080
```

### 2. Set Up Home Assistant
```
1. Go to http://localhost:8123
2. Create your account
3. Set location and timezone
4. Start adding devices!
```

### 3. Set Up Jellyfin (Media Server)
```
1. Go to http://localhost:8096
2. Create admin account
3. Add media libraries:
   - Movies: /media/movies
   - TV: /media/tv
   - Music: /media/music
```

## Important Notes

### Port Changes for Rootless Podman
We changed some ports because rootless Podman can't use privileged ports (<1024):

| Original | New | Why |
|----------|-----|-----|
| Port 53 | **5353** | DNS needs special permission |
| Port 80 | **3080** | Web needs special permission |
| Port 445 | **1445** | SMB needs special permission |
| Port 139 | **1139** | NetBIOS needs special permission |

**Everything else uses standard ports!**

### Using AdGuard DNS

Since DNS is on port 5353 instead of 53, you have two options:

**Option A: Use Port 5353 Directly**
```
Set your device DNS to: your-server-ip:5353
```

**Option B: Port Forward (Recommended)**
```bash
sudo iptables -t nat -A PREROUTING -p udp --dport 53 -j REDIRECT --to-port 5353
sudo iptables -t nat -A PREROUTING -p tcp --dport 53 -j REDIRECT --to-port 5353
```

This forwards port 53 → 5353 so clients can use standard DNS port.

## Common Commands

```bash
# Start everything
./restart-clean.sh

# Stop everything
podman-compose down

# View all running containers
podman ps

# View logs
podman-compose logs -f

# View specific service logs
podman-compose logs -f adguardhome
podman-compose logs -f homeassistant

# Restart specific service
podman-compose restart jellyfin

# Update all images
podman-compose pull
podman-compose up -d
```

## Troubleshooting

### "Port already in use" errors?
```bash
./restart-clean.sh  # This fixes it
```

### "DBUS session bus" warning?
```bash
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
# Or just ignore it - Podman works fine without it
```

### Container won't start?
```bash
# View logs for that specific service
podman-compose logs -f SERVICE_NAME

# Try restarting just that service
podman-compose restart SERVICE_NAME
```

### Everything broken?
```bash
# Nuclear option - removes everything and starts fresh
podman-compose down -v  # WARNING: Deletes all data!
podman-compose up -d
```

## Documentation

We created several guides for you:

- **PORT_CONFLICTS.md** - Fixing "address already in use" errors
- **DBUS_FIX.md** - Fixing session bus warnings
- **ARCH_LINUX_SETUP.md** - Complete Arch Linux guide
- **QUICK_START.md** - Fast reference commands
- **TROUBLESHOOTING.md** - Common problems and solutions
- **FIX_SUMMARY.md** - What we changed and why

## Getting Help

If something isn't working:

1. **Check logs:** `podman-compose logs -f SERVICE_NAME`
2. **Check status:** `podman ps -a`
3. **Check ports:** `ss -tuln | grep LISTEN`
4. **Read the docs:** Start with the file matching your issue

## Summary

✅ All Arch Linux issues fixed
✅ All privileged ports remapped
✅ Scripts create all required files
✅ One-command restart available
✅ Complete documentation included

**Just run: `./restart-clean.sh`**

That's literally all you need to do right now!
