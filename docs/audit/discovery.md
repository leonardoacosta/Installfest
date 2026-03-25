# Repository Discovery: Installfest (if)

> Exhaustive inventory of `/Users/leonardoacosta/dev/if`
> Generated: 2026-03-25

---

## 1. File Inventory

Total files: 115 (excluding `.git/` and Rust `target/` build artifacts)
Total lines: 12,234 (excluding binary/build artifacts)

### Root Files

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `.claude/settings.json` | config | 24 | Claude Code hooks (beads sync on stop) and permissions (docker, git, bd) |
| `.claude/settings.local.json` | config | 12 | Local Claude Code permissions (defaults read, notify, bash, git) |
| `.cursorignore` | config | 0 | Tells Cursor to ignore `env` directory |
| `.DS_Store` | data | 1 | macOS Finder metadata (binary) |
| `.gitignore` | config | 56 | Ignores secrets, service config dirs, caches, OS files, SSH keys |
| `.vscode/settings.json` | config | 53 | VS Code settings (ESLint, Prettier, Tailwind, TypeScript, perf exclusions) |
| `AGENTS.md` | documentation | 18 | OpenSpec agent instructions block |
| `CLAUDE.md` | documentation | 125 | Claude Code project guide: repo overview, directory structure, shell flow, commands |
| `README.md` | documentation | 298 | User-facing setup guide: prerequisites, installation, configuration, troubleshooting |
| `install.sh` | script | 171 | Main interactive installer: detects OS, runs platform setup, creates symlinks |
| `sync.sh` | script | 313 | Claude Code config sync tool: install/uninstall/promote/status for symlinked configs |

### ghostty/

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `ghostty/config` | config | 58 | Ghostty terminal emulator settings: font, theme, opacity, keybindings, shell integration |
| `ghostty/cmux-workspaces.sh` | script | 398 | cmux workspace launcher: creates multi-pane workspaces (nvim + claude + lazygit) over SSH or locally |
| `ghostty/cmux-debug.sh` | script | 53 | Debug script for cmux workspace creation (step-by-step with output) |
| `ghostty/mux-remote.sh` | script | 104 | Remote-invokable wrapper for cmux-workspaces: AppleScript GUI picker, called via Shortcuts/NFC/SSH |

### homebrew/

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `homebrew/Brewfile` | config | 87 | Homebrew package manifest: CLI tools, casks (apps), fonts |

### karabiner/

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `karabiner/mac_osx_on_rdp.json` | config | 1115 | Karabiner-Elements complex modifications: Mac shortcuts translated for RDP sessions |
| `karabiner/README.md` | documentation | 105 | Documents key mappings, installation, and supported apps for RDP config |

### launchd/

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `launchd/com.leonardoacosta.cmux-bridge.plist` | config | 30 | LaunchAgent: runs cmux-bridge HTTP proxy on boot, keeps alive, logs to ~/.claude/logs |
| `launchd/com.leonardoacosta.mic-priority.plist` | config | 33 | LaunchAgent: runs mic-priority script at login and every 30 seconds |

### openspec/

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `openspec/changes/archive/2026-02-10-fix-zsh-startup-perf/proposal.md` | documentation | 70 | Completed proposal: fix double-sourcing in zsh config for 55% startup improvement |
| `openspec/changes/archive/2026-02-10-fix-zsh-startup-perf/tasks.md` | documentation | 26 | Completed task tracking: shell batch, docs batch, validation batch (all checked off) |

### raycast-scripts/ (top-level -- SSH to homelab)

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `raycast-scripts/ba.sh` | script | 17 | Open B3 Admin on homelab via Cursor SSH Remote |
| `raycast-scripts/bo.sh` | script | 17 | Open B3 OWA on homelab via Cursor SSH Remote |
| `raycast-scripts/cc.sh` | script | 15 | Open Central Claude (~/.claude) on homelab via Cursor SSH Remote |
| `raycast-scripts/cl.sh` | script | 18 | Open Central Leonard on homelab via Cursor SSH Remote |
| `raycast-scripts/co.sh` | script | 16 | Open Central Orchestrator on homelab via Cursor SSH Remote |
| `raycast-scripts/ct.sh` | script | 18 | Open Civalent on homelab via Cursor SSH Remote |
| `raycast-scripts/cw.sh` | script | 16 | Open Central Wholesale on homelab via Cursor SSH Remote |
| `raycast-scripts/cx.sh` | script | 16 | Open Cortex on homelab via Cursor SSH Remote |
| `raycast-scripts/dc.sh` | script | 18 | Open DOC on homelab via Cursor SSH Remote |
| `raycast-scripts/fb.sh` | script | 17 | Open Fireball on homelab via Cursor SSH Remote |
| `raycast-scripts/hl.sh` | script | 17 | Open Home Lab on homelab via Cursor SSH Remote |
| `raycast-scripts/if.sh` | script | 16 | Open Installfest on homelab via Cursor SSH Remote |
| `raycast-scripts/img.sh` | script | 41 | Paste clipboard image to homelab for Claude Code (uses pngpaste + scp) |
| `raycast-scripts/la.sh` | script | 16 | Open Leonardo Acosta on homelab via Cursor SSH Remote |
| `raycast-scripts/lu.sh` | script | 16 | Open Look Up on homelab via Cursor SSH Remote |
| `raycast-scripts/lv.sh` | script | 16 | Open Las Vegas on homelab via Cursor SSH Remote |
| `raycast-scripts/mv.sh` | script | 15 | Open Modern Visa on homelab via Cursor SSH Remote |
| `raycast-scripts/nv.sh` | script | 16 | Open Nova on homelab via Cursor SSH Remote |
| `raycast-scripts/nx.sh` | script | 15 | Open Nexus on homelab via Cursor SSH Remote |
| `raycast-scripts/oo.sh` | script | 15 | Open Otaku Odyssey on homelab via Cursor SSH Remote |
| `raycast-scripts/open-project.sh` | script | 21 | Dropdown picker to open any project on homelab via Cursor SSH Remote |
| `raycast-scripts/root.sh` | script | 15 | Open homelab home directory via VS Code SSH Remote |
| `raycast-scripts/sc.sh` | script | 17 | Open Sales CRM on homelab via Cursor SSH Remote |
| `raycast-scripts/se.sh` | script | 17 | Open Submission Engine on homelab via Cursor SSH Remote |
| `raycast-scripts/ss.sh` | script | 15 | Open Styles by Silas on homelab via Cursor SSH Remote |
| `raycast-scripts/tc.sh` | script | 15 | Open Tribal Cities on homelab via Cursor SSH Remote |
| `raycast-scripts/tl.sh` | script | 15 | Open Tavern Ledger on homelab via Cursor SSH Remote |
| `raycast-scripts/ws.sh` | script | 16 | Open Wholesale on homelab via Cursor SSH Remote |

