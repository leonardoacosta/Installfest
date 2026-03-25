# Ecosystem Comparison

> Maps every significant finding from 17 domain audits to ecosystem solutions.
> Produces an honest, actionable comparison between Leo's custom setup and off-the-shelf tools.
> Generated: 2026-03-25

---

## 1. Pain Point Mapping

Every critical and important finding from the domain audits, mapped to the ecosystem solution that addresses it.

| Pain Point | Domain | Ecosystem Solution | How It Solves It |
|------------|--------|-------------------|------------------|
| SSH private key committed to public repo | SSH Mesh (CRITICAL) | **Tailscale SSH** | Eliminates SSH keys entirely. Auth via identity provider. No keys to leak. |
| `~/.env` world-readable (644) with plaintext API keys | Secrets/Env (CRITICAL) | **chezmoi + age** or **1Password CLI** | age encrypts secrets at rest in the repo; 1Password CLI fetches secrets on demand (never touch disk). |
| `source ~/.env` executes arbitrary code | Secrets/Env (CRITICAL) | **direnv** | `.envrc` files require explicit `direnv allow`; per-directory scoping; no global pollution. |
| Doppler configured but not installed | Secrets/Env (CRITICAL) | **Doppler CLI** (complete adoption) | Install the CLI already declared in env vars. `doppler run --` replaces `source ~/.env`. |
| sync.sh is 313 lines of dead code | Sync (CRITICAL) | **chezmoi external** or **delete it** | chezmoi's `.chezmoiexternal.toml` handles cross-repo config sharing. Or just delete sync.sh -- it serves no function. |
| Brewfile declares 5.5% of installed packages | Homebrew (POOR) | **`brew bundle dump --describe`** + **mise for CLI tools** | Dump actual state, curate it. Use mise for cross-platform CLI tools, leaving Homebrew for casks/fonts/macOS-only. |
| 63 Raycast scripts with 10x duplication | Raycast (POOR) | **Generator script** or **single parameterized script** | A `projects.toml` registry + generator emits all scripts. Or one script with Raycast dropdown arguments replaces 63 files. |
| README has 12+ factual errors | Docs/Meta (POOR) | **chezmoi README template** or **manual rewrite** | chezmoi can template README with actual tool list from config. Simpler: just rewrite it accurately. |
| Missing Ghostty tmux keybindings (14 of 20) | Ghostty/WezTerm/Tmux | **Port from WezTerm config** | Copy the 14 escape sequence keybindings from `wezterm.lua` to `ghostty/config`. No ecosystem tool needed -- just finish the migration. |
| Triple Node.js version conflict (brew + nvm + mise) | Homebrew/ZSH | **mise exclusively** | Remove `brew "node"` and `brew "nvm"`. Remove nvm sourcing from `darwin.zsh`. Use mise for all runtimes. |
| NVM adds ~320ms to shell startup | ZSH | **mise** (or lazy-load NVM) | mise activates in <10ms. Lazy-loading NVM defers the cost. Either eliminates the 37% startup penalty. |
| Shell startup ~830ms (target: <200ms) | ZSH | **zinit Turbo** + **mise** + **remove NVM** | zinit defers plugin loading to after prompt. mise replaces NVM. Combined: sub-200ms achievable. |
| Dead theme env vars (TMUX_THEME, STARSHIP_THEME, WEZTERM_THEME) | Secrets/Env, Starship, Tmux | **Remove them** or **implement theme switching** | Either delete the 4 dead exports, or build the theme-switching mechanism they were meant to support. |
| Karabiner config not in symlinks.conf | Karabiner | **Add to symlinks.conf** | One line: `karabiner/mac_osx_on_rdp.json:$HOME/.config/karabiner/assets/complex_modifications/mac_osx_on_rdp.json`. |
| Only 1 of 22 Karabiner rules enabled | Karabiner | **Enable or delete** | Import the rules the user wants via Karabiner UI, or remove unused rules from the JSON. |
| tmux `pbcopy` breaks on Linux | Tmux | **OSC 52** (`set -g set-clipboard on`) | OSC 52 is the cross-platform clipboard standard. Works over SSH, on macOS and Linux. No `pbcopy`/`xclip` needed. |
| No tmux session persistence | Tmux | **tmux-resurrect** | Single plugin (no TPM needed). Save/restore sessions across reboots. |
| symlinks.sh `eval` security risk | Bootstrap | **chezmoi** or **GNU Stow** | Both eliminate `eval` by using safe, tested symlink mechanisms. |
| No non-interactive/CI bootstrap mode | Bootstrap | **chezmoi init --apply** | One-liner bootstrap with no interactive prompts. Works in CI, Dockerfiles, fresh machines. |
| Inconsistent error handling across scripts | Bootstrap | **chezmoi** or **standardize to `set -euo pipefail`** | chezmoi's apply model is inherently idempotent. If keeping scripts, standardize strict mode. |
| OpenSpec references broken (AGENTS.md deleted) | OpenSpec | **Remove OpenSpec** or **fix references** | For a dotfiles repo, conventional commits are sufficient. Remove the managed blocks from CLAUDE.md and AGENTS.md. |
| .gitignore has 14 patterns for nonexistent homelab dirs | Docs/Meta | **Clean up** | Remove the 14 `radarr/`, `sonarr/`, etc. patterns. They belong to a different repo. |
| .vscode/settings.json configures T3 monorepo tools | Docs/Meta | **Replace or remove** | Settings reference ESLint, Prettier, Tailwind, TypeScript SDK. This repo has zero JS/TS. Remove or replace with shell-relevant settings. |
| WezTerm installed but not configured on macOS | WezTerm | **Uninstall on macOS** | `brew uninstall wezterm@nightly`. Move `wezterm.lua` to `windows/` for reference. |
| mic-priority LaunchAgent not loaded | LaunchD | **Fix or remove** | Either install the symlink and load the agent, or delete the plist and script. |
| Ghostty `scrollback-limit = 10000` (bytes, not lines) | Ghostty | **Remove the line** | Default is 10MB. Current value = ~40 lines of scrollback. Just delete the line. |
| cmux project registry hardcoded in 7 locations | cmux/Raycast | **Single `projects.toml`** | One file consumed by cmux-workspaces.sh, mux-remote.sh, and Raycast generator. |
| `launchctl load` is deprecated | LaunchD/Bootstrap | **`launchctl bootstrap`** | Modern API with better error reporting. Drop-in replacement. |
| Arch Linux install-arch.sh has 27% parity with Brewfile | Homebrew/Bootstrap | **mise for shared CLI tools** | mise manages the same tool versions on both macOS and Arch from `.mise.toml`. |
| Escape sequences duplicated across 4 files | Tmux/Ghostty/WezTerm | **Document in a single reference table** | No code deduplication possible (different config formats), but a reference table prevents drift. |

