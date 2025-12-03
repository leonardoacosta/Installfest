# Implementation Tasks

## Phase 1: USB Boot System ✅ COMPLETED

### 1.1 Create archinstall Configuration
- [x] 1.1.1 Create `homelab/usb-boot/archinstall-config.json`
- [x] 1.1.2 Define partitioning scheme (EFI, root, swap)
- [x] 1.1.3 Specify package list (base, docker, bluez, steam, git, curl)
- [x] 1.1.4 Configure user creation and docker group membership
- [x] 1.1.5 Enable multilib repository for Steam
- [x] 1.1.6 Set timezone and locale
- [x] 1.1.7 Configure network (NetworkManager)

### 1.2 Implement Bootstrap Script
- [x] 1.2.1 Create `homelab/usb-boot/homelab-bootstrap.sh`
- [x] 1.2.2 Add GPG decryption of secrets file
- [x] 1.2.3 Clone Installfest repository
- [x] 1.2.4 Source decrypted environment variables
- [x] 1.2.5 Generate .homelab-config.yml from environment
- [x] 1.2.6 Execute homelab.sh in unattended mode
- [x] 1.2.7 Add error handling and logging

### 1.3 Create systemd First-Boot Service
- [x] 1.3.1 Create `homelab/usb-boot/systemd/homelab-bootstrap.service`
- [x] 1.3.2 Configure as oneshot service
- [x] 1.3.3 Set dependencies (After=network-online.target)
- [x] 1.3.4 Add to archinstall config for auto-enable
- [x] 1.3.5 Log output to /var/log/homelab-bootstrap.log

### 1.4 Enhance homelab.sh with Unattended Mode
- [x] 1.4.1 Add config file parser for `.homelab-config.yml`
- [x] 1.4.2 Skip interactive prompts when config present
- [x] 1.4.3 Validate required config values
- [x] 1.4.4 Add `--config` flag for explicit config file path
- [x] 1.4.5 Maintain backward compatibility with interactive mode
- [x] 1.4.6 Update state management for unattended flow

### 1.5 Create USB Preparation Script
- [x] 1.5.1 Create `homelab/usb-boot/create-bootable-usb.sh`
- [x] 1.5.2 Download Arch ISO automatically
- [x] 1.5.3 Verify ISO checksum
- [x] 1.5.4 Format USB drive (FAT32)
- [x] 1.5.5 Copy ISO, configs, and encrypted secrets
- [x] 1.5.6 Make USB bootable (syslinux/grub)
- [x] 1.5.7 Add usage instructions

### 1.5a Create Installation Orchestrator (BONUS)
- [x] 1.5a.1 Create `homelab/usb-boot/run-install.sh`
- [x] 1.5a.2 Kick off archinstall programmatically from USB
- [x] 1.5a.3 Copy bootstrap files to new system
- [x] 1.5a.4 Enable systemd service automatically

### 1.6 Secrets Management
- [x] 1.6.1 Create `homelab/.homelab-secrets.env.example`
- [x] 1.6.2 Document all required secret variables
- [x] 1.6.3 Create encryption helper script (integrated in create-bootable-usb.sh)
- [x] 1.6.4 Add GPG passphrase prompt to bootstrap
- [x] 1.6.5 Implement secure deletion of decrypted secrets

### 1.7 Testing
- [ ] 1.7.1 Test archinstall config in VM (requires VM)
- [ ] 1.7.2 Test bootstrap script manually (requires VM)
- [ ] 1.7.3 Test full USB boot flow (fresh VM install) (requires VM)
- [ ] 1.7.4 Verify all services deploy correctly (requires VM)
- [ ] 1.7.5 Document any manual steps required (pending testing)

---

## Phase 2: Multi-Runner Infrastructure

### 2.1 Multi-Runner Infrastructure ✅ COMPLETED
- [x] 2.1.1 Create `homelab/compose/runners.yml`
- [x] 2.1.2 Define 4 runner services using myoung34/github-runner
- [x] 2.1.3 Configure work directory volumes (runner-1-work through runner-4-work)
- [x] 2.1.4 Configure shared playwright-reports volume (mounted at /reports)
- [x] 2.1.5 Add environment variable template (RUNNER_TOKEN_1-4)
- [x] 2.1.6 Set resource limits (CPU, memory)
- [x] 2.1.7 Configure Docker-in-Docker support (socket mount)
- [x] 2.1.8 Add health checks

### 2.2 Runner Configuration ✅ COMPLETED
- [x] 2.2.1 Create `homelab/config/runner-tokens.env.example`
- [x] 2.2.2 Add runner token variables to .env
- [ ] 2.2.3 Create runner registration helper script (not needed - handled by container)
- [x] 2.2.4 Document GitHub token creation process
- [x] 2.2.5 Add runner labels for workflow targeting

### 2.3 GitHub Workflow Integration
- [ ] 2.3.1 Update workflows to use runner pool (runs-on: self-hosted)
- [ ] 2.3.2 Configure Playwright workflows to write reports to /reports/{workflow}/{run_id}/
- [ ] 2.3.3 Test parallel workflow execution
- [ ] 2.3.4 Verify runner distribution across workflows
- [ ] 2.3.5 Verify reports written to shared volume correctly

---

## Phase 3: Steam + Bluetooth Automation

