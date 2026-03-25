# Secrets & Environment Variable Audit

> Domain: secrets-env | Repo: `/Users/leonardoacosta/dev/if`
> Generated: 2026-03-25
> Health Score: **CRITICAL**

---

## 1. Current Setup

### Environment Variables Exported in `.zshenv` (all shells)

| Variable | Value | Line | Purpose |
|----------|-------|------|---------|
| `USE_DOPPLER` | `true` | 10 | Signals external tools to use Doppler |
| `DOPPLER_PROJECT` | `homelab` | 11 | Default Doppler project |
| `DOPPLER_CONFIG` | `prd` | 12 | Default Doppler environment |
| `DOTFILES` | `$HOME/dev/if` | 15 | Repo location |
| `PATH` | Prepends `~/.claude/bin`, `~/.local/bin` | 18 | User binaries |
| `TMUX_THEME` | `one-hunter-vercel` | 21 | Theme hint (dead -- see Section 6) |
| `NVIM_THEME` | `nord` | 22 | Theme hint (unverified consumer) |
| `STARSHIP_THEME` | `nord` | 23 | Theme hint (dead -- see Section 6) |
| `WEZTERM_THEME` | `nord` | 24 | Theme hint (dead -- see Section 6) |

**Source**: `zsh/.zshenv` (27 lines)

### `.env` Loading Block in `.zshrc`

```zsh
# Lines 9-13 of zsh/.zshrc
if [[ -f "$HOME/.env" ]]; then
  set -a
  source "$HOME/.env"
  set +a
fi
```

This block:
1. Checks if `~/.env` exists
2. Uses `set -a` to auto-export all subsequently defined variables
3. `source`s the file -- which **executes arbitrary shell code**, not just `KEY=VALUE` lines
4. Restores normal behavior with `set +a`

### `.zshenv.local` Override Pattern

```zsh
# Line 27 of zsh/.zshenv
[[ -f ~/.zshenv.local ]] && source ~/.zshenv.local
```

This is a sound pattern for machine-specific overrides. However:
- `~/.zshenv.local` does **not currently exist** on the Mac
- `~/.zshenv.local` is **not in `.gitignore`** (it does not need to be since it lives at `~/.zshenv.local`, not in the repo -- but this is undocumented)

### Doppler Configuration

- `USE_DOPPLER=true`, `DOPPLER_PROJECT=homelab`, `DOPPLER_CONFIG=prd` are exported globally
- **Doppler CLI is NOT installed** on macOS (`which doppler` returns nothing)
- **Doppler is NOT in the Brewfile** (`homebrew/Brewfile` has no `doppler` entry)
- These three environment variables are therefore inert on the Mac -- no tool reads them

---

## 2. Intent Analysis

The setup reveals a developer in transition between three secrets strategies:

| Strategy | Evidence | Status |
|----------|----------|--------|
| **Doppler** (project-wide) | `.zshenv` exports `USE_DOPPLER=true`, `DOPPLER_PROJECT`, `DOPPLER_CONFIG` | **Aspirational** -- CLI not installed, not in Brewfile |
| **`~/.env` file** (local) | `.zshrc` sources `~/.env` with `set -a` | **Active** -- 89-line file with live API keys, world-readable |
| **`.zshenv.local`** (overrides) | `.zshenv` line 27 conditionally sources it | **Unused** -- file does not exist |

The **intended architecture** appears to be: Doppler for project secrets (T3 apps via `doppler run --`), `~/.env` for local/personal API keys, and `.zshenv.local` for machine-specific overrides. In practice, only the `~/.env` file is active, and it carries serious security risks.

---

## 3. Cross-Domain Interactions

### Which domains consume which env vars?

