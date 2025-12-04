# dns-configuration Specification

## Purpose

Provide reliable DNS resolution for the homelab with ad-blocking capabilities via AdGuard Home as primary DNS and Cloudflare as fallback. This ensures network services remain accessible even during AdGuard maintenance or failures.

## Requirements

### Requirement: AdGuard Home Primary DNS

The system SHALL configure AdGuard Home as the primary DNS server for ad-blocking and local domain resolution.

#### Scenario: AdGuard Home deployment
- **WHEN** homelab services are deployed
- **THEN** AdGuard Home container is running at 172.20.0.5
- **AND** service is accessible at http://adguard.local
- **AND** DNS port 53 is exposed
- **AND** service auto-starts on boot

#### Scenario: Local domain resolution
- **WHEN** DNS query is made for *.local domain
- **THEN** AdGuard Home resolves to correct homelab service IP
- **AND** response time is under 50ms
- **AND** query is logged in AdGuard dashboard

#### Scenario: Ad blocking functionality
- **WHEN** DNS query is made for known ad/tracking domain
- **THEN** AdGuard Home blocks the query
- **AND** returns NXDOMAIN or configured block page
- **AND** blocked query is logged with category

### Requirement: Cloudflare Fallback DNS

The system SHALL configure Cloudflare DNS (1.1.1.1) as secondary DNS for reliability.

#### Scenario: Fallback DNS configuration
- **WHEN** system DNS is configured
- **THEN** Cloudflare 1.1.1.1 is set as secondary DNS
- **AND** Cloudflare 1.0.0.1 is set as tertiary DNS
- **AND** fallback is automatically used when primary fails

#### Scenario: Primary DNS failure
- **WHEN** AdGuard Home is unavailable
- **THEN** DNS queries automatically use Cloudflare
- **AND** external domains resolve correctly
- **AND** services remain accessible

#### Scenario: Primary DNS recovery
- **WHEN** AdGuard Home becomes available again
- **THEN** system prefers AdGuard for new queries
- **AND** ad-blocking resumes
- **AND** no manual intervention required

### Requirement: System-Wide DNS Configuration

The system SHALL configure all clients and services to use the DNS hierarchy.

#### Scenario: systemd-resolved configuration
- **WHEN** Arch Linux server is configured
- **THEN** /etc/systemd/resolved.conf has DNS=172.20.0.5 1.1.1.1
- **AND** FallbackDNS=1.0.0.1 8.8.8.8
- **AND** DNSOverTLS=opportunistic
- **AND** systemd-resolved service is restarted

#### Scenario: Docker container DNS
- **WHEN** Docker containers are started
- **THEN** containers use dns: [172.20.0.5, 1.1.1.1] from compose config
- **AND** containers can resolve both internal and external domains
- **AND** DNS resolution works without host network mode

#### Scenario: DHCP client configuration
- **WHEN** DHCP server advertises DNS servers
- **THEN** 172.20.0.5 is advertised as primary DNS
- **AND** 1.1.1.1 is advertised as secondary DNS
- **AND** clients receive both DNS servers

### Requirement: DNS Testing and Validation

Users SHALL be able to test and validate DNS resolution.

#### Scenario: Test AdGuard DNS
- **WHEN** user runs dig @172.20.0.5 google.com
- **THEN** query returns valid A record
- **AND** response time is under 100ms
- **AND** query appears in AdGuard logs

#### Scenario: Test ad blocking
- **WHEN** user runs dig @172.20.0.5 doubleclick.net
- **THEN** query is blocked by AdGuard
- **AND** NXDOMAIN response is returned
- **AND** block is logged in AdGuard

#### Scenario: Test Cloudflare fallback
- **WHEN** user runs dig @1.1.1.1 google.com
- **THEN** query returns valid A record
- **AND** response comes from Cloudflare
- **AND** no ad-blocking occurs

#### Scenario: Verify system DNS
- **WHEN** user runs resolvectl status
- **THEN** output shows Current DNS Server: 172.20.0.5
- **AND** shows fallback servers configured
- **AND** shows link status for all interfaces

### Requirement: AdGuard Configuration Management

The system SHALL persist AdGuard Home configuration across restarts.

#### Scenario: Configuration persistence
- **WHEN** AdGuard Home container restarts
- **THEN** all settings are preserved from volume
- **AND** custom DNS rules remain active
- **AND** blocklists are still enabled
- **AND** query history is maintained

#### Scenario: Blocklist updates
- **WHEN** AdGuard automatic update runs
- **THEN** blocklists are refreshed from upstream
- **AND** updated rules take effect immediately
- **AND** update is logged
- **AND** service remains available during update

#### Scenario: Custom DNS rules
- **WHEN** user adds custom DNS rewrite rule
- **THEN** rule is immediately active
- **AND** rule persists after restart
- **AND** rule applies to matching queries
- **AND** rule can be edited or deleted

### Requirement: Troubleshooting and Monitoring

The system SHALL provide tools for DNS troubleshooting.

#### Scenario: Check AdGuard status
- **WHEN** user checks AdGuard container status
- **THEN** docker compose ps shows adguardhome running
- **AND** container health check passes
- **AND** ports 53 and 80 are bound

#### Scenario: View AdGuard logs
- **WHEN** user runs docker compose logs adguardhome
- **THEN** DNS query logs are displayed
- **AND** startup messages show successful initialization
- **AND** any errors are clearly logged

#### Scenario: DNS not resolving
- **WHEN** DNS resolution fails
- **THEN** user can ping 172.20.0.5 to test connectivity
- **AND** can use dig @1.1.1.1 to test fallback
- **AND** can restart AdGuard with docker compose restart
- **AND** can check systemd-resolved status

### Requirement: Documentation References

Users SHALL have access to complete DNS configuration documentation.

#### Scenario: Documentation availability
- **WHEN** user needs DNS configuration help
- **THEN** docs/dns/README.md contains complete setup guide
- **AND** CLAUDE.md references DNS configuration section
- **AND** troubleshooting steps are documented
- **AND** testing procedures are explained

## Related Documentation

- **Setup Guide**: `/docs/dns/README.md` - Complete DNS configuration guide
- **Main Documentation**: `/CLAUDE.md` - DNS Configuration section (lines 298-413)
- **AdGuard Documentation**: Docker Compose configuration in `homelab/compose/infrastructure.yml`
- **Traefik Integration**: Dynamic routing configuration in `homelab/traefik/dynamic/`
