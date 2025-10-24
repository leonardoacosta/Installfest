#!/bin/bash
# Installation Functions

# ============= Installation Functions =============
install_arch() {
    print_header "Arch Linux Docker Installation"

    print_info "Updating system packages..."
    sudo pacman -Syu --noconfirm

    print_info "Installing Docker..."
    sudo pacman -S --noconfirm docker docker-buildx docker-compose
    sudo systemctl enable --now docker
    sudo usermod -aG docker $USER
    print_warning "Log out and back in for Docker group changes to take effect"
    print_success "Docker installed successfully"

    # Install tools
    sudo pacman -S --noconfirm git curl wget htop nano

    # Create directories
    create_directories

    # Setup environment file
    setup_env_file

    # Performance tuning
    print_info "Applying performance tuning..."
    echo 'fs.inotify.max_user_watches=524288' | sudo tee /etc/sysctl.d/99-inotify.conf
    echo 'vm.max_map_count=262144' | sudo tee /etc/sysctl.d/99-elasticsearch.conf
    sudo sysctl --system

    # Configure DNS for AdGuard Home
    configure_dns_for_adguard

    # Configure system settings for services
    configure_service_requirements

    print_success "Installation complete!"
}
