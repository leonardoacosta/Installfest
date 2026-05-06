# functions/setup-completions.zsh - Completion system setup
# Should be sourced early in .zshrc

# Add custom completions directory to fpath
fpath=("$HOME/.zsh/completions" $fpath)

# Initialize completion system
autoload -Uz compinit

# Only regenerate .zcompdump once per day for faster startup
if [[ -n ${ZDOTDIR:-$HOME}/.zcompdump(#qN.mh+24) ]]; then
  compinit
else
  compinit -C  # Use cached completions
fi

# Completion styling
zstyle ':completion:*' menu select                           # Menu selection
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'   # Case insensitive
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"     # Colorize completions
zstyle ':completion:*' group-name ''                         # Group by category
zstyle ':completion:*:descriptions' format '%F{yellow}-- %d --%f'
zstyle ':completion:*:warnings' format '%F{red}-- no matches --%f'

# Cache completions for faster response
local cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/zsh"
zstyle ':completion:*' use-cache on
zstyle ':completion:*' cache-path "$cache_dir/zcompcache"

# Ensure cache directory exists
[[ -d "$cache_dir" ]] || mkdir -p "$cache_dir"

# Git completion styling
zstyle ':completion:*:*:git:*' script "$HOME/.zsh/completions/git-completion.bash" 2>/dev/null

# ============================================================
# CLI Completions — cache-on-first-run
# Each block generates a completion file once; subsequent shells use the cache.
# To regenerate: rm ~/.zsh/completions/_<tool> && exec zsh
# ============================================================

_comp_dir="$HOME/.zsh/completions"

# resend — brew auto-installs _resend to site-functions on macOS (no manual generation needed)
# On Linux: handled by the platform block below.

# neonctl (Neon database CLI)
if command -v neonctl &>/dev/null && [[ ! -f "$_comp_dir/_neonctl" ]]; then
  neonctl completion zsh > "$_comp_dir/_neonctl" 2>/dev/null
fi

# rustup
if command -v rustup &>/dev/null && [[ ! -f "$_comp_dir/_rustup" ]]; then
  rustup completions zsh > "$_comp_dir/_rustup" 2>/dev/null
fi

# Linux (Arch): brew-managed tools that don't auto-install completions via pacman.
# Format: "binary:completion command:output filename"
if [[ "$(uname -s)" == "Linux" ]]; then
  local _linux_tools=(
    "resend:resend completion zsh:_resend"
    "stripe:stripe completion zsh:_stripe"
    "doppler:doppler completion zsh:_doppler"
    "flyctl:flyctl completion zsh:_flyctl"
    "sentry-cli:sentry-cli completions zsh:_sentry-cli"
  )
  local _spec _bin _cmd _file
  for _spec in "${_linux_tools[@]}"; do
    _bin="${_spec%%:*}"; _rest="${_spec#*:}"; _cmd="${_rest%%:*}"; _file="${_rest##*:}"
    if command -v "$_bin" &>/dev/null && [[ ! -f "$_comp_dir/$_file" ]]; then
      eval "$_cmd" > "$_comp_dir/$_file" 2>/dev/null
    fi
  done
  unset _linux_tools _spec _bin _rest _cmd _file
fi

unset _comp_dir
