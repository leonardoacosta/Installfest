# Documentation Index

Complete cross-reference map for Installfest project documentation.

## Quick Navigation

- **[CLAUDE.md](../CLAUDE.md)** - Minimal quick reference for essential commands
- **[This Index](./INDEX.md)** - Complete documentation map
- **[OpenSpec Specs](../openspec/specs/)** - Formal specifications for all capabilities

## Documentation Structure

```
CLAUDE.md (minimal quick reference)
  ↓
docs/INDEX.md (this file - navigation hub)
  ↓
docs/[service]/README.md (detailed documentation)
  ↓
openspec/specs/[capability]/spec.md (formal specifications)
```

## Homelab Infrastructure

### DNS Configuration
**Purpose**: Ad-blocking DNS with reliable fallback

- **Detailed Docs**: [docs/dns/README.md](./dns/README.md)
- **OpenSpec Spec**: [openspec/specs/dns-configuration/spec.md](../openspec/specs/dns-configuration/spec.md)
- **Key Services**: AdGuard Home (172.20.0.5), Cloudflare (1.1.1.1)
- **Quick Start**: Configure DNS servers on all devices
- **Related**: Docker networking, Traefik

### Home Assistant Integration
**Purpose**: Smart home automation hub with device discovery

- **Detailed Docs**: [docs/home-assistant/README.md](./home-assistant/README.md)
- **OpenSpec Spec**: [openspec/specs/home-assistant-integration/spec.md](../openspec/specs/home-assistant-integration/spec.md)
- **Key Features**: HACS, MTR-1, auto-discovery, mobile app
- **Quick Start**: Deploy via docker compose, configure integrations
- **Related**: Traefik, AdGuard, Tailscale

### Coolify PaaS
**Purpose**: Self-hosted platform for deploying applications

- **Detailed Docs**: [docs/coolify/README.md](./coolify/README.md)
- **OpenSpec Spec**: [openspec/specs/coolify-paas/spec.md](../openspec/specs/coolify-paas/spec.md)
- **Quick Start Guide**: [homelab/COOLIFY_QUICKSTART.md](../homelab/COOLIFY_QUICKSTART.md)
- **Architecture**: 4 containers (app, database, redis, websocket)
- **Quick Start**: Run credential generator, deploy services
- **Related**: Docker networking, Traefik, homelab integration

### Deployment Orchestration
**Purpose**: Automated deployment with validation and rollback

- **Detailed Docs**: [docs/deployment/README.md](./deployment/README.md)
- **OpenSpec Spec**: [openspec/specs/deployment-orchestration/spec.md](../openspec/specs/deployment-orchestration/spec.md)
- **Key Scripts**: deploy-ci.sh, deploy-ci-streamlined.sh, monitor-ci.sh
- **10-Phase Pipeline**: Validation → Backup → Deploy → Health Check → Rollback/Success
- **Quick Start**: Set environment variables, run deployment script
- **Related**: GitHub Actions, Docker Compose

### GitHub Actions Workflows
**Purpose**: CI/CD automation with self-hosted runner

- **Detailed Docs**: [docs/github-actions/README.md](./github-actions/README.md)
- **OpenSpec Spec**: [openspec/specs/github-actions-workflows/spec.md](../openspec/specs/github-actions-workflows/spec.md)
- **Workflows**: deploy-homelab.yml, monitor-homelab.yml
- **Triggers**: Push to dev, scheduled (30min), manual dispatch
- **Quick Start**: Runner installed at ~/actions-runner
- **Related**: Deployment orchestration, self-hosted runner

### Bluetooth Automation
**Purpose**: Automated Bluetooth device pairing from YAML config

- **OpenSpec Spec**: [openspec/specs/bluetooth-automation/spec.md](../openspec/specs/bluetooth-automation/spec.md)
- **Config File**: homelab/config/bluetooth-devices.yml
- **Setup Script**: homelab/scripts/setup-bluetooth.sh
- **Quick Start**: Configure devices in YAML, run setup script
- **Related**: USB boot automation, systemd

### Claude Agent Management
**Purpose**: Development session tracking and project management

- **OpenSpec Spec**: [openspec/specs/claude-agent-management/spec.md](../openspec/specs/claude-agent-management/spec.md)
- **Access**: http://claude.local
- **Architecture**: Next.js 14, tRPC, Drizzle ORM, SQLite
- **Features**: Project management, session tracking, hook history
- **Related**: Better-T-Stack, Playwright server integration

### Claude Test Failure Integration
**Purpose**: Automatic test failure remediation via Claude Code

- **OpenSpec Spec**: [openspec/specs/claude-test-failure-integration/spec.md](../openspec/specs/claude-test-failure-integration/spec.md)
- **Integration**: Playwright server → Claude agent server
- **Threshold Config**: Configurable failure detection and notification
- **Classification**: NEW, FLAKY, RECURRING, PERSISTENT
- **Related**: Playwright server, Claude agent management

### Multi-Runner Orchestration
**Purpose**: 4 parallel GitHub Actions runners for concurrent workflows

