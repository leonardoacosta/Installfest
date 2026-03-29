#!/bin/sh
# chezmoi run_once: Create ~/.azure-civalent config directory
# for Civalent's personal Azure identity (separate from BB admin).
#
# This only runs once per machine. After creation, run:
#   AZURE_CONFIG_DIR=~/.azure-civalent az login

mkdir -p "$HOME/.azure-civalent"
echo "Created ~/.azure-civalent — run 'AZURE_CONFIG_DIR=~/.azure-civalent az login' to authenticate"
