# functions/load-plugins.zsh - Defensive plugin loading
# Searches multiple paths for plugins, loads first found

# Syntax highlighting
_load_syntax_highlighting() {
  local paths=(
    # Homebrew (macOS)
    "${HOMEBREW_PREFIX:-/opt/homebrew}/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
    "/usr/local/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
    # Arch Linux (pacman)
    "/usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
    # Ubuntu/Debian
    "/usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
    # Nix
    "$HOME/.nix-profile/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
  )

  for p in "${paths[@]}"; do
    if [[ -f "$p" ]]; then
      source "$p"
      return 0
    fi
  done
  return 1
}

# Autosuggestions
_load_autosuggestions() {
  local paths=(
    # Homebrew (macOS)
    "${HOMEBREW_PREFIX:-/opt/homebrew}/share/zsh-autosuggestions/zsh-autosuggestions.zsh"
    "/usr/local/share/zsh-autosuggestions/zsh-autosuggestions.zsh"
    # Arch Linux (pacman)
    "/usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh"
    # Ubuntu/Debian
    "/usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh"
    # Nix
    "$HOME/.nix-profile/share/zsh-autosuggestions/zsh-autosuggestions.zsh"
  )

  for p in "${paths[@]}"; do
    if [[ -f "$p" ]]; then
      source "$p"
      # Configure autosuggestions
      ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=#666666"
      ZSH_AUTOSUGGEST_STRATEGY=(history completion)
      return 0
    fi
  done
  return 1
}

# History substring search (optional)
_load_history_substring_search() {
  local paths=(
    "${HOMEBREW_PREFIX:-/opt/homebrew}/share/zsh-history-substring-search/zsh-history-substring-search.zsh"
    "/usr/share/zsh/plugins/zsh-history-substring-search/zsh-history-substring-search.zsh"
  )

  for p in "${paths[@]}"; do
    if [[ -f "$p" ]]; then
      source "$p"
      # Bind keys
      bindkey '^[[A' history-substring-search-up
      bindkey '^[[B' history-substring-search-down
      return 0
    fi
  done
  return 1
}

# Load all plugins
_load_syntax_highlighting
_load_autosuggestions
_load_history_substring_search 2>/dev/null || true  # Optional plugin
