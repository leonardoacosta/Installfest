# Tailscale + AdGuard Home: IP Rules Deletion Issue

## Executive Summary

When running **Tailscale** and **AdGuard Home** together in Docker with `network_mode: host` and kernel networking (`TS_USERSPACE=false`), both services compete for control of the host's iptables rules, leading to:
- iptables rules being deleted or overwritten
- IP forwarding failures
- DNS resolution breaking
- Loss of client IP information
- Network connectivity issues after container restarts

---

## Problem Analysis

### Root Causes

#### 1. **Shared Host Network Stack**
Both services run with `network_mode: host`, meaning they:
- Share the same network namespace
- Manipulate the **same iptables chains** (PREROUTING, POSTROUTING, FORWARD)
- Can **overwrite or delete** each other's rules

#### 2. **Kernel Mode Networking (TS_USERSPACE=false)**
When `TS_USERSPACE=false`, Tailscale:
- Uses `/dev/net/tun` for VPN tunneling
- Creates **iptables rules** for:
  - NAT (Network Address Translation)
  - IP forwarding
  - Subnet routing (`--advertise-routes`)
  - Exit node functionality (`--advertise-exit-node`)
- Requires **NET_ADMIN** capability to modify iptables

#### 3. **Docker Restart Behavior**
When containers restart (especially during CI/CD deployments):
```bash
docker compose down  # Flushes iptables rules
docker compose up    # Services race to recreate rules
```

**Race condition:**
1. Tailscale starts → Creates iptables rules
2. AdGuard starts → May flush/modify DNS-related iptables rules
3. Docker networking adjusts → Can delete Tailscale's rules
4. **Result:** Broken routing, missing client IPs, DNS failures

#### 4. **iptables vs iptables-nft Confusion**
Modern Linux systems use **iptables-nft** (nftables backend), but containers might use **iptables-legacy**:
- Tailscale may not detect the correct version
- Rules created with one don't show up in the other
- Commands like `iptables -L` may show empty rulesets even when rules exist

---

## Your Current Configuration

### Tailscale (`compose/vpn.yml`)
```yaml
tailscale:
  network_mode: host              # ✅ Shares host network
  environment:
    - TS_USERSPACE=false          # ⚠️  Uses kernel networking + iptables
    - TS_EXTRA_ARGS=--advertise-exit-node --accept-dns=false
    - TS_ROUTES=172.20.0.0/16,172.21.0.0/16
  cap_add:
    - NET_ADMIN                   # ⚠️  Can modify iptables
    - SYS_MODULE
  volumes:
    - /dev/net/tun:/dev/net/tun   # ⚠️  Kernel mode VPN interface
```

### AdGuard Home (`compose/infrastructure.yml`)
```yaml
adguardhome:
  ports:
    - "53:53/tcp"                 # ⚠️  DNS port (iptables PREROUTING)
    - "53:53/udp"
  networks:
    homelab:
      ipv4_address: 172.20.0.53
```

**Conflict Zone:**
- Both manipulate DNS routing (port 53)
- Both create NAT/forwarding rules
- Both need control of PREROUTING/OUTPUT chains

---

## Observed Symptoms

### 1. **IP Rules Deleted**
```bash
# Tailscale creates rules:
iptables -t nat -A POSTROUTING -o tailscale0 -j MASQUERADE
ip route add 172.20.0.0/16 via <tailscale-ip>

# After AdGuard/Docker restart:
iptables -t nat -L  # Rules missing!
ip route show       # Routes missing!
```

### 2. **Client IP Loss**
- AdGuard logs show `172.20.0.1` (Docker gateway) instead of actual client IPs
- Tailscale connections appear as local instead of remote

### 3. **DNS Resolution Failures**
- `.local` domains stop resolving through AdGuard
- Tailscale MagicDNS conflicts with AdGuard

### 4. **Routing Failures**
- Advertised subnets (`172.20.0.0/16`, `172.21.0.0/16`) become unreachable
- Exit node functionality breaks

---

## Solutions & Workarounds

### Solution 1: Use Userspace Networking (Recommended for Homelab)

**Advantages:**
- ✅ No iptables conflicts
- ✅ No kernel module requirements
- ✅ Simpler permissions
- ✅ More stable with Docker restarts

**Disadvantages:**
- ❌ Requires proxy configuration for apps
- ❌ Slightly lower performance
- ❌ Cannot use `--advertise-exit-node` (no kernel routing)

