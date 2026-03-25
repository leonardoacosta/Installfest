# Tmux Configuration Audit

> Adversarial audit of tmux configuration in `/Users/leonardoacosta/dev/if`
> Scope: `tmux/tmux.conf`, `tmux/one-hunter-vercel-theme.conf`
> Generated: 2026-03-25

**Health Score: FAIR**

The configuration is functional and well-organized with a clear browser-like UX intent. However, it
contains a confirmed cross-platform clipboard bug, a misleading comment, theme inconsistencies
across the toolchain, and missing capabilities that would materially improve the workflow
(session persistence, cross-platform clipboard, OSC 52). The user-keys escape sequence scheme is
clever but fragile and duplicated across three files with no single source of truth.

---

## 1. Current Setup

### tmux/tmux.conf (182 lines)

#### General Settings (lines 1-43)

| Line(s) | Setting | Value | What It Does |
|---------|---------|-------|--------------|
| 9-10 | `prefix` / `unbind C-a` | `C-b` | Keeps default prefix, explicitly unbinds C-a (defensive, prevents leftover from prior config) |
| 13 | `mouse` | `on` | Enables mouse for pane selection, window switching, scrollback, and resize |
| 16-17 | `base-index` / `pane-base-index` | `1` | Windows and panes start at 1 instead of 0 |
| 20 | `renumber-windows` | `on` | Closes window 2 of 3, window 3 becomes window 2 |
| 23 | `history-limit` | `50000` | Scrollback buffer: 50K lines per pane |
| 26 | `escape-time` | `10` | Time (ms) tmux waits after ESC to determine if it's a standalone key or part of a sequence |
| 29 | `focus-events` | `on` | Passes terminal focus/unfocus events to applications (needed by Neovim for autoread) |
| 32-33 | `default-terminal` / `terminal-features` | `tmux-256color` + `RGB` | Sets TERM inside tmux; enables true color (24-bit) via terminal-features |
| 36-37 | `monitor-activity` / `visual-activity` | `off` / `off` | Suppresses activity alerts for background windows |
| 40-41 | `automatic-rename` / `allow-rename` | `off` / `off` | Prevents programs from changing window titles; only claude-tab rename-window works |

#### User-Defined Keys (lines 44-119)

Custom escape sequences from WezTerm/Ghostty mapped to tmux actions via `user-keys[0]` through `user-keys[19]`.

| User Key | Escape Sequence | Modifier | Action |
|----------|----------------|----------|--------|
| User0 | `\e[84;CMD~` | Cmd+T | `new-window -c "#{pane_current_path}"` |
| User1 | `\e[87;CMD~` | Cmd+W | Smart close: kill-pane if multiple panes, kill-window if single |
| User2-10 | `\e[49-57;CMD~` | Cmd+1-9 | `select-window -t 1-9` |
| User11 | `\e[91;CMS~` | Cmd+Shift+[ | `previous-window` |
| User12 | `\e[93;CMS~` | Cmd+Shift+] | `next-window` |
| User13 | `\e[68;CMD~` | Cmd+D | `split-window -h` (vertical split) |
| User14 | `\e[68;CMS~` | Cmd+Shift+D | `split-window -v` (horizontal split) |
| User15 | `\e[75;CMD~` | Cmd+K | Clear scrollback (`send-keys -R \; clear-history`) |
| User16 | `\e[60;CMS~` | Cmd+Shift+Left | Enter copy-mode, begin-selection, start-of-line |
| User17 | `\e[62;CMS~` | Cmd+Shift+Right | Enter copy-mode, begin-selection, end-of-line |
| User18 | `\e[60;OMS~` | Opt+Shift+Left | Enter copy-mode, begin-selection, previous-word |
| User19 | `\e[62;OMS~` | Opt+Shift+Right | Enter copy-mode, begin-selection, next-word-end |

#### Traditional Prefix Bindings (lines 121-153)

