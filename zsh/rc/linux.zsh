# rc/linux.zsh - Linux (Arch) specific shell configuration
# Sourced by .zshrc on Linux

# ============================================================
# Runtime Paths
# ============================================================

# pnpm (Linux path)
export PNPM_HOME="$HOME/.local/share/pnpm"
[[ -d "$PNPM_HOME" ]] && export PATH="$PNPM_HOME:$PATH"

# Cargo (Rust)
[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"

# Go
[[ -d "/usr/local/go/bin" ]] && export PATH="$PATH:/usr/local/go/bin"
[[ -d "$HOME/go/bin" ]] && export PATH="$PATH:$HOME/go/bin"

# ============================================================
# Aliases
# ============================================================

# GNU coreutils color support
alias ls="ls --color=auto"
alias grep="grep --color=auto"
alias fgrep="fgrep --color=auto"
alias egrep="egrep --color=auto"
alias diff="diff --color=auto"
alias ip="ip -color=auto"

# Homelab shortcuts
alias hl="cd ~/personal/hl/homelab"
alias hls="cd ~/personal/hl/homelab && ./homelab.sh status"
alias hll="cd ~/personal/hl/homelab && ./homelab.sh logs"
alias hlr="cd ~/personal/hl/homelab && ./homelab.sh restart"

# Docker shortcuts
alias dc="docker compose"
alias dps="docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
alias dlog="docker compose logs -f"
alias dexec="docker exec -it"
alias dprune="docker system prune -af"

# Systemctl shortcuts
alias sc="sudo systemctl"
alias scs="sudo systemctl status"
alias scr="sudo systemctl restart"
alias sce="sudo systemctl enable"
alias scd="sudo systemctl disable"
alias jctl="journalctl -xe"

# Pacman/yay shortcuts
alias pacup="sudo pacman -Syu"
alias pacin="sudo pacman -S"
alias pacrm="sudo pacman -Rns"
alias pacss="pacman -Ss"
alias pacqi="pacman -Qi"
alias yayup="yay -Syu"

# Project switching
[[ -f "$HOME/personal/ccswitch.sh" ]] && alias cs="$HOME/personal/ccswitch.sh --switch"

# Clipboard (xclip/xsel fallback)
if command -v xclip &>/dev/null; then
  alias pbcopy="xclip -selection clipboard"
  alias pbpaste="xclip -selection clipboard -o"
elif command -v xsel &>/dev/null; then
  alias pbcopy="xsel --clipboard --input"
  alias pbpaste="xsel --clipboard --output"
elif command -v wl-copy &>/dev/null; then
  alias pbcopy="wl-copy"
  alias pbpaste="wl-paste"
fi

# Open file manager
alias open="xdg-open"
