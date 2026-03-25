# Cmux Workspace Launcher Audit

> Adversarial audit of the cmux workspace launcher domain
> Scope: `ghostty/cmux-workspaces.sh`, `ghostty/cmux-debug.sh`, `ghostty/mux-remote.sh`
> Generated: 2026-03-25

**Health Score: FAIR**

The cmux workspace launcher is a well-structured, purpose-built automation layer for a
non-standard tool (cmux, a Ghostty-based terminal multiplexer). It solves a real problem --
bootstrapping 19 multi-pane dev workspaces over SSH in seconds -- but carries complexity that
demands ongoing maintenance as the project registry grows. The sleep-based timing, hardcoded
project registry, and macOS-only interactive picker are the primary weaknesses.

---

## 1. Current Setup

### cmux-workspaces.sh (399 lines)

The main workspace launcher. Invoked via the shell alias `mux` (defined in
`zsh/rc/shared.zsh:71`).

**Functions and flow:**

| Function | Lines | Purpose |
|----------|------:|---------|
| `get_color()` | 67-73 | Returns hex color for a project's category (amber/green/blue) |
| `wait_for_cmux()` | 82-92 | Polls `cmux ping` up to 10 times at 0.5s intervals |
| `parse_surface()` | 94-96 | Extracts `surface:UUID` from cmux output via awk |
| `send_to()` | 98-102 | Sends text + enter keystroke to a specific workspace/surface |
| `find_workspace_uuid()` | 104-111 | Finds workspace UUID by name from `list-workspaces` output |
| `pane_exec()` | 120-131 | Executes a command in a pane -- SSH mode wraps in `ssh -t` with env injection; local mode uses `cd` directly |
| `resolve_path()` | 134-151 | Resolves project code to full path, handling both `~/dev/X` and `~/X` patterns |
| `create_workspace()` | 154-192 | Phase 1: Creates a cmux workspace, names it, sets status bar color/label. Sequential. |
| `wait_for_surface()` | 195-209 | Retries up to 5 times at 0.5s intervals to get a surface UUID |
| `populate_workspace()` | 212-250 | Phase 2: Opens 3 panes (nvim, claude, lazygit) in a workspace. Parallel. |

**Data structures (lines 24-65):**

| Structure | Type | Purpose |
|-----------|------|---------|
| `PROJECTS` | assoc array | Maps 2-letter codes to directory names (19 entries) |
| `GROUP_BB`, `GROUP_CLIENT`, `GROUP_PERSONAL` | arrays | Category membership lists |
| `CANONICAL_ORDER` | array | Defines tab ordering across all categories |
| `CATEGORIES` | assoc array | Maps codes to category names |
| `FULL_NAMES` | assoc array | Maps codes to display names |
| `COLOR_*` | strings | Hex colors per category |

**Execution phases:**

1. **Arg parsing** (lines 253-327): Supports `b`/`c`/`p` group shortcuts, `--local`, `--ssh`,
   `--host`, `--list`, `--help`, individual project codes. Deduplicates targets.
2. **Phase 1 -- Create** (lines 344-356): Sequential workspace creation. Skips existing workspaces.
3. **Phase 2 -- Populate** (lines 360-370): Parallel pane population with 0.3s stagger between
   launches. Uses `&` and `wait`.
4. **Phase 3 -- Reorder** (lines 372-395): Iterates all workspaces in canonical order, refreshes
   labels/colors, reorders tabs, selects first target workspace.

**Layout per workspace:**
```
+----------------+----------------+
|                |  Claude Code   |
|   nvim .       +----------------+
|                |   lazygit      |
+----------------+----------------+
```

### cmux-debug.sh (53 lines)

A step-by-step diagnostic script that exercises the cmux CLI pipeline in isolation. Creates one
workspace, renames it, lists surfaces, sends text, reads screen output, splits a pane, and
selects the workspace. Every step prints its output for visual inspection.

**Functions:** None (linear script).

**Purpose:** Troubleshooting cmux CLI behavior when `cmux-workspaces.sh` fails silently. This
is a development-time tool, not user-facing.

### mux-remote.sh (104 lines)

