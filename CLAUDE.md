# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Personal dotfiles and development environment configuration for macOS and Arch Linux. Cross-platform shell setup with SSH mesh networking between machines.

## Directory Structure

```
if/                                    # chezmoi source directory (~/dev/if)
├── .chezmoi.toml.tmpl                 # chezmoi config template (machine-specific data)
├── .chezmoiignore                     # Files excluded from chezmoi management
├── dot_zshenv.tmpl                    # -> ~/.zshenv (env vars, templated)
├── dot_zshrc                          # -> ~/.zshrc (interactive shell entry)
├── dot_zsh/                           # -> ~/.zsh/ (shell modules)
│   ├── rc/
│   │   ├── shared.zsh                 # Options + aliases (cross-platform)
│   │   ├── darwin.zsh                 # macOS-specific (Homebrew, pnpm)
│   │   └── linux.zsh                  # Arch-specific (pacman, docker)
│   ├── functions/
│   │   ├── setup-completions.zsh      # compinit, fpath
│   │   ├── load-plugins.zsh           # syntax-hl, autosuggestions
│   │   ├── load-tools.zsh            # zoxide, atuin, fzf, mise
│   │   └── init-starship.zsh         # prompt (load last)
│   └── completions/                   # Custom completion scripts
├── dot_config/                        # -> ~/.config/
│   ├── ghostty/config.tmpl            # Ghostty terminal (templated)
│   ├── starship/starship.toml.tmpl    # Starship prompt (templated)
│   ├── tmux/tmux.conf                 # Tmux config
│   ├── tmux/one-hunter-vercel-theme.conf
│   └── karabiner/assets/...           # Karabiner-Elements
├── Library/LaunchAgents/              # -> ~/Library/LaunchAgents/ (macOS)
├── run_once_install-packages.sh.tmpl  # One-time package installer
├── homebrew/                          # Brewfile (repo-only, not deployed)
├── scripts/                           # Utility scripts (repo-only)
├── ssh-mesh/                          # Multi-machine SSH setup (repo-only)
├── raycast-scripts/                   # Raycast automation (repo-only)
├── windows/                           # Windows/CloudPC setup scripts (repo-only)
└── docs/                              # Documentation (repo-only)
```

## Key Concepts

### Shell Configuration Flow

```
~/.zshenv (ALL shells)      ~/.zshrc (interactive only)
        │                           │
        ├── DOTFILES export         ├── ~/.zsh/rc/shared.zsh (setopt, aliases)
        ├── PATH setup              ├── ~/.zsh/rc/darwin.zsh OR linux.zsh
        └── Theme exports           ├── ~/.zsh/functions/setup-completions.zsh
                                    ├── ~/.zsh/functions/load-plugins.zsh
                                    ├── ~/.zsh/functions/load-tools.zsh
                                    └── ~/.zsh/functions/init-starship.zsh
```

**Design principle**: `.zshenv` = environment variables ONLY. All tool inits (starship, zoxide, fzf, plugins) happen in `.zshrc` via dedicated function files. Shell sources from deployed paths (`~/.zsh/`), not repo paths.

### Platform Detection

```zsh
case "$(uname -s)" in
  Darwin) source darwin.zsh ;;
  Linux)  source linux.zsh ;;
esac
```

### SSH Mesh

Three-machine setup (Mac, Homelab, Arch) with Tailscale for connectivity. See `ssh-mesh/README.md` for topology and setup.

## Essential Commands

### Deploying Dotfiles (chezmoi)

```bash
chezmoi apply             # Deploy all managed files to ~
chezmoi diff              # Preview what would change
chezmoi managed           # List all managed files
chezmoi edit ~/.zshrc     # Edit source file for ~/.zshrc
chezmoi re-add ~/.zshrc   # Pull changes from deployed file back to source
```

### Installation (first-time setup)

```bash
chezmoi init --source=~/dev/if   # Point chezmoi at this repo
chezmoi apply                     # Deploy dotfiles + run install script
```

### Testing Shell Config

```bash
time zsh -i -c exit       # Measure startup time
zsh -xv                   # Trace shell initialization
source ~/.zshrc           # Reload config (or: reload)
```

## Notes for Claude Code

- **Platform-aware**: Check `uname -s` before platform-specific advice
- **No duplicate inits**: Tool inits happen ONCE in `.zshrc`, never in `.zshenv`
- **chezmoi managed**: All dotfiles are deployed via `chezmoi apply` from this source dir
- **dot_ prefix**: `dot_foo` in source deploys to `~/.foo`; `.tmpl` suffix = Go template
- **$DOTFILES**: Still set in `.zshenv`, points to `~/dev/if` (chezmoi source). Used for `scripts/` references only
- **Deployed paths**: Shell config sources from `~/.zsh/` (deployed), not `$DOTFILES/dot_zsh/` (source)
