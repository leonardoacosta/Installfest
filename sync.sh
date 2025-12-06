#!/bin/bash
set -e

CONFIG_REPO="$HOME/Personal/Installfest"
GLOBAL_DIR="$HOME/.claude"

case "${1:-}" in
  # Install the global config
  install)
    mkdir -p "$GLOBAL_DIR"/{commands,skills,agents}
    ln -sf "$CONFIG_REPO/.claude/CLAUDE.md" "$GLOBAL_DIR/CLAUDE.md"
    ln -sf "$CONFIG_REPO/.claude/settings.json" "$GLOBAL_DIR/settings.json"
    for f in "$CONFIG_REPO/.claude/commands"/*.md; do
      [ -f "$f" ] && ln -sf "$f" "$.claude/commands/"
    done
    echo "✓ Global config installed"
    ;;

  # Initialize a new project
  init)
    template="${2:-minimal}"
    mkdir -p .claude/{commands,skills,agents}
    cp "$CONFIG_REPO/templates/$template/CLAUDE.md" ./CLAUDE.md 2>/dev/null || echo "# Project\n\n@~/.claude/CLAUDE.md" > ./CLAUDE.md
    cp "$CONFIG_REPO/templates/$template/settings.json" ./.claude/settings.json 2>/dev/null || echo "{}" > ./.claude/settings.json
    echo "{}" > ./.claude/settings.local.json
    echo -e ".claude/settings.local.json\n.swarm/" >> .gitignore
    echo "✓ Project initialized"
    ;;
  
  # Promote a file to the global config
  promote)
    file="$2"
    dest="$CONFIG_REPO/.claude/$(dirname $file)"
    mkdir -p "$dest"
    cp ".claude/$file" "$dest/"
    echo "✓ Promoted to $dest"
    ;;
  
  # Show usage
  *)
    echo "Usage: $0 {install|init [template]|promote <file>}"
    ;;
esac
