#!/usr/bin/env zsh
# .zshenv - Entry point for zsh environment
# Sourced for ALL zsh instances (login, interactive, scripts)
# Symlink: ~/.zshenv -> $DOTFILES/zsh/.zshenv
#
# IMPORTANT: This file should ONLY set environment variables.
# Tool inits (starship, zoxide, fzf) belong in .zshrc for interactive shells.

# Doppler configuration
export USE_DOPPLER=true
export DOPPLER_PROJECT=homelab
export DOPPLER_CONFIG=prd

# Set DOTFILES path (used by all other scripts)
export DOTFILES="${DOTFILES:-$HOME/dev/if}"

# PATH additions (user binaries)
export PATH="$HOME/.claude/bin:$HOME/.local/bin:$PATH"

# Theme exports (for terminal emulators that read env)
export TMUX_THEME="one-hunter-vercel"
export NVIM_THEME="nord"
export STARSHIP_THEME="nord"
export WEZTERM_THEME="nord"

# Local overrides (secrets, machine-specific tokens)
[[ -f ~/.zshenv.local ]] && source ~/.zshenv.local
