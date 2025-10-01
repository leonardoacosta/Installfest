#!/bin/bash

# Get the absolute path of the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

. $SCRIPT_DIR/utils.sh

install_cursor_extensions() {
    info "Installing Cursor extensions..."

    # List of Extensions
    extensions=(
        aaron-bond.better-comments
        csharpier.csharpier-vscode
        dbaeumer.vscode-eslint
        dsznajder.es7-react-js-snippets
        eamodio.gitlens
        esbenp.prettier-vscode
        ms-dotnettools.vscode-dotnet-runtime
        ms-azuretools.vscode-azurefunctions
        ms-azuretools.vscode-azureresourcegroups
        ms-vscode.vscode-typescript-next
        ms-dotnettools.csharp
        oderwat.indent-rainbow
        raillyhugo.one-hunter
        streetsidesoftware.code-spell-checker
        tal7aouy.icons
    )

    for e in "${extensions[@]}"; do
        cursor --install-extension "$e"
    done

    success "Cursor extensions installed successfully"
}

if [ "$(basename "$0")" = "$(basename "${BASH_SOURCE[0]}")" ]; then
    install_cursor_extensions
fi