---

## 2. Migration Feasibility Matrix

| Current Approach | Ecosystem Alternative | Migration Effort | Benefit | Risk | Verdict |
|-----------------|----------------------|:----------------:|---------|------|---------|
| **Manual symlinks.sh** | **chezmoi** | 3-5 days | Idempotent apply, templates, secrets, one-liner bootstrap, cross-platform | Learning curve; must convert all symlinks.conf entries to chezmoi source files; Go template syntax for platform conditionals | **EVALUATE** |
| **Manual symlinks.sh** | **GNU Stow** | 1 day | Drop-in for current symlink pattern; conflict detection; zero learning curve | No templates, no secrets, no cross-platform conditionals | **EVALUATE** |
| **Manual install.sh scripts** | **Ansible** | 5-7 days | Full machine provisioning, idempotent, testable, cross-platform | Massive overkill for personal dotfiles; YAML verbosity; requires Python | **KEEP current** |
| **Manual install.sh scripts** | **chezmoi run_once scripts** | 3-5 days (with chezmoi migration) | Scripts run once per machine, tracked by hash, no re-prompting | Same effort as chezmoi migration above; scripts need conversion to chezmoi conventions | **EVALUATE** (bundled with chezmoi decision) |
| **Homebrew only** | **Homebrew + Nix** | 7-14 days | Exact version pinning, cross-platform parity (macOS + Arch), reproducible | Steep Nix learning curve; community pushback on Nix complexity; fragile nix-darwin ecosystem | **KEEP Homebrew** (add mise instead) |
| **Homebrew only** | **Homebrew + mise** | 0.5 days | Cross-platform CLI tool parity via `.mise.toml`; Homebrew stays for casks/fonts | Minimal risk; mise is already in load-tools.zsh but not installed | **ADOPT** |
| **Manual SSH keys** | **Tailscale SSH** | 1-2 days | Eliminates key management, authorized_keys, sshd hardening. Auth via identity provider. | Requires Tailscale running on all machines; LAN-first probe needs rethinking; cmux-bridge must work with Tailscale SSH | **ADOPT** |
| **`~/.env` plaintext** | **age + chezmoi** | 2-3 days (requires chezmoi) | Secrets encrypted at rest in repo, decrypted at apply time | Requires chezmoi migration; secrets still on disk after apply (but encrypted in repo) | **EVALUATE** (bundled with chezmoi decision) |
| **`~/.env` plaintext** | **1Password CLI (`op`)** | 1 day | Zero disk exposure; secrets fetched on demand from vault | Requires 1Password subscription; slower per-invocation; changes workflow | **EVALUATE** |
| **`~/.env` plaintext** | **Doppler CLI** (complete adoption) | 0.5 days | Already configured in .zshenv; just needs CLI installed + secrets migrated from ~/.env | Internet required for initial fetch; free tier sufficient | **ADOPT** |
| **63 manual Raycast scripts** | **Generator from registry** | 0.5 days | Single `projects.toml` + generator script; eliminates 10x duplication | Must maintain generator script; Raycast re-import after regeneration | **ADOPT** |
| **NVM** | **mise** | 0.5 days | Polyglot (Node, Python, Ruby, Go); faster (<10ms vs ~320ms); env vars + tasks built in | Slightly different UX (`mise use node@20` vs `nvm use 20`); team familiarity | **ADOPT** |
| **No plugin manager** | **zinit** | 1 day | Turbo deferred loading (sub-100ms); automatic plugin updates; structured config | Steeper learning curve than sheldon/antidote; zinit-specific syntax | **EVALUATE** |
| **No plugin manager** | **sheldon** | 0.5 days | Fast (Rust); simple TOML config; easy migration from manual sourcing | No Turbo-equivalent deferred loading; less community adoption than zinit | **EVALUATE** |
| **sync.sh (dead)** | **Delete it** | 5 minutes | Removes 313 lines of dead code, eliminates confusion about two parallel symlink systems | None | **ADOPT** |
| **sync.sh (dead)** | **chezmoi templates** | Part of chezmoi migration | chezmoi handles cross-project config propagation via externals | Same effort as chezmoi migration | **EVALUATE** (bundled with chezmoi decision) |
| **OpenSpec** | **Conventional commits + ADRs** | 0.5 days | Remove broken references, simplify change tracking to git commit messages. ADRs for significant decisions only. | Lose structured spec format (but it is not being used) | **ADOPT** |

