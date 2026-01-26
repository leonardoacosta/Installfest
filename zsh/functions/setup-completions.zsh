# functions/setup-completions.zsh - Completion system setup
# Should be sourced early in .zshrc

# Add custom completions directory to fpath
fpath=("$DOTFILES/zsh/completions" $fpath)

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
zstyle ':completion:*:*:git:*' script "$DOTFILES/zsh/completions/git-completion.bash" 2>/dev/null
