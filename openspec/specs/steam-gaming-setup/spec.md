# steam-gaming-setup Specification

## Purpose
TBD - created by archiving change add-automated-deployment-system. Update Purpose after archive.
## Requirements
### Requirement: Headless Steam Installation
The system SHALL install Steam in headless mode for Remote Play functionality.

#### Scenario: Package installation
- **WHEN** archinstall configuration is processed
- **THEN** steam package is installed from multilib repository
- **AND** required dependencies are installed
- **AND** Steam is available as /usr/bin/steam

#### Scenario: Headless configuration
- **WHEN** setup-steam.sh is executed
- **THEN** Steam is configured to run without GUI
- **AND** console mode is enabled (-console flag)
- **AND** no browser login is configured (-noreactlogin flag)

### Requirement: Systemd Service Management
Steam SHALL run as a systemd service for automatic startup and management.

#### Scenario: Service creation
- **WHEN** setup script creates steam.service
- **THEN** service is configured to run as user leo
- **AND** service starts after network is available
- **AND** service restarts automatically on failure

#### Scenario: Auto-start on boot
- **WHEN** system boots
- **THEN** steam.service starts automatically
- **AND** Steam is ready for Remote Play connections
- **AND** service status can be checked via systemctl

#### Scenario: Service management
- **WHEN** user executes systemctl commands
- **THEN** Steam can be started, stopped, restarted via systemd
- **AND** service logs are available via journalctl

### Requirement: Remote Play Support
Steam SHALL support Remote Play streaming to SteamLink devices.

#### Scenario: Remote Play availability
- **WHEN** Steam service is running
- **THEN** Remote Play is enabled in Steam settings
- **AND** server is discoverable on local network
- **AND** SteamLink devices can connect

#### Scenario: Firewall configuration
- **WHEN** setup script configures firewall
- **THEN** Steam Remote Play ports are opened
- **AND** UDP ports 27031-27036 are allowed
- **AND** TCP port 27036 is allowed

### Requirement: First-Time Login
The system SHALL handle Steam's first-time login requirement.

#### Scenario: Login requirement
- **WHEN** Steam starts for the first time
- **THEN** service waits for manual login
- **AND** user is notified to perform login
- **AND** login instructions are logged

#### Scenario: Credential persistence
- **WHEN** user completes first login
- **THEN** Steam credentials are saved locally
- **AND** subsequent boots do not require login
- **AND** Steam Guard is configured (if enabled)

### Requirement: Configuration Integration
Steam setup SHALL integrate with homelab bootstrap process.

#### Scenario: Bootstrap integration
- **WHEN** homelab-bootstrap.sh executes
- **THEN** setup-steam.sh is called
- **AND** Steam service is enabled
- **AND** any configuration errors are logged

#### Scenario: Unattended setup
- **WHEN** USB boot completes
- **THEN** Steam is installed and service is running
- **AND** only manual login remains
- **AND** user is notified of login requirement

### Requirement: Steam Directory Structure
Steam SHALL create and maintain proper directory structure.

#### Scenario: Directory creation
- **WHEN** Steam is first installed
- **THEN** ~/.steam directory is created
- **AND** ~/.local/share/Steam directory is created
- **AND** proper permissions are set (user-writable)

#### Scenario: Library management
- **WHEN** Steam is configured
- **THEN** default library location is set
- **AND** library is ready for game installation
- **AND** sufficient disk space is verified



## Related Documentation

- **Main Documentation**: `/CLAUDE.md` - Steam Headless Setup section
- **Setup Script**: `homelab/scripts/setup-steam.sh` - Automated Steam service configuration
- **Systemd Service**: `/etc/systemd/system/steam-headless.service` - Steam service definition
- **Bootstrap Integration**: `homelab/usb-boot/homelab-bootstrap.sh` - First-boot deployment with Steam setup
- **Firewall Configuration**: UFW rules for Remote Play ports (27031-27037)
- **Troubleshooting**: `/CLAUDE.md` - First-time login, service logs, and Remote Play setup
