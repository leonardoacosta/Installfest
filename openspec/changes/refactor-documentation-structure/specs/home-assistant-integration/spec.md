# Home Assistant Integration Specification

## ADDED Requirements

### Requirement: HACS Community Store Integration
Home Assistant SHALL have HACS (Home Assistant Community Store) installed and configured for community integrations and custom components.

#### Scenario: Auto-installing HACS during deployment
- **WHEN** homelab deployment runs setup-hacs.sh script
- **THEN** HACS SHALL be automatically installed
- **AND** first-time setup requires GitHub authentication via device code flow

#### Scenario: Installing community integrations via HACS
- **WHEN** user navigates to HACS in Home Assistant
- **THEN** community integrations SHALL be searchable and installable
- **AND** updates are managed through HACS interface

### Requirement: MTR-1 Presence Detection
Home Assistant SHALL support MTR-1 presence detection with zone visualization using Plotly Graph Card.

#### Scenario: Configuring MTR-1 zones
- **WHEN** MTR-1 integration is configured
- **THEN** zone template SHALL be loaded from homeassistant/config/mtr1-zones.yaml
- **AND** zones SHALL be visualized with Plotly Graph Card from HACS

#### Scenario: Detecting presence in zones
- **WHEN** MTR-1 sensor detects movement
- **THEN** presence data SHALL be available in Home Assistant
- **AND** automation triggers can use presence data

### Requirement: Automatic Device Discovery
Home Assistant SHALL automatically discover devices on the local network using mDNS, SSDP, and NetBIOS protocols.

#### Scenario: Discovering smart TVs
- **WHEN** a smart TV (Samsung, LG, Sony) is on the network
- **THEN** Home Assistant SHALL discover device via SSDP/mDNS
- **AND** device appears in Configuration → Devices & Services → Discovered tab

#### Scenario: Discovering media players
- **WHEN** media players (Chromecast, Roku, Apple TV) are on network
- **THEN** devices SHALL be automatically discovered
- **AND** integration setup is offered in web interface

#### Scenario: Discovering smart home hubs
- **WHEN** smart home hubs (Philips Hue, IKEA Trådfri) are on network
- **THEN** hubs SHALL be discovered and integration offered
- **AND** devices connected to hubs become available

#### Scenario: Discovering IoT devices
- **WHEN** IoT devices (ESPHome, Tasmota, Shelly) are on network
- **THEN** devices SHALL be discovered via mDNS
- **AND** automatic configuration is attempted

#### Scenario: Manual discovery trigger
- **WHEN** user restarts Home Assistant container
- **THEN** network scan SHALL be performed again
- **AND** new devices are discovered

### Requirement: Mobile App WebSocket Support
Home Assistant SHALL support WebSocket connections for real-time mobile app updates and notifications.

#### Scenario: Configuring trusted proxies for WebSocket
- **WHEN** Home Assistant is behind Traefik reverse proxy
- **THEN** configuration.yaml SHALL include use_x_forwarded_for: true
- **AND** trusted_proxies SHALL include homelab network (172.20.0.0/16) and media network (172.21.0.0/16)

#### Scenario: Mobile app discovery of Home Assistant
- **WHEN** mobile device is on same network as homelab
- **THEN** Home Assistant app SHALL auto-discover at homeassistant.local
- **AND** authentication prompt is presented

#### Scenario: Mobile app WebSocket connection
- **WHEN** mobile app connects to Home Assistant
- **THEN** WebSocket connection SHALL be established
- **AND** real-time updates are received

#### Scenario: Remote access via Tailscale
- **WHEN** mobile device connects via Tailscale VPN
- **THEN** Home Assistant SHALL be accessible via Tailscale IP
- **AND** WebSocket connection works over VPN

### Requirement: Mobile App Setup and Configuration
Mobile app SHALL be configurable for notifications, location tracking, and sensor data.

#### Scenario: Installing and connecting mobile app
- **WHEN** user installs Home Assistant app (iOS/Android)
- **AND** connects to same network as homelab
- **THEN** app discovers Home Assistant at homeassistant.local
- **AND** authentication completes successfully
- **AND** notifications and location tracking can be enabled

#### Scenario: Enabling push notifications
- **WHEN** user enables notifications in mobile app
- **THEN** Home Assistant can send push notifications to device
- **AND** automation triggers can include notification actions

### Requirement: Mobile App Troubleshooting
Mobile app connection issues SHALL be diagnosable using WebSocket and proxy debugging.

#### Scenario: App cannot find Home Assistant
- **WHEN** mobile app fails to discover Home Assistant
- **THEN** both devices SHALL be verified on same network
- **AND** mDNS service SHALL be checked on homelab server
- **AND** manual IP address entry can be attempted

#### Scenario: WebSocket connection timeout
- **WHEN** mobile app connection times out
- **THEN** firewall rules SHALL be verified
- **AND** Traefik routing SHALL be checked with `docker compose logs traefik | grep homeassistant`
- **AND** WebSocket timeout settings in Traefik are reviewed

#### Scenario: Frequent disconnections
- **WHEN** mobile app disconnects frequently
- **THEN** WebSocket proxy timeout settings SHALL be increased
- **AND** network stability between device and server is checked

#### Scenario: Testing WebSocket accessibility
- **WHEN** debugging WebSocket connectivity
- **THEN** curl command SHALL test WebSocket upgrade: `curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://homeassistant.local:8123/api/websocket`
- **AND** successful upgrade response indicates WebSocket is functioning

### Requirement: Home Assistant Configuration Management
Home Assistant configuration SHALL be managed as code in homeassistant/config/ directory.

#### Scenario: Storing configuration in version control
- **WHEN** Home Assistant configuration is modified
- **THEN** changes SHALL be committed to git
- **AND** configuration.yaml, automations, and custom components are tracked

#### Scenario: Deploying configuration updates
- **WHEN** configuration changes are pushed to repository
- **THEN** CI/CD pipeline SHALL deploy updates to homelab
- **AND** Home Assistant container is restarted to apply changes

### Requirement: Integration Documentation
All Home Assistant integrations SHALL have documentation in docs/home-assistant/README.md with setup instructions and troubleshooting.

#### Scenario: Adding new integration
- **WHEN** a new Home Assistant integration is configured
- **THEN** documentation SHALL be updated to describe integration
- **AND** setup steps and required configuration are documented
- **AND** troubleshooting common issues is included
