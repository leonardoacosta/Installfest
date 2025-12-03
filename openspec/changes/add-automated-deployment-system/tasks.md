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

## Phase 2: Multi-Runner + Playwright Server

### 2.1 Multi-Runner Infrastructure
- [ ] 2.1.1 Create `homelab/compose/runners.yml`
- [ ] 2.1.2 Define 4 runner services using myoung34/github-runner
- [ ] 2.1.3 Configure shared volumes (work dirs, reports)
- [ ] 2.1.4 Add environment variable template (RUNNER_TOKEN_1-4)
- [ ] 2.1.5 Set resource limits (CPU, memory)
- [ ] 2.1.6 Configure Docker-in-Docker support
- [ ] 2.1.7 Add health checks

### 2.2 Runner Configuration
- [ ] 2.2.1 Create `homelab/config/runner-tokens.env.example`
- [ ] 2.2.2 Add runner token variables to .env
- [ ] 2.2.3 Create runner registration helper script
- [ ] 2.2.4 Document GitHub token creation process
- [ ] 2.2.5 Add runner labels for workflow targeting

### 2.3 Playwright Report Server - Backend
- [ ] 2.3.1 Create `playwright-server/` project directory
- [ ] 2.3.2 Initialize Node.js project (package.json)
- [ ] 2.3.3 Install dependencies (express, sqlite3, chokidar, cors)
- [ ] 2.3.4 Create SQLite database schema (reports table)
- [ ] 2.3.5 Implement file watcher for /reports directory
- [ ] 2.3.6 Create report metadata parser (HTML parsing)
- [ ] 2.3.7 Implement REST API endpoints:
  - [ ] GET /api/reports (list with filtering)
  - [ ] GET /api/reports/:id (single report metadata)
  - [ ] GET /api/workflows (list unique workflows)
  - [ ] DELETE /api/reports/:id (cleanup)
- [ ] 2.3.8 Add static file serving for report HTML

### 2.4 Playwright Report Server - Frontend
- [ ] 2.4.1 Create React app (Vite + TypeScript)
- [ ] 2.4.2 Implement ReportList component (table with filters)
- [ ] 2.4.3 Implement ReportViewer component (iframe for HTML reports)
- [ ] 2.4.4 Add workflow filter dropdown
- [ ] 2.4.5 Add date range picker
- [ ] 2.4.6 Add search functionality
- [ ] 2.4.7 Implement responsive design
- [ ] 2.4.8 Build production bundle

### 2.5 Playwright Server Docker Integration
- [ ] 2.5.1 Create `homelab/compose/playwright-server.yml`
- [ ] 2.5.2 Define playwright-server service
- [ ] 2.5.3 Configure shared volume with runners
- [ ] 2.5.4 Add Traefik labels (playwright.local)
- [ ] 2.5.5 Create Dockerfile for server
- [ ] 2.5.6 Add environment variables (.env)
- [ ] 2.5.7 Create health check endpoint

### 2.6 GitHub Workflow Integration
- [ ] 2.6.1 Update workflows to use runner pool (runs-on: self-hosted)
- [ ] 2.6.2 Add Playwright report upload step
- [ ] 2.6.3 Configure report output directory structure
- [ ] 2.6.4 Test parallel workflow execution
- [ ] 2.6.5 Verify reports appear in UI

---

## Phase 3: Claude Agent Management Server

### 3.1 Project Setup
- [ ] 3.1.1 Create `claude-agent-server/` project directory
- [ ] 3.1.2 Initialize Node.js + TypeScript project
- [ ] 3.1.3 Install Claude Agent SDK
- [ ] 3.1.4 Install dependencies (express, sqlite3, ws, cors)
- [ ] 3.1.5 Configure TypeScript (strict mode)
- [ ] 3.1.6 Set up project structure (server/, web/, db/)

### 3.2 Database Layer
- [ ] 3.2.1 Create SQLite schema (projects, sessions, hooks tables)
- [ ] 3.2.2 Implement database wrapper class
- [ ] 3.2.3 Add migration system
- [ ] 3.2.4 Create seed data for testing
- [ ] 3.2.5 Add indexes for query performance

