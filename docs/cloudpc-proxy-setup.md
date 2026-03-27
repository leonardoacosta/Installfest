# Routing macOS Apps Through CloudPC Network

Route native macOS apps (Teams, Outlook) through cloudpc's network to pass Microsoft Conditional
Access Evaluation (CAE). CAE checks the originating IP — your Mac isn't trusted, but cloudpc is.

## Architecture

```
macOS App (Teams) → ProxyBridge (per-app intercept) → SSH SOCKS5 tunnel → cloudpc → Microsoft
```

- **TCP traffic** (auth, SSO, API): routes through cloudpc — CAE passes
- **UDP traffic** (calls, video, media): goes direct — no latency penalty
- **All other apps**: unaffected — stay direct

## Prerequisites

- SSH access to `cloudpc` (configured in `~/.ssh/config`)
- [ProxyBridge](https://github.com/InterceptSuite/ProxyBridge) installed on macOS
- ProxyBridge Network Extension approved: System Settings → General → Login Items & Extensions → Network Extensions

## Setup

### 1. Start the SOCKS5 tunnel

```bash
ssh -D 1080 -f -N cloudpc
```

Or use the helper (from the `ws` repo):
```bash
~/dev/ws/scripts/chrome-proxy        # starts tunnel + launches proxied Chrome
~/dev/ws/scripts/chrome-proxy --status  # check if tunnel is active
```

### 2. Configure ProxyBridge

**Add proxy server:**
- Type: `SOCKS5`
- Host: `127.0.0.1`
- Port: `1080`

**Import rules** (Menu Bar → Proxy → Proxy Rules → Import):

```json
[
  {
    "action": "PROXY",
    "enabled": true,
    "processNames": "MSTeams",
    "protocol": "TCP",
    "targetHosts": "*",
    "targetPorts": "*"
  },
  {
    "action": "PROXY",
    "enabled": true,
    "processNames": "Microsoft Teams WebView Helper",
    "protocol": "TCP",
    "targetHosts": "*",
    "targetPorts": "*"
  },
  {
    "action": "PROXY",
    "enabled": true,
    "processNames": "Microsoft Teams",
    "protocol": "TCP",
    "targetHosts": "*",
    "targetPorts": "*"
  },
  {
    "action": "PROXY",
    "enabled": true,
    "processNames": "Microsoft Outlook",
    "protocol": "TCP",
    "targetHosts": "*",
    "targetPorts": "*"
  }
]
```

### 3. Restart Teams

Quit and reopen Teams. ProxyBridge intercepts TCP connections on launch.

## Verification

ProxyBridge logs should show:
```
[INFO] SOCKS5 connection established to 51.116.253.170:443
```

If you see `→ Direct` on MSTeams connections, the rules aren't matching — check process names.

To verify the tunnel itself:
```bash
curl --socks5-hostname localhost:1080 https://ifconfig.me
# Should return cloudpc's IP, not your Mac's
```

## Gotchas

### 1. Process Names ≠ App Name

Teams runs as **three separate processes**. All three need rules:

| Process | What it does |
|---------|-------------|
| `MSTeams` | Main Teams process |
| `Microsoft Teams WebView Helper` | WebView2 content renderer |
| `Microsoft Teams` | Parent app process |

### 2. TCP Only — No UDP

SSH SOCKS5 (`ssh -D`) only supports TCP. Setting protocol to `BOTH` causes:
```
SOCKS5 UDP ASSOCIATE response error: Socket is not connected
```

This is fine — CAE only evaluates TCP connections. UDP media (calls/video) goes direct with no
latency penalty.

### 3. Network Extension Must Be Approved

ProxyBridge rules stay disabled until the macOS Network Extension is approved. If rules aren't
matching or can't be added, check:

System Settings → General → Login Items & Extensions → Network Extensions

### 4. SSH Tunnel Must Be Running First

ProxyBridge routes to `127.0.0.1:1080`. If the SSH tunnel isn't running, all proxied connections
fail silently. Check with:

```bash
pgrep -f "ssh.*-D.*1080.*cloudpc" && echo "Running" || echo "Not running"
```

## Adding More Apps

To route another app through cloudpc:

1. Open ProxyBridge logs to see the actual process name
2. Add a rule with that exact process name, protocol `TCP`
3. Common apps to add: `Microsoft Outlook`, `Safari`, `com.apple.Safari`

## Alternatives

| Method | Per-app | Cost | Notes |
|--------|---------|------|-------|
| **ProxyBridge** | ✅ | Free | Open-source, Network Extension |
| **Proxifier** | ✅ | $40 one-time | Commercial, same approach |
| **System SOCKS proxy** | ❌ All traffic | Free | `networksetup -setsocksfirewallproxy Wi-Fi localhost 1080` |
| **Tailscale exit node** | ❌ All traffic | Free | Requires Tailscale on cloudpc |
| **Chrome `--proxy-server`** | Browser only | Free | Only works for Chromium-based apps |