A zsh wrapper for invoking `cmux-workspaces.sh` from external triggers (Apple Shortcuts, NFC
tags, SSH). Uses `/bin/zsh` explicitly because macOS Shortcuts cannot invoke bash 5+ (the
system `/bin/bash` is 3.2).

**Flow:**

1. **Preflight** (lines 19-23): Checks `cmux ping`. Shows macOS notification on failure.
2. **No-args path** (lines 26-98): Launches an AppleScript `choose from list` dialog with
   category options and a "Pick Projects" sub-dialog for individual project selection.
3. **Args path** (lines 103-104): Passes arguments directly to `cmux-workspaces.sh` via `exec`.

**AppleScript dialogs:** Two nested `osascript` calls. The first shows categories
(B&B/Clients/Personal/All/Pick). If "Pick Projects" is chosen, a second dialog lists all
projects with tree-style formatting, allowing multi-select.

---

## 2. Intent Analysis

The system's intent is clear: **launch fully-configured multi-pane development workspaces
inside cmux, primarily over SSH to a homelab machine, with one command.**

The target workflow:
1. Developer types `mux b c` (or taps an NFC tag / runs an Apple Shortcut)
2. 13 cmux workspaces appear, each with nvim, Claude Code, and lazygit open to the correct
   project directory on the homelab
3. Workspaces are color-coded by category and ordered canonically
4. Remote Claude Code sessions get `CMUX_BRIDGE_HOST` injected so CC hooks can call back to
   cmux on the Mac via the Tailscale mesh

This is a power-user automation for a specific hardware topology: Mac (thin client) ->
Tailscale -> Homelab (development machine). The `--local` flag exists for fallback when the
homelab is unavailable, but SSH is the primary mode.

**Why not tmux?** cmux is a Ghostty-based macOS-native terminal with vertical tabs, per-workspace
notifications, progress reporting, and an integrated browser. It provides UI affordances (color-coded
tabs, attention badges, notification integration) that tmux cannot replicate without significant
plugin effort. The project specifically targets Claude Code's multi-agent workflow where multiple
AI sessions run in parallel and need visual coordination.

---

## 3. Cross-Domain Interactions

| Depends On | Interface | Fragility |
|-----------|-----------|-----------|
| **cmux CLI** | `cmux` binary in PATH; socket API for workspace/surface/split operations | **HIGH** -- cmux is a young, rapidly-evolving tool (v0.x). CLI flags and output format could change without notice. No version pinning. |
| **Tailscale** | `tailscale ip -4` for MAC_TAILSCALE_IP; CGNAT range for cmux-bridge IP filtering | **MEDIUM** -- if Tailscale is down, `MAC_TAILSCALE_IP` falls back to empty string, silently disabling bridge callbacks |
| **SSH mesh** | `ssh -t homelab` (host defined in `ssh-mesh/configs/mac.config`) | **MEDIUM** -- relies on SSH config being installed; if homelab is unreachable, each pane shows an SSH error |
| **cmux-bridge** (Rust) | HTTP on port 10998; endpoints `/cmux/hook`, `/cmux/attention`, `/cmux/notify` | **MEDIUM** -- must be running on Mac via LaunchAgent; if dead, remote CC hooks fail silently |
| **LaunchAgent plist** | `com.leonardoacosta.cmux-bridge.plist` symlinked to `~/Library/LaunchAgents/` | **LOW** -- KeepAlive ensures restart; one-time setup |
| **zsh alias** | `alias mux=~/dev/if/ghostty/cmux-workspaces.sh` in `shared.zsh:71` | **LOW** -- stable |
| **Ghostty config** | cmux reads `~/.config/ghostty/config` for keybindings/fonts/theme | **LOW** -- complementary, not blocking |
| **nvim, claude, lazygit** | Binaries must exist on target machine (homelab or local) | **MEDIUM** -- no pre-flight check for these binaries before launching panes |