### raycast-scripts/local/ (open locally)

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `raycast-scripts/local/ba.sh` | script | 17 | Open B3 Admin locally in Cursor |
| `raycast-scripts/local/bo.sh` | script | 17 | Open B3 OWA locally in Cursor |
| `raycast-scripts/local/cc.sh` | script | 15 | Open Central Claude locally in Cursor |
| `raycast-scripts/local/cl.sh` | script | 17 | Open Central Leonard locally in Cursor |
| `raycast-scripts/local/co.sh` | script | 16 | Open Central Orchestrator locally in Cursor |
| `raycast-scripts/local/ct.sh` | script | 17 | Open Civalent locally in Cursor |
| `raycast-scripts/local/cw.sh` | script | 16 | Open Central Wholesale locally in Cursor |
| `raycast-scripts/local/cx.sh` | script | 16 | Open Cortex locally in Cursor |
| `raycast-scripts/local/fb.sh` | script | 17 | Open Fireball locally in Cursor |
| `raycast-scripts/local/hl.sh` | script | 16 | Open Home Lab locally in Cursor |
| `raycast-scripts/local/if.sh` | script | 16 | Open Installfest locally in Cursor |
| `raycast-scripts/local/la.sh` | script | 16 | Open Leonardo Acosta locally in Cursor |
| `raycast-scripts/local/lv.sh` | script | 16 | Open Las Vegas locally in Cursor |
| `raycast-scripts/local/mv.sh` | script | 15 | Open Modern Visa locally in Cursor |
| `raycast-scripts/local/nv.sh` | script | 16 | Open Nova locally in Cursor |
| `raycast-scripts/local/nx.sh` | script | 15 | Open Nexus locally in Cursor |
| `raycast-scripts/local/oo.sh` | script | 15 | Open Otaku Odyssey locally in Cursor |
| `raycast-scripts/local/open-project.sh` | script | 21 | Dropdown picker to open any project locally in Cursor |
| `raycast-scripts/local/root.sh` | script | 15 | Open local root via VS Code |
| `raycast-scripts/local/sc.sh` | script | 17 | Open Sales CRM locally in Cursor |
| `raycast-scripts/local/se.sh` | script | 17 | Open Submission Engine locally in Cursor |
| `raycast-scripts/local/ss.sh` | script | 15 | Open Styles by Silas locally in Cursor |
| `raycast-scripts/local/tc.sh` | script | 15 | Open Tribal Cities locally in Cursor |
| `raycast-scripts/local/tl.sh` | script | 15 | Open Tavern Ledger locally in Cursor |
| `raycast-scripts/local/ws.sh` | script | 16 | Open Wholesale locally in Cursor |

### raycast-scripts/cloudpc/ (SSH to CloudPC)

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `raycast-scripts/cloudpc/ba.sh` | script | 16 | Open B3 Admin on CloudPC via Cursor SSH Remote |
| `raycast-scripts/cloudpc/bo.sh` | script | 16 | Open B3 OWA on CloudPC via Cursor SSH Remote |
| `raycast-scripts/cloudpc/cc.sh` | script | 16 | Open Central Claude on CloudPC via Cursor SSH Remote |
| `raycast-scripts/cloudpc/cw.sh` | script | 16 | Open Central Wholesale on CloudPC via Cursor SSH Remote |
| `raycast-scripts/cloudpc/dc.sh` | script | 16 | Open DOC on CloudPC via Cursor SSH Remote |
| `raycast-scripts/cloudpc/fb.sh` | script | 16 | Open Fireball on CloudPC via Cursor SSH Remote |
| `raycast-scripts/cloudpc/root.sh` | script | 16 | Open CloudPC home directory via Cursor SSH Remote |
| `raycast-scripts/cloudpc/sc.sh` | script | 16 | Open Sales CRM on CloudPC via Cursor SSH Remote |
| `raycast-scripts/cloudpc/se.sh` | script | 16 | Open Submission Engine on CloudPC via Cursor SSH Remote |
| `raycast-scripts/cloudpc/ws.sh` | script | 16 | Open Wholesale on CloudPC via Cursor SSH Remote |

