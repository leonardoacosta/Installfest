# Starship Prompt Configuration Audit

> Domain: `starship/starship.toml`, `zsh/functions/init-starship.zsh`
> Starship version: 1.24.0 (build 2025-10-25)
> Generated: 2026-03-25
> Health Score: **GOOD**

---

## 1. Current Setup

### Global Settings

| Setting | Value | Notes |
|---------|-------|-------|
| `add_newline` | `true` | Blank line between prompts |
| `palette` | `"nord"` | Active color palette |
| `scan_timeout` | 500ms (default) | Not explicitly set |
| `command_timeout` | 500ms (default) | Not explicitly set |

### Format String (Module Order)

```
$os → $directory → $git_branch → $git_status → $fill → $python → $lua →
$nodejs → $dotnet → $golang → $haskell → $rust → $ruby → $azure → $aws →
$docker_context → $jobs → $cmd_duration → $line_break → $character
```

**Layout**: Two-line prompt. Left side: OS icon, path, git info. Right side (after `$fill`):
language/cloud/docker context, jobs, command duration. Second line: character prompt only.

### Module Inventory

| Module | Enabled | Custom Format | Custom Symbol | Custom Style | Notes |
|--------|---------|---------------|---------------|--------------|-------|
| `os` | Yes (explicitly) | `[$symbol ]($style)` | Macos=``, Linux=``, Arch=`` | `bold white` | |
| `directory` | Yes | `[$path ]($style)` | -- | `bold fg:dark_blue` | truncation_length=3, truncate_to_repo=false |
| `git_branch` | Yes | `[on](white) [$symbol$branch ]($style)` | ` ` | `fg:green` | |
| `git_status` | Yes | `([$all_status$ahead_behind]($style) )` | -- | `fg:red` | |
| `fill` | Yes | -- | ` ` (space) | -- | Fills gap between left/right |
| `python` | Yes | Custom (pyenv) | ` ` | `teal` | pyenv_version_name=true |
| `lua` | Yes | `[$symbol($version )]($style)` | ` ` | default | |
| `nodejs` | Yes | default | ` ` | `blue` | |
| `golang` | Yes | default | ` ` | `blue` | |
| `haskell` | Yes | default | ` ` | `blue` | |
| `rust` | Yes | default | ` ` | `orange` | |
| `ruby` | Yes | default | ` ` | `blue` | |
| `dotnet` | In format | Not customized | default | default | Listed in format but no `[dotnet]` section |
| `azure` | In format | Not customized | default | default | Listed in format but no `[azure]` section |
| `package` | **Not in format** | -- | `󰏗 ` | -- | Configured but never displayed |
| `aws` | Yes | Custom duration format | ` ` | `yellow` | |
| `docker_context` | Yes | `[$symbol]($style) $path` | ` ` | `fg:#06969A` | **Bug in format string** |
| `jobs` | Yes | `[$symbol]($style)` | ` ` | `red` | number_threshold=1 |
| `cmd_duration` | Yes | `[$duration]($style)` | -- | `fg:gray` | min_time=500ms |
| `character` | Yes (default) | default | -- | -- | No customization |

### Palettes

**Nord (active)**: dark_blue, blue, teal, red, orange, green, yellow, purple, gray, black, white (11 colors)

**Onedark (inactive)**: dark_blue, blue, red, green, purple, cyan, orange, yellow, gray, white, black (11 colors)

### Explicitly Disabled Modules (by omission from format string)

The custom format string acts as an allowlist. These common modules are effectively disabled:

`time`, `battery`, `memory_usage`, `kubernetes`, `terraform`, `vagrant`, `nix_shell`, `conda`,
`java`, `php`, `swift`, `kotlin`, `zig`, `elixir`, `erlang`, `helm`, `pulumi`, `gcloud`,
`openstack`, `env_var`, `username`, `hostname`, `shell`, `shlvl`, `singularity`, `vcsh`,
`git_commit`, `git_state`, `git_metrics`, `container`, `sudo`, `status`, `c`, `cmake`, `dart`,
`deno`, `bun`, `nim`, `ocaml`, `perl`, `scala`, `vlang`, `opa`, `buf`

---

## 2. Intent Analysis