### Verdict Summary

| Verdict | Count | Items |
|---------|:-----:|-------|
| **ADOPT** | 7 | mise, Tailscale SSH, Doppler CLI, Raycast generator, delete sync.sh, remove OpenSpec, Homebrew + mise |
| **EVALUATE** | 5 | chezmoi, GNU Stow, 1Password CLI, zinit, sheldon |
| **KEEP** | 2 | Manual scripts (over Ansible), Homebrew (over Nix) |

---

## 3. What Leo's Setup Does Better

An honest assessment of where the custom approach beats off-the-shelf solutions.

### 1. cmux Workspace Launcher Has No Ecosystem Equivalent

The `cmux-workspaces.sh` script (399 lines) creates color-coded, multi-pane dev workspaces across SSH with environment injection for remote Claude Code hooks. No ecosystem tool exists for cmux -- it is a young, Ghostty-based terminal with its own CLI. tmuxinator, tmuxp, and smug all target tmux. The custom script is the only viable approach, and the three-phase architecture (create sequentially, populate in parallel, reorder) is well-engineered.

**What would be lost by migrating:** Nothing can replace this. It must remain custom.

### 2. The Escape Sequence Protocol Is Bespoke and Correct

The 20 custom escape sequences bridging macOS Cmd keys through Ghostty/WezTerm to tmux user-keys is a hand-rolled protocol that no ecosystem tool provides. This solves a real UX problem (browser-like Cmd+T/W/1-9 in tmux) that requires tight coupling between terminal emulator config and tmux config. The dual-tier approach (user-keys for GUI feel + prefix bindings for SSH fallback) is architecturally sound.