| Env Var | Set In | Actually Consumed By | Notes |
|---------|--------|---------------------|-------|
| `DOTFILES` | `.zshenv:15`, `.zshrc:6` | All zsh files, `scripts/*.sh` | Core path variable. Redundantly set in both files. |
| `USE_DOPPLER` | `.zshenv:10` | **Nothing on this machine** | Doppler CLI not installed |
| `DOPPLER_PROJECT` | `.zshenv:11` | **Nothing on this machine** | Doppler CLI not installed |
| `DOPPLER_CONFIG` | `.zshenv:12` | **Nothing on this machine** | Doppler CLI not installed |
| `TMUX_THEME` | `.zshenv:21` | **Nothing** | tmux hardcodes theme path in `tmux.conf:182` (`source-file ~/.config/tmux/one-hunter-vercel-theme.conf`). Variable is dead. |
| `NVIM_THEME` | `.zshenv:22` | **Unverifiable** | Neovim config is not in this repo. May be consumed by nvim config elsewhere. Cannot confirm or deny. |
| `STARSHIP_THEME` | `.zshenv:23` | **Nothing** | Starship does not recognize this env var. Only `STARSHIP_CONFIG` and `STARSHIP_LOG` are recognized. Dead code. |
| `WEZTERM_THEME` | `.zshenv:24` | **Nothing** | `wezterm.lua` hardcodes `VisiBlue` theme. Never calls `os.getenv("WEZTERM_THEME")`. Dead code. |
| `STARSHIP_CONFIG` | `init-starship.zsh:6` | starship binary | Properly consumed. Points to the correct TOML. |
| `HOMEBREW_PREFIX` | `darwin.zsh` (via `brew shellenv`) | `load-plugins.zsh`, `load-tools.zsh` | Properly consumed across multiple files. |
| `PNPM_HOME` | `darwin.zsh:19`, `linux.zsh:9` | PATH additions | Platform-specific, properly split. |
| `NVM_DIR` | `darwin.zsh:32` | NVM init scripts | Properly consumed. |
| `FZF_*` vars | `load-tools.zsh:31-39` | fzf | Properly consumed, guarded by `command -v`. |
| `~/.env` contents | `~/.env` (89 lines) | **All interactive shells** | Contains `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, and more. Exported to every process spawned from an interactive shell. |

### Secret Propagation Chain

```
~/.env (89 lines, 644 perms, plaintext API keys)
  |
  v  sourced by .zshrc with set -a
  |
  v  exported to EVERY child process of interactive zsh
  |
  +-> tmux sessions
  +-> neovim
  +-> git (and all hooks)
  +-> Node.js/pnpm dev servers
  +-> Claude Code
  +-> docker commands
  +-> ANY program launched from terminal
