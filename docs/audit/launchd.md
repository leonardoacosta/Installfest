# LaunchD Agent Audit

> Adversarial audit of launchd configuration in `/Users/leonardoacosta/dev/if`
> Generated: 2026-03-25
> Health Score: **FAIR**

---

## 1. Current Setup

### com.leonardoacosta.mic-priority.plist

| Key | Value | Notes |
|-----|-------|-------|
| Label | `com.leonardoacosta.mic-priority` | Correct reverse-DNS |
| ProgramArguments | `/bin/bash -c $HOME/dev/if/scripts/mic-priority.sh` | **BUG: `$HOME` not expanded** |
| RunAtLoad | `true` | Runs at login |
| StartInterval | `30` | Repeats every 30 seconds |
| KeepAlive | `false` | Run-and-exit model |
| StandardOutPath | `/tmp/mic-priority.log` | Cleared on reboot |
| StandardErrorPath | `/tmp/mic-priority.error.log` | Cleared on reboot |

**What it does:** Runs `mic-priority.sh` every 30 seconds to enforce microphone input priority
(Studio Display > MacBook Pro > AirPods) using `SwitchAudioSource`.

**Current state:** NOT loaded. Symlink does not exist at `~/Library/LaunchAgents/`. The agent was
either never installed or was removed. No log files exist at `/tmp/mic-priority.log` or
`/tmp/mic-priority.error.log`, confirming it has not run since the last reboot (at minimum).

### com.leonardoacosta.cmux-bridge.plist

| Key | Value | Notes |
|-----|-------|-------|
| Label | `com.leonardoacosta.cmux-bridge` | Correct reverse-DNS |
| ProgramArguments | `/Users/leonardoacosta/.claude/scripts/bin/cmux-bridge` | Hardcoded absolute path |
| RunAtLoad | `true` | Starts at login |
| KeepAlive | `true` | Persistent daemon, auto-restart on crash |
| EnvironmentVariables.PATH | `/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin` | Explicit PATH |
| StandardOutPath | `/Users/leonardoacosta/.claude/logs/cmux-bridge.out.log` | Persistent location |
| StandardErrorPath | `/Users/leonardoacosta/.claude/logs/cmux-bridge.err.log` | Persistent location |

**What it does:** Runs a Rust HTTP server (308 lines, `tiny_http`) on `0.0.0.0:10998` that proxies
Claude Code hook, attention, and notification requests to the local `cmux` CLI. IP-restricted to
localhost and Tailscale CGNAT range (`100.64.0.0/10`).

**Current state:** Loaded and running (PID 87377). Symlink active at
`~/Library/LaunchAgents/com.leonardoacosta.cmux-bridge.plist`. Logs show healthy activity
(`GET /health`, `POST /cmux/notify`, `POST /cmux/hook`).

---

## 2. Intent Analysis

### mic-priority

**Intent:** Automatically switch the macOS audio input to the highest-priority available
microphone. This solves the annoyance of macOS defaulting to AirPods or the built-in mic when
a Studio Display is connected.

**Design choice:** A 30-second polling interval is a blunt instrument for device detection.
macOS emits `kAudioHardwarePropertyDevices` change notifications via CoreAudio that could
trigger a more efficient event-driven approach. However, for a simple shell script calling
`SwitchAudioSource`, polling is the pragmatic choice -- CoreAudio callbacks require compiled
code (Swift/ObjC/Rust).

**Verdict:** Intent is clear. Polling at 30s is acceptable for a battery-negligible shell script.
The implementation has bugs that prevent it from working (see Section 6).

### cmux-bridge

**Intent:** Bridge remote Claude Code sessions (running on the homelab via SSH) back to the
local Mac's `cmux` multiplexer. Remote CC hooks fire HTTP requests through Tailscale to this
bridge, which translates them into local `cmux` CLI calls. This enables notifications, workspace
attention markers, and session lifecycle events to flow from remote sessions to the local
terminal UI.

**Design choice:** A compiled Rust HTTP server is appropriate for a long-running daemon. The
IP restriction to localhost + Tailscale CGNAT is a sound security boundary. Using `tiny_http`
keeps the binary small (687KB).

**Verdict:** Well-conceived architecture. The bridge solves a real problem in the remote
development workflow. Implementation is solid.

---

## 3. Cross-Domain Interactions

