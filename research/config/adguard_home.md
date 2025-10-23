# AdGuard Home Configuration Research

## Service Overview
AdGuard Home is a network-wide DNS server with ad-blocking, privacy protection, and parental control capabilities, serving as a DNS sinkhole for your entire network.

## 1. Environment Variables and Purposes

```yaml
# Core Configuration
TZ: "America/New_York"                    # Timezone
PUID: "1000"                              # User ID
PGID: "1000"                              # Group ID

# Network Settings
AGH_HTTP_PORT: "3000"                     # Web UI port
AGH_DNS_PORT: "53"                        # DNS port
AGH_HTTPS_PORT: "443"                     # HTTPS port for DoH
AGH_DNS_OVER_TLS_PORT: "853"             # DNS-over-TLS port
AGH_DNS_OVER_QUIC_PORT: "853"            # DNS-over-QUIC port

# Performance
AGH_CACHE_SIZE: "4194304"                 # DNS cache size in bytes
AGH_CACHE_TTL_MIN: "0"                    # Minimum cache TTL
AGH_CACHE_TTL_MAX: "86400"               # Maximum cache TTL
AGH_CACHE_OPTIMISTIC: "true"             # Enable optimistic caching

# Security
AGH_PROTECTION_ENABLED: "true"            # Enable protection
AGH_SAFEBROWSING_ENABLED: "true"         # Enable safe browsing
AGH_PARENTAL_ENABLED: "false"            # Parental control
AGH_SAFESEARCH_ENABLED: "false"          # Safe search enforcement
```

## 2. Secrets Management Strategy

```yaml
# Docker Secrets
secrets:
  adguard_password:
    file: ./secrets/adguard_password.txt
  adguard_tls_cert:
    file: ./secrets/certs/fullchain.pem
  adguard_tls_key:
    file: ./secrets/certs/privkey.pem

# Environment references
environment:
  - AGH_PASSWORD_FILE=/run/secrets/adguard_password
  - AGH_TLS_CERT_FILE=/run/secrets/adguard_tls_cert
  - AGH_TLS_KEY_FILE=/run/secrets/adguard_tls_key

# API tokens for integrations
AGH_API_TOKEN: "${AGH_API_TOKEN}"
AGH_STATS_TOKEN: "${AGH_STATS_TOKEN}"
```

## 3. Volume Mounts and Data Persistence

```yaml
volumes:
  # Configuration and data
  - ./config/adguard/work:/opt/adguardhome/work:rw
  - ./config/adguard/conf:/opt/adguardhome/conf:rw

  # Custom filter lists
  - ./filters/adguard:/opt/adguardhome/filters:rw

  # SSL certificates
  - ./ssl/adguard:/opt/adguardhome/ssl:ro

  # Logs
  - ./logs/adguard:/opt/adguardhome/logs:rw

# Named volumes for production
volumes:
  adguard_work:
    driver: local
    driver_opts:
      type: none
      device: /mnt/data/adguard/work
      o: bind
  adguard_conf:
    driver: local
```

## 4. Health Check Configuration

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s

# API endpoints for monitoring
/control/status          # Service status
/control/stats           # Statistics
/control/querylog        # Query log
/control/filtering/status # Filtering status
```

## 5. Backup and Restore Procedures

```bash
#!/bin/bash
# Backup Script
BACKUP_DIR="/backups/adguard/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Stop service for consistent backup
docker stop adguard

# Backup configuration
cp -r /opt/adguardhome/conf "$BACKUP_DIR/"
cp -r /opt/adguardhome/work "$BACKUP_DIR/"

# Backup custom filters
tar -czf "$BACKUP_DIR/filters.tar.gz" /opt/adguardhome/filters/

# Export statistics
docker exec adguard /opt/adguardhome/AdGuardHome \
  --service export-stats --output "$BACKUP_DIR/stats.json"

# Restart service
docker start adguard

# Restore Script
restore_adguard() {
  RESTORE_FROM="$1"
  docker stop adguard

  # Restore configuration
  cp -r "$RESTORE_FROM/conf/"* /opt/adguardhome/conf/
  cp -r "$RESTORE_FROM/work/"* /opt/adguardhome/work/

  # Restore filters
  tar -xzf "$RESTORE_FROM/filters.tar.gz" -C /

  docker start adguard
}
```

## 6. Service Dependencies and Startup Order

```yaml
depends_on:
  - reverse_proxy    # For web interface access

# Network mode consideration
network_mode: host  # Required for DHCP server functionality

# Alternative bridge mode setup
networks:
  - dns_network
ports:
  - "53:53/tcp"
  - "53:53/udp"
  - "67:67/udp"     # DHCP
  - "68:68/udp"     # DHCP
  - "3000:3000/tcp" # Web UI
  - "853:853/tcp"   # DoT
  - "853:853/udp"   # DoQ

# Startup priority: 2 (critical network service)
```

## 7. Resource Limits and Quotas

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M

# Cache and query limits
query_log_retention: 90    # Days
query_log_size_limit: 1000 # MB
statistics_retention: 365  # Days
```

## 8. Logging Configuration

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "20m"
    max-file: "10"
    labels: "service=adguard"

# AdGuard logging configuration
log_file: /opt/adguardhome/logs/adguard.log
log_max_backups: 5
log_max_size: 100  # MB
log_max_age: 7     # Days
log_compress: true
verbose: false
```

## 9. Update and Maintenance Strategy

```yaml
# Auto-update configuration
labels:
  - "com.centurylinklabs.watchtower.enable=true"
  - "com.centurylinklabs.watchtower.schedule=0 0 3 * * *"

