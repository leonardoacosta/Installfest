#!/bin/bash

# Claude Configuration Sync Script
# Manages Claude Code configuration across multiple projects

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_REPO="${CONFIG_REPO:-$HOME/dotfiles/claude-config}"
GLOBAL_DIR="$HOME/.claude"
BACKUP_DIR="$HOME/.claude-backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

usage() {
    cat << EOF
Claude Configuration Sync Tool

Usage: $(basename "$0") <command> [options]

Commands:
  install           Install global configuration (symlinks from config repo)
  init [template]   Initialize a new project with template (default: minimal)
  promote <file>    Promote project config to global
  refresh           Refresh all symlinks
  backup            Create backup of current configuration
  diff              Show differences between local and repo
  list-templates    List available project templates
  status            Show current configuration status

Templates:
  minimal           Basic CLAUDE.md with imports
  nextjs-trpc       Full Next.js + tRPC + Drizzle setup
  python            Python project setup

Examples:
  $(basename "$0") install                    # Setup global config
  $(basename "$0") init nextjs-trpc           # Init project with template
  $(basename "$0") promote commands/review.md # Promote command to global

EOF
}

# Check if config repo exists
check_repo() {
    if [ ! -d "$CONFIG_REPO" ]; then
        print_error "Config repo not found at $CONFIG_REPO"
        print_info "Clone your config repo first:"
        print_info "  git clone <your-repo> $CONFIG_REPO"
        exit 1
    fi
}

