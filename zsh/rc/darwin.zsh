# rc/darwin.zsh - macOS-specific shell configuration
# Sourced by .zshrc on Darwin

# ============================================================
# Homebrew
# ============================================================

if [[ -f "/opt/homebrew/bin/brew" ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -f "/usr/local/bin/brew" ]]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

# ============================================================
# Runtime Paths
# ============================================================

# pnpm
export PNPM_HOME="$HOME/Library/pnpm"
[[ -d "$PNPM_HOME" ]] && export PATH="$PNPM_HOME:$PATH"

# .NET tools
[[ -d "$HOME/.dotnet/tools" ]] && export PATH="$PATH:$HOME/.dotnet/tools"

# Maestro (mobile testing)
[[ -d "$HOME/.maestro/bin" ]] && export PATH="$PATH:$HOME/.maestro/bin"

# ============================================================
# NVM (Node Version Manager)
# ============================================================

export NVM_DIR="$HOME/.nvm"
[[ -s "$HOMEBREW_PREFIX/opt/nvm/nvm.sh" ]] && source "$HOMEBREW_PREFIX/opt/nvm/nvm.sh"
[[ -s "$HOMEBREW_PREFIX/opt/nvm/etc/bash_completion.d/nvm" ]] && source "$HOMEBREW_PREFIX/opt/nvm/etc/bash_completion.d/nvm"

# ============================================================
# macOS Aliases
# ============================================================

# macOS uses BSD ls, colors work differently
alias ls="ls -G"

# Open current directory in Finder
alias finder="open ."

# Flush DNS cache
alias flushdns="sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder"

# Show/hide hidden files in Finder
alias showfiles="defaults write com.apple.finder AppleShowAllFiles YES; killall Finder"
alias hidefiles="defaults write com.apple.finder AppleShowAllFiles NO; killall Finder"

# Airport CLI for WiFi diagnostics
alias airport="/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport"

# Homebrew shortcuts
alias brewup="brew update && brew upgrade && brew cleanup"

# pbcopy/pbpaste available natively on macOS