| Depended On By | Interface | Notes |
|---------------|-----------|-------|
| **mux-remote.sh** | Invokes `cmux-workspaces.sh` via `exec` | Direct dependency |
| **Apple Shortcuts / NFC** | Invoke `mux-remote.sh` | External trigger |
| **Raycast scripts** | Parallel system (Cursor-based), does NOT invoke cmux scripts | No dependency, but overlapping intent |
| **Remote Claude Code hooks** | Use `CMUX_BRIDGE_HOST` env var to call back to cmux-bridge | Loose coupling via env var |

---

## 4. Best Practices Audit

### What the ecosystem recommends (2025-2026)

Per web research on tmux workspace launchers, session managers, and terminal automation:

1. **Declarative configuration over imperative scripts.** Tools like tmuxinator, tmuxp, smug,
   and twm all use YAML/JSON/TOML config files to declare workspace layouts. This separates
   "what" (layout definition) from "how" (creation logic).

2. **Avoid sleep-based synchronization.** Race conditions in terminal automation are well-documented.
   The recommended approach is polling for readiness (which `wait_for_cmux()` and
   `wait_for_surface()` partially do) rather than fixed sleeps.

3. **Session deduplication.** Check if a session/workspace already exists before creating it.
   Attach to existing rather than failing. `cmux-workspaces.sh` does this correctly in
   `create_workspace()` (line 164).

4. **Reproducible environments.** The workspace definition should be version-controlled and
   machine-independent. The hardcoded project registry violates this -- it is tightly coupled to
   one developer's project list.

5. **Error reporting.** Failed pane commands should be surfaced, not swallowed. The parallel
   `populate_workspace` phase (line 365) runs in background with `&` but `wait` only checks
   exit codes implicitly.

### Compliance assessment

| Practice | Status | Notes |
|----------|--------|-------|
| Declarative config | **FAIL** | Layout is code, not config. Project registry is hardcoded. |
| Sleep avoidance | **PARTIAL** | Uses polling for cmux readiness and surface availability, but still has 7 fixed `sleep` calls in populate_workspace |
| Session dedup | **PASS** | Checks for existing workspaces before creation |
| Reproducibility | **FAIL** | Hardcoded to one developer's project list and SSH host |
| Error reporting | **PARTIAL** | Creation errors are printed; populate errors in background processes are lost |
| Version pinning | **FAIL** | No cmux version check or minimum version assertion |

