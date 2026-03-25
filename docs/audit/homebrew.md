# Homebrew Domain Audit

> Auditor: adversarial/constructive
> Date: 2026-03-25
> Scope: `homebrew/Brewfile` and its interactions with the broader dotfiles ecosystem
> Health Score: **POOR**

---

## 1. Current Setup

The Brewfile at `/Users/leonardoacosta/dev/if/homebrew/Brewfile` is an 87-line flat list containing:

- **3 taps** (all commented out as redundant: `homebrew/bundle`, `homebrew/cask`, `homebrew/core`)
- **12 formulae** (`azure-cli`, `dotnet`, `hyfetch`, `node`, `nvm`, `pnpm`, `starship`, `tmux`,
  `zsh-autosuggestions`, `zsh-syntax-highlighting`, `stripe`, `postgresql`, `curl`,
  `switchaudio-osx`)
- **22 casks** (14 active, 4 commented out: `adobe-creative-cloud`, `telegram`, `visual-studio-code`,
  `wezterm`, `windows-app`)
- **3 font casks** (`font-geist-mono-nerd-font`, `font-jetbrains-mono-nerd-font`,
  `font-cascadia-mono-nerd-font`)

The Brewfile is consumed by `scripts/brew-install.sh` via `brew bundle install --file=<path>`. The
script includes a `brew bundle check` step to avoid redundant installs and appends an Azure DevOps
CLI extension install.

**Actual system state** (verified via `brew list`): 219 formulae and 33 casks are installed. The
Brewfile declares only 12 formulae and ~17 active casks. This means **94.5% of installed formulae
and ~48% of installed casks are not tracked by the Brewfile**. The Brewfile is a fiction -- it does
not represent the actual state of the machine and cannot reproduce it.

---

## 2. Intent Analysis

The Brewfile appears to have been created as a **snapshot of early essentials** and was never
maintained as the system evolved. Evidence:

1. **Stale commented-out entries** -- WezTerm, VS Code, Telegram, Windows App are all commented out
   but three of them are actually installed (`wezterm@nightly`, `visual-studio-code`, `telegram`,
   `windows-app` per `brew list --cask`). The Brewfile comments suggest they were intentionally
   removed, but reality contradicts this.

2. **Missing everyday tools** -- 13+ tools actively used in shell config (`load-tools.zsh`,
   `shared.zsh`, `cmux-workspaces.sh`) are absent from the Brewfile (detailed in Section 8).

3. **No organizational structure** -- Formulae and casks are mixed without clear sections. Comments
   exist per-line but there are no category headers.

4. **The `brew bundle` workflow is nominally used** but the gap between declared and actual state
   means running `brew bundle install` on a fresh machine would produce a severely broken
   environment missing critical tools.

**Verdict**: The Brewfile's intent is to be a declarative manifest for macOS package management. It
fails at this purpose.

---

## 3. Cross-Domain Interactions