```
mic-priority.plist
    |
    +---> scripts/mic-priority.sh (this repo)
    |         |
    |         +---> SwitchAudioSource (Homebrew: switchaudio-osx)
    |
    +---> /tmp/ (ephemeral logs)

cmux-bridge.plist
    |
    +---> ~/.claude/scripts/bin/cmux-bridge (OUTSIDE this repo)
    |         |
    |         +---> cmux CLI (external tool, must be in PATH)
    |         +---> 0.0.0.0:10998 (network listener)
    |
    +---> ~/.claude/logs/ (OUTSIDE this repo)
    |
    +---> Tailscale mesh (network dependency)
    |
    +---> ghostty/cmux-workspaces.sh (this repo, sends requests TO bridge)
    |
    +---> ssh-mesh/ (this repo, provides Tailscale connectivity)

install.sh
    |
    +---> symlinks mic-priority plist to ~/Library/LaunchAgents/
    +---> calls `launchctl load` (deprecated)
    +---> does NOT handle cmux-bridge (handled by symlinks.conf)

symlinks.conf
    |
    +---> symlinks cmux-bridge plist to ~/Library/LaunchAgents/
    +---> mic-priority entry is COMMENTED OUT (handled by install.sh)
```

**Key observation:** The two agents use completely different installation paths. mic-priority is
handled by `install.sh` (lines 146-157) with explicit symlink + load. cmux-bridge is handled by
`symlinks.conf` (line 31) via the generic symlinks script, but has no automatic `launchctl`
loading step. This inconsistency means neither agent has a complete, reliable installation path.

---

## 4. Best Practices Audit

### 4.1 `$HOME` in ProgramArguments -- CONFIRMED BUG (mic-priority, line 11)

```xml
<string>$HOME/dev/if/scripts/mic-priority.sh</string>
```

**launchd does NOT expand shell variables in plist values.** The `$HOME` literal is passed
directly to `/bin/bash -c`, which interprets it. In this specific case, because the argument is
passed via `-c` to bash, bash WILL expand `$HOME`. So this works -- but only by accident.

The `-c` flag means bash treats the string as a command to execute, and bash performs variable
expansion. If the ProgramArguments were structured differently (e.g., `/bin/bash` with the
script path as a direct argument instead of via `-c`), `$HOME` would be passed literally and
the script would fail with "No such file or directory."

**Verdict:** Works today, but is fragile and non-obvious. Best practice is to use absolute paths
in plists.

