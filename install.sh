#!/usr/bin/env bash
# install.sh - Unified dotfiles installer
# Detects OS and runs appropriate setup

set -euo pipefail

# Get the directory where this script lives
DOTFILES="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export DOTFILES

# Source utilities
. "$DOTFILES/scripts/utils.sh"

info "========================================"
info "  Dotfiles Installer"
info "  Platform: $(uname -s) ($(uname -m))"
info "  Dotfiles: $DOTFILES"
info "========================================"
echo

# Detect OS and run platform-specific setup
case "$(uname -s)" in
  Darwin)
    info "Detected macOS"

    # Source Mac prerequisites
    . "$DOTFILES/scripts/prerequisites.sh"
    . "$DOTFILES/scripts/brew-install.sh"
    . "$DOTFILES/scripts/osx-defaults.sh"
    . "$DOTFILES/scripts/terminal.sh"

    read -p "Install Homebrew and packages? [y/n] " -n 1 -r install_apps
    echo

    if [[ $install_apps =~ ^[Yy]$ ]]; then
        install_xcode
        install_homebrew
        run_brew_bundle
    fi

    # Apply macOS system defaults
    read -p "Apply macOS system defaults? [y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        apply_osx_system_defaults
    fi

    # Terminal setup
    terminal

    # YouTube transcript tool (optional)
    . "$DOTFILES/scripts/youtube-transcript.sh"
    read -p "Install youtube_transcript CLI? [y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_youtube_transcript
    fi

    # DB Pro database client (optional, not in Homebrew)
    . "$DOTFILES/scripts/dbpro.sh"
    read -p "Install DB Pro database client? [y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_dbpro
    fi

    # ani-cli (anime streaming from terminal)
    . "$DOTFILES/scripts/ani-cli.sh"
    read -p "Install ani-cli? [y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_ani_cli
    fi

    # Cursor CLI (opens files from terminal)
    if ! command -v cursor &>/dev/null; then
        read -p "Install Cursor CLI? [y/n] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            info "Installing Cursor CLI..."
            curl -fsSL https://cursor.com/install | bash
            success "Cursor CLI installed"
        fi
    else
        success "Cursor CLI already installed"
    fi
    ;;

  Linux)
    info "Detected Linux"

    # Check if Arch Linux
    if [[ -f /etc/arch-release ]]; then
        . "$DOTFILES/scripts/install-arch.sh"

        # YouTube transcript tool (optional)
        . "$DOTFILES/scripts/youtube-transcript.sh"
        read -p "Install youtube_transcript CLI? [y/n] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_youtube_transcript
        fi
    else
        warning "Non-Arch Linux detected. Only symlinks will be created."
        warning "Install zsh plugins manually for your distribution."
    fi
    ;;

  *)
    error "Unsupported OS: $(uname -s)"
    exit 1
    ;;
esac

# === Symlinks (common to all platforms) ===
echo
info "========================================"
info "  Symbolic Links"
info "========================================"

chmod +x "$DOTFILES/scripts/symlinks.sh"

# Show preview of what will happen
"$DOTFILES/scripts/symlinks.sh" --preview

read -p "Overwrite existing dotfiles marked above? [y/n] " -n 1 -r overwrite_dotfiles
echo

if [[ $overwrite_dotfiles =~ ^[Yy]$ ]]; then
    warning "Deleting existing dotfiles..."
    "$DOTFILES/scripts/symlinks.sh" --delete --include-files
fi

"$DOTFILES/scripts/symlinks.sh" --create

# Platform-specific symlinks
if [[ "$(uname -s)" == "Darwin" ]]; then
    # WezTerm (Mac only)
    if [[ -f "$DOTFILES/wezterm/wezterm.lua" ]]; then
        mkdir -p "$HOME/.config/wezterm"
        ln -sfn "$DOTFILES/wezterm/wezterm.lua" "$HOME/.config/wezterm/wezterm.lua"
        success "Created WezTerm symlink"
    fi

    # Mic priority LaunchAgent (Mac only)
    if [[ -f "$DOTFILES/launchd/com.leonardoacosta.mic-priority.plist" ]]; then
        chmod +x "$DOTFILES/scripts/mic-priority.sh"
        mkdir -p "$HOME/Library/LaunchAgents"
        ln -sfn "$DOTFILES/launchd/com.leonardoacosta.mic-priority.plist" "$HOME/Library/LaunchAgents/com.leonardoacosta.mic-priority.plist"
        success "Created mic-priority LaunchAgent symlink"

        # Load the agent if not already loaded
        if ! launchctl list | grep -q "com.leonardoacosta.mic-priority"; then
            launchctl load "$HOME/Library/LaunchAgents/com.leonardoacosta.mic-priority.plist" 2>/dev/null || true
            success "Loaded mic-priority LaunchAgent"
        fi
    fi
fi

# === Final messages ===
echo
success "========================================"
success "  Installation Complete!"
success "========================================"
echo
info "Next steps:"
info "  1. Restart your terminal or run: source ~/.zshrc"
info "  2. Verify starship prompt is working"
info "  3. Run 'z --help' to learn zoxide"
info "  4. Run 'atuin login' to sync history (optional)"
echo
