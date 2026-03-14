#!/usr/bin/env bash
# cmux-workspaces.sh — Launch dev workspaces in cmux over SSH
# Source of truth: ~/dev/if/ghostty/cmux-workspaces.sh
#
# Usage:
#   mux oo tc           # Launch specific projects
#   mux b               # Launch all B&B projects
#   mux c               # Launch all Client projects
#   mux p               # Launch all Personal projects
#   mux --local oo      # Launch locally instead of SSH
#   mux --list          # List available projects

set -euo pipefail

CMUX="${CMUX_CLI:-cmux}"
SSH_HOST="homelab"
REMOTE_DEV="~/dev"
LOCAL_DEV="$HOME/dev"
MODE="ssh"
# Mac's Tailscale IP — injected into remote sessions for cmux-bridge callback
MAC_TAILSCALE_IP="${CMUX_BRIDGE_HOST:-$(tailscale ip -4 2>/dev/null || echo "")}"

# Project registry
declare -A PROJECTS=(
  # B&B (C# projects)
  [fb]="fb"  [sc]="sc"  [ew]="ew"  [ic]="ic"  [ws]="ws"  [se]="se"  [dc]="dc"
  # Clients
  [oo]="oo"  [mv]="mv"  [ct]="ct"  [tl]="tl"  [tc]="tc"  [ss]="ss"
  # Personal
  [cl]="cl"  [cc]=".claude"  [co]="co"  [cw]="cw"  [hl]="hl"  [if]="if"
)

# Category groups (order defines workspace tab order)
GROUP_BB=(fb ws sc ew ic se dc)
GROUP_CLIENT=(oo mv ct tl tc ss)
GROUP_PERSONAL=(cw co cl hl if cc)

# Canonical order (B&B → Clients → Personal, cc always last)
CANONICAL_ORDER=("${GROUP_BB[@]}" "${GROUP_CLIENT[@]}" "${GROUP_PERSONAL[@]}")

# Category colors
COLOR_BB="#F59E0B"       # amber
COLOR_CLIENT="#10B981"   # green
COLOR_PERSONAL="#3B82F6" # blue

declare -A CATEGORIES=(
  # B&B
  [fb]="B&B"  [sc]="B&B"  [ew]="B&B"  [ic]="B&B"  [ws]="B&B"  [se]="B&B"  [dc]="B&B"
  # Clients
  [oo]="Client"  [mv]="Client"  [ct]="Client"  [tl]="Client"  [tc]="Client"  [ss]="Client"
  # Personal
  [cl]="Personal"  [cc]="Personal"  [co]="Personal"  [cw]="Personal"  [hl]="Personal"  [if]="Personal"
)

declare -A FULL_NAMES=(
  # B&B
  [fb]="Fireball"  [ws]="Wholesale"  [sc]="Sales CRM"  [ew]="Enterprise Wiki"
  [ic]="Infrastructure as Code"  [se]="Submission Engine"  [dc]="DOC"
  # Clients
  [oo]="Otaku Odyssey"  [mv]="Modern Visa"  [ct]="Civalent"
  [tl]="Tavern Ledger"  [tc]="Tribal Cities"  [ss]="Styles by Silas"
  # Personal
  [cw]="Central Wholesale"  [co]="Central Orchestrator"  [cl]="Central Leo"
  [hl]="Home Lab"  [if]="Installfest"  [cc]="Central Claude"
)

get_color() {
  case "${CATEGORIES[$1]:-Personal}" in
    "B&B")      echo "$COLOR_BB" ;;
    "Client")   echo "$COLOR_CLIENT" ;;
    "Personal") echo "$COLOR_PERSONAL" ;;
  esac
}

# Layout:
#   ┌──────────────┬──────────────┐
#   │              │  Claude Code  │
#   │   nvim .     ├──────────────┤
#   │              │   lazygit     │
#   └──────────────┴──────────────┘

wait_for_cmux() {
  local retries=10
  while ! $CMUX ping &>/dev/null; do
    retries=$((retries - 1))
    if [[ $retries -le 0 ]]; then
      echo "Error: cmux not responding. Is it running?" >&2
      exit 1
    fi
    sleep 0.5
  done
}

parse_surface() {
  echo "$1" | awk '{for(i=1;i<=NF;i++) if($i ~ /^surface:/) {print $i; exit}}'
}

send_to() {
  local ws="$1" surface="$2" cmd="$3"
  $CMUX send --workspace "$ws" --surface "$surface" "$cmd" >/dev/null 2>&1
  $CMUX send-key --workspace "$ws" --surface "$surface" enter >/dev/null 2>&1
}

# Find workspace UUID by name from list-workspaces output
find_workspace_uuid() {
  local name="$1" ws_list="$2"
  echo "$ws_list" | awk -v name="$name" '
    $0 ~ "  " name "  " || $0 ~ "  " name "$" {
      for(i=1;i<=NF;i++) if($i ~ /^workspace:/) {print $i; exit}
    }'
}

