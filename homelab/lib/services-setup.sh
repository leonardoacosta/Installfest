#!/bin/bash
# Service-Specific Setup Functions
# Optional configuration wizards for individual services

# ============= Vaultwarden Setup =============
setup_vaultwarden() {
    print_header "Vaultwarden Password Manager Setup"

    local DATA_DIR="$SCRIPT_DIR/vaultwarden"

    # Step 1: Check/Generate Admin Token
    print_info "Checking admin token configuration..."
    ADMIN_TOKEN=$(grep "^VAULTWARDEN_ADMIN_TOKEN=" "$SCRIPT_DIR/.env" 2>/dev/null | cut -d'=' -f2)

    if [ "$ADMIN_TOKEN" = "CHANGE_ME_TO_SECURE_TOKEN" ] || [ -z "$ADMIN_TOKEN" ]; then
        print_warning "Admin token not configured!"
        print_info "Generating secure admin token..."

        NEW_TOKEN=$(openssl rand -base64 48)

        # Update .env file
        if grep -q "^VAULTWARDEN_ADMIN_TOKEN=" "$SCRIPT_DIR/.env"; then
            sed -i.bak "s|^VAULTWARDEN_ADMIN_TOKEN=.*|VAULTWARDEN_ADMIN_TOKEN=$NEW_TOKEN|" "$SCRIPT_DIR/.env"
        else
            echo "VAULTWARDEN_ADMIN_TOKEN=$NEW_TOKEN" >> "$SCRIPT_DIR/.env"
        fi

        print_success "Admin token generated and saved to .env"
        echo ""
        print_warning "IMPORTANT: Your admin token is:"
        echo "$NEW_TOKEN"
        print_warning "Save this token securely! You'll need it to access /admin"
        echo ""
        read -p "Press Enter to continue..."
    else
        print_success "Admin token already configured"
    fi

    # Step 2: Configure Domain
    echo ""
    print_info "Configuring domain..."
    CURRENT_DOMAIN=$(grep "^VAULTWARDEN_DOMAIN=" "$SCRIPT_DIR/.env" 2>/dev/null | cut -d'=' -f2)
    echo "Current domain: $CURRENT_DOMAIN"
    echo ""
    echo "Options:"
    echo "  1) Keep current domain"
    echo "  2) Use local IP"
    echo "  3) Use custom domain (e.g., https://vault.yourdomain.com)"
    echo ""
    read -p "Choose option [1-3]: " domain_choice

    case $domain_choice in
        2)
            LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
            NEW_DOMAIN="http://${LOCAL_IP}:8222"
            sed -i.bak "s|^VAULTWARDEN_DOMAIN=.*|VAULTWARDEN_DOMAIN=$NEW_DOMAIN|" "$SCRIPT_DIR/.env"
            print_success "Domain set to: $NEW_DOMAIN"
            ;;
        3)
            read -p "Enter your domain (e.g., https://vault.yourdomain.com): " custom_domain
            sed -i.bak "s|^VAULTWARDEN_DOMAIN=.*|VAULTWARDEN_DOMAIN=$custom_domain|" "$SCRIPT_DIR/.env"
            print_success "Domain set to: $custom_domain"
            ;;
        *)
            print_success "Keeping current domain"
            ;;
    esac

    # Step 3: Create Data Directory
    echo ""
    print_info "Creating data directory..."
    mkdir -p "$DATA_DIR"

    PUID=$(grep "^PUID=" "$SCRIPT_DIR/.env" 2>/dev/null | cut -d'=' -f2)
    PGID=$(grep "^PGID=" "$SCRIPT_DIR/.env" 2>/dev/null | cut -d'=' -f2)
    PUID=${PUID:-1000}
    PGID=${PGID:-1000}

    chown -R ${PUID}:${PGID} "$DATA_DIR" 2>/dev/null || true
    chmod 755 "$DATA_DIR"
    print_success "Directory created with permissions UID:GID = ${PUID}:${PGID}"

    # Step 4: Deploy Vaultwarden
    echo ""
    print_info "Deploying Vaultwarden..."

    cd "$SCRIPT_DIR"
    $COMPOSE_CMD pull vaultwarden
    $COMPOSE_CMD up -d vaultwarden

    # Wait for health
    print_info "Waiting for Vaultwarden to become healthy..."
    for i in {1..30}; do
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' vaultwarden 2>/dev/null || echo "starting")

        if [ "$HEALTH" = "healthy" ]; then
            print_success "Vaultwarden is healthy!"
            break
        elif [ "$HEALTH" = "unhealthy" ]; then
            print_error "Vaultwarden is unhealthy. Check logs with: $COMPOSE_CMD logs vaultwarden"
            return 1
        fi

        echo -n "."
        sleep 2
    done

    # Display Summary
    echo ""
    print_success "Vaultwarden Deployed Successfully!"
    echo ""
    LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    ADMIN_TOKEN=$(grep "^VAULTWARDEN_ADMIN_TOKEN=" "$SCRIPT_DIR/.env" 2>/dev/null | cut -d'=' -f2)

    echo "Access Information:"
    echo "  Web Vault:    http://${LOCAL_IP}:8222"
    echo "  Admin Panel:  http://${LOCAL_IP}:8222/admin"
    echo "  Admin Token:  $ADMIN_TOKEN"
    echo ""
    echo "Next Steps:"
    echo "  1. Open web vault and create your first user account"
    echo "  2. After creating accounts, disable signups in .env:"
    echo "     VAULTWARDEN_SIGNUPS_ALLOWED=false"
    echo "  3. Configure SSL with Nginx Proxy Manager"
    echo "  4. Install Bitwarden clients (browser extension, mobile app)"
    echo ""
    print_warning "Security Reminder:"
    print_warning "  1. Use a STRONG master password (20+ characters)"
    print_warning "  2. Enable 2FA after creating your account"
    print_warning "  3. Disable signups after creating accounts"
    print_warning "  4. Set up automated backups"
    echo ""
}