# Install global configuration
cmd_install() {
    check_repo
    
    print_info "Installing global Claude configuration..."
    
    # Backup existing config
    if [ -d "$GLOBAL_DIR" ] && [ ! -L "$GLOBAL_DIR/CLAUDE.md" ]; then
        print_warning "Backing up existing configuration to $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        cp -r "$GLOBAL_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
    fi
    
    # Create global directory structure
    mkdir -p "$GLOBAL_DIR"/{commands,skills,agents}
    
    # Symlink global files (individual files, not directories)
    local global_source="$CONFIG_REPO/global"
    
    if [ -f "$global_source/CLAUDE.md" ]; then
        ln -sf "$global_source/CLAUDE.md" "$GLOBAL_DIR/CLAUDE.md"
        print_status "Linked CLAUDE.md"
    fi
    
    if [ -f "$global_source/settings.json" ]; then
        ln -sf "$global_source/settings.json" "$GLOBAL_DIR/settings.json"
        print_status "Linked settings.json"
    fi
    
    # Link individual command files
    if [ -d "$global_source/commands" ]; then
        for cmd in "$global_source/commands"/*.md; do
            [ -f "$cmd" ] || continue
            ln -sf "$cmd" "$GLOBAL_DIR/commands/$(basename "$cmd")"
            print_status "Linked command: $(basename "$cmd")"
        done
    fi
    
    # Link individual skill directories
    if [ -d "$global_source/skills" ]; then
        for skill in "$global_source/skills"/*/; do
            [ -d "$skill" ] || continue
            skill_name=$(basename "$skill")
            mkdir -p "$GLOBAL_DIR/skills/$skill_name"
            for file in "$skill"*; do
                [ -f "$file" ] || continue
                ln -sf "$file" "$GLOBAL_DIR/skills/$skill_name/$(basename "$file")"
            done
            print_status "Linked skill: $skill_name"
        done
    fi
    
    # Link individual agent files
    if [ -d "$global_source/agents" ]; then
        for agent in "$global_source/agents"/*.md; do
            [ -f "$agent" ] || continue
            ln -sf "$agent" "$GLOBAL_DIR/agents/$(basename "$agent")"
            print_status "Linked agent: $(basename "$agent")"
        done
    fi
    
    print_status "Global configuration installed!"
}

# Initialize a new project
cmd_init() {
    local template="${1:-minimal}"
    local template_dir="$CONFIG_REPO/templates/$template"
    
    check_repo
    
    if [ ! -d "$template_dir" ]; then
        print_error "Template '$template' not found"
        print_info "Available templates:"
        ls -1 "$CONFIG_REPO/templates/" 2>/dev/null || echo "  (none)"
        exit 1
    fi
    
    print_info "Initializing project with template: $template"
    
    # Create project structure
    mkdir -p .claude/{commands,skills,agents,hooks/scripts}
    
    # Copy template files
    if [ -f "$template_dir/CLAUDE.md" ]; then
        cp "$template_dir/CLAUDE.md" ./CLAUDE.md
        print_status "Created CLAUDE.md"
    fi
    
    if [ -f "$template_dir/settings.json" ]; then
        cp "$template_dir/settings.json" ./.claude/settings.json
        print_status "Created .claude/settings.json"
    fi
    
    # Copy template commands
    if [ -d "$template_dir/commands" ]; then
        cp -r "$template_dir/commands"/* ./.claude/commands/ 2>/dev/null || true
        print_status "Copied template commands"
    fi
    
    # Copy template skills
    if [ -d "$template_dir/skills" ]; then
        cp -r "$template_dir/skills"/* ./.claude/skills/ 2>/dev/null || true
        print_status "Copied template skills"
    fi
    
    # Create gitignore entries
    if ! grep -q "settings.local.json" .gitignore 2>/dev/null; then
        echo -e "\n# Claude Code local settings\n.claude/settings.local.json\n.swarm/" >> .gitignore
        print_status "Updated .gitignore"
    fi
    
    # Create empty local settings
    echo '{}' > .claude/settings.local.json
    print_status "Created .claude/settings.local.json (gitignored)"
    
    print_status "Project initialized with '$template' template!"
    print_info "Next steps:"
    print_info "  1. Review and customize CLAUDE.md"
    print_info "  2. Add project-specific commands to .claude/commands/"
    print_info "  3. Run 'claude' to start coding"
}

# Promote project config to global
cmd_promote() {
    local file="$1"
    
    check_repo
    
    if [ -z "$file" ]; then
        print_error "Usage: $(basename "$0") promote <file>"
        print_info "Example: $(basename "$0") promote .claude/commands/review.md"
        exit 1
    fi
    
    if [ ! -f ".claude/$file" ] && [ ! -f "$file" ]; then
        print_error "File not found: $file"
        exit 1
    fi
    
    local source_file
    if [ -f ".claude/$file" ]; then
        source_file=".claude/$file"
    else
        source_file="$file"
    fi
    
    # Determine destination
    local dest_dir
    local base_name=$(basename "$source_file")
    
    if [[ "$source_file" == *"/commands/"* ]]; then
        dest_dir="$CONFIG_REPO/global/commands"
    elif [[ "$source_file" == *"/skills/"* ]]; then
        # For skills, get the skill directory name
        local skill_name=$(echo "$source_file" | sed 's/.*skills\/\([^\/]*\).*/\1/')
        dest_dir="$CONFIG_REPO/global/skills/$skill_name"
        mkdir -p "$dest_dir"
    elif [[ "$source_file" == *"/agents/"* ]]; then
        dest_dir="$CONFIG_REPO/global/agents"
    else
        print_error "Unknown file type. Must be in commands/, skills/, or agents/"
        exit 1
    fi
    
    mkdir -p "$dest_dir"
    cp "$source_file" "$dest_dir/$base_name"
    
    print_status "Promoted $source_file to $dest_dir/$base_name"
    
    # Offer to commit
    print_info "Don't forget to commit and push:"
    print_info "  cd $CONFIG_REPO"
    print_info "  git add -A"
    print_info "  git commit -m 'promote: $base_name from $(basename $(pwd))'"
    print_info "  git push"
}

# Refresh all symlinks
cmd_refresh() {
    print_info "Refreshing global configuration symlinks..."
    cmd_install
}