**What would be lost by migrating:** There is nothing to migrate to. This protocol is unique to Leo's workflow.

### 3. The Three-Machine SSH Mesh Topology Is Custom by Nature

Mac (workstation) + Homelab (dev server) + CloudPC (Windows/.NET) with smart LAN/Tailscale routing is a topology that no off-the-shelf dotfiles manager handles natively. The `Match host homelab exec "bash -c ..."` probe in the SSH config is a pragmatic optimization (LAN-first, Tailscale fallback) that Tailscale SSH would actually simplify -- but the topology itself requires custom configuration regardless of tooling.

### 4. Cross-Terminal Theme Consistency Intent Is Ahead of Ecosystem

The `.zshenv` theme registry (`TMUX_THEME`, `NVIM_THEME`, `STARSHIP_THEME`, `WEZTERM_THEME`) is dead code today, but the *intent* -- a single place to switch themes across the entire toolchain -- is a problem the ecosystem has not solved. chezmoi templates could implement this (template `starship.toml` with `{{ .theme }}`), but no tool does it out of the box. Leo identified a real gap; the implementation just never shipped.

### 5. Defensive Shell Config Is Better Than Frameworks

The `command -v` guards in `load-tools.zsh` and multi-path plugin search in `load-plugins.zsh` mean the shell never breaks, even when tools are missing. Oh My Zsh would crash. Framework-based approaches assume all components are installed. Leo's approach degrades gracefully, which is correct for a multi-machine setup where not every tool is on every machine.

### 6. Karabiner RDP Mapping Solves a Niche Problem Well

The Karabiner config for Mac-to-Windows RDP remapping, paired with the AHK config for the reverse direction, addresses a workflow (Mac keyboard on Windows CloudPC via Synergy) that has no turnkey solution. The tools are correct; the implementation needs cleanup but the architecture is sound.

### 7. mic-priority Is a Genuine Automation Win

The LaunchAgent + SwitchAudioSource script for automatic microphone priority is a real quality-of-life automation that no ecosystem tool provides. The polling approach is pragmatic (event-driven would require Swift/Rust). If fixed and loaded, this saves daily friction.

---

## 4. What the Ecosystem Solves for Free

Problems Leo is solving manually that have established, battle-tested solutions.

### Cross-Platform Config Templating

**Leo's approach:** Manual `case "$(uname -s)"` checks in `.zshrc`, separate `darwin.zsh` and `linux.zsh` files, no config file templating.

**Ecosystem solution:** chezmoi's Go templates with `.chezmoi.os`, `.chezmoi.arch`, `.chezmoi.hostname`. A single `.zshrc.tmpl` file replaces the platform-split pattern. Example:

```
{{ if eq .chezmoi.os "darwin" }}
eval "$(/opt/homebrew/bin/brew shellenv)"
{{ end }}
```

**What Leo gains:** Eliminates the three-file platform split, handles hostname-specific config (Mac vs Homelab vs CloudPC), and scales to any number of machines without adding files.

### Secret Encryption in Repos

**Leo's approach:** `~/.env` with plaintext API keys (world-readable, sourced via `set -a`), SSH private key in git history.

**Ecosystem solution:** chezmoi + age encrypts individual files in the source repo. `chezmoi apply` decrypts them. 1Password CLI fetches secrets on demand without ever touching disk. Doppler serves project secrets over HTTPS.