| Brewfile Entry | Depends On / Used By | Fragility |
|---|---|---|
| `brew "starship"` | `zsh/functions/init-starship.zsh`, `starship/starship.toml` | **Low** -- defensive `command -v` guard |
| `brew "tmux"` | `tmux/tmux.conf`, `ghostty/cmux-workspaces.sh` | **Low** -- tmux is stable |
| `brew "zsh-autosuggestions"` | `zsh/functions/load-plugins.zsh` (multi-path search) | **Low** -- graceful fallback |
| `brew "zsh-syntax-highlighting"` | `zsh/functions/load-plugins.zsh` (multi-path search) | **Low** -- graceful fallback |
| `brew "nvm"` | `zsh/rc/darwin.zsh` lines 32-34 (sources nvm.sh) | **HIGH** -- conflicts with mise (see Section 9) |
| `brew "node"` | Runtime for Claude Code, pnpm | **MEDIUM** -- redundant with nvm-managed node |
| `brew "pnpm"` | All T3 projects in `~/dev/` | **Low** -- but could be managed by mise |
| `brew "azure-cli"` | `scripts/brew-install.sh` (DevOps extension) | **Low** |
| `brew "dotnet"` | `zsh/rc/darwin.zsh` line 23 (.NET tools PATH) | **Low** |
| `brew "switchaudio-osx"` | `scripts/mic-priority.sh`, `launchd/mic-priority.plist` | **MEDIUM** -- if missing, mic-priority LaunchAgent fails silently |
| `cask "ghostty"` | `ghostty/config`, `scripts/symlinks.conf`, `cmux-workspaces.sh` | **Low** -- primary terminal |
| `cask "karabiner-elements"` | `karabiner/mac_osx_on_rdp.json` | **Low** |
| `cask "font-geist-mono-nerd-font"` | `ghostty/config` line 5 (font-family = GeistMono Nerd Font Mono) | **HIGH** -- terminal renders with wrong font if missing |
| Missing: `bat` | `load-tools.zsh` line 32 (`FZF_CTRL_T_OPTS` preview), line 59 (alias) | **MEDIUM** -- fzf preview degrades, cat alias absent |
| Missing: `fd` | `load-tools.zsh` lines 36-40 (`FZF_DEFAULT_COMMAND`, `FZF_CTRL_T_COMMAND`) | **MEDIUM** -- fzf falls back to slower `find` |
| Missing: `eza` | `load-tools.zsh` lines 65-70 (aliases ls, ll, la, lt) | **MEDIUM** -- shared.zsh aliases `ll`/`la` provide fallback, but degraded |
| Missing: `lazygit` | `ghostty/cmux-workspaces.sh` line 247 | **HIGH** -- cmux workspace git pane fails |
| Missing: `neovim` | `ghostty/cmux-workspaces.sh` line 227 | **HIGH** -- cmux workspace editor pane fails |

---

## 4. Best Practices Audit