# Connect pane to remote/local and run command
# SSH mode: atomic ssh + command (no sleep race condition)
#   -t  = force TTY for interactive programs (nvim, claude, lazygit)
#   zsh -lc = login shell so PATH/.zshenv is loaded
#   Injects CMUX_WORKSPACE_ID, CMUX_SURFACE_ID, CMUX_BRIDGE_HOST so remote
#   CC hooks can call back to cmux-bridge on the Mac over Tailscale.
# Local mode: cd directly, then run (Ghostty auto-sets CMUX_* env vars)
pane_exec() {
  local ws="$1" surface="$2" full_path="$3" cmd="$4"
  if [[ "$MODE" == "ssh" ]]; then
    local env_exports="export CMUX_WORKSPACE_ID=$ws CMUX_SURFACE_ID=$surface"
    if [[ -n "$MAC_TAILSCALE_IP" ]]; then
      env_exports+=" CMUX_BRIDGE_HOST=$MAC_TAILSCALE_IP"
    fi
    send_to "$ws" "$surface" "ssh -t $SSH_HOST -- zsh -lc '$env_exports && cd $full_path && $cmd'"
  else
    send_to "$ws" "$surface" "cd $full_path && $cmd"
  fi
}

# Resolve project path (handles both ~/dev/X and ~/X patterns)
resolve_path() {
  local project="$1"
  if [[ "$project" == .* ]]; then
    # Home-relative (e.g. .claude → ~/.claude)
    if [[ "$MODE" == "ssh" ]]; then
      echo "~/$project"
    else
      echo "$HOME/$project"
    fi
  else
    # Dev-relative (e.g. oo → ~/dev/oo)
    if [[ "$MODE" == "ssh" ]]; then
      echo "$REMOTE_DEV/$project"
    else
      echo "$LOCAL_DEV/$project"
    fi
  fi
}

# Phase 1: Create workspace shell (sequential — preserves ordering)
create_workspace() {
  local code="$1"
  local project="${PROJECTS[$code]}"
  local category="${CATEGORIES[$code]:-Personal}"
  local color
  color=$(get_color "$code")

  # Skip creation if workspace already exists (reorder phase handles ordering)
  local ws_list
  ws_list=$($CMUX list-workspaces 2>&1)
  if echo "$ws_list" | grep -q "  $code\b\|  $code  "; then
    echo "  ⊘ $code — already open, skipping creation"
    return 1
  fi

  if [[ "$MODE" == "local" ]]; then
    local check_path
    check_path=$(resolve_path "$project")
    if [[ ! -d "$check_path" ]]; then
      echo "  ✗ $code — $check_path not found, skipping" >&2
      return 1
    fi
  fi

  local ws_uuid
  ws_uuid=$($CMUX new-workspace 2>&1 | awk '{print $2}')
  if [[ -z "$ws_uuid" ]]; then
    echo "  ✗ $code — failed to create workspace" >&2
    return 1
  fi
  sleep 0.2

  $CMUX rename-workspace --workspace "$ws_uuid" "$code" >/dev/null 2>&1
  local full_name="${FULL_NAMES[$code]:-$code}"
  $CMUX set-status --workspace "$ws_uuid" category "$full_name" --color "$color" >/dev/null 2>&1

  echo "  ▸ $code created"
  WS_UUIDS[$code]="$ws_uuid"
}

# Wait for a surface to become available (retries)
wait_for_surface() {
  local ws_uuid="$1" retries=5
  local surface=""
  while [[ $retries -gt 0 ]]; do
    surface=$($CMUX list-pane-surfaces --workspace "$ws_uuid" 2>&1 \
      | awk '{for(i=1;i<=NF;i++) if($i ~ /^surface:/) {print $i; exit}}')
    if [[ -n "$surface" ]]; then
      echo "$surface"
      return 0
    fi
    retries=$((retries - 1))
    sleep 0.5
  done
  return 1
}

# Phase 2: Populate panes (parallel — the slow part)
populate_workspace() {
  local code="$1"
  local ws_uuid="$2"
  local project="${PROJECTS[$code]}"
  local full_path
  full_path=$(resolve_path "$project")

  local editor_surface
  editor_surface=$(wait_for_surface "$ws_uuid") || {
    echo "  ✗ $code — no surface found, skipping populate" >&2
    return 1
  }
  sleep 0.2

  # Left pane: nvim
  pane_exec "$ws_uuid" "$editor_surface" "$full_path" "nvim ."
  sleep 0.3

  # Split right: Claude Code
  local split_out
  split_out=$($CMUX new-split right --workspace "$ws_uuid" --surface "$editor_surface" 2>&1)
  local claude_surface
  claude_surface=$(parse_surface "$split_out")
  sleep 0.3

  pane_exec "$ws_uuid" "$claude_surface" "$full_path" "claude"
  sleep 0.3

  # Split down from Claude pane: lazygit
  local split_out2
  split_out2=$($CMUX new-split down --workspace "$ws_uuid" --surface "$claude_surface" 2>&1)
  local git_surface
  git_surface=$(parse_surface "$split_out2")
  sleep 0.3

  pane_exec "$ws_uuid" "$git_surface" "$full_path" "lazygit"

  echo "  ✓ $code ready"
}

