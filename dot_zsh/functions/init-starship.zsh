# functions/init-starship.zsh - Starship prompt initialization
# Should be sourced last (after other tools)

if command -v starship &>/dev/null; then
  # Set config path (chezmoi deploys to ~/.config/starship/)
  export STARSHIP_CONFIG="${STARSHIP_CONFIG:-$HOME/.config/starship/starship.toml}"

  # Initialize starship
  eval "$(starship init zsh)"
fi