**Implementation:**
```yaml
tailscale:
  environment:
    - TS_USERSPACE=true  # Change to userspace mode
    - TS_SOCKS5_SERVER=localhost:1055
    - TS_OUTBOUND_HTTP_PROXY_LISTEN=localhost:1055
    - TS_EXTRA_ARGS=--accept-dns=false  # Remove --advertise-exit-node
  # Remove these (not needed in userspace):
  # volumes:
  #   - /dev/net/tun:/dev/net/tun
  # cap_add:
  #   - NET_ADMIN
```

---

### Solution 2: Separate Tailscale from Docker (Recommended for Exit Node)

Run Tailscale **directly on the host** (not in Docker):

**Installation:**
```bash
# Install on Ubuntu/Debian
curl -fsSL https://tailscale.com/install.sh | sh

# Configure with proper flags
sudo tailscale up \
  --accept-dns=false \
  --advertise-routes=172.20.0.0/16,172.21.0.0/16 \
  --advertise-exit-node
```

**Advantages:**
- ✅ No Docker iptables conflicts
- ✅ Full kernel networking features
- ✅ Persistent iptables rules across Docker restarts
- ✅ Exit node works properly

**Configuration File:**
```bash
# /etc/default/tailscaled
FLAGS="--accept-dns=false"
```

**Systemd Service:**
```bash
sudo systemctl enable --now tailscaled
sudo systemctl status tailscaled
```

---

### Solution 3: Use MacVLAN for AdGuard (Advanced)

Give AdGuard its **own network interface** separate from Docker bridge:

```yaml
adguardhome:
  networks:
    adguard_macvlan:
      ipv4_address: 192.168.1.53  # Dedicated IP on your LAN

networks:
  adguard_macvlan:
    driver: macvlan
    driver_opts:
      parent: eth0  # Your physical interface
    ipam:
      config:
        - subnet: 192.168.1.0/24
          gateway: 192.168.1.1
          ip_range: 192.168.1.53/32
```

**Advantages:**
- ✅ AdGuard appears as physical device on network
- ✅ No bridge network IP conflicts
- ✅ Real client IPs preserved

**Disadvantages:**
- ❌ Cannot access from Docker host (MacVLAN limitation)
- ❌ Complex network configuration
- ❌ Requires router/DHCP adjustments

---

### Solution 4: Persistent IP Rules Script (Workaround)

Create a systemd service to restore IP rules after disruptions:

```bash
#!/bin/bash
# /usr/local/bin/restore-tailscale-routes.sh

# Restore Tailscale routes
ip route replace 172.20.0.0/16 via $(tailscale ip -4) dev tailscale0 2>/dev/null || true
ip route replace 172.21.0.0/16 via $(tailscale ip -4) dev tailscale0 2>/dev/null || true

# Restore iptables rules
iptables -t nat -C POSTROUTING -o tailscale0 -j MASQUERADE 2>/dev/null || \
  iptables -t nat -A POSTROUTING -o tailscale0 -j MASQUERADE

# Enable IP forwarding
sysctl -w net.ipv4.ip_forward=1
sysctl -w net.ipv6.conf.all.forwarding=1
```

**Systemd Unit:**
```ini
# /etc/systemd/system/restore-tailscale-routes.service
[Unit]
Description=Restore Tailscale Routes After Docker Start
After=docker.service tailscaled.service
Requires=docker.service tailscaled.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/restore-tailscale-routes.sh
RemainOnExit=yes

[Install]
WantedBy=multi-user.target
```

**Path Unit (triggers on Docker events):**
```ini
# /etc/systemd/system/restore-tailscale-routes.path
[Unit]
Description=Monitor Docker for Tailscale Route Restoration

[Path]
PathModified=/var/run/docker.sock
Unit=restore-tailscale-routes.service

[Install]
WantedBy=multi-user.target
```

---

### Solution 5: Configure IP Forwarding Persistence

Ensure IP forwarding survives restarts:

```bash
# /etc/sysctl.d/99-tailscale.conf
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1
net.ipv4.conf.all.src_valid_mark = 1
```

Apply:
```bash
sudo sysctl --system
```

---

## Recommended Configuration for Your Setup

Based on your homelab needs, here's the optimal configuration:

### Option A: Keep Docker Tailscale (Simpler)

**Best for:** Testing, development, simpler management