| Binding | Action |
|---------|--------|
| `prefix r` | Reload config from `~/.config/tmux/tmux.conf` |
| `prefix \|` | Split horizontal (visual mnemonic) |
| `prefix -` | Split vertical (visual mnemonic) |
| `prefix h/j/k/l` | Pane navigation (vim-style) |
| `prefix H/J/K/L` | Pane resize by 5 units (repeatable) |
| `prefix C-h` / `prefix C-l` | Previous/next window (repeatable) |
| `prefix c` | New window in current path |
| `prefix <` / `prefix >` | Swap window left/right (repeatable) |

#### Copy Mode (lines 155-166)

| Binding | Action |
|---------|--------|
| `mode-keys vi` | Vi-style navigation in copy mode |
| `v` (copy-mode-vi) | Begin selection |
| `y` (copy-mode-vi) | Copy selection to `pbcopy` and cancel |
| `MouseDragEnd1Pane` (copy-mode-vi) | Copy mouse selection to `pbcopy` and cancel |
| `prefix [` | Enter copy mode |
| `PageUp` (no prefix) | Enter copy mode and scroll up |

#### Status Bar (lines 168-182)

| Setting | Value |
|---------|-------|
| `status-position` | `bottom` |
| `status-interval` | `1` (second) |
| `status-justify` | `left` |
| Theme source | `~/.config/tmux/one-hunter-vercel-theme.conf` |

### tmux/one-hunter-vercel-theme.conf (79 lines)

Custom theme inspired by the One Hunter VS Code theme by Railly Hugo.

#### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Background | `#000000` | Status bar bg, label foregrounds |
| Foreground | `#DCE3EA` | Status bar default text |
| Blue | `#43AAF9` | Session name bg, active pane border, messages, clock, copy mode |
| Pink/Magenta | `#DD4F7D` | Active window tab |
| Cyan | `#5BD1B9` | Defined but unused |
| Yellow | `#FAC760` | Defined but unused |
| Purple | `#B267E6` | Defined but unused |
| Red | `#E61F44` | Defined but unused |
| Inactive | `#454D54` | Inactive tab text, inactive pane borders |
| Near-black | `#0A0A0A` | Inactive tab bg, right-status bg |

#### Status Bar Layout

```
[ #S ]  [ 1 vim ][ 2 zsh ][ 3 claude ]                    [ HH:MM ][ hostname ]
  ^blue    ^pink=active  ^gray=inactive                      ^gray     ^blue
```

Uses Powerline arrow characters (``, ``) for tab separators.

---

## 2. Intent Analysis

The configuration targets a **browser-like tmux experience**: Cmd+T for new tabs, Cmd+W to close,
Cmd+1-9 to switch, Cmd+D to split. This is a deliberate UX choice to lower cognitive overhead by
reusing muscle memory from web browsers and iTerm2.

The user-keys escape sequence scheme exists because macOS Cmd key events cannot be sent directly
through a terminal -- they are intercepted by the OS. The terminal emulators (WezTerm, Ghostty)
translate Cmd+key into custom escape sequences that tmux can bind. This is the standard approach
for this problem and is well-executed.

The theme is a custom adaptation of the "One Hunter Vercel" VS Code theme, not an upstream
maintained tmux theme. This is intentional -- it matches the user's editor aesthetic.

The dual binding strategy (user-keys for GUI-feel + prefix bindings for SSH/fallback) is sound. It
means the config works both with and without the custom terminal emulator.

---

## 3. Cross-Domain Interactions