```

Every process spawned from an interactive shell inherits these API keys in its environment.

---

## 4. Best Practices Audit

### Industry Consensus (2025-2026)

Based on current best practices from [dotfiles.io](https://dotfiles.io/en/guides/secret-management/), [infisical.com](https://infisical.com/blog/secrets-management-best-practices), [Doppler](https://www.doppler.com/blog/modernizing-secrets-management-2025), and [strongdm.com](https://www.strongdm.com/blog/secrets-management):

| Best Practice | This Repo | Status |
|---------------|-----------|--------|
| Never store plaintext secrets in version control | SSH private key is embedded in `setup-cloudpc.ps1` (git-tracked) | **FAIL -- CRITICAL** |
| Encrypt secrets at rest (age, SOPS, or secrets manager) | `~/.env` is plaintext with `644` permissions | **FAIL -- CRITICAL** |
| Use pre-commit hooks to catch accidental secret commits | No pre-commit hook exists | **FAIL** |
| Restrict file permissions on secret files | `~/.env` is world-readable (`644`) | **FAIL** |
| Use a secrets manager for API keys | Doppler configured but not installed; no alternative active | **FAIL** |
| Avoid `source`ing `.env` files (arbitrary code execution) | `.zshrc` does `source ~/.env` | **FAIL** |
| `HIST_IGNORE_SPACE` to prevent secrets in shell history | Not set in `shared.zsh` | **FAIL** |
| Separate secrets from non-secrets | `~/.env` mixes secrets (API keys) with non-secrets (`ENGINEER_NAME`) | **FAIL** |
| Document secret management approach | No documentation exists | **FAIL** |

**Score: 0/9 best practices met.**

### SSH Private Key in Version Control

**File**: `ssh-mesh/scripts/setup-cloudpc.ps1` (lines 14-22)
**Committed in**: `78bc732` on 2026-01-28 (`chore: cleanup automate dir and add ssh-mesh config`)
**Status**: **Git-tracked, pushed to remote**

The full ED25519 private key is embedded as a heredoc string in a PowerShell script that is committed to version control. Even though the key files in `ssh-mesh/keys/` are properly gitignored, the **key material itself is in git history** via `setup-cloudpc.ps1`.

This key authenticates SSH access to **all three machines** (Mac, Homelab, CloudPC) in the mesh. If this repository is ever made public, or if a backup is compromised, all machines are immediately accessible.

**This cannot be fixed by simply editing the file.** The key material is in git history. The key must be **rotated** (new key generated, deployed to all machines, old key removed from `authorized_keys`).

---

## 5. Tool Choices

### Current Stack: Doppler + `~/.env` + `.zshenv.local`

| Tool | Role | Verdict |
|------|------|---------|
| **Doppler** | Project-level secrets for T3 apps | Good choice for multi-project work. But not installed on macOS, not in Brewfile. Ghost configuration. |
| **`~/.env`** | Local API keys | Dangerous. Plaintext, world-readable, `source`d (executes code), no access control. |
| **`.zshenv.local`** | Machine-specific overrides | Good pattern, but unused and undocumented. |

### Alternatives Assessment

| Tool | Strengths | Weaknesses | Fit for This Setup |
|------|-----------|------------|-------------------|
| **Doppler CLI** (current intent) | Centralized, team-friendly, env-var native, free tier for individuals | Cloud-only (no self-hosted), requires internet for initial fetch, CLI must be installed | **Good** -- already chosen for T3 projects. Complete the adoption. |
| **1Password CLI (`op`)** | Zero disk exposure, secrets never touch filesystem, integrates with chezmoi | Requires 1Password subscription, slower per-invocation, not env-var native | **Good alternative** if already a 1Password user. Better for high-security keys (not for bulk env injection). |
| **age + chezmoi** | Encrypted at rest in repo, decrypted at apply time, simple key management | Requires chezmoi adoption (large migration), secrets still touch disk after apply | **Good long-term** but requires dotfiles manager migration. Overkill for current symlink setup. |
| **SOPS** | Per-value encryption in YAML/JSON, meaningful diffs | Adds tooling complexity, better for structured configs than flat env vars | **Overengineered** for personal dotfiles. |
| **direnv** | Per-directory `.envrc` with allowlists, approval mechanism, no global pollution | Not installed (despite being in `load-tools.zsh`), doesn't solve global secret storage | **Complementary** -- good for project-specific vars but doesn't replace a secrets manager. |

### Recommended Stack

1. **Doppler** for all project secrets (T3 apps, homelab services) -- complete the adoption
2. **`~/.zshenv.local`** (chmod 600) for the small number of truly machine-local, non-secret vars
3. **Remove `~/.env`** entirely -- migrate secrets to Doppler, non-secrets to `.zshenv.local`
4. **1Password CLI** as an optional layer for high-value keys (if already a subscriber)

---

## 6. Configuration Quality

### Dead Environment Variables

Four of the five theme variables exported in `.zshenv` are dead code. They consume cognitive overhead (developers expect them to work) and provide no value.

| Variable | Set To | Expected Consumer | Actual Consumer | Status |
|----------|--------|-------------------|-----------------|--------|
| `TMUX_THEME` | `one-hunter-vercel` | tmux | None -- tmux hardcodes `source-file` path | **Dead** |
| `NVIM_THEME` | `nord` | neovim | Unknown -- nvim config not in repo | **Unverifiable** |
| `STARSHIP_THEME` | `nord` | starship | None -- starship has no such env var | **Dead** |
| `WEZTERM_THEME` | `nord` | wezterm | None -- `wezterm.lua` hardcodes `VisiBlue` | **Dead** |

**Impact**: A developer who changes `WEZTERM_THEME="catppuccin"` in `.zshenv` would expect WezTerm to change themes. It would not. This is a maintenance trap.

### Doppler Config Without Doppler

```zsh
export USE_DOPPLER=true       # But doppler is not installed
export DOPPLER_PROJECT=homelab # No tool reads this
export DOPPLER_CONFIG=prd      # No tool reads this
```

These three variables are exported to **every shell session** (including non-interactive scripts and cron jobs via `.zshenv`) despite having no consumer. Worse, `USE_DOPPLER=true` could cause confusion if a tool ever checks for this flag -- it would believe Doppler is available when it is not.

### `.env` File Security

The `~/.env` file has:
- **Permissions**: `644` (world-readable) -- anyone on the system can read it
- **Contents**: Live API keys for OpenAI, Anthropic, ElevenLabs, and potentially more
- **Loading method**: `source` (executes arbitrary code, not just variable assignment)
- **Scope**: Exported to every interactive shell child process
- **Line count**: 89 lines -- far beyond a few needed variables

The `source` command with `set -a` is documented as a [known RCE vector](https://mazinahmed.net/blog/ohmyzsh-dotenv-rce/) in the Oh My Zsh ecosystem. If `~/.env` contains anything beyond `KEY=VALUE` lines (subshells, command substitution, conditionals), it executes. A malicious or corrupted `~/.env` file would execute arbitrary code in every new terminal.

### Redundant DOTFILES Assignment

```zsh
# In .zshenv (line 15):
export DOTFILES="${DOTFILES:-$HOME/dev/if}"

