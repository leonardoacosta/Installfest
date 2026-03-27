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
        # Languages & runtimes (node/pnpm managed by mise)
        go
        rust
        # Build tools (for compiling C tools like youtube_transcript)
        curl
        base-devel
        # Azure DevOps CLI
        python-pipx
        python-packaging
        # Networking
        proxychains-ng
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

install_azure_cli() {
    info "Checking Azure CLI..."

    if command -v az &>/dev/null; then
        success "Azure CLI already installed"
    else
        info "Installing Azure CLI via pipx..."
        pipx install azure-cli
    fi

    if command -v az &>/dev/null; then
        if az extension show --name azure-devops &>/dev/null; then
            success "Azure DevOps extension already installed"
        else
            info "Adding Azure DevOps extension..."
            az extension add --name azure-devops
            success "Azure DevOps extension installed"
        fi
    else
        warning "Azure CLI not available, skipping DevOps extension"
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

# Non-interactive when sourced by chezmoi run_once
# Interactive prompts only when run directly (./install-arch.sh)
if [[ "${CHEZMOI:-0}" == "1" ]] || [[ ! -t 0 ]]; then
    # Non-interactive: run everything
    install_arch_packages
    install_aur_packages
    install_azure_cli
    set_default_shell
else
    # Interactive: ask first
    read -p "Install packages? [y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_arch_packages
        install_aur_packages
        install_azure_cli
    fi

    read -p "Set zsh as default shell? [y/n] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        set_default_shell
    fi
fi

success "Arch Linux setup complete"
