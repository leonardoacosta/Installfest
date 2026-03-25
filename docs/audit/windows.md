# Windows Cross-Platform Setup Audit

> Adversarial audit of the Windows domain in the `if` dotfiles repository.
> Scope: `windows/setup.ps1`, `windows/install.cmd`, `windows/mac-keyboard.ahk`, `windows/wezterm-windows.lua`
> Generated: 2026-03-25

**Health Score: FAIR**

The Windows setup is functional, well-structured for its size, and correctly uses AHK v2. However,
it suffers from untested WSL2 Arch bootstrapping, a fragile 3-layer key remapping chain, significant
overlap with `ssh-mesh/scripts/setup-cloudpc.ps1`, hardcoded resource limits, and missing
idempotency guarantees. The "no Docker Desktop" approach is sound but the Docker-in-WSL2 path is
entirely manual and undocumented beyond a comment block.

---

## 1. Current Setup

| File | Lines | Complexity | Purpose |
|------|------:|------------|---------|
| `windows/setup.ps1` | 680 | Medium-High | Full Windows dev environment provisioning: OpenSSH, WSL2 Arch, winget apps, WezTerm, AHK, Git, PS profile, fonts, WSL config |
| `windows/install.cmd` | 41 | Low | Bootstrap batch file: UAC elevation, execution policy bypass, launches setup.ps1 |
| `windows/mac-keyboard.ahk` | 181 | Medium | AHK v2 script: remaps Mac keyboard (via Synergy) to Windows Ctrl-based equivalents |
| `windows/wezterm-windows.lua` | 124 | Medium | WezTerm config adapted for Windows: WSL2 Arch default shell, Ctrl-based tmux keybindings |

### File-by-File Breakdown

**setup.ps1** (680 lines)
- 9 modular sections as named functions, each gated by y/n prompts
- `$Config` hashtable centralizes all tunable values (apps, paths, ports)
- `Set-StrictMode -Version Latest` and `$ErrorActionPreference = "Stop"` -- good hygiene
- `#Requires -RunAsAdministrator` directive at top -- proper guard
- Sections: OpenSSH Server, WSL2+Arch, winget apps, WezTerm config, AHK script, Git config,
  PowerShell profile, Nerd Fonts, WSL2 config

**install.cmd** (41 lines)
- Uses `net session` to detect admin privileges
- Re-launches self with `Start-Process -Verb RunAs` if not elevated
- Sets execution policy to Bypass scope Process (non-persistent) before calling setup.ps1
- Error handling with `%errorlevel%` check and `pause` on failure

**mac-keyboard.ahk** (181 lines)
- Uses `#Requires AutoHotkey v2.0` -- correctly targets AHK v2 (not deprecated v1)
- `#SingleInstance Force` prevents duplicate instances
- Covers: text editing, tab/window management, tab switching (1-9), navigation, text selection,
  word navigation, dev tools, window switching (Alt+Tab), Raycast trigger, screenshots, lock screen
- Start Menu suppression logic for Win key release
- Custom tray menu with Reload, Suspend, Exit options
- ~50 distinct hotkey mappings

**wezterm-windows.lua** (124 lines)
- Launches WSL2 Arch as default program: `wsl.exe -d Arch --cd ~`
- Mirrors Mac config appearance (font, color scheme, opacity, padding)
- Keybindings use CTRL modifier (post-AHK remapping) instead of CMD
- Tmux integration via identical escape sequences as Mac config
- Text editing: Alt+arrow word nav, Home/End line nav, tmux copy mode shortcuts

---

## 2. Intent Analysis

The Windows setup targets a **CloudPC dev environment** accessed from a Mac via Synergy. The
architecture is:

```
Mac keyboard (Cmd-based) --> Synergy (sends Cmd as Win key) --> AHK (remaps Win to Ctrl)
    --> WezTerm (intercepts Ctrl combos, sends tmux sequences) --> WSL2 Arch (zsh + tmux)
```

The goal: a developer sitting at a Mac can use the same muscle memory on a Windows CloudPC with
near-identical keybindings. WSL2 Arch provides the Linux environment matching the homelab, while
native Windows apps (VS Code, Cursor, Visual Studio) handle .NET/Azure development.