# In .zshrc (line 6):
export DOTFILES="${DOTFILES:-$HOME/dev/if}"
```

The `.zshrc` re-export is defensive but unnecessary -- `.zshenv` is sourced before `.zshrc` for interactive shells. The only case where this helps is if someone sources `.zshrc` without `.zshenv` (e.g., `zsh -f` then manual source), which is an edge case that does not warrant the duplication.

---

## 7. Architecture Assessment

### Layered Secret Architecture (Actual vs Intended)

```
INTENDED:                              ACTUAL:
+-----------------+                    +-----------------+
| Doppler         | <-- project secrets| Doppler         | <-- NOT INSTALLED
|  (per-project)  |                    |  (ghost config) |
+-----------------+                    +-----------------+
        |                                      |
        v                                      v
+-----------------+                    +-----------------+
| ~/.env          | <-- local keys     | ~/.env          | <-- 89 lines, 644, plaintext
|  (machine-only) |                    |  (EVERYTHING)   |    live API keys, world-readable
+-----------------+                    +-----------------+
        |                                      |
        v                                      v
+-----------------+                    +-----------------+
| ~/.zshenv.local | <-- overrides      | ~/.zshenv.local | <-- DOES NOT EXIST
|  (per-machine)  |                    |  (unused)       |
+-----------------+                    +-----------------+
```

The intended three-tier architecture is sound. The actual state is a single flat file containing everything, with no encryption, no access control, and no secrets manager.

### `.zshenv` Scope Problem

`.zshenv` is sourced for **all** zsh invocations -- including non-interactive scripts, cron jobs, and IDE-spawned terminals. The Doppler variables (`USE_DOPPLER=true`, `DOPPLER_PROJECT=homelab`, `DOPPLER_CONFIG=prd`) are exported to all of these contexts.

This means:
- A cron job running a zsh script would have `DOPPLER_PROJECT=homelab` in its environment
- If Doppler is ever installed, a script run via `zsh -c "doppler secrets"` from a project directory would default to the `homelab` project instead of the project it is in
- Any tool that checks `USE_DOPPLER` would believe Doppler is available on a machine where it is not installed

The Doppler variables should be in `~/.zshenv.local` (if Doppler is installed on that machine) or removed entirely until Doppler is actually in use.

---

## 8. Missing Capabilities

| Capability | Impact | Difficulty |
|------------|--------|------------|
| **Secret scanning pre-commit hook** | Would have caught the SSH key in `setup-cloudpc.ps1` before it was committed | Low -- `gitleaks` or `trufflehog` as pre-commit hook |
| **HIST_IGNORE_SPACE** | Space-prefixed commands (e.g., ` export SECRET=...`) currently enter history. Standard security practice to exclude them. | Trivial -- one `setopt` in `shared.zsh` |
| **`~/.env` file permissions enforcement** | No mechanism ensures `~/.env` stays `600`. Any `chmod` or file recreation resets to umask default (`644`). | Low -- add `chmod 600 ~/.env` to `.zshrc` or use a tool |
| **Doppler CLI installation** | Three env vars reference Doppler but it is not installed or in Brewfile | Low -- `brew install dopplerhq/cli/doppler` and add to Brewfile |
| **direnv installation** | `load-tools.zsh` has a `direnv` init block (lines 43-46) but direnv is not installed on macOS, not in Brewfile | Low -- add to Brewfile or remove dead code |
| **Secret rotation documentation** | No documented procedure for rotating the SSH key, API keys, or any other secret | Medium -- document in README or ssh-mesh/README |
| **`.env` format validation** | The `source` pattern executes arbitrary code. No validation that `~/.env` contains only `KEY=VALUE` lines. | Medium -- replace `source` with a parse-only loader |

---

## 9. Redundancies

| Redundancy | Files | Resolution |
|------------|-------|------------|
| `DOTFILES` exported twice | `zsh/.zshenv:15`, `zsh/.zshrc:6` | Remove from `.zshrc` -- `.zshenv` already handles this |
| `TMUX_THEME` export + hardcoded theme path | `zsh/.zshenv:21`, `tmux/tmux.conf` source-file line | Either make tmux read `$TMUX_THEME` dynamically or remove the env var |
| `WEZTERM_THEME` export + hardcoded theme in Lua | `zsh/.zshenv:24`, `wezterm/wezterm.lua` | Either wire `os.getenv("WEZTERM_THEME")` into Lua or remove the env var |
| `STARSHIP_THEME` export (no consumer) | `zsh/.zshenv:23` | Remove -- starship does not read this variable |
| SSH private key in file + embedded in script | `ssh-mesh/keys/id_ed25519`, `ssh-mesh/scripts/setup-cloudpc.ps1:14-22` | Remove from PowerShell script, use file-copy deployment only |
| `~/.env` secrets overlap with intended Doppler use | `~/.env`, `.zshenv` Doppler config | Migrate `~/.env` secrets to Doppler; remove `~/.env` |
| `.env` gitignored twice | `.gitignore:2` and `.gitignore:6` | Remove duplicate line |
| `.gitignore` homelab service dirs (radarr, sonarr, etc.) | `.gitignore:16-31` | These are not in the repo. Gitignore entries for non-existent paths are cruft. They suggest these dirs once existed here or were planned. Clean up. |

---

## 10. Ambiguities

| Ambiguity | Location | Question |
|-----------|----------|----------|
| **`~/.env` purpose** | `zsh/.zshrc:9-13` | Is this file for secrets, development environment variables, or both? It currently contains both (`ENGINEER_NAME` + API keys). The boundary is undefined. |
| **Doppler adoption status** | `zsh/.zshenv:10-12` | Is Doppler actively used on any machine? The homelab? The `.zshenv` config suggests yes, but the Mac has no Doppler CLI. Is the homelab Linux box the intended Doppler machine? |
| **`NVIM_THEME` consumption** | `zsh/.zshenv:22` | Is this read by a neovim configuration outside this repo? Three other theme vars are confirmed dead. This one is unverifiable without examining the nvim config. |
| **`USE_DOPPLER` consumer** | `zsh/.zshenv:10` | What tool checks this flag? Is it a custom convention for project scripts, or an aspirational flag for a future workflow? No consumer was found in this repo or in the other T3 project repos referenced by the global CLAUDE.md. |
| **Homelab service dirs in `.gitignore`** | `.gitignore:16-31` | Why are 14 service configuration directories (radarr, sonarr, jellyseerr, qbittorrent, etc.) in the gitignore of a dotfiles repo? Were these once stored here? Are they planned? This is homelab cruft leaking into a dotfiles repo. |
| **`.zshenv.local` documentation** | `zsh/.zshenv:27` | The pattern exists but is never mentioned in `README.md`, `CLAUDE.md`, or any documentation. A new machine setup would not know to create this file. |
| **`~/.env` vs `.zshenv.local` boundary** | Both files | What goes in `~/.env` vs `.zshenv.local`? Currently `~/.env` has everything and `.zshenv.local` does not exist. The intent is unclear. |

---

## 11. Recommendations

### P0 -- CRITICAL (do immediately)

**C1. Rotate the SSH key.**
The ED25519 private key at `ssh-mesh/scripts/setup-cloudpc.ps1:14-22` is in git history (committed in `78bc732`). It cannot be removed by editing the file -- it persists in history. Generate a new key, deploy to all three machines, remove old key from `authorized_keys`, and add a passphrase.

```bash
ssh-keygen -t ed25519 -C "mesh-2026-03" -f ssh-mesh/keys/id_ed25519
# Deploy to all machines, update authorized_keys
# Consider: git filter-repo to scrub history (only if repo is shared)
```

**C2. Secure `~/.env` immediately.**
```bash
chmod 600 ~/.env
```
This takes 2 seconds and stops world-readable access to live API keys. Not a substitute for migration, but an immediate risk reduction.

**C3. Replace `source ~/.env` with a parse-only loader.**
The `source` command executes arbitrary code. Replace with a safe pattern:

```zsh
# Safe: only processes KEY=VALUE lines, ignores everything else
if [[ -f "$HOME/.env" ]]; then
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    # Strip leading/trailing whitespace
    key="${key## }"
    key="${key%% }"
    value="${value## }"
    value="${value%% }"
    # Only export valid variable names
    [[ "$key" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] && export "$key=$value"
  done < "$HOME/.env"
fi
```

### P1 -- HIGH (this week)

**H1. Install Doppler and add to Brewfile.**
Complete the Doppler adoption that `.zshenv` already declares:
```ruby
# In homebrew/Brewfile
brew "dopplerhq/cli/doppler"
```

**H2. Migrate `~/.env` secrets to Doppler.**
Move API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, etc.) into a Doppler project (e.g., `personal/dev`). Then use `doppler run --` to inject them only when needed, rather than polluting every shell session.

**H3. Add `setopt HIST_IGNORE_SPACE` to `shared.zsh`.**
One line. Prevents space-prefixed commands from entering history. Standard security practice.

**H4. Install a pre-commit secret scanner.**
```bash
brew install gitleaks
# Add to .git/hooks/pre-commit or use pre-commit framework
```

**H5. Remove or wire up dead theme variables.**
Either:
- (a) Delete `TMUX_THEME`, `STARSHIP_THEME`, `WEZTERM_THEME` from `.zshenv` (they do nothing)
- (b) Wire them into their respective tools (make tmux.conf read `$TMUX_THEME`, make wezterm.lua call `os.getenv()`, etc.)

Option (a) is simpler. Option (b) is more useful if you actually want centralized theme switching.

### P2 -- MEDIUM (this month)

**M1. Move Doppler config out of `.zshenv`.**
`USE_DOPPLER`, `DOPPLER_PROJECT`, `DOPPLER_CONFIG` should not be in `.zshenv` (sourced by all shells). Move to `~/.zshenv.local` on machines where Doppler is installed, or set per-project via `.envrc` files (if you install direnv).

**M2. Document the secrets architecture.**
Add a section to `README.md` or create `ssh-mesh/SECURITY.md` documenting:
- Which secrets exist and where they live
- How to rotate the SSH key
- The intended Doppler workflow
- What goes in `.zshenv.local` vs `~/.env` (or nothing, if `~/.env` is eliminated)

**M3. Clean up `.gitignore` homelab cruft.**
Remove the 14 service config directory entries (`radarr/`, `sonarr/`, etc.) that do not exist in the repo. If they are relevant to the homelab project (`~/dev/hl`), they belong in that repo's gitignore.

**M4. Resolve direnv status.**
Either:
- Install direnv (`brew install direnv`, add to Brewfile) and use `.envrc` files for per-project env management
- Remove the direnv init block from `load-tools.zsh:43-46`

Currently it is aspirational dead code, same as the Doppler config.

**M5. Remove `DOTFILES` duplicate from `.zshrc`.**
Line 6 of `.zshrc` redundantly re-exports `DOTFILES`. Remove it; `.zshenv` already handles this for all shell types.

### P3 -- LOW (backlog)

**L1. Consider chezmoi migration.**
The current symlink-based setup works but has no secrets management, no templating, and no cross-machine differentiation. chezmoi with age encryption would solve secrets-in-dotfiles, platform templating, and machine-specific overrides in one tool. This is a large migration but aligns with ecosystem best practices.

**L2. Remove embedded credentials from git history.**
If this repo is ever shared or made public, use `git filter-repo` to scrub `setup-cloudpc.ps1` history. This is only necessary if the SSH key rotation (C1) has been completed.

**L3. Add `umask 077` guard for secret files.**
In `.zshrc`, after sourcing `~/.env` (or its replacement), verify permissions:
```zsh
[[ -f "$HOME/.env" && "$(stat -f %Lp "$HOME/.env")" != "600" ]] && chmod 600 "$HOME/.env"
```

---

## Appendix: Verified File Permissions

| File | Permissions | Expected | Status |
|------|------------|----------|--------|
| `~/.env` | `644` (world-readable) | `600` | **FAIL** |
| `~/.zshenv` | symlink to repo | N/A (symlink) | OK |
| `~/.zshrc` | symlink to repo | N/A (symlink) | OK |
| `~/.zshenv.local` | does not exist | `600` when created | N/A |
| `ssh-mesh/keys/id_ed25519` | gitignored, not tracked | `600` | OK (file-level) |
| `ssh-mesh/scripts/setup-cloudpc.ps1` | `644`, git-tracked | **Should not contain private key** | **FAIL** |

## Appendix: Committed Secrets Inventory

| Secret | File | Line(s) | Git Status | Severity |
|--------|------|---------|------------|----------|
| ED25519 private key | `ssh-mesh/scripts/setup-cloudpc.ps1` | 14-22 | **Tracked, in history** | CRITICAL |
| Tailscale IPs | `ssh-mesh/configs/*.config`, `ssh-mesh/README.md`, `setup-cloudpc.ps1` | Multiple | Tracked | Low (internal IPs, Tailscale-scoped) |
| LAN IPs | `ssh-mesh/configs/mac.config`, `ssh-mesh/README.md` | Multiple | Tracked | Low (private network) |
| Username (`nyaptor`) | `ssh-mesh/configs/*.config`, `wezterm.lua` | Multiple | Tracked | Low (username only) |
| Public key | `ssh-mesh/scripts/setup-cloudpc.ps1:10` | 10 | Tracked | None (public by design) |

**Not in repo but at risk**: `~/.env` containing `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY` (and 86 more lines). This file is properly excluded from version control but is world-readable on disk.

---

## Sources

- [dotfiles.io -- Secret Management Best Practices](https://dotfiles.io/en/guides/secret-management/)
- [infisical.com -- Secrets Management Best Practices 2026](https://infisical.com/blog/secrets-management-best-practices)
- [Doppler -- Modernizing Secrets Management 2025](https://www.doppler.com/blog/modernizing-secrets-management-2025)
- [strongdm.com -- What Is Secrets Management? Best Practices for 2026](https://www.strongdm.com/blog/secrets-management)
- [Security Boulevard -- How to set up Doppler](https://securityboulevard.com/2025/09/how-to-set-up-doppler-for-secrets-management-step-by-step-guide/)
- [Darknet.org.uk -- Doppler CLI Streamlined Secrets Management](https://www.darknet.org.uk/2025/05/doppler-cli-streamlined-secrets-management-for-devops/)
- [cyberalternatives.com -- Doppler vs 1Password Business 2026](https://www.cyberalternatives.com/doppler-alternatives/vs-1password-business)
- [apptension.com -- 1Password vs Vault vs Doppler](https://apptension.com/guides/best-saas-security-and-secrets-management-tools-1password-vs-vault-vs-doppler)
- [chezmoi.io -- age encryption](https://www.chezmoi.io/user-guide/encryption/age/)
- [chezmoi.io -- 1Password integration](https://www.chezmoi.io/user-guide/password-managers/1password/)
- [OhMyZsh dotenv RCE](https://mazinahmed.net/blog/ohmyzsh-dotenv-rce/)
- [freeCodeCamp -- Zsh Configuration Files](https://www.freecodecamp.org/news/how-do-zsh-configuration-files-work/)
- [osxhub.com -- macOS Shell Configuration](https://osxhub.com/macos-shell-configuration-zsh-environment-variables/)