### 3.3 Agent Manager
- [ ] 3.3.1 Implement AgentManager class
- [ ] 3.3.2 Create createAgent() method
- [ ] 3.3.3 Create stopAgent() method
- [ ] 3.3.4 Create listAgents() method
- [ ] 3.3.5 Create getAgentLogs() method
- [ ] 3.3.6 Add agent lifecycle event handlers
- [ ] 3.3.7 Implement agent isolation (separate contexts)

### 3.4 Hook Aggregation
- [ ] 3.4.1 Implement HookAggregator class
- [ ] 3.4.2 Register hook listeners with Agent SDK
- [ ] 3.4.3 Capture pre-tool hooks
- [ ] 3.4.4 Capture post-tool hooks
- [ ] 3.4.5 Capture user-prompt-submit hooks
- [ ] 3.4.6 Store hook data in SQLite
- [ ] 3.4.7 Add hook query methods

### 3.5 REST API
- [ ] 3.5.1 Implement /api/projects endpoints (CRUD)
- [ ] 3.5.2 Implement /api/sessions endpoints (create, list, stop)
- [ ] 3.5.3 Implement /api/hooks endpoints (query with filters)
- [ ] 3.5.4 Implement /api/logs/:agentId (streaming)
- [ ] 3.5.5 Add error handling middleware
- [ ] 3.5.6 Add request validation
- [ ] 3.5.7 Add CORS configuration

### 3.6 Frontend Dashboard
- [ ] 3.6.1 Create React app (Vite + TypeScript)
- [ ] 3.6.2 Implement ProjectList component
- [ ] 3.6.3 Implement SessionManager component
- [ ] 3.6.4 Implement HookViewer component (table with filters)
- [ ] 3.6.5 Implement LogStreamer component (WebSocket)
- [ ] 3.6.6 Add project creation form
- [ ] 3.6.7 Add session controls (start/stop buttons)
- [ ] 3.6.8 Build production bundle

### 3.7 Docker Integration
- [ ] 3.7.1 Create `homelab/compose/claude-agent-server.yml`
- [ ] 3.7.2 Define claude-agent-server service
- [ ] 3.7.3 Configure volume for /home/leo/dev/projects/
- [ ] 3.7.4 Add Traefik labels (claude.local)
- [ ] 3.7.5 Create Dockerfile
- [ ] 3.7.6 Add environment variables
- [ ] 3.7.7 Create health check endpoint

### 3.8 Testing
- [ ] 3.8.1 Create 3 test projects in /home/leo/dev/projects/
- [ ] 3.8.2 Start agents via API
- [ ] 3.8.3 Verify hooks captured in SQLite
- [ ] 3.8.4 Test concurrent agent execution
- [ ] 3.8.5 Verify dashboard displays all data
- [ ] 3.8.6 Test agent lifecycle (start/stop/restart)

---

## Phase 4: Steam + Bluetooth Automation

### 4.1 Steam Setup
- [ ] 4.1.1 Create `homelab/scripts/setup-steam.sh`
- [ ] 4.1.2 Verify Steam package installed (archinstall)
- [ ] 4.1.3 Create steam.service systemd unit
- [ ] 4.1.4 Configure headless mode flags
- [ ] 4.1.5 Enable auto-start on boot
- [ ] 4.1.6 Add firewall rules for Remote Play
- [ ] 4.1.7 Document manual first-login process

### 4.2 Steam Integration
- [ ] 4.2.1 Add Steam setup to homelab-bootstrap.sh
- [ ] 4.2.2 Create Steam configuration directory structure
- [ ] 4.2.3 Add Steam to .homelab-config.yml
- [ ] 4.2.4 Test Remote Play connectivity
- [ ] 4.2.5 Document SteamLink pairing process

### 4.3 Bluetooth Automation
- [ ] 4.3.1 Create `homelab/scripts/setup-bluetooth.sh`
- [ ] 4.3.2 Verify bluez packages installed (archinstall)
- [ ] 4.3.3 Enable bluetooth.service
- [ ] 4.3.4 Create config/bluetooth-devices.yml schema
- [ ] 4.3.5 Implement YAML parser
- [ ] 4.3.6 Implement bluetoothctl batch pairing
- [ ] 4.3.7 Add auto-reconnect on boot