- **OpenSpec Spec**: [openspec/specs/multi-runner-orchestration/spec.md](../openspec/specs/multi-runner-orchestration/spec.md)
- **Compose File**: homelab/compose/runners.yml
- **Runners**: github-runner-1 through github-runner-4
- **Shared Volume**: playwright-reports (test report aggregation)
- **Quick Start**: Generate tokens, deploy via docker compose
- **Related**: GitHub Actions, Playwright server

### Playwright Report Server
**Purpose**: Test report aggregation with failure auto-remediation

- **OpenSpec Spec**: [openspec/specs/playwright-report-server/spec.md](../openspec/specs/playwright-report-server/spec.md)
- **Access**: http://playwright.local
- **Architecture**: Next.js 14, tRPC, Drizzle ORM, SQLite
- **Features**: Report aggregation, failure classification, Claude integration
- **Related**: Multi-runner orchestration, Claude test failure integration

### Steam Gaming Setup
**Purpose**: Headless Steam for Remote Play without desktop

- **OpenSpec Spec**: [openspec/specs/steam-gaming-setup/spec.md](../openspec/specs/steam-gaming-setup/spec.md)
- **Setup Script**: homelab/scripts/setup-steam.sh
- **Systemd Service**: steam-headless.service
- **Ports**: 27031-27037 (Remote Play)
- **Quick Start**: Run setup script, configure first-time login
- **Related**: Systemd, firewall configuration

### USB Boot Automation
**Purpose**: Two-stage automated deployment from USB boot

- **OpenSpec Spec**: [openspec/specs/usb-boot-automation/spec.md](../openspec/specs/usb-boot-automation/spec.md)
- **Stage 1**: run-install.sh (Arch installation)
- **Stage 2**: homelab-bootstrap.sh (homelab deployment)
- **Secrets**: GPG-encrypted .homelab-secrets.env.gpg
- **Creation Script**: create-bootable-usb.sh
- **Quick Start**: Create USB, boot, automated installation
- **Related**: Arch Linux, homelab deployment, GPG encryption

## Mac Development Environment

### Mac Setup Automation
**Purpose**: Automated macOS development environment setup

- **Detailed Docs**: [mac/README.md](../mac/README.md)
- **OpenSpec Spec**: [openspec/specs/mac-development-environment/spec.md](../openspec/specs/mac-development-environment/spec.md)
- **Entry Point**: mac/install.sh
- **Components**: Xcode CLI, Homebrew, dotfiles, system defaults
- **Dotfiles**: Zsh, WezTerm, Starship, Raycast scripts
- **Quick Start**: Run install.sh for complete setup

## Common Tasks

### First-Time Homelab Setup
1. Boot from USB or run install manually
2. Complete setup wizard: `cd homelab && ./homelab.sh`
3. Configure services via web interfaces
4. Set up mobile apps and integrations

### Deploying New Service
1. Add service to appropriate docker-compose file
2. Update documentation: `docs/[service]/README.md`
3. Create OpenSpec spec: `openspec/specs/[capability]/spec.md`
4. Add entry to this INDEX.md
5. Test deployment locally
6. Push to dev branch for CI/CD deployment

### Troubleshooting Service Issues
1. Check container status: `docker compose ps [service]`
2. View logs: `docker compose logs -f [service]`
3. Restart service: `docker compose restart [service]`
4. Consult service documentation in `docs/[service]/README.md`
5. Check OpenSpec spec for expected behavior

### Updating Documentation
1. Edit relevant `docs/[service]/README.md`
2. If behavior changes, create OpenSpec change proposal
3. Update CLAUDE.md if essential commands change
4. Update this INDEX.md if new service added
5. Keep cross-references synchronized

### Running Deployments
**Automated (CI/CD):**
- Push to `dev` branch → automatic deployment

**Manual:**
```bash
cd homelab/scripts
bash deploy-ci-streamlined.sh
```

**Monitoring:**
```bash
bash homelab/scripts/monitor-ci.sh
```

## Documentation Standards

See [openspec/project.md](../openspec/project.md) for:
- Documentation hierarchy (3-tier structure)
- Service documentation template
- Cross-reference linking conventions
- File naming conventions
- Content preservation policy
- Documentation maintenance guidelines

## OpenSpec Workflow

**Creating Change Proposals:**
```bash
openspec list                    # View active changes
openspec list --specs            # View existing specs
# Create proposal in openspec/changes/[change-id]/
openspec validate [id] --strict  # Validate before submission
```

**Applying Changes:**
```bash
openspec show [change-id]        # Review proposal
# Implement changes following tasks.md
openspec archive [change-id]     # Archive after deployment
```

## External Resources

- **OpenSpec Documentation**: openspec/AGENTS.md
- **Project Conventions**: openspec/project.md
- **Traefik Documentation**: https://doc.traefik.io/traefik/
- **Home Assistant Docs**: https://www.home-assistant.io/docs/
- **Docker Compose Docs**: https://docs.docker.com/compose/
- **GitHub Actions Docs**: https://docs.github.com/en/actions

## Getting Help

- **Claude Code**: Ask questions about this repository
- **GitHub Issues**: Report problems or suggest improvements
- **Documentation**: Start with CLAUDE.md, then drill down to detailed docs
- **OpenSpec Specs**: Formal behavioral specifications for each capability

---

**Last Updated**: 2025-12-04
**Maintained By**: OpenSpec documentation standards