# ============= Glance Dashboard Setup =============
setup_glance() {
    print_header "Glance Dashboard Setup"

    local GLANCE_DIR="$SCRIPT_DIR/glance"
    local GLANCE_CONFIG="$GLANCE_DIR/glance.yml"

    # Step 1: Create Directory
    print_info "Setting up directories..."
    if [ ! -d "$GLANCE_DIR" ]; then
        mkdir -p "$GLANCE_DIR"
        print_success "Created Glance directory"
    else
        print_info "Glance directory already exists"
    fi

    # Set permissions
    PUID=$(grep "^PUID=" "$SCRIPT_DIR/.env" 2>/dev/null | cut -d'=' -f2)
    PGID=$(grep "^PGID=" "$SCRIPT_DIR/.env" 2>/dev/null | cut -d'=' -f2)
    PUID=${PUID:-1000}
    PGID=${PGID:-1000}

    chown -R ${PUID}:${PGID} "$GLANCE_DIR" 2>/dev/null || true

    # Step 2: Verify Config
    print_info "Verifying Glance configuration..."
    if [ ! -f "$GLANCE_CONFIG" ]; then
        print_warning "Glance configuration file not found at $GLANCE_CONFIG"
        print_info "Please ensure glance.yml is in place before deploying"
        read -p "Continue anyway? [y/n]: " continue_setup
        if [[ "$continue_setup" != "y" ]]; then
            return 0
        fi
    else
        print_success "Configuration file found"
    fi

    # Step 3: Deploy Glance
    print_info "Deploying Glance dashboard..."

    cd "$SCRIPT_DIR"

    if docker ps | grep -q "glance"; then
        print_info "Glance is already running"
        read -p "Restart it? [y/n]: " restart
        if [[ "$restart" == "y" ]]; then
            $COMPOSE_CMD restart glance
            print_success "Glance restarted"
        fi
    else
        $COMPOSE_CMD up -d glance

        # Wait for container
        print_info "Waiting for Glance to start..."
        for i in {1..30}; do
            if docker ps | grep -q "glance"; then
                print_success "Glance is running"
                break
            elif [ $i -eq 30 ]; then
                print_warning "Glance startup timed out, check logs"
                break
            fi
            sleep 2
        done
    fi

    # Step 4: Display Access Info
    echo ""
    print_success "Glance Dashboard Deployed!"
    echo ""
    LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    echo "Access Glance at:"
    echo "  - http://localhost:8085"
    echo "  - http://${LOCAL_IP}:8085"
    echo "  - http://glance.local:8085 (if DNS configured)"
    echo ""
    echo "Container IP: 172.20.0.85"
    echo "Network: homelab"
    echo ""
}

# ============= Service Setup Menu =============
service_setup_menu() {
    print_header "Service-Specific Setup"

    echo "Optional service configuration wizards:"
    echo ""
    echo "1) Setup Vaultwarden Password Manager"
    echo "2) Setup Glance Dashboard"
    echo "3) Back to main menu"
    echo ""
    read -p "Choose an option [1-3]: " service_choice

    case $service_choice in
        1)
            setup_vaultwarden
            read -p "Press Enter to continue..."
            service_setup_menu
            ;;
        2)
            setup_glance
            read -p "Press Enter to continue..."
            service_setup_menu
            ;;
        3)
            return 0
            ;;
        *)
            print_error "Invalid option"
            service_setup_menu
            ;;
    esac
}