This is a legitimate cross-platform strategy. The approach trades setup complexity for usage
consistency.

---

## 3. Cross-Domain Interactions

| From | To | Interface | Risk |
|------|----|-----------|------|
| `windows/setup.ps1` | `ssh-mesh/` | OpenSSH Server config + Tailscale firewall rule | Overlaps with `setup-cloudpc.ps1` SSH setup |
| `windows/setup.ps1` | `wezterm/` | Copies `wezterm-windows.lua` to `%USERPROFILE%\.config\wezterm\` | One-time copy, not symlinked -- config drift |
| `windows/setup.ps1` | `windows/mac-keyboard.ahk` | Copies AHK script to `%APPDATA%\AutoHotKey\` + startup shortcut | Same drift concern |
| `windows/mac-keyboard.ahk` | `karabiner/mac_osx_on_rdp.json` | Reverse-direction mapping (AHK: Mac->Win, Karabiner: Mac->RDP) | Should be symmetric but aren't |
| `windows/wezterm-windows.lua` | `wezterm/wezterm.lua` | Adapted copy with CTRL instead of CMD | Escape sequences must stay in sync |
| `windows/wezterm-windows.lua` | `tmux/tmux.conf` | Custom escape sequences (User0-User19) | Changes to tmux.conf break Windows too |
| `windows/setup.ps1` | `scripts/install-arch.sh` | WSL2 instructions tell user to run `install.sh` inside Arch | Untested WSL2 path |

---

## 4. Best Practices Audit

### PowerShell / winget (2025-2026 best practices)

**What the ecosystem recommends:**
- Microsoft now offers [WinGet Configuration](https://learn.microsoft.com/en-us/windows/package-manager/configuration/)
  (YAML-based declarative DSC files) for idempotent machine setup. This is the modern replacement
  for imperative `winget install` loops.
- DSC configuration files are idempotent by design, versionable, and sharable.
- Best practice: store configuration as code in version control, use semantic versioning.

**What this repo does:**
- Imperative `winget install` loop in `Install-WingetApps` (lines 375-406)
- `winget list --id $app` check for idempotency (line 379) -- functional but brittle (string
  matching against CLI output)
- No DSC/WinGet Configuration file

**Verdict:** The imperative approach works but is behind the curve. A `winget.dsc.yaml` file would
be more maintainable, idempotent, and alignable with the declarative philosophy of the rest of the
dotfiles repo.

### AutoHotkey (v1 vs v2)

**What the ecosystem recommends:**
- AHK v1 is deprecated and no longer developed. All new scripts should use v2.
- AHK v2 requires `#Requires AutoHotkey v2.0`, uses function-style hotkeys with curly braces,
  and changes variable scoping (everything in hotkeys is local by default).
