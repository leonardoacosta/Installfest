#!/usr/bin/env zsh
# .zshrc - Entry point for interactive zsh sessions
# Symlink: ~/.zshrc -> $DOTFILES/zsh/.zshrc

# Ensure DOTFILES is set (should be set by .zshenv)
export DOTFILES="${DOTFILES:-$HOME/dev/if}"

# Load secrets via Doppler (falls back to ~/.env if Doppler unavailable)
if command -v doppler &>/dev/null; then
  eval "$(doppler secrets download --no-file --format env 2>/dev/null)"
elif [[ -f "$HOME/.env" ]]; then
  set -a
  source "$HOME/.env"
  set +a
fi

# Load shared configuration (history opts, aliases, settings)
source "$DOTFILES/zsh/rc/shared.zsh"

# Load platform-specific configuration
case "$(uname -s)" in
  Darwin)
    source "$DOTFILES/zsh/rc/darwin.zsh"
    ;;
  Linux)
    source "$DOTFILES/zsh/rc/linux.zsh"
    ;;
esac

# Load functions (order matters!)
source "$DOTFILES/zsh/functions/setup-completions.zsh"  # compinit, fpath
source "$DOTFILES/zsh/functions/load-plugins.zsh"       # syntax-hl, autosuggestions
source "$DOTFILES/zsh/functions/load-tools.zsh"         # zoxide, atuin, fzf, etc.
source "$DOTFILES/zsh/functions/init-starship.zsh"      # prompt (load last)

