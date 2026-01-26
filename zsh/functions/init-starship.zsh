# functions/init-starship.zsh - Starship prompt initialization
# Should be sourced last (after other tools)

if command -v starship &>/dev/null; then
  # Set config path if using custom location
  export STARSHIP_CONFIG="${STARSHIP_CONFIG:-$HOME/.config/starship/starship.toml}"

  # Fallback to dotfiles location if default doesn't exist
  if [[ ! -f "$STARSHIP_CONFIG" && -f "$DOTFILES/starship/starship.toml" ]]; then
    export STARSHIP_CONFIG="$DOTFILES/starship/starship.toml"
  fi

  # Initialize starship
  eval "$(starship init zsh)"
fi
