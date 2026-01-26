# rc/shared.zsh - Common shell configuration for all platforms
# Sourced by .zshrc on all platforms

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

# Common aliases (platform-agnostic)
alias claude="claude --dangerously-skip-permissions"
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
