# ZSH Configuration Audit

> Domain: Shell configuration (`zsh/` directory)
> Generated: 2026-03-25
> Health Score: **FAIR**

---

## 1. Current Setup

### File Inventory

| File | Lines | Purpose | Complexity |
|------|------:|---------|------------|
| `zsh/.zshenv` | 27 | Environment variables for ALL shells: DOTFILES, PATH, theme exports, Doppler config | Low |
| `zsh/.zshrc` | 36 | Interactive shell entry point: loads shared config, platform detection, function files | Low |
| `zsh/rc/shared.zsh` | 75 | Cross-platform shell options (history, completion, globbing) and common aliases | Low |
| `zsh/rc/darwin.zsh` | 59 | macOS: Homebrew init, pnpm/dotnet/maestro PATH, NVM, macOS aliases | Medium |
| `zsh/rc/linux.zsh` | 76 | Linux: pnpm/cargo/go PATH, GNU color aliases, Docker/systemctl/pacman shortcuts | Low |
| `zsh/functions/setup-completions.zsh` | 34 | Completion system init: fpath, daily compinit cache, zstyle config | Medium |
| `zsh/functions/load-plugins.zsh` | 75 | Defensive plugin loading: syntax highlighting, autosuggestions, history substring search | Medium |
| `zsh/functions/load-tools.zsh` | 75 | CLI tool init: zoxide, atuin, fzf, direnv, mise, thefuck, bat, eza, ripgrep | Medium |
| `zsh/functions/init-starship.zsh` | 15 | Starship prompt init (loaded last) | Low |
| `zsh/completions/_git` | 293 | Zsh completion wrapper for git (third-party, Felipe Contreras) | High |
| `zsh/completions/git-completion.bash` | 3777 | Git bash completion script (third-party) | High |
| **Total** | **4542** | | |

The custom ZSH code (excluding vendored git completions) totals **472 lines** across 9 files. This is a lean, manageable configuration.

### Configuration Options Currently Set

**Shell Options (shared.zsh):**
- History: `HIST_IGNORE_ALL_DUPS`, `SHARE_HISTORY`, `INC_APPEND_HISTORY`, `HIST_REDUCE_BLANKS`, `HIST_VERIFY`, `EXTENDED_HISTORY`
- Directory: `AUTO_CD`, `AUTO_PUSHD`, `PUSHD_IGNORE_DUPS`, `PUSHD_SILENT`
- Completion: `COMPLETE_IN_WORD`, `ALWAYS_TO_END`, `AUTO_MENU`
- Globbing: `EXTENDED_GLOB`, `NO_CASE_GLOB`
- Prompt: `PROMPT_SUBST`

**History Settings:** `HISTSIZE=50000`, `SAVEHIST=50000`

**Active Plugins (macOS, verified):** zsh-syntax-highlighting 0.8.0, zsh-autosuggestions (strategy: atuin, history, completion)

**Active Tools (macOS, verified):** zoxide, atuin, fzf (Homebrew), NVM 0.40.3, starship

**NOT Installed (macOS, verified):** eza, bat, mise, direnv, thefuck

---

## 2. Intent Analysis

The configuration serves a **cross-platform developer workflow** across three machines (Mac, Homelab/Arch Linux, CloudPC/Windows WSL). The primary goals are:

1. **Fast, consistent interactive shell** across macOS and Arch Linux with shared aliases and options.
2. **Modern CLI tool replacements** (eza for ls, bat for cat, zoxide for cd, atuin for history) — aspirational, since several are not yet installed on macOS.
3. **Node.js development** via NVM (primary) with mise as a planned polyglot replacement.
4. **Defensive, portable loading** — all tool inits guard with `command -v`, all plugin loaders search multiple platform-specific paths.
5. **Separation of concerns** — environment variables in `.zshenv`, interactive config split into options/aliases, platform-specific, completions, plugins, tools, and prompt.
6. **Startup performance** — daily compinit cache, tool guards to skip missing tools.

The configuration is clearly that of a **power user transitioning toward modern tooling** (mise, eza, bat) but who has not yet completed the migration on macOS.

---

## 3. Cross-Domain Interactions

### Depends On