Sources:
- [tmux workspace scripting](https://ryan.himmelwright.net/post/scripting-tmux-workspaces/)
- [twm - Tmux Workspace Manager](https://github.com/vinnymeller/twm)
- [tmux Complete Guide 2026](https://dev.to/_d7eb1c1703182e3ce1782/tmux-tutorial-the-complete-developer-workflow-guide-2026-33b3)
- [tmux race condition issue #3378](https://github.com/tmux/tmux/issues/3378)

---

## 5. Tool Choices

### Custom script vs. established tools

| Tool | Language | Config Format | SSH Support | cmux Support | Verdict |
|------|----------|---------------|-------------|-------------|---------|
| **tmuxinator** | Ruby | YAML | Limited (local tmux) | None | Cannot drive cmux |
| **tmuxp** | Python | YAML/JSON | Limited | None | Cannot drive cmux |
| **smug** | Go | YAML | Limited | None | Cannot drive cmux |
| **twm** | Rust | YAML + auto-detect | No | No | Cannot drive cmux |
| **tmux-resurrect** | Shell | Automatic | N/A (persistence) | None | Different problem space |
| **Custom script** | Bash | Hardcoded | Full control | Full control | Current approach |

**The custom script is justified.** Every established tool in this space targets `tmux` the
multiplexer. cmux is a different application with its own CLI and socket API. There is no
`cmuxinator` equivalent. The custom script is the only viable approach for driving cmux
workspaces programmatically.

However, the script conflates two concerns that should be separated:
1. **The engine** (creating workspaces, splitting panes, sending commands via cmux CLI)
2. **The registry** (which projects exist, what category they belong to, what tools to launch)

The engine is well-written and reusable. The registry is hardcoded and brittle. Separating
them into (1) a generic cmux workspace launcher and (2) a YAML/TOML project registry file
would bring the declarative benefits of tmuxinator without requiring tmuxinator itself.

Sources:
- [tmuxinator GitHub](https://github.com/tmuxinator/tmuxinator)
- [tmuxp documentation](https://tmuxp.git-pull.com/about.html)
- [smug GitHub](https://github.com/ivaaaan/smug)
- [tmuxp vs tmuxinator (Slant)](https://www.slant.co/versus/32439/32440/~tmuxp_vs_tmuxinator)
- [cmux - Ghostty-based terminal](https://cmux.com/)
- [cmux GitHub](https://github.com/manaflow-ai/cmux)

---

## 6. Configuration Quality

### cmux-workspaces.sh

| Aspect | Rating | Evidence |
|--------|--------|----------|
| **Strict mode** | Good | `set -euo pipefail` (line 13) |
| **Variable quoting** | Good | Consistent double-quoting throughout |
| **Error handling** | Mixed | Creation phase handles errors well; populate phase swallows them |
| **Output formatting** | Good | Clear status symbols (triangle, check, cross, null set) |
| **Code organization** | Good | Clear phase separation (create -> populate -> reorder) |
| **Documentation** | Adequate | Header comments, usage examples, inline layout diagram |
| **Arg parsing** | Good | Supports groups, individual codes, flags, help text |
| **Deduplication** | Good | Targets deduplicated via associative array (lines 329-338) |

### cmux-debug.sh

| Aspect | Rating | Evidence |
|--------|--------|----------|
| **Strict mode** | Good | `set -euo pipefail` (line 2) |
| **Purpose clarity** | Good | Each step labeled with `=== Step N ===` |
| **Completeness** | Good | Exercises the full cmux CLI surface needed by the launcher |
| **Maintenance risk** | Low | Rarely changed, small scope |

### mux-remote.sh

| Aspect | Rating | Evidence |
|--------|--------|----------|
| **Shell choice** | Justified | Uses `/bin/zsh` for macOS Shortcuts compatibility (line 1 comment) |
| **Strict mode** | Good | `set -euo pipefail` (line 13) |
| **PATH safety** | Good | Explicitly sets PATH to include Homebrew (line 15) |
| **Error UX** | Good | Shows macOS notification on cmux-not-running (line 20) |
| **AppleScript quality** | Fragile | See section 10 |

---

## 7. Architecture Assessment

### Strengths

1. **Three-phase design is sound.** Sequential creation (preserves ordering) followed by parallel
   population (speed) followed by reorder (consistency) is a well-thought-out pipeline.

2. **Environment injection for remote CC hooks.** Passing `CMUX_WORKSPACE_ID`,
   `CMUX_SURFACE_ID`, and `CMUX_BRIDGE_HOST` through SSH enables remote Claude Code to call
   back to cmux on the Mac. This is architecturally clever.

3. **cmux-bridge is well-engineered.** The Rust HTTP proxy (`ssh-mesh/scripts/remote/cmux-bridge/src/main.rs`)
   is minimal (308 lines), uses IP-based access control (localhost + Tailscale CGNAT), and has
   a clean REST API. Dependencies are minimal (tiny_http, serde). Release profile strips symbols
   and enables LTO.

4. **Idempotent workspace creation.** Running `mux oo` twice does not create a duplicate -- it
   skips existing workspaces and only reorders/refreshes labels.

5. **Color-coded categories.** The hex colors (`#F59E0B` amber, `#10B981` green, `#3B82F6` blue)
   are passed to cmux via `set-status --color`, providing instant visual identification in the
   vertical tab bar. This is a cmux-native feature that tmux cannot replicate.

### Weaknesses

1. **No error propagation from background processes.** `populate_workspace` runs in background
   (line 365: `populate_workspace "$code" "${WS_UUIDS[$code]}" &`), and while `wait "${pids[@]}"` collects exit codes,
   the script does not check them or report failures. If `nvim .` fails to launch in 3
   workspaces, the user sees "Done" with no indication.

2. **Monolithic project registry.** Adding a project requires editing 5 associative arrays
   (`PROJECTS`, `CATEGORIES`, `FULL_NAMES`) plus 1-2 group arrays, plus updating
   `mux-remote.sh`'s AppleScript dialogs. This is 6 coordinated edits for one new project.

3. **cmux CLI output parsing is fragile.** The script parses `cmux list-workspaces` and
   `cmux new-workspace` output with awk patterns (e.g., line 108:
   `$0 ~ "  " name "  " || $0 ~ "  " name "$"`). If cmux changes its output format, the
   script breaks silently.

4. **The reorder phase runs on every invocation.** Even when launching a single workspace (`mux oo`),
   Phase 3 iterates all 19 entries in `CANONICAL_ORDER`, calling `cmux list-workspaces`,
   `cmux set-status`, and `cmux reorder-workspace` for every existing workspace. This is
   O(n) cmux CLI calls for every invocation regardless of how many workspaces were created.

---

## 8. Missing Capabilities

| Capability | Impact | Notes |
|-----------|--------|-------|
| **Pre-flight binary checks** | Medium | No verification that `nvim`, `claude`, `lazygit` exist on target before launching panes. Failed panes show shell errors. |
| **Workspace teardown** | Medium | No `mux --kill oo` or `mux --kill b` to close workspaces. Must use cmux UI manually. |
| **Per-project layout customization** | Low | Every project gets the same 3-pane layout. Some projects may not need lazygit (e.g., `cc` for `~/.claude`). |
| **Dry-run mode** | Low | No `mux --dry-run b` to preview what would be created without executing. |
| **Status/health command** | Low | No `mux --status` to show which workspaces are alive and which panes are responsive. |
| **Linux interactive picker** | Medium | `mux-remote.sh` uses osascript (AppleScript), which is macOS-only. No fzf fallback for Linux. |
| **Configurable pane commands** | Medium | The commands (`nvim .`, `claude`, `lazygit`) are hardcoded. No way to override per-project. |
| **Reconnect/reattach** | Low | If SSH drops, panes show dead connections. No automatic reconnect logic. |

---

## 9. Redundancies

| Redundancy | Files | Severity |
|-----------|-------|----------|
| **Project registry duplication** | `cmux-workspaces.sh` (5 data structures) + `mux-remote.sh` (2 AppleScript lists) | **HIGH** -- 7 locations to update when adding a project. The AppleScript lists in mux-remote.sh are a manual copy of the data in cmux-workspaces.sh with different formatting. |
| **Raycast scripts overlap** | `raycast-scripts/*.sh` (Cursor-based project opening) overlaps with `mux` (cmux-based project opening) | **LOW** -- different tools for different workflows (Cursor vs cmux). Both are valid. |
| **cmux-debug.sh vs cmux-workspaces.sh** | Debug script duplicates core cmux CLI patterns | **NONE** -- debug script is intentionally a simplified replica for isolation testing. This is correct practice. |
| **Surface parsing** | `parse_surface()` in cmux-workspaces.sh (line 94-96) and inline awk in cmux-debug.sh (line 21, 38) | **NEGLIGIBLE** -- debug script does not need to share code with the main script |

---

## 10. Ambiguities

### Sleep timings: race condition workarounds?

**Yes, unambiguously.** The 7 `sleep` calls in `populate_workspace()` (lines 224, 228, 235, 238,
244, 248, plus the stagger sleep at line 367) are race condition workarounds for cmux's
asynchronous workspace/surface creation. The evidence:

- `sleep 0.2` after `wait_for_surface()` (line 224) -- waiting for the surface to be "fully ready"
  even though `wait_for_surface()` already confirmed it exists.
- `sleep 0.3` after `pane_exec` for nvim (line 228) -- waiting for nvim to start before splitting
  the pane.
- `sleep 0.3` after `new-split right` (line 235) -- waiting for the split to complete before
  sending commands.
- `sleep 0.3` stagger between parallel workspace launches (line 367) -- preventing cmux socket
  contention.

These are empirically-tuned values. They will be fragile across machines with different
performance characteristics, and under high load (launching all 19 workspaces simultaneously),
the timing budget may be insufficient.

**Recommendation:** cmux's CLI should provide synchronous operations or readiness signals. Until
then, the sleeps should be replaced with polling loops (like `wait_for_surface()` already does)
wherever possible. The stagger sleep (line 367) is the most defensible -- it genuinely reduces
socket contention -- but should be documented as a known workaround.

### CMUX_BRIDGE_HOST injection robustness

**Moderately robust with a silent failure mode.** The chain:

1. Mac runs `tailscale ip -4` to get its Tailscale IP (line 21)
2. If Tailscale is down, falls back to empty string
3. Empty string means `CMUX_BRIDGE_HOST` is not exported to remote sessions
4. Remote Claude Code hooks check `CMUX_BRIDGE_HOST` -- if empty, they silently skip callbacks
5. Result: remote CC sessions work but without attention badges or notifications on the Mac

The failure is graceful (no crash) but invisible (no warning). The user may not realize their
cmux notifications are dead until they notice missing badges.

### The `--local` flag

**Works correctly but is undertested.** In local mode:
- `resolve_path()` returns `$HOME/dev/$project` (line 148)
- `create_workspace()` checks directory existence (lines 169-175)
- `pane_exec()` uses `cd` directly instead of SSH (line 129)
- Environment variables `CMUX_WORKSPACE_ID` and `CMUX_SURFACE_ID` are NOT injected in local
  mode, but cmux auto-sets them (comment at line 119)

The local path works end-to-end, but there is one gap: no pre-flight check for the target
binaries (nvim, claude, lazygit) in local mode either. The directory existence check (line 170)
catches missing projects but not missing tools.

### SSH_HOST="homelab" configurability

**Adequately configurable.** The `--host` flag (line 263) allows overriding the SSH host.
`SSH_HOST` defaults to "homelab" but can be changed per-invocation. For permanent changes,
editing line 16 is the only option. An environment variable override (e.g.,
`CMUX_SSH_HOST="${CMUX_SSH_HOST:-homelab}"`) would be more flexible.

### Color-coded tabs implementation

**Clean and native.** Colors are hex strings (lines 42-44) passed to cmux's `set-status`
command with a `--color` flag (line 188, 382). cmux renders these in its vertical tab sidebar.
This is not a hack or workaround -- it uses cmux's intended API. The color refresh on every
reorder phase (line 382) ensures colors survive across sessions.

### Reorder phase on every invocation

**Over-engineered for the common case.** When running `mux oo` (single workspace), Phase 3
still iterates all 19 entries in `CANONICAL_ORDER`, issues `cmux list-workspaces`, and
potentially calls `set-status` + `reorder-workspace` for every existing workspace. This is
O(n) CLI calls where n is the total number of known projects.

For the "launch everything" case (`mux b c p`), the reorder is necessary and correct. For the
"launch one project" case, it is wasteful. A simple optimization: skip reorder when
`${#created[@]} -eq 0` (nothing new was created, so ordering has not changed).

---

## 11. Recommendations

### Critical

None. The system works and does not have data-loss or security vulnerabilities. The cmux-bridge
IP filtering (localhost + Tailscale CGNAT only) is correctly implemented.

### Important

**I1. Extract project registry to a config file.**
Move the 5 associative arrays and group definitions to a TOML or YAML file (e.g.,
`ghostty/workspaces.toml`). The script reads the config at startup. `mux-remote.sh` reads the
same file to generate its picker dialogs. This eliminates the 7-location update problem and
makes the registry machine-independent.

Example structure:
```toml
[projects.fb]
name = "Fireball"
category = "bb"
path = "fb"

[projects.oo]
name = "Otaku Odyssey"
category = "client"
path = "oo"

[categories.bb]
color = "#F59E0B"
shortcut = "b"

[categories.client]
color = "#10B981"
shortcut = "c"
```

**I2. Add error collection from parallel populate phase.**
After `wait "${pids[@]}"`, check exit codes and report failures:
```bash
for i in "${!pids[@]}"; do
  if ! wait "${pids[$i]}" 2>/dev/null; then
    echo "  ! ${created[$i]} — populate failed" >&2
    failures+=("${created[$i]}")
  fi
done
```

**I3. Replace fixed sleeps with polling where possible.**
The `sleep 0.2` and `sleep 0.3` calls after `pane_exec` and `new-split` should be replaced with
readiness checks (e.g., poll `cmux list-pane-surfaces` to confirm the split completed). Keep the
inter-workspace stagger sleep (line 367) as a documented rate-limiter.

**I4. Add pre-flight binary checks.**
Before Phase 2, verify that required tools exist on the target:
```bash
if [[ "$MODE" == "ssh" ]]; then
  ssh "$SSH_HOST" "command -v nvim && command -v lazygit" >/dev/null 2>&1 || {
    echo "Warning: required tools not found on $SSH_HOST" >&2
  }
fi
```

**I5. Add a `--kill` flag for workspace teardown.**
Enable `mux --kill b` to close all B&B workspaces, or `mux --kill oo` to close a specific one.
Currently the only way to close workspaces is through the cmux UI.

### Nice-to-Have

**N1. Skip reorder when nothing was created.**
Add a guard: `if [[ ${#created[@]} -eq 0 ]]; then echo "No new workspaces."; exit 0; fi` before
Phase 3. Or make reorder conditional on whether new workspaces were created.

**N2. Add a Tailscale connectivity warning.**
If `MAC_TAILSCALE_IP` resolves to empty (line 21), print a warning:
```bash
if [[ -z "$MAC_TAILSCALE_IP" ]]; then
  echo "  ! Tailscale not available — remote CC hooks will be disabled" >&2
fi
```

**N3. Add fzf fallback for mux-remote.sh on Linux.**
The osascript-based picker is macOS-only. A `command -v osascript` check with an fzf fallback
would make it usable on the homelab itself (e.g., when SSHed in):
```bash
if command -v osascript &>/dev/null; then
  # existing AppleScript picker
elif command -v fzf &>/dev/null; then
  # fzf-based picker
else
  echo "No picker available. Pass arguments directly." >&2
  exit 1
fi
```

**N4. Add `--dry-run` flag.**
Print what would be created without executing. Useful for verifying the project registry and
group memberships.

**N5. Consider per-project layout overrides.**
Some projects (like `cc` for `~/.claude`) may not benefit from lazygit. A layout field in the
config file (`layout = "editor-only"` or `layout = "full"`) would allow customization without
code changes.

**N6. Add cmux version assertion.**
Since the script depends on specific cmux CLI flags (`set-status`, `reorder-workspace`), add a
minimum version check at startup to fail early with a clear message rather than producing
cryptic awk parsing errors.

---

## Sources

- [cmux - The Terminal Built for Multitasking](https://cmux.com/)
- [cmux GitHub - Ghostty-based macOS terminal](https://github.com/manaflow-ai/cmux)
- [cmux on Hacker News](https://news.ycombinator.com/item?id=47079718)
- [Replacing tmux with Ghostty](https://sterba.dev/posts/replacing-tmux/)
- [tmuxinator GitHub](https://github.com/tmuxinator/tmuxinator)
- [tmuxp Documentation](https://tmuxp.git-pull.com/about.html)
- [smug GitHub](https://github.com/ivaaaan/smug)
- [tmuxp vs tmuxinator (Slant)](https://www.slant.co/versus/32439/32440/~tmuxp_vs_tmuxinator)
- [twm - Tmux Workspace Manager](https://github.com/vinnymeller/twm)
- [tmux Complete Guide 2026](https://dev.to/_d7eb1c1703182e3ce1782/tmux-tutorial-the-complete-developer-workflow-guide-2026-33b3)
- [tmux Workspace Scripting](https://ryan.himmelwright.net/post/scripting-tmux-workspaces/)
- [tmux race condition issue #3378](https://github.com/tmux/tmux/issues/3378)
- [tmux-resurrect GitHub](https://github.com/tmux-plugins/tmux-resurrect)
- [tmux-continuum GitHub](https://github.com/tmux-plugins/tmux-continuum)
- [Calyx vs cmux Comparison](https://dev.to/yuu1ch13/calyx-vs-cmux-choosing-the-right-ghostty-based-terminal-for-macos-26-28e7)
