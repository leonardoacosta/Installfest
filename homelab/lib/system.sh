#!/bin/bash
# System Detection and Environment Setup

# ============= OS Detection =============
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/arch-release ]; then
            OS="Arch Linux"
        elif [ -f /etc/debian_version ]; then
            OS="Debian/Ubuntu"
        elif [ -f /etc/fedora-release ]; then
            OS="Fedora"
        else
            OS="Linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
    else
        OS="Unknown"
    fi
}

setup_environment() {
    # Set XDG_RUNTIME_DIR if not set (for systemctl --user)
    if [ -z "$XDG_RUNTIME_DIR" ]; then
        export XDG_RUNTIME_DIR="/run/user/$(id -u)"
    fi
}