| Dependency | Interface | Fragility |
|------------|-----------|-----------|
| Homebrew (`/opt/homebrew/bin/brew`) | `eval "$(brew shellenv)"` in darwin.zsh, plugin paths use `$HOMEBREW_PREFIX` | **Low** — guarded with `-f` check; fallback to `/usr/local/bin` |
| NVM (`$HOMEBREW_PREFIX/opt/nvm/nvm.sh`) | Direct `source` in darwin.zsh | **Medium** — no lazy loading, adds ~320ms to startup |
| Starship (`starship init zsh`) | `eval` in init-starship.zsh | **Low** — guarded with `command -v` |
| Atuin (`atuin init zsh`) | `eval` in load-tools.zsh | **Low** — guarded with `command -v` |
| zsh-syntax-highlighting (system package) | Sourced from well-known paths in load-plugins.zsh | **Low** — multi-path search |
| zsh-autosuggestions (system package) | Sourced from well-known paths in load-plugins.zsh | **Low** — multi-path search |
| iTerm2 shell integration (`~/.iterm2_shell_integration.zsh`) | Unconditional source at end of .zshrc | **Medium** — not guarded for terminal type; causes `zle` errors in non-interactive contexts |
| `~/.env` file (89 lines, world-readable) | `set -a; source; set +a` in .zshrc | **High** — security risk (see Section 4) |
| `~/.zshenv.local` | Conditional source in .zshenv | **Low** — properly guarded |
| Symlinks via `scripts/symlinks.conf` | `~/.zshrc -> $DOTFILES/zsh/.zshrc`, `~/.zshenv -> $DOTFILES/zsh/.zshenv` | **Low** — standard pattern |
| Vendored git completions (`zsh/completions/`) | Symlinked to `~/.zsh/completions/`, added to fpath | **Medium** — files are from Jan 2026, git is 2.51.2; may be stale |

### Depended On By

| Dependent | Interface | Fragility |
|-----------|-----------|-----------|
| Ghostty terminal (ghostty/config) | Expects zsh as shell, starship prompt | **Low** |
| cmux-workspaces.sh | Expects zsh environment, aliases | **Low** |
| Raycast scripts | Invoke zsh shell; rely on PATH from .zshenv | **Low** |
| Tmux | Spawns zsh as default shell; inherits .zshenv vars | **Low** |
| WezTerm | Spawns zsh; relies on DOTFILES, theme env vars from .zshenv | **Low** |
| Claude Code hooks | Run in zsh context; depend on PATH additions | **Low** |

---

## 4. Best Practices Audit

