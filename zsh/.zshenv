#!/usr/bin/env zsh
# .zshenv - Minimal env setup (runs for ALL zsh instances)
# Symlink: ~/.zshenv -> $DOTFILES/zsh/.zshenv
# Keep this FAST - no heavy tools here

# Core paths
export DOTFILES="$HOME/dev/if"
export PATH="$HOME/.claude/bin:$HOME/.local/bin:/opt/homebrew/bin:$PATH"

# XDG
export XDG_CONFIG_HOME="$HOME/.config"
export XDG_DATA_HOME="$HOME/.local/share"
export XDG_CACHE_HOME="$HOME/.cache"

# Editor
export EDITOR="nvim"
export VISUAL="$EDITOR"

# Theme exports
export STARSHIP_CONFIG="$HOME/.config/starship/starship.toml"
export TMUX_THEME="one-hunter-vercel"
