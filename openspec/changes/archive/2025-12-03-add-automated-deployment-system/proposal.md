# Change: Automated Homelab Deployment System

## Why

Currently, setting up the homelab from scratch requires extensive manual intervention: OS installation, running the setup wizard with interactive prompts, manually configuring Bluetooth devices, installing Steam, and setting up GitHub runners. If the server needs to be rebuilt (hardware failure, testing, migration), this process takes hours and is error-prone.

The goal is to enable **USB-boot automated deployment**: flash PC with Arch Linux, boot from USB with configuration, and have the entire homelab stack deployed and operational with minimal manual input. Additionally, we need to expand capabilities with multi-runner CI/CD, Playwright test reporting, and long-lived Claude Code agent management.

## What Changes

### Core Infrastructure
- **USB Boot Automation**: Two-stage deployment using archinstall + systemd first-boot orchestration
- **Unattended Setup Mode**: homelab.sh enhanced with config file support (no interactive prompts)
- **Secrets Management**: GPG-encrypted secrets file on USB for secure credential storage

### New Service Capabilities
- **Multi-Runner Orchestration**: Docker-based GitHub Actions runners (4 instances) from token list with shared reports volume
- **Steam Gaming Setup**: Headless Steam installation for Remote Play/SteamLink
- **Bluetooth Automation**: Auto-pairing of known devices from configuration file

### Service Enhancements
- **DNS Fallback Configuration**: AdGuard primary DNS with Cloudflare (1.1.1.1) fallback
- **Home Assistant Auto-Discovery**: Verify and document network device auto-discovery
- **Mobile App Support**: Ensure websocket configuration for Home Assistant mobile app

## Impact

### Affected Specs
**New Capabilities:**
- `usb-boot-automation` - USB deployment orchestration
- `multi-runner-orchestration` - Multiple self-hosted GitHub runners
- `steam-gaming-setup` - Gaming infrastructure
- `bluetooth-automation` - Device auto-pairing

**Modified Capabilities:**
- `homelab-deployment` - Add unattended mode support
- `dns-configuration` - Document fallback DNS strategy

### Affected Code

**New Files:**
- `homelab/usb-boot/archinstall-config.json` - Base system installation config
- `homelab/usb-boot/homelab-bootstrap.sh` - First-boot orchestrator
- `homelab/usb-boot/create-bootable-usb.sh` - USB creation tool
- `homelab/compose/runners.yml` - GitHub Actions runners
- `homelab/scripts/setup-bluetooth.sh` - Bluetooth auto-pairing
- `homelab/scripts/setup-steam.sh` - Steam installation
- `homelab/config/bluetooth-devices.yml` - Bluetooth device list
- `homelab/config/runner-tokens.env` - GitHub runner credentials
- `homelab/.homelab-config.yml` - Unattended setup configuration

**New Services (Docker):**
- `github-runner-{1-4}` - Docker-based GitHub runners with shared reports volume

**New Volumes:**
- `playwright-reports` - Shared volume for Playwright test reports (consumed by future report server)

**Modified Files:**
- `homelab/homelab.sh` - Add config file mode, remove interactive prompts when config present
- `homelab/scripts/deploy-ci-streamlined.sh` - Integrate new services
- `homelab/docker-compose.yml` - Include new compose files
- `homelab/.env.example` - Add new service environment variables

### System Requirements
- **Disk Space**: +5GB for Steam, runner work directories, and shared reports volume
- **Memory**: +2GB for multiple runners
- **Packages**: bluez, bluez-utils, steam (multilib)
- **Ports**: No new exposed ports (runners communicate with GitHub via outbound connections)

### Migration Notes
- Existing single GitHub runner will be migrated to Docker-based approach
- No breaking changes to current services
- New secrets required: runner tokens, GPG passphrase for USB
- First deployment requires manual Steam login (one-time), Bluetooth device pairing confirmation

### Security Considerations
- GPG encryption for USB secrets file
- Runner tokens isolated per container
- Docker socket access restricted to runner containers only
- Runner work directories isolated with proper permissions