```yaml
# compose/vpn.yml
tailscale:
  image: docker.io/tailscale/tailscale:stable
  container_name: tailscale
  restart: unless-stopped
  hostname: homelab-tailscale
  environment:
    - TS_AUTHKEY=${TS_AUTHKEY}
    - TS_STATE_DIR=/var/lib/tailscale
    - TS_USERSPACE=true  # ← Change to userspace
    - TS_SOCKS5_SERVER=:1055
    - TS_OUTBOUND_HTTP_PROXY_LISTEN=:1055
    - TS_EXTRA_ARGS=--accept-dns=false  # ← Remove --advertise-exit-node
  volumes:
    - ../tailscale/state:/var/lib/tailscale
  network_mode: host  # Keep host networking for simplicity
  # Remove:
  # - /dev/net/tun:/dev/net/tun
  # cap_add:
  #   - NET_ADMIN
  #   - SYS_MODULE
```

**Limitations:**
- No exit node functionality
- No subnet routing to Tailscale network
- Apps need proxy configuration

---

### Option B: Host-Level Tailscale (Recommended)

**Best for:** Production, full Tailscale features, stability

**1. Remove Tailscale from Docker:**
```bash
# Comment out or remove tailscale service from compose/vpn.yml
```

**2. Install on host:**
```bash
ssh nyaptor@192.168.1.14

# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Enable IP forwarding
sudo tee /etc/sysctl.d/99-tailscale.conf > /dev/null <<EOF
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1
net.ipv4.conf.all.src_valid_mark = 1
EOF
sudo sysctl --system

# Start Tailscale with your auth key
sudo tailscale up \
  --authkey=${TS_AUTHKEY} \
  --accept-dns=false \
  --advertise-routes=172.20.0.0/16,172.21.0.0/16 \
  --advertise-exit-node \
  --hostname=homelab

# Enable service
sudo systemctl enable --now tailscaled
```

**3. Approve routes in Tailscale Admin:**
- Go to https://login.tailscale.com/admin/machines
- Find your homelab machine
- Click "Edit route settings"
- Approve subnet routes and exit node

**Advantages:**
- ✅ No Docker restart conflicts
- ✅ Full exit node functionality
- ✅ Persistent iptables rules
- ✅ Better performance
- ✅ Simpler troubleshooting

---

## Testing & Verification

### 1. Check iptables Rules
```bash
# View NAT rules
sudo iptables -t nat -L -v -n | grep tailscale

# View forward rules
sudo iptables -L FORWARD -v -n | grep tailscale

# Check if using nftables
sudo nft list ruleset | grep tailscale
```

### 2. Verify IP Routes
```bash
# Show all routes
ip route show

# Check specific subnets
ip route get 172.20.0.1
ip route get 172.21.0.1
```

### 3. Test DNS Resolution
```bash
# From Tailscale client
nslookup jellyfin.local 192.168.1.14  # Should resolve via AdGuard

# Check AdGuard logs for correct client IP
docker logs adguardhome | tail -20
```

### 4. Verify Tailscale Status
```bash
# If host-level
sudo tailscale status
sudo tailscale ip -4
sudo tailscale ping <other-device>

# If Docker
docker exec tailscale tailscale status
```

### 5. Test Exit Node
```bash
# From another Tailscale device
curl ifconfig.me  # Should show homelab's public IP
```

---

## Debugging Common Issues

### Issue: "iptables: No chain/target/match by that name"
**Cause:** Mixing iptables-legacy and iptables-nft

**Solution:**
```bash
# Check which version is active
update-alternatives --display iptables

# Switch to nftables (recommended for modern systems)
sudo update-alternatives --set iptables /usr/sbin/iptables-nft
sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-nft

# Restart Tailscale
sudo systemctl restart tailscaled
```

### Issue: Routes disappear after Docker restart
**Cause:** Docker flushes iptables on startup

**Solution:** Use Option B (host-level Tailscale) or implement Solution 4 (persistent rules script)

### Issue: AdGuard shows wrong client IPs
**Cause:** Docker bridge NAT interfering with Tailscale routing

**Solution:**
```bash
# Check Docker network
docker network inspect homelab

# Verify AdGuard bind address
docker exec adguardhome cat /opt/adguardhome/conf/AdGuardHome.yaml | grep bind_host

# Should be: bind_host: 0.0.0.0 or specific interface IP
```

