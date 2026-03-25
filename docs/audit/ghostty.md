# Ghostty Configuration Audit

> File: `/Users/leonardoacosta/dev/if/ghostty/config` (59 lines)
> Symlinked to: `~/.config/ghostty/config`
> Generated: 2026-03-25
> Health Score: **FAIR**

---

## 1. Current Setup

Every configuration option set, what it does, and how it compares to defaults.

### Font (lines 4-8)

| Option | Value | Default | Effect |
|--------|-------|---------|--------|
| `font-family` | `GeistMono Nerd Font Mono` | JetBrains Mono (built-in) | Sets primary font face |
| `font-style` | `DemiBold` | `regular` | Sets weight to DemiBold (semi-bold) |
| `font-size` | `13` | `13` (macOS) / `10.5` (Linux) | **Matches default on macOS** |
| `font-thicken` | `true` | `false` | Applies macOS-specific glyph thickening for retina displays |

### Theme / Appearance (lines 10-19)

| Option | Value | Default | Effect |
|--------|-------|---------|--------|
| `theme` | `Vercel` | none (default Ghostty palette) | Applies the Vercel color scheme (built-in, sourced from iterm2-color-schemes) |
| `background-opacity` | `0.80` | `1.0` | 20% transparency; enables window blur compositing |
| `background-blur-radius` | `20` | `20` | Blur intensity behind transparent background (matches Ghostty's own default when blur is active) |
| `window-decoration` | `true` | `true` | **Matches default** |
| `macos-titlebar-style` | `tabs` | `transparent` | Integrates Ghostty tabs into the macOS titlebar |
| `window-padding-x` | `10` | `2` | Horizontal padding in pixels |
| `window-padding-y` | `10` | `2` | Vertical padding in pixels |
| `window-padding-balance` | `true` | `false` | Distributes extra padding evenly across all four edges |
| `window-colorspace` | `display-p3` | `srgb` | Uses the wider Display P3 color gamut (macOS native) |

### Behavior (lines 21-27)

| Option | Value | Default | Effect |
|--------|-------|---------|--------|
| `confirm-close-surface` | `false` | `true` | Disables close confirmation dialog for tabs/splits |
| `auto-update` | `check` | `check` | **Matches default** |
| `copy-on-select` | `clipboard` | `true` (selection clipboard) | Copies selected text to **system clipboard** instead of selection clipboard |
| `mouse-hide-while-typing` | `true` | `false` | Hides mouse cursor during keyboard input |
| `scrollback-limit` | `10000` | `10000000` (10 million bytes) | **Drastically reduced** -- limits scrollback to 10KB (likely a unit confusion; this is bytes, not lines) |

### macOS Specific (lines 29-30)

| Option | Value | Default | Effect |
|--------|-------|---------|--------|
| `macos-option-as-alt` | `true` | `false` | Treats Option key as Alt for terminal escape sequences |
| `window-save-state` | `always` | `default` | Always saves and restores window positions, tabs, and splits |

### Shell Integration (lines 32-34)

| Option | Value | Default | Effect |
|--------|-------|---------|--------|
| `shell-integration` | `zsh` | `detect` (auto-detect) | Forces zsh shell integration |
| `shell-integration-features` | `cursor,sudo,title,ssh-env,ssh-terminfo` | `cursor,sudo,title` | Adds SSH environment forwarding and terminfo installation |

### Keybindings (lines 36-58)

| Keybind | Action | Escape Sequence | Purpose |
|---------|--------|-----------------|---------|
| `alt+left` | `text:\x1bb` | ESC b | Move word backward |
| `alt+right` | `text:\x1bf` | ESC f | Move word forward |
| `alt+backspace` | `text:\x1b\x7f` | ESC DEL | Delete word backward |
| `super+left` | `text:\x01` | Ctrl-A | Beginning of line |
| `super+right` | `text:\x05` | Ctrl-E | End of line |
| `super+backspace` | `text:\x15` | Ctrl-U | Delete to beginning of line |
| `super+shift+left` | `text:\x1b[60;CMS~` | Custom escape | Select to beginning of line (tmux copy mode) |
| `super+shift+right` | `text:\x1b[62;CMS~` | Custom escape | Select to end of line (tmux copy mode) |
| `alt+shift+left` | `text:\x1b[60;OMS~` | Custom escape | Select word backward (tmux copy mode) |
| `alt+shift+right` | `text:\x1b[62;OMS~` | Custom escape | Select word forward (tmux copy mode) |

---

## 2. Intent Analysis

The configuration reveals a clear workflow philosophy:

1. **Ghostty as a thin rendering layer** -- The terminal provides appearance, font rendering, and macOS integration. It defers multiplexing (tabs, splits, sessions) entirely to tmux.
2. **Browser-like UX via tmux** -- The WezTerm config (the previous terminal) forwarded Cmd+T, Cmd+W, Cmd+1-9, Cmd+D, Cmd+Shift+D, Cmd+K, etc., as custom escape sequences to tmux for browser-style tab management. The Ghostty config only partially implements this pattern (text editing and selection), leaving all tmux window/pane management bindings absent.
3. **macOS-native feel** -- `macos-option-as-alt`, Display P3 colorspace, titlebar-as-tabs, and window save state all target a polished macOS experience.
4. **Visual aesthetic** -- The Vercel theme, background transparency with blur, and increased padding create a specific visual identity consistent with the tmux One Hunter Vercel theme.
5. **SSH-aware** -- Shell integration includes `ssh-env` and `ssh-terminfo`, reflecting a multi-machine workflow (Mac + Homelab + CloudPC per the ssh-mesh setup).

---

## 3. Cross-Domain Interactions

| Ghostty Setting | Depends On | Depended On By | Fragility |
|-----------------|-----------|----------------|-----------|
| `theme = Vercel` | Built-in iterm2-color-schemes (updated weekly) | tmux `one-hunter-vercel-theme.conf` (visual consistency) | **LOW** -- built-in, confirmed present |
| `background-opacity = 0.80` | macOS compositor / GPU | Visual identity of entire terminal | **MEDIUM** -- disabled in native fullscreen; changes require Ghostty restart |
| `macos-titlebar-style = tabs` | macOS window manager | Ghostty native tabs (if used) | **MEDIUM** -- conflicts if tmux handles all tabbing; tabs show but serve no purpose |
| `macos-option-as-alt = true` | macOS keyboard system | `alt+left/right/backspace` keybindings; zsh word navigation | **HIGH** -- if disabled, all Alt-based keybindings stop working |
| `shell-integration-features = ...,ssh-env,ssh-terminfo` | Remote host SSH access | cmux-workspaces.sh, ssh-mesh hosts | **MEDIUM** -- `ssh-terminfo` can fail on restricted hosts (e.g., AWS EC2) |
| Custom escape sequences (CMS~/OMS~) | tmux `user-keys[16-19]` definitions | Text selection in tmux copy mode | **HIGH** -- sequences must exactly match tmux.conf; any mismatch = dead keys |
| `copy-on-select = clipboard` | macOS clipboard | tmux `copy-pipe-and-cancel "pbcopy"` | **LOW** -- complementary; Ghostty handles selection copies, tmux handles vi-mode copies |
| `super+left = text:\x01` (Ctrl-A) | Shell readline / tmux prefix | If tmux prefix were Ctrl-A, this would trigger prefix instead of line-start | **LOW** -- tmux uses Ctrl-B prefix (confirmed line 10 of tmux.conf) |
| `font-family = GeistMono Nerd Font Mono` | Homebrew cask `font-geist-mono-nerd-font` | Starship prompt icons, tmux status bar powerline glyphs | **MEDIUM** -- Ghostty has built-in nerd font icons; the external font is redundant for icons |
| `scrollback-limit = 10000` | None | Ghostty scrollback buffer | **HIGH** -- this is 10KB in bytes, not 10000 lines; severely limited |

---

## 4. Best Practices Audit

Based on web research of Ghostty configuration best practices in 2025-2026:

### Matches Best Practices

- **Minimal configuration philosophy**: Ghostty's "zero config" ethos recommends starting with defaults and customizing only what matters. This config has 25 settings -- lean and purposeful.
- **`macos-option-as-alt = true`**: Universally recommended for developers using Alt-based terminal shortcuts on macOS.
- **`shell-integration-features` with SSH**: Enabling `ssh-env` and `ssh-terminfo` is the recommended setup for multi-machine workflows.
- **`window-save-state = always`**: Best practice for preserving workspace across restarts.
- **`window-colorspace = display-p3`**: Correct for macOS users wanting accurate color reproduction.

### Deviates from Best Practices

- **`scrollback-limit = 10000`**: This is almost certainly a unit confusion. The value is in **bytes**, not lines. 10KB of scrollback is approximately 40-80 lines of terminal output. The default is 10,000,000 bytes (~10MB). This should either be removed (to use the default) or set to something like `10000000` or higher.
- **Missing `clipboard-paste-protection`**: Not explicitly set (defaults to `true`), but given the security-conscious SSH workflow, this should be explicit.
- **`confirm-close-surface = false`**: While convenient, this removes the safety net against accidentally closing tabs with running processes. Best practice recommends leaving it at `true` or setting it to the process-aware default.
- **Hardcoded `shell-integration = zsh`**: The default `detect` is more robust and handles edge cases where the shell might change (e.g., dropping into bash for debugging).
- **No light/dark theme switching**: Ghostty supports `theme = "light:ThemeA,dark:ThemeB"` for automatic switching with macOS appearance. The current config uses a single dark theme.

### Community-Recommended Additions Missing

- **`clipboard-paste-protection = true`** (explicit security)
- **`font-thicken-strength`** (fine-grained control, available since ~1.2)
- **`resize-overlay = never`** (many users disable the resize overlay)
- **`keybind = cmd+enter=toggle_fullscreen`** (common macOS binding)

Sources:
- [Ghostty Configuration Docs](https://ghostty.org/docs/config)
- [Minimal Ghostty Config Guide](https://samuellawrentz.com/blog/minimal-ghostty-config/)
- [Ghostty Option Reference](https://ghostty.org/docs/config/reference)
- [Ghostty Setup Guide](https://www.bitdoze.com/ghostty-terminal/)

---

## 5. Tool Choices

### Is Ghostty the Right Terminal?

**Given this user's workflow (macOS primary, tmux-centric, SSH mesh, visual aesthetics), Ghostty is the correct choice.** Here is the comparison:

| Criterion | Ghostty | Kitty | Alacritty | WezTerm |
|-----------|---------|-------|-----------|---------|
| macOS native feel | Native Cocoa UI | AppKit but less polished | Minimal, no native features | Cross-platform, non-native |
| GPU performance | 2-5x faster than WezTerm | Comparable | Leanest (30MB RAM) | Slowest of the four |
| tmux integration | Good (escape sequences) | Good (escape sequences) | Good (no built-in mux) | Best (Lua scripting) |
| Configuration | Plain text, simple | `.conf` file, moderate | TOML, very simple | Lua scripting, complex |
| Built-in multiplexing | Tabs + splits | Tabs + splits + kittens | None (by design) | Full multiplexer |
| Shell integration | Best-in-class (cursor, sudo, SSH) | Good | None | Basic |
| Cross-platform | macOS + Linux | macOS + Linux | macOS + Linux + Windows | macOS + Linux + Windows |
| Nerd font support | Built-in icons | Via font | Via font | Via font |
| Theme ecosystem | 460+ built-in | Community themes | Community themes | Community themes |

**Verdict**: Ghostty is the strongest choice for this workflow. The only scenario where WezTerm would be preferable is if the user needed Windows support or deep Lua scripting for terminal-level automation. The user already has a WezTerm config (`wezterm/wezterm.lua`) as a fallback, which is the correct strategy.

**One concern**: The migration from WezTerm to Ghostty appears incomplete. The WezTerm config has 17 tmux-forwarding keybindings; the Ghostty config has only 10 (all text-editing). The browser-like tmux bindings (Cmd+T, Cmd+W, Cmd+1-9, Cmd+D, Cmd+Shift+D, Cmd+K, Cmd+Shift+[/]) are entirely missing from Ghostty.

Sources:
- [Ghostty vs WezTerm 2026](https://scopir.com/posts/ghostty-vs-wezterm-2026/)
- [Modern Terminal Emulators 2026](https://calmops.com/tools/modern-terminal-emulators-2026-ghostty-wezterm-alacritty/)
- [macOS Terminal Comparison 2025](https://medium.com/@dynamicy/choosing-a-terminal-on-macos-2025-iterm2-vs-ghostty-vs-wezterm-vs-kitty-vs-alacritty-d6a5e42fd8b3)
- [WezTerm Discussion](https://github.com/wezterm/wezterm/discussions/6520)

---

## 6. Configuration Quality

### Unused or Redundant Options

| Option | Issue | Severity |
|--------|-------|----------|
| `font-family = GeistMono Nerd Font Mono` | Ghostty has built-in nerd font icons since 1.0. Using the "Nerd Font Mono" variant is unnecessary for icon rendering. You could use the non-Nerd-Font version `Geist Mono` and still get all icons via Ghostty's built-in support. | LOW |
| `background-blur-radius = 20` | This is the default blur value when blur is active. Setting it explicitly adds no value. | LOW |
| `window-decoration = true` | This is the default. Setting it explicitly adds no value. | LOW |
| `auto-update = check` | This is the default. Setting it explicitly adds no value. | LOW |

### Missing Options (Should Be Present)

| Missing Option | Why It Matters | Severity |
|----------------|---------------|----------|
| tmux browser-style keybindings (Cmd+T, Cmd+W, Cmd+1-9, Cmd+D, etc.) | The WezTerm config has 12 tmux-forwarding bindings for window/pane management that are completely absent from the Ghostty config. Without these, the user must fall back to tmux prefix (Ctrl-B) for all window operations. | **CRITICAL** |
| `keybind = super+physical:one=text:...` through `super+physical:nine=text:...` | Ghostty 1.2+ defaults Cmd+1-9 to `goto_tab`. These must be explicitly unbound and rebound for tmux window switching. Without this, Cmd+1-9 switches Ghostty tabs (which are useless when tmux handles tabbing). | **CRITICAL** |
| `clipboard-paste-protection = true` | Should be explicit for a security-conscious multi-machine workflow. | MEDIUM |
| `keybind = super+k=text:\x1b[75;CMD~` | Cmd+K for scrollback clear is missing (present in WezTerm config). | MEDIUM |

### Anti-Patterns

| Pattern | Issue | Line |
|---------|-------|------|
| `scrollback-limit = 10000` | Almost certainly a unit confusion. 10000 bytes = ~40-80 lines of scrollback. Either remove this line entirely (default is 10MB) or set to a sensible byte value like `10000000`. | Line 27 |
| `shell-integration = zsh` | Hardcoding the shell type instead of using `detect` is fragile. If the user ever opens a bash session inside Ghostty, shell integration won't work. | Line 33 |
| `macos-titlebar-style = tabs` without using Ghostty tabs | The titlebar is configured to show tabs, but the user's workflow uses tmux for all tabbing. This creates a visual element (a single, always-present Ghostty tab) that serves no purpose and wastes vertical space. Consider `transparent` or `hidden` instead. | Line 15 |

---

## 7. Architecture Assessment

### Strengths

1. **Clean separation of concerns**: Ghostty handles rendering; tmux handles multiplexing. This is architecturally sound.
2. **Consistent visual identity**: Vercel theme in Ghostty + One Hunter Vercel theme in tmux creates a cohesive appearance.
3. **SSH-forward-looking**: The `ssh-env` and `ssh-terminfo` shell integration features demonstrate awareness of the multi-machine workflow.
4. **macOS-optimized**: Display P3, option-as-alt, window save state, and font thickening show deliberate macOS tuning.

### Weaknesses

1. **Incomplete WezTerm-to-Ghostty migration**: The Ghostty config is missing 12 tmux-forwarding keybindings that exist in the WezTerm config. This is the single largest gap. The text-editing bindings were ported; the tmux window/pane management bindings were not.
2. **Conflicting tab model**: `macos-titlebar-style = tabs` enables Ghostty's native tabs, but tmux manages all tabs. These two tab systems will fight for the user's attention and keyboard shortcuts (Cmd+1-9 defaults to Ghostty tabs in 1.2+, not tmux windows).
3. **scrollback-limit is broken**: 10KB scrollback is functionally unusable for any real work.
4. **No Ghostty-native actions used**: Every keybinding sends raw escape sequences. Ghostty provides native actions like `new_tab`, `close_surface`, `toggle_split`, `goto_split`, etc. For operations that don't involve tmux (like opening a new Ghostty window), native actions would be more reliable.

---

## 8. Missing Capabilities

| Capability | Current State | Recommendation |
|-----------|---------------|----------------|
| **Cmd+T/W/D tmux forwarding** | Absent | Add the 12 missing keybindings from the WezTerm config, using `text:` escape sequences matching the tmux user-keys |
| **Cmd+1-9 tmux window switching** | Absent (Ghostty defaults hijack these for native tabs) | Unbind defaults with `keybind = super+physical:one=unbind` then rebind with tmux escape sequences |
| **Cmd+Shift+[/] tab navigation** | Absent | Add as tmux previous/next-window forwarding |
| **Cmd+K clear scrollback** | Absent | Add tmux forwarding or use native `reset_terminal` action |
| **Cmd+N new window** | Absent | Use Ghostty native `new_window` action |
| **Cmd+Q quit** | Absent | Use Ghostty native `quit` action (or leave to macOS default) |
| **Cmd+C/V copy/paste** | Not explicitly handled | Ghostty's defaults handle this, but explicit bindings ensure tmux doesn't intercept |
| **Light/dark theme switching** | Single dark theme only | Use `theme = "light:Vercel Light,dark:Vercel"` if a light variant exists |
| **Quick terminal (hotkey window)** | Not configured | Ghostty supports `keybind = global:...=toggle_quick_terminal` for a system-wide dropdown terminal |

---

## 9. Redundancies

| Redundancy | Details | Impact |
|-----------|---------|--------|
| Nerd Font when Ghostty has built-in icons | `GeistMono Nerd Font Mono` is used, but Ghostty renders nerd font icons natively without needing the Nerd Font patched variant. Using the standard `Geist Mono` font would produce identical icon rendering with a cleaner font file. | LOW -- no functional impact; wastes a font installation |
| `background-blur-radius = 20` | This is the default when blur is active. Removing it changes nothing. | NONE |
| `window-decoration = true` | Default value, explicitly stated. | NONE |
| `auto-update = check` | Default value, explicitly stated. | NONE |
| Dual tab systems | `macos-titlebar-style = tabs` enables Ghostty tabs while tmux provides tabs. The Ghostty tab bar shows a single tab that does nothing. | LOW -- wastes ~22px of vertical space |

---

## 10. Ambiguities

These items are flagged as unclear; I will not guess at intent.

| Item | Ambiguity | Line |
|------|-----------|------|
| `scrollback-limit = 10000` | Is this intentionally 10KB, or did the author intend 10,000 lines? Ghostty uses bytes, not lines. The default is 10,000,000 bytes. | 27 |
| Missing tmux keybindings | Were the browser-style tmux bindings (Cmd+T, Cmd+W, Cmd+1-9, etc.) intentionally omitted because the user switched to a different workflow, or is this an incomplete migration from WezTerm? | N/A |
| `macos-titlebar-style = tabs` | Is this set for visual aesthetics (integrated titlebar look) or because the user intends to use Ghostty native tabs alongside tmux? | 15 |
| `copy-on-select = clipboard` | Is this chosen over `true` (selection clipboard) deliberately, or is the user unaware of the distinction? On macOS the selection clipboard is largely unused, so `clipboard` is reasonable, but on Linux this would override the standard X11 selection behavior. | 24 |
| `shell-integration = zsh` | Is this hardcoded because the user exclusively uses zsh, or was `detect` not known to exist? | 33 |
| `confirm-close-surface = false` | Is this set because tmux preserves sessions (so closing Ghostty is safe), or is the user simply annoyed by the dialog? | 22 |

---

## 11. Recommendations

### Critical

1. **Fix `scrollback-limit`** (line 27)
   - Current: `scrollback-limit = 10000` (10KB = ~40-80 lines)
   - Fix: Remove the line entirely (default is 10MB) or set to `scrollback-limit = 10000000`
   - Impact: Without this fix, scrolling back through command output is nearly impossible

2. **Add missing tmux browser-style keybindings**
   - Port the 12 tmux-forwarding keybindings from `wezterm/wezterm.lua` (lines 54-84) to the Ghostty config
   - Must unbind Ghostty's default Cmd+1-9 tab switching first (they conflict with tmux window switching since Ghostty 1.2)
   - Required bindings:
     ```
     # Unbind Ghostty default tab switching
     keybind = super+physical:one=unbind
     keybind = super+physical:two=unbind
     # ... through nine

     # Tmux window/pane management
     keybind = super+t=text:\x1b[84;CMD~
     keybind = super+w=text:\x1b[87;CMD~
     keybind = super+physical:one=text:\x1b[49;CMD~
     # ... through nine
     keybind = super+d=text:\x1b[68;CMD~
     keybind = super+shift+d=text:\x1b[68;CMS~
     keybind = super+k=text:\x1b[75;CMD~
     keybind = super+shift+left_bracket=text:\x1b[91;CMS~
     keybind = super+shift+right_bracket=text:\x1b[93;CMS~
     ```
   - Impact: Without these, all tmux window management requires the Ctrl-B prefix, destroying the browser-like UX that the tmux.conf is designed to provide

### Important

3. **Resolve the tab model conflict** (line 15)
   - `macos-titlebar-style = tabs` shows a Ghostty tab bar, but tmux handles all tabbing
   - If Ghostty tabs are not used: change to `macos-titlebar-style = transparent` or `hidden` to reclaim vertical space
   - If the integrated titlebar look is desired without the tab: `tabs` is acceptable but adds visual noise

4. **Change `shell-integration` to `detect`** (line 33)
   - `detect` is more robust and handles bash/fish sessions inside Ghostty
   - Hardcoding `zsh` breaks integration if you ever `exec bash` for debugging

5. **Explicitly set `clipboard-paste-protection = true`** (missing)
   - Given the multi-machine SSH workflow, paste protection is a security best practice
   - Prevents accidental execution of clipboard content containing newlines

6. **Consider using standard `Geist Mono` instead of `GeistMono Nerd Font Mono`** (line 5)
   - Ghostty has built-in nerd font icon rendering since 1.0
   - Using the non-Nerd-Font variant avoids potential glyph width issues while retaining all icon support
   - See: [Ghostty NerdFont Discussion](https://github.com/ghostty-org/ghostty/discussions/7905)

### Nice-to-Have

7. **Remove redundant defaults** (lines 14, 13, 23)
   - `window-decoration = true`, `background-blur-radius = 20`, and `auto-update = check` all match defaults
   - Removing them reduces config noise; Ghostty's `+show-config --default --docs` command documents all defaults

8. **Add `keybind = global:super+grave_accent=toggle_quick_terminal`** (missing)
   - Enables a system-wide hotkey for a dropdown Ghostty terminal
   - Popular feature unique to Ghostty among GPU-accelerated terminals

9. **Explore light/dark theme auto-switching** (line 11)
   - If a "Vercel Light" variant exists or can be created, use: `theme = light:VercelLight,dark:Vercel`
   - Ghostty automatically switches based on macOS appearance settings

10. **Add `font-thicken-strength` for fine-tuning** (after line 8)
    - Available since Ghostty ~1.2; allows values 0-255 instead of the binary true/false of `font-thicken`
    - Useful for tuning appearance on external (non-Retina) displays

---

## Investigation Point Results

### Custom keybindings: escape sequences vs Ghostty-native actions?

The `text:\x01` (Ctrl-A) and `text:\x1bb` (ESC-b) approach for **text editing** is correct and necessary. These escape sequences are what readline/zsh actually interpret for word movement and line navigation. There is no Ghostty-native action equivalent for "move word forward in the shell."

For **tmux operations** (new window, close, split, window switching), the custom escape sequence approach (`\x1b[84;CMD~` etc.) routed through tmux's `user-keys` is also the correct pattern. Ghostty-native actions like `new_tab` would create Ghostty tabs, not tmux windows -- the wrong abstraction layer for this workflow.

The one exception: `Cmd+N` (new Ghostty window) and `Cmd+Q` (quit) should use Ghostty-native `new_window` and `quit` actions since they operate at the terminal level, not the tmux level.

### Keybinding conflicts with macOS defaults?

- `super+left/right` overrides macOS Mission Control "Move to Desktop Left/Right." This is acceptable because most developers disable or rebind these in System Settings.
- `alt+left/right` does not conflict; macOS uses these for text navigation in native apps, and the Ghostty bindings produce the same behavior in the terminal.
- `super+shift+left/right` overrides nothing in standard macOS.
- The **major conflict** is Cmd+1-9: Ghostty 1.2+ defaults these to `goto_tab`, which intercepts them before tmux can see them. This MUST be explicitly unbound.

### background-opacity + background-blur-radius performance?

The blur radius of 20 is Ghostty's own default and is described as "reasonable for a good looking blur." On macOS, Ghostty uses the native compositor (Core Animation) for blur, so the GPU overhead is minimal and handled by the window server, not Ghostty itself. No measurable performance impact has been reported at this value. Note: background opacity is automatically disabled in native fullscreen mode.

### Shell integration features: should no-command-mark be enabled?

`no-command-mark` suppresses the command prompt marks that Ghostty's shell integration inserts. Unless you are seeing visual artifacts from prompt marks, leave it disabled (current config is correct). The current set (`cursor,sudo,title,ssh-env,ssh-terminfo`) is comprehensive and correct for this workflow.

### GeistMono Nerd Font Mono: optimal variant?

"Nerd Font Mono" forces all icons to single-cell width, which is correct for terminal use (avoids alignment issues). However, since Ghostty has built-in nerd font rendering, using the Nerd Font variant is redundant. The standard `Geist Mono` font would produce identical results. If you prefer using the Nerd Font variant for compatibility with other terminals or editors, it does no harm -- it is just unnecessary.

### Vercel theme: built-in?

**Confirmed built-in.** Running `ghostty +list-themes | grep -i vercel` on the installed Ghostty instance returns `Vercel (resources)`. No separate installation needed.

### window-padding-x/y = 4 vs actual 10?

The config actually sets padding to 10, not 4. At font-size 13 with GeistMono, 10px padding is reasonable and provides comfortable breathing room. The default is 2px, which many users find too tight.

### macos-titlebar-style = tabs with tmux?

This creates a visual conflict. The titlebar shows Ghostty's native tab bar (with a single, lonely tab since tmux handles all tabbing), while tmux shows its own tab bar at the bottom. Two tab bars, one functional, one decorative. Using `transparent` or `hidden` would eliminate the wasted space.

### clipboard-read/write = allow: security implications?

These are not explicitly set in the config, meaning they use defaults. The default for `clipboard-read` is `ask` (prompts when a program tries to read the clipboard via OSC 52), and `clipboard-write` is `allow`. This is the recommended security posture: programs can write to the clipboard freely (e.g., tmux copy-pipe) but must ask permission to read it (prevents exfiltration of clipboard contents by malicious programs).

### copy-on-select = clipboard: standard or unusual?

Slightly non-standard. Most terminals default to the selection clipboard (middle-click paste on Linux). On macOS, the selection clipboard is unused by the OS, so `clipboard` is arguably more useful -- selected text goes directly to Cmd+V. On Linux, this would override the expected X11 behavior. Since this is a macOS-primary config, `clipboard` is a defensible choice.

Sources:
- [Ghostty Configuration Docs](https://ghostty.org/docs/config)
- [Ghostty Option Reference](https://ghostty.org/docs/config/reference)
- [Ghostty Shell Integration](https://ghostty.org/docs/features/shell-integration)
- [Ghostty Keybind Reference](https://ghostty.org/docs/config/keybind/reference)
- [Ghostty Theme Docs](https://ghostty.org/docs/features/theme)
- [Ghostty vs WezTerm 2026](https://scopir.com/posts/ghostty-vs-wezterm-2026/)
- [Ghostty tmux Escape Sequences Discussion](https://github.com/ghostty-org/ghostty/discussions/3309)
- [Ghostty Cmd+Number Conflict Discussion](https://github.com/ghostty-org/ghostty/discussions/8756)
- [Ghostty Cmd+Number Mapping Discussion](https://github.com/ghostty-org/ghostty/discussions/3447)
- [Ghostty NerdFont Variants Discussion](https://github.com/ghostty-org/ghostty/discussions/7905)
- [Ghostty font-thicken Discussion](https://github.com/ghostty-org/ghostty/discussions/3492)
- [Ghostty macos-titlebar-style Discussion](https://github.com/ghostty-org/ghostty/discussions/9553)
- [Minimal Ghostty Config Guide](https://samuellawrentz.com/blog/minimal-ghostty-config/)
- [Replacing tmux with Ghostty](https://sterba.dev/posts/replacing-tmux/)
- [Modern Terminal Emulators 2026](https://calmops.com/tools/modern-terminal-emulators-2026-ghostty-wezterm-alacritty/)
- [macOS Terminal Comparison 2025](https://medium.com/@dynamicy/choosing-a-terminal-on-macos-2025-iterm2-vs-ghostty-vs-wezterm-vs-kitty-vs-alacritty-d6a5e42fd8b3)
