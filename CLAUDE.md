<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Personal dotfiles and development environment configuration for macOS and Arch Linux. Cross-platform shell setup with SSH mesh networking between machines.

## Directory Structure

```
if/
├── zsh/                    # Zsh configuration (cross-platform)
│   ├── .zshenv             # Environment variables only (all shells)
│   ├── .zshrc              # Interactive shell config
│   ├── rc/
│   │   ├── shared.zsh      # Options + aliases (cross-platform)
│   │   ├── darwin.zsh      # macOS-specific (Homebrew, NVM)
│   │   └── linux.zsh       # Arch-specific (pacman, docker)
│   ├── functions/
│   │   ├── setup-completions.zsh
│   │   ├── load-plugins.zsh
│   │   ├── load-tools.zsh
│   │   └── init-starship.zsh
│   └── completions/        # Custom completion scripts
├── homebrew/               # Brewfile for macOS packages
├── starship/               # Starship prompt configuration
├── wezterm/                # WezTerm terminal config
├── tmux/                   # Tmux configuration
├── ssh-mesh/               # Multi-machine SSH setup
│   ├── configs/            # Per-machine SSH configs
│   ├── keys/               # SSH keys (gitignored)
│   └── scripts/            # Setup scripts per platform
├── raycast-scripts/        # Raycast automation scripts
├── scripts/                # Installation and setup scripts
│   ├── prerequisites.sh    # Xcode CLI, Homebrew
│   ├── brew-install.sh     # Install from Brewfile
│   ├── symlinks.sh         # Dotfile symlink management
│   ├── symlinks.conf       # Symlink mappings
│   ├── osx-defaults.sh     # macOS system preferences
│   └── install-arch.sh     # Arch Linux package setup
├── install.sh              # Main interactive installer
├── sync.sh                 # Sync/backup script
└── openspec/               # Specification management
```

## Key Concepts

### Shell Configuration Flow

```
.zshenv (ALL shells)     .zshrc (interactive only)
        │                         │
        ├── DOTFILES export       ├── shared.zsh (setopt, aliases)
        ├── PATH setup            ├── darwin.zsh OR linux.zsh
        └── Theme exports         ├── setup-completions.zsh
                                  ├── load-plugins.zsh
                                  ├── load-tools.zsh
                                  └── init-starship.zsh
```

**Design principle**: `.zshenv` = environment variables ONLY. All tool inits (starship, zoxide, fzf, plugins) happen in `.zshrc` via dedicated function files.

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

### Installation

```bash
./install.sh              # Interactive installer (macOS)
scripts/install-arch.sh   # Arch Linux setup
```

### Symlinks

```bash
scripts/symlinks.sh       # Create dotfile symlinks
# Mappings defined in scripts/symlinks.conf
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
- **Symlinks**: All dotfiles are symlinked from this repo via `scripts/symlinks.conf`
- **OpenSpec Changes**: Use `/openspec:proposal` for structural changes