### Issue: Cannot access homelab services via Tailscale
**Cause:** Firewall blocking or missing routes

**Solution:**
```bash
# Check firewall
sudo ufw status
sudo firewall-cmd --list-all

# Ensure Tailscale interface is trusted
sudo ufw allow in on tailscale0

# Verify routes are advertised
tailscale status | grep "offers exit node"
tailscale status | grep "172.20.0.0/16"
```

---

## Migration Plan

### Phase 1: Assessment (Current State)
```bash
# Document current iptables state
sudo iptables-save > ~/iptables-before.txt

# Document routes
ip route show > ~/routes-before.txt

# Test current functionality
tailscale status
docker exec adguardhome adguardhome --check-config
```

### Phase 2: Backup
```bash
# Backup Tailscale state
docker cp tailscale:/var/lib/tailscale ~/tailscale-backup/

# Backup AdGuard config
docker cp adguardhome:/opt/adguardhome/conf ~/adguard-backup/
```

### Phase 3: Implement Solution (Choose Option A or B)

**Option A - Userspace:**
1. Edit `compose/vpn.yml`
2. Set `TS_USERSPACE=true`
3. Remove kernel requirements
4. `docker compose up -d tailscale`

**Option B - Host-level:**
1. `docker compose down tailscale`
2. Install Tailscale on host
3. Configure with proper flags
4. Test connectivity

### Phase 4: Verification
```bash
# Check iptables after change
sudo iptables-save > ~/iptables-after.txt
diff ~/iptables-before.txt ~/iptables-after.txt

# Test services
curl https://jellyfin.local  # From Tailscale client
nslookup google.com 192.168.1.14  # DNS through AdGuard
tailscale ping <another-device>  # Tailscale connectivity
```

### Phase 5: Monitor
```bash
# Watch iptables for changes
watch -n 5 'sudo iptables -t nat -L -v -n | grep -E "tailscale|adguard"'

# Monitor Docker logs
docker compose logs -f --tail=100 adguardhome
```

---

## Long-Term Recommendations

1. **Use host-level Tailscale** (Option B) for production stability
2. **Keep AdGuard in Docker** for easy updates and backups
3. **Monitor iptables rules** with automated alerts
4. **Document network topology** for troubleshooting
5. **Test before CI/CD deployments** to ensure no disruptions
6. **Use `--accept-dns=false`** (already configured ✅) to prevent DNS conflicts
7. **Separate infrastructure services** from application restarts in deployment scripts (already done ✅)

---

## References

### Official Documentation
- [Tailscale Docker Guide](https://tailscale.com/kb/1282/docker)
- [Tailscale Userspace Networking](https://tailscale.com/kb/1112/userspace-networking)
- [AdGuard Home GitHub](https://github.com/AdguardTeam/AdGuardHome)

### Related Issues
- [Tailscale Issue #5424: IP rules recovery](https://github.com/tailscale/tailscale/issues/5424)
- [Tailscale Issue #10205: Source IP loss after restart](https://github.com/tailscale/tailscale/issues/10205)
- [AdGuard Discussion #7263: Tailscale DNS rewrite](https://github.com/AdguardTeam/AdGuardHome/discussions/7263)

### Community Guides
- [AdGuard + Tailscale Setup Guide](https://akashrajpurohit.com/blog/adguard-home-tailscale-erase-ads-on-the-go/)
- [Tailscale + AdGuard on GCP](https://danielraffel.me/2024/02/09/tailscale-adguard-on-gcp/)

---

## Conclusion

The Tailscale + AdGuard iptables conflict is a **known issue** when both services run in Docker with `network_mode: host` and kernel networking. The most robust solution for your homelab is to:

1. **Run Tailscale at the host level** (not in Docker)
2. **Keep AdGuard in Docker** for manageability
3. **Use fallback DNS** (already configured ✅)
4. **Exclude infrastructure from CI/CD restarts** (already done ✅)

This configuration provides:
- ✅ Zero-downtime deployments
- ✅ Stable iptables rules
- ✅ Full Tailscale features (exit node, subnet routing)
- ✅ Reliable AdGuard DNS filtering
- ✅ Proper client IP logging

---

**Document Version:** 1.0
**Last Updated:** 2025-10-30
**Tested On:** Ubuntu 22.04, Docker 24.x, Tailscale 1.78+, AdGuard Home 0.107+
