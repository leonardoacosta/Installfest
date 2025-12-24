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
read -p "Set up Claude Code configuration? [y/n] " setup_claude

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

chmod +x ./scripts/symlinks.sh
if [[ "$overwrite_dotfiles" == "y" ]]; then
    warning "Deleting existing dotfiles..."
    ./mac/scripts/symlinks.sh --delete --include-files
fi
./mac/scripts/symlinks.sh --create

# Claude Code Configuration
if [[ "$setup_claude" == "y" ]]; then
    printf "\n"
    info "===================="
    info "Claude Code Configuration"
    info "===================="

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    CLAUDE_DIR=".claude"
    BACKUP_DIR="$HOME/.claude-backups"



    info "Script directory: $SCRIPT_DIR"
    info "Claude directory: $CLAUDE_DIR"
    info "Backup directory: $BACKUP_DIR"

    # Detect existing .claude/ directory
    if [ -d "$CLAUDE_DIR" ]; then
        warning "Existing .claude/ directory detected"

        # # Check if already symlinked
        # if [ -L "$CLAUDE_DIR/agents" ]; then
        #     info "Already configured with symlinks"
        #     info "Run './sync.sh status' to view configuration"
        # else
        #     # Backup existing config before symlinking
        #     info "Backing up existing configuration..."
        #     mkdir -p "$BACKUP_DIR"
        #     backup_name="claude-backup-$(date +%Y%m%d-%H%M%S)"
        #     cp -r "$CLAUDE_DIR" "$BACKUP_DIR/$backup_name"
        #     success "Backed up to $BACKUP_DIR/$backup_name"

        #     # Create symlinks
        #     info "Creating symlinks to central Claude config..."
        #     rm -rf "$CLAUDE_DIR/agents" "$CLAUDE_DIR/commands" "$CLAUDE_DIR/skills"
        #     ln -s "$SCRIPT_DIR/$CLAUDE_DIR/agents" "$CLAUDE_DIR/agents"
        #     ln -s "$SCRIPT_DIR/$CLAUDE_DIR/commands" "$CLAUDE_DIR/commands"
        #     ln -s "$SCRIPT_DIR/$CLAUDE_DIR/skills" "$CLAUDE_DIR/skills"

        #     # Create local settings if missing
        #     if [ ! -f "$CLAUDE_DIR/settings.local.json" ]; then
        #         echo '{}' > "$CLAUDE_DIR/settings.local.json"
        #     fi

        #     success "Claude config symlinks created"
        # fi
    else
        info "No .claude/ directory found - use './sync.sh install [template]' in your project"
    fi
fi

success "Dotfiles set up successfully."