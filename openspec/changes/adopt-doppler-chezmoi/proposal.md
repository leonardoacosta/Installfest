# Proposal: Adopt Doppler + chezmoi for dotfiles management

## Change ID
`adopt-doppler-chezmoi`

## Summary
Migrate the dotfiles repo from manual symlinks + plaintext secrets to chezmoi (dotfiles manager) + Doppler (secrets management), with dead code removal, SSH key rotation, projects.toml consolidation, and a chezmoi-powered theme switching system.

## Context
- Extends: zsh/.zshenv, zsh/.zshrc, zsh/rc/, zsh/functions/, ghostty/config, tmux/tmux.conf, starship/starship.toml, scripts/symlinks.sh, scripts/symlinks.conf, install.sh
- Related: 2026-02-10-fix-zsh-startup-perf (archived — addressed NVM startup, partially superseded by mise adoption here)
- Audit: docs/audit/00-summary.md (17-domain audit, 2026-03-25)

## Motivation
The 2026-03-25 audit revealed 3 CRITICAL, 6 POOR, 7 FAIR, and 1 GOOD domain across the repo. Root causes cluster into five patterns: aspirational configuration (tools referenced but not installed), dead environment variables, scattered project registries, security debt (SSH key in public repo, world-readable API keys), and incomplete tool migration (WezTerm → Ghostty). Proposal B addresses these by adopting two tools (Doppler, chezmoi) that solve entire categories of problems, plus targeted fixes for the remaining issues.

## Requirements

### Req-1: Dead Code Removal
Remove all dead code identified by the audit: sync.sh (313 lines, every path deleted), OpenSpec references (AGENTS.md deleted but still referenced), WezTerm directory + env var, dead theme env vars (pre-chezmoi — these become live in Req-5), iTerm2 shell integration, direnv references, .gitignore homelab cruft, .vscode T3 monorepo config.

### Req-2: Security Hardening
Rotate compromised SSH keys (script exists at ssh-mesh/scripts/rotate-keys.sh). Merge setup-cloudpc.ps1 into windows/setup.ps1 (remove exposed key source). Install Doppler CLI, migrate ~/.env secrets into Doppler. Fix ~/.env permissions (chmod 600 interim, delete after Doppler migration). Add HIST_IGNORE_SPACE. Add pre-commit secret scanning.

### Req-3: Tool Adoption (mise, Doppler)
Install mise, configure .mise.toml for cross-platform CLI tool versions (Node, pnpm, and any other runtimes). Remove NVM sourcing from darwin.zsh (saves ~320ms startup). Remove brew "node" and brew "nvm" from Brewfile. Install Doppler CLI and add to Brewfile. Regenerate Brewfile from actual installed state and curate.

### Req-4: chezmoi Migration
Convert repo to chezmoi source directory structure. Replace scripts/symlinks.sh + scripts/symlinks.conf with chezmoi-managed files. Convert platform-specific configs to .tmpl files with chezmoi OS conditionals. Target both macOS and Arch Linux from the start. Replace install.sh with `chezmoi init --apply`. Extract cmux scripts from ghostty/ to scripts/.

### Req-5: Theme Switching System
Implement chezmoi data-driven theme switching. Single .chezmoi.toml.tmpl data file defines theme name. Template starship.toml, tmux theme source, and ghostty config to read from chezmoi data. Changing theme = editing one value + `chezmoi apply`.

### Req-6: Project Registry Consolidation
Create projects.toml as single source of truth for all project codes, names, categories, icons, and paths. Write generator script for Raycast scripts. Update cmux-workspaces.sh to read from projects.toml. Delete 60 hand-written Raycast scripts.

### Req-7: Quick Fixes
Fix Ghostty scrollback-limit (remove line or set to 10000000). Port 14 missing tmux keybindings from WezTerm to Ghostty. Add OSC 52 clipboard to tmux (set -g set-clipboard on). Fix Starship docker_context bugs. Add Starship hostname module. Fix mic-priority LaunchAgent (load it, fix paths). Standardize script shebangs and error handling.

### Req-8: Documentation
Rewrite README.md from scratch (12 factual errors). Update CLAUDE.md directory structure. Clean .gitignore. Replace .vscode/settings.json.

## Scope
- **IN**: All 17 audited domains. chezmoi migration for macOS + Arch Linux. Doppler for secrets. mise for runtimes. projects.toml consolidation. Theme switching. All P0-P2 audit recommendations.
- **OUT**: Windows chezmoi management (manual setup.ps1 stays). Tailscale SSH adoption (evaluate later). zinit/sheldon plugin manager (current 3-plugin manual approach is fine). Full chezmoi external for cross-project config (sync.sh replacement deferred).

## Impact
| Area | Change |
|------|--------|
| Repo structure | Converted to chezmoi source directory (dot_config/, dot_zsh/, .tmpl files) |
| Bootstrap | `chezmoi init --apply` replaces install.sh + symlinks.sh |
| Secrets | Doppler replaces ~/.env plaintext |
| Shell startup | ~320ms faster (mise replaces NVM) |
| Project management | Single projects.toml replaces 7 scattered registries |
| Theme switching | One-line change in chezmoi data propagates to all tools |
| SSH | New rotated keys, merged Windows setup script |
| Raycast | Generated from registry, not hand-maintained |

## Risks
| Risk | Mitigation |
|------|-----------|
| chezmoi learning curve (Go templates) | Start with simple files, template only what needs platform conditionals |
| Breaking shell on primary machine | Test each phase incrementally; chezmoi diff before apply |
| Doppler CLI unavailable offline | Keep ~/.env as fallback with `doppler run --fallback-readonly` |
| Arch Linux parity gaps | Template with OS conditionals from day one; test on homelab after each phase |
| In-place migration on main | Commit after each phase; git revert is always available |
