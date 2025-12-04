# home-assistant-integration Specification

## Purpose

Provide comprehensive home automation capabilities through Home Assistant with community extensions (HACS), presence detection (MTR-1), automatic device discovery, and mobile app support for remote control and monitoring.

## Requirements

### Requirement: HACS Community Store Integration

The system SHALL provide HACS (Home Assistant Community Store) for installing community integrations and custom components.

#### Scenario: HACS installation
- **WHEN** setup-hacs.sh script is executed
- **THEN** HACS is downloaded to custom_components/hacs
- **AND** Home Assistant is restarted to load HACS
- **AND** HACS appears in sidebar
- **AND** GitHub device code authentication is initiated

#### Scenario: HACS authentication
- **WHEN** user completes GitHub device code flow
- **THEN** HACS is authenticated with GitHub
- **AND** community repositories are accessible
- **AND** authentication token is persisted
- **AND** no re-authentication required on restart

#### Scenario: Installing community integration
- **WHEN** user browses HACS integrations
- **THEN** search and filter options are available
- **AND** integration details show description and requirements
- **AND** installation adds integration to custom_components
- **AND** Home Assistant restart loads new integration

### Requirement: MTR-1 Presence Detection

The system SHALL support MTR-1 zone-based presence detection with visualization.

#### Scenario: MTR-1 zone template
- **WHEN** mtr1-zones.yaml template is loaded
- **THEN** zones are defined with coordinates and radii
- **AND** Plotly Graph Card visualizes zones
- **AND** presence sensors update based on location
- **AND** automation can trigger on zone entry/exit

#### Scenario: Zone visualization
- **WHEN** user views MTR-1 dashboard
- **THEN** map shows all defined zones
- **AND** current position is plotted
- **AND** zone boundaries are clearly marked
- **AND** historical presence data is available

#### Scenario: Presence automation
- **WHEN** device enters defined zone
- **THEN** presence sensor changes to "home"
- **AND** automations can trigger (lights, climate, etc.)
- **AND** zone entry is logged
- **AND** exit is detected when leaving zone

### Requirement: Automatic Device Discovery

The system SHALL automatically discover compatible devices on the local network.

#### Scenario: mDNS/Zeroconf discovery
- **WHEN** device advertises mDNS service on network
- **THEN** Home Assistant detects device automatically
- **AND** device appears in Discovered integrations
- **AND** user can configure device with one click
- **AND** credentials are requested if needed

#### Scenario: SSDP discovery
- **WHEN** UPnP device broadcasts SSDP announcement
- **THEN** Home Assistant discovers device
- **AND** device type is correctly identified
- **AND** appropriate integration is suggested
- **AND** manual configuration is available

#### Scenario: Supported device types
- **WHEN** supported device is on network
- **THEN** smart TVs are discovered (Samsung, LG, Sony)
- **AND** media players are discovered (Chromecast, Roku)
- **AND** smart hubs are discovered (Philips Hue, IKEA)
- **AND** IoT devices are discovered (ESPHome, Tasmota)

### Requirement: Mobile App Support

The system SHALL support Home Assistant mobile apps for iOS and Android with WebSocket connectivity.

#### Scenario: WebSocket configuration
- **WHEN** homeassistant/configuration.yaml is loaded
- **THEN** http: section has use_x_forwarded_for: true
- **AND** trusted_proxies includes homelab network CIDRs
- **AND** 172.20.0.0/16 and 172.21.0.0/16 are trusted
- **AND** WebSocket endpoint is accessible

#### Scenario: Mobile app auto-discovery
- **WHEN** mobile app is opened on same network
- **THEN** app discovers Home Assistant via mDNS
- **AND** homeassistant.local is suggested as URL
- **AND** user can authenticate with credentials
- **AND** connection is established via WebSocket

#### Scenario: Remote access via Tailscale
- **WHEN** mobile device connects to Tailscale VPN
- **THEN** app can access Home Assistant via Tailscale IP
- **AND** WebSocket connection works over VPN
- **AND** full functionality is available remotely
- **AND** no port forwarding is required