- Migration tools exist at [mmikeww/AHK-v2-script-converter](https://github.com/mmikeww/AHK-v2-script-converter).

**What this repo does:**
- `mac-keyboard.ahk` line 12: `#Requires AutoHotkey v2.0` -- **correctly uses v2**
- Syntax is valid v2 throughout (fat arrow lambdas in tray menu, function-style hotkey at line 162)
- `#SingleInstance Force` is correct v2 syntax

**Verdict:** No migration needed. The script is already properly written for AHK v2. Well done.

### WezTerm on Windows vs Windows Terminal

**What the ecosystem recommends:**
- Windows Terminal is the native choice, well-integrated with WSL2, actively maintained by Microsoft.
- WezTerm wins on cross-platform config sharing and Lua scriptability.
- For users who need identical keybinding behavior across Mac and Windows, WezTerm is the correct choice.

**What this repo does:**
- Uses WezTerm for cross-platform consistency with Mac config
- Leverages Lua scripting for tmux escape sequence integration
- Launches WSL2 Arch as default program (replicating Mac terminal-into-tmux workflow)

**Verdict:** WezTerm is the correct choice here. The use case (Mac keyboard via Synergy, tmux
integration, cross-platform config parity) makes Windows Terminal a poor fit despite its native
integration.

---

## 5. Tool Choices

### AHK v1 vs v2

| Criterion | AHK v1 | AHK v2 |
|-----------|--------|--------|
| Status | Deprecated, EOL | Active, recommended |
| Syntax | Legacy (no braces, global scope) | Modern (function-style, local scope) |
| This repo | N/A | **Correctly used** |

No action needed. The script is AHK v2.

### PowerShell vs WinGet Configuration

| Criterion | Imperative PS1 | WinGet DSC |
|-----------|----------------|------------|
| Idempotency | Manual checks | Built-in |
| Readability | Procedural loops | Declarative YAML |
| Maintainability | Medium | High |
| Error handling | Manual | DSC handles |
| Ecosystem adoption | Legacy | Growing (Microsoft push since 2024) |

Recommendation: Consider migrating the `$Config.WingetApps` list to a `winget.dsc.yaml` for the
app installation portion. The SSH, WSL2, and config-copy sections benefit from staying imperative.

### WezTerm vs Windows Terminal

| Criterion | WezTerm | Windows Terminal |
|-----------|---------|-----------------|
| Cross-platform config | Lua (shared patterns) | JSON (Windows-only) |
| tmux escape sequences | Custom key bindings | Limited |
| WSL2 integration | `wsl.exe -d Arch` | Native profiles |
| GPU acceleration | Yes (Rust) | Yes |
| Mac keybinding parity | High (Lua scripting) | Low |

WezTerm is the right choice for this use case. No change recommended.

### Docker: "No Docker Desktop"

| Criterion | Docker Desktop | Docker Engine in WSL2 | Rancher Desktop | Podman |
|-----------|---------------|----------------------|-----------------|--------|
| License | Paid for >250 employees | Free | Free (SUSE) | Free |
| WSL2 integration | Native | Manual (systemd) | WSL2 backend | WSL2 backend |
| Setup complexity | Low | Medium | Low | Medium |
| Kubernetes | Optional | None | Built-in | CRI-O |

The "no Docker Desktop" approach at `setup.ps1` line 363-366 instructs users to install Docker
Engine directly inside WSL2 Arch via pacman. This is valid and avoids licensing concerns.

**Issue:** The Docker setup is entirely manual (printed instructions, not automated). The user must:
1. Enter WSL2 Arch
2. Run `sudo pacman -S docker docker-buildx docker-compose`
3. Enable the service and add themselves to the docker group

For a CloudPC environment, **Rancher Desktop** or **Podman Desktop** would be simpler alternatives
with GUI management. However, if the intent is pure CLI Docker matching the homelab, the current
approach is fine -- it just needs automation.

---

## 6. Configuration Quality

### setup.ps1

**Strengths:**
- `Set-StrictMode -Version Latest` (line 20) -- catches common bugs
- `$ErrorActionPreference = "Stop"` (line 21) -- fail-fast behavior
- `#Requires -RunAsAdministrator` (line 1) -- proper guard
- Config hashtable centralizes all tunables (lines 27-94)
- Try-catch blocks around each section (line 653-659)
- Conditional execution with y/n prompts (line 650)

**Weaknesses:**

1. **SSH config generation fragility** (lines 156-178): The script tries to generate sshd_config by
   starting/stopping the service, then falls back to writing a hardcoded default. This two-phase
   approach is fragile -- if the service starts but config generation is delayed, the fallback
   overwrites it.

2. **ACL manipulation without clearing existing rules** (lines 224-239): `$acl.SetAccessRuleProtection($true, $false)`
   disables inheritance and removes inherited rules, but then only *adds* rules without clearing
   explicit existing rules first. If the script runs twice with different users, stale ACLs accumulate.

3. **Hardcoded WSL2 resource limits** (lines 596-601): `memory=8GB`, `processors=4` are hardcoded.
   A CloudPC with 16+ cores and 32GB+ RAM would be underutilized. The `Write-Warn` at line 610
   tells users to adjust, but the script should detect available resources.

4. **`$MyInvocation.ScriptName` inside functions** (lines 421, 449): When called inside a function
   invoked via `& $section.Fn`, `$MyInvocation.ScriptName` may return empty or the wrong path.
   `$PSScriptRoot` would be more reliable.

5. **Scoop installation via downloaded script** (lines 311-314): Downloads and executes an arbitrary
   PowerShell script from the internet. No checksum verification.

### install.cmd

**Strengths:**
- Non-persistent execution policy (`-Scope Process`) -- does not change system-wide policy
- UAC elevation via `Start-Process -Verb RunAs`
- Error code propagation

**Weaknesses:**

1. **Execution policy Bypass** (line 20 and 30): While `-Scope Process` limits the blast radius,
   `Bypass` is the least restrictive policy. `RemoteSigned` would be more appropriate since the
   script is a local file. Microsoft's own guidance recommends `RemoteSigned` for development
   environments.

2. **Double execution policy set** (line 20 sets it, line 30 also passes `-ExecutionPolicy Bypass`):
   Line 20 (`Set-ExecutionPolicy Bypass -Scope Process -Force`) runs in a separate PowerShell
   process that exits immediately. It has no effect on line 30's process. Line 20 is dead code.

3. **No path validation**: If `setup.ps1` is not in the same directory as `install.cmd`, `%~dp0setup.ps1`
   fails silently or with a confusing error.

### mac-keyboard.ahk

**Strengths:**
- Proper v2 syntax throughout
- `#SingleInstance Force` prevents duplicate instances
- Start Menu suppression logic (lines 162-167) handles a real pain point
- Custom tray menu with Suspend toggle for debugging
- Well-organized sections with clear comments

**Weaknesses:**

1. **No per-application exclusions** (entire file): All remappings are global. If the user opens a
   native Windows app that expects Win+key shortcuts (e.g., Win+E for Explorer, Win+D for desktop),
   those are intercepted. AHK v2 supports `#HotIf WinActive("ahk_exe ...")` for conditional hotkeys.

2. **Cmd+` (backtick) for same-app window switching** (lines 110-118): The comment says "best-effort
   approximation" and suggests PowerToys, but no actual hotkey is defined. The section is a comment
   with no implementation.

3. **Cmd+Space maps to Alt+Space** (line 126): Comment says this triggers Raycast on Windows. But
   Raycast on Windows is relatively new and its default trigger may have changed. If Raycast is not
   installed, Alt+Space opens the window system menu -- potentially confusing.

4. **Media keys commented out** (lines 132-138): If Synergy does not handle media keys, these are
   dead. No detection or fallback.

### wezterm-windows.lua

**Strengths:**
- Launches WSL2 Arch directly as default program (line 24)
- Identical appearance settings to Mac config
- Escape sequences match Mac config exactly (verified: same `\x1b[...;CMD~` patterns)
- Text editing shortcuts properly adapted for the AHK->Ctrl->WezTerm chain

**Weaknesses:**

1. **Copy/paste conflict** (lines 84-93): The config binds `CTRL|SHIFT` for copy/paste (lines 86-87)
   but AHK remaps `Cmd+C` to `Ctrl+C` system-wide. When the user presses Cmd+C in WezTerm:
   - AHK sends Ctrl+C
   - WezTerm sees Ctrl+C and sends SIGINT (not copy)
   - The user must use Ctrl+Shift+C to copy
   This is a known WezTerm-on-Windows pain point, but the comment at line 84-85 ("Ctrl+C copies if
   selection exists, sends SIGINT otherwise") describes WezTerm's *default* behavior, not what
   happens with these explicit CTRL|SHIFT bindings. The Mac config uses `CMD` modifier (lines 87-88
   of `wezterm.lua`) which avoids this conflict entirely.

2. **Missing SSH domains** (compared to Mac config): The Mac `wezterm.lua` defines `ssh_domains`
   for homelab (line 25-31). The Windows config has none. If the user needs to SSH from WezTerm
   on Windows to the homelab, they must do it manually through the WSL2 shell.

3. **Cmd+D split conflict** (lines 74-79): On Mac, `Cmd+D` splits vertically. On Windows, AHK
   remaps `Cmd+D` to `Ctrl+D`. But `Ctrl+D` is EOF in terminals. The config correctly uses
   `CTRL|SHIFT` for the split, but this means the Mac mapping (Cmd+D for split) becomes
   Ctrl+Shift+D on Windows -- a muscle memory break. The comment explains this but it is a
   functional asymmetry.

4. **No `font_size` specified**: The Mac config also omits this, relying on the default. On Windows
   with different DPI scaling (especially CloudPC via RDP), the default font size may not match.

---

## 7. Architecture Assessment

### The 3-Layer Key Remapping Chain

```
Layer 1: Synergy     -- Mac Cmd key arrives as Win key on Windows
Layer 2: AutoHotKey  -- Win key combos remapped to Ctrl combos (system-wide)
Layer 3: WezTerm     -- Ctrl combos intercepted and converted to tmux escape sequences
```

**Fragility Analysis:**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AHK not running (crash, startup race) | Medium | High -- all keybindings broken | Startup shortcut + `#SingleInstance Force` |
| Synergy disconnects | Low | High -- no keyboard at all | Synergy auto-reconnect |
| AHK conflicts with other Win+key hooks | Medium | Medium -- specific shortcuts fail | No per-app exclusions currently |
| WezTerm update changes key handling | Low | Medium -- tmux integration breaks | Pin WezTerm version |
| Timing issue between layers | Low | Low -- occasional missed keypress | Synergy + AHK are both low-latency |

**Verdict:** The chain works but is inherently fragile. Any single layer failing breaks the entire
keybinding experience. There is no fallback mode and no health check. A systemd-equivalent watchdog
for AHK would help (Task Scheduler restart-on-failure).

### Overall Architecture

```
install.cmd
    |
    v
setup.ps1 (9 sections, each y/n gated)
    |
    +-- OpenSSH Server (sshd_config + firewall)
    +-- WSL2 + ArchWSL (scoop install, manual bootstrap)
    +-- winget apps (imperative loop)
    +-- WezTerm config (file copy)
    +-- AHK script (file copy + startup shortcut)
    +-- Git config (global settings)
    +-- PowerShell profile (minimal, defers to WSL)
    +-- Nerd Fonts (scoop)
    +-- WSL2 .wslconfig (hardcoded limits)
```

The architecture is sound for a personal setup script. It is modular, each section is independently
runnable, and the config hashtable enables customization. The main architectural weakness is that
it is entirely imperative with no state tracking -- running it twice may produce different results
(e.g., ACL accumulation, profile overwrite).

---

## 8. Missing Capabilities

| Capability | Impact | Difficulty |
|------------|--------|------------|
| **Automated WSL2 Arch bootstrap** | High -- current setup requires 6 manual steps | Medium |
| **Docker Engine automation in WSL2** | Medium -- manual pacman install + service enable | Low |
| **Health check / verification script** | Medium -- no way to validate setup succeeded | Low |
| **WinGet Configuration (DSC) file** | Low -- would improve maintainability | Low |
| **WSL2 resource auto-detection** | Low -- hardcoded 8GB/4 cores may underutilize | Low |
| **AHK per-application exclusions** | Medium -- Win+E, Win+D, Win+L intercepted | Low |
| **Starship for PowerShell** | Low -- profile checks for it but doesn't install it | Low |
| **Windows Update / feature update handling** | Low -- WSL features may need re-enabling after major updates | Medium |
| **Backup/restore of existing configs** | Medium -- profile overwrite is destructive | Low |
| **Uninstall/cleanup script** | Low -- no way to reverse the setup | Medium |

---

## 9. Redundancies

### With Karabiner (`karabiner/mac_osx_on_rdp.json`)

These two configs solve the **reverse** problem:

| Direction | Tool | Context |
|-----------|------|---------|
| Mac keyboard -> Windows (via Synergy) | `mac-keyboard.ahk` | Mac user controlling Windows CloudPC via shared keyboard |
| Mac keyboard -> Windows (via RDP) | `karabiner/mac_osx_on_rdp.json` | Mac user controlling Windows CloudPC via Remote Desktop |

**Symmetry Analysis:**

| Mapping | AHK (mac-keyboard.ahk) | Karabiner (mac_osx_on_rdp.json) | Symmetric? |
|---------|------------------------|----------------------------------|------------|
| Cmd+C/V/X -> Ctrl+C/V/X | Lines 23-25 | Lines 221-321 | Yes |
| Cmd+Z -> Ctrl+Z | Line 27 | Lines 402-437 | Yes |
| Cmd+Shift+Z -> Ctrl+Y (redo) | Line 28 | Lines 440-476 (Ctrl+Shift+Z) | **No** -- AHK sends Ctrl+Y, Karabiner sends Ctrl+Shift+Z |
| Cmd+A -> Ctrl+A | Line 26 | Lines 480-518 | Yes |
| Cmd+S -> Ctrl+S | Line 29 | Lines 521-558 | Yes |
| Cmd+Tab -> Alt+Tab | Line 107 | Lines 180-218 | Yes |
| Cmd+Q -> Alt+F4 | Line 41 | Lines 1036-1071 | Yes |
| Cmd+Left/Right -> Home/End | Lines 58-59 | Lines 7-92 | Yes |
| Cmd+Shift+Left/Right -> Shift+Home/End | Lines 65-66 | Lines 95-176 | Yes |
| Option+Left/Right -> Ctrl+Left/Right | Lines 72-73 | Lines 325-398 | Yes |
| Cmd+F -> Ctrl+F | Line 31 | Lines 799-837 | Yes |
| Cmd+T -> Ctrl+T | Line 36 | Lines 714-753 | Yes |
| Cmd+W -> Ctrl+W | Line 37 | Lines 881-919 | Yes |
| Cmd+N -> Ctrl+N | Line 39 | Lines 562-599 | Yes |
| Cmd+R -> Ctrl+R (AHK) / F5 (Karabiner) | Line 56 | Lines 603-673 | **No** -- different Windows targets |
| Cmd+/ -> Ctrl+/ | Line 95 | Lines 1074-1111 | Yes |
| Cmd+Space -> Alt+Space (AHK) / Shift+Alt (Karabiner) | Line 126 | Lines 959-995 | **No** -- different targets |
| Cmd+L -> Ctrl+L | Line 55 | Lines 677-711 | Yes |

**Key asymmetries:**
1. **Redo**: AHK sends `Ctrl+Y` (Windows standard), Karabiner sends `Ctrl+Shift+Z`. Both work in
   most apps, but behavior may differ in some editors.
2. **Refresh**: AHK sends `Ctrl+R`, Karabiner sends `F5`. Both reload pages but `Ctrl+R` is more
   universal.
3. **Cmd+Space**: AHK targets Raycast (`Alt+Space`), Karabiner targets input method switching
   (`Shift+Alt`). These serve fundamentally different purposes.

**Mappings in AHK but NOT in Karabiner:**
- Tab switching (Cmd+1-9), line 44-52
- Dev tool shortcuts (Cmd+P, Cmd+Shift+P, Cmd+B, Cmd+J, Cmd+`, etc.), lines 81-95
- Screenshot mappings (Cmd+Shift+3/4/5), lines 150-152
- Lock screen (Cmd+Ctrl+Q), line 144
- Start Menu suppression, lines 162-167
- Cmd+Backspace -> delete to line start, line 62

**Mappings in Karabiner but NOT in AHK:**
- Cmd+O -> Ctrl+O (Open), Karabiner lines 840-878
- Browser DevTools (Cmd+Shift+I), Karabiner lines 756-796
- Fn+Space -> input method switch, Karabiner lines 922-957

The two configs are **not symmetric** and serve different access paths. This is acceptable but
should be documented. Deviations should be intentional, not accidental.

### With `ssh-mesh/scripts/setup-cloudpc.ps1`

| Aspect | `windows/setup.ps1` | `ssh-mesh/scripts/setup-cloudpc.ps1` |
|--------|---------------------|--------------------------------------|
| OpenSSH config | Modifies `sshd_config`, creates `authorized_keys`, sets ACLs | Creates `authorized_keys` for 2 users, sets admin `authorized_keys` with `icacls` |
| SSH keys | Creates empty `authorized_keys`, tells user to add key | **Embeds private key directly in script** (line 14-22) |
| Scope | Full dev environment setup | SSH access only |
| When to run | Initial machine setup | After SSH Server is already installed |

**Overlap:** Both scripts create `authorized_keys` files and set permissions. Running both in
sequence could conflict -- `setup.ps1` creates an empty `authorized_keys`, then `setup-cloudpc.ps1`
overwrites it with the mesh key. The ACL approaches also differ (`System.Security.AccessControl`
in setup.ps1 vs `icacls` in setup-cloudpc.ps1).

**Canonical source:** Neither. `setup.ps1` should call or defer to `setup-cloudpc.ps1` for SSH key
setup, or `setup-cloudpc.ps1` should be absorbed into `setup.ps1` as the SSH section. Currently
they are independent scripts with no awareness of each other.

**Security concern:** `setup-cloudpc.ps1` embeds a private SSH key (lines 14-22). While the
`.gitignore` lists `ssh-mesh/keys/`, the `setup-cloudpc.ps1` script itself is tracked in git and
contains the key material. This private key is exposed in the repository history.

---

## 10. Ambiguities

1. **Which script runs first?** `windows/setup.ps1` installs OpenSSH and creates an empty
   `authorized_keys`. `ssh-mesh/scripts/setup-cloudpc.ps1` writes the actual SSH key. The
   dependency is undocumented. If `setup-cloudpc.ps1` runs first, `setup.ps1` may overwrite the
   key with an empty file.

2. **Is the Arch Linux installer WSL2-compatible?** `setup.ps1` (line 356) instructs the user to
   run `cd if && ./install.sh` inside WSL2 Arch. But `install.sh` is designed for bare-metal Arch
   and macOS. It calls `scripts/install-arch.sh`, which installs Docker, systemd services, and AUR
   packages. In WSL2:
   - `systemctl` requires `systemd=true` in `/etc/wsl.conf` (not configured by setup.ps1)
   - Docker service management differs from bare-metal
   - AUR helpers (yay, paru) work but require `base-devel` (which is mentioned)
   - The script is **untested for WSL2** based on the lack of any WSL-specific guards

3. **Synergy configuration**: `setup.ps1` installs Synergy (line 73) and AHK (line 76), but there
   is no Synergy configuration file in the repo. The user must manually configure Synergy to connect
   to the Mac. What server/client roles? What screen arrangement?

4. **PowerShell 7 vs 5.1**: `setup.ps1` sets SSH default shell to PowerShell 7 if available (line
   243-244), but does not install PowerShell 7. It is not in the winget apps list. The fallback is
   PowerShell 5.1.

5. **"Run as Administrator" flow**: The `.NOTES` section says "Right-click PowerShell -> Run as
   Administrator", but `install.cmd` handles elevation automatically. These are two different entry
   points with different behaviors. Which is recommended?

6. **Font installation order**: `Install-NerdFonts` (section 8) requires scoop, which is installed
   in `Install-WSL2Arch` (section 2). If the user skips section 2, section 8 fails silently with
   "Scoop not installed, skipping nerd fonts." But fonts are also installed via winget
   (`JetBrains.Mono` at line 87). The scoop fonts (GeistMono-NF, JetBrainsMono-NF, CascadiaMono-NF)
   overlap with the winget JetBrains Mono install. Which is canonical?

7. **Dotfiles repo URL**: `$Config.DotfilesRepo` (line 29) is `git@github.com:leonardoacosta/dotfiles.git`
   but the actual repo might be named `if` (based on `$Config.DotfilesPath = "~/dev/if"`). If the
   GitHub repo is actually named `dotfiles` and cloned to `if`, this works. But it is confusing.

---

## 11. Recommendations

### Critical (should fix)

1. **Document the execution order** between `windows/setup.ps1` and
   `ssh-mesh/scripts/setup-cloudpc.ps1`. Either make setup.ps1 call setup-cloudpc.ps1 at the end
   of the SSH section, or merge the SSH key setup into setup.ps1. The current state risks
   overwriting SSH keys.

2. **Add WSL2 guards to `scripts/install-arch.sh`**: Detect WSL2 (`grep -qi microsoft /proc/version`)
   and skip or adapt Docker systemd commands. Without this, the "clone dotfiles and run install.sh"
   instruction in setup.ps1 will partially fail inside WSL2.

3. **Fix `$MyInvocation.ScriptName` in functions** (setup.ps1 lines 421, 449): Replace with
   `$PSScriptRoot` to reliably resolve the script directory regardless of invocation method.

### Important (should address)

4. **Add per-application exclusions to AHK**: At minimum, exclude Win+E (Explorer), Win+D
   (Desktop), Win+L (Lock) from global interception. Use `#HotIf !WinActive("ahk_class Shell_TrayWnd")`
   or similar guards to let native Windows shortcuts through when not in Synergy-controlled apps.

5. **Auto-detect WSL2 resources** in `Install-WSLConfig`: Query available RAM and CPU cores, then
   allocate a reasonable percentage (e.g., 75% RAM, all cores minus 1).

6. **Remove dead code in install.cmd**: Line 20 (`Set-ExecutionPolicy Bypass -Scope Process -Force`)
   runs in a separate PowerShell process and has no effect on line 30. Remove it.

7. **Add SSH domains to wezterm-windows.lua**: Port the `ssh_domains` config from the Mac
   `wezterm.lua` so WezTerm on Windows can directly SSH to the homelab without going through
   WSL2 first.

### Nice to Have

8. **Migrate winget apps to WinGet Configuration**: Create a `windows/winget.dsc.yaml` for
   declarative, idempotent app installation. Keep the imperative setup.ps1 for sections that
   need procedural logic (SSH, WSL2, config copies).

9. **Automate WSL2 Arch bootstrap**: The 6-step manual process (lines 332-368) could be partially
   automated using `wsl -d Arch -u root -- bash -c "..."` for pacman init, user creation, and
   package installation.

10. **Add AHK health check**: A Task Scheduler entry that restarts AHK if it crashes, or a
    PowerShell watchdog script. The startup shortcut only covers boot, not runtime crashes.

11. **Resolve the copy vs symlink strategy**: WezTerm and AHK configs are copied, not symlinked.
    This means updating the repo does not update the live config. Consider either:
    - Creating a Windows-compatible symlink (`New-Item -ItemType SymbolicLink`)
    - Adding a "sync" command that re-copies from the repo

12. **Standardize redo mapping**: AHK sends `Ctrl+Y` for redo, Karabiner sends `Ctrl+Shift+Z`.
    Pick one and align both configs. `Ctrl+Y` is the Windows standard; `Ctrl+Shift+Z` is more
    universal across apps.

---

## Sources

- [WinGet Configuration - Microsoft Learn](https://learn.microsoft.com/en-us/windows/package-manager/configuration/)
- [WinGet Configuration: Set up your dev machine in one command](https://developer.microsoft.com/blog/winget-configuration-set-up-your-dev-machine-in-one-command)
- [AutoHotkey v2 Changes Documentation](https://www.autohotkey.com/docs/v2/v2-changes.htm)
- [AHK v2 Migration Guide](https://www.autohotkey.com/boards/viewtopic.php?t=114324)
- [Windows Terminal vs WezTerm - Slant](https://www.slant.co/versus/34392/38945/~windows-terminal_vs_wezterm)
- [Best Terminal Emulators 2026 - Scopir](https://scopir.com/posts/best-terminal-emulators-developers-2026/)
- [Docker Desktop Alternatives 2025 - fsck.sh](https://fsck.sh/en/blog/docker-desktop-alternatives-2025/)
- [Docker Desktop vs Podman vs Rancher Desktop 2026](https://www.devtoolreviews.com/reviews/docker-desktop-vs-podman-vs-rancher-desktop)
- [Install Arch Linux on WSL - ArchWiki](https://wiki.archlinux.org/title/Install_Arch_Linux_on_WSL)
- [ArchWSL Documentation](https://wsldl-pg.github.io/ArchW-docs/How-to-Setup/)
- [PowerShell Execution Policies - Microsoft Learn](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies)
- [Synergy Alternatives 2025 - AlternativeTo](https://alternativeto.net/software/synergy/)
- [Deskflow (Barrier/Synergy successor)](https://github.com/deskflow/deskflow)
