#!/usr/bin/env zsh
# .zshenv - Entry point for zsh environment
# Sourced for ALL zsh instances (login, interactive, scripts)
# Symlink: ~/.zshenv -> $DOTFILES/zsh/.zshenv

# Set DOTFILES path (used by all other scripts)
export DOTFILES="${DOTFILES:-$HOME/personal/if}"

# Source shared environment (locale, editor, history, XDG)
source "$DOTFILES/zsh/env/shared.zsh"

# Source platform-specific environment
case "$(uname -s)" in
  Darwin)
    source "$DOTFILES/zsh/env/darwin.zsh"
    ;;
  Linux)
    source "$DOTFILES/zsh/env/linux.zsh"
    ;;
esac

# Theme exports (for terminal emulators that read env)
export TMUX_THEME="one-hunter-vercel"
export NVIM_THEME="nord"
export STARSHIP_THEME="nord"
export WEZTERM_THEME="nord"
