#!/usr/bin/env zsh
# .zshenv - Entry point for zsh environment
# Sourced for ALL zsh instances (login, interactive, scripts)
# Symlink: ~/.zshenv -> $DOTFILES/zsh/.zshenv

  # In homelab.sh (or export before running)                                                                                                                                                               
export USE_DOPPLER=true
export DOPPLER_PROJECT=homelab
export DOPPLER_CONFIG=prd

# Set DOTFILES path (used by all other scripts)
export DOTFILES="${DOTFILES:-$HOME/dev/if}"

# PATH additions (user binaries)
export PATH="$HOME/.claude/bin:$HOME/.local/bin:$PATH"

# Source shared environment (locale, editor, history, XDG)
source "$DOTFILES/zsh/rc/shared.zsh"

# Source platform-specific environment
case "$(uname -s)" in
  Darwin)
    source "$DOTFILES/zsh/rc/darwin.zsh"
    ;;
  Linux)
    source "$DOTFILES/zsh/rc/linux.zsh"
    ;;
esac

# Local overrides (secrets, machine-specific tokens)
[[ -f ~/.zshenv.local ]] && source ~/.zshenv.local

# Theme exports (for terminal emulators that read env)
export TMUX_THEME="one-hunter-vercel"
export NVIM_THEME="nord"
export STARSHIP_THEME="nord"
export WEZTERM_THEME="nord"
