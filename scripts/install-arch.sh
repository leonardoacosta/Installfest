#!/usr/bin/env bash
# install-arch.sh - Arch Linux specific installation
# Sourced by install.sh on Linux

set -euo pipefail

. "$DOTFILES/scripts/utils.sh"

install_arch_packages() {
    info "Installing Arch packages..."

    # Core shell tools
    local packages=(
        zsh
        zsh-syntax-highlighting
        zsh-autosuggestions
        starship
        fzf
        zoxide
        atuin
        bat
        eza
        ripgrep
        fd
        git
        tmux
        neovim
        # Container tools
        docker
        docker-buildx
        docker-compose
        # Git tools
        github-cli
        lazygit
        # Languages & runtimes
        nodejs
        npm
        pnpm
        go
        rust
        # Nerd Fonts (required for starship icons)
        ttf-jetbrains-mono-nerd
        ttf-cascadia-mono-nerd
    )

    # Check which packages need to be installed
    local to_install=()
    for pkg in "${packages[@]}"; do
        if ! pacman -Qi "$pkg" &>/dev/null; then
            to_install+=("$pkg")
        fi
    done

    if [[ ${#to_install[@]} -gt 0 ]]; then
        info "Installing: ${to_install[*]}"
        sudo pacman -S --noconfirm "${to_install[@]}"
    else
        success "All packages already installed"
    fi
}

install_aur_packages() {
    info "Checking AUR packages..."

    # AUR packages (require yay or paru)
    local aur_packages=(
        mise
        git-credential-manager  # Cross-platform Git credential storage
        bun-bin                 # Fast JS runtime
        # direnv is in official repos
    )

    if command -v yay &>/dev/null; then
        for pkg in "${aur_packages[@]}"; do
            if ! pacman -Qi "$pkg" &>/dev/null; then
                info "Installing $pkg from AUR..."
                yay -S --noconfirm "$pkg"
            fi
        done
    elif command -v paru &>/dev/null; then
        for pkg in "${aur_packages[@]}"; do
            if ! pacman -Qi "$pkg" &>/dev/null; then
                info "Installing $pkg from AUR..."
                paru -S --noconfirm "$pkg"
            fi
        done
    else
        warning "yay or paru not found, skipping AUR packages"
        warning "Install yay: https://github.com/Jguer/yay"
    fi
}

set_default_shell() {
    if [[ "$SHELL" != *"zsh"* ]]; then
        info "Setting zsh as default shell..."
        chsh -s "$(which zsh)"
        success "Default shell changed to zsh (will take effect on next login)"
    else
        success "zsh is already the default shell"
    fi
}

# Main installation flow
info "=== Arch Linux Installation ==="

read -p "Install packages? [y/n] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    install_arch_packages
    install_aur_packages
fi

read -p "Set zsh as default shell? [y/n] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    set_default_shell
fi

success "Arch Linux setup complete"
