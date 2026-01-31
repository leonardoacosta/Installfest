#!/usr/bin/env zsh
# .zshrc - Interactive shell configuration
# Symlink: ~/.zshrc -> $DOTFILES/zsh/.zshrc

# Ensure DOTFILES is set (fallback if .zshenv didn't load)
export DOTFILES="${DOTFILES:-$HOME/dev/if}"

# Auto-sync ~/.claude on new terminal
[[ -d ~/.claude/.git ]] && (cd ~/.claude && git pull --quiet 2>/dev/null &)

# ============================================================
# Shell Options
# ============================================================
setopt HIST_IGNORE_ALL_DUPS SHARE_HISTORY INC_APPEND_HISTORY
setopt HIST_REDUCE_BLANKS HIST_VERIFY EXTENDED_HISTORY
setopt AUTO_CD AUTO_PUSHD PUSHD_IGNORE_DUPS PUSHD_SILENT
setopt COMPLETE_IN_WORD ALWAYS_TO_END AUTO_MENU
setopt EXTENDED_GLOB NO_CASE_GLOB PROMPT_SUBST

# ============================================================
# Completions
# ============================================================
fpath=($HOME/.config/zsh $fpath)
autoload -Uz compinit && compinit

# ============================================================
# Platform-specific
# ============================================================
case "$(uname -s)" in
  Darwin)
    [[ -f "$DOTFILES/zsh/rc/darwin.zsh" ]] && source "$DOTFILES/zsh/rc/darwin.zsh"
    ;;
  Linux)
    [[ -f "$DOTFILES/zsh/rc/linux.zsh" ]] && source "$DOTFILES/zsh/rc/linux.zsh"
    ;;
esac

# ============================================================
# Tools
# ============================================================

# Starship prompt
if command -v starship &>/dev/null; then
  eval "$(starship init zsh)"
fi

# Zoxide (smart cd)
if command -v zoxide &>/dev/null; then
  eval "$(zoxide init zsh)"
fi

# FZF
if command -v fzf &>/dev/null; then
  if [[ -f "${HOMEBREW_PREFIX:-/opt/homebrew}/opt/fzf/shell/key-bindings.zsh" ]]; then
    source "${HOMEBREW_PREFIX:-/opt/homebrew}/opt/fzf/shell/key-bindings.zsh"
    source "${HOMEBREW_PREFIX:-/opt/homebrew}/opt/fzf/shell/completion.zsh"
  else
    source <(fzf --zsh) 2>/dev/null || true
  fi
fi

# ============================================================
# Aliases
# ============================================================
alias cs="~/dev/ccswitch.sh --switch"
alias claude="claude --dangerously-skip-permissions"
alias ll="ls -lah"
alias la="ls -A"
alias ..="cd .."
alias ...="cd ../.."

# Git
alias gs="git status"
alias gd="git diff"
alias gl="git log --oneline -20"
alias gp="git pull"
alias ga="git add"
alias gc="git commit"

# Safety
alias rm="rm -i"
alias cp="cp -i"
alias mv="mv -i"

# Misc
alias path='echo $PATH | tr ":" "\n"'
alias reload="source ~/.zshrc"
