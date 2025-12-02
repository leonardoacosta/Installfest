# Design: Automated Homelab Deployment System

## Context

The current homelab setup requires significant manual intervention during initial deployment and rebuilds. With expanding requirements for CI/CD infrastructure (multiple runners), test automation (Playwright reports), and development workflows (Claude Code sessions), we need a comprehensive automated deployment solution.

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
- ✅ Centralized Playwright test report viewing
- ✅ Multi-project Claude Code agent management with hook aggregation
- ✅ Automated Bluetooth and Steam setup
- ✅ Maintain all existing service functionality

### Non-Goals
- ❌ Multi-server orchestration (single machine only)
- ❌ High-availability/clustering (not required for homelab)
- ❌ Automated Steam login (impossible due to Steam Guard)
- ❌ Remote Bluetooth pairing (must be in range)
- ❌ Authentication for Playwright UI (local network only, confirmed by user)

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

**Choice:** myoung34/docker-github-actions-runner image with dynamic compose generation

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
# compose/runners.yml (generated from runner-tokens.env)
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
      - playwright-reports:/reports  # Shared with playwright-server
    networks:
      - homelab
```

### Decision 3: Playwright Report Server Architecture

**Choice:** Node.js/Express backend + SQLite + React SPA frontend

**Why:**
- Lightweight, no need for PostgreSQL/MySQL
- File watcher can detect new reports automatically
- REST API allows future integrations
- React UI provides rich filtering/search
- Traefik handles routing

**Alternatives Considered:**
- Static nginx with directory listing: No search/filtering, poor UX
- Grafana/Prometheus: Wrong tool, designed for metrics not reports
- Off-the-shelf reporting tool: None fit Playwright HTML reports well

**Data Flow:**
```
1. GitHub runner writes report → /reports/{workflow}/{run_id}/
2. File watcher detects new directory
3. Parse index.html metadata (test count, pass/fail, duration)
4. Insert metadata → SQLite (reports.db)
5. React UI queries API → displays report list
6. Click report → serves static HTML from /reports/
```

**Database Schema:**
```sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY,
  workflow TEXT NOT NULL,
  run_id TEXT NOT NULL,
  run_number INTEGER,
  commit_sha TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_tests INTEGER,
  passed INTEGER,
  failed INTEGER,
  skipped INTEGER,
  duration_ms INTEGER,
  report_path TEXT NOT NULL
);
CREATE INDEX idx_workflow_timestamp ON reports(workflow, timestamp DESC);
```

### Decision 4: Claude Agent Management Server

**Choice:** Custom Node.js server using Claude Agent SDK with REST API + React UI

**Why:**
- Claude Agent SDK provides proper multi-agent architecture
- Hooks natively integrate with SDK
- Can run multiple agent instances in single Node process
- SQLite for hook/session persistence
- Better than tmux/screen hacks

**Alternatives Considered:**
- tmux/screen wrapper: Hacky, hard to monitor, no proper API
- Wait for official Claude Code server mode: Unknown timeline, blocks current need
- Jupyter-style notebook: Not designed for this use case

**Architecture:**
```
claude-agent-server/
├── server/
│   ├── agent-manager.ts       # AgentManager class
│   │   - createAgent(projectPath, config)
│   │   - stopAgent(agentId)
│   │   - listAgents()
│   │   - getAgentLogs(agentId)
│   ├── hook-aggregator.ts     # Hook event listener
│   │   - captureHook(agentId, hookType, data)
│   │   - queryHooks(filters)
│   ├── db/
│   │   ├── schema.sql         # Sessions, hooks, projects tables
│   │   └── database.ts        # SQLite wrapper
│   └── api/
│       ├── sessions.ts        # POST/GET/DELETE /api/sessions
│       ├── hooks.ts           # GET /api/hooks?agent=...
│       └── projects.ts        # GET/POST /api/projects
└── web/
    └── dashboard/             # React UI
        ├── ProjectList.tsx    # /home/leo/dev/projects/ browser
        ├── SessionManager.tsx # Start/stop agents
        ├── HookViewer.tsx     # Hook history table
        └── LogStreamer.tsx    # Real-time agent output
```

**Database Schema:**
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  agent_id TEXT UNIQUE NOT NULL,
  status TEXT CHECK(status IN ('running', 'stopped', 'error')),
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  stopped_at DATETIME
);

CREATE TABLE hooks (
  id INTEGER PRIMARY KEY,
  session_id INTEGER REFERENCES sessions(id),
  hook_type TEXT NOT NULL,  -- 'pre-tool', 'post-tool', 'user-prompt-submit'
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  tool_name TEXT,
  data JSON
);
CREATE INDEX idx_hooks_session ON hooks(session_id, timestamp DESC);
```

### Decision 5: Secrets Management - GPG Encryption

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

### Decision 6: Steam - Headless with Systemd Service

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

### Decision 7: Bluetooth - bluetoothctl Scripting

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

### Risk 2: Claude Agent SDK Stability
**Impact:** Breaking changes in SDK could break agent server
**Mitigation:**
- Pin SDK version in package.json
- Test updates in dev environment first
- Fallback: tmux wrapper if SDK unusable

### Risk 3: Multiple Runners Resource Exhaustion
**Impact:** 4 parallel workflows could overwhelm server (CPU, disk, memory)
**Mitigation:**
- Set runner concurrency limits in GitHub
- Monitor resource usage via Glance
- Start with 2 runners, scale to 4 if headroom exists

### Risk 4: archinstall Config Drift
**Impact:** Arch updates may change archinstall JSON schema
**Mitigation:**
- Pin archinstall version in USB creation script
- Test USB boot after major Arch releases
- Keep manual install instructions as backup

### Trade-off: Complexity vs. Automation
**Decision:** Accept increased complexity (6 new services, USB boot orchestration) for fully automated deployment
**Rationale:** One-time setup cost pays off during rebuilds, testing, disaster recovery

## Migration Plan

### Phase 1: USB Boot System (Week 1)
1. Create archinstall config JSON
2. Implement homelab-bootstrap.sh
3. Add unattended mode to homelab.sh
4. Create USB creation script
5. **Test:** Fresh Arch install on VM, verify all services deploy

### Phase 2: Multi-Runner + Playwright (Week 2)
1. Create compose/runners.yml with template generation
2. Implement playwright-server (backend + frontend)
3. Integrate shared volume with runners
4. Update GitHub workflows to use multi-runner pool
5. **Test:** Trigger multiple workflows, verify parallel execution, check reports UI

### Phase 3: Claude Agent Server (Week 3)
1. Set up Node.js project with Claude Agent SDK
2. Implement AgentManager and hook aggregation
3. Create SQLite schema and API endpoints
4. Build React dashboard
5. **Test:** Create 3 test projects, start agents, verify hooks captured

### Phase 4: Steam + Bluetooth (Week 4)
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

1. **Claude Agent Persistence:** Should agent sessions persist across server restarts?
   → **Decision Needed:** Default to ephemeral, add persistence in future if needed

2. **Playwright Report Retention:** How long to keep old reports? (disk space)
   → **Decision Needed:** Start with 30 days, add cleanup job in future

3. **Runner Auto-Scaling:** Should runners auto-scale based on queue depth?
   → **Decision Needed:** Fixed 4 runners initially, add auto-scaling later if needed

4. **Steam Auto-Start:** Should Steam start on boot or on-demand?
   → **Decision Needed:** On-boot via systemd service for Remote Play availability

5. **Bluetooth Pairing Mode:** Auto-trust all discovered devices or explicit list only?
   → **Decision Needed:** Explicit list only (security)
