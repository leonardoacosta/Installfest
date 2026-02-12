#!/usr/bin/env bash
# ani-cli.sh - Install ani-cli (anime streaming from terminal)
# https://github.com/pystardust/ani-cli

set -euo pipefail

. "$DOTFILES/scripts/utils.sh"

REPO_URL="https://github.com/pystardust/ani-cli.git"
SRC_DIR="$HOME/.local/src/ani-cli"

install_ani_cli() {
    info "Installing ani-cli..."

    mkdir -p "$HOME/.local/src"

    (
        if [[ -d "$SRC_DIR" ]]; then
            info "Updating existing installation..."
            cd "$SRC_DIR"
            git pull --ff-only || {
                warning "Git pull failed, attempting fresh clone..."
                cd ..
                rm -rf "$SRC_DIR"
                git clone "$REPO_URL" "$SRC_DIR"
                cd "$SRC_DIR"
            }
        else
            info "Cloning repository..."
            git clone "$REPO_URL" "$SRC_DIR"
            cd "$SRC_DIR"
        fi

        # Install to /opt/homebrew/bin on macOS, ~/.local/bin on Linux
        if [[ "$(uname -s)" == "Darwin" ]]; then
            sudo make install PREFIX=/opt/homebrew
        else
            make install PREFIX="$HOME/.local"
        fi
    )

    if command -v ani-cli &>/dev/null; then
        success "ani-cli installed: $(ani-cli --version 2>/dev/null || echo 'ok')"
    else
        error "Installation failed - ani-cli not found in PATH"
        return 1
    fi
}
