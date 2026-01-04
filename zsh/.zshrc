setopt HIST_IGNORE_ALL_DUPS

# Homebrew
eval "$(/opt/homebrew/bin/brew shellenv)"

# Starship
export STARSHIP_CONFIG="$HOME/.config/starship/starship.toml"
eval "$(starship init zsh)"

alias claude="claude --dangerously-skip-permissions"

# Load Git completion
zstyle ':completion:*:*:git:*' script $HOME/.config/zsh/git-completion.bash
fpath=($HOME/.config/zsh $fpath)
autoload -Uz compinit && compinit

# zsh-syntax-highlighting
source $(brew --prefix)/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# zsh-autosuggestions
source $(brew --prefix)/share/zsh-autosuggestions/zsh-autosuggestions.zsh

# pnpm
export PNPM_HOME="/Users/leonardoacosta/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"

# nvm
export NVM_DIR="$HOME/.nvm"
    [ -s "$HOMEBREW_PREFIX/opt/nvm/nvm.sh" ] && \. "$HOMEBREW_PREFIX/opt/nvm/nvm.sh" # This loads nvm
    [ -s "$HOMEBREW_PREFIX/opt/nvm/etc/bash_completion.d/nvm" ] && \. "$HOMEBREW_PREFIX/opt/nvm/etc/bash_completion.d/nvm" # This loads nvm bash_completionexport PATH=$PATH:$HOME/.maestro/bin
