# Tailscale Configuration Research

## Service Overview
Tailscale is a zero-config VPN service that creates a secure mesh network between your devices using WireGuard, enabling secure remote access to your homelab.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
TS_AUTHKEY: "${TS_AUTHKEY}"              # Pre-authentication key
TS_HOSTNAME: "homelab-gateway"            # Device name in Tailscale
TS_STATE_DIR: "/var/lib/tailscale"       # State directory
TS_SOCKET: "/var/run/tailscale/tailscaled.sock"

# Network Settings
TS_ROUTES: "192.168.1.0/24,10.0.0.0/24"  # Subnet routes to advertise
TS_ACCEPT_ROUTES: "true"                  # Accept routes from other nodes
TS_ACCEPT_DNS: "true"                     # Use Tailscale DNS
TS_EXTRA_ARGS: "--advertise-exit-node"    # Additional arguments

# Features
TS_USERSPACE: "false"                     # Use kernel WireGuard
TS_SERVE_CONFIG: "/config/serve.json"     # Tailscale Serve config
TS_FUNNEL: "true"                        # Enable Tailscale Funnel
```

## 2. Secrets Management Strategy

```yaml
# Docker Secrets
secrets:
  tailscale_authkey:
    file: ./secrets/tailscale/authkey.txt
  tailscale_api_key:
    file: ./secrets/tailscale/api_key.txt

# Environment references
environment:
  - TS_AUTHKEY_FILE=/run/secrets/tailscale_authkey
  - TS_API_KEY_FILE=/run/secrets/tailscale_api_key

# OAuth credentials for SSO
TS_OAUTH_CLIENT_ID: "${TS_OAUTH_CLIENT_ID}"
TS_OAUTH_CLIENT_SECRET: "${TS_OAUTH_CLIENT_SECRET}"
```

## 3. Volume Mounts and Data Persistence

```yaml
volumes:
  # State and configuration
  - ./data/tailscale:/var/lib/tailscale:rw
  - ./config/tailscale:/config:rw

  # Socket for container communication
  - ./run/tailscale:/var/run/tailscale:rw

  # Host network namespace (required)
  - /dev/net/tun:/dev/net/tun:rw

# Capabilities required
cap_add:
  - NET_ADMIN
  - NET_RAW
  - SYS_MODULE

# Network mode
network_mode: host  # Or use privileged mode
```

## 4. Health Check Configuration

```yaml
healthcheck:
  test: ["CMD", "tailscale", "status", "--json"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s

# Monitoring commands
tailscale status          # Connection status
tailscale ping           # Test connectivity
tailscale netcheck       # Network diagnostics
```

## 5. Backup and Restore Procedures

```bash
#!/bin/bash
# Backup Script
BACKUP_DIR="/backups/tailscale/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup state
cp -r /var/lib/tailscale/* "$BACKUP_DIR/state/"

# Export configuration
docker exec tailscale tailscale status --json > "$BACKUP_DIR/status.json"
docker exec tailscale tailscale debug prefs > "$BACKUP_DIR/prefs.json"

# Backup serve configuration
cp /config/serve.json "$BACKUP_DIR/"

# Restore Script
restore_tailscale() {
  RESTORE_FROM="$1"

  # Stop Tailscale
  docker stop tailscale

  # Restore state
  cp -r "$RESTORE_FROM/state/"* /var/lib/tailscale/

  # Restore configuration
  cp "$RESTORE_FROM/serve.json" /config/

  # Restart Tailscale
  docker start tailscale
}
```

## 6. Service Dependencies and Startup Order

```yaml
depends_on:
  - adguard        # For DNS if using custom DNS

# Network requirements
privileged: true   # Or use specific capabilities
network_mode: host # Required for subnet routing

# Startup priority: 1 (network infrastructure)
```

## 7. Resource Limits and Quotas

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 256M
    reservations:
      cpus: '0.1'
      memory: 128M
```

## 8. Configuration File Templates

### serve.json (Tailscale Serve)
```json
{
  "TCP": {
    "443": {
      "HTTPS": true
    }
  },
  "Web": {
    "example.ts.net:443": {
      "Handlers": {
        "/": {
          "Proxy": "http://localhost:8080"
        },
        "/api": {
          "Proxy": "http://localhost:3000"
        }
      }
    }
  },
  "AllowFunnel": {
    "example.ts.net:443": true
  }
}
```

## Security Considerations

1. **Key Rotation**: Regularly rotate auth keys
2. **ACLs**: Implement strict access control lists
3. **Exit Nodes**: Carefully manage exit node permissions
4. **MagicDNS**: Use for internal service resolution
5. **Sharing**: Control device and network sharing

## Performance Optimization

1. Use kernel WireGuard when possible
2. Optimize MTU settings
3. Enable direct connections (DERP bypass)
4. Use regional DERP servers