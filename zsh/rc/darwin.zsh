# rc/darwin.zsh - macOS-specific shell configuration
# Sourced by .zshrc on Darwin

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
