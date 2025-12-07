#!/bin/bash
# sync.sh - Centralized Claude Code Configuration Sync
# Creates symlinks from satellite projects to central Installfest config

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALLFEST_PATH="${INSTALLFEST_PATH:-$SCRIPT_DIR}"
CLAUDE_DIR=".claude"
BACKUP_DIR="$HOME/.claude-backups"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Available templates
TEMPLATES=("minimal" "t3-expo" "dotnet")

print_usage() {
    echo "Usage: sync.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  install [template]  Install Claude config symlinks (default: minimal)"
    echo "  uninstall           Remove symlinks and restore backups"
    echo "  promote <file>      Copy project file to central repo"
    echo "  status              Show current symlink configuration"
    echo ""
    echo "Templates:"
    for template in "${TEMPLATES[@]}"; do
        echo "  - $template"
    done
    echo ""
    echo "Examples:"
    echo "  cd ~/my-project && $INSTALLFEST_PATH/sync.sh install t3-expo"
    echo "  $INSTALLFEST_PATH/sync.sh promote .claude/skills/custom/my-pattern.md"
    echo "  $INSTALLFEST_PATH/sync.sh status"
}

validate_template() {
    local template="$1"
    for t in "${TEMPLATES[@]}"; do
        if [ "$t" = "$template" ]; then
            return 0
        fi
    done
    return 1
}

backup_existing() {
    local target="$1"
    if [ -e "$target" ] && [ ! -L "$target" ]; then
        local backup_name="$(basename "$target")-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp -r "$target" "$BACKUP_DIR/$backup_name"
        echo -e "${YELLOW}Backed up $target to $BACKUP_DIR/$backup_name${NC}"
    fi
}

create_symlink() {
    local source="$1"
    local target="$2"

    if [ ! -e "$source" ]; then
        echo -e "${RED}Source does not exist: $source${NC}"
        return 1
    fi

    # Remove existing target (file, directory, or symlink)
    if [ -e "$target" ] || [ -L "$target" ]; then
        rm -rf "$target"
    fi

    ln -s "$source" "$target"
    echo -e "${GREEN}✓ Linked $target → $source${NC}"
}

cmd_install() {
    local template="${1:-minimal}"

    if ! validate_template "$template"; then
        echo -e "${RED}Invalid template: $template${NC}"
        echo "Available templates: ${TEMPLATES[*]}"
        exit 1
    fi

    local template_dir="$INSTALLFEST_PATH/$CLAUDE_DIR/templates/$template"
    if [ ! -d "$template_dir" ]; then
        echo -e "${RED}Template directory not found: $template_dir${NC}"
        exit 1
    fi

    echo -e "${BLUE}Installing Claude config with template: $template${NC}"
    echo "Source: $INSTALLFEST_PATH"
    echo ""

    # Create .claude directory if it doesn't exist
    mkdir -p "$CLAUDE_DIR"

    # Backup existing config
    backup_existing "$CLAUDE_DIR/agents"
    backup_existing "$CLAUDE_DIR/commands"
    backup_existing "$CLAUDE_DIR/skills"
    backup_existing "$CLAUDE_DIR/settings.json"
    backup_existing "CLAUDE.md"

    # Create symlinks to central repo
    create_symlink "$INSTALLFEST_PATH/$CLAUDE_DIR/agents" "$CLAUDE_DIR/agents"
    create_symlink "$INSTALLFEST_PATH/$CLAUDE_DIR/commands" "$CLAUDE_DIR/commands"
    create_symlink "$INSTALLFEST_PATH/$CLAUDE_DIR/skills" "$CLAUDE_DIR/skills"

    # Template-specific files
    create_symlink "$template_dir/CLAUDE.md" "CLAUDE.md"

    if [ -f "$template_dir/settings.json" ]; then
        create_symlink "$template_dir/settings.json" "$CLAUDE_DIR/settings.json"
    else
        create_symlink "$INSTALLFEST_PATH/$CLAUDE_DIR/settings.json" "$CLAUDE_DIR/settings.json"
    fi

    # Create local settings file if it doesn't exist
    if [ ! -f "$CLAUDE_DIR/settings.local.json" ]; then
        echo '{}' > "$CLAUDE_DIR/settings.local.json"
        echo -e "${GREEN}✓ Created $CLAUDE_DIR/settings.local.json (local overrides)${NC}"
    fi

    # Add to .gitignore
    if [ -f ".gitignore" ]; then
        if ! grep -q "settings.local.json" .gitignore 2>/dev/null; then
            echo "" >> .gitignore
            echo "# Claude Code local settings" >> .gitignore
            echo ".claude/settings.local.json" >> .gitignore
            echo ".swarm/" >> .gitignore
            echo -e "${GREEN}✓ Added settings.local.json to .gitignore${NC}"
        fi
    fi

    # Store template info
    echo "$template" > "$CLAUDE_DIR/.template"

    echo ""
    echo -e "${GREEN}✅ Installed $template template with symlinks to $INSTALLFEST_PATH${NC}"
    echo ""
    echo "Configuration:"
    echo "  Template: $template"
    echo "  Agents: linked to central repo (10 agents)"
    echo "  Commands: linked to central repo (4 commands)"
    echo "  Skills: linked to central repo (12 skills)"
    echo "  Local overrides: $CLAUDE_DIR/settings.local.json"
}

