#!/bin/zsh
# mux-remote.sh — Remote-invokable wrapper for cmux-workspaces
# Called via Apple Shortcuts, NFC, or SSH
# Uses zsh for Shortcuts compatibility (/bin/bash on macOS is 3.2)
#
# Usage:
#   ~/dev/if/ghostty/mux-remote.sh         # Interactive picker
#   ~/dev/if/ghostty/mux-remote.sh b       # Launch B&B
#   ~/dev/if/ghostty/mux-remote.sh c       # Launch Clients
#   ~/dev/if/ghostty/mux-remote.sh p       # Launch Personal
#   ~/dev/if/ghostty/mux-remote.sh b c p   # Launch everything

set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
SCRIPT=~/dev/if/ghostty/cmux-workspaces.sh

# Verify cmux is running
if ! cmux ping >/dev/null 2>&1; then
  osascript -e 'display notification "cmux is not running" with title "Mux"' 2>/dev/null
  echo "ERROR: cmux not running" >&2
  exit 1
fi

# No args → show interactive picker
if [[ $# -eq 0 ]]; then
  choice=$(osascript <<'EOF'
    set options to {"🟡 B&B", "🟢 Clients", "🔵 Personal", "⚪ All", "🔧 Pick Projects..."}
    set picked to choose from list options with title "Mux Workspaces" with prompt "What do you want to open?" with multiple selections allowed
    if picked is false then return "cancel"
    set output to ""
    repeat with anItem in picked
      set output to output & anItem & linefeed
    end repeat
    return output
EOF
  )

  [[ "$choice" == "cancel" ]] && exit 0

  args=()
  while IFS= read -r line; do
    case "$line" in
      *"B&B"*)      args+=(b) ;;
      *Clients*)    args+=(c) ;;
      *Personal*)   args+=(p) ;;
      *All*)        args+=(b c p) ;;
      *Pick*)
        projects=$(osascript <<'PROJ'
          set opts to { ¬
            "🟡 B&B ────────────", ¬
            "  ├ fb  Fireball", ¬
            "  ├ ws  Wholesale", ¬
            "  ├ sc  Sales CRM", ¬
            "  ├ ew  Enterprise Wiki", ¬
            "  ├ ic  Infra as Code", ¬
            "  ├ se  Submission Engine", ¬
            "  └ dc  DOC", ¬
            "🟢 Clients ─────────", ¬
            "  ├ oo  Otaku Odyssey", ¬
            "  ├ mv  Modern Visa", ¬
            "  ├ ct  Civalent", ¬
            "  ├ tl  Tavern Ledger", ¬
            "  ├ tc  Tribal Cities", ¬
            "  └ ss  Styles by Silas", ¬
            "🔵 Personal ────────", ¬
            "  ├ cw  Central Wholesale", ¬
            "  ├ co  Central Orchestrator", ¬
            "  ├ cl  Central Leo", ¬
            "  ├ hl  Home Lab", ¬
            "  ├ if  Installfest", ¬
            "  └ cc  Central Claude" ¬
          }
          set picked to choose from list opts with title "Pick Projects" with prompt "Select workspaces to open:" with multiple selections allowed
          if picked is false then return "cancel"
          set output to ""
          repeat with anItem in picked
            -- skip group headers
            if anItem does not start with "  " then
            else
              set code to text 5 thru 6 of anItem
              set output to output & code & linefeed
            end if
          end repeat
          return output
PROJ
        )
        [[ "$projects" == "cancel" ]] && exit 0
        while IFS= read -r proj; do
          [[ -n "$proj" ]] && args+=("$proj")
        done <<< "$projects"
        ;;
    esac
  done <<< "$choice"

  if [[ ${#args[@]} -eq 0 ]]; then
    exit 0
  fi

  exec "$SCRIPT" "${args[@]}"
fi

# Args provided → pass through directly
exec "$SCRIPT" "$@"