The configuration reflects a **developer workstation prompt** for a polyglot engineer working
across web (Node.js), systems (Rust, Go), scripting (Python, Lua, Ruby), and cloud (AWS, Azure,
Docker) domains.

**Design intent**:
- Visual clarity via two-line layout with fill separator
- Nord color theme for aesthetic consistency with terminal/editor
- Nerd Font icons for compact, visual module identification
- Minimal noise: only show language versions when in relevant project directories (Starship default behavior)
- Git-centric: branch and status prominently placed after directory
- Performance awareness: cmd_duration shown for slow commands (>500ms)

**Target user**: macOS primary, Linux secondary (Arch), multi-machine setup via SSH mesh.

---

## 3. Cross-Domain Interactions

| Interaction | Source | Target | Mechanism | Fragility |
|-------------|--------|--------|-----------|-----------|
| Config path | `symlinks.conf` (L14) | `~/.config/starship/starship.toml` | Symlink | **Low** -- standard location, well-tested |
| Config fallback | `init-starship.zsh` (L9-10) | `$DOTFILES/starship/starship.toml` | Env var + file check | **Low** -- defensive fallback |
| STARSHIP_CONFIG export | `init-starship.zsh` (L6) | starship binary | Env var | **Low** -- official mechanism |
| STARSHIP_THEME export | `.zshenv` (L23) | **Nothing** | Env var | **Dead code** -- see Section 10 |
| Nerd Font dependency | `starship.toml` (all symbols) | Terminal emulator font | Implicit | **Medium** -- icons break without Nerd Font |
| Nord palette | `starship.toml` (L24, L118-130) | All modules using color names | TOML palette resolution | **Low** -- self-contained |
| Shell init order | `.zshrc` (L32) | `init-starship.zsh` loaded last | Source order | **Low** -- intentionally last |
| Terminal theme sync | `.zshenv` exports | Ghostty/WezTerm/tmux/nvim | Convention only | **Medium** -- manual sync required |

---

## 4. Best Practices Audit

### Timeouts

**Finding**: Neither `scan_timeout` nor `command_timeout` are explicitly configured.
Both default to 500ms.

**Assessment**: The `starship timings` output from this machine shows all modules complete well
under 500ms (git_status: 11ms, git_branch: 9ms, os: 2ms, directory: 1ms). The defaults are
adequate for the current workload. However, in large monorepos, `git_status` can spike to 200ms+
or even hit the timeout. Explicitly setting `command_timeout` provides documentation-as-code and
a safety net.

**Best practice**: Set `command_timeout = 500` explicitly at the top of the file. This documents
the intent and makes timeout-related debugging easier.