**What Leo gains:** Secrets safely committable to version control (age), or never on disk at all (1Password/Doppler). Pre-commit hooks prevent accidental plaintext commits. The SSH key incident could not happen.

### Idempotent Bootstrapping

**Leo's approach:** `install.sh` with interactive `read -p` prompts at every step. No CI/non-interactive mode. Partial idempotency (some scripts check state, some don't).

**Ecosystem solution:** `chezmoi init --apply <repo>` is a single command that bootstraps a machine from zero. Fully idempotent -- running it twice changes nothing. Works in CI, Dockerfiles, and unattended provisioning.

**What Leo gains:** One-command setup for new machines. No manual prompts. Safe to re-run after updates.

### Package Parity Across OS

**Leo's approach:** Separate `homebrew/Brewfile` (macOS, 5.5% coverage) and `scripts/install-arch.sh` (Arch, 27% parity). Two manifests that drift independently.

**Ecosystem solution:** mise's `.mise.toml` defines CLI tool versions for both platforms. One file, installed identically on macOS and Arch. Homebrew handles macOS-only casks and fonts.

**What Leo gains:** A single source of truth for CLI tools across all machines. Adding `bat` to `.mise.toml` installs it everywhere.

### Symlink Management

**Leo's approach:** Custom `symlinks.sh` (157 lines) + `symlinks.conf` (34 lines) with `eval` expansion. No conflict detection, no dry-run, no update detection.

**Ecosystem solution:** GNU Stow (tree-folding algorithm, conflict detection, dry-run) or chezmoi (source state management, diff view, automatic updates).

**What Leo gains:** Conflict detection (stale file at target location), dry-run preview, and automatic handling of adds/removes. Eliminates the `eval` security risk.

### Config Drift Detection

**Leo's approach:** None. No mechanism to verify that deployed configs match the repo. SSH configs are copied once by setup scripts with no validation.

**Ecosystem solution:** `chezmoi verify` checks all managed files against source state. `chezmoi diff` shows exactly what would change. Run periodically or in CI.

**What Leo gains:** Confidence that every machine matches the declared state. Drift is detected before it causes problems.

---

## 5. Recommended Ecosystem Adoptions

Prioritized by impact-to-effort ratio.

| Priority | Tool | Replaces | Migration Path | Estimated Effort |
|:--------:|------|----------|----------------|:----------------:|
| **1** | **Tailscale SSH** | Manual SSH keys + authorized_keys + sshd hardening | 1. Enable Tailscale SSH in admin console. 2. Configure ACLs. 3. Test SSH from each machine. 4. Remove `ssh-mesh/keys/`, setup scripts, authorized_keys management. 5. Keep SSH configs for `ProxyCommand` and `Match` rules if needed. | 1-2 days |
| **2** | **Doppler CLI** | `~/.env` plaintext file | 1. `brew install dopplerhq/cli/doppler`. 2. Add to Brewfile. 3. Migrate `~/.env` secrets to Doppler `homelab/prd` config. 4. Replace `source ~/.env` with `doppler run --` in project scripts. 5. `chmod 600 ~/.env` as interim, then delete. | 0.5 days |
| **3** | **mise** | NVM + brew node + brew nvm | 1. `brew install mise`. 2. Add to Brewfile. 3. `mise use --global node@20 pnpm@latest`. 4. Remove `brew "node"`, `brew "nvm"` from Brewfile. 5. Remove NVM sourcing from `darwin.zsh:32-34`. 6. Add mise to `install-arch.sh` if not present. | 0.5 days |
| **4** | **Raycast generator** | 63 manual scripts | 1. Create `projects.toml` with all projects, tiers, icons. 2. Write `generate-raycast-scripts.sh` (~50 lines). 3. Generate all scripts from registry. 4. Feed same registry to cmux-workspaces.sh. 5. Delete hand-written scripts. | 0.5 days |
| **5** | **Delete sync.sh** | sync.sh (dead code) | `git rm sync.sh && git commit -m "chore: remove dead sync.sh"` | 5 minutes |
| **6** | **Remove OpenSpec** | Broken OpenSpec references | 1. Remove managed blocks from `CLAUDE.md` and `AGENTS.md`. 2. Delete `openspec/` directory. 3. Remove `/openspec:proposal` reference from CLAUDE.md. 4. Use conventional commits for change tracking. | 30 minutes |
| **7** | **OSC 52 clipboard** | `pbcopy` in tmux (Linux-broken) | Add `set -g set-clipboard on` to `tmux.conf`. Both Ghostty and WezTerm support OSC 52. | 5 minutes |
| **8** | **Brewfile regeneration** | Stale 5.5% coverage Brewfile | 1. `brew bundle dump --describe --force --file=Brewfile.actual`. 2. Diff against current Brewfile. 3. Curate: keep wanted, remove unwanted, organize with section headers. | 30 minutes |