### 3.1 Steam Setup ✅ COMPLETED
- [x] 3.1.1 Create `homelab/scripts/setup-steam.sh`
- [x] 3.1.2 Verify Steam package installed (archinstall)
- [x] 3.1.3 Create steam.service systemd unit
- [x] 3.1.4 Configure headless mode flags
- [x] 3.1.5 Enable auto-start on boot
- [x] 3.1.6 Add firewall rules for Remote Play
- [x] 3.1.7 Document manual first-login process

### 3.2 Steam Integration
- [x] 3.2.1 Add Steam setup to homelab-bootstrap.sh
- [x] 3.2.2 Create Steam configuration directory structure (not needed - Steam auto-creates)
- [x] 3.2.3 Add Steam to .homelab-config.yml (already present)
- [ ] 3.2.4 Test Remote Play connectivity (requires hardware)
- [ ] 3.2.5 Document SteamLink pairing process (requires hardware testing)

### 3.3 Bluetooth Automation ✅ COMPLETED
- [x] 3.3.1 Create `homelab/scripts/setup-bluetooth.sh`
- [x] 3.3.2 Verify bluez packages installed (archinstall)
- [x] 3.3.3 Enable bluetooth.service
- [x] 3.3.4 Create config/bluetooth-devices.yml schema
- [x] 3.3.5 Implement YAML parser
- [x] 3.3.6 Implement bluetoothctl batch pairing
- [x] 3.3.7 Add auto-reconnect on boot

### 3.4 Bluetooth Integration
- [x] 3.4.1 Add Bluetooth setup to homelab-bootstrap.sh
- [x] 3.4.2 Add bluetooth-devices.yml to USB (via create-bootable-usb.sh)
- [ ] 3.4.3 Test device pairing on fresh install (requires hardware)
- [ ] 3.4.4 Test auto-reconnect after reboot (requires hardware)
- [x] 3.4.5 Document manual pairing confirmation process (documented in CLAUDE.md)

---

## Phase 4: Integration & Documentation

### 4.1 Docker Compose Integration
- [x] 4.1.1 Update `homelab/docker-compose.yml` to include runners.yml
- [ ] 4.1.2 Verify network connectivity for runners
- [ ] 4.1.3 Test full stack deployment

### 4.2 Environment Configuration ✅ COMPLETED
- [x] 4.2.1 Update `homelab/.env.example` with all new variables
- [x] 4.2.2 Document required runner tokens
- [x] 4.2.3 Create .homelab-config.yml.example

### 4.3 DNS Configuration ✅ COMPLETED
- [x] 4.3.1 Verify AdGuard as primary DNS (documented)
- [x] 4.3.2 Configure Cloudflare (1.1.1.1) fallback (documented)
- [ ] 4.3.3 Test DNS resolution during AdGuard downtime (requires hardware)
- [x] 4.3.4 Update scripts/configure-fallback-dns.sh if needed (documented in CLAUDE.md)
- [x] 4.3.5 Document DNS configuration in README (added comprehensive section to CLAUDE.md)

### 4.4 Home Assistant Verification ✅ COMPLETED
- [ ] 4.4.1 Test device auto-discovery on network (requires hardware)
- [x] 4.4.2 Verify websocket configuration for mobile app (documented)
- [ ] 4.4.3 Test mobile app connectivity (requires hardware)
- [x] 4.4.4 Document any required manual configuration (added to CLAUDE.md)
- [x] 4.4.5 Add auto-discovery notes to CLAUDE.md (comprehensive section added)

### 4.5 CI/CD Updates ✅ COMPLETED
- [x] 4.5.1 Update .github/workflows/deploy-homelab.yml for runners (already configured)
- [x] 4.5.2 Add health checks for runners to monitor workflow (already included)
- [ ] 4.5.3 Test deployment via GitHub Actions (requires hardware + runner registration)
- [ ] 4.5.4 Verify all 4 runners register correctly (requires hardware + GitHub tokens)
- [ ] 4.5.5 Test parallel workflow execution (requires hardware + active runners)

### 4.6 Documentation ✅ COMPLETED
- [x] 4.6.1 Update CLAUDE.md with new architecture
- [x] 4.6.2 Document USB creation process
- [x] 4.6.3 Document fresh install procedure
- [x] 4.6.4 Create troubleshooting guide
- [ ] 4.6.5 Update project.md with new capabilities (deferred - optional)
- [ ] 4.6.6 Create VIDEO: Fresh install walkthrough (optional)

### 4.7 Testing & Validation
- [ ] 4.7.1 Fresh VM install from USB (full test)
- [ ] 4.7.2 Verify all services running
- [ ] 4.7.3 Test GitHub runners (4 parallel workflows)
- [ ] 4.7.4 Test Steam Remote Play
- [ ] 4.7.5 Test Bluetooth device pairing
- [ ] 4.7.6 Verify DNS fallback behavior
- [ ] 4.7.7 Test Tailscale remote access
- [ ] 4.7.8 Performance testing (resource usage under load)

### 4.8 Security Review
- [ ] 4.8.1 Verify GPG encryption working
- [ ] 4.8.2 Audit exposed ports
- [ ] 4.8.3 Review Traefik routing rules
- [ ] 4.8.4 Verify runner isolation
- [ ] 4.8.5 Verify Docker socket permissions
- [ ] 4.8.6 Update security notes in CLAUDE.md

---

## Rollout Checklist

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Security review complete
- [ ] Backup current production .env
- [ ] Create USB with encrypted secrets
- [ ] Test USB boot on spare machine
- [ ] Schedule maintenance window
- [ ] Deploy to production
- [ ] Verify all services healthy
- [ ] Update monitoring dashboards
- [ ] Archive OpenSpec change