# Update script with validation
update_script: |
  # Backup before update
  ./backup_adguard.sh

  # Pull new image
  docker pull adguard/adguardhome:latest

  # Test configuration
  docker run --rm -v ./config:/opt/adguardhome/conf \
    adguard/adguardhome:latest --check-config

  # Update if valid
  docker-compose down adguard
  docker-compose up -d adguard

  # Verify DNS resolution
  nslookup google.com 127.0.0.1

# Maintenance tasks
maintenance:
  daily:
    - Update filter lists
    - Rotate logs
  weekly:
    - Clear DNS cache
    - Backup configuration
  monthly:
    - Analyze query statistics
    - Update blocking rules
    - Prune old logs
```

## 10. Configuration File Template

```yaml
# AdGuardHome.yaml
bind_host: 0.0.0.0
bind_port: 3000
beta_bind_port: 0
users:
  - name: admin
    password: $2a$10$HASH_HERE  # bcrypt hash

auth_attempts: 5
block_auth_min: 15
http_proxy: ""
language: en
rlimit_nofile: 0
debug_pprof: false
web_session_ttl: 720

dns:
  bind_hosts:
    - 0.0.0.0
  port: 53

  statistics_interval: 1
  querylog_enabled: true
  querylog_file_enabled: true
  querylog_interval: 90
  querylog_size_memory: 1000

  protection_enabled: true
  blocking_mode: default
  blocking_ipv4: 0.0.0.0
  blocking_ipv6: "::"

  cache_size: 4194304
  cache_ttl_min: 0
  cache_ttl_max: 86400
  cache_optimistic: true

  upstream_dns:
    - https://dns.cloudflare.com/dns-query
    - https://dns.google/dns-query
    - tls://1.1.1.1
    - tls://8.8.8.8
    - "[/local/]192.168.1.1"  # Local domain resolution

  upstream_dns_file: ""
  bootstrap_dns:
    - 1.1.1.1
    - 8.8.8.8

  all_servers: false
  fastest_addr: true
  fastest_timeout: 1s

  allowed_clients: []
  disallowed_clients: []
  blocked_hosts:
    - version.bind
    - id.server
    - hostname.bind

  trusted_proxies:
    - 127.0.0.0/8
    - 172.16.0.0/12
    - 192.168.0.0/16

  cache_time: 30
  ratelimit: 100
  ratelimit_whitelist: []
  refuse_any: true

  edns_client_subnet: false
  max_goroutines: 300
  ipset: []

  filtering_enabled: true
  filters_update_interval: 24

  rewrites:
    - domain: "*.local"
      answer: "192.168.1.100"
    - domain: "homeassistant.local"
      answer: "192.168.1.101"

tls:
  enabled: true
  server_name: "dns.example.com"
  force_https: true
  port_https: 443
  port_dns_over_tls: 853
  port_dns_over_quic: 853

  allow_unencrypted_doh: false
  strict_sni_check: false

  certificate_chain: /opt/adguardhome/ssl/fullchain.pem
  private_key: /opt/adguardhome/ssl/privkey.pem

filters:
  - enabled: true
    url: https://adguardteam.github.io/AdGuardSDNSFilter/Filters/filter.txt
    name: AdGuard DNS filter
    id: 1

  - enabled: true
    url: https://someonewhocares.org/hosts/zero/hosts
    name: Dan Pollock's List
    id: 2

  - enabled: true
    url: https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
    name: StevenBlack's List
    id: 3

whitelist_filters: []

user_rules:
  - "||ads.example.com^"
  - "@@||legitimate-site.com^"
  - "/regex-pattern/"

dhcp:
  enabled: false
  interface_name: eth0
  dhcpv4:
    gateway_ip: 192.168.1.1
    subnet_mask: 255.255.255.0
    range_start: 192.168.1.100
    range_end: 192.168.1.200
    lease_duration: 86400

clients:
  - name: "Home Assistant"
    tags:
      - device_nas
    ids:
      - "192.168.1.101"
    use_global_settings: false
    filtering_enabled: false

  - name: "Kids Devices"
    tags:
      - user_child
    ids:
      - "AA:BB:CC:DD:EE:FF"
    use_global_settings: false
    parental_enabled: true
    safesearch_enabled: true

log_file: ""
log_max_backups: 0
log_max_size: 100
log_max_age: 3
log_compress: false
log_localtime: false
verbose: false

os:
  group: ""
  user: ""

schema_version: 14
```

## Security Considerations

1. **Access Control**: Implement strong admin passwords
2. **Rate Limiting**: Configure query rate limits
3. **DoH/DoT**: Enable DNS-over-HTTPS/TLS
4. **DNSSEC**: Enable DNSSEC validation
5. **Client Restrictions**: Use allowed_clients list
6. **Audit Logging**: Enable comprehensive query logging

## Integration Points

- **Home Assistant**: DNS resolution and statistics
- **Grafana**: Metrics visualization via API
- **Prometheus**: Metrics export endpoint
- **DHCP Server**: Network device management
- **Reverse Proxy**: Web UI access

## Performance Optimization

1. **Cache Tuning**:
   - Increase cache_size for better performance
   - Optimize cache_ttl values
   - Enable optimistic caching

2. **Upstream DNS**:
   - Use multiple upstream servers
   - Enable fastest_addr selection
   - Configure bootstrap DNS properly

3. **Filter Lists**:
   - Curate filter lists to avoid duplicates
   - Regular updates but not too frequent
   - Use compiled hosts format when possible

## Troubleshooting Guide

Common issues:
- **Port 53 conflict**: Check if systemd-resolved is running
- **Slow queries**: Review upstream DNS performance
- **High memory usage**: Reduce cache size or query log retention
- **DHCP not working**: Requires host network mode
- **Certificate errors**: Check certificate paths and permissions