# usb-boot-automation Specification

## Purpose
TBD - created by archiving change add-automated-deployment-system. Update Purpose after archive.
## Requirements
### Requirement: Archinstall Configuration
The system SHALL provide a JSON configuration file for archinstall that automates base system installation without user interaction.

#### Scenario: Base system installation
- **WHEN** archinstall is executed with the configuration file
- **THEN** the system installs Arch Linux with partitioning, user creation, package installation, and network configuration
- **AND** the docker group is created and user added
- **AND** multilib repository is enabled for Steam
- **AND** required packages are installed (docker, bluez, steam, git, curl)

#### Scenario: First boot service registration
- **WHEN** archinstall completes
- **THEN** homelab-bootstrap.service is enabled for first boot
- **AND** the service will execute on next system start

### Requirement: Bootstrap Orchestration
The system SHALL provide a bootstrap script that executes on first boot to deploy the complete homelab stack.

#### Scenario: Secrets decryption
- **WHEN** bootstrap script starts
- **THEN** GPG-encrypted secrets file is decrypted using user-provided passphrase
- **AND** decrypted secrets are loaded into environment
- **AND** decrypted file is securely deleted after loading

#### Scenario: Repository cloning
- **WHEN** secrets are loaded
- **THEN** the Installfest repository is cloned to user home directory
- **AND** the correct branch is checked out

#### Scenario: Unattended deployment
- **WHEN** repository is ready
- **THEN** homelab.sh is executed with unattended configuration
- **AND** all services are deployed without user prompts
- **AND** deployment status is logged

### Requirement: USB Creation Tool
The system SHALL provide a script to create bootable USB drives with all necessary files.

#### Scenario: USB preparation
- **WHEN** create-bootable-usb.sh is executed
- **THEN** Arch ISO is downloaded and verified
- **AND** USB drive is formatted (FAT32)
- **AND** ISO, configs, and encrypted secrets are copied to USB
- **AND** USB is made bootable

#### Scenario: Secrets encryption
- **WHEN** user provides secrets file
- **THEN** file is encrypted using GPG with AES256
- **AND** encrypted file is added to USB
- **AND** plaintext secrets are not included

### Requirement: Unattended Setup Mode
The homelab.sh script SHALL support configuration file-based execution without interactive prompts.

#### Scenario: Config file parsing
- **WHEN** homelab.sh is executed with --config flag
- **THEN** configuration is loaded from YAML file
- **AND** all required values are validated
- **AND** execution proceeds without user prompts

#### Scenario: Interactive mode fallback
- **WHEN** no config file is provided
- **THEN** homelab.sh operates in interactive mode (existing behavior)
- **AND** prompts user for all required values

#### Scenario: Missing config values
- **WHEN** config file is missing required values
- **THEN** script exits with error message
- **AND** lists missing required fields

### Requirement: Deployment Logging
Bootstrap and setup processes SHALL log all operations for troubleshooting.

#### Scenario: Bootstrap logging
- **WHEN** homelab-bootstrap.sh executes
- **THEN** all output is logged to /var/log/homelab-bootstrap.log
- **AND** timestamps are included for each operation
- **AND** errors are clearly marked

#### Scenario: Setup logging
- **WHEN** homelab.sh executes in unattended mode
- **THEN** progress is logged to specified log file
- **AND** success/failure of each step is recorded



## Related Documentation

- **Main Documentation**: `/CLAUDE.md` - USB Boot Automation section
- **Installation Script**: `homelab/usb-boot/run-install.sh` - Stage 1 Arch Linux installation
- **Bootstrap Script**: `homelab/usb-boot/homelab-bootstrap.sh` - Stage 2 homelab deployment
- **USB Creation Script**: `homelab/usb-boot/create-bootable-usb.sh` - Bootable USB creation
- **Archinstall Config**: `homelab/usb-boot/archinstall-config.json` - Automated Arch installation
- **Secrets Template**: `homelab/.homelab-secrets.env.example` - Environment variables for encryption
- **Homelab Script**: `homelab/homelab.sh` - Management script with --config flag for unattended mode
- **Systemd Service**: First-boot service definition in bootstrap script