#### Scenario: Mobile app features
- **WHEN** mobile app is connected
- **THEN** user can view all entities and controls
- **AND** can trigger automations and scripts
- **AND** receives push notifications
- **AND** can use location tracking for presence
- **AND** can access via widgets and shortcuts

### Requirement: Network Scanning Integration

The system SHALL provide network scanning capabilities for device tracking.

#### Scenario: Network scan configuration
- **WHEN** Network integration is enabled
- **THEN** local network is scanned for devices
- **AND** MAC addresses are discovered
- **AND** hostnames are resolved when available
- **AND** device_tracker entities are created

#### Scenario: Device tracking
- **WHEN** known device is detected on network
- **THEN** device_tracker state updates to "home"
- **AND** last_seen timestamp is updated
- **AND** automation can trigger on state change
- **AND** device goes "away" when not detected

### Requirement: Traefik Integration for WebSocket

The system SHALL configure Traefik to support WebSocket connections for mobile apps.

#### Scenario: Traefik routing configuration
- **WHEN** Traefik routes are configured
- **THEN** homeassistant.local routes to 172.20.0.6:8123
- **AND** WebSocket upgrade headers are passed through
- **AND** Connection: Upgrade is preserved
- **AND** no timeout on WebSocket connections

#### Scenario: WebSocket connectivity test
- **WHEN** mobile app connects via homeassistant.local
- **THEN** WebSocket handshake succeeds
- **AND** real-time updates are received
- **AND** connection remains stable
- **AND** automatic reconnection works after interruption

### Requirement: Configuration Persistence

The system SHALL persist Home Assistant configuration across restarts.

#### Scenario: Volume persistence
- **WHEN** Home Assistant container restarts
- **THEN** configuration.yaml is loaded from volume
- **AND** custom_components directory is preserved
- **AND** entity states are restored from database
- **AND** automations remain active

#### Scenario: Database persistence
- **WHEN** Home Assistant stores entity history
- **THEN** data is written to SQLite database in volume
- **AND** historical data persists across restarts
- **AND** database grows with configurable retention
- **AND** old data is purged per recorder settings

### Requirement: Troubleshooting and Diagnostics

The system SHALL provide tools for diagnosing Home Assistant issues.

#### Scenario: Check Home Assistant logs
- **WHEN** user runs docker compose logs homeassistant
- **THEN** startup sequence is logged
- **AND** integration errors are clearly shown
- **AND** WebSocket connections are logged
- **AND** warnings and errors are highlighted

#### Scenario: Mobile app not connecting
- **WHEN** mobile app connection fails
- **THEN** user can verify WebSocket config in configuration.yaml
- **AND** can check Traefik routing logs
- **AND** can test WebSocket with curl -i -N -H "Upgrade: websocket"
- **AND** can verify trusted_proxies includes app network

#### Scenario: Device not discovered
- **WHEN** device is not auto-discovered
- **THEN** user can check if device is on same network
- **AND** can verify mDNS is working (avahi-browse)
- **AND** can manually add integration with IP address
- **AND** can check firewall rules

### Requirement: Documentation References

Users SHALL have access to complete Home Assistant integration documentation.

#### Scenario: Documentation availability
- **WHEN** user needs Home Assistant help
- **THEN** docs/home-assistant/README.md contains setup guide
- **AND** CLAUDE.md references Home Assistant section
- **AND** HACS installation procedure is documented
- **AND** MTR-1 template usage is explained
- **AND** mobile app setup steps are clear

## Related Documentation

- **Setup Guide**: `/docs/home-assistant/README.md` - Complete integration guide
- **Main Documentation**: `/CLAUDE.md` - Home Assistant Integrations section (lines 427-515)
- **Configuration**: `homelab/homeassistant/configuration.yaml` - Main config file
- **MTR-1 Template**: `homelab/homeassistant/config/mtr1-zones.yaml` - Zone visualization
- **HACS Setup Script**: `homelab/scripts/setup-hacs.sh` - Automated HACS installation
- **Docker Compose**: `homelab/compose/infrastructure.yml` - Home Assistant service definition
