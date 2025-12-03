# Design: Automated Homelab Deployment System

## Context

The current homelab setup requires significant manual intervention during initial deployment and rebuilds. With expanding requirements for CI/CD infrastructure (multiple runners), we need a comprehensive automated deployment solution.

**Constraints:**
- Single Arch Linux physical server hosts all services
- USB must be portable and contain all necessary secrets
- System must be rebuildable from scratch in under 30 minutes (excluding downloads)
- Maintain existing service functionality during transition

**Stakeholders:**
- Primary user: Leo (solo operator, developer, homelab admin)
- Systems affected: All homelab services, GitHub Actions workflows

## Goals / Non-Goals

### Goals
- ✅ USB-bootable automated installer with encrypted secrets
- ✅ Zero-interaction deployment (except initial Steam login, Bluetooth pairing confirmation)
- ✅ Multiple GitHub runners for parallel CI/CD
- ✅ Automated Bluetooth and Steam setup
- ✅ Maintain all existing service functionality

### Non-Goals
- ❌ Multi-server orchestration (single machine only)
- ❌ High-availability/clustering (not required for homelab)
- ❌ Automated Steam login (impossible due to Steam Guard)
- ❌ Remote Bluetooth pairing (must be in range)
- ❌ Playwright test report server (moved to separate spec)
- ❌ Claude Agent management server (moved to separate spec)

## Decisions

### Decision 1: Two-Stage USB Boot Process

**Choice:** archinstall (stage 1) → systemd first-boot (stage 2)

**Why:**
- archinstall is official Arch installer with JSON config support
- Separates base OS concerns from application deployment
- systemd first-boot is idempotent and well-understood
- Allows testing stage 2 independently

**Alternatives Considered:**
- Single-stage custom install script: More brittle, harder to maintain
- Cloud-init style config: Not native to Arch, adds complexity
- Manual install with ansible: Requires network, slower iteration

**Implementation:**
```
USB Boot Flow:
1. Boot Arch ISO with archinstall --config /usb/archinstall-config.json
2. archinstall creates user, installs base packages, enables systemd-firstboot
3. System reboots, systemd runs homelab-bootstrap.service (oneshot)
4. homelab-bootstrap.sh decrypts secrets, clones repo, runs homelab.sh
5. homelab.sh reads .homelab-config.yml (unattended mode)
6. All services deployed via docker compose
```

### Decision 2: Docker-Based Multi-Runner Architecture

**Choice:** myoung34/docker-github-actions-runner image with static compose file

**Why:**
- Easier to manage than multiple systemd services
- Isolated environments prevent runner conflicts
- Can scale up/down easily
- Docker-in-Docker support for workflows
- Existing compose infrastructure

**Alternatives Considered:**
- Systemd services (current approach): Manual management, no isolation
- Kubernetes: Massive overkill for 4 runners
- GitHub-hosted runners: Not self-hosted, Leo wants local control

**Implementation:**
```yaml
# compose/runners.yml
services:
  github-runner-1:
    image: myoung34/github-runner:latest
    environment:
      REPO_URL: https://github.com/leonardoacosta/Installfest
      RUNNER_NAME: homelab-runner-1
      RUNNER_TOKEN: ${RUNNER_TOKEN_1}
      RUNNER_WORKDIR: /runner/_work
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - runner-1-work:/runner/_work
      - playwright-reports:/reports  # Shared volume for Playwright reports
    networks:
      - homelab

volumes:
  playwright-reports:
    name: playwright-reports
```

**Notes:**
- All 4 runners share the `playwright-reports` volume
- GitHub workflows write reports to `/reports/{workflow}/{run_id}/`
- Future Playwright Report Server (separate spec) will mount this same volume for viewing

### Decision 3: Secrets Management - GPG Encryption

**Choice:** GPG symmetric encryption for USB secrets file

**Why:**
- Standard tool, available on Arch
- Symmetric encryption (passphrase) simpler than keypairs
- Easy to decrypt in scripts
- USB can be shared without exposing secrets

**Implementation:**
```bash
# USB creation
gpg --symmetric --cipher-algo AES256 homelab-secrets.env

# Bootstrap decryption
gpg --decrypt /usb/homelab-secrets.env.gpg > /tmp/secrets.env
source /tmp/secrets.env
shred -u /tmp/secrets.env  # Secure deletion
```