**Total estimated effort for all 8 adoptions: 4-6 days.**

---

## 6. Things to Keep As-Is

| Component | Why Keep | Ecosystem Alternative Considered | Why It Falls Short |
|-----------|---------|----------------------------------|-------------------|
| **Zsh** | Default on macOS, POSIX-compatible, massive ecosystem. Cross-platform requirement rules out Fish/Nushell. | Fish, Nushell | Fish is not POSIX-compatible (breaks scripts). Nushell is pre-1.0. |
| **Starship** | Correct tool. Cross-shell, fast (~24ms measured), actively maintained. Already well-configured. | Powerlevel10k, Oh My Posh | p10k on life support. Oh My Posh has no advantage for Zsh-on-Unix. |
| **Ghostty** | Best macOS terminal for this workflow (native Cocoa, GPU-accelerated, 2-5x faster than WezTerm). | Kitty, Alacritty, WezTerm | Kitty less native on macOS. Alacritty has no multiplexing. WezTerm slower and non-native. |
| **tmux** | Decades of ecosystem, cmux-workspaces depends on it, escape sequence protocol invested in, SSH detach/attach essential. | Zellij | Switching to Zellij would require rewriting the escape sequence layer, cmux-workspaces.sh, and Windows AHK chain. Negative ROI. |
| **Karabiner-Elements** | Only macOS tool with `frontmost_application_if` for app-specific keyboard remapping. | BetterTouchTool, Hammerspoon | BTT is paid and overkill for pure remapping. Hammerspoon lacks kernel-level interception. |
| **cmux-workspaces.sh** | No ecosystem equivalent for cmux workspace automation. Custom script is the only option. | tmuxinator, tmuxp, smug | All target tmux, not cmux. Cannot drive cmux workspaces. |
| **launchd** | Native macOS daemon manager. Zero dependencies, survives reboot, proper lifecycle management. | cron, supervisord, Homebrew services | cron deprecated on macOS. supervisord requires Python. Homebrew services is a launchd wrapper (fine, but unnecessary). |
| **Manual plugin sourcing (3 plugins)** | For only 3 plugins, a plugin manager adds complexity without meaningful benefit. The multi-path search pattern is robust. | zinit, sheldon, antidote | Worth evaluating if startup performance becomes a priority, but current 3-plugin count does not justify a manager. |
| **Homebrew for macOS** | Correct tool for GUI apps (casks), fonts, and macOS-specific formulae. Learning curve near zero. | Nix, nix-darwin | Nix learning curve is days-to-weeks. nix-darwin has rough edges for cask management. Hybrid approach (Nix for packages + chezmoi for dotfiles) is trending but not yet proven enough to justify the effort. |
| **Platform split (.zshrc -> darwin.zsh / linux.zsh)** | Clean, readable, debuggable. Each file is short. The `case uname` pattern is universal and requires no external tooling. | chezmoi templates | Templates would merge the files but reduce readability. The current split is only 3 files. Not worth consolidating. |

---

## 7. The "Nuclear Option" Assessment

**What would it look like to rebuild this repo from scratch using modern ecosystem tools?**

### Target Architecture