Assessed against [Homebrew Bundle documentation](https://docs.brew.sh/Brew-Bundle-and-Brewfile),
[Brewfile Tips](https://gist.github.com/ChristopherA/a579274536aab36ea9966f301ff14f3f), and
[community patterns](https://amanhimself.dev/blog/automation-with-homebrew-bundle/).

| Best Practice | Status | Detail |
|---|---|---|
| **Declarative completeness** -- Brewfile should install everything needed | FAIL | 13+ critical tools missing; `brew bundle install` on fresh machine = broken environment |
| **Category organization** -- group by taps, formulae (by purpose), casks, fonts, mas | FAIL | Flat dump with no section headers. Formulae and casks interleaved. |
| **Descriptions** -- use `brew bundle dump --describe` or manual comments | PARTIAL | Some entries have comments, some do not. No consistent format. |
| **Commented-out entries cleaned up** -- remove or document with reason | FAIL | 7 commented-out entries with no clear status. Four of the commented-out casks are actually installed. |
| **Taps declared explicitly** -- only non-default taps needed | OK | Default taps correctly commented out. `stripe/stripe-cli` is implicitly tapped via the formula name. |
| **`brew bundle cleanup --force`** -- remove untracked packages | NOT USED | Running this would uninstall 207 formulae and 16 casks. Dangerous given the Brewfile's incompleteness. |
| **Version pinning strategy** -- Homebrew has no lockfile | NOT ADDRESSED | No `HOMEBREW_BUNDLE_NO_UPGRADE` set. No discussion of version strategy. |
| **Layered Brewfiles** -- base + machine-specific | NOT USED | Single Brewfile for all contexts. No separation of work vs personal tools. |
| **`brew bundle dump` for auditing** -- periodic dump to compare | NOT USED | The gap between declared and actual proves this has not been done recently. |

---

## 5. Tool Choices

### Is Homebrew the Right Choice?

**Yes, for this use case.** The ecosystem overview document correctly identifies the tradeoffs. For
a developer managing macOS + Arch Linux dotfiles with a three-machine SSH mesh:

| Criterion | Homebrew | Nix | Verdict |
|---|---|---|---|
| Learning curve | Very low | Very high | Homebrew wins |
| macOS cask support (GUI apps) | Native, excellent | nix-darwin exists but rough edges | Homebrew wins |
| Reproducibility | Poor (no lockfile) | Excellent (byte-for-byte) | Nix wins |
| Cross-platform (macOS + Arch) | macOS only (Linuxbrew exists but rarely used for Arch) | Excellent (same packages on both) | Nix wins |
| CLI tool management | Good but rolling-release | Exact version pinning | Nix wins |
| Time investment | Minutes | Days to weeks | Homebrew wins |
| Community support | Massive | Growing but smaller | Homebrew wins |

**Recommendation**: Keep Homebrew for macOS GUI apps (casks) and fonts. For CLI tools, the current
setup already uses **mise** for language runtimes. A pragmatic evolution would be:

1. **Short term**: Fix the Brewfile to actually declare all installed tools (cost: 30 minutes).
2. **Medium term**: Consider [Devbox](https://www.jetify.com/devbox) or mise for CLI tools that
   need to be consistent across macOS and Arch. This would replace Homebrew formulae for tools like
   `bat`, `eza`, `fd`, `ripgrep`, `fzf`, `lazygit`, `neovim`, `zoxide`, `atuin`, `direnv`,
   `thefuck`. Homebrew would handle only casks, fonts, and macOS-specific formulae.
3. **Long term**: Evaluate Nix with nix-darwin for full reproducibility if the three-machine
   setup grows or if reproducibility pain increases. The [hybrid approach](https://jade.fyi/blog/use-nix-less/)
   (Nix for packages, simpler tools for dotfiles) aligns with ecosystem trends.

Sources:
- [Homebrew vs Nix | Better Stack](https://betterstack.com/community/guides/linux/homebrew-vs-nix/)
- [Nix vs Homebrew | Slant 2026](https://www.slant.co/versus/1593/1674/~nix-package-manager_vs_homebrew)
- [Nix on macOS | willifix.net](https://www.willifix.net/blog/nix-on-macos-the-better-homebrew/)

---

## 6. Configuration Quality

### Brewfile Structure (line-by-line)

| Line(s) | Content | Issue |
|---|---|---|
| 1-3 | Commented-out default taps | Fine -- default taps are auto-included since Homebrew 4.0 |
| 4-5 | `brew "azure-cli"` | OK |
| 6-7 | `brew "dotnet"` | OK, but version not specified. `dotnet` installs latest (.NET 9). If .NET 8 is needed, should be `brew "dotnet@8"`. |
| 8-9 | `brew "hyfetch"` | **Questionable** -- hyfetch is not actually installed (`which hyfetch` = not found, not in `brew list`). Either it was uninstalled after being added to Brewfile or never installed successfully. The tool is transitioning to a Rust rewrite with FastFetch backend; neofetch (its predecessor) IS installed. |
| 10-11 | `brew "node"` | **Redundant** -- nvm is also declared (line 13) and mise is configured in load-tools.zsh. Three competing Node version sources. |
| 12-13 | `brew "nvm"` | **Conflicting** -- nvm via Homebrew is [not officially supported by the nvm project](https://github.com/nvm-sh/nvm?tab=readme-ov-file#important-notes). Additionally, mise (configured in `load-tools.zsh:48-51`) is designed to replace nvm entirely. |
| 14-15 | `brew "pnpm"` | OK, though mise could also manage this |
| 16-17 | `brew "starship"` | OK |
| 18-19 | `brew "tmux"` | OK |
| 20-21 | `brew "zsh-autosuggestions"` | OK |
| 22-23 | `brew "zsh-syntax-highlighting"` | OK |
| 25-26 | `brew "stripe/stripe-cli/stripe"` | OK -- tap is implicit in the formula path |
| 28-29 | `brew "postgresql"` | OK, though `postgresql@17` is what's actually installed (Homebrew aliases `postgresql` to latest) |
| 31-32 | `brew "curl"` | OK -- provides libcurl for building C tools |
| 34-35 | `brew "switchaudio-osx"` | OK -- required by mic-priority LaunchAgent |
| 37-38 | `cask "ghostty"` | OK -- primary terminal |
| 40-41 | `cask "git-credential-manager"` | OK |
| 43-44 | Commented: `adobe-creative-cloud` | Fine if intentionally removed |
| 47-48 | `cask "bruno"` | OK |
| 49-50 | `cask "cursor"` | OK |
| 51-52 | `cask "discord"` | OK |
| 53-54 | `cask "fantastical"` | OK |
| 55-58 | Font casks (3) | OK |
| 59-60 | `cask "gitkraken"` | OK |
| 61-62 | `cask "iina"` | OK |
| 63-64 | `cask "karabiner-elements"` | OK |
| 65-66 | `cask "google-chrome"` | OK |
| 67-68 | `cask "notion"` | OK |
| 69-70 | `cask "obsidian"` | OK |
| 71-72 | `cask "raycast"` | OK |
| 73-74 | `cask "spotify"` | OK |
| 75-76 | `cask "steam"` | OK |
| 77-78 | `cask "superhuman"` | OK |
| 79-80 | `cask "wispr-flow"` | OK |
| 81-82 | Commented: `telegram` | **Stale** -- actually installed per `brew list --cask` |
| 83-84 | Commented: `visual-studio-code` | **Stale** -- actually installed per `brew list --cask` |
| 85-86 | Commented: `wezterm` | **Partially stale** -- `wezterm@nightly` is installed. Transition from WezTerm to Ghostty is NOT complete (see Section 10). |
| 87-88 | Commented: `windows-app` | **Stale** -- actually installed per `brew list --cask` |

### Quality Metrics

- **Accuracy**: 12 formulae declared, 219 installed = **5.5% coverage**
- **Staleness**: 4 of 4 commented-out casks are actually installed = **100% comment inaccuracy**
- **Conflicts**: 3-way Node version conflict (brew node + brew nvm + mise)
- **Organization**: No section headers, no consistent comment format

---

## 7. Architecture Assessment

### Strengths

1. **`scripts/brew-install.sh` uses `brew bundle check` before install** -- avoids unnecessary
   reinstalls. This is a good pattern.
2. **Default taps correctly omitted** -- Homebrew 4.0+ includes `homebrew/core` and `homebrew/cask`
   by default.
3. **Nerd Fonts are tracked** -- essential for Starship and Ghostty rendering.
4. **The `command -v` guards in `load-tools.zsh`** protect against missing Brewfile entries at
   runtime. Shell startup does not break if tools are missing -- it degrades gracefully. This is
   excellent defensive programming, but it masks the Brewfile's incompleteness.

### Weaknesses

1. **The Brewfile is not the source of truth.** It declares a fraction of what's installed. On a
   fresh machine, `brew bundle install` would produce a system missing `bat`, `eza`, `fd`, `fzf`,
   `lazygit`, `neovim`, `zoxide`, `atuin`, `direnv`, `mise`, `thefuck`, `gh`, `jq`, `tree`,
   `pngpaste`, `docker`, `bun`, `btop`, `ffmpeg`, `git`, `deno`, and dozens more.

2. **No `Brewfile.lock.json`** -- Homebrew Bundle can generate a lockfile (`brew bundle install`
   creates one), but it's not tracked in the repo and there's no `.gitignore` entry for it either.
   This means no version pinning and no audit trail.

3. **No `brew bundle cleanup` workflow** -- without cleanup, packages accumulate via manual
   `brew install` and the Brewfile drifts further from reality over time.

4. **Single-file architecture** -- no machine-specific or context-specific Brewfiles. Everything is
   in one file, mixing work tools (`azure-cli`, `stripe`, `dotnet`) with personal apps (`steam`,
   `spotify`, `discord`). Brewfiles support Ruby logic for conditional installs, which is unused.

5. **WezTerm configuration still exists** (`wezterm/wezterm.lua`, 150 lines) and
   `wezterm@nightly` is installed, but WezTerm is commented out of the Brewfile. The
   `symlinks.conf` has WezTerm commented out (line 25). The transition is incomplete.

---

## 8. Missing Capabilities

### Critical Missing Formulae (referenced in shell config, confirmed NOT installed)

These tools are actively referenced in `zsh/functions/load-tools.zsh` or
`ghostty/cmux-workspaces.sh` and are **not installed on this machine** per `which` and
`brew list`:

| Tool | Referenced In | Impact |
|---|---|---|
| `bat` | `load-tools.zsh:32` (fzf preview), `load-tools.zsh:59-61` (cat alias) | fzf file preview broken, `cat` alias absent |
| `eza` | `load-tools.zsh:65-70` (ls/ll/la/lt aliases) | Modern ls replacements absent |
| `fd` | `load-tools.zsh:36-40` (fzf commands) | fzf uses slower `find` fallback |
| `direnv` | `load-tools.zsh:44-46` | Per-directory env not loading |
| `mise` | `load-tools.zsh:49-51` | Polyglot version manager not active |
| `neovim` | `cmux-workspaces.sh:227` | cmux editor pane fails to launch |
| `lazygit` | `cmux-workspaces.sh:247` | cmux git pane fails to launch |
| `thefuck` | `load-tools.zsh:54-56` | Command correction unavailable |
| `tree` | `load-tools.zsh:33` (`FZF_ALT_C_OPTS` preview) | fzf directory preview broken |

### Missing Formulae (installed on system but not in Brewfile)

These are installed (per `brew list`) and actively used, but the Brewfile doesn't declare them:

| Tool | Installed | Used By |
|---|---|---|
| `fzf` | Yes (brew list confirms) | `load-tools.zsh:17-41` -- heavily configured |
| `zoxide` | Yes | `load-tools.zsh:5-8` |
| `atuin` | Yes | `load-tools.zsh:11-14` |
| `ripgrep` | Yes | `load-tools.zsh:73-75` |
| `gh` | Yes | Referenced in `install-arch.sh:33`, implied by Git workflow |
| `jq` | Yes | Referenced in README.md |
| `git` | Yes | Fundamental to entire workflow |
| `pngpaste` | Yes | `raycast-scripts/img.sh:24` |
| `docker` | Yes | Development workflow |
| `bun` | Yes | JS runtime |
| `rust` | Yes | cmux-bridge build |

### Missing Casks (installed but not in Brewfile)

| Cask | Installed | Status in Brewfile |
|---|---|---|
| `telegram` | Yes | Commented out (line 82) |
| `visual-studio-code` | Yes | Commented out (line 84) |
| `wezterm@nightly` | Yes | Commented out as `wezterm` (line 86) |
| `windows-app` | Yes | Commented out (line 88) |
| `iterm2` | Yes | Not in Brewfile at all |
| `cmux` | Yes | Not in Brewfile |
| `hammerspoon` | Yes | Not in Brewfile |
| `tabby` | Yes | Not in Brewfile |
| `orion` | Yes | Not in Brewfile |
| `beekeeper-studio` | Yes | Not in Brewfile |
| `dbeaver-community` | Yes | Not in Brewfile |
| `cyberduck` | Yes | Not in Brewfile |
| `adobe-creative-cloud` | Yes | Commented out (line 44) |
| `codexbar` | Yes | Not in Brewfile |
| `repobar` | Yes | Not in Brewfile |
| `gitkraken-cli` | Yes | Not in Brewfile (only `gitkraken` GUI is declared) |

### Missing Plugin Formulae

| Plugin | Referenced In | In Brewfile |
|---|---|---|
| `zsh-history-substring-search` | `load-plugins.zsh:54-69` | No -- not installed either |

---

## 9. Redundancies

### Critical: Triple Node.js Version Conflict

Three competing mechanisms manage Node.js versions:

1. **`brew "node"`** (Brewfile line 11) -- installs latest Node globally
2. **`brew "nvm"`** (Brewfile line 13) -- Node Version Manager, sourced in `darwin.zsh:33`
3. **`mise activate zsh`** (load-tools.zsh:50) -- polyglot version manager that replaces nvm

The comment in `load-tools.zsh:48` says it explicitly: `# mise (polyglot version manager -
replaces nvm, pyenv, rbenv)`. Yet both nvm AND Homebrew node remain in the Brewfile and `darwin.zsh`
still sources nvm.

**Impact**: nvm is loaded in `darwin.zsh` (sourced before `load-tools.zsh`), then mise activates
after it. Both modify `PATH`. The last one to activate wins for `node` resolution, but the nvm
initialization adds ~200-400ms to shell startup for no benefit.

**Recommendation**: Remove `brew "node"` and `brew "nvm"` from Brewfile. Remove nvm sourcing from
`darwin.zsh:32-34`. Use mise exclusively for Node version management.

### Minor: hyfetch vs neofetch

`brew "hyfetch"` is in the Brewfile (line 9), but `hyfetch` is not installed. `neofetch` IS
installed (per `brew list`). neofetch is archived/unmaintained. hyfetch is its spiritual successor
but is itself transitioning to a Rust rewrite with FastFetch. Neither is in active use based on
config references.

**Recommendation**: Remove `brew "hyfetch"`. If system info display is wanted, install `fastfetch`
instead (actively maintained, faster).

### Minor: Two Database GUIs

Both `beekeeper-studio` and `dbeaver-community` are installed (plus DB Pro installed via
`scripts/dbpro.sh`). Three database GUI tools is likely excessive.

---

## 10. Ambiguities

These items are unclear and require user input. I am flagging them, not guessing.

1. **WezTerm transition status** -- WezTerm is commented out of the Brewfile but `wezterm@nightly`
   is installed, `wezterm/wezterm.lua` (150 lines) still exists, and `windows/wezterm-windows.lua`
   is actively used on the Windows machine. Is WezTerm being kept for Windows only? Should
   `wezterm.lua` be removed from the macOS config? Should `wezterm@nightly` be uninstalled?

2. **iTerm2 presence** -- `iterm2` is installed per `brew list --cask`, and `.zshrc:35` sources
   iTerm2 shell integration. But iTerm2 is nowhere in the Brewfile and Ghostty is the declared
   terminal. Is iTerm2 still used? Should the `.zshrc` iTerm2 integration line be removed?

3. **`brew "dotnet"` version** -- Brewfile installs latest .NET (currently .NET 9). Is a specific
   version needed? `dotnet@8` has a deprecation date of 2026-11-10 for LTS. If .NET 8 LTS is
   required, the Brewfile should say `brew "dotnet@8"`.

4. **`brew "postgresql"` purpose** -- Is this for the `psql` CLI client only, or is the PostgreSQL
   server also used locally? All T3 projects use Neon (cloud Postgres via Doppler). If only the
   client is needed, consider `brew "libpq"` (smaller, client-only).

5. **mise adoption scope** -- `load-tools.zsh` activates mise, but Brewfile still declares `node`,
   `nvm`, `pnpm`, and `dotnet` as Homebrew packages. Which runtimes should mise manage vs Homebrew?
   This decision cascades to `darwin.zsh` (nvm sourcing) and the Arch `install-arch.sh`.

6. **`adobe-creative-cloud`** -- commented out in Brewfile but actually installed per `brew list
   --cask`. Is this intentional (managed outside Brewfile) or should it be uncommented?

7. **Multiple installed tools with no config references** -- `btop`, `ffmpeg`, `mpv`, `deno`,
   `flyctl`, `cocoapods`, `openai-whisper`, `yt-dlp`, `gemini-cli`, `sentry-cli`, `rtk`,
   `media-control`, `mactop`, `nmap`, `tiger-vnc`, etc. are installed but not referenced in any
   dotfiles config. Are these intentionally managed outside the Brewfile, or should they be tracked?

---

## 11. Recommendations

### Critical

1. **Regenerate the Brewfile from current state and curate it.**

   ```bash
   brew bundle dump --file=~/dev/if/homebrew/Brewfile.actual --describe --force
   ```

   Then diff `Brewfile.actual` against `Brewfile`, decide what to keep, and produce a new Brewfile
   that accurately reflects the desired state. This is the single most impactful action.

2. **Add the 9 missing critical CLI tools to the Brewfile.**

   ```ruby
   # === CLI Utilities ===
   brew "bat"          # Better cat with syntax highlighting
   brew "eza"          # Modern ls replacement
   brew "fd"           # Fast find alternative (used by fzf)
   brew "fzf"          # Fuzzy finder
   brew "lazygit"      # Terminal UI for git
   brew "neovim"       # Text editor (used by cmux workspaces)
   brew "tree"         # Directory listing (used by fzf alt-c preview)
   brew "thefuck"      # Command correction
   brew "direnv"       # Per-directory environment variables
   brew "mise"         # Polyglot version manager
   brew "zoxide"       # Smart cd replacement
   brew "atuin"        # Better shell history
   brew "ripgrep"      # Fast grep (rg)
   ```

3. **Resolve the Node.js triple-management conflict.** Remove `brew "node"` and `brew "nvm"` from
   the Brewfile. Remove the nvm sourcing block from `zsh/rc/darwin.zsh:32-34`. Let mise manage
   Node.js versions exclusively.

### Important

4. **Organize the Brewfile with section headers.** Based on
   [community best practices](https://gist.github.com/ChristopherA/a579274536aab36ea9966f301ff14f3f),
   structure as:

   ```ruby
   # === Taps ===
   tap "stripe/stripe-cli"

   # === Shell & Terminal ===
   brew "starship"
   brew "tmux"
   brew "zsh-autosuggestions"
   brew "zsh-syntax-highlighting"
   brew "zsh-history-substring-search"

   # === CLI Utilities ===
   brew "bat"
   brew "eza"
   # ... etc

   # === Language Runtimes ===
   brew "mise"
   brew "pnpm"

   # === Cloud & DevOps ===
   brew "azure-cli"
   brew "stripe/stripe-cli/stripe"

   # === Fonts ===
   cask "font-geist-mono-nerd-font"
   # ... etc

   # === Applications ===
   cask "ghostty"
   cask "cursor"
   # ... etc
   ```

5. **Clean up stale commented-out entries.** Either uncomment (if the cask is installed and wanted)
   or remove entirely. The 4 commented-out casks that are actually installed (`telegram`,
   `visual-studio-code`, `wezterm@nightly`, `windows-app`) should be uncommented or explicitly
   documented with a reason for exclusion.

6. **Add installed-but-untracked tools that are actively referenced.** At minimum: `fzf`, `zoxide`,
   `atuin`, `ripgrep`, `gh`, `jq`, `git`, `pngpaste`, `docker`.

7. **Remove `brew "hyfetch"`** -- not installed, not referenced, transitioning to Rust rewrite.
   Replace with `brew "fastfetch"` if system info display is wanted.

8. **Remove the iTerm2 shell integration line** from `zsh/.zshrc:35`
   (`test -e "${HOME}/.iterm2_shell_integration.zsh" && ...`) unless iTerm2 is still actively used.
   It's a vestige of a previous terminal setup.

### Nice-to-Have

9. **Add `zsh-history-substring-search` to the Brewfile.** `load-plugins.zsh:54-69` tries to load
   it with multi-path fallback. It's not installed on macOS or declared in the Brewfile.

10. **Consider Devbox or mise for cross-platform CLI tool parity.** The Arch `install-arch.sh`
    declares 14 CLI tools that overlap with what should be in the Brewfile. Using mise or Devbox for
    shared CLI tools would create a single source of truth for both platforms, leaving Homebrew for
    macOS-specific packages (casks, fonts, macOS-only formulae like `switchaudio-osx`).

11. **Add a `Brewfile.lock.json` tracking strategy.** Either commit the lockfile for audit purposes
    or add a periodic `brew bundle dump` to a maintenance script.

12. **Consider splitting the Brewfile** into `Brewfile` (essentials) and `Brewfile.personal`
    (entertainment: steam, spotify, discord) to separate concerns.

---

## Appendix: Arch Linux Parity Comparison

Tools in `scripts/install-arch.sh` vs `homebrew/Brewfile`:

| Tool | In install-arch.sh | In Brewfile | Parity |
|---|---|---|---|
| zsh | Yes | No (pre-installed on macOS) | OK -- platform difference |
| zsh-syntax-highlighting | Yes | Yes | OK |
| zsh-autosuggestions | Yes | Yes | OK |
| starship | Yes | Yes | OK |
| fzf | Yes | **No** | MISSING from Brewfile |
| zoxide | Yes | **No** | MISSING from Brewfile |
| atuin | Yes | **No** | MISSING from Brewfile |
| bat | Yes | **No** | MISSING from Brewfile |
| eza | Yes | **No** | MISSING from Brewfile |
| ripgrep | Yes | **No** | MISSING from Brewfile |
| fd | Yes | **No** | MISSING from Brewfile |
| git | Yes | **No** | MISSING from Brewfile (pre-installed via Xcode, but should be explicit) |
| tmux | Yes | Yes | OK |
| neovim | Yes | **No** | MISSING from Brewfile |
| docker | Yes | **No** | MISSING from Brewfile |
| github-cli (gh) | Yes | **No** | MISSING from Brewfile |
| lazygit | Yes | **No** | MISSING from Brewfile |
| nodejs | Yes | Yes (`node`) | OK |
| npm | Yes (with nodejs) | Implicit with node | OK |
| pnpm | Yes | Yes | OK |
| go | Yes | **No** | MISSING from Brewfile (may not be needed on Mac) |
| rust | Yes | **No** | MISSING from Brewfile |
| curl | Yes (`base-devel` includes) | Yes | OK |
| mise | Yes (AUR) | **No** | MISSING from Brewfile |
| git-credential-manager | Yes (AUR) | Yes (cask) | OK |
| bun | Yes (AUR: `bun-bin`) | **No** | MISSING from Brewfile |

**Parity score**: 7 matching / 26 total = **27% parity**. The Arch script is significantly more
complete than the Brewfile for CLI tools.

---

## Sources

- [Homebrew Bundle Documentation](https://docs.brew.sh/Brew-Bundle-and-Brewfile)
- [Brew Bundle Brewfile Tips (ChristopherA)](https://gist.github.com/ChristopherA/a579274536aab36ea9966f301ff14f3f)
- [Automate installing apps with Homebrew Bundle](https://amanhimself.dev/blog/automation-with-homebrew-bundle/)
- [Homebrew vs Nix | Better Stack](https://betterstack.com/community/guides/linux/homebrew-vs-nix/)
- [Nix vs Homebrew | Slant 2026](https://www.slant.co/versus/1593/1674/~nix-package-manager_vs_homebrew)
- [NVM vs Mise | Better Stack](https://betterstack.com/community/guides/scaling-nodejs/nvm-vs-mise/)
- [mise.jdx.dev](https://mise.jdx.dev/)
- [jade.fyi -- Use Nix Less](https://jade.fyi/blog/use-nix-less/)
- [Managing macOS with Brew Bundle](https://www.thushanfernando.com/2022/08/managing-macos-with-brew-bundle-brewfile/)
- [Homebrew 5.0.0 Release Notes](https://brew.sh/2025/11/12/homebrew-5.0.0/)