### Decision 4: Steam - Headless with Systemd Service

**Choice:** Headless Steam installation via systemd service (no desktop environment)

**Why:**
- Remote Play doesn't require GUI
- Saves resources (no X11, DE)
- Systemd manages Steam process
- Can still access via Steam Remote Play app

**Implementation:**
```bash
# Install
pacman -S steam

# Create systemd service
[Unit]
Description=Steam Headless
After=network.target

[Service]
Type=simple
User=leo
ExecStart=/usr/bin/steam -console -noreactlogin
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**Note:** First login still requires Steam Guard (one-time manual step)

### Decision 5: Bluetooth - bluetoothctl Scripting

**Choice:** bluetoothctl batch commands from YAML config

**Why:**
- bluetoothctl is standard Bluetooth management tool
- Scriptable via stdin
- YAML config allows easy device management
- Auto-reconnect via trust + systemd

**Implementation:**
```yaml
# config/bluetooth-devices.yml
devices:
  - name: "Xbox Controller"
    mac: "AA:BB:CC:DD:EE:FF"
    auto_connect: true
  - name: "Bluetooth Headset"
    mac: "11:22:33:44:55:66"
    auto_connect: false
```

```bash
# scripts/setup-bluetooth.sh
for device in $(yq '.devices[] | .mac' config/bluetooth-devices.yml); do
  bluetoothctl <<EOF
power on
agent on
default-agent
trust $device
connect $device
EOF
done
```

## Risks / Trade-offs

### Risk 1: USB Secrets Compromise
**Impact:** All homelab credentials exposed if USB lost/stolen
**Mitigation:**
- GPG encryption with strong passphrase
- Keep USB in secure location
- Consider hardware token (YubiKey) for GPG in future

### Risk 2: Multiple Runners Resource Exhaustion
**Impact:** 4 parallel workflows could overwhelm server (CPU, disk, memory)
**Mitigation:**
- Set runner concurrency limits in GitHub
- Monitor resource usage via Glance
- Start with 2 runners, scale to 4 if headroom exists

### Risk 3: archinstall Config Drift
**Impact:** Arch updates may change archinstall JSON schema
**Mitigation:**
- Pin archinstall version in USB creation script
- Test USB boot after major Arch releases
- Keep manual install instructions as backup

### Trade-off: Complexity vs. Automation
**Decision:** Accept increased complexity (multi-runner infrastructure, USB boot orchestration) for fully automated deployment
**Rationale:** One-time setup cost pays off during rebuilds, testing, disaster recovery

## Migration Plan

### Phase 1: USB Boot System (Week 1)
1. Create archinstall config JSON
2. Implement homelab-bootstrap.sh
3. Add unattended mode to homelab.sh
4. Create USB creation script
5. **Test:** Fresh Arch install on VM, verify all services deploy

### Phase 2: Multi-Runner Infrastructure (Week 2)
1. Create compose/runners.yml
2. Update GitHub workflows to use multi-runner pool
3. **Test:** Trigger multiple workflows, verify parallel execution

### Phase 3: Steam + Bluetooth (Week 3)
1. Implement setup-steam.sh
2. Implement setup-bluetooth.sh
3. Add to archinstall package list
4. Add to homelab-bootstrap.sh
5. **Test:** Verify Steam Remote Play works, Bluetooth devices auto-pair

### Rollback Strategy
- Each phase is independent; can rollback individual components
- Keep existing single GitHub runner until multi-runner validated
- USB boot doesn't affect existing server until tested on fresh install
- All changes in feature branch, merge to dev only after validation

### Data Migration
- No existing data to migrate (new services)
- Existing .env values preserved, new values appended
- Current GitHub runner can coexist with Docker runners initially

## Open Questions

1. **Runner Auto-Scaling:** Should runners auto-scale based on queue depth?
   → **Decision Needed:** Fixed 4 runners initially, add auto-scaling later if needed

2. **Steam Auto-Start:** Should Steam start on boot or on-demand?
   → **Decision Needed:** On-boot via systemd service for Remote Play availability

3. **Bluetooth Pairing Mode:** Auto-trust all discovered devices or explicit list only?
   → **Decision Needed:** Explicit list only (security)