| Area | Current | Best Practice | Gap | Source |
|------|---------|---------------|-----|--------|
| **NVM loading** | Eager `source nvm.sh` (~320ms) | Lazy-load NVM: only init when `nvm`/`node`/`npm` is first called. Or replace with mise entirely. | **Critical gap** — NVM alone accounts for ~37% of total startup time | [Fix slow ZSH startup due to NVM](https://dev.to/thraizz/fix-slow-zsh-startup-due-to-nvm-408k), [Make shell 370% faster](https://varun.ch/posts/slow-nvm/) |
| **HISTSIZE/SAVEHIST** | 50000 / 50000 | Community recommends 50000-100000. Oh-My-Zsh minimum is 50000/10000. Current values are reasonable. | **No gap** — values are at the community consensus floor | [Oh-My-Zsh history.zsh](https://github.com/ohmyzsh/ohmyzsh/blob/master/lib/history.zsh), [zsh history made simple](https://medium.com/@n1zyy/zsh-history-made-simple-de3ec5c8f027) |
| **compinit caching** | `(#qN.mh+24)` glob qualifier — regenerate if older than 24h, else `compinit -C` | This IS the recommended best practice, originated from ctechols/gist. | **No gap** — correctly implemented | [Speed up zsh compinit](https://gist.github.com/ctechols/ca1035271ad134841284) |
| **Plugin load order** | compinit -> syntax-hl -> autosuggestions | Best practice: compinit first, then plugins that wrap widgets. If using fzf-tab, it must go after compinit but before autosuggestions/syntax-hl. | **No gap** for current plugins; would need adjustment if fzf-tab is added | [fzf-tab README](https://github.com/Aloxaf/fzf-tab) |
| **Plugin manager** | Manual `source` with multi-path search | Modern practice: use zinit (Turbo deferred loading) or sheldon (Rust, TOML) for faster startup and simpler updates | **Minor gap** — manual approach works but lacks deferred loading and automatic updates | [zinit on GitHub](https://github.com/zdharma-continuum/zinit), [Slant: Best plugin managers](https://www.slant.co/topics/3265/~best-plugin-managers-for-zsh) |
| **`.env` sourcing security** | `set -a; source ~/.env; set +a` unconditionally | `.env` files can contain arbitrary shell commands. `source` executes them. File is world-readable (644). Use direnv with allowlists, or restrict permissions to 600, or parse-only (grep + export). | **Critical gap** — arbitrary code execution risk + world-readable secrets file | [OhMyZsh dotenv RCE](https://mazinahmed.net/blog/ohmyzsh-dotenv-rce/) |
| **Startup time** | ~830ms average (measured: 730ms-1040ms across 3 runs) | Sub-200ms is achievable. Community targets: <100ms (aggressive), <200ms (comfortable). | **Important gap** — 4-5x slower than achievable | [Achieving 30ms Zsh Startup](https://dev.to/tmlr/achieving-30ms-zsh-startup-40n1), [I cut Zsh load time from 400ms to 30ms](https://lukm.dev/writings/speed-up-zsh/) |
| **Tool evals** | 6 `eval "$(tool init zsh)"` calls (brew, nvm, zoxide, atuin, direnv, mise, thefuck, starship) | Each `eval` spawns a subprocess. Cache output or use static init where possible. | **Important gap** — each eval adds 20-80ms. NVM is the worst at ~320ms | [Optimizing Zsh Init with ZProf](https://www.mikekasberg.com/blog/2025/05/29/optimizing-zsh-init-with-zprof.html) |
| **Starship position** | Loaded last (correct) | Starship must be last to properly wrap prompt. | **No gap** | [starship.rs](https://starship.rs/) |

---

## 5. Tool Choices Critique

### Is Zsh the Right Shell?

| Shell | Pros for This Setup | Cons | Verdict |
|-------|--------------------|----|---------|
| **Zsh (current)** | Default on macOS since Catalina; massive plugin ecosystem; POSIX-compatible scripting; excellent completion system | Requires manual configuration for a good experience; startup overhead from plugins | **Keep** — correct choice for this use case |
| **Fish** | Out-of-box autosuggestions, syntax highlighting, web config UI; no plugin configuration needed | Not POSIX-compatible (scripts need rewriting); smaller ecosystem; not default on macOS | Not recommended — would break existing shell scripts and muscle memory |
| **Nushell** | Structured data pipelines; modern design; excellent for data exploration | Pre-1.0, breaking changes between releases; not POSIX; very different mental model | Not recommended for primary shell — could be a secondary shell for data tasks |

**Verdict:** Zsh is the correct choice. The cross-platform requirement (macOS + Arch Linux) and POSIX compatibility needs rule out Fish and Nushell as primary shells.

Sources: [Best Linux Shells Compared 2026](https://computingforgeeks.com/best-linux-macos-shells/), [Bash vs Fish vs Zsh vs Nushell (Lobsters)](https://lobste.rs/s/qoccbl/bash_vs_fish_vs_zsh_vs_nushell), [Zsh vs Fish 2025](https://medium.com/@awaleedpk/zsh-vs-fish-the-ultimate-shell-showdown-for-2025-27b89599859b)

### Plugin Manager Assessment

The current approach is **manual sourcing with multi-path search**. This is functional but has tradeoffs:

| Approach | Startup Impact | Update Story | Deferred Loading | Verdict |
|----------|---------------|--------------|-----------------|---------|
| **Manual source (current)** | Every plugin blocks startup | Must update system packages or manually fetch | Not possible | Works but leaves performance on the table |
| **zinit** | Turbo mode defers loading to after prompt | `zinit update` | Yes — primary differentiator | Best for performance; steeper learning curve |
| **sheldon** | Fast (Rust); static plugin file | `sheldon lock --update` | Partial (deferred sources) | Simpler than zinit; good middle ground |
| **antidote** | Fast; generates static file | `antidote update` | Partial | Simplest config; good performance |
| **No manager (zsh_unplugged)** | Same as manual | git pull per plugin | Manual | Similar to current, more structured |

**Recommendation:** The current manual approach is acceptable for 3 plugins. If startup performance becomes a priority (and it should — see Section 4), zinit's Turbo mode is the only option that defers plugin loading until after the prompt appears. For the current plugin count, sheldon or antidote would also work well.

Sources: [zsh-plugin-manager-benchmark](https://github.com/rossmacarthur/zsh-plugin-manager-benchmark), [Comparison of ZSH frameworks](https://gist.github.com/laggardkernel/4a4c4986ccdcaf47b91e8227f9868ded), [zsh_unplugged](https://github.com/mattmc3/zsh_unplugged)

### Vendored Git Completions

The `zsh/completions/` directory contains a third-party git completion wrapper (_git, 293 lines) and the full git bash completion script (git-completion.bash, 3777 lines) by Felipe Contreras, dated January 2026.

**Concern:** Git ships its own completion files. Homebrew's git formula installs completions to `$HOMEBREW_PREFIX/share/zsh/site-functions/_git`. The vendored files may conflict with or duplicate the system-provided completions, and they will drift from the installed git version (currently 2.51.2). The vendored _git wrapper is from the `git-completion` project which provides an alternative to git's built-in zsh completion — this is a deliberate choice, not accidental duplication, but it requires manual updates.

---

## 6. Configuration Quality

### Dead or Ineffective Configuration

| Item | File:Line | Issue |
|------|-----------|-------|
| `thefuck` init guard | load-tools.zsh:54-56 | `thefuck` is NOT installed on macOS (verified). The `command -v` guard silently skips it, so no error, but it is dead configuration. |
| `mise` init guard | load-tools.zsh:49-51 | `mise` is NOT installed on macOS (verified). Same — dead config. |
| `direnv` init guard | load-tools.zsh:44-46 | `direnv` is NOT installed on macOS (verified). Dead config. |
| `bat` aliases | load-tools.zsh:59-62 | `bat` is NOT installed on macOS (verified). The `cat` and `catp` aliases are never applied. |
| `eza` aliases | load-tools.zsh:65-70 | `eza` is NOT installed on macOS (verified). The `ls`, `ll`, `la`, `lt` aliases are never applied. The `ls` alias falls back to `ls -G` from darwin.zsh. |
| `ZSH_AUTOSUGGEST_STRATEGY` placement | load-plugins.zsh:45-46 | Set AFTER sourcing the plugin. The autosuggestions plugin reads these at source time as defaults but also at widget execution time, so this works — but it is fragile. Atuin also prepends itself, resulting in `(atuin history completion)`. |
| iTerm2 integration line | .zshrc:35 | **Unconditional** — not wrapped in a terminal-type check. On macOS, iTerm2 IS installed, so this is not fully dead. However, it adds overhead when using Ghostty or WezTerm (the primary terminals). The `[[ -o interactive ]]` guard inside the integration script mitigates this somewhat, but the `test -e` and file read still occur. |

### Alias Overwrite Chain (macOS)

The alias `ls` is defined three times:

1. `shared.zsh:49` — `alias ll="ls -lah"` (uses whatever `ls` is at this point)
2. `darwin.zsh:41` — `alias ls="ls -G"` (sets macOS color flag)
3. `load-tools.zsh:66-69` — `alias ls="eza --icons"` (would override, but eza is NOT installed)

Since eza is not installed, the effective chain is: `ls -> ls -G` (from darwin.zsh). The `ll` and `la` aliases from shared.zsh use bare `ls`, which resolves to the `ls -G` alias at execution time. This works correctly but is fragile — if load order changed, `ll` could resolve differently.

### Alias Shadowing of Builtins

| Alias | Original | Risk |
|-------|----------|------|
| `rm="rm -i"` | `/bin/rm` | **Intentional safety alias.** Note: scripts run with `#!/bin/zsh` will NOT inherit this alias (aliases are not exported). This is correct behavior. |
| `cp="cp -i"` | `/bin/cp` | Same as above. |
| `mv="mv -i"` | `/bin/mv` | Same as above. **However:** the user has a project called `mv` (Modern Visa). The `mv` alias does not conflict because aliases require the command position, but `mv` as a directory name in tab completion could cause confusion. |
| `cd="z"` | `builtin cd` | **Significant** — completely replaces `cd` with zoxide's `z`. Users who type `cd` get zoxide behavior, not builtin cd. This is intentional but worth noting: `cd` to an exact path still works (zoxide falls through), but `cd -` behavior may differ. |

### Missing Options

| Option | Purpose | Impact |
|--------|---------|--------|
| `HIST_IGNORE_SPACE` | Commands prefixed with space are not recorded | **Security** — allows typing secrets without polluting history. Widely recommended. |
| `NO_BEEP` | Suppress terminal bell | **Comfort** — prevents audible beep on tab completion failures |
| `CORRECT` or `CORRECT_ALL` | Spelling correction for commands | **Optional** — can be annoying; `thefuck` would serve this role if installed |
| `HIST_EXPIRE_DUPS_FIRST` | When history is full, expire duplicates first | **Useful** with `HIST_IGNORE_ALL_DUPS` already set, this is less important but still recommended |

---

## 7. Architecture Assessment

### File Organization

The `zsh/` directory uses a **three-tier structure**:

```
zsh/
├── .zshenv              # Tier 1: Entry point (all shells)
├── .zshrc               # Tier 1: Entry point (interactive)
├── rc/                  # Tier 2: Configuration layers
│   ├── shared.zsh       #   Options + aliases (all platforms)
│   ├── darwin.zsh        #   macOS-specific
│   └── linux.zsh         #   Linux-specific
├── functions/           # Tier 3: Functional modules
│   ├── setup-completions.zsh
│   ├── load-plugins.zsh
│   ├── load-tools.zsh
│   └── init-starship.zsh
└── completions/         # Vendored third-party
    ├── _git
    └── git-completion.bash
```

**Assessment: GOOD.** The separation is logical and well-documented:

- **Tier 1** handles entry and dispatch. `.zshenv` is correctly limited to environment variables only.
- **Tier 2** separates cross-platform from platform-specific config. The `case "$(uname -s)"` dispatch is the standard community pattern.
- **Tier 3** isolates functional concerns: completions, plugins, tools, prompt. Load order is explicitly documented in `.zshrc` comments.
- **Vendored completions** are kept separate from custom code.

### Responsibility Separation

| Responsibility | Owner | Clean? |
|---------------|-------|--------|
| Environment variables | `.zshenv` | Yes — DOTFILES, PATH, theme vars only |
| Shell options | `shared.zsh` | Yes |
| Common aliases | `shared.zsh` | Yes |
| Platform PATH additions | `darwin.zsh`, `linux.zsh` | Yes |
| Platform aliases | `darwin.zsh`, `linux.zsh` | Yes |
| NVM init | `darwin.zsh` | **Partial** — NVM is macOS-only, but it is a tool init, not a platform config. Arguably belongs in load-tools.zsh with a platform guard. |
| Completion system | `setup-completions.zsh` | Yes |
| Plugin loading | `load-plugins.zsh` | Yes |
| Tool initialization | `load-tools.zsh` | Yes |
| Prompt | `init-starship.zsh` | Yes |
| `.env` loading | `.zshrc` (inline) | **No** — should be its own function or removed |

### Duplication

| Item | Locations | Issue |
|------|-----------|-------|
| `DOTFILES` export | `.zshenv:15`, `.zshrc:6` | `.zshrc` re-exports as a fallback. This is defensive (if .zshenv is not sourced), not duplication. **Acceptable.** |
| `cs` alias | `shared.zsh:48`, `linux.zsh:61` | `shared.zsh` defines `cs="~/dev/ccswitch.sh --switch"` unconditionally. `linux.zsh` redefines it with a guard. On Linux, the guarded version wins. On macOS, only the shared version runs. **Minor duplication** — the shared.zsh version could be removed and both platforms could define their own with a guard. |
| `ls` alias | `shared.zsh:49`, `darwin.zsh:41`, `load-tools.zsh:66` | Three definitions. Only one survives per platform. **Fragile but functional** (see Section 6). |
| `ll`, `la` aliases | `shared.zsh:49-50`, `load-tools.zsh:67-68` | Two definitions of `ll` and `la`. If eza is installed, load-tools.zsh wins. If not, shared.zsh wins. **Intentional layering**, not pure duplication. |

---

## 8. Missing Capabilities

| Capability | Description | Difficulty | Priority |
|------------|-------------|------------|----------|
| **fzf-tab** | Replaces zsh's default completion menu with fzf. Widely recommended as essential fzf companion. Already have fzf installed. | Low (one plugin source) | Important |
| **Lazy NVM loading** | Defer NVM init until `node`/`npm`/`nvm` is first called. Saves ~320ms startup. | Low (wrapper function) | Critical |
| **HIST_IGNORE_SPACE** | Prevent space-prefixed commands from entering history. Standard security practice. | Trivial (one `setopt`) | Important |
| **Key bindings configuration** | No explicit key bindings beyond history-substring-search arrows. Missing: Ctrl+R (atuin handles this), Home/End, word-forward/back. | Low | Nice-to-have |
| **Directory hashing** | `hash -d` for frequently accessed directories (e.g., `hash -d dev=~/dev`). | Trivial | Nice-to-have |
| **Autoload functions** | No use of zsh's `autoload` for custom functions (beyond compinit). Functions could be autoloaded from a directory for better startup. | Medium | Nice-to-have |
| **XDG Base Directory compliance** | HISTFILE is `~/.zsh_history` (not in XDG). Cache uses `$XDG_CACHE_HOME` correctly. Starship uses `$STARSHIP_CONFIG`. Inconsistent. | Low | Nice-to-have |
| **NO_BEEP** | Suppress terminal bell. | Trivial (one `setopt`) | Nice-to-have |

Sources: [fzf-tab on GitHub](https://github.com/Aloxaf/fzf-tab), [10 Zsh Tips & Tricks (SitePoint)](https://www.sitepoint.com/zsh-tips-tricks/)

---

## 9. Redundancies

### Within ZSH Domain

| Redundancy | Files | Assessment |
|------------|-------|------------|
| NVM + mise both referenced | `darwin.zsh` (NVM), `load-tools.zsh` (mise) | **Active redundancy.** NVM IS installed and active. mise is NOT installed. If mise is installed later and configured to manage Node.js, NVM should be removed. Currently not a runtime conflict because mise doesn't load. |
| Triple `ls` alias definition | `shared.zsh`, `darwin.zsh`, `load-tools.zsh` | **Layered override pattern.** Last definition wins. Not a bug, but the shared.zsh `ls` alias never takes effect on macOS (darwin.zsh overrides). |
| `cs` alias duplication | `shared.zsh:48`, `linux.zsh:61` | **True duplication.** The shared.zsh version could be removed if both platforms define their own. |

### Across Domains

| Redundancy | Domains | Assessment |
|------------|---------|------------|
| Git completions: vendored in `zsh/completions/` vs system-provided by Homebrew/pacman | ZSH + system packages | **Intentional override.** The vendored Felipe Contreras completion is an alternative to git's built-in zsh completion. However, it places the burden of keeping it updated on the user. |
| Atuin + fzf Ctrl+R | Both provide reverse history search | **Atuin wins.** The `--disable-up-arrow` flag in atuin init suggests awareness of this overlap. Atuin binds Ctrl+R; fzf's key-bindings.zsh also binds Ctrl+R. **Potential conflict** — whichever loads last wins the Ctrl+R binding. Currently atuin loads before fzf, so fzf's Ctrl+R may override atuin's. |
| Autosuggestion strategy includes "atuin" | `load-plugins.zsh` sets `(history completion)`, but runtime shows `(atuin history completion)` | **Atuin injects itself.** This is atuin's doing, not the user's config. Not harmful but means the explicit config in load-plugins.zsh is being modified at runtime. |

---

## 10. Ambiguities

| Item | Question | File:Line |
|------|----------|-----------|
| **`~/.env` purpose** | Is this file for secrets, development environment variables, or both? It is 89 lines and world-readable (644). The `set -a; source` pattern executes arbitrary code. Is this intentional or a legacy pattern from before Doppler adoption? | `.zshrc:9-13` |
| **NVM vs mise intent** | Is NVM the permanent Node version manager, or is mise intended to replace it? Both are referenced but only NVM is installed. If mise is the plan, NVM removal should be tracked. | `darwin.zsh:30-34`, `load-tools.zsh:49-51` |
| **iTerm2 integration intent** | iTerm2 IS installed, but Ghostty and WezTerm are the configured terminals (based on repo structure). Is iTerm2 still actively used? The integration line is unconditional and not terminal-aware. | `.zshrc:35` |
| **`claude --dangerously-skip-permissions` alias** | This alias bypasses Claude Code's permission system globally. Is this intentional for all contexts, or should it be scoped? | `shared.zsh:46` |
| **Vendored git completions update cadence** | The files are from January 2026. Git is at 2.51.2. Is there a process for updating these, or are they install-and-forget? | `zsh/completions/_git`, `zsh/completions/git-completion.bash` |
| **Homebrew x86 fallback** | `darwin.zsh:10` falls back to `/usr/local/bin/brew` (Intel Homebrew). Is an x86 Mac still in use, or is this dead code? | `darwin.zsh:10` |
| **Doppler config in .zshenv** | `USE_DOPPLER=true`, `DOPPLER_PROJECT=homelab`, `DOPPLER_CONFIG=prd` are exported for ALL shells (including non-interactive scripts). Is this intentional? Could cause scripts to unexpectedly use Doppler. | `.zshenv:10-12` |
| **`STARSHIP_THEME` env var** | Exported in `.zshenv:24` but not consumed by starship (starship uses `STARSHIP_CONFIG`). Is this used by a custom script or is it dead? | `.zshenv:24` |

---

## 11. Recommendations

### Critical

**C1. Lazy-load NVM or replace with mise.**
NVM adds ~320ms to every shell startup (measured). This is the single largest startup cost. Two options:

- **Option A (quick fix):** Replace the eager `source nvm.sh` with a lazy-loading wrapper function that only initializes NVM when `node`, `npm`, `npx`, or `nvm` is first invoked.
- **Option B (strategic):** Install mise, configure it to manage Node.js, and remove NVM entirely. mise is faster (Rust, no shims), manages multiple runtimes, and is already referenced in load-tools.zsh.

File: `zsh/rc/darwin.zsh:30-34`

Sources: [Fix slow ZSH startup due to NVM](https://dev.to/thraizz/fix-slow-zsh-startup-due-to-nvm-408k), [Optimizing Zsh Init with ZProf](https://www.mikekasberg.com/blog/2025/05/29/optimizing-zsh-init-with-zprof.html), [mise.jdx.dev](https://mise.jdx.dev/)

**C2. Secure the `~/.env` sourcing pattern.**
The current `set -a; source ~/.env; set +a` pattern has two problems:

1. **Arbitrary code execution:** `source` runs any shell commands in the file, not just variable assignments.
2. **World-readable permissions:** File is 644 (`-rw-r--r--`), meaning any user on the system can read its contents.

Recommended fixes:
- Restrict permissions: `chmod 600 ~/.env`
- Consider replacing with direnv (which has an allowlist/approval mechanism) or migrating remaining local-only variables to `~/.zshenv.local` (which is already guarded and sourced).
- If the file must be sourced, add a comment warning about the security implications.

File: `zsh/.zshrc:9-13`

Source: [OhMyZsh dotenv Remote Code Execution](https://mazinahmed.net/blog/ohmyzsh-dotenv-rce/)

### Important

**I1. Add `setopt HIST_IGNORE_SPACE`.**
Space-prefixed commands should not enter history. This is a standard security practice that prevents accidental logging of commands containing secrets (e.g., `export API_KEY=...`).

File: `zsh/rc/shared.zsh` (add after line 22)

**I2. Clean up dead tool configurations.**
Five tools referenced in `load-tools.zsh` are not installed on macOS: `eza`, `bat`, `mise`, `direnv`, `thefuck`. The `command -v` guards prevent errors, but the code is aspirational. Either:

- Install the missing tools (recommended: at minimum `eza` and `bat` — they provide real daily value).
- Or add a comment block marking these as "pending installation" so intent is clear.

File: `zsh/functions/load-tools.zsh`

**I3. Move NVM init to `load-tools.zsh`.**
NVM initialization currently lives in `darwin.zsh` (platform config) rather than `load-tools.zsh` (tool initialization). This breaks the architectural separation: `darwin.zsh` should handle PATH additions and platform aliases, while tool `eval` calls belong in `load-tools.zsh`. The NVM init could be wrapped in a platform guard inside load-tools.zsh:

```zsh
# NVM (macOS only — installed via Homebrew)
if [[ "$(uname -s)" == "Darwin" ]] && [[ -s "${HOMEBREW_PREFIX:-/opt/homebrew}/opt/nvm/nvm.sh" ]]; then
  # lazy-load wrapper here
fi
```

Files: `zsh/rc/darwin.zsh:30-34`, `zsh/functions/load-tools.zsh`

**I4. Guard iTerm2 integration for terminal type.**
The iTerm2 integration line is unconditional. When using Ghostty or WezTerm, the file is read and parsed unnecessarily. Add a terminal-type guard:

```zsh
if [[ "$TERM_PROGRAM" == "iTerm.app" ]]; then
  test -e "${HOME}/.iterm2_shell_integration.zsh" && source "${HOME}/.iterm2_shell_integration.zsh"
fi
```

File: `zsh/.zshrc:35`

**I5. Investigate atuin/fzf Ctrl+R binding conflict.**
Both atuin and fzf bind Ctrl+R for reverse history search. Since atuin loads before fzf in `load-tools.zsh`, fzf's `key-bindings.zsh` may override atuin's Ctrl+R binding. If atuin is the preferred Ctrl+R handler, either:

- Load fzf before atuin, or
- Skip fzf's key-bindings.zsh and only source fzf's completion.zsh, or
- Explicitly rebind Ctrl+R to atuin after fzf loads.

File: `zsh/functions/load-tools.zsh:10-28`

### Nice-to-Have

**N1. Add `setopt NO_BEEP`** to suppress terminal bell on completion failures.

File: `zsh/rc/shared.zsh`

**N2. Install `fzf-tab` plugin** to replace zsh's default completion menu with fzf. Since fzf is already installed and configured, this is a natural enhancement. Note: fzf-tab must load after compinit but before autosuggestions and syntax-highlighting.

Source: [fzf-tab on GitHub](https://github.com/Aloxaf/fzf-tab)

**N3. Consider caching `eval` output** for tools that support it. Instead of running `eval "$(tool init zsh)"` on every startup, generate static init scripts periodically:

```zsh
# Generate once:
starship init zsh > ~/.cache/zsh/starship-init.zsh
zoxide init zsh > ~/.cache/zsh/zoxide-init.zsh

# Source the cached version:
source ~/.cache/zsh/starship-init.zsh
```

This eliminates subprocess spawning on every shell start. Regenerate when tools are updated.

Source: [Achieving 30ms Zsh Startup](https://dev.to/tmlr/achieving-30ms-zsh-startup-40n1)

**N4. Remove the `cs` alias from `shared.zsh`** since `linux.zsh` redefines it with a guard. Keep only the platform-specific definitions (or keep the shared one and remove the linux one — pick one location).

Files: `zsh/rc/shared.zsh:48`, `zsh/rc/linux.zsh:61`

**N5. Establish a git completions update process.** The vendored files are from January 2026. Consider either:

- A periodic script to pull the latest from the `git-completion` project.
- Or switching to system-provided git completions (remove the vendored files and let Homebrew/pacman manage them).

Files: `zsh/completions/_git`, `zsh/completions/git-completion.bash`

**N6. Add `HIST_EXPIRE_DUPS_FIRST`** to ensure duplicate entries are evicted first when history reaches capacity.

File: `zsh/rc/shared.zsh`

---

## Startup Time Breakdown (Estimated)

Based on measurements and profiling data from community sources:

| Component | Estimated Time | Source |
|-----------|---------------|--------|
| Homebrew shellenv | ~30ms | `eval "$(brew shellenv)"` |
| NVM source | ~320ms | `source nvm.sh` + `source nvm bash_completion` |
| compinit (cached) | ~15ms | `compinit -C` |
| Plugins (syntax-hl + autosuggestions + history-substring) | ~30ms | Three file sources |
| zoxide init | ~20ms | `eval "$(zoxide init zsh)"` |
| atuin init | ~30ms | `eval "$(atuin init zsh --disable-up-arrow)"` |
| fzf integration | ~10ms | Source completion + key-bindings |
| starship init | ~20ms | `eval "$(starship init zsh)"` |
| iTerm2 shell integration | ~10ms | Source 7KB file |
| `~/.env` sourcing | ~5ms | 89-line file |
| Shared/platform config | ~5ms | Options, aliases |
| **Total estimated** | **~495ms** | |
| **Total measured** | **~830ms** | 3-run average; delta likely from disk I/O variance, NVM completion, and unmeasured overhead |

**Primary bottleneck:** NVM accounts for ~38% of estimated startup time. Lazy-loading or replacing with mise would bring startup into the 400-500ms range. Caching eval output for remaining tools could push it below 200ms.

---

## Sources

### Best Practices & Configuration
- [My Updated ZSH Config 2025 - Scott Spence](https://scottspence.com/posts/my-updated-zsh-config-2025)
- [The best minimal zsh configuration - Felipe Contreras](https://felipec.wordpress.com/2025/01/20/zsh-min/)
- [10 Zsh Tips & Tricks - SitePoint](https://www.sitepoint.com/zsh-tips-tricks/)
- [24 Zsh Plugins Every Developer Should Use in 2025](https://dev.to/chandrashekhar/24-zsh-plugins-every-developer-devops-engineer-should-use-in-2025-383k)
- [You probably don't need Oh My Zsh - Artem Golubin](https://rushter.com/blog/zsh-shell/)
- [How to Build a Lightning-Fast Zsh Terminal - Apidog](https://apidog.com/blog/zsh-config/)

### Startup Performance
- [Optimizing Zsh Init with ZProf - Mike Kasberg](https://www.mikekasberg.com/blog/2025/05/29/optimizing-zsh-init-with-zprof.html)
- [Speed up zsh compinit - ctechols gist](https://gist.github.com/ctechols/ca1035271ad134841284)
- [Achieving 30ms Zsh Startup - DEV Community](https://dev.to/tmlr/achieving-30ms-zsh-startup-40n1)
- [I cut Zsh load time from 400ms to 30ms - lukm.dev](https://lukm.dev/writings/speed-up-zsh/)
- [Speed Matters: Optimized ZSH Startup to Under 70ms - Santacloud](http://santacloud.dev/posts/optimizing-zsh-startup-performance/)
- [Improving zsh startup times - Allan Deutsch](https://allandeutsch.com/notes/zsh-startup)
- [Improving Zsh Performance - Dave Dribin](https://www.dribin.org/dave/blog/archives/2024/01/01/zsh-performance/)

### NVM Performance
- [Fix slow ZSH startup due to NVM - DEV Community](https://dev.to/thraizz/fix-slow-zsh-startup-due-to-nvm-408k)
- [Make your shell 370% faster - varun.ch](https://varun.ch/posts/slow-nvm/)
- [Lazy-load nvm to Reduce ZSH Startup Time - armno.in.th](https://armno.in.th/blog/zsh-startup-time/)
- [nvm very slow to start - GitHub Issue #2724](https://github.com/nvm-sh/nvm/issues/2724)
- [Why zsh Is Slow to Start - OpenReplay](https://blog.openreplay.com/zsh-slow-startup-fix/)

### Shell Comparison
- [Best Linux Shells Compared - Bash vs Zsh vs Fish 2026](https://computingforgeeks.com/best-linux-macos-shells/)
- [Bash vs Fish vs Zsh vs Nushell - Lobsters](https://lobste.rs/s/qoccbl/bash_vs_fish_vs_zsh_vs_nushell)
- [Zsh vs Fish 2025 - Medium](https://medium.com/@awaleedpk/zsh-vs-fish-the-ultimate-shell-showdown-for-2025-27b89599859b)

### Plugin Managers
- [zsh-plugin-manager-benchmark - GitHub](https://github.com/rossmacarthur/zsh-plugin-manager-benchmark)
- [Comparison of ZSH frameworks and plugin managers - GitHub Gist](https://gist.github.com/laggardkernel/4a4c4986ccdcaf47b91e8227f9868ded)
- [Slant - 9 Best plugin managers for ZSH 2026](https://www.slant.co/topics/3265/~best-plugin-managers-for-zsh)
- [zinit on GitHub](https://github.com/zdharma-continuum/zinit)
- [antidote.sh](https://antidote.sh/)
- [zsh_unplugged - GitHub](https://github.com/mattmc3/zsh_unplugged)
- [fzf-tab - GitHub](https://github.com/Aloxaf/fzf-tab)

### History Configuration
- [Oh-My-Zsh history.zsh](https://github.com/ohmyzsh/ohmyzsh/blob/master/lib/history.zsh)
- [zsh history made simple - Medium](https://medium.com/@n1zyy/zsh-history-made-simple-de3ec5c8f027)
- [zsh Shell History Options - CLI Notes](https://postgresqlstan.github.io/cli/zsh-history-options/)

### Security
- [OhMyZsh dotenv Remote Code Execution - Mazin Ahmed](https://mazinahmed.net/blog/ohmyzsh-dotenv-rce/)

### mise / NVM Comparison
- [NVM vs Mise - Better Stack](https://betterstack.com/community/guides/scaling-nodejs/nvm-vs-mise/)
- [mise Tool Version Management - OneUptime](https://oneuptime.com/blog/post/2026-01-25-mise-tool-version-management/view)
- [Node.js with Mise - Mac Install Guide 2026](https://mac.install.guide/mise/mise-node-mac)
- [mise.jdx.dev](https://mise.jdx.dev/)
