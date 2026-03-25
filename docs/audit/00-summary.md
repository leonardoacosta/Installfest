# Dotfiles Audit — Master Summary

> 20 agents | 17 domains | 21 output files | Generated: 2026-03-25

---

## Overall Health Assessment


| Domain      | Health       | Top Finding                                                                                       |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------- |
| SSH Mesh    | **CRITICAL** | ED25519 private key (no passphrase) committed to public repo in plaintext                         |
| Secrets/Env | **CRITICAL** | `~/.env` has API keys with world-readable permissions (644); Doppler configured but not installed |
| Sync        | **CRITICAL** | 313 lines of dead code — every path it references was deleted 3 months ago                        |
| Homebrew    | POOR         | Brewfile covers 5.5% of installed formulae; 9 critical CLI tools missing                          |
| WezTerm     | POOR         | Config symlink doesn't exist on macOS; only needed for Windows                                    |
| Karabiner   | POOR         | Only 1 of 22 rules enabled; orphaned config not in symlinks.conf                                  |
| Raycast     | POOR         | 63 scripts where 3-6 would suffice (10x duplication); active copy-paste bugs                      |
| OpenSpec    | POOR         | AGENTS.md deleted but still referenced everywhere; 1 use in 3.5 months                            |
| Docs/Meta   | POOR         | README has 12 factual errors; installation commands fail at step 1                                |
| ZSH         | FAIR         | NVM adds ~320ms to startup (37% of total); 5 referenced tools not installed                       |
| Bootstrap   | FAIR         | `eval` injection risk in symlinks.sh; scripts execute at source time                              |
| Ghostty     | FAIR         | `scrollback-limit=10000` is bytes not lines (~40 lines); missing 14 tmux keybindings              |
| Tmux        | FAIR         | `pbcopy` breaks on Linux (tmux ignores shell aliases); dead TMUX_THEME var                        |
| cmux        | FAIR         | Hardcoded project registry across 7 locations; sleep-based race condition workarounds             |
| LaunchD     | FAIR         | mic-priority agent not loaded (dead); split installation paths                                    |
| Windows     | FAIR         | 3-layer key remapping fragility; WSL2 Arch bootstrap untested                                     |
| Starship    | GOOD         | docker_context bugs (wrong variable, filename-as-extension); dead STARSHIP_THEME env var          |


**Score distribution:** 3 CRITICAL, 6 POOR, 7 FAIR, 1 GOOD

---

## Cross-Domain Patterns

Five patterns emerged independently across multiple auditors:

### 1. Aspirational Configuration

Tools referenced in config files but never installed: Doppler, direnv, mise, bat, eza, fd, neovim, lazygit, thefuck. The repo captures *intent* but actual state has drifted significantly.

### 2. Dead Environment Variables

4+ auditors independently flagged dead theme env vars (`TMUX_THEME`, `STARSHIP_THEME`, `WEZTERM_THEME`, `USE_DOPPLER`). None are consumed by their respective tools.

### 3. Missing Ghostty Keybindings

3 auditors (Ghostty, WezTerm, Tmux) independently flagged that 14 of 20 tmux-forwarding keybindings were never ported from WezTerm to Ghostty during the terminal migration.

### 4. Scattered Project Registry

The project list (oo, tc, tl, mv, ss, cl, co, etc.) is duplicated across 7+ locations: cmux-workspaces.sh, mux-remote.sh, 63 Raycast scripts, CLAUDE.md, open-project.sh dropdown, README.md. They drift independently.

### 5. Security Debt

SSH private key in public repo, world-readable API keys, `eval` in symlinks processing, `source ~/.env` executing arbitrary code, no pre-commit secret scanning, no `HIST_IGNORE_SPACE`.

---

## Top 15 Recommendations (Prioritized, Deduplicated)

### P0 — Security (do immediately)


| #   | Action                                                                                                          | Domain      | Effort   |
| --- | --------------------------------------------------------------------------------------------------------------- | ----------- | -------- |
| 1   | **Rotate SSH key** — key is in git history of public repo. Generate new per-machine keys or adopt Tailscale SSH | SSH Mesh    | 1-2 days |
| 2   | **Fix ~/.env permissions** — `chmod 600 ~/.env` immediately; migrate secrets to Doppler                         | Secrets/Env | 30 min   |
| 3   | **Add pre-commit secret scanning** — prevent future accidental commits                                          | Secrets/Env | 30 min   |


### P1 — Broken Functionality (fix this week)


| #   | Action                                                                                        | Domain       | Effort |
| --- | --------------------------------------------------------------------------------------------- | ------------ | ------ |
| 4   | **Port 14 tmux keybindings to Ghostty** — Cmd+T/W/1-9/D/K missing since WezTerm migration     | Ghostty/Tmux | 1 hour |
| 5   | **Fix scrollback-limit** — remove line or set to 10000000 (currently ~40 lines of scrollback) | Ghostty      | 5 min  |
| 6   | **Add OSC 52 clipboard** — `set -g set-clipboard on` in tmux.conf; fixes Linux copy-mode      | Tmux         | 5 min  |
| 7   | **Install Doppler CLI** — `brew install dopplerhq/cli/doppler`; already configured in .zshenv | Secrets/Env  | 30 min |


### P2 — High-Impact Cleanup (this month)