```
if/                              # chezmoi source directory
  .chezmoi.toml.tmpl             # Machine-specific config (OS, hostname, SSH host)
  .chezmoiexternal.toml          # External deps (git completions, etc.)
  .chezmoiignore                 # Platform-specific ignores
  dot_zshrc.tmpl                 # Templated .zshrc (replaces platform split)
  dot_zshenv.tmpl                # Templated .zshenv (no dead theme vars)
  private_dot_config/
    ghostty/config.tmpl          # Platform-conditional Ghostty config
    tmux/tmux.conf               # Unchanged (already solid)
    tmux/one-hunter-vercel.conf  # Unchanged
    starship/starship.toml       # Unchanged (already good)
  projects.toml                  # Single source of truth for all projects
  .mise.toml                     # Cross-platform CLI tool versions
  run_once_install-packages.sh.tmpl  # Platform-conditional package install
  run_once_install-arch.sh.tmpl  # Arch-specific bootstrap
  run_onchange_raycast.sh.tmpl   # Regenerate Raycast scripts on projects.toml change
  encrypted_private_dot_env.age  # Secrets encrypted with age
  windows/                       # Windows configs (chezmoi doesn't manage Windows directly)
    setup.ps1
    wezterm-windows.lua
    mac-keyboard.ahk
```

### Tool Stack

| Layer | Tool | Replaces |
|-------|------|----------|
| Dotfiles manager | **chezmoi** | symlinks.sh, symlinks.conf, install.sh, sync.sh |
| Secrets | **chezmoi + age** | `~/.env` plaintext, `source ~/.env` |
| Version manager | **mise** | NVM, brew node, brew nvm |
| SSH | **Tailscale SSH** | ssh-mesh/keys/, setup scripts, authorized_keys |
| Package manager (macOS) | **Homebrew** (casks/fonts only) | Current Homebrew (everything) |
| Package manager (CLI) | **mise** | Homebrew formulae for CLI tools |
| Project registry | **projects.toml** | 7 scattered registries |
| Prompt | **Starship** | Starship (unchanged) |
| Terminal | **Ghostty** | Ghostty (unchanged) |
| Multiplexer | **tmux** | tmux (unchanged) |
| Workspace launcher | **cmux-workspaces.sh** | cmux-workspaces.sh (reads projects.toml) |

### Estimated Effort

| Phase | Work | Days |
|-------|------|:----:|
| 1. chezmoi init | Convert symlinks.conf to chezmoi source dir, add templates for platform conditionals | 2 |
| 2. Secrets migration | Generate age key, encrypt ~/.env contents, integrate with chezmoi | 1 |
| 3. mise adoption | Install mise, create .mise.toml, remove NVM/brew node | 0.5 |
| 4. Tailscale SSH | Enable, configure ACLs, remove manual key infrastructure | 1 |
| 5. projects.toml | Create registry, update cmux-workspaces.sh to read it, create Raycast generator | 1 |
| 6. Brewfile regeneration | Dump, curate, organize | 0.5 |
| 7. Cleanup | Remove dead code (sync.sh, OpenSpec, dead theme vars, stale .gitignore), rewrite README | 1 |
| 8. Testing | Verify on Mac, Homelab, CloudPC | 1 |
| **Total** | | **8 days** |

### What Would Be Gained

1. **One-command bootstrap:** `chezmoi init --apply leonardoacosta/if` on any machine.
2. **Encrypted secrets in repo:** No more plaintext API keys. SSH key leak impossible.
3. **Cross-platform parity:** Same CLI tools on macOS and Arch via mise.
4. **Single project registry:** One file, consumed everywhere. Add a project once.
5. **Config drift detection:** `chezmoi verify` catches divergence.
6. **No dead code:** sync.sh, OpenSpec references, dead theme vars, stale .gitignore -- all gone.
7. **Accurate documentation:** README generated from actual state, not a 2024 snapshot.
8. **Sub-200ms shell startup:** mise + no NVM + optional zinit Turbo.

### What Would Be Lost

1. **Simplicity of the current mental model.** The current setup is "just shell scripts." chezmoi adds a new abstraction layer (source state, target state, templates, apply). For a single developer who understands every line, the current model is easier to debug.

