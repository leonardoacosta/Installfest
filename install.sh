#!/bin/bash

. scripts/utils.sh
. scripts/prerequisites.sh
. scripts/brew-install.sh
. scripts/osx-defaults.sh
. scripts/terminal.sh
. scripts/symlinks.sh

info "Dotfiles installation initialized..."
read -p "Install apps? [y/n] " install_apps
read -p "Overwrite existing dotfiles? [y/n] " overwrite_dotfiles

if [[ "$install_apps" == "y" ]]; then
    install_xcode
    install_homebrew
    run_brew_bundle
fi

apply_osx_system_defaults

terminal


printf "\n"
info "===================="
info "Symbolic Links"
info "===================="

chmod +x ./mac/scripts/symlinks.sh
if [[ "$overwrite_dotfiles" == "y" ]]; then
    warning "Deleting existing dotfiles..."
    ./mac/scripts/symlinks.sh --delete --include-files
fi
./mac/scripts/symlinks.sh --create

success "Dotfiles set up successfully."