# --- Arg parsing ---

targets=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    b)  targets+=("${GROUP_BB[@]}"); shift ;;
    c)  targets+=("${GROUP_CLIENT[@]}"); shift ;;
    p)  targets+=("${GROUP_PERSONAL[@]}"); shift ;;
    --local)  MODE="local"; shift ;;
    --ssh)    MODE="ssh"; shift ;;
    --host)   SSH_HOST="$2"; shift 2 ;;
    --list)
      echo "Available projects:"
      echo ""
      echo "  B&B [b] (amber):"
      for code in "${GROUP_BB[@]}"; do
        echo "    $code  →  dev/$code"
      done
      echo ""
      echo "  Clients [c] (green):"
      for code in "${GROUP_CLIENT[@]}"; do
        echo "    $code  →  dev/$code"
      done
      echo ""
      echo "  Personal [p] (blue):"
      for code in "${GROUP_PERSONAL[@]}"; do
        echo "    $code  →  dev/$code"
      done
      echo ""
      echo "Modes: --ssh (default → $SSH_HOST) | --local"
      exit 0
      ;;
    --help|-h)
      cat <<'HELP'
Usage: mux [OPTIONS] [b|c|p|PROJECT...]

Groups:
  b    B&B (amber)       — fb, sc, ew, ic, ws, se, dc
  c    Clients (green)    — oo, mv, ct, tl, tc, ss
  p    Personal (blue)    — cl, cc, co, cw, hl, if

Options:
  --local        Run locally instead of SSH
  --ssh          SSH to homelab (default)
  --host HOST    SSH to a different host
  --list         List available projects

Examples:
  mux b              # Open all B&B projects
  mux c              # Open all Client projects
  mux oo mv          # Open specific projects
  mux b oo           # B&B group + oo

Layout per workspace:
  ┌──────────────┬──────────────┐
  │   nvim .     │  claude       │
  │              ├──────────────┤
  │              │  lazygit      │
  └──────────────┴──────────────┘
HELP
      exit 0
      ;;
    *) targets+=("$1"); shift ;;
  esac
done

wait_for_cmux

if [[ ${#targets[@]} -eq 0 ]]; then
  echo "Usage: mux [b|c|p|PROJECT...]"
  echo "  b = B&B, c = Clients, p = Personal"
  echo "  Or specify project codes: mux oo tc mv"
  echo "  Run 'mux --list' for all projects"
  exit 0
fi

# Deduplicate targets
declare -A seen
unique_targets=()
for code in "${targets[@]}"; do
  if [[ -z "${seen[$code]:-}" ]]; then
    seen[$code]=1
    unique_targets+=("$code")
  fi
done
targets=("${unique_targets[@]}")

echo "Mode: $MODE (host: ${SSH_HOST:-local})"
echo "Launching ${#targets[@]} workspace(s)..."
echo ""

# --- Phase 1: Create & order workspaces (sequential, fast) ---
declare -A WS_UUIDS
created=()

for code in "${targets[@]}"; do
  if [[ -z "${PROJECTS[$code]:-}" ]]; then
    echo "  ✗ Unknown project: $code (use --list)" >&2
    continue
  fi
  if create_workspace "$code"; then
    created+=("$code")
  fi
done

echo ""

# --- Phase 2: Populate panes (staggered parallel) ---
if [[ ${#created[@]} -gt 0 ]]; then
  echo "Populating ${#created[@]} workspace(s)..."
  pids=()
  for code in "${created[@]}"; do
    populate_workspace "$code" "${WS_UUIDS[$code]}" &
    pids+=($!)
    sleep 0.3  # stagger to avoid overwhelming cmux socket
  done
  wait "${pids[@]}"
fi

# --- Phase 3: Reorder + refresh labels on ALL workspaces ---
echo "Reordering workspaces..."
ws_list=$($CMUX list-workspaces 2>&1)
prev_uuid=""
for code in "${CANONICAL_ORDER[@]}"; do
  local_uuid=$(find_workspace_uuid "$code" "$ws_list")
  if [[ -n "$local_uuid" ]]; then
    # Refresh label and color on every run
    local_name="${FULL_NAMES[$code]:-$code}"
    local_color=$(get_color "$code")
    $CMUX set-status --workspace "$local_uuid" category "$local_name" --color "$local_color" >/dev/null 2>&1
    # Reorder
    if [[ -n "$prev_uuid" ]]; then
      $CMUX reorder-workspace --workspace "$local_uuid" --after "$prev_uuid" >/dev/null 2>&1
    fi
    prev_uuid="$local_uuid"
  fi
done

# Switch to first target workspace
first_uuid=$(find_workspace_uuid "${targets[0]}" "$ws_list")
if [[ -n "$first_uuid" ]]; then
  $CMUX select-workspace --workspace "$first_uuid" >/dev/null 2>&1
fi

echo ""
echo "Done. Use Cmd+1-9 to switch workspaces."