2. **Direct file editing.** With chezmoi, you edit files in the source directory (`chezmoi edit`) and apply them. Direct edits to `~/.zshrc` are overwritten on next apply. This changes the workflow.

3. **The learning curve is real.** Go templates are not hard, but they are another thing to learn. The chezmoi documentation is good but extensive. Expect 4-8 hours of reading before being productive.

4. **Some migration friction.** The Windows setup (PowerShell + AHK + WezTerm) does not fit cleanly into chezmoi's model. It would likely remain as manual scripts.

5. **Build-time awareness.** The current "just symlinks" approach means config changes are instant. chezmoi requires `chezmoi apply` after edits to the source dir. This is a minor but real workflow change.

### Verdict on the Nuclear Option

**The incremental approach is better than the nuclear option.**

The 7 ADOPT items in Section 5 deliver 80% of the benefit for 40% of the effort. Tailscale SSH, Doppler CLI, mise, and the Raycast generator can be adopted independently, in any order, without a full-repo rewrite. chezmoi is the right long-term direction, but it should be evaluated after the quick wins are captured.

**Recommended sequence:**
1. **Week 1:** Tailscale SSH + Doppler CLI + mise + delete sync.sh + remove OpenSpec (3 days)
2. **Week 2:** Raycast generator + Brewfile regeneration + Ghostty keybindings + OSC 52 (2 days)
3. **Week 3:** Evaluate chezmoi with a small subset of configs (2 days)
4. **If chezmoi proves worthwhile:** Migrate remaining configs over 1-2 weeks

This captures the security wins (Tailscale SSH, Doppler) immediately, fixes the daily UX issues (mise startup, Raycast duplication) quickly, and defers the biggest migration (chezmoi) until after a trial period confirms it is worth the investment.

---

## Sources

### Dotfiles Managers
- [chezmoi.io -- Why use chezmoi?](https://www.chezmoi.io/why-use-chezmoi/)
- [chezmoi.io -- Comparison table](https://www.chezmoi.io/comparison-table/)
- [chezmoi.io -- age encryption](https://www.chezmoi.io/user-guide/encryption/age/)
- [dotfiles.github.io](https://dotfiles.github.io/)
- [GNU Stow for dotfiles (2025)](https://www.penkin.me/development/tools/productivity/configuration/2025/10/20/my-dotfiles-setup-with-gnu-stow.html)

### Version Management
- [mise.jdx.dev](https://mise.jdx.dev/)
- [Better Stack -- mise vs asdf](https://betterstack.com/community/guides/scaling-nodejs/mise-vs-asdf/)

### SSH & Security
- [Tailscale SSH docs](https://tailscale.com/docs/features/tailscale-ssh)
- [SSH Security Best Practices -- Tailscale](https://tailscale.com/learn/ssh-security-best-practices-protecting-your-remote-access-infrastructure)
- [dotfiles.io -- Secret Management Best Practices](https://dotfiles.io/en/guides/secret-management/)

### Shell & Prompt
- [zinit on GitHub](https://github.com/zdharma-continuum/zinit)
- [sheldon on GitHub](https://github.com/rossmacarthur/sheldon)
- [Starship.rs](https://starship.rs/)

### Terminal
- [Ghostty vs WezTerm 2026](https://scopir.com/posts/ghostty-vs-wezterm-2026/)
- [tmux wiki -- Clipboard (OSC 52)](https://github.com/tmux/tmux/wiki/Clipboard)
- [tmux-resurrect](https://github.com/tmux-plugins/tmux-resurrect)

### Secrets
- [Doppler -- Modernizing Secrets Management 2025](https://www.doppler.com/blog/modernizing-secrets-management-2025)
- [chezmoi + 1Password](https://www.chezmoi.io/user-guide/password-managers/1password/)
- [mikekasberg.com -- Dotfiles Secrets in Chezmoi](https://www.mikekasberg.com/blog/2026/01/31/dotfiles-secrets-in-chezmoi.html)
