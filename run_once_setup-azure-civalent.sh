#!/bin/sh
# chezmoi run_once: Create Azure config directories for all identities.
#
# Three isolated Azure CLI configs:
#   ~/.azure-bbadmin   — BB admin (default, proxied through CloudPC)
#   ~/.azure-o365      — O365 Graph API (proxied through CloudPC)
#   ~/.azure-civalent  — Personal Azure (direct, no proxy)
#
# After creation, login to each:
#   az login --as-admin     (or default)
#   az login --as-o365
#   az login --as-personal

mkdir -p "$HOME/.azure-bbadmin"
mkdir -p "$HOME/.azure-o365"
mkdir -p "$HOME/.azure-civalent"

echo "Azure config dirs created:"
echo "  ~/.azure-bbadmin   — az login (default)"
echo "  ~/.azure-o365      — az login --as-o365"
echo "  ~/.azure-civalent  — az login --as-personal"
