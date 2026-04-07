# rc/darwin.zsh - macOS-specific shell configuration
# Sourced by .zshrc on Darwin

# ============================================================
# PATH priority fix — macOS /etc/zprofile runs path_helper AFTER
# .zshenv, which rebuilds PATH and pushes user entries to the end.
# Re-prepend here (.zshrc runs after /etc/zprofile) to ensure
# ~/.local/bin takes priority over /opt/homebrew/bin.
# ============================================================
export PATH="$HOME/.claude/bin:$HOME/.local/bin:$PATH"

# ============================================================
# macOS Aliases (Homebrew, runtime paths moved to .zshenv)
# (ls handled by eza in load-tools.zsh)
# ============================================================

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