### 4.4 Bluetooth Integration
- [ ] 4.4.1 Add Bluetooth setup to homelab-bootstrap.sh
- [ ] 4.4.2 Add bluetooth-devices.yml to USB
- [ ] 4.4.3 Test device pairing on fresh install
- [ ] 4.4.4 Test auto-reconnect after reboot
- [ ] 4.4.5 Document manual pairing confirmation process

---

## Phase 5: Integration & Documentation

### 5.1 Docker Compose Integration
- [ ] 5.1.1 Update `homelab/docker-compose.yml` to include new compose files
- [ ] 5.1.2 Add runners.yml include
- [ ] 5.1.3 Add playwright-server.yml include
- [ ] 5.1.4 Add claude-agent-server.yml include
- [ ] 5.1.5 Verify network connectivity between services
- [ ] 5.1.6 Test full stack deployment

### 5.2 Environment Configuration
- [ ] 5.2.1 Update `homelab/.env.example` with all new variables
- [ ] 5.2.2 Document required runner tokens
- [ ] 5.2.3 Add Playwright server settings
- [ ] 5.2.4 Add Claude Agent server settings
- [ ] 5.2.5 Create .homelab-config.yml.example

### 5.3 DNS Configuration
- [ ] 5.3.1 Verify AdGuard as primary DNS
- [ ] 5.3.2 Configure Cloudflare (1.1.1.1) fallback
- [ ] 5.3.3 Test DNS resolution during AdGuard downtime
- [ ] 5.3.4 Update scripts/configure-fallback-dns.sh if needed
- [ ] 5.3.5 Document DNS configuration in README

### 5.4 Home Assistant Verification
- [ ] 5.4.1 Test device auto-discovery on network
- [ ] 5.4.2 Verify websocket configuration for mobile app
- [ ] 5.4.3 Test mobile app connectivity
- [ ] 5.4.4 Document any required manual configuration
- [ ] 5.4.5 Add auto-discovery notes to CLAUDE.md

### 5.5 CI/CD Updates
- [ ] 5.5.1 Update .github/workflows/deploy-homelab.yml for new services
- [ ] 5.5.2 Add health checks for new services to monitor workflow
- [ ] 5.5.3 Test deployment via GitHub Actions
- [ ] 5.5.4 Verify all 4 runners register correctly
- [ ] 5.5.5 Test parallel workflow execution

### 5.6 Documentation
- [ ] 5.6.1 Update CLAUDE.md with new architecture
- [ ] 5.6.2 Document USB creation process
- [ ] 5.6.3 Document fresh install procedure
- [ ] 5.6.4 Create troubleshooting guide
- [ ] 5.6.5 Document service access URLs
- [ ] 5.6.6 Update project.md with new capabilities
- [ ] 5.6.7 Create VIDEO: Fresh install walkthrough (optional)

### 5.7 Testing & Validation
- [ ] 5.7.1 Fresh VM install from USB (full test)
- [ ] 5.7.2 Verify all services running
- [ ] 5.7.3 Test GitHub runners (4 parallel workflows)
- [ ] 5.7.4 Generate Playwright reports, verify in UI
- [ ] 5.7.5 Create Claude agent sessions, verify hooks
- [ ] 5.7.6 Test Steam Remote Play
- [ ] 5.7.7 Test Bluetooth device pairing
- [ ] 5.7.8 Verify DNS fallback behavior
- [ ] 5.7.9 Test Tailscale remote access
- [ ] 5.7.10 Performance testing (resource usage under load)

### 5.8 Security Review
- [ ] 5.8.1 Verify GPG encryption working
- [ ] 5.8.2 Audit exposed ports
- [ ] 5.8.3 Review Traefik routing rules
- [ ] 5.8.4 Verify runner isolation
- [ ] 5.8.5 Check SQLite file permissions
- [ ] 5.8.6 Update security notes in CLAUDE.md

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
