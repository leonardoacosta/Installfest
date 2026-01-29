#!/usr/bin/env zsh
# .zshrc - Entry point for interactive shell configuration
# Sourced for interactive zsh sessions
# Symlink: ~/.zshrc -> $DOTFILES/zsh/.zshrc

# Ensure DOTFILES is set (should be set by .zshenv, but fallback)
export DOTFILES="${DOTFILES:-$HOME/personal/if}"

# Source shared configuration (options, aliases, completions, tools)
source "$DOTFILES/zsh/rc/shared.zsh"

# Source platform-specific configuration
case "$(uname -s)" in
  Darwin)
    source "$DOTFILES/zsh/rc/darwin.zsh"
    ;;
  Linux)
    source "$DOTFILES/zsh/rc/linux.zsh"
    ;;
esac