Sources:
- [Starship FAQ -- Performance](https://starship.rs/faq/)
- [git_status slow -- Issue #4305](https://github.com/starship/starship/issues/4305)
- [Starship subtle slowness](https://blog.ffff.lt/posts/starship-subtle-slowness/)

### Format String Ordering

**Finding**: The module order follows a logical grouping: identity (os) -> location (directory) ->
VCS (git) -> fill -> context (languages, cloud, docker) -> status (jobs, duration) -> newline ->
input (character).

**Assessment**: This is the community-standard layout. Left-side shows "where you are," right-side
shows "what's active." Two-line prompt keeps the input cursor at a predictable position regardless
of prompt width. No issues here.

### Module Configuration Completeness

**Finding**: `dotnet` and `azure` appear in the format string but have no `[dotnet]` or `[azure]`
configuration sections. They rely entirely on Starship defaults.

**Assessment**: This is fine. Starship modules work with defaults. However, the inconsistency
(some modules customized, some not) suggests these were added to the format string
opportunistically without being styled to match the rest of the prompt. They will use default
Starship colors, not the Nord palette.

### Nerd Font Icons

| Module | Config Symbol | Starship NF Preset Symbol | Match? |
|--------|--------------|---------------------------|--------|
| git_branch | ` ` | ` ` | Yes |
| docker_context | ` ` | ` ` | Yes |
| nodejs | ` ` | ` ` | **No** -- config uses , preset uses  |
| python | ` ` | ` ` | Yes |
| lua | ` ` | ` ` | Yes |
| golang | ` ` | ` ` | **No** -- config uses , preset uses  |
| rust | ` ` | ` ` | **No** -- config uses , preset uses  |
| ruby | ` ` | ` ` | **No** -- config uses , preset uses  |
| haskell | ` ` | ` ` | **No** -- config uses , preset uses  |
| aws | ` ` | ` ` | Yes |
| package | `󰏗 ` | `󰏗 ` | Yes |
| os (Macos) | `` | `` | Yes |
| os (Linux) | `` | `` | Yes |

**Assessment**: Several icons diverge from the official Nerd Font Symbols preset. This is not a
bug -- the user may prefer these icons. However, the divergent ones are older Nerd Font codepoints.
If Nerd Font version 3.x+ is in use, the newer codepoints from the preset are more standardized.

Source: [Starship Nerd Font Symbols Preset](https://starship.rs/presets/nerd-font)

---

## 5. Tool Choices

### Starship vs Alternatives

| Tool | Cross-Shell | Performance | Active Maintenance | Ecosystem |
|------|-------------|-------------|--------------------|-----------|
| **Starship** | 12+ shells | ~20ms | Yes (v1.24.0, Oct 2025) | Dominant |
| Powerlevel10k | Zsh only | ~10ms | **Life support** | Declining |
| Oh My Posh | 5+ shells | Fast | Yes | Strong (Windows focus) |

**Verdict**: Starship is the correct choice for this setup. The user works across macOS and Arch
Linux. Starship's cross-shell support, active maintenance, and Rust-based performance make it the
default recommendation for 2026. Powerlevel10k's maintainer has stepped back, making it a risky
long-term bet. Oh My Posh is the only viable alternative but has stronger Windows/PowerShell roots
and offers no meaningful advantage for a Zsh-on-Unix workflow.

The ecosystem overview's conclusion that "Starship has won the prompt war" is confirmed by the
research. No change recommended.

Sources:
- [hashir.blog -- Powerlevel10k on life support](https://hashir.blog/2025/06/powerlevel10k-is-on-life-support-hello-starship/)
- [bulimov.me -- p10k to Starship migration](https://bulimov.me/post/2025/05/11/powerlevel10k-to-starship/)
- [SaaSHub -- Starship alternatives](https://www.saashub.com/starship-shell-prompt-alternatives)

---

## 6. Configuration Quality

### Bug: `docker_context` format string uses `$path`

**File**: `starship/starship.toml`, line 103
**Value**: `format = '[$symbol]($style) $path'`

The `docker_context` module does not have a `$path` variable. The available variable is
`$context`. This means `$path` will render as a literal empty string (Starship silently ignores
unknown variables in format strings). The module currently shows the Docker icon but no context
name.

**Fix**: Change to `format = '[$symbol$context]($style)'`

Source: [Starship Configuration -- docker_context](https://starship.rs/config/)

### Bug: `docker_context` `detect_extensions` contains `"Dockerfile"`

**File**: `starship/starship.toml`, line 105
**Value**: `detect_extensions = ['Dockerfile']`

`detect_extensions` matches file extensions (the part after the dot). `Dockerfile` is a filename,
not an extension. Files named `Dockerfile` have no extension. This line will never match anything
because no file has the extension `.Dockerfile`.

`Dockerfile` is already correctly listed in `detect_files`. This `detect_extensions` entry is
dead config.

**Fix**: Remove the `detect_extensions` line entirely, or replace with actual Docker-related
extensions if needed (e.g., `detect_extensions = ['dockerfile']` for `*.dockerfile` files).

Source: [Starship docker_context docs](https://docs.rs/starship/latest/starship/configs/docker_context/struct.DockerContextConfig.html)

### Issue: `docker_context` missing `compose.yaml`/`compose.yml`

**File**: `starship/starship.toml`, line 104
**Value**: `detect_files = ['docker-compose.yml', 'docker-compose.yaml', 'Dockerfile']`

Docker Compose v2 (default since 2023) prefers `compose.yaml` and `compose.yml` over the
`docker-compose.*` variants. The current config will not activate the docker context module in
projects using the modern naming convention.

**Fix**: `detect_files = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml', 'Dockerfile']`

Source: [Issue #6620 -- compose.yaml ignored](https://github.com/starship/starship/issues/6620)

### Issue: `package` module configured but not in format string

**File**: `starship/starship.toml`, lines 92-93

The `[package]` section sets `symbol = '󰏗 '` but the module is not included in the custom format
string. This configuration is completely inert -- it will never render.

**Options**: Either add `$package` to the format string (after `$docker_context` or before `$jobs`)
or remove the `[package]` section.

### Inconsistency: TOML whitespace in palette definitions

**File**: `starship/starship.toml`, lines 118-142

The `nord` palette uses spaces around `=` (`dark_blue = '#5E81AC'`) while `onedark` uses no
spaces (`dark_blue='#61afef'`). Line 129 (`white='#D8DEE9'`) in `nord` also lacks spaces.
Line 141 in `onedark` has a space before `=` but not after (`white ='#abb2bf'`).

This is cosmetic (TOML parses all variants identically) but signals the config was assembled
from different sources without normalization.

### Inconsistency: Onedark `blue` and `cyan` are identical

**File**: `starship/starship.toml`, lines 133, 137
**Values**: `blue='#56b6c2'` and `cyan='#56b6c2'`

Both map to the same hex value. In One Dark, `#56b6c2` is the cyan color. The actual One Dark
blue is `#61afef`, which is correctly assigned to `dark_blue`. This means the palette has no
true "blue" -- `blue` is actually cyan. Any module using `blue` in the style will render as
cyan if the palette is ever switched to onedark.

### Missing: Onedark palette lacks `teal`

The `python` module uses `style = 'teal'`. The `nord` palette defines `teal = '#88C0D0'`, but
`onedark` does not define `teal`. Switching to the `onedark` palette would cause the Python module
to fall back to Starship's default teal, breaking the cohesive color scheme.

---

## 7. Architecture Assessment

### Initialization Flow

```
.zshenv                          .zshrc (L32, loaded last)
  |                                |
  +-- STARSHIP_THEME="nord"        +-- init-starship.zsh
      (dead code)                       |
                                        +-- Check starship binary exists
                                        +-- Set STARSHIP_CONFIG (default or fallback)
                                        +-- eval "$(starship init zsh)"
```

**Assessment**: The initialization is well-architected.

1. **Binary check** (line 4): `command -v starship &>/dev/null` -- gracefully degrades if starship
   is not installed. No errors, no broken prompt.

2. **Config resolution** (lines 6-11): Two-tier lookup: first checks
   `~/.config/starship/starship.toml` (standard XDG location), then falls back to
   `$DOTFILES/starship/starship.toml` (source location). The `${STARSHIP_CONFIG:-...}` pattern
   allows external override.

3. **Load order** (`.zshrc` line 32): Starship is loaded last, which is correct. It needs to be
   the final prompt modification to avoid being overwritten by other tools.

**One minor concern**: The `STARSHIP_CONFIG` export happens inside the `if` block (line 6). If
starship is not installed, `STARSHIP_CONFIG` is never exported, which is correct behavior. However,
the default value `$HOME/.config/starship/starship.toml` is hardcoded while the symlink target
in `symlinks.conf` points to the same path. If the symlink target changes in `symlinks.conf`, the
init script would need a manual update. This coupling is low-risk but worth noting.

### Config File Architecture

Single-file TOML configuration. No includes, no splits. At 142 lines, this is well within the
manageable range. Splitting would add complexity without benefit.

---

## 8. Missing Capabilities

| Capability | Current State | Value for This Setup | Recommendation |
|------------|---------------|---------------------|----------------|
| `time` module | Disabled | Low -- terminal title / tmux statusline likely shows time | Skip |
| `battery` module | Disabled | Medium on laptop, None on homelab | Consider for Mac only |
| `kubernetes` module | Disabled | Unknown -- depends on k8s usage | Flag for user |
| `terraform` module | Disabled | Medium -- repo has `packages/infra/` references | Consider |
| `hostname` module | Disabled | **High** -- 3-machine SSH mesh setup | Recommend |
| `username` module | Disabled | Low-Medium -- useful over SSH | Consider with hostname |
| `nix_shell` module | Disabled | Low unless Nix adoption increases | Skip |
| `container` module | Disabled | Medium -- docker/devcontainer awareness | Consider |
| `git_commit` module | Disabled | Low -- branch name is usually sufficient | Skip |
| `git_metrics` module | Disabled | Low-Medium -- shows +/- line counts | Skip |
| `status` module | Disabled | Medium -- shows last command exit code | Consider |
| `sudo` module | Disabled | Low | Skip |
| `shell` module | Disabled | Low -- this is a Zsh-only setup | Skip |
| `zig` module | Disabled | Unknown | Skip unless used |
| `bun`/`deno` module | Disabled | Low-Medium for JS/TS work | Skip |

**Strongest recommendation**: Enable `hostname` (and optionally `username`). With a 3-machine
SSH mesh (Mac, Homelab, Arch), knowing which machine you are on at a glance is critical. The `os`
module shows the OS icon, but if both Mac and Homelab run the same OS, the icon is ambiguous. The
`hostname` module resolves this unambiguously.

---

## 9. Redundancies

| Item | Location | Type | Impact |
|------|----------|------|--------|
| `STARSHIP_THEME="nord"` | `.zshenv` L23 | Dead env var | None -- harmless noise |
| `[package]` section | `starship.toml` L92-93 | Orphaned config | None -- never renders |
| `detect_extensions = ['Dockerfile']` | `starship.toml` L105 | Dead config | None -- never matches |
| `onedark` palette | `starship.toml` L131-142 | Unused palette | None -- just occupies space |
| `STARSHIP_CONFIG` fallback logic | `init-starship.zsh` L9-11 | Defensive but likely unused | None -- symlink always exists |

**Total dead code**: 5 items. None cause harm, but they accumulate cognitive load when reading
the config. The `STARSHIP_THEME` variable is the most misleading because it suggests Starship
reads it (it does not).

---

## 10. Ambiguities

### STARSHIP_THEME is dead code

**File**: `zsh/.zshenv`, line 23
**Value**: `export STARSHIP_THEME="nord"`

Starship does **not** recognize a `STARSHIP_THEME` environment variable. The recognized env vars
are: `STARSHIP_CONFIG`, `STARSHIP_SHELL`, `STARSHIP_SESSION_KEY`, `STARSHIP_LOG`,
`STARSHIP_CACHE`. The palette is set via `palette = "nord"` in `starship.toml` (line 24).

The `.zshenv` file exports theme variables for multiple tools (`TMUX_THEME`, `NVIM_THEME`,
`STARSHIP_THEME`, `WEZTERM_THEME`). The intent appears to be a centralized theme registry.
However, unlike the others, `STARSHIP_THEME` is not consumed by anything.

**Possible intent**: The user may have planned to use `STARSHIP_THEME` in a script that
dynamically modifies `starship.toml` or switches the `palette =` line. This would be a reasonable
pattern but is not currently implemented.

**Status**: Confirmed dead code. Flagged, not guessed.

### Onedark palette: intentional or dead code?

**File**: `starship/starship.toml`, lines 131-142

Two palettes are defined but only `nord` is active. This could be:
- (a) Intentional for easy switching (`palette = "onedark"`)
- (b) Leftover from experimentation

The palette has quality issues (blue/cyan collision, missing teal) that suggest it was not
thoroughly tested. If it were actively used for switching, these issues would have been caught.

**Status**: Likely dead code from experimentation, but flagged as ambiguous. Cannot determine
intent.

### `os` module: useful or noise?

The `os` module displays an OS icon (, , ) on every prompt. In a 3-machine setup, this
provides some value -- but it does not distinguish between two machines running the same OS.
If the Mac and Homelab both show ``, the icon is ambiguous.

**Status**: Marginal value. The `hostname` module would be more informative for multi-machine
identification.

---

## 11. Recommendations

### Critical

None. The configuration is functional and well-structured. No data loss, security, or
correctness risks.

### Important

| # | Issue | File | Line(s) | Fix |
|---|-------|------|---------|-----|
| 1 | `docker_context` format uses `$path` (invalid variable) | `starship.toml` | 103 | Change to `format = '[$symbol$context]($style)'` |
| 2 | `docker_context` `detect_extensions` matches nothing | `starship.toml` | 105 | Remove line or change to `['dockerfile']` |
| 3 | `docker_context` missing modern compose filenames | `starship.toml` | 104 | Add `'compose.yml'`, `'compose.yaml'` to `detect_files` |
| 4 | Enable `hostname` module for multi-machine clarity | `starship.toml` | format string | Add `$hostname` after `$os` in format; add `[hostname]` section with `ssh_only = true` |
| 5 | Remove `STARSHIP_THEME` dead env var | `zsh/.zshenv` | 23 | Delete line, or add a comment explaining its purpose if used by external scripts |

### Nice-to-Have

| # | Issue | File | Line(s) | Fix |
|---|-------|------|---------|-----|
| 6 | Remove orphaned `[package]` section | `starship.toml` | 92-93 | Delete section, or add `$package` to format string |
| 7 | Set `command_timeout` explicitly | `starship.toml` | top of file | Add `command_timeout = 500` for documentation |
| 8 | Fix onedark `blue`/`cyan` collision | `starship.toml` | 133 | Change `blue='#61afef'` (actual One Dark blue) |
| 9 | Add `teal` to onedark palette | `starship.toml` | after 137 | Add `teal='#56b6c2'` for palette-switch compatibility |
| 10 | Normalize TOML whitespace | `starship.toml` | 129, 131-142 | Use consistent `key = 'value'` spacing |
| 11 | Add `[dotnet]` and `[azure]` sections | `starship.toml` | after existing modules | Match Nord palette styling, or remove from format string if not used |
| 12 | Consider `status` module | `starship.toml` | format string | Shows exit code of last command -- useful for debugging |
| 13 | Update Nerd Font symbols to v3 preset | `starship.toml` | various | Align nodejs, golang, rust, ruby, haskell symbols with official preset |
| 14 | iTerm2 shell integration at `.zshrc` L35 | `zsh/.zshrc` | 35 | Check if still needed; may conflict with Ghostty/WezTerm |

---

## Live Performance Data

Captured via `starship timings` in `/Users/leonardoacosta/dev/if` (a git repo):

| Module | Time | Output |
|--------|------|--------|
| `git_status` | 11ms | Modified/untracked indicators |
| `git_branch` | 9ms | Branch name (main) |
| `os` | 2ms | macOS icon |
| `directory` | 1ms | `~/dev/if` |
| `character` | <1ms | `>` prompt |
| `fill` | <1ms | Space fill |
| `line_break` | <1ms | Newline |

**Total**: ~24ms. Well within the acceptable range. No performance concerns at current scale.

**Risk**: `git_status` is the slowest module (as expected -- it runs `git status`). In large
monorepos with thousands of files, this can spike to 200ms+ or hit the 500ms timeout. The
current configuration does not disable any `git_status` sub-checks (stashed, renamed, deleted,
etc.), which is fine for the current workload but worth monitoring if repo sizes grow.

---

## Sources

- [Starship Configuration Reference](https://starship.rs/config/)
- [Starship Advanced Configuration](https://starship.rs/advanced-config/)
- [Starship FAQ -- Performance](https://starship.rs/faq/)
- [Starship Nerd Font Symbols Preset](https://starship.rs/presets/nerd-font)
- [Starship Presets](https://starship.rs/presets/)
- [git_status slow -- Issue #4305](https://github.com/starship/starship/issues/4305)
- [Slow loading big repos -- Issue #6519](https://github.com/starship/starship/issues/6519)
- [docker_context compose.yaml ignored -- Issue #6620](https://github.com/starship/starship/issues/6620)
- [Starship subtle slowness blog](https://blog.ffff.lt/posts/starship-subtle-slowness/)
- [DockerContextConfig Rust docs](https://docs.rs/starship/latest/starship/configs/docker_context/struct.DockerContextConfig.html)
- [hashir.blog -- Powerlevel10k on life support](https://hashir.blog/2025/06/powerlevel10k-is-on-life-support-hello-starship/)
- [bulimov.me -- p10k to Starship](https://bulimov.me/post/2025/05/11/powerlevel10k-to-starship/)
- [SaaSHub -- Starship alternatives](https://www.saashub.com/starship-shell-prompt-alternatives)
- [Sweet Shell 2026](https://www.bretfisher.com/blog/shell)
- [STARSHIP_CONFIG ignoring issue -- Issue #5994](https://github.com/starship/starship/issues/5994)
- [Multiple config files PR #6894](https://github.com/starship/starship/pull/6894)
