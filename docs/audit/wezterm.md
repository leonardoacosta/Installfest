# WezTerm Configuration Audit

> Domain: `wezterm/wezterm.lua` (150 lines)
> Health Score: **POOR**
> Generated: 2026-03-25

---

## 1. Current Setup

### File Inventory

| File | Lines | Purpose |
|------|------:|---------|
| `wezterm/wezterm.lua` | 150 | macOS WezTerm config: SSH domains, appearance, tmux escape sequences, text editing |
| `windows/wezterm-windows.lua` | 124 | Windows WezTerm config: WSL2 Arch default shell, Ctrl-based tmux bindings for AHK |

### What `wezterm.lua` Configures

1. **gui-startup event**: Spawns a window and maximizes it (commented-out layout args suggest abandoned complexity)
2. **SSH domain**: `homelab` pointing to `nyaptor@homelab`
3. **Appearance**: GeistMono Nerd Font DemiBold, VisiBlue color scheme, 90% opacity, no tab bar, RESIZE decorations, minimal padding
4. **Tmux integration keybindings** (14 bindings): Cmd+T (new window), Cmd+W (close), Cmd+1-9 (window switch), Cmd+Shift+[/] (prev/next), Cmd+D/Shift+D (splits), Cmd+K (clear)
5. **Copy/paste preservation**: Cmd+C/V kept at WezTerm level
6. **App controls**: Cmd+N (new window), Cmd+Q (quit)
7. **Text editing keybindings** (8 bindings): Opt+Left/Right (word nav), Opt+Backspace (word delete), Cmd+Left/Right (line nav), Cmd+Backspace (line delete), Cmd+Shift+Left/Right (line select), Opt+Shift+Left/Right (word select)
8. **Commented-out background image**: Dead code (lines 131-148)

### Installation State (Current Machine)

| Artifact | Status |
|----------|--------|
| `wezterm@nightly` in Homebrew | **Installed** |
| `WezTerm.app` in /Applications | **Present** |
| `wezterm` binary in PATH | **Available** (`/opt/homebrew/bin/wezterm`) |
| `~/.config/wezterm/wezterm.lua` symlink | **Missing** -- directory does not exist |
| `wezterm` in Brewfile | **Commented out** (line 86) |
| `wezterm` in symlinks.conf | **Commented out** (line 25) |
| `install.sh` WezTerm symlink code | **Active** (lines 138-143) -- but symlink target directory missing |

The WezTerm binary is installed via `wezterm@nightly` (not the commented-out `wezterm` cask), but
the config symlink was never created. The `~/.config/wezterm/` directory does not exist. WezTerm
is installed but running with default configuration -- the repo config has zero effect.

---

## 2. Intent Analysis

**Verdict: This is legacy configuration. The transition to Ghostty is functionally complete on
macOS but not cleanly finished.**

Evidence for legacy status:
- Ghostty is the active cask in Brewfile (line 38); WezTerm is commented out (line 86)
- Ghostty config is in symlinks.conf (line 21); WezTerm config is commented out (line 25)
- `~/.config/ghostty/config` symlink exists and is active
- `~/.config/wezterm/wezterm.lua` symlink does not exist
- The `WEZTERM_THEME` env var in `.zshenv` (line 24) exports `nord` but nothing consumes it -- the
  `wezterm.lua` hardcodes `VisiBlue (terminal.sexy)` and does not read this env var
- The `mux` alias in `shared.zsh` points to `cmux-workspaces.sh` which launches Ghostty, not WezTerm