cmd_uninstall() {
    echo -e "${BLUE}Removing Claude config symlinks...${NC}"

    # Remove symlinks
    local items=("$CLAUDE_DIR/agents" "$CLAUDE_DIR/commands" "$CLAUDE_DIR/skills" "$CLAUDE_DIR/settings.json" "CLAUDE.md")

    for item in "${items[@]}"; do
        if [ -L "$item" ]; then
            rm "$item"
            echo -e "${GREEN}✓ Removed symlink: $item${NC}"
        fi
    done

    # Check for backups to restore
    if [ -d "$BACKUP_DIR" ]; then
        echo ""
        echo "Backups available in $BACKUP_DIR:"
        ls -la "$BACKUP_DIR" 2>/dev/null || echo "  (none)"
        echo ""
        echo "To restore, manually copy files from the backup directory."
    fi

    # Remove template marker
    rm -f "$CLAUDE_DIR/.template"

    echo ""
    echo -e "${GREEN}✅ Symlinks removed. .claude/ is now standalone.${NC}"
    echo "Note: settings.local.json preserved (local settings)"
}

cmd_promote() {
    local file="$1"

    if [ -z "$file" ]; then
        echo -e "${RED}Please specify a file to promote${NC}"
        echo "Usage: sync.sh promote <file>"
        exit 1
    fi

    if [ ! -f "$file" ]; then
        echo -e "${RED}File not found: $file${NC}"
        exit 1
    fi

    # Determine destination based on file path
    local dest_dir=""
    local relative_path=""

    if [[ "$file" == *"/agents/"* ]]; then
        relative_path="${file#*agents/}"
        dest_dir="$INSTALLFEST_PATH/$CLAUDE_DIR/agents"
    elif [[ "$file" == *"/commands/"* ]]; then
        relative_path="${file#*commands/}"
        dest_dir="$INSTALLFEST_PATH/$CLAUDE_DIR/commands"
    elif [[ "$file" == *"/skills/"* ]]; then
        relative_path="${file#*skills/}"
        dest_dir="$INSTALLFEST_PATH/$CLAUDE_DIR/skills"
    else
        echo -e "${RED}File must be in agents/, commands/, or skills/ directory${NC}"
        exit 1
    fi

    local dest_file="$dest_dir/$relative_path"
    local dest_parent="$(dirname "$dest_file")"

    # Create parent directory if needed
    mkdir -p "$dest_parent"

    # Copy file
    cp "$file" "$dest_file"
    echo -e "${GREEN}✓ Promoted $file to $dest_file${NC}"

    echo ""
    echo "To commit this change to the central repo:"
    echo -e "${BLUE}  cd $INSTALLFEST_PATH${NC}"
    echo -e "${BLUE}  git add $CLAUDE_DIR${NC}"
    echo -e "${BLUE}  git commit -m \"promote: $(basename "$file") from $(basename "$(pwd)")\"${NC}"
    echo -e "${BLUE}  git push${NC}"
}

cmd_status() {
    echo -e "${BLUE}Claude Config Status${NC}"
    echo "===================="
    echo ""

    # Check if .claude directory exists
    if [ ! -d "$CLAUDE_DIR" ]; then
        echo -e "${YELLOW}No .claude directory found in current project${NC}"
        echo "Run 'sync.sh install [template]' to set up configuration"
        exit 0
    fi

    # Check template
    if [ -f "$CLAUDE_DIR/.template" ]; then
        local template=$(cat "$CLAUDE_DIR/.template")
        echo "Template: $template"
    else
        echo "Template: (not managed by sync.sh)"
    fi

    echo ""
    echo "Symlink Status:"

    # Check each expected symlink
    local items=("$CLAUDE_DIR/agents" "$CLAUDE_DIR/commands" "$CLAUDE_DIR/skills" "$CLAUDE_DIR/settings.json" "CLAUDE.md")

    for item in "${items[@]}"; do
        if [ -L "$item" ]; then
            local target=$(readlink "$item")
            echo -e "  ${GREEN}✓ $item → $target${NC}"
        elif [ -e "$item" ]; then
            echo -e "  ${YELLOW}○ $item (local file, not symlinked)${NC}"
        else
            echo -e "  ${RED}✗ $item (missing)${NC}"
        fi
    done

    echo ""
    echo "Local Files:"
    if [ -f "$CLAUDE_DIR/settings.local.json" ]; then
        echo -e "  ${GREEN}✓ $CLAUDE_DIR/settings.local.json${NC}"
    else
        echo -e "  ${YELLOW}○ $CLAUDE_DIR/settings.local.json (not created)${NC}"
    fi

    echo ""
    echo "Central Repo: $INSTALLFEST_PATH"
    if [ -d "$INSTALLFEST_PATH/$CLAUDE_DIR" ]; then
        echo -e "  ${GREEN}✓ Found${NC}"
        echo "  Agents: $(ls -1 "$INSTALLFEST_PATH/$CLAUDE_DIR/agents" 2>/dev/null | wc -l | tr -d ' ') files"
        echo "  Commands: $(ls -1 "$INSTALLFEST_PATH/$CLAUDE_DIR/commands" 2>/dev/null | wc -l | tr -d ' ') files"
        echo "  Skills: $(find "$INSTALLFEST_PATH/$CLAUDE_DIR/skills" -name "*.md" 2>/dev/null | wc -l | tr -d ' ') files"
    else
        echo -e "  ${RED}✗ Not found at $INSTALLFEST_PATH${NC}"
    fi
}

# Main command dispatcher
case "${1:-}" in
    install)
        cmd_install "$2"
        ;;
    uninstall)
        cmd_uninstall
        ;;
    promote)
        cmd_promote "$2"
        ;;
    status)
        cmd_status
        ;;
    help|--help|-h)
        print_usage
        ;;
    *)
        print_usage
        exit 1
        ;;
esac