### scripts/

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `scripts/.DS_Store` | data | 0 | macOS Finder metadata (binary) |
| `scripts/ani-cli.sh` | script | 48 | Installs ani-cli (anime streaming CLI) from GitHub source |
| `scripts/brew-install.sh` | script | 62 | Runs `brew bundle` from Brewfile, installs Azure DevOps extension |
| `scripts/dbpro.sh` | script | 83 | Downloads and installs DB Pro database client DMG (arm64/x64) |
| `scripts/install-arch.sh` | script | 149 | Arch Linux package installation: pacman packages, AUR packages, Azure CLI, default shell |
| `scripts/mic-priority.sh` | script | 65 | Sets microphone input priority (Studio Display > MacBook > AirPods) via SwitchAudioSource |
| `scripts/osx-defaults.sh` | script | 75 | Applies macOS system defaults: keyboard repeat, Finder, Dock, screenshots, Spaces |
| `scripts/prerequisites.sh` | script | 31 | Installs Xcode CLI tools and Homebrew |
| `scripts/symlinks.conf` | config | 34 | Symlink mapping declarations (source:target format) |
| `scripts/symlinks.sh` | script | 157 | Creates/deletes/previews dotfile symlinks based on symlinks.conf |
| `scripts/terminal.sh` | script | 20 | Creates .hushlogin to suppress terminal login message |
| `scripts/utils.sh` | script | 22 | Color-coded output functions: info, success, error, warning |
| `scripts/youtube-transcript.sh` | script | 97 | Builds and installs youtube_transcript C CLI tool from GitHub source |

### ssh-mesh/

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `ssh-mesh/README.md` | documentation | 227 | SSH mesh documentation: topology, connection matrix, setup, troubleshooting |
| `ssh-mesh/configs/mac.config` | config | 32 | SSH config for Mac: smart LAN/Tailscale routing to homelab, Tailscale to CloudPC |
| `ssh-mesh/configs/homelab.config` | config | 12 | SSH config for Homelab: Tailscale to CloudPC and Mac |
| `ssh-mesh/configs/cloudpc.config` | config | 12 | SSH config for CloudPC: Tailscale to homelab and Mac |
| `ssh-mesh/keys/id_ed25519` | data | 7 | Shared ED25519 private key (gitignored pattern, but file exists) |
| `ssh-mesh/keys/id_ed25519.pub` | data | 0 | Shared ED25519 public key (empty file) |
| `ssh-mesh/scripts/setup-mac.sh` | script | 47 | Installs SSH keys and config on Mac, adds to SSH agent |
| `ssh-mesh/scripts/setup-homelab.sh` | script | 50 | Installs SSH keys, config, and authorized_keys on Homelab |
| `ssh-mesh/scripts/setup-cloudpc.ps1` | script | 123 | PowerShell: installs SSH keys for both users, sets admin authorized_keys permissions |
| `ssh-mesh/scripts/deploy-to-homelab.sh` | script | 31 | Copies SSH mesh files from Mac to Homelab via scp |
| `ssh-mesh/scripts/fetch-all-cloudpc.sh` | script | 33 | Fetches all git branches for repos on CloudPC (bash, via WSL) |
| `ssh-mesh/scripts/fetch-all-cloudpc.ps1` | script | 35 | Fetches all git branches for repos on CloudPC (PowerShell native) |
| `ssh-mesh/scripts/remote/cmux-bridge/.gitignore` | config | 1 | Ignores Rust target/ directory |
| `ssh-mesh/scripts/remote/cmux-bridge/Cargo.toml` | config | 14 | Rust crate manifest for cmux-bridge HTTP proxy |
| `ssh-mesh/scripts/remote/cmux-bridge/Cargo.lock` | data | 144 | Rust dependency lock file |
| `ssh-mesh/scripts/remote/cmux-bridge/src/main.rs` | script | 308 | Rust HTTP server: proxies hook/attention/notify requests to local cmux CLI, IP-restricted to localhost + Tailscale CGNAT |

### starship/

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `starship/starship.toml` | config | 141 | Starship prompt config: format string, module styles, Nord + OneDark palettes |

### tmux/

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `tmux/tmux.conf` | config | 182 | Tmux configuration: browser-like keybindings via WezTerm escape sequences, vi copy mode, mouse |
| `tmux/one-hunter-vercel-theme.conf` | config | 79 | Tmux theme: One Hunter Vercel colors, tab-like status bar, pane borders |

### wezterm/

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `wezterm/wezterm.lua` | config | 150 | WezTerm macOS config: SSH domains, appearance, tmux keybinding integration, text editing shortcuts |

### windows/

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `windows/setup.ps1` | script | 679 | Windows dev environment setup: OpenSSH, WSL2 Arch, winget apps, WezTerm, AHK, Git, fonts |
| `windows/install.cmd` | script | 41 | Bootstrap batch file: elevates to admin, launches setup.ps1 |
| `windows/mac-keyboard.ahk` | script | 181 | AutoHotKey v2: remaps Mac keyboard (via Synergy) to Windows equivalents |
| `windows/wezterm-windows.lua` | config | 124 | WezTerm Windows config: WSL2 Arch default shell, Ctrl-based tmux keybindings (adapted for AHK) |

### zsh/

| Path | Type | Lines | Purpose |
|------|------|------:|---------|
| `zsh/.zshenv` | config | 27 | Environment variables for ALL shells: DOTFILES, PATH, theme exports, Doppler config |
| `zsh/.zshrc` | config | 36 | Interactive shell entry point: loads shared config, platform detection, function files |
| `zsh/rc/shared.zsh` | config | 75 | Cross-platform shell options (history, completion, globbing) and common aliases |
| `zsh/rc/darwin.zsh` | config | 59 | macOS-specific: Homebrew init, pnpm/dotnet/maestro PATH, NVM, macOS aliases |
| `zsh/rc/linux.zsh` | config | 76 | Linux-specific: pnpm/cargo/go PATH, GNU color aliases, Docker/systemctl/pacman shortcuts |
| `zsh/functions/setup-completions.zsh` | config | 34 | Completion system init: fpath, daily compinit cache, zstyle configuration |
| `zsh/functions/load-plugins.zsh` | config | 75 | Defensive plugin loading: syntax highlighting, autosuggestions, history substring search |
| `zsh/functions/load-tools.zsh` | config | 75 | CLI tool initialization: zoxide, atuin, fzf, direnv, mise, thefuck, bat, eza, ripgrep |
| `zsh/functions/init-starship.zsh` | config | 15 | Starship prompt initialization (loaded last) |
| `zsh/completions/_git` | config | 293 | Zsh completion wrapper for git (third-party, Felipe Contreras) |
| `zsh/completions/git-completion.bash` | config | 3777 | Git bash completion script (third-party, used by _git wrapper) |

---

## 2. Tool Inventory

### Shell & Terminal

| Tool | Category | Referenced In | Platform | Installed Via |
|------|----------|---------------|----------|---------------|
| zsh | shell | zsh/, install-arch.sh, setup.ps1 | All | pacman (Linux), pre-installed (macOS), WSL (Windows) |
| Ghostty | terminal | ghostty/config, Brewfile, symlinks.conf | macOS | Homebrew cask |
| WezTerm | terminal | wezterm/, windows/wezterm-windows.lua, setup.ps1 | macOS, Windows | Homebrew cask (mac), winget (win) |
| tmux | terminal | tmux/, Brewfile, install-arch.sh | macOS, Linux | Homebrew (mac), pacman (linux) |
| starship | shell | starship/, Brewfile, install-arch.sh, init-starship.zsh, setup.ps1 | All | Homebrew (mac), pacman (linux) |
| cmux | terminal | ghostty/cmux-*.sh, launchd/cmux-bridge.plist, cmux-bridge/src/main.rs | macOS, Linux | External (not in Brewfile) |

### CLI Utilities

| Tool | Category | Referenced In | Platform | Installed Via |
|------|----------|---------------|----------|---------------|
| fzf | CLI utility | load-tools.zsh, install-arch.sh | All | Homebrew (mac), pacman (linux) |
| zoxide | CLI utility | load-tools.zsh, install-arch.sh | All | Homebrew (mac), pacman (linux) |
| atuin | CLI utility | load-tools.zsh, install-arch.sh | All | Homebrew (mac), pacman (linux) |
| bat | CLI utility | load-tools.zsh, install-arch.sh | All | Homebrew (mac), pacman (linux) |
| eza | CLI utility | load-tools.zsh, install-arch.sh | All | Homebrew (mac), pacman (linux) |
| ripgrep (rg) | CLI utility | load-tools.zsh, install-arch.sh | All | Homebrew (mac), pacman (linux) |
| fd | CLI utility | load-tools.zsh, install-arch.sh | All | Homebrew (mac), pacman (linux) |
| direnv | CLI utility | load-tools.zsh | All | Homebrew (mac), pacman (linux) |
| mise | CLI utility | load-tools.zsh, install-arch.sh (AUR) | All | Homebrew (mac), AUR (linux) |
| thefuck | CLI utility | load-tools.zsh | All | Homebrew (mac) |
| lazygit | CLI utility | cmux-workspaces.sh, install-arch.sh | All | Homebrew (mac), pacman (linux) |
| neovim (nvim) | editor | cmux-workspaces.sh, install-arch.sh | All | Homebrew (mac), pacman (linux) |
| jq | CLI utility | Referenced in README.md | macOS | Homebrew |
| hyfetch | CLI utility | Brewfile | macOS | Homebrew |
| curl | CLI utility | Brewfile, youtube-transcript.sh | All | Homebrew (mac), pacman (linux) |
| tree | CLI utility | load-tools.zsh (FZF_ALT_C_OPTS) | All | Implicit |
| pngpaste | CLI utility | raycast-scripts/img.sh | macOS | Homebrew (implicit) |
| SwitchAudioSource | CLI utility | Brewfile, mic-priority.sh | macOS | Homebrew (switchaudio-osx) |
| youtube_transcript | CLI utility | scripts/youtube-transcript.sh | All | Built from source (C) |
| ani-cli | CLI utility | scripts/ani-cli.sh | All | Built from source |

### Language Runtimes & Build Tools

| Tool | Category | Referenced In | Platform | Installed Via |
|------|----------|---------------|----------|---------------|
| Node.js | language runtime | Brewfile, install-arch.sh | All | Homebrew (mac), pacman (linux), nvm (win) |
| nvm | language runtime | Brewfile, darwin.zsh, setup.ps1 | macOS, Windows | Homebrew (mac), winget/NVMforWindows (win) |
| pnpm | language runtime | Brewfile, darwin.zsh, linux.zsh, install-arch.sh | All | Homebrew (mac), pacman (linux), winget (win) |
| .NET (dotnet) | language runtime | Brewfile, darwin.zsh, setup.ps1 | macOS, Windows | Homebrew (mac), winget (win) |
| Go | language runtime | linux.zsh, install-arch.sh | Linux | pacman |
| Rust (cargo) | language runtime | linux.zsh, install-arch.sh, cmux-bridge | Linux | pacman, cargo |
| Python (pipx) | language runtime | install-arch.sh | Linux | pacman |
| gcc/clang | build tool | youtube-transcript.sh | All | Xcode CLI (mac), base-devel (linux) |
| make | build tool | youtube-transcript.sh, ani-cli.sh | All | Xcode CLI (mac), base-devel (linux) |
| base-devel | build tool | install-arch.sh | Linux | pacman |

### Git & Version Control

| Tool | Category | Referenced In | Platform | Installed Via |
|------|----------|---------------|----------|---------------|
| git | CLI utility | install-arch.sh, setup.ps1 | All | Xcode CLI (mac), pacman (linux), winget (win) |
| GitHub CLI (gh) | CLI utility | install-arch.sh, setup.ps1 | All | pacman (linux), winget (win) |
| Git Credential Manager | CLI utility | Brewfile, install-arch.sh (AUR), setup.ps1 | All | Homebrew cask (mac), AUR (linux), winget (win) |
| GitKraken | app | setup.ps1 | Windows | winget |

### Applications

| Tool | Category | Referenced In | Platform | Installed Via |
|------|----------|---------------|----------|---------------|
| Cursor | editor | Brewfile, raycast-scripts/, install.sh, setup.ps1 | macOS, Windows | Homebrew cask (mac), winget (win) |
| VS Code | editor | .vscode/settings.json, setup.ps1 | macOS, Windows | Homebrew cask (mac, commented), winget (win) |
| Visual Studio 2022 | editor | setup.ps1 | Windows | winget |
| Claude Desktop | app | setup.ps1 | Windows | winget |
| Claude Code | app | cmux-workspaces.sh, setup.ps1 | All | winget (win), npm/brew (mac) |
| Bruno | app | Brewfile, setup.ps1 | macOS, Windows | Homebrew cask (mac), winget (win) |
| Discord | app | Brewfile | macOS | Homebrew cask |
| Fantastical | app | Brewfile | macOS | Homebrew cask |
| Google Chrome | app | Brewfile, setup.ps1 | macOS, Windows | Homebrew cask (mac), winget (win) |
| IINA | app | Brewfile | macOS | Homebrew cask |
| Notion | app | Brewfile, setup.ps1 | macOS, Windows | Homebrew cask (mac), winget (win) |
| Obsidian | app | Brewfile, setup.ps1 | macOS, Windows | Homebrew cask (mac), winget (win) |
| Raycast | app | Brewfile, setup.ps1, raycast-scripts/ | macOS, Windows | Homebrew cask (mac), winget (win) |
| Spotify | app | Brewfile | macOS | Homebrew cask |
| Steam | app | Brewfile | macOS | Homebrew cask |
| Superhuman | app | Brewfile | macOS | Homebrew cask |
| Wispr Flow | app | Brewfile, setup.ps1 | macOS, Windows | Homebrew cask (mac), MS Store (win) |
| DB Pro | app | scripts/dbpro.sh | macOS | Direct DMG download |
| PowerToys | app | setup.ps1 | Windows | winget |
| gsudo | app | setup.ps1 | Windows | winget |
| AutoHotkey | app | setup.ps1, mac-keyboard.ahk | Windows | winget |
| Synergy | app | setup.ps1, mac-keyboard.ahk | Windows | winget |

### Services & Networking

| Tool | Category | Referenced In | Platform | Installed Via |
|------|----------|---------------|----------|---------------|
| Tailscale | service | ssh-mesh/, cmux-workspaces.sh, cmux-bridge, setup.ps1 | All | Native app (mac/win), Docker (linux) |
| Docker | service | install-arch.sh, .gitignore | Linux, Windows (WSL) | pacman (linux), WSL manual (win) |
| docker-compose | service | install-arch.sh | Linux | pacman |
| OpenSSH Server | service | setup.ps1, ssh-mesh/ | Windows | Windows Capability |
| Azure CLI | CLI utility | Brewfile, brew-install.sh, install-arch.sh, setup.ps1 | All | Homebrew (mac), pipx (linux), winget (win) |
| Stripe CLI | CLI utility | Brewfile | macOS | Homebrew tap |
| PostgreSQL | CLI utility | Brewfile | macOS | Homebrew |
| Karabiner-Elements | app | Brewfile, karabiner/ | macOS | Homebrew cask |

### Fonts

| Tool | Category | Referenced In | Platform | Installed Via |
|------|----------|---------------|----------|---------------|
| GeistMono Nerd Font | font | Brewfile, ghostty/config, wezterm.lua | macOS, Windows | Homebrew cask (mac), scoop (win) |
| JetBrains Mono Nerd Font | font | Brewfile, install-arch.sh, setup.ps1 | All | Homebrew cask (mac), pacman (linux), scoop (win) |
| Cascadia Mono Nerd Font | font | Brewfile, install-arch.sh | macOS, Linux | Homebrew cask (mac), pacman (linux), scoop (win) |

### Zsh Plugins

| Tool | Category | Referenced In | Platform | Installed Via |
|------|----------|---------------|----------|---------------|
| zsh-syntax-highlighting | shell | Brewfile, install-arch.sh, load-plugins.zsh | All | Homebrew (mac), pacman (linux) |
| zsh-autosuggestions | shell | Brewfile, install-arch.sh, load-plugins.zsh | All | Homebrew (mac), pacman (linux) |
| zsh-history-substring-search | shell | load-plugins.zsh | All | Homebrew (mac), pacman (linux) |

### Package Managers (meta)

| Tool | Category | Referenced In | Platform | Installed Via |
|------|----------|---------------|----------|---------------|
| Homebrew | CLI utility | Brewfile, prerequisites.sh, brew-install.sh, darwin.zsh | macOS | curl install script |
| pacman | CLI utility | install-arch.sh, linux.zsh | Linux | Pre-installed (Arch) |
| yay | CLI utility | install-arch.sh, linux.zsh | Linux | AUR (manual build) |
| paru | CLI utility | install-arch.sh | Linux | AUR |
| winget | CLI utility | setup.ps1 | Windows | Pre-installed (Windows 11) |
| scoop | CLI utility | setup.ps1 | Windows | PowerShell install script |
| bun | language runtime | install-arch.sh (AUR: bun-bin) | Linux | AUR |