Evidence WezTerm is NOT fully dead:
- `windows/wezterm-windows.lua` is actively used on the Windows/CloudPC machine
- `windows/setup.ps1` installs and configures WezTerm (lines 409-428, 627-642)
- Ghostty has **no Windows support** as of March 2026 (confirmed via Ghostty discussions #2563)
- WezTerm is the only viable terminal on the Windows machine

**Conclusion**: WezTerm is dead on macOS, alive on Windows. The macOS config file (`wezterm/wezterm.lua`)
serves as a reference implementation for the Windows config but is not actively deployed.

---

## 3. Cross-Domain Interactions

| Domain | Interaction | Status |
|--------|-------------|--------|
| **tmux** | `wezterm.lua` sends 19 custom escape sequences (`\x1b[NN;CMD~`, `\x1b[NN;CMS~`, `\x1b[NN;OMS~`) that tmux binds via `user-keys[0]`-`user-keys[19]` | **Redundant on macOS** -- Ghostty now sends identical text editing sequences (CMS~, OMS~) but is MISSING the tmux window management sequences (CMD~ for Cmd+T/W/1-9/D/K) |
| **ssh-mesh** | `wezterm.lua` defines SSH domain for `homelab` at line 25-31; `ssh-mesh/configs/mac.config` defines the same host | **Overlapping** -- WezTerm SSH domains duplicate what `~/.ssh/config` already provides. The SSH domain feature is WezTerm-specific multiplexed SSH, not standard SSH. |
| **zsh/.zshenv** | Exports `WEZTERM_THEME="nord"` | **Dead code** -- `wezterm.lua` hardcodes `VisiBlue` and never reads this env var |
| **install.sh** | Lines 138-143 create WezTerm symlink on macOS | **Ineffective** -- runs but target directory missing; code executes `mkdir -p` so would work on fresh install, but symlinks.conf has it commented out, creating inconsistency |
| **windows/setup.ps1** | Copies `wezterm-windows.lua` to Windows config path | **Active dependency** -- this is the live use case |
| **tmux.conf** | Comment on line 45 says "Custom escape sequences from WezTerm" | **Stale documentation** -- should say "from WezTerm/Ghostty" since both terminals now send these sequences |

### Critical Finding: Ghostty Is Missing Tmux Integration Keybindings

The Ghostty config (`ghostty/config`) only defines:
- Text editing: alt+left/right, alt+backspace, super+left/right, super+backspace (6 keybinds)
- Tmux selection: super+shift+left/right, alt+shift+left/right (4 keybinds)

The Ghostty config is **completely missing** the following tmux integration keybindings that
WezTerm provides:

| Keybinding | WezTerm Action | Ghostty Status |
|------------|---------------|----------------|
| Cmd+T | New tmux window | **MISSING** |
| Cmd+W | Close tmux pane/window | **MISSING** |
| Cmd+1-9 | Switch tmux window | **MISSING** (Ghostty 1.2.0+ defaults Cmd+N to `goto_tab`, which INTERCEPTS these before tmux sees them) |
| Cmd+Shift+[ | Previous tmux window | **MISSING** |
| Cmd+Shift+] | Next tmux window | **MISSING** |
| Cmd+D | Vertical split | **MISSING** |
| Cmd+Shift+D | Horizontal split | **MISSING** |
| Cmd+K | Clear scrollback | **MISSING** |

This means either:
1. The user relies on tmux prefix bindings (Ctrl+B) directly in Ghostty -- losing the browser-like Cmd keybinding experience
2. Or Ghostty has these bindings configured elsewhere (no evidence of this)

This is the most actionable finding in this audit: the Ghostty config is incomplete relative to
what WezTerm provided.

---

## 4. Best Practices Audit

| Practice | Status | Notes |
|----------|--------|-------|
| Config in version control | PASS | `wezterm/wezterm.lua` is tracked |
| Symlink-based deployment | FAIL | Commented out in `symlinks.conf`, inconsistent with `install.sh` |
| No hardcoded secrets | PASS | No tokens, keys, or passwords |
| No hardcoded paths | FAIL | Line 5-20 uses WezTerm API (fine), but commented-out background image references absolute path `/Users/leonardoacosta/Documents/background.jpeg` (line 134) |
| Theme consistency | FAIL | WezTerm uses `VisiBlue (terminal.sexy)`, Ghostty uses `Vercel`, tmux uses `one-hunter-vercel` |
| Env var consumption | FAIL | `WEZTERM_THEME="nord"` is exported but never consumed |
| Dead code removal | FAIL | 18 lines of commented-out background config (lines 131-148), 9 lines of commented-out startup args (lines 7-16) |
| Single source of truth for SSH hosts | FAIL | WezTerm SSH domain duplicates ssh-mesh config |

---

## 5. Tool Choices

### Should WezTerm Be Kept as Fallback on macOS?

**No.** The evidence is overwhelming:

1. **Not configured**: The config symlink does not exist. WezTerm runs with defaults on this machine.
2. **Not the primary**: Ghostty is symlinked, in Brewfile, and is the cmux workspace launcher target.
3. **Performance**: Ghostty benchmarks 2-5x faster than WezTerm ([scopir.com](https://scopir.com/posts/ghostty-vs-wezterm-2026/)).
4. **Native feel**: Ghostty uses Cocoa on macOS for native integration; WezTerm uses its own toolkit.
5. **No unique macOS capability**: WezTerm's Lua scripting advantage is not exercised -- the config is a static key mapping file.

### Should `wezterm/wezterm.lua` Be Deleted?

**No -- but it should be relocated.** The file serves as the macOS reference implementation that
the Windows config (`windows/wezterm-windows.lua`) was derived from. Keeping it alongside the
Windows config provides a useful diff target. However, it should not remain in a top-level
`wezterm/` directory implying active use.

### Should `wezterm@nightly` Be Uninstalled on macOS?

**Probably yes**, but this is a user decision. It occupies disk space and creates confusion (binary
in PATH, app in Applications, but no config deployed). If there is no use case for WezTerm on
macOS, uninstall it.

### Windows: WezTerm Stays

WezTerm is the correct terminal choice on Windows. Ghostty has no Windows port and none is
committed for the near future ([ghostty-org/ghostty#2563](https://github.com/ghostty-org/ghostty/discussions/2563)).
The `windows/wezterm-windows.lua` config is well-adapted with Ctrl-based bindings for the
Synergy+AHK keyboard remapping chain.

---

## 6. Configuration Quality

### Code Quality: FAIR

**Strengths:**
- Clear section comments explaining each keybinding
- Consistent escape sequence format (`\x1b[NN;MOD~`) matching tmux user-keys
- Text editing bindings are comprehensive and follow macOS conventions
- Explicit preservation of Cmd+C/V with comments explaining why

**Weaknesses:**
- 27 lines of commented-out dead code (18% of file)
- The `gui-startup` event handler creates unused local variables `tab` and `pane` (line 6)
- No conditional logic or env var usage -- the Lua scripting power of WezTerm is entirely unused
- `config.native_macos_fullscreen_mode = true` (line 34) is set but fullscreen is not triggered
- `config.ssh_domains` defines a single host that standard SSH already handles
- The `WEZTERM_THEME` env var is ignored; `VisiBlue` is hardcoded

### Theme Drift Analysis

| Tool | Theme | Match? |
|------|-------|--------|
| Ghostty | Vercel | -- |
| WezTerm (macOS) | VisiBlue (terminal.sexy) | MISMATCH |
| WezTerm (Windows) | VisiBlue (terminal.sexy) | Matches macOS WezTerm |
| tmux | One Hunter Vercel | Matches Ghostty intent |
| Starship | Nord | Different |
| Neovim | Nord | Matches Starship |
| `.zshenv` WEZTERM_THEME | nord | Matches nothing (unused) |

The theme situation is a mess. Three different themes across the stack. The WezTerm config's
`VisiBlue` predates the Vercel theme migration visible in Ghostty and tmux. The `WEZTERM_THEME`
env var says `nord` but nothing reads it. This is classic configuration drift from an incomplete
terminal migration.

---

## 7. Architecture Assessment

### Leader Key / Prefix Conflict

The investigation prompt asked about a CTRL+A leader key conflict with tmux. **This is a
non-issue.** The WezTerm config does not define a leader key. There is no `config.leader`
anywhere in the file. The tmux prefix is explicitly `C-b` (tmux.conf line 10), and line 11
explicitly `unbind C-a`. There is no conflict.

### gui-startup Maximize Pattern

The `gui-startup` event maximizes the window on launch. This is a reasonable default for a
terminal-centric workflow, especially when tmux handles window management. However, since
WezTerm is not deployed on this machine, this is academic.

### SSH Domain Architecture

```
wezterm.lua SSH domain:     homelab → nyaptor@homelab
ssh-mesh/configs/mac.config: homelab → nyaptor@homelab (LAN/Tailscale smart routing)
```

The WezTerm SSH domain duplicates the SSH mesh config but with less sophistication. The SSH mesh
config has smart LAN-first routing with Tailscale fallback. The WezTerm SSH domain just uses the
bare hostname `homelab`, which resolves via `~/.ssh/config` anyway. The SSH domain feature is
WezTerm's built-in multiplexed SSH (serialized remote commands over a single SSH connection) --
this is a WezTerm-specific feature that does not map to Ghostty at all.

---

## 8. Missing Capabilities

These are capabilities that are configured in other parts of the stack but absent from WezTerm:

| Capability | Present In | Absent From WezTerm |
|------------|-----------|---------------------|
| Shell integration | Ghostty (`shell-integration = zsh`) | No equivalent configured |
| Background blur | Ghostty (`background-blur-radius = 20`) | Not available in WezTerm |
| Copy on select | Ghostty (`copy-on-select = clipboard`) | Not configured |
| Display P3 colorspace | Ghostty (`window-colorspace = display-p3`) | Not configured |
| Mouse hide while typing | Ghostty (`mouse-hide-while-typing = true`) | Not configured |
| Window save/restore | Ghostty (`window-save-state = always`) | Not configured |
| Auto-update | Ghostty (`auto-update = check`) | Not configured |
| macos-option-as-alt | Ghostty (`macos-option-as-alt = true`) | Handled via keybindings instead |

None of these matter since WezTerm is not deployed on macOS. They matter on Windows only to the
extent that `wezterm-windows.lua` should have equivalent features -- and several (like
`copy-on-select`) would improve the Windows experience.

---

## 9. Redundancies

### With Ghostty Config

| Feature | WezTerm (`wezterm.lua`) | Ghostty (`config`) | Redundant? |
|---------|------------------------|-------------------|------------|
| Font | GeistMono Nerd Font DemiBold | GeistMono Nerd Font DemiBold | Yes -- identical |
| Opacity | 0.90 | 0.80 | Partial -- different values |
| Tab bar | Disabled | N/A (uses tmux) | Yes -- same intent |
| Close confirmation | NeverPrompt | confirm-close-surface = false | Yes -- same intent |
| Text editing keys | 8 bindings (Opt/Cmd + arrows/backspace) | 6 bindings (alt/super + arrows/backspace) | Yes -- identical escape sequences |
| Tmux selection keys | 4 bindings (Cmd/Opt+Shift+arrows) | 4 bindings (super/alt+shift+arrows) | Yes -- identical escape sequences |
| Tmux window management | 14 bindings (Cmd+T/W/1-9/D/K/[/]) | **0 bindings** | **NOT redundant -- Ghostty is MISSING these** |

### With SSH Mesh

The WezTerm SSH domain for `homelab` is fully redundant with `ssh-mesh/configs/mac.config`. The
SSH mesh config is more sophisticated (LAN-first routing). The WezTerm SSH domain adds no value.

### With tmux.conf Documentation

`tmux.conf` line 45 says "Custom escape sequences from WezTerm" -- this should be updated to
reflect that both Ghostty and WezTerm send these sequences. Or, more accurately, that Ghostty
sends only the selection sequences while the window management sequences are only configured in
WezTerm.

---

## 10. Ambiguities

| Ambiguity | Location | Question |
|-----------|----------|----------|
| **WezTerm installed but not configured** | `~/.config/wezterm/` missing | Is `wezterm@nightly` kept intentionally for occasional testing, or was uninstalling it just forgotten? |
| **`install.sh` still creates WezTerm symlink** | `install.sh:138-143` | On a fresh install, this would create the symlink and deploy WezTerm config. Is that intended, or should it be removed to match the commented-out `symlinks.conf`? |
| **Ghostty missing tmux keybindings** | `ghostty/config` | Were the Cmd+T/W/1-9/D/K keybindings intentionally omitted from Ghostty (relying on tmux prefix instead), or was this an oversight during migration? |
| **WEZTERM_THEME env var** | `zsh/.zshenv:24` | This exports `nord` but nothing reads it. Remove it, or wire it into `wezterm.lua` via `os.getenv()`? |
| **Theme divergence** | Multiple files | Is `VisiBlue` vs `Vercel` intentional (different terminal = different theme) or drift from incomplete migration? |
| **`wezterm/` directory location** | Repo root | Should this move into `windows/` since its only active consumer is the Windows machine? |

---

## 11. Recommendations

### Priority 0: Fix Ghostty Tmux Keybindings (NOT a WezTerm issue, but discovered here)

The Ghostty config is missing 14 tmux integration keybindings. This is the most impactful
finding. Add to `ghostty/config`:

```
# === Tmux Integration: Browser-like window management ===
# Cmd+T: New tmux window
keybind = super+t=text:\x1b[84;CMD~
# Cmd+W: Close pane/window
keybind = super+w=text:\x1b[87;CMD~
# Cmd+1-9: Switch tmux window
keybind = super+one=text:\x1b[49;CMD~
keybind = super+two=text:\x1b[50;CMD~
keybind = super+three=text:\x1b[51;CMD~
keybind = super+four=text:\x1b[52;CMD~
keybind = super+five=text:\x1b[53;CMD~
keybind = super+six=text:\x1b[54;CMD~
keybind = super+seven=text:\x1b[55;CMD~
keybind = super+eight=text:\x1b[56;CMD~
keybind = super+nine=text:\x1b[57;CMD~
# Cmd+Shift+[/]: Previous/Next window
keybind = super+shift+left_bracket=text:\x1b[91;CMS~
keybind = super+shift+right_bracket=text:\x1b[93;CMS~
# Cmd+D: Split vertically, Cmd+Shift+D: Split horizontally
keybind = super+d=text:\x1b[68;CMD~
keybind = super+shift+d=text:\x1b[68;CMS~
# Cmd+K: Clear scrollback
keybind = super+k=text:\x1b[75;CMD~
```

**Note**: Ghostty 1.2.0+ maps Cmd+1-9 to `goto_tab` by default. These `text:` keybinds should
override the defaults, but verify that Ghostty's built-in tab keybindings do not intercept first.
If they do, unbind them explicitly with `keybind = super+one=unbind` before the `text:` binding.

### Priority 1: Clean Up macOS WezTerm Artifacts

1. **Remove `WEZTERM_THEME` from `.zshenv`** -- dead env var, consumed by nothing
2. **Remove WezTerm symlink code from `install.sh`** (lines 138-143) -- conflicts with
   commented-out `symlinks.conf` entry; creates confusion on fresh install
3. **Remove commented-out dead code from `wezterm.lua`** -- background image block (131-148)
   and startup args (7-16)
4. **Update `tmux.conf` line 45 comment** -- change "from WezTerm" to "from terminal (Ghostty/WezTerm)"

### Priority 2: Decide WezTerm's macOS Fate

Two options:

**Option A: Uninstall WezTerm on macOS (recommended)**
```bash
brew uninstall wezterm@nightly
rm -rf ~/.config/wezterm/  # already gone, but be explicit
```
Then move `wezterm/wezterm.lua` into `windows/wezterm-macos-reference.lua` to preserve it as
the Windows config's reference implementation.

**Option B: Keep WezTerm as emergency fallback**
Uncomment the symlinks.conf entry, remove the install.sh special-casing, and document the
intent: "WezTerm is installed as a fallback terminal in case Ghostty has issues."

### Priority 3: Consolidate WezTerm Configs Under `windows/`

If Option A is chosen, the directory structure should become:

```
windows/
  wezterm-windows.lua          # Active Windows config (already here)
  wezterm-macos-reference.lua  # Moved from wezterm/wezterm.lua
  setup.ps1                    # Already here
  ...
```

Delete the now-empty `wezterm/` directory. Update `CLAUDE.md` directory structure docs to remove
the `wezterm/` entry.

### Priority 4: Theme Reconciliation

The theme fragmentation across the stack (VisiBlue, Vercel, Nord, One Hunter Vercel) should be
addressed holistically, not just for WezTerm. At minimum:
- If WezTerm stays for Windows, update `windows/wezterm-windows.lua` color scheme to match the
  Vercel family (or accept the intentional divergence and document it)
- Remove the unused `WEZTERM_THEME` env var regardless

---

## Summary

| Area | Score | Notes |
|------|-------|-------|
| Current Setup | POOR | Installed but not configured; symlink missing; dead artifacts everywhere |
| Intent Clarity | FAIR | Clearly legacy on macOS, but cleanup was never finished |
| Cross-Domain | POOR | Dead env vars, stale docs, redundant SSH domains, inconsistent install paths |
| Best Practices | POOR | Dead code, theme drift, hardcoded paths, unused env vars |
| Tool Choice | GOOD | WezTerm for Windows is correct; Ghostty for macOS is correct |
| Config Quality | FAIR | Well-commented keybindings, but dead code and no Lua dynamism |
| Architecture | FAIR | Escape sequence protocol is well-designed; SSH domain is redundant |
| Missing Capabilities | N/A | Not applicable -- WezTerm is not deployed on macOS |
| Redundancies | HIGH | Nearly everything overlaps with Ghostty except the tmux keybindings Ghostty lacks |
| Ambiguities | HIGH | 6 open questions about intent |

**Overall Health: POOR** -- The WezTerm macOS configuration is a ghost. It exists in the repo,
is partially referenced by `install.sh`, has an installed binary, but is not actually deployed.
The most valuable thing this audit found is not about WezTerm at all: the Ghostty config is
missing 14 tmux integration keybindings that were the primary value of the WezTerm config.

---

## Sources

- [Ghostty vs WezTerm 2026 (Scopir)](https://scopir.com/posts/ghostty-vs-wezterm-2026/)
- [Modern Terminal Emulators 2026 (Calmops)](https://calmops.com/tools/modern-terminal-emulators-2026-ghostty-wezterm-alacritty/)
- [WezTerm: Thoughts about Ghostty (Discussion #6520)](https://github.com/wezterm/wezterm/discussions/6520)
- [Ghostty Windows Support (Discussion #2563)](https://github.com/ghostty-org/ghostty/discussions/2563)
- [Moving to Ghostty from WezTerm (Oli Morris)](https://blog.olimorris.com/2025/12/06/moving-to-ghostty-from-wezterm/)
- [Ghostty + tmux Keybinding Discussion (#3309)](https://github.com/ghostty-org/ghostty/discussions/3309)
- [Ghostty Cmd+Number Default Keybindings Break tmux (#8756)](https://github.com/ghostty-org/ghostty/discussions/8756)
- [Ghostty Keybind Reference](https://ghostty.org/docs/config/keybind/reference)
- [Choosing a Terminal on macOS 2025 (Medium)](https://medium.com/@dynamicy/choosing-a-terminal-on-macos-2025-iterm2-vs-ghostty-vs-wezterm-vs-kitty-vs-alacritty-d6a5e42fd8b3)
