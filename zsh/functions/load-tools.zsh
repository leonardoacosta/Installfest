# functions/load-tools.zsh - Modern CLI tool initialization
# Uses command -v guards for defensive loading

# zoxide (smart cd replacement)
if command -v zoxide &>/dev/null; then
  eval "$(zoxide init zsh)"
  alias cd="z"  # Optional: replace cd entirely
fi

# atuin (better shell history)
if command -v atuin &>/dev/null; then
  eval "$(atuin init zsh --disable-up-arrow)"
  # Keep up arrow for normal history, use Ctrl+R for atuin
fi

# fzf (fuzzy finder)
if command -v fzf &>/dev/null; then
  # Try to load fzf shell integration
  if [[ -f "${HOMEBREW_PREFIX:-/opt/homebrew}/opt/fzf/shell/completion.zsh" ]]; then
    source "${HOMEBREW_PREFIX}/opt/fzf/shell/completion.zsh"
    source "${HOMEBREW_PREFIX}/opt/fzf/shell/key-bindings.zsh"
  elif [[ -f "/usr/share/fzf/completion.zsh" ]]; then
    source "/usr/share/fzf/completion.zsh"
    source "/usr/share/fzf/key-bindings.zsh"
  else
    # Fallback: let fzf generate its own bindings
    source <(fzf --zsh) 2>/dev/null || true
  fi

  # fzf configuration
  export FZF_DEFAULT_OPTS="--height 40% --layout=reverse --border --info=inline"
  export FZF_CTRL_T_OPTS="--preview 'bat -n --color=always {} 2>/dev/null || cat {}'"
  export FZF_ALT_C_OPTS="--preview 'tree -C {} | head -100'"

  # Use fd if available (faster than find)
  if command -v fd &>/dev/null; then
    export FZF_DEFAULT_COMMAND="fd --type f --hidden --follow --exclude .git"
    export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
    export FZF_ALT_C_COMMAND="fd --type d --hidden --follow --exclude .git"
  fi
fi

# direnv (per-directory environment)
if command -v direnv &>/dev/null; then
  eval "$(direnv hook zsh)"
fi

# mise (polyglot version manager - replaces nvm, pyenv, rbenv)
if command -v mise &>/dev/null; then
  eval "$(mise activate zsh)"
fi

# thefuck (command correction)
if command -v thefuck &>/dev/null; then
  eval "$(thefuck --alias)"
fi

# bat (better cat)
if command -v bat &>/dev/null; then
  alias cat="bat --paging=never"
  alias catp="bat"  # With paging
fi

# eza (better ls)
if command -v eza &>/dev/null; then
  alias ls="eza --icons"
  alias ll="eza -l --icons --git"
  alias la="eza -la --icons --git"
  alias lt="eza --tree --level=2 --icons"
fi

# ripgrep config
if command -v rg &>/dev/null; then
  export RIPGREP_CONFIG_PATH="$HOME/.config/ripgrep/config"
fi