# Create backup
cmd_backup() {
    if [ ! -d "$GLOBAL_DIR" ]; then
        print_warning "No configuration to backup"
        exit 0
    fi
    
    mkdir -p "$BACKUP_DIR"
    cp -rL "$GLOBAL_DIR"/* "$BACKUP_DIR/"
    print_status "Backup created at $BACKUP_DIR"
}

# Show diff between local and repo
cmd_diff() {
    check_repo
    
    print_info "Comparing local configuration with repository..."
    
    local has_diff=false
    
    # Compare CLAUDE.md
    if [ -f "$GLOBAL_DIR/CLAUDE.md" ] && [ -f "$CONFIG_REPO/global/CLAUDE.md" ]; then
        if ! diff -q "$GLOBAL_DIR/CLAUDE.md" "$CONFIG_REPO/global/CLAUDE.md" > /dev/null 2>&1; then
            print_warning "CLAUDE.md differs"
            has_diff=true
        fi
    fi
    
    # Compare settings.json
    if [ -f "$GLOBAL_DIR/settings.json" ] && [ -f "$CONFIG_REPO/global/settings.json" ]; then
        if ! diff -q "$GLOBAL_DIR/settings.json" "$CONFIG_REPO/global/settings.json" > /dev/null 2>&1; then
            print_warning "settings.json differs"
            has_diff=true
        fi
    fi
    
    if [ "$has_diff" = false ]; then
        print_status "All configurations in sync"
    fi
}

# List available templates
cmd_list_templates() {
    check_repo
    
    print_info "Available templates:"
    
    if [ -d "$CONFIG_REPO/templates" ]; then
        for template in "$CONFIG_REPO/templates"/*/; do
            [ -d "$template" ] || continue
            local name=$(basename "$template")
            local desc=""
            if [ -f "$template/README.md" ]; then
                desc=$(head -1 "$template/README.md" | sed 's/^#* *//')
            fi
            echo "  $name - $desc"
        done
    else
        print_warning "No templates directory found"
    fi
}

# Show current status
cmd_status() {
    print_info "Claude Configuration Status"
    echo ""
    
    # Check global config
    echo "Global Configuration ($GLOBAL_DIR):"
    if [ -f "$GLOBAL_DIR/CLAUDE.md" ]; then
        if [ -L "$GLOBAL_DIR/CLAUDE.md" ]; then
            print_status "CLAUDE.md (symlinked)"
        else
            print_warning "CLAUDE.md (local file)"
        fi
    else
        print_error "CLAUDE.md missing"
    fi
    
    if [ -f "$GLOBAL_DIR/settings.json" ]; then
        print_status "settings.json"
    fi
    
    # Count commands
    local cmd_count=$(ls -1 "$GLOBAL_DIR/commands"/*.md 2>/dev/null | wc -l)
    print_info "Commands: $cmd_count"
    
    # Count skills
    local skill_count=$(ls -1d "$GLOBAL_DIR/skills"/*/ 2>/dev/null | wc -l)
    print_info "Skills: $skill_count"
    
    # Count agents
    local agent_count=$(ls -1 "$GLOBAL_DIR/agents"/*.md 2>/dev/null | wc -l)
    print_info "Agents: $agent_count"
    
    echo ""
    
    # Check project config if in a project
    if [ -f "./CLAUDE.md" ] || [ -d "./.claude" ]; then
        echo "Project Configuration ($(pwd)):"
        [ -f "./CLAUDE.md" ] && print_status "CLAUDE.md"
        [ -f "./.claude/settings.json" ] && print_status ".claude/settings.json"
        
        local proj_cmd=$(ls -1 "./.claude/commands"/*.md 2>/dev/null | wc -l)
        print_info "Project commands: $proj_cmd"
        
        local proj_skill=$(ls -1d "./.claude/skills"/*/ 2>/dev/null | wc -l)
        print_info "Project skills: $proj_skill"
    fi
}

# Main command router
case "${1:-}" in
    install)      cmd_install ;;
    init)         cmd_init "$2" ;;
    promote)      cmd_promote "$2" ;;
    refresh)      cmd_refresh ;;
    backup)       cmd_backup ;;
    diff)         cmd_diff ;;
    list-templates) cmd_list_templates ;;
    status)       cmd_status ;;
    -h|--help|help|"") usage ;;
    *)
        print_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac
