# if (Installfest)

Personal dotfiles managed by [chezmoi](https://www.chezmoi.io/) for macOS and Arch Linux. One command to bootstrap a new machine.

## Quick Start

```bash
# New machine (clones repo to ~/dev/if, deploys dotfiles to ~)
chezmoi init --apply leonardoacosta/if --source ~/dev/if

# Existing clone
chezmoi init --source ~/dev/if
chezmoi apply
```

## Machines

| Machine | OS | Hostname | User | Connectivity |
|---------|------|----------|------|-------------|
| Mac | macOS | macbook-pro | leonardoacosta | LAN + Tailscale |
| Homelab | Arch Linux | homelab | nyaptor | Tailscale |
| CloudPC | Windows 11 | 346-CPC-QJXVZ | leo | Tailscale |

All three machines share an ED25519 keypair over Tailscale. See `ssh-mesh/README.md` for topology.

## Key Tools

| Tool | Purpose | Config |
|------|---------|--------|
| Ghostty | Terminal emulator | `home/dot_config/ghostty/config.tmpl` |
| tmux | Terminal multiplexer | `home/dot_config/tmux/tmux.conf` |
| Starship | Shell prompt | `home/dot_config/starship/starship.toml.tmpl` |
| Zsh | Shell | `home/dot_zshrc`, `home/dot_zsh/` |
| mise | Runtime version manager | `.mise.toml` |
| Doppler | Secrets management | CLI with `~/.env` fallback |
| Karabiner | Key remapping (macOS) | `home/dot_config/karabiner/` |

## Directory Structure

```
if/                                     # repo root (~/dev/if)
├── .chezmoiroot                        # tells chezmoi: source lives in home/
├── home/                               # chezmoi source root (all deployed files)
│   ├── .chezmoi.toml.tmpl              #   Machine-specific config (hostname, theme, ssh user)
│   ├── .chezmoiignore                  #   Files excluded from deployment
│   ├── projects.toml                   #   Project registry (not deployed, used by templates)
│   ├── dot_zshenv.tmpl                 #   -> ~/.zshenv (env vars, templated)
│   ├── dot_zshrc                       #   -> ~/.zshrc (interactive shell entry)
│   ├── dot_zsh/                        #   -> ~/.zsh/
│   │   ├── rc/                         #     shared.zsh, darwin.zsh, linux.zsh
│   │   ├── functions/                  #     completions, plugins, tools, starship
│   │   └── completions/                #     Custom completion scripts
│   ├── dot_config/                     #   -> ~/.config/
│   │   ├── ghostty/config.tmpl         #     Ghostty terminal (templated)
│   │   ├── starship/starship.toml.tmpl #     Starship prompt (templated)
│   │   ├── tmux/tmux.conf              #     Tmux + theme
│   │   └── karabiner/                  #     Karabiner-Elements
│   ├── Library/LaunchAgents/           #   -> ~/Library/LaunchAgents/ (macOS only)
│   └── run_once_install-packages.sh.tmpl #  One-time package installer
├── platform/                           # Platform-specific tooling (repo-only)
│   ├── homebrew/Brewfile               #   Homebrew packages
│   ├── windows/                        #   Windows/CloudPC setup scripts
│   └── raycast-scripts/                #   Generated Raycast shortcuts
├── scripts/                            # Utility scripts (repo-only)
│   ├── generate-raycast.sh             #   Generate Raycast scripts from projects.toml
│   ├── cmux-workspaces.sh              #   Generate cmux workspace launchers
│   └── mux-remote.sh                   #   SSH remote tmux sessions
├── ssh-mesh/                           # Multi-machine SSH setup (repo-only)
└── docs/                               # Documentation (repo-only)
```

**Naming convention:** `dot_foo` deploys to `~/.foo`. Files ending in `.tmpl` are Go templates processed by chezmoi. The `.chezmoiroot` file redirects chezmoi to read source from `home/` — all chezmoi commands work transparently.

## How chezmoi Works Here

chezmoi reads `home/.chezmoi.toml.tmpl` (via `.chezmoiroot`) to detect which machine it is running on (by hostname), then deploys templated files with the correct values:

| Variable | Mac | Homelab |
|----------|-----|---------|
| `machine` | mac | homelab |
| `theme` | nord | nord |
| `ssh_user` | leonardoacosta | nyaptor |

Platform-specific files (Ghostty, Karabiner, Library/) are excluded on Linux via `.chezmoiignore`.

## Project Registry

`home/projects.toml` is the single source of truth for all projects. Scripts consume it to generate:

- **Raycast scripts** -- keyboard shortcuts to open projects (`scripts/generate-raycast.sh`)
- **cmux workspaces** -- tmux workspace launchers (`scripts/cmux-workspaces.sh`)
- **Remote sessions** -- SSH tmux sessions on homelab (`scripts/mux-remote.sh`)

### Adding a Project

1. Add an entry to `home/projects.toml`
2. Run `scripts/generate-raycast.sh` to regenerate Raycast scripts
3. `chezmoi apply` if any deployed files changed

## Theme Switching

1. Edit `.chezmoi.toml.tmpl` -- change the `$theme` variable
2. Run `chezmoi apply`
3. All templated configs (Ghostty, Starship) update to the new theme

## Secrets

Secrets are managed by [Doppler](https://www.doppler.com/) CLI. Local fallback:

```bash
# Doppler (preferred)
doppler run -- <command>

# Fallback for machine-local values
~/.env    # gitignored, never committed
```

Machine-local values (LAN IPs, home automation tokens) stay in `~/.env`. Everything else lives in Doppler.

## Shell Architecture

```
~/.zshenv (all shells)        ~/.zshrc (interactive only)
    ├── DOTFILES export           ├── ~/.zsh/rc/shared.zsh (options, aliases)
    ├── PATH setup                ├── ~/.zsh/rc/darwin.zsh OR linux.zsh
    └── Theme exports             ├── ~/.zsh/functions/setup-completions.zsh
                                  ├── ~/.zsh/functions/load-plugins.zsh
                                  ├── ~/.zsh/functions/load-tools.zsh
                                  └── ~/.zsh/functions/init-starship.zsh
```

**Rule:** `.zshenv` = environment variables only. All tool initialization (starship, zoxide, fzf, mise, plugins) happens in `.zshrc` via dedicated function files.
