# Startup Guide

## Quick Start

```bash
./homelab.sh restart
```

## Port Conflicts (Address Already in Use)

If you see "bind: address already in use" errors:

```bash
# Stop all containers
podman stop -a

# Remove all containers
podman rm -a

# Clean up networks
podman network prune -f

# Now restart
./homelab.sh restart
```

## If Startup Hangs

The `depends_on` conditions can cause podman-compose to wait indefinitely. If this happens:

### Option 1: Start Core Services First

```bash
# Stop everything
podman-compose -f podman-compose.yml down

# Start in stages
podman-compose -f podman-compose.yml up -d homeassistant adguardhome
podman-compose -f podman-compose.yml up -d ollama
sleep 5
podman-compose -f podman-compose.yml up -d ollama-webui
podman-compose -f podman-compose.yml up -d jellyfin samba tailscale
podman-compose -f podman-compose.yml up -d radarr sonarr lidarr bazarr
podman-compose -f podman-compose.yml up -d jellyseerr flaresolverr
```

### Option 2: Remove depends_on

Edit `podman-compose.yml` and comment out the `depends_on` section:

```yaml
# ollama-webui:
#   ...
#   depends_on:
#     - ollama
```

Then start normally:

```bash
./homelab.sh restart
```

### Option 3: Start Without Waiting

```bash
podman-compose -f podman-compose.yml up -d --no-deps
```

## Check Status

```bash
./homelab.sh status
# Or directly:
podman ps -a
```

## View Logs

```bash
./homelab.sh logs
# Or specific service:
./homelab.sh logs ollama
```