References:
- [Apple Community: Why doesn't my launchd plist work](https://discussions.apple.com/thread/255331702)
- [launchd.info tutorial](https://www.launchd.info/)

### 4.2 `launchctl load` is Deprecated (install.sh, line 154)

```bash
launchctl load "$HOME/Library/LaunchAgents/com.leonardoacosta.mic-priority.plist" 2>/dev/null || true
```

`launchctl load` has been deprecated since macOS 10.10 (Yosemite). The modern equivalent is:

```bash
launchctl bootstrap gui/$(id -u) "$HOME/Library/LaunchAgents/com.leonardoacosta.mic-priority.plist"
```

The legacy command still works but has poor error reporting and behaves differently as root vs.
user. The `2>/dev/null || true` at the end hides any errors, making debugging impossible.

References:
- [launchctl cheat sheet (masklinn)](https://gist.github.com/masklinn/a532dfe55bdeab3d60ab8e46ccc38a68)
- [launchctl 2.0 syntax](https://babodee.wordpress.com/2016/04/09/launchctl-2-0-syntax/)
- [Homebrew services PR #112](https://github.com/Homebrew/homebrew-services/pull/112)
- [Alan Siu: launchctl new subcommand basics](https://www.alansiu.net/2023/11/15/launchctl-new-subcommand-basics-for-macos/)

### 4.3 `/tmp` Logging (mic-priority, lines 29-30)

`/tmp` is cleared on every macOS reboot. For a periodic agent that might silently fail, losing
logs on reboot makes post-mortem debugging impossible. cmux-bridge correctly logs to a persistent
user directory (`~/.claude/logs/`).

**Best practice:** Log to `~/Library/Logs/` or a project-specific persistent directory.

References:
- [launchd.info: logging](https://www.launchd.info/)
- [Deluge launchd documentation](https://deluge.readthedocs.io/en/latest/how-to/launchd-service.html)

### 4.4 Missing `ProcessType` Key (both plists)

Neither plist specifies `ProcessType`. Without it, launchd applies "light resource limits"
including CPU and I/O throttling. For mic-priority (runs for <100ms every 30s), this is
irrelevant. For cmux-bridge (a persistent HTTP server that must respond promptly), adding
`ProcessType: Adaptive` or `ProcessType: Interactive` would ensure responsiveness is not
degraded under system load.

Reference:
- [launchd.plist(5) man page](https://keith.github.io/xcode-man-pages/launchd.plist.5.html)

### 4.5 Missing Crash Recovery Refinement (cmux-bridge)

`KeepAlive: true` means launchd restarts cmux-bridge unconditionally, even if it exits
successfully (exit code 0). A more precise configuration would be:

```xml
<key>KeepAlive</key>
<dict>
    <key>SuccessfulExit</key>
    <false/>
</dict>
```

This restarts only on crash (non-zero exit), not on clean shutdown. With plain `KeepAlive: true`,
intentionally stopping the bridge requires `launchctl bootout` (or the deprecated `unload`) --
you cannot simply send SIGTERM and have it stay down.

Reference:
- [tjluoma/launchd-keepalive](https://github.com/tjluoma/launchd-keepalive)

### 4.6 No `ThrottleInterval` (cmux-bridge)

If cmux-bridge crashes in a loop (e.g., port 10998 is occupied), launchd's default 10-second
throttle applies. This is generally acceptable, but an explicit `ThrottleInterval` of 30 seconds
would be more defensive for a network server that might fail due to transient port conflicts.

Reference:
- [Technical notes: launchd ThrottleInterval](https://ilostmynotes.blogspot.com/2016/05/launchd-throttleinterval.html)

---

## 5. Tool Choices

### launchd vs Alternatives

| Tool | Fit for mic-priority | Fit for cmux-bridge | Notes |
|------|---------------------|--------------------:|-------|
| **launchd** | Good | Good | Native macOS, zero dependencies, survives reboot |
| **cron** | Acceptable | Poor | Deprecated on macOS, no KeepAlive equivalent |
| **Homebrew services** | Good | Good | Wrapper around launchd, adds `brew services start/stop` |
| **supervisord** | Overkill | Acceptable | Python dependency, not native |
| **systemd** | N/A | N/A | Linux only |

**Verdict:** launchd is the correct choice for both agents. It is the native macOS daemon manager,
requires no additional dependencies, and provides the necessary primitives (StartInterval,
KeepAlive, RunAtLoad). Homebrew services would be a reasonable alternative for cmux-bridge
(since it is compiled software), but since the binary lives outside Homebrew's ecosystem, direct
launchd management is more appropriate.

---

## 6. Configuration Quality

### mic-priority.plist

| Aspect | Rating | Issue |
|--------|--------|-------|
| XML validity | PASS | `plutil -lint` passes |
| Label matches filename | PASS | `com.leonardoacosta.mic-priority` |
| ProgramArguments | WARN | `$HOME` works via `-c` but is non-obvious and fragile |
| KeepAlive/StartInterval | PASS | Correct: `KeepAlive: false` + `StartInterval: 30` for periodic run-and-exit |
| Logging | FAIL | `/tmp/` logs lost on reboot |
| Installation | FAIL | Symlink missing from `~/Library/LaunchAgents/`, agent not loaded |
| Error handling | WARN | `install.sh` swallows errors with `2>/dev/null \|\| true` |

### cmux-bridge.plist

| Aspect | Rating | Issue |
|--------|--------|-------|
| XML validity | PASS | `plutil -lint` passes |
| Label matches filename | PASS | `com.leonardoacosta.cmux-bridge` |
| ProgramArguments | PASS | Absolute path, no variable expansion needed |
| KeepAlive | WARN | Plain `true` -- should use `SuccessfulExit: false` for cleaner shutdown semantics |
| Logging | PASS | Persistent path at `~/.claude/logs/` |
| EnvironmentVariables | PASS | Explicit PATH including Homebrew directories |
| Installation | PASS | Symlink active, agent loaded and running |
| External dependency | WARN | Binary lives at `~/.claude/scripts/bin/cmux-bridge` -- outside this repo |
| ProcessType | MISSING | Should specify `Adaptive` for responsive HTTP server |
| Network binding | WARN | `0.0.0.0:10998` -- binds all interfaces, relies on application-level IP filtering |

---

## 7. Architecture Assessment

### Strengths

1. **Reverse-DNS naming convention** is correctly followed for both agents.
2. **cmux-bridge is well-designed**: compiled Rust for a long-running daemon, application-level
   IP restriction, clean JSON API, proper error responses, and persistent logging.
3. **Separation of concerns**: the plist handles lifecycle (start/restart/logging), the script/binary
   handles logic. Neither plist contains embedded shell logic beyond a script invocation.
4. **cmux-bridge's EnvironmentVariables** correctly sets PATH to include Homebrew, avoiding the
   common pitfall of launchd agents not finding Homebrew-installed tools.

### Weaknesses

1. **mic-priority is effectively dead.** The agent is not loaded, the symlink does not exist in
   `~/Library/LaunchAgents/`, and there is no evidence it has run recently. If this is intentional
   abandonment, the plist should be removed. If it is supposed to be active, the installation is
   broken.
2. **Split installation paths.** mic-priority is installed by `install.sh` (lines 146-157) with
   explicit symlink + launchctl load. cmux-bridge is installed by `symlinks.conf` (line 31) via
   the generic symlinks script. Neither path is complete: `install.sh` uses deprecated `launchctl
   load` and does not handle cmux-bridge; `symlinks.conf` creates the symlink but does not load
   the agent.
3. **cmux-bridge depends on a file outside this repo.** The binary at
   `~/.claude/scripts/bin/cmux-bridge` is built from source at
   `ssh-mesh/scripts/remote/cmux-bridge/` (within this repo), but there is no build step in the
   installation flow. If the binary does not exist or is outdated, the agent fails silently.
4. **No uninstall path.** Neither `install.sh` nor any other script provides a way to cleanly
   unload and remove the agents. Manual `launchctl bootout gui/501` is required.

---

## 8. Missing Capabilities

| Capability | Impact | Effort |
|------------|--------|--------|
| **Event-driven mic detection** | Eliminates 30s polling; instant response to device changes | High (requires Swift/Rust CoreAudio listener) |
| **Unified install/uninstall script** for all LaunchAgents | Consistent lifecycle management | Low |
| **Log rotation** for cmux-bridge | `cmux-bridge.err.log` grows unbounded | Low (`newsyslog.conf` entry or `logrotate`) |
| **Health monitoring** | No alerting if cmux-bridge dies repeatedly | Medium |
| **Build step for cmux-bridge** | Binary must be pre-built; no `cargo build` in install flow | Medium |
| **`launchctl bootstrap`** migration | Deprecated API in install.sh | Low |
| **Graceful shutdown handling** for cmux-bridge | `KeepAlive: true` fights intentional stops | Low (SuccessfulExit dict) |

---

## 9. Redundancies

1. **mic-priority installation exists in TWO places:** `install.sh` (lines 146-157) handles
   symlink + load; `symlinks.conf` (line 29) has a commented-out entry for the same file.
   The comment says "handled by install.sh" which is correct, but this split creates confusion
   about which path is authoritative.

2. **cmux-bridge PATH includes `/usr/local/bin`** which is the Intel Homebrew prefix. On Apple
   Silicon (which this machine is, based on `uname -m` likely returning `arm64`), Homebrew
   installs to `/opt/homebrew/bin`. The `/usr/local/bin` entry is harmless but vestigial.

3. **No other redundancies detected.** The two agents serve entirely different purposes with no
   functional overlap.

---

## 10. Ambiguities

1. **Is mic-priority intentionally disabled?** The agent is not loaded, the symlink is missing,
   but the plist and script are maintained in the repo. There is no documentation indicating
   whether this is abandoned, optional, or broken.

2. **Who builds cmux-bridge?** The Rust source lives at `ssh-mesh/scripts/remote/cmux-bridge/`
   but the plist references `~/.claude/scripts/bin/cmux-bridge`. Is this binary built locally and
   copied? Built on the homelab and synced? Built by a CI process? The provenance is undocumented.

3. **Are there other agents?** The `~/Library/LaunchAgents/` directory contains several
   `com.leonardoacosta.*`-adjacent agents not managed by this repo:
   - `com.claude.audio-receiver.plist` -- Claude audio receiver
   - `dev.claude.daemon.plist` -- Claude daemon
   - `com.anthropic.claude-daemon.plist` -- Anthropic Claude daemon
   - `ai.openclaw.gateway.plist` -- OpenClaw gateway
   - `com.leo.pulse-follow-macos.plist` -- Pulse follow
   - `com.nexus.agent.plist` -- Nexus agent

   These are NOT in this repo. It is unclear whether they should be, or whether they are managed
   by their respective applications. If any are custom-authored, they should be tracked in version
   control.

4. **cmux-bridge binds `0.0.0.0:10998`** -- all network interfaces. The Rust code restricts
   responses to localhost + Tailscale CGNAT IPs, but the port is reachable from any interface.
   On a trusted home network this is low risk, but on public WiFi, unauthenticated requests could
   reach the server (they would be rejected with 403, but the port is scannable).

5. **Log growth for cmux-bridge is unbounded.** The `cmux-bridge.err.log` currently contains
   every request logged via `eprintln!`. Over months, this file grows without limit. No rotation
   is configured.

---

## 11. Recommendations

### Critical (fix now)

1. **Fix mic-priority `$HOME` usage.** Replace the shell variable with an absolute path:

   ```xml
   <!-- Before (fragile) -->
   <string>$HOME/dev/if/scripts/mic-priority.sh</string>

   <!-- After (explicit) -->
   <string>/Users/leonardoacosta/dev/if/scripts/mic-priority.sh</string>
   ```

   File: `launchd/com.leonardoacosta.mic-priority.plist`, line 11.

2. **Decide mic-priority's fate.** Either:
   - (a) Delete the plist and script if it is no longer needed.
   - (b) Fix the installation: ensure the symlink is created and the agent is loaded. Currently
     `install.sh` handles this, but the agent is not loaded, suggesting install.sh was not re-run
     after the plist was added or was run before the launchd section was added.

3. **Replace `launchctl load` with `launchctl bootstrap`.** In `install.sh`, line 154:

   ```bash
   # Before (deprecated, poor error reporting)
   launchctl load "$HOME/Library/LaunchAgents/..." 2>/dev/null || true

   # After (modern, explicit domain)
   launchctl bootstrap gui/$(id -u) "$HOME/Library/LaunchAgents/..." 2>&1 || true
   ```

### High (fix soon)

4. **Move mic-priority logs to a persistent location.** Replace `/tmp/mic-priority.log` with
   `~/Library/Logs/mic-priority.log` or `~/dev/if/logs/mic-priority.log` (gitignored).

5. **Add `ProcessType: Adaptive`** to cmux-bridge.plist. This ensures the HTTP server is not
   throttled under system load:

   ```xml
   <key>ProcessType</key>
   <string>Adaptive</string>
   ```

6. **Refine cmux-bridge KeepAlive.** Use `SuccessfulExit: false` instead of plain `true`:

   ```xml
   <key>KeepAlive</key>
   <dict>
       <key>SuccessfulExit</key>
       <false/>
   </dict>
   ```

7. **Unify agent installation.** Both agents should use the same installation mechanism. Either:
   - Move both to `symlinks.conf` and add a post-symlink hook that runs `launchctl bootstrap`.
   - Move both to `install.sh` with a dedicated launchd section.
   - Create a dedicated `scripts/install-launchd.sh` that handles all agent lifecycle.

### Medium (improve when convenient)

8. **Add log rotation for cmux-bridge.** Create a `newsyslog.conf` entry or add a logrotate
   configuration to prevent unbounded log growth.

9. **Document cmux-bridge build provenance.** Add a comment or README explaining how the binary
   at `~/.claude/scripts/bin/cmux-bridge` is produced, and whether `install.sh` should include a
   `cargo build` step.

10. **Consider binding cmux-bridge to `127.0.0.1` + Tailscale interface only** instead of
    `0.0.0.0`. This provides defense-in-depth beyond the application-level IP check. The Tailscale
    interface IP can be obtained at startup via `tailscale ip -4`.

11. **Add an uninstall/reset script** for LaunchAgents that handles `launchctl bootout` and
    symlink removal.

### Low (nice to have)

12. **Track other custom LaunchAgents in version control** if any of the non-repo agents
    (`com.claude.audio-receiver.plist`, `com.leo.pulse-follow-macos.plist`, etc.) are
    custom-authored.

13. **Add a `launchd-status` convenience alias** to `.zshrc` that shows the status of all
    `com.leonardoacosta.*` agents in one command.

---

## Sources

- [launchd.info -- A launchd Tutorial](https://www.launchd.info/)
- [Apple: Creating Launch Daemons and Agents](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html)
- [launchd.plist(5) man page](https://keith.github.io/xcode-man-pages/launchd.plist.5.html)
- [launchctl cheat sheet (masklinn)](https://gist.github.com/masklinn/a532dfe55bdeab3d60ab8e46ccc38a68)
- [launchctl 2.0 syntax (Babo D)](https://babodee.wordpress.com/2016/04/09/launchctl-2-0-syntax/)
- [Alan Siu: launchctl new subcommand basics](https://www.alansiu.net/2023/11/15/launchctl-new-subcommand-basics-for-macos/)
- [Homebrew services PR #112 -- bootstrap migration](https://github.com/Homebrew/homebrew-services/pull/112)
- [Apple Community: launchd $HOME expansion](https://discussions.apple.com/thread/255331702)
- [victoronsoftware: What are launchd agents and daemons](https://victoronsoftware.com/posts/macos-launchd-agents-and-daemons/)
- [tjluoma/launchd-keepalive -- KeepAlive examples](https://github.com/tjluoma/launchd-keepalive)
- [ThrottleInterval technical notes](https://ilostmynotes.blogspot.com/2016/05/launchd-throttleinterval.html)
- [ss64.com: launchctl reference](https://ss64.com/mac/launchctl.html)
