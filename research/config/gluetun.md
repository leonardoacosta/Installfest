# Gluetun Configuration Research

## Service Overview
Gluetun is a VPN client container supporting multiple providers, creating a secure tunnel for other containers to route traffic through.

## 1. Environment Variables and Purposes

```yaml
# VPN Provider Configuration
VPN_SERVICE_PROVIDER: "mullvad"           # or nordvpn, expressvpn, etc.
VPN_TYPE: "wireguard"                     # or openvpn
WIREGUARD_PRIVATE_KEY: "${WG_PRIVATE_KEY}"
WIREGUARD_ADDRESSES: "10.64.0.2/32"
SERVER_COUNTRIES: "Netherlands,Sweden"
SERVER_CITIES: "Amsterdam,Stockholm"

# Network Configuration
FIREWALL: "on"
FIREWALL_INPUT_PORTS: "8080,9091,6881"
FIREWALL_OUTBOUND_SUBNETS: "192.168.1.0/24"
DOT: "on"                                  # DNS over TLS
DNS_ADDRESS: "10.64.0.1"
BLOCK_MALICIOUS: "on"
BLOCK_ADS: "on"
BLOCK_SURVEILLANCE: "on"

# Kill Switch
FIREWALL_VPN_INPUT_PORTS: "51820"
VPN_INTERFACE: "wg0"
KILL_SWITCH: "on"

# Performance
MTU: "1420"
WIREGUARD_MTU: "1420"
```

## 2. Secrets Management Strategy

```yaml
secrets:
  gluetun_wireguard_key:
    file: ./secrets/gluetun/wireguard_private_key.txt
  gluetun_openvpn_auth:
    file: ./secrets/gluetun/openvpn_auth.txt

environment:
  - WIREGUARD_PRIVATE_KEY_FILE=/run/secrets/gluetun_wireguard_key
  - OPENVPN_USER_FILE=/run/secrets/openvpn_user
  - OPENVPN_PASSWORD_FILE=/run/secrets/openvpn_password
```

## 3. Volume Mounts and Data Persistence

```yaml
volumes:
  - ./config/gluetun:/gluetun:rw
  - ./logs/gluetun:/var/log:rw

cap_add:
  - NET_ADMIN
  - SYS_MODULE

devices:
  - /dev/net/tun:/dev/net/tun

sysctls:
  - net.ipv4.conf.all.src_valid_mark=1
  - net.ipv6.conf.all.disable_ipv6=1
```

## 4. Service Dependencies

```yaml
# Services using Gluetun
qbittorrent:
  network_mode: "service:gluetun"
  depends_on:
    gluetun:
      condition: service_healthy

prowlarr:
  network_mode: "service:gluetun"
  depends_on:
    gluetun:
      condition: service_healthy
```

## 5. Health Check Configuration

```yaml
healthcheck:
  test: ["CMD", "/gluetun-entrypoint", "healthcheck"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

## Security & Performance

- Always use kill switch
- Configure firewall rules properly
- Use WireGuard for better performance
- Implement DNS leak protection
- Regular IP checks
- Monitor connection stability