| #   | Action                                                                                                      | Domain       | Effort   |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------ | -------- |
| 8   | **Adopt mise, remove NVM** — cuts 320ms from shell startup; single tool for all runtimes                    | ZSH/Homebrew | 0.5 days |
| 9   | **Create projects.toml** — single registry consumed by cmux, Raycast generator, and docs                    | cmux/Raycast | 0.5 days |
| 10  | **Regenerate Brewfile** — `brew bundle dump --describe`, curate, add missing CLI tools                      | Homebrew     | 30 min   |
| 11  | **Rewrite README.md** — 12 factual errors, wrong terminal, wrong paths, broken links                        | Docs/Meta    | 1 hour   |
| 12  | **Delete dead code** — sync.sh, OpenSpec refs, dead theme vars, .gitignore homelab cruft, .vscode T3 config | Multiple     | 1 hour   |


### P3 — Strategic Improvements (evaluate)


| #   | Action                                                                                                            | Domain    | Effort   |
| --- | ----------------------------------------------------------------------------------------------------------------- | --------- | -------- |
| 13  | **Evaluate chezmoi** — trial with a subset of configs; would solve symlinks, templating, secrets, drift detection | Bootstrap | 2-3 days |
| 14  | **Enable Tailscale SSH** — eliminates key management entirely; simplifies mesh                                    | SSH Mesh  | 1-2 days |
| 15  | **Add `set -euo pipefail`** to all scripts — standardize error handling                                           | Bootstrap | 1 hour   |


---

## Ambiguity List (Requires Leo's Input)

These were flagged by domain agents as unclear intent. Resolve before implementing fixes.


| #   | Ambiguity                                                                            | Domain      | Options                                                   |
| --- | ------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------- |
| 1   | NVM vs mise — keep NVM, migrate to mise, or use both?                                | ZSH         | Agents unanimously recommend mise                         |
| 2   | WezTerm on macOS — keep as fallback or remove entirely?                              | WezTerm     | Only needed for Windows                                   |
| 3   | Theme env vars — implement the theme-switching mechanism or delete the dead exports? | Secrets/Env | Intent was ahead of ecosystem; consider chezmoi templates |
| 4   | mic-priority — fix and load, or remove?                                              | LaunchD     | Agent was never loaded; script exists                     |
| 5   | Karabiner rules — enable the other 21 rules or remove them?                          | Karabiner   | Only Copy/Paste/Cut currently active                      |
| 6   | iTerm2 shell integration in .zshrc — remove or keep?                                 | ZSH         | iTerm2 IS installed but Ghostty is primary                |
| 7   | direnv — install it or remove references?                                            | Secrets/Env | Referenced in load-tools.zsh but not installed            |
| 8   | OpenSpec — remove entirely or fix broken references?                                 | OpenSpec    | 1 use in 3.5 months; agents recommend removal             |
| 9   | cmux sleep timings — replace with polling loops or accept empirical delays?          | cmux        | Trade-off: robustness vs complexity                       |
| 10  | Arch ↔ macOS tool parity — aim for full parity or accept divergence?                 | Homebrew    | Currently 27% parity                                      |


---

## Ecosystem Adoption Roadmap

Based on the ecosystem comparison (see `ecosystem-comparison.md` for full analysis):

**Week 1 — Security + Quick Wins (3 days)**

- Tailscale SSH (eliminate key management)
- Doppler CLI (replace plaintext secrets)
- mise (replace NVM, cut startup time)
- Delete sync.sh + remove OpenSpec references

**Week 2 — UX Fixes (2 days)**

- Raycast generator from projects.toml
- Brewfile regeneration
- Port Ghostty keybindings + OSC 52 clipboard
- README rewrite

**Week 3 — Evaluate (2 days)**

- Trial chezmoi with a small config subset
- Assess whether it justifies full migration

**If chezmoi proves worthwhile (weeks 4-5):**

- Migrate remaining configs incrementally

**Total: 5 days of quick wins + 2 days evaluation + optional 5-8 days full migration**

---

## File Index

All audit files in `docs/audit/`:


| File                      | Phase | Content                                                                     |
| ------------------------- | ----- | --------------------------------------------------------------------------- |
| `00-summary.md`           | 4     | This file — master synthesis                                                |
| `discovery.md`            | 1     | Full repo inventory (115 files, 86+ tools, 35+ env vars)                    |
| `ecosystem-overview.md`   | 1     | Landscape survey (dotfiles managers, shell frameworks, secrets, remote dev) |
| `ecosystem-comparison.md` | 3     | Pain point mapping, migration matrix, nuclear option assessment             |
| `zsh.md`                  | 2     | Shell config audit                                                          |
| `homebrew.md`             | 2     | Package management audit                                                    |
| `bootstrap.md`            | 2     | Installation scripts audit                                                  |
| `ssh-mesh.md`             | 2     | Network topology + security audit                                           |
| `starship.md`             | 2     | Prompt config audit                                                         |
| `ghostty.md`              | 2     | Primary terminal audit                                                      |
| `wezterm.md`              | 2     | Legacy terminal audit                                                       |
| `tmux.md`                 | 2     | Multiplexer audit                                                           |
| `karabiner.md`            | 2     | Keyboard remapping audit                                                    |
| `cmux.md`                 | 2     | Workspace launcher audit                                                    |
| `raycast.md`              | 2     | Automation scripts audit                                                    |
| `launchd.md`              | 2     | System daemons audit                                                        |
| `windows.md`              | 2     | Cross-platform setup audit                                                  |
| `sync.md`                 | 2     | Config propagation audit                                                    |
| `secrets-env.md`          | 2     | Secrets + env management audit                                              |
| `openspec.md`             | 2     | Change management audit                                                     |
| `docs-meta.md`            | 2     | Documentation + metadata audit                                              |


