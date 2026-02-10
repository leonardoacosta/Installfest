# rc/shared.zsh - Common shell configuration for all platforms
# Sourced by .zshrc on all platforms

# ============================================================
# Shell Options
# ============================================================

# History options
setopt HIST_IGNORE_ALL_DUPS    # Remove older duplicate entries
setopt SHARE_HISTORY           # Share history between sessions
setopt INC_APPEND_HISTORY      # Add commands immediately
setopt HIST_REDUCE_BLANKS      # Remove superfluous blanks
setopt HIST_VERIFY             # Show command before executing from history
setopt EXTENDED_HISTORY        # Save timestamp and duration

# Directory navigation
setopt AUTO_CD                 # cd by typing directory name
setopt AUTO_PUSHD              # Push directories to stack
setopt PUSHD_IGNORE_DUPS       # Don't push duplicates
setopt PUSHD_SILENT            # Don't print stack after pushd/popd

# Completion
setopt COMPLETE_IN_WORD        # Complete from cursor position
setopt ALWAYS_TO_END           # Move cursor to end after completion
setopt AUTO_MENU               # Show menu on second tab

# Globbing
setopt EXTENDED_GLOB           # Extended globbing syntax
setopt NO_CASE_GLOB            # Case insensitive globbing

# Prompt
setopt PROMPT_SUBST            # Enable prompt substitution

# ============================================================
# Completions
# ============================================================

# Git completions (if available)
[[ -f "$HOME/.config/zsh/git-completion.bash" ]] && \
  zstyle ':completion:*:*:git:*' script "$HOME/.config/zsh/git-completion.bash"

# Add completion paths
fpath=($HOME/.config/zsh $fpath)

# Initialize completion system
autoload -Uz compinit && compinit

# ============================================================
# Plugins (multi-platform loader)
# ============================================================

source "$DOTFILES/zsh/functions/load-plugins.zsh"

# ============================================================
# Tools (cross-platform)
# ============================================================

# Starship prompt
export STARSHIP_CONFIG="$HOME/.config/starship/starship.toml"
command -v starship &>/dev/null && eval "$(starship init zsh)"

# Zoxide (smart cd)
command -v zoxide &>/dev/null && eval "$(zoxide init zsh)"

# FZF (fuzzy finder)
if command -v fzf &>/dev/null; then
  # Try zsh integration, fall back to basic
  if [[ -f "${HOMEBREW_PREFIX:-/opt/homebrew}/opt/fzf/shell/completion.zsh" ]]; then
    source "${HOMEBREW_PREFIX}/opt/fzf/shell/completion.zsh"
    source "${HOMEBREW_PREFIX}/opt/fzf/shell/key-bindings.zsh"
  elif [[ -f "/usr/share/fzf/completion.zsh" ]]; then
    source "/usr/share/fzf/completion.zsh"
    source "/usr/share/fzf/key-bindings.zsh"
  else
    # Generic init
    source <(fzf --zsh) 2>/dev/null || true
  fi
fi

# Atuin (enhanced history) - uncomment to enable
# command -v atuin &>/dev/null && eval "$(atuin init zsh)"

# ============================================================
# Common Aliases
# ============================================================

alias claude="claude --dangerously-skip-permissions"
alias cs="~/dev/ccswitch.sh --switch"
alias ll="ls -lah"
alias la="ls -A"
alias l="ls -CF"
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."

# Git aliases
alias gs="git status"
alias gd="git diff"
alias gl="git log --oneline -20"
alias gp="git pull"
alias ga="git add"
alias gc="git commit"
alias gco="git checkout"
alias gb="git branch"

# Safety aliases
alias rm="rm -i"
alias cp="cp -i"
alias mv="mv -i"

# Misc aliases
alias path='echo $PATH | tr ":" "\n"'
alias reload="source ~/.zshrc"