| Dependency | Depends On | Depended On By | Fragility |
|------------|-----------|----------------|-----------|
| `tmux.conf` user-keys (lines 50-119) | WezTerm `wezterm.lua` (lines 53-128), Ghostty `config` (lines 52-58), Windows `wezterm-windows.lua` (lines 50-121) sending matching escape sequences | None | **HIGH** -- escape sequences must match exactly across 4 files; a typo in any one breaks the binding silently |
| `tmux.conf` copy-mode `pbcopy` (lines 161-162) | macOS `pbcopy` binary | None | **HIGH** -- breaks on Linux (confirmed BUG, see section 4) |
| `tmux.conf` `source-file` (line 182) | Theme file at `~/.config/tmux/one-hunter-vercel-theme.conf` | None | **LOW** -- symlink managed by `scripts/symlinks.conf` line 18 |
| `tmux.conf` reload (line 126) | Config at `~/.config/tmux/tmux.conf` | None | **LOW** -- symlink managed by `scripts/symlinks.conf` line 17 |
| Theme Powerline chars (lines 41, 44, 53) | Nerd Font installed and active in terminal | WezTerm, Ghostty font config | **MEDIUM** -- GeistMono Nerd Font required; fallback renders garbage chars |
| `.zshenv` `TMUX_THEME` (line 21) | Nothing reads it | tmux (implicit, unused) | **LOW** -- dead variable, tmux hardcodes the theme path |
| `homebrew/Brewfile` line 19 | tmux formula | tmux binary availability | **LOW** -- stable formula |
| `scripts/symlinks.conf` lines 17-18 | Source files in `tmux/` | tmux finding config at `~/.config/tmux/` | **LOW** -- standard symlink pattern |
| Ghostty `config` lines 52-58 | tmux user-keys matching | Cmd+Shift and Opt+Shift selection bindings | **HIGH** -- only 4 of 20 escape sequences are defined in Ghostty (see section 10) |

---

## 4. Best Practices Audit

### Confirmed BUG: `pbcopy` on Linux (lines 161-162)

**File:** `tmux/tmux.conf`, lines 161-162

```
bind -T copy-mode-vi y send-keys -X copy-pipe-and-cancel "pbcopy"
bind -T copy-mode-vi MouseDragEnd1Pane send-keys -X copy-pipe-and-cancel "pbcopy"
```

tmux does not resolve shell aliases. The `linux.zsh` file (lines 64-73) aliases `pbcopy` to
`xclip -selection clipboard`, but tmux executes commands through `/bin/sh`, not through the user's
interactive zsh session. Shell aliases are not available.

**Impact:** On Arch Linux, pressing `y` in copy mode or mouse-drag-selecting text will silently fail
to copy to the system clipboard. No error is shown -- the text just vanishes.

**Fix:** Use `if-shell` to detect the platform:

```tmux
if-shell "uname | grep -q Darwin" \
  "bind -T copy-mode-vi y send-keys -X copy-pipe-and-cancel 'pbcopy'" \
  "bind -T copy-mode-vi y send-keys -X copy-pipe-and-cancel 'xclip -selection clipboard'"

if-shell "uname | grep -q Darwin" \
  "bind -T copy-mode-vi MouseDragEnd1Pane send-keys -X copy-pipe-and-cancel 'pbcopy'" \
  "bind -T copy-mode-vi MouseDragEnd1Pane send-keys -X copy-pipe-and-cancel 'xclip -selection clipboard'"
```

Or better yet, use OSC 52 (see section 8).

### escape-time = 10 (line 26)

