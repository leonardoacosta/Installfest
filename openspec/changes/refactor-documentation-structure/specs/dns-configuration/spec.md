# DNS Configuration Specification

## ADDED Requirements

### Requirement: Two-Tier DNS Strategy
The homelab SHALL use a two-tier DNS strategy with AdGuard Home as primary DNS and Cloudflare as fallback.

#### Scenario: Normal DNS resolution with AdGuard
- **WHEN** a device queries DNS
- **THEN** request SHALL be sent to AdGuard Home (172.20.0.5) first
- **AND** AdGuard provides ad-blocking and local domain resolution

#### Scenario: DNS fallback when AdGuard unavailable
- **WHEN** AdGuard Home is not responding
- **THEN** request SHALL fall back to Cloudflare DNS (1.1.1.1)
- **AND** DNS resolution continues without service interruption

### Requirement: AdGuard Home Primary DNS
AdGuard Home SHALL run at static IP 172.20.0.5 and provide ad-blocking, custom DNS rules, and query logging.

#### Scenario: Blocking advertisements and trackers
- **WHEN** a device queries an ad or tracker domain
- **THEN** AdGuard Home SHALL return blocked response
- **AND** query SHALL be logged for statistics

#### Scenario: Resolving local service domains
- **WHEN** a device queries a local service domain (e.g., homeassistant.local)
- **THEN** AdGuard Home SHALL resolve to correct local IP address
- **AND** custom DNS rules are applied

#### Scenario: Accessing AdGuard web interface
- **WHEN** user navigates to http://adguard.local or http://172.20.0.5
- **THEN** AdGuard Home web interface SHALL be accessible
- **AND** statistics and configuration are available

### Requirement: Cloudflare DNS Fallback
Cloudflare DNS (1.1.1.1) SHALL be configured as secondary DNS for reliability and availability.

#### Scenario: AdGuard maintenance without outage
- **WHEN** AdGuard Home is restarted or updated
- **THEN** DNS requests SHALL automatically fail over to Cloudflare
- **AND** services continue to resolve domains

#### Scenario: Initial boot before AdGuard starts
- **WHEN** system boots and AdGuard is not yet running
- **THEN** Cloudflare DNS SHALL provide resolution
- **AND** services can start without waiting for AdGuard

### Requirement: System-Wide DNS Configuration
DNS configuration SHALL be applied at system level and to all Docker containers.

#### Scenario: Configuring systemd-resolved on Arch Linux
- **WHEN** DNS is configured on the host system
- **THEN** /etc/systemd/resolved.conf SHALL specify DNS servers
- **AND** primary DNS is 172.20.0.5, fallback is 1.1.1.1

#### Scenario: Configuring Docker container DNS
- **WHEN** Docker containers are created
- **THEN** containers SHALL use dns: [172.20.0.5, 1.1.1.1] configuration
- **AND** containers resolve domains through AdGuard then Cloudflare

### Requirement: DNS Testing and Validation
DNS resolution SHALL be testable and troubleshootable with standard tools.

#### Scenario: Testing AdGuard DNS resolution
- **WHEN** running `dig @172.20.0.5 doubleclick.net`
- **THEN** response SHALL indicate ad domain is blocked
- **AND** query time SHALL be < 100ms for cached responses

#### Scenario: Testing Cloudflare fallback
- **WHEN** running `dig @1.1.1.1 google.com`
- **THEN** response SHALL return valid IP address
- **AND** Cloudflare DNS is functioning correctly

#### Scenario: Testing system DNS configuration
- **WHEN** running `dig google.com` without specifying DNS server
- **THEN** system SHALL use configured DNS servers (AdGuard → Cloudflare)
- **AND** resolution succeeds

#### Scenario: Verifying active DNS server
- **WHEN** running `resolvectl status`
- **THEN** output SHALL show current DNS servers
- **AND** AdGuard (172.20.0.5) is listed as primary

### Requirement: DNS Troubleshooting
DNS issues SHALL be diagnosable using standard debugging procedures.

#### Scenario: AdGuard not responding
- **WHEN** AdGuard Home is not responding to queries
- **THEN** `docker compose ps adguardhome` SHALL show container status
- **AND** `docker compose logs adguardhome` SHALL provide error details
- **AND** restart with `docker compose restart adguardhome` restores service

#### Scenario: DNS not resolving any domains
- **WHEN** DNS resolution fails for all domains
- **THEN** /etc/resolv.conf SHALL be checked for DNS server configuration
- **AND** network connectivity to 172.20.0.5 and 1.1.1.1 SHALL be verified
- **AND** firewall rules SHALL be checked for port 53 blocking

#### Scenario: Fallback DNS not working
- **WHEN** Cloudflare fallback is not functioning
- **THEN** verify 1.1.1.1 is configured as secondary DNS
- **AND** check firewall allows outbound DNS (port 53)
- **AND** test with `dig @1.1.1.1 google.com` to isolate issue

### Requirement: DNS Best Practices
DNS configuration SHALL follow operational best practices for reliability and maintainability.

#### Scenario: Always configure DNS fallback
- **WHEN** setting up DNS on a new device or container
- **THEN** both primary (AdGuard) and secondary (Cloudflare) SHALL be configured
- **AND** prevents total DNS failure if AdGuard is down

#### Scenario: Monitoring AdGuard logs
- **WHEN** reviewing system health
- **THEN** AdGuard logs SHALL be checked for blocked queries and issues
- **AND** unusual patterns are investigated

#### Scenario: Backing up AdGuard configuration
- **WHEN** AdGuard configuration is modified
- **THEN** configuration SHALL be exported and backed up
- **AND** backup is stored securely for disaster recovery
