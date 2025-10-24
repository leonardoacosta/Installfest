#!/bin/bash
# Unified Logging Library
# Consolidates all logging functions across homelab scripts

# Get script directory to source colors
LOGGING_LIB_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Source colors if not already loaded
if [ -z "$GREEN" ]; then
    source "$LOGGING_LIB_DIR/colors.sh"
fi

# Verbosity control (can be overridden by scripts)
VERBOSE=${VERBOSE:-true}

# ============= Timestamp-based Logging Functions =============
# These include timestamps and are suitable for log files and CI/CD

log() {
    if [ "$VERBOSE" = "true" ]; then
        echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
    fi
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# ============= Simple Status Functions =============
# These use icons and are suitable for interactive terminals

success() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
}

# ============= Compatibility Aliases =============
# Maintain backward compatibility with existing print_* functions from colors.sh
# These are already defined in colors.sh, so we don't redefine them here
# But we document them for reference:
# - print_success() - Already in colors.sh
# - print_error() - Already in colors.sh
# - print_warning() - Already in colors.sh
# - print_info() - Already in colors.sh
# - print_header() - Already in colors.sh

# ============= Status-based Logging (Alternative Style) =============
# Used by some scripts like setup-glance.sh

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Note: print_success, print_error, print_warning already defined in colors.sh
# No need to redefine them here to avoid conflicts

# ============= Logging Modes =============
# Scripts can choose which style to use:
#
# Mode 1: Timestamp logging (deploy scripts, CI/CD)
#   log "Starting deployment"
#   error "Deployment failed"
#   warning "No backup found"
#   info "Pulling images"
#
# Mode 2: Icon-based (interactive scripts)
#   success "Service started"
#   fail "Service failed"
#   print_success "Configuration valid"
#   print_error "Missing file"
#
# Mode 3: Status-based (setup wizards)
#   print_status "Checking prerequisites"
#   print_success "All checks passed"
#   print_warning "Optional dependency missing"