---

## 3. Environment Variables

| Variable | Value/Description | Set In | Consumed In | Cross-file? |
|----------|-------------------|--------|-------------|-------------|
| `DOTFILES` | `$HOME/dev/if` | zsh/.zshenv, zsh/.zshrc | All zsh files, scripts/*.sh | Yes |
| `USE_DOPPLER` | `true` | zsh/.zshenv | External tools | No |
| `DOPPLER_PROJECT` | `homelab` | zsh/.zshenv | External tools | No |
| `DOPPLER_CONFIG` | `prd` | zsh/.zshenv | External tools | No |
| `PATH` | Prepends `~/.claude/bin`, `~/.local/bin` | zsh/.zshenv | All processes | Yes |
| `TMUX_THEME` | `one-hunter-vercel` | zsh/.zshenv | tmux (implicit) | No |
| `NVIM_THEME` | `nord` | zsh/.zshenv | neovim (implicit) | No |
| `STARSHIP_THEME` | `nord` | zsh/.zshenv | starship (implicit) | No |
| `WEZTERM_THEME` | `nord` | zsh/.zshenv | wezterm (implicit) | No |
| `STARSHIP_CONFIG` | `~/.config/starship/starship.toml` | init-starship.zsh | starship | No |
| `PNPM_HOME` | `$HOME/Library/pnpm` (mac) / `$HOME/.local/share/pnpm` (linux) | darwin.zsh, linux.zsh | PATH additions | No |
| `NVM_DIR` | `$HOME/.nvm` | darwin.zsh | nvm | No |
| `HOMEBREW_PREFIX` | Set by `brew shellenv` | darwin.zsh | load-plugins.zsh, load-tools.zsh | Yes |
| `HOMEBREW_CASK_OPTS` | `--appdir=/Applications` | prerequisites.sh | brew | No |
| `FZF_DEFAULT_OPTS` | `--height 40% --layout=reverse --border --info=inline` | load-tools.zsh | fzf | No |
| `FZF_CTRL_T_OPTS` | Preview with bat | load-tools.zsh | fzf | No |
| `FZF_ALT_C_OPTS` | Preview with tree | load-tools.zsh | fzf | No |
| `FZF_DEFAULT_COMMAND` | `fd --type f --hidden --follow --exclude .git` | load-tools.zsh | fzf | No |
| `FZF_CTRL_T_COMMAND` | Same as FZF_DEFAULT_COMMAND | load-tools.zsh | fzf | No |
| `FZF_ALT_C_COMMAND` | `fd --type d --hidden --follow --exclude .git` | load-tools.zsh | fzf | No |
| `RIPGREP_CONFIG_PATH` | `$HOME/.config/ripgrep/config` | load-tools.zsh | ripgrep | No |
| `ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE` | `fg=#666666` | load-plugins.zsh | zsh-autosuggestions | No |
| `ZSH_AUTOSUGGEST_STRATEGY` | `(history completion)` | load-plugins.zsh | zsh-autosuggestions | No |
| `HISTFILE` | `$HOME/.zsh_history` | shared.zsh | zsh | No |
| `HISTSIZE` | `50000` | shared.zsh | zsh | No |
| `SAVEHIST` | `50000` | shared.zsh | zsh | No |
| `CMUX_CLI` | cmux binary path (default: `cmux`) | cmux-workspaces.sh, cmux-debug.sh | cmux scripts | No |
| `SSH_HOST` | `homelab` | cmux-workspaces.sh | SSH connections | No |
| `REMOTE_DEV` | `~/dev` | cmux-workspaces.sh | SSH workspace paths | No |
| `LOCAL_DEV` | `$HOME/dev` | cmux-workspaces.sh | Local workspace paths | No |
| `MAC_TAILSCALE_IP` | `$CMUX_BRIDGE_HOST` or `tailscale ip -4` | cmux-workspaces.sh | Remote session env injection | No |
| `CMUX_WORKSPACE_ID` | Workspace UUID | cmux-workspaces.sh (injected) | Remote CC hooks | Yes (SSH) |
| `CMUX_SURFACE_ID` | Surface UUID | cmux-workspaces.sh (injected) | Remote CC hooks | Yes (SSH) |
| `CMUX_BRIDGE_HOST` | Mac's Tailscale IP | cmux-workspaces.sh (injected) | cmux-bridge on homelab | Yes (SSH) |
| `INSTALLFEST_PATH` | Script directory or override | sync.sh | sync.sh | No |
| `DBPRO_VERSION` | `1.6.1` | dbpro.sh | dbpro.sh | No |

---

## 4. Cross-Domain Dependency Map

Domains: zsh, ghostty, wezterm, tmux, starship, karabiner, homebrew, bootstrap, launchd, cmux, raycast, ssh-mesh, windows, sync, secrets-env, openspec, docs-meta

| From | To | Interface |
|------|----|-----------|
| zsh | starship | `init-starship.zsh` calls `starship init zsh`; `STARSHIP_CONFIG` env var points to `starship/starship.toml` |
| zsh | homebrew | `darwin.zsh` calls `brew shellenv`; sets `HOMEBREW_PREFIX` used by `load-plugins.zsh` and `load-tools.zsh` |
| zsh | secrets-env | `.zshenv` sets `USE_DOPPLER`, `DOPPLER_PROJECT`, `DOPPLER_CONFIG`; `.zshrc` sources `~/.env` |
| zsh | ghostty | `shared.zsh` defines `alias mux="~/dev/if/ghostty/cmux-workspaces.sh"` |
| ghostty | tmux | Ghostty config sends custom escape sequences that tmux binds via `user-keys` (same sequences as WezTerm) |
| ghostty | ssh-mesh | `cmux-workspaces.sh` uses SSH host `homelab` defined in `ssh-mesh/configs/mac.config` |
| ghostty | cmux | `cmux-workspaces.sh` and `cmux-debug.sh` call `cmux` CLI; `mux-remote.sh` calls `cmux ping` |
| wezterm | tmux | `wezterm.lua` sends custom escape sequences that `tmux.conf` binds via `user-keys` in `User0`-`User19` |
| wezterm | ssh-mesh | `wezterm.lua` defines SSH domain for `homelab` remote address |
| tmux | starship | Tmux sources theme file from `~/.config/tmux/one-hunter-vercel-theme.conf` (symlinked from repo) |
| bootstrap | homebrew | `install.sh` sources `prerequisites.sh` (Homebrew install) then `brew-install.sh` (Brewfile) |
| bootstrap | zsh | `install.sh` calls `scripts/symlinks.sh` which creates `~/.zshrc` and `~/.zshenv` symlinks |
| bootstrap | starship | `scripts/symlinks.conf` maps `starship/starship.toml` to `~/.config/starship/starship.toml` |
| bootstrap | ghostty | `scripts/symlinks.conf` maps `ghostty/config` to `~/.config/ghostty/config` |
| bootstrap | tmux | `scripts/symlinks.conf` maps `tmux/tmux.conf` and theme to `~/.config/tmux/` |
| bootstrap | launchd | `install.sh` symlinks mic-priority plist to `~/Library/LaunchAgents/`; `symlinks.conf` symlinks cmux-bridge plist |
| bootstrap | wezterm | `install.sh` symlinks `wezterm.lua` to `~/.config/wezterm/` (macOS-specific, handled in script) |
| launchd | cmux | `com.leonardoacosta.cmux-bridge.plist` runs `~/.claude/scripts/bin/cmux-bridge` (the compiled Rust binary) |
| launchd | scripts | `com.leonardoacosta.mic-priority.plist` runs `~/dev/if/scripts/mic-priority.sh` |
| cmux | ssh-mesh | cmux-bridge (Rust) accepts connections from Tailscale CGNAT IPs; `cmux-workspaces.sh` SSHes through mesh |
| raycast | ssh-mesh | All top-level raycast scripts open `vscode-remote://ssh-remote+homelab/...` paths |
| raycast | ssh-mesh | `cloudpc/` scripts open `vscode-remote://ssh-remote+cloudpc/...` paths |
| windows | ssh-mesh | `setup.ps1` configures OpenSSH Server with Ed25519 auth, Tailscale firewall rule |
| windows | wezterm | `setup.ps1` copies `wezterm-windows.lua` to `%USERPROFILE%\.config\wezterm\` |
| windows | karabiner | `mac-keyboard.ahk` serves the same purpose as Karabiner on macOS (remaps Mac keys for Windows) |
| windows | bootstrap | `install.cmd` bootstraps `setup.ps1`; `setup.ps1` installs WSL2 Arch + calls dotfiles `install.sh` inside WSL |
| sync | bootstrap | `sync.sh` creates symlinks for Claude Code config (agents, commands, skills) in satellite projects |
| openspec | docs-meta | `AGENTS.md` and `CLAUDE.md` contain OpenSpec instruction blocks; archived proposals in `openspec/changes/` |
| docs-meta | bootstrap | `CLAUDE.md` documents repo structure and commands; `README.md` documents installation |

---

## 5. Patterns Detected

### Naming Conventions

- **Project codes**: 2-letter lowercase codes (oo, tc, tl, mv, ss, cl, cw, co, cx, hl, if, la, fb, sc, ws, se, dc, ct, ba, bo, cc, lv, lu, nx, nv, ew, ic)
- **Raycast scripts**: Named by project code with `.sh` extension; three tiers: top-level (homelab SSH), `local/` (local), `cloudpc/` (CloudPC SSH)
- **Raycast local suffix**: Local variants use title suffix `l` (e.g., `ool` for local oo, `cll` for local cl)
- **Zsh files**: Functions in `functions/` use verb-noun naming (`setup-completions`, `load-plugins`, `load-tools`, `init-starship`)
- **Platform configs**: `darwin.zsh` / `linux.zsh` naming convention for platform-specific files
- **SSH configs**: Named by machine (`mac.config`, `homelab.config`, `cloudpc.config`)
- **LaunchAgent plists**: Reverse DNS naming (`com.leonardoacosta.<service>`)
- **Theme files**: Named after the theme (`one-hunter-vercel-theme.conf`)

### Script Structure Patterns

- **Shebang**: All bash scripts use `#!/bin/bash` or `#!/usr/bin/env bash`; Zsh scripts use `#!/usr/bin/env zsh` or `#!/bin/zsh`
- **Set flags**: Most scripts use `set -euo pipefail` (strict mode); some use just `set -e`
- **Utils sourcing**: Scripts in `scripts/` source `$SCRIPT_DIR/utils.sh` or `$DOTFILES/scripts/utils.sh` for colored output
- **SCRIPT_DIR pattern**: `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` used in most scripts
- **Direct-run guard**: Many scripts check `if [ "$(basename "$0")" = "$(basename "${BASH_SOURCE[0]}")" ]` to support both sourcing and direct execution
- **Raycast metadata**: All raycast scripts use `@raycast.schemaVersion 1`, `@raycast.mode silent`, and include `@raycast.description`

### Platform Detection Patterns

- **Primary**: `case "$(uname -s)" in Darwin) ... ;; Linux) ... ;; esac` in `.zshrc` and `install.sh`
- **Arch-specific**: `if [[ -f /etc/arch-release ]]` in `install.sh`
- **Architecture**: `uname -m` for arm64/x86_64 detection in `dbpro.sh`

### Guard Patterns

- **command -v checks**: `if command -v <tool> &>/dev/null; then` used throughout `load-tools.zsh`, `load-plugins.zsh`, `install-arch.sh`, `mic-priority.sh`
- **File existence**: `[[ -f "$path" ]] && source "$path"` for conditional sourcing (darwin.zsh, linux.zsh)
- **Directory existence**: `[[ -d "$dir" ]] && export PATH="$dir:$PATH"` for conditional PATH additions
- **Plugin multi-path search**: `load-plugins.zsh` searches 5 paths per plugin (Homebrew, Intel Homebrew, Arch, Debian, Nix) and loads first found
- **Daily compinit cache**: `if [[ -n ${ZDOTDIR:-$HOME}/.zcompdump(#qN.mh+24) ]]` regenerates cache once per day

### Duplication Patterns

- **Raycast triplication**: Each project has up to 3 nearly identical scripts (top-level/homelab, local/, cloudpc/) differing only in the `cursor` command target. The `open-project.sh` dropdown exists as a consolidated alternative but the individual scripts remain.
- **Escape sequence duplication**: The same custom tmux escape sequences are defined in `ghostty/config`, `wezterm/wezterm.lua`, `windows/wezterm-windows.lua`, and bound in `tmux/tmux.conf`
- **SSH key in two places**: Private key content exists in `ssh-mesh/keys/id_ed25519` (file) and `ssh-mesh/scripts/setup-cloudpc.ps1` (embedded string)
- **Font declarations**: Nerd fonts declared in Brewfile, install-arch.sh, and setup.ps1 (3 places, platform-appropriate)
- **PNPM_HOME**: Defined separately in darwin.zsh and linux.zsh with different paths (platform-appropriate)
- **fetch-all-cloudpc**: Two versions exist -- `.sh` (bash, for WSL) and `.ps1` (PowerShell native) with identical logic

---

## 6. Project Registry

| Code | Full Name | Category | Referenced In |
|------|-----------|----------|---------------|
| oo | Otaku Odyssey | Client | cmux-workspaces.sh, raycast-scripts/, open-project.sh |
| tc | Tribal Cities | Client | cmux-workspaces.sh, raycast-scripts/, open-project.sh |
| tl | Tavern Ledger | Client | cmux-workspaces.sh, raycast-scripts/, open-project.sh |
| mv | Modern Visa | Client | cmux-workspaces.sh, raycast-scripts/, open-project.sh |
| ss | Styles by Silas | Client | cmux-workspaces.sh, raycast-scripts/, open-project.sh |
| ct | Civalent | Client | cmux-workspaces.sh, raycast-scripts/, open-project.sh |
| cl | Central Leonard | Personal | cmux-workspaces.sh, raycast-scripts/, open-project.sh |
| cw | Central Wholesale | Personal | cmux-workspaces.sh, raycast-scripts/, open-project.sh |
| co | Central Orchestrator | Personal | cmux-workspaces.sh, raycast-scripts/, open-project.sh |
| cx | Cortex | Personal | raycast-scripts/, open-project.sh |
| cc | Central Claude (~/.claude) | Personal | cmux-workspaces.sh, raycast-scripts/, open-project.sh |
| hl | Home Lab | Personal | cmux-workspaces.sh, raycast-scripts/, open-project.sh |
| if | Installfest (this repo) | Personal | cmux-workspaces.sh, raycast-scripts/, open-project.sh |
| la | Leonardo Acosta | Personal | raycast-scripts/, open-project.sh |
| fb | Fireball | B&B | cmux-workspaces.sh, raycast-scripts/, cloudpc/, open-project.sh |
| sc | Sales CRM | B&B | cmux-workspaces.sh, raycast-scripts/, cloudpc/, open-project.sh |
| ws | Wholesale (Architecture) | B&B | cmux-workspaces.sh, raycast-scripts/, cloudpc/, open-project.sh |
| se | Submission Engine | B&B | cmux-workspaces.sh, raycast-scripts/, cloudpc/, open-project.sh |
| dc | DOC (Document OrganizationCentral) | B&B | cmux-workspaces.sh, raycast-scripts/, cloudpc/, open-project.sh |
| ba | B3 Admin | B&B | raycast-scripts/, cloudpc/, open-project.sh |
| bo | B3 OWA | B&B | raycast-scripts/, open-project.sh |
| ew | Enterprise Wiki | B&B | cmux-workspaces.sh, mux-remote.sh |
| ic | Infrastructure as Code | B&B | cmux-workspaces.sh, mux-remote.sh |
| lv | Las Vegas | (uncategorized) | raycast-scripts/, open-project.sh |
| lu | Look Up | (uncategorized) | raycast-scripts/, open-project.sh |
| nx | Nexus | (uncategorized) | raycast-scripts/, open-project.sh |
| nv | Nova | (uncategorized) | raycast-scripts/, open-project.sh |

### Category Groups (from cmux-workspaces.sh)

- **B&B** (amber, `b` shortcut): fb, ws, sc, ew, ic, se, dc
- **Clients** (green, `c` shortcut): oo, mv, ct, tl, tc, ss
- **Personal** (blue, `p` shortcut): cw, co, cl, hl, if, cc

### Projects in open-project.sh but NOT in cmux-workspaces.sh

ba, bo, cx, la, lv, lu, nx, nv

### Projects in cmux-workspaces.sh but NOT in open-project.sh

ew, ic
