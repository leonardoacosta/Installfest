# Home Assistant Integration

## Overview

Home Assistant serves as the central hub for smart home automation in the homelab. The deployment includes HACS for community integrations, MTR-1 presence detection, automatic device discovery, and mobile app support with WebSocket connectivity.

## Setup

### Initial Installation

Home Assistant is deployed via Docker Compose in `homelab/compose/infrastructure.yml`. The container runs at `homeassistant.local` or `172.20.0.x` with configuration stored in `homelab/homeassistant/config/`.

```bash
# Deploy Home Assistant
cd homelab
docker compose up -d homeassistant

# Check status
docker compose ps homeassistant
docker compose logs -f homeassistant
```

### HACS (Home Assistant Community Store)

HACS is auto-installed by the deployment script:

```bash
homelab/scripts/setup-hacs.sh
```

**First-Time Setup:**
1. Navigate to Home Assistant web interface
2. Go to HACS section
3. Complete GitHub authentication via device code flow
4. Browse and install community integrations

### MTR-1 Presence Detection

**Zone Visualization Template:**
- Location: `homeassistant/config/mtr1-zones.yaml`
- Requires: Plotly Graph Card from HACS

**Setup:**
1. Install Plotly Graph Card via HACS
2. Configure MTR-1 integration in Home Assistant
3. Load zone template from `mtr1-zones.yaml`
4. Customize zones for your environment

## Configuration

### Auto-Discovery

Home Assistant automatically discovers devices using:
- **mDNS/Zeroconf**: Network devices advertising services
- **SSDP**: Universal Plug and Play discovery
- **NetBIOS**: Windows network device discovery

**Supported Device Types:**
- Smart TVs (Samsung, LG, Sony, etc.)
- Media players (Chromecast, Roku, Apple TV)
- Network printers
- Smart home hubs (Philips Hue, IKEA Trådfri)
- IoT devices (ESPHome, Tasmota, Shelly)

**Viewing Discovered Devices:**
1. Navigate to **Configuration** → **Devices & Services**
2. Select **Discovered** tab
3. Click device to configure integration

**Manual Discovery Trigger:**
```bash
# Restart Home Assistant to re-scan network
docker compose restart homeassistant

# Or from UI: Configuration → System → Restart
```

### WebSocket Configuration

Mobile app requires WebSocket support for real-time updates (configured by default):

```yaml
# homeassistant/configuration.yaml
http:
  use_x_forwarded_for: true
  trusted_proxies:
    - 172.20.0.0/16  # homelab network
    - 172.21.0.0/16  # media network
```

### Configuration as Code

Home Assistant configuration is managed in `homeassistant/config/`:
- `configuration.yaml` - Main configuration
- `automations.yaml` - Automation rules
- `scripts.yaml` - Custom scripts
- `mtr1-zones.yaml` - MTR-1 presence detection zones

Changes are version-controlled and deployed via CI/CD.

## Usage

### Mobile App Setup

**Installation:**
1. Install Home Assistant app (iOS/Android)
2. Connect mobile device to same network as homelab
3. App auto-discovers Home Assistant at `homeassistant.local`
4. Authenticate with credentials
5. Enable notifications and location tracking (optional)

**Remote Access via Tailscale:**
1. Connect mobile device to Tailscale VPN
2. Access Home Assistant via Tailscale IP
3. WebSocket connection works seamlessly over VPN

### Managing Integrations

**Adding Integrations:**
1. Configuration → Devices & Services → Add Integration
2. Search for integration name
3. Follow configuration wizard

**Installing Custom Components:**
1. Access HACS
2. Search for custom component
3. Install and restart Home Assistant

### Automation and Scripts

**Creating Automations:**
1. Configuration → Automations & Scenes → Create Automation
2. Define triggers, conditions, and actions
3. Test automation before enabling

**Editing YAML:**
```bash
# Edit configuration files
cd homelab/homeassistant/config
vim configuration.yaml

# Restart to apply changes
docker compose restart homeassistant
```

## Troubleshooting

### Mobile App Issues

**App Can't Find Home Assistant:**
- Ensure mobile device on same network as homelab
- Check mDNS is functioning: `ping homeassistant.local`
- Try manual connection with IP address

**WebSocket Connection Issues:**
```bash
# Test WebSocket accessibility
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     http://homeassistant.local:8123/api/websocket

# Verify Traefik routing
docker compose logs traefik | grep homeassistant

# Check Home Assistant logs
docker compose logs homeassistant | grep -i websocket
```

**Connection Timeout:**
- Verify firewall rules allow traffic
- Check Traefik routing configuration
- Review WebSocket proxy timeout settings

**Frequent Disconnections:**
- Increase WebSocket timeout in Traefik configuration
- Check network stability between device and server
- Verify no power-saving features interrupting connection

### Discovery Issues

**Devices Not Discovered:**
- Restart Home Assistant to trigger re-scan
- Ensure devices on same network segment
- Check firewall allows mDNS/SSDP traffic
- Verify device supports auto-discovery protocols

**Integration Configuration Fails:**
- Check device-specific requirements (API keys, authentication)
- Review Home Assistant logs for error details
- Consult integration documentation

### Container Issues

**Home Assistant Won't Start:**
```bash
# Check container status
docker compose ps homeassistant

# View logs
docker compose logs homeassistant

# Validate configuration
docker compose exec homeassistant hass --script check_config

# Restart container
docker compose restart homeassistant
```

**Configuration Errors:**
- Check YAML syntax in configuration files
- Review logs for specific error messages
- Use `hass --script check_config` to validate

## Best Practices

1. **Backup Configuration**: Regularly export Home Assistant configuration
2. **Test Automations**: Thoroughly test before enabling critical automations
3. **Document Custom Rules**: Keep notes on complex automations
4. **Update Regularly**: Keep Home Assistant and integrations updated
5. **Monitor Logs**: Review logs periodically for issues

## References

- **OpenSpec Specification**: [openspec/specs/home-assistant-integration/spec.md](../../openspec/specs/home-assistant-integration/spec.md)
- **Home Assistant Documentation**: https://www.home-assistant.io/docs/
- **HACS Documentation**: https://hacs.xyz/
- **Related Services**:
  - Traefik (reverse proxy configuration)
  - AdGuard Home (DNS resolution for `.local` domains)
  - Tailscale (remote access)