**Verdict: Acceptable.** The value of 10ms is aggressive but appropriate for this setup. Research
shows 10-20ms is the recommended range for modern use. The tmux project itself has discussed
changing the default from 500ms down to 10ms (see
[tmux issue #3844](https://github.com/tmux/tmux/issues/3844)). For SSH connections over Tailscale
(WireGuard, typically <20ms latency), 10ms should work. For high-latency connections (>100ms RTT),
meta/alt key combinations might occasionally misfire, but the user's SSH mesh is all Tailscale with
low latency, so this is not a practical concern.

### focus-events on (line 29)

**Verdict: Still needed.** As of tmux 3.4 (latest stable, 2026), `focus-events` defaults to `off`.
The setting is required for Neovim's `autoread` and `FocusGained`/`FocusLost` autocommands to work.
Keep it.

### default-terminal "tmux-256color" (line 32)

**Verdict: Correct for modern systems.** `tmux-256color` is the proper value for systems with
up-to-date ncurses (which both macOS via Homebrew and Arch Linux have). It supports italics and
other features that `screen-256color` does not. The `xterm-256color` alternative would work but is
technically incorrect -- tmux is not xterm, and lying about `$TERM` can cause subtle rendering
issues. The companion line `set -as terminal-features ',xterm-256color:RGB'` correctly enables
true color. This is well-configured.

### terminal-features vs terminal-overrides (line 33)

**Verdict: Correct.** `terminal-features` (introduced in tmux 3.2) is the modern replacement for
`terminal-overrides`. The configuration uses the newer form. Correct.

### renumber-windows on + base-index 1 (lines 16-20)

**Verdict: Standard best practice.** This is the most commonly recommended tmux configuration
pattern. Starting at 1 matches keyboard layout (1 is left of 2), and renumbering prevents gaps.
Both are present. Correct.

### history-limit 50000 (line 23)

**Verdict: Generous but reasonable.** 50K lines at roughly 100 bytes/line is ~5MB per pane. With
10 panes, that's 50MB. Not a problem on modern machines. Some configs go to 100K. This is fine.

### status-interval 1 (line 176)

**Verdict: Aggressive.** A 1-second interval means tmux re-renders the status bar every second. The
current status bar shows `%H:%M` (hours and minutes, not seconds), so a 1-second interval provides
no visible benefit over 5 or 15 seconds. This wastes CPU cycles for no gain.

### Mouse Support (line 13)

**Verdict: Correct with known tradeoff.** Mouse mode enables intuitive pane selection and scroll,
but breaks native terminal text selection. The workaround (hold Option on macOS / Shift on Linux to
bypass tmux mouse capture) exists but is not documented in the config. The user's copy-mode
bindings (`v`, `y`, MouseDragEnd1Pane) mitigate the selection issue.

---

## 5. Tool Choices: tmux vs Zellij

The ecosystem overview covers this extensively. Summary assessment for this user's specific context:

| Factor | tmux | Zellij | Winner for this user |
|--------|------|--------|---------------------|
| Cross-platform | macOS + Linux + Windows/WSL | macOS + Linux | tmux (Windows/WSL coverage) |
| Remote sessions (SSH) | Detach/attach is core feature | Also supports, but less mature | tmux |
| Custom keybinding scheme | user-keys escape sequences work | Would need equivalent KDL config | tmux (already invested) |
| Scriptability | Extensive; cmux-workspaces.sh uses it | WebAssembly plugins (different paradigm) | tmux |
| Ecosystem maturity | Decades, massive community | 0.x version, growing | tmux |
| Session persistence | Via tmux-resurrect plugin | Built-in (partial) | Zellij edge |
| Discoverability/UX | Poor (memorize everything) | Excellent (built-in hints) | Zellij |
| Binary size | ~900KB | ~38MB | tmux |

**Verdict:** tmux is the correct choice for this user. The investment in the user-keys escape
sequence scheme across three terminal emulators (WezTerm macOS, WezTerm Windows, Ghostty), the
cmux workspace launcher integration, and the SSH mesh workflow all depend on tmux's scripting
capabilities. Switching to Zellij would require rewriting the entire escape sequence integration
layer, cmux-workspaces.sh, and the Windows AHK-based keybinding chain. The ROI is negative.

---

## 6. Configuration Quality

### Structure and Organization

**Rating: Good.** The config is cleanly sectioned with clear comment headers:
1. General Settings
2. User-Defined Keys
3. Traditional Prefix Bindings
4. Copy Mode
5. Status Bar

The theme is correctly separated into its own file. The comment on line 2 says "Browser-like
keybindings with Nord theme" -- this is **misleading** (see section 10): the actual theme is
One Hunter Vercel, not Nord.

### Readability

**Rating: Good.** Every user-key binding has a comment explaining the key combination. The escape
sequence format is documented on line 46. The `if-shell` on line 55 for smart close is clear.

### Maintainability

**Rating: Fair.** The user-keys section is verbose but necessarily so -- each key needs both a
`set -s user-keys[N]` and a `bind-key -n UserN`. The main maintainability concern is the
**three-way escape sequence duplication** across `wezterm.lua`, `ghostty/config`, and
`wezterm-windows.lua` (see section 9).

---

## 7. Architecture Assessment

### Keybinding Architecture

The two-tier approach is well-designed:

1. **Primary tier (no prefix):** User-keys for browser-like Cmd+key bindings. These are the daily
   drivers, zero cognitive overhead.
2. **Fallback tier (prefix-based):** Traditional vim-style bindings for when SSH'd without a custom
   terminal emulator, or when muscle memory kicks in.

There is no conflict between the tiers because user-keys are bound with `-n` (no prefix) while
traditional bindings require the prefix. This is correct.

### Theme Architecture

The theme is loaded via `source-file` at the end of `tmux.conf`, which is the standard pattern.
Settings in the theme can be overridden by adding lines after the `source-file` directive. The
theme file is self-contained with all color definitions as comments at the top. This is clean.

### XDG Compliance

The config lives at `~/.config/tmux/tmux.conf` (via symlink), which is the XDG-compliant location.
tmux 3.1+ supports this natively without requiring `-f` flag. Correct.

---

## 8. Missing Capabilities

### Critical: Cross-Platform Clipboard via OSC 52

**Priority: Critical.** The current `pbcopy` approach is macOS-only (confirmed bug). The modern
solution is OSC 52, which works across all terminals and platforms -- including over SSH. Both
WezTerm and Ghostty support OSC 52.

Add to `tmux.conf`:
```tmux
set -g set-clipboard on
```

This tells tmux to use OSC 52 escape sequences for clipboard operations. With this enabled, the
`copy-pipe-and-cancel "pbcopy"` bindings become optional (OSC 52 handles it automatically). This
also fixes clipboard over SSH without needing `reattach-to-user-namespace` or forwarding.

The tmux wiki explicitly recommends this as the primary clipboard integration method:
[Clipboard - tmux wiki](https://github.com/tmux/tmux/wiki/Clipboard)

### Important: Session Persistence (tmux-resurrect / tmux-continuum)

The config has no session persistence. If the machine reboots or tmux server crashes, all sessions,
windows, pane layouts, and working directories are lost. Given the user runs multi-project
workspaces via cmux, losing a complex workspace layout is painful.

**Options:**
1. **tmux-resurrect** (via TPM or manual): Save/restore sessions with `prefix+Ctrl-s` / `prefix+Ctrl-r`
2. **tmux-continuum**: Auto-save every 15 minutes + auto-restore on tmux start
3. **Manual scripting**: cmux-workspaces.sh already creates workspaces programmatically, so recreating
   sessions is possible but slower than restore

Given the user has no TPM and the config is otherwise manual, option 3 (lean on cmux-workspaces.sh)
is a valid alternative. But tmux-resurrect is a single script that can be installed without TPM.

### Nice-to-have: tmux-yank (cross-platform clipboard plugin)

If OSC 52 is not adopted, tmux-yank is the plugin solution. It auto-detects the platform and uses
the correct clipboard command (pbcopy on macOS, xclip/xsel on Linux, clip.exe on WSL). It can be
installed without TPM (just clone the repo and `run-shell` it).

### Nice-to-have: Display-panes Timeout

The default `display-panes-time` is 1 second, which is often too short to read pane numbers on
complex layouts. Adding `set -g display-panes-time 2000` (2 seconds) improves usability.

### Nice-to-have: Window/Pane Activity Display

`monitor-activity` and `visual-activity` are both `off`. This means if a long-running command
finishes in a background window, there is no visual indicator. Consider `monitor-activity on` with
`visual-activity off` -- this highlights the window in the status bar without a popup message.

---

## 9. Redundancies

### Escape Sequence Triplication

The same 20 escape sequences are defined in three places:

| Escape Sequence | `tmux.conf` (bind) | `wezterm.lua` (send) | `ghostty/config` (send) | `wezterm-windows.lua` (send) |
|----------------|--------------------|--------------------|------------------------|----------------------------|
| `\e[84;CMD~` (Cmd+T) | line 50-51 | line 55 | N/A | line 52 |
| `\e[87;CMD~` (Cmd+W) | line 53-55 | line 58 | N/A | line 55 |
| `\e[49-57;CMD~` (Cmd+1-9) | lines 57-83 | lines 61-69 | N/A | lines 58-66 |
| `\e[91;CMS~` (Cmd+Shift+[) | line 85-87 | line 72 | N/A | line 69 |
| `\e[93;CMS~` (Cmd+Shift+]) | line 89-91 | line 75 | N/A | line 71 |
| `\e[68;CMD~` (Cmd+D) | line 93-95 | line 78 | N/A | line 76 |
| `\e[68;CMS~` (Cmd+Shift+D) | line 97-99 | line 81 | N/A | line 79 |
| `\e[75;CMD~` (Cmd+K) | line 101-103 | line 84 | N/A | line 82 |
| `\e[60;CMS~` (Cmd+Shift+Left) | line 105-107 | line 119 | line 53 | line 116 |
| `\e[62;CMS~` (Cmd+Shift+Right) | line 109-111 | line 122 | line 54 | line 117 |
| `\e[60;OMS~` (Opt+Shift+Left) | line 113-115 | line 125 | line 57 | line 120 |
| `\e[62;OMS~` (Opt+Shift+Right) | line 117-119 | line 128 | line 58 | line 121 |

**Risk:** A typo in any single file breaks that specific binding silently. There is no validation
that the sequences match across files.

**Note:** Ghostty only defines 4 of the 20 escape sequences (the selection bindings). The core
tmux keybindings (Cmd+T, Cmd+W, Cmd+1-9, Cmd+D, Cmd+K) are **missing from Ghostty config**. This
means when using Ghostty as the terminal emulator, these browser-like keybindings do not work.
Ghostty likely handles Cmd+T/W/N natively (for its own tabs), which may be intentional if the user
runs Ghostty without tmux. But if tmux is used inside Ghostty, the keybindings are incomplete.

### Dual Navigation Bindings

Window navigation is bound twice:
- `prefix C-h` / `prefix C-l` (prefix-based, lines 145-146)
- User11 / User12 via Cmd+Shift+[ / Cmd+Shift+] (prefix-free, lines 85-91)

This is intentional redundancy (fallback tier), not waste.

---

## 10. Ambiguities

### Comment vs Reality: "Nord theme" (line 2)

**File:** `tmux/tmux.conf`, line 2
```
# tmux.conf - Browser-like keybindings with Nord theme
```

The actual theme is **One Hunter Vercel**, not Nord. The `.zshenv` exports `TMUX_THEME="one-hunter-vercel"`
(line 21) and the theme file is `one-hunter-vercel-theme.conf`. The comment is stale and misleading.

### TMUX_THEME Environment Variable Is Dead

**File:** `zsh/.zshenv`, line 21
```bash
export TMUX_THEME="one-hunter-vercel"
```

Nothing reads this variable. The tmux config hardcodes the path:
```
source-file ~/.config/tmux/one-hunter-vercel-theme.conf
```

The variable exists alongside `NVIM_THEME`, `STARSHIP_THEME`, and `WEZTERM_THEME` as a
documentation convention, but tmux does not use environment variables for theme selection. It is
purely decorative. This could confuse someone who expects changing `TMUX_THEME` to switch themes.

### Theme Color Inconsistency Across Toolchain

The `.zshenv` exports:
- `TMUX_THEME="one-hunter-vercel"`
- `NVIM_THEME="nord"`
- `STARSHIP_THEME="nord"`
- `WEZTERM_THEME="nord"`

The tmux theme uses One Hunter Vercel colors (black bg, blue/pink accents), while the rest of the
toolchain declares "nord" (blue-gray palette). The WezTerm color scheme is `VisiBlue (terminal.sexy)`,
and Ghostty uses `Vercel`. There are at least three different color palettes active simultaneously.
Whether this is intentional aesthetic layering or drift is unclear.

### Unused Theme Colors

Four of the nine colors defined in `one-hunter-vercel-theme.conf` (Cyan, Yellow, Purple, Red) are
declared in comments but never used in any setting. These are either:
1. Aspirational (planned for future use)
2. Documentation (reference palette from the VS Code theme)

Not harmful, but could mislead someone extending the theme into thinking these are applied somewhere.

### Ghostty Escape Sequence Gap

As noted in section 9, Ghostty only sends 4 of 20 escape sequences. This raises the question: is
the user running tmux inside Ghostty, or using Ghostty's native tabs/splits? If tmux is used inside
Ghostty, the missing 16 keybindings are a functional gap. If Ghostty is used standalone (no tmux),
the 4 selection bindings that ARE defined would fire tmux sequences into a non-tmux shell, which
would display as garbage text.

---

## 11. Recommendations

### Critical

| # | Issue | File:Line | Action |
|---|-------|-----------|--------|
| C1 | **pbcopy breaks on Linux** | `tmux.conf:161-162` | Add `set -g set-clipboard on` for OSC 52 clipboard. Both WezTerm and Ghostty support it. This eliminates the need for platform-specific clipboard commands entirely. Alternatively, use `if-shell` to branch on `uname`. |

### Important

| # | Issue | File:Line | Action |
|---|-------|-----------|--------|
| I1 | **Stale comment: "Nord theme"** | `tmux.conf:2` | Change to `# tmux.conf - Browser-like keybindings with One Hunter Vercel theme` |
| I2 | **status-interval 1 is wasteful** | `tmux.conf:176` | Change to `set -g status-interval 5`. The status bar only shows `%H:%M`, not seconds. |
| I3 | **Ghostty missing 16 escape sequences** | `ghostty/config` | If tmux is used inside Ghostty, add the missing Cmd+T, Cmd+W, Cmd+1-9, Cmd+D, Cmd+K bindings to Ghostty config. If Ghostty is used without tmux, remove the 4 existing tmux sequences to avoid garbage output. |
| I4 | **No session persistence** | `tmux.conf` | Consider installing tmux-resurrect (no TPM needed: `git clone` + `run-shell`). Or document that cmux-workspaces.sh is the intended recovery mechanism. |
| I5 | **TMUX_THEME env var is dead code** | `zsh/.zshenv:21` | Either make tmux.conf read `$TMUX_THEME` to select a theme file dynamically, or remove the variable. Current state is misleading. |

### Nice-to-have

| # | Issue | File:Line | Action |
|---|-------|-----------|--------|
| N1 | **Escape sequence duplication** | 4 files | Consider documenting the escape sequence mapping in a single reference table (in CLAUDE.md or a dedicated doc) so all terminal configs can be verified against it. No code deduplication is possible since each terminal uses a different config format. |
| N2 | **display-panes-time too short** | Not set (default 1s) | Add `set -g display-panes-time 2000` for easier pane identification |
| N3 | **No activity monitoring** | `tmux.conf:36-37` | Consider `setw -g monitor-activity on` (keep `visual-activity off`) to highlight background windows with activity in the status bar |
| N4 | **Unused theme colors** | `one-hunter-vercel-theme.conf:11-14` | Use them for something (activity highlight = yellow, bell = red, prefix indicator = purple) or mark them explicitly as "reference only" |
| N5 | **No TPM** | `tmux.conf` | Intentional and defensible. Manual config is simpler and more portable. If tmux-resurrect is added, a single `run-shell` line is cleaner than TPM for one plugin. Keep this approach. |
| N6 | **Mouse bypass not documented** | `tmux.conf:13` | Add comment: `# Hold Option (macOS) or Shift (Linux) to bypass tmux mouse capture for native terminal selection` |
| N7 | **No prefix indicator in status bar** | `one-hunter-vercel-theme.conf` | When prefix is active, the status bar gives no visual feedback. A common pattern is to change the session name background color when prefix is pressed. |

---

## Sources

### tmux Configuration Best Practices
- [Ham Vocke -- Make tmux Pretty and Usable](https://hamvocke.com/blog/a-guide-to-customizing-your-tmux-conf/)
- [Micah Kepe -- Setting Up a Better tmux Configuration](https://micahkepe.com/blog/tmux-config/)
- [tmux Configuration Guide](https://tmux.info/docs/configuration)
- [tmuxai -- Best Tmux Plugins 2025](https://tmuxai.dev/tmux-plugins/)

### escape-time
- [tmux issue #3844 -- Change default escape-time](https://github.com/tmux/tmux/issues/3844)
- [tmux FAQ](https://github.com/tmux/tmux/wiki/FAQ)
- [tmuxai -- How to adjust escape-time](https://tmuxai.dev/tmux-escape-time/)
- [Jeff Kreeftmeijer -- Set tmux escape-time to 0](https://jeffkreeftmeijer.com/tmux-escape-time/)

### Cross-Platform Clipboard
- [tmux wiki -- Clipboard](https://github.com/tmux/tmux/wiki/Clipboard)
- [tmux-yank plugin](https://github.com/tmux-plugins/tmux-yank)
- [Grailbox -- System Clipboard for Vi Copy Mode](https://www.grailbox.com/2020/08/use-system-clipboard-for-vi-copy-mode-in-tmux-in-macos-and-linux/)
- [Mike Olson -- Ghostty + tmux uniform copy and paste](https://mwolson.org/blog/2025-11-12-ghostty-tmux-uniform-copy-paste/)

### Terminal & Color
- [Jonathan Palardy -- Fixing tmux for 256 colors](https://blog.jpalardy.com/posts/fixing-tmux-for-256-colors/)
- [gpakosz/.tmux -- Use tmux-256color](https://github.com/gpakosz/.tmux/issues/382)

### User-Keys & Escape Sequences
- [tmux wiki -- Modifier Keys](https://github.com/tmux/tmux/wiki/Modifier-Keys)
- [tmux issue #1088 -- Mapping escape sequences](https://github.com/tmux/tmux/issues/1088)
- [tmux issue #786 -- Binding raw escape sequences](https://github.com/tmux/tmux/issues/786)

### Zellij vs tmux
- [tmuxai -- tmux vs Zellij Decision Guide](https://tmuxai.dev/tmux-vs-zellij/)
- [dasroot.net -- tmux vs Zellij Comparison (2026)](https://dasroot.net/posts/2026/02/terminal-multiplexers-tmux-vs-zellij-comparison/)

### Plugins
- [tmux-plugins/tmux-resurrect](https://github.com/tmux-plugins/tmux-resurrect)
- [tmux-plugins/tmux-continuum](https://github.com/tmux-plugins/tmux-continuum)
- [tmux-plugins/tpm](https://github.com/tmux-plugins/tpm)

### One Hunter Theme
- [Railly/one-hunter-vscode](https://github.com/Railly/one-hunter-vscode)
- [One Hunter Theme -- VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=RaillyHugo.one-hunter)
