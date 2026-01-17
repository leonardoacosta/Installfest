setopt HIST_IGNORE_ALL_DUPS

# * =========================================================
# * Homebrew ================================================
eval "$(/opt/homebrew/bin/brew shellenv)"

# * =========================================================
# * Starship ================================================
export STARSHIP_CONFIG="$HOME/.config/starship/starship.toml"
setopt PROMPT_SUBST
eval "$(starship init zsh)"
# Ensure Starship is properly initialized
# if command -v starship &> /dev/null; then
#     eval "$(starship init zsh)"
# fi
# Fix prompt substitution

# * =========================================================
# * Zsh Config ==============================================
# Git completions
zstyle ':completion:*:*:git:*' script $HOME/.config/zsh/git-completion.bash
fpath=($HOME/.config/zsh $fpath)
autoload -Uz compinit && compinit

# zsh-syntax-highlighting
source $(brew --prefix)/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# zsh-autosuggestions
source $(brew --prefix)/share/zsh-autosuggestions/zsh-autosuggestions.zsh

# Efficiency tools
eval "$(zoxide init zsh)"      # Smart cd (use: z <partial-path>)
eval "$(atuin init zsh)"       # Enhanced history (Ctrl+R)
source <(fzf --zsh)            # Fuzzy finder (Ctrl+T files)

# * =========================================================
# * pnpm ====================================================
export PNPM_HOME="/Users/leonardoacosta/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"

# * =========================================================
# * dotnet ==================================================
export PATH="$PATH:/Users/leonardoacosta/.dotnet/tools"

# * =========================================================
# * nvm =====================================================
export NVM_DIR="$HOME/.nvm"
    [ -s "$HOMEBREW_PREFIX/opt/nvm/nvm.sh" ] && \. "$HOMEBREW_PREFIX/opt/nvm/nvm.sh" # This loads nvm
    [ -s "$HOMEBREW_PREFIX/opt/nvm/etc/bash_completion.d/nvm" ] && \. "$HOMEBREW_PREFIX/opt/nvm/etc/bash_completion.d/nvm" # This loads nvm bash_completionexport PATH=$PATH:$HOME/.maestro/bin

# * =========================================================
# * Aliases =================================================
alias claude="claude --dangerously-skip-permissions"