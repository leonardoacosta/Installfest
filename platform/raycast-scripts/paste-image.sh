#!/usr/bin/env bash
# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Paste Image to Active Project
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 📡
# @raycast.packageName Project Image Paste
# @raycast.description Save Mac clipboard image into the active project (Zed or Ghostty), inject path into terminal or copy markdown reference.
# @raycast.author leonardoacosta

# ---------------------------------------------------------------------------
# Dispatcher: routes on frontmost macOS app.
#   - Zed         → SQLite workspace lookup → local cp OR remote scp
#   - Ghostty     → process tree walk:
#                     local + tmux            → tmux pane CWD
#                     local, no tmux          → lsof shell CWD
#                     SSH + remote tmux       → tmux query over ssh
#                     SSH + no remote tmux    → source-port match → ssh CWD
# Path injection: tmux send-keys when a tmux server is reachable, else
# clipboard + Cmd+V via System Events. Never appends Enter.
# ---------------------------------------------------------------------------

set -uo pipefail

# ---------------------------------------------------------------------------
# Logging: tee everything to /tmp/paste-image.log for post-mortem debugging.
# Set PASTE_IMAGE_DEBUG=1 to also echo to terminal.
# ---------------------------------------------------------------------------
LOG_FILE="${PASTE_IMAGE_LOG:-/tmp/paste-image.log}"
exec > >(tee -a "$LOG_FILE") 2>&1
echo "===== $(date '+%Y-%m-%d %H:%M:%S') $$ ====="

ZED_DB="$HOME/Library/Application Support/Zed/db/0-stable-db.sqlite"
TS=$(date +%Y%m%d-%H%M%S)
TMP_PNG="/tmp/paste-image-${TS}.png"
DEST_REL="docs/screenshots/img-${TS}.png"

# default ssh defaults from projects.toml — homelab tail296462 mesh
DEFAULT_SSH_USER="nyaptor"
DEFAULT_SSH_HOST="homelab"

# banner: macOS notification + nexus TTS, with kind-specific subtitle/sound.
#   $1 = start | success | fail
#   $2 = message body (path, reason, etc.)
banner() {
  local kind="$1" msg="$2"
  local subtitle="" sound=""
  case "$kind" in
    start)   subtitle="Starting";   sound=""                          ;;
    success) subtitle="✓ Succeeded"; sound='sound name "Glass"'       ;;
    fail)    subtitle="✗ Failed";    sound='sound name "Funk"'        ;;
  esac
  # Escape quotes for AppleScript
  local safe_msg
  safe_msg=$(printf '%s' "$msg" | sed 's/"/\\"/g')
  osascript -e "display notification \"$safe_msg\" with title \"Paste Image\" subtitle \"$subtitle\" $sound" 2>/dev/null || true
  echo '{"event":"notification","message":"'"$msg"'"}' \
    | socat - UNIX-CONNECT:/tmp/nexus-agent.sock 2>/dev/null || true
  echo "[banner $kind] $msg"
}

die() {
  banner fail "$1"
  echo "✗ $1" >&2
  rm -f "$TMP_PNG"
  exit 1
}

# ---------------------------------------------------------------------------
# Step 1: snapshot clipboard image
# ---------------------------------------------------------------------------
command -v pngpaste >/dev/null || die "pngpaste missing — brew install pngpaste"
pngpaste "$TMP_PNG" 2>/dev/null || die "no image on clipboard"

# ---------------------------------------------------------------------------
# Step 2: determine frontmost app (lowercase for case-insensitive matching)
# ---------------------------------------------------------------------------
FRONTMOST_RAW=$(osascript -e 'tell application "System Events" to name of first application process whose frontmost is true' 2>/dev/null || echo "")
FRONTMOST=$(echo "$FRONTMOST_RAW" | tr '[:upper:]' '[:lower:]')
echo "frontmost: $FRONTMOST_RAW (matched as: $FRONTMOST)"
banner start "Detected: ${FRONTMOST_RAW:-unknown}"

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

# walk up from a path until we find a .git/, fallback to original
project_root_for() {
  local p="$1"
  while [[ "$p" != "/" && "$p" != "" && ! -d "$p/.git" ]]; do
    p=$(dirname "$p")
  done
  if [[ "$p" == "/" || "$p" == "" ]]; then
    echo "$1"
  else
    echo "$p"
  fi
}

# inject path into a local tmux session (no Enter)
inject_local_tmux() {
  local pane="$1" path="$2"
  tmux send-keys -t "$pane" "$path"
}

# inject path into a remote tmux session over ssh (no Enter)
inject_remote_tmux() {
  local target="$1" pane="$2" path="$3"
  ssh "$target" "tmux send-keys -t '$pane' '$path'"
}

# fallback: stage path on clipboard + simulate Cmd+V into target app.
# Re-activates the originally-frontmost app first (handles Raycast / focus stealers).
inject_via_paste() {
  local path="$1"
  echo -n "$path" | pbcopy
  if [[ -n "${FRONTMOST_RAW:-}" ]]; then
    osascript -e "tell application \"System Events\" to set frontmost of process \"$FRONTMOST_RAW\" to true" 2>/dev/null || true
    # tiny settle delay so the focus change reaches the WindowServer before keystroke
    sleep 0.08
  fi
  osascript -e 'tell application "System Events" to keystroke "v" using command down' 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# Branch A: Zed
# ---------------------------------------------------------------------------
handle_zed() {
  [[ -f "$ZED_DB" ]] || die "Zed SQLite not found at $ZED_DB"

  local ws_row ssh_id local_paths
  ws_row=$(sqlite3 -separator $'\t' "$ZED_DB" \
    "SELECT COALESCE(ssh_project_id,''), COALESCE(local_paths,'')
     FROM workspaces
     WHERE window_id IS NOT NULL
     ORDER BY timestamp DESC LIMIT 1;" 2>/dev/null) || die "could not read Zed DB"

  ssh_id=$(echo "$ws_row" | cut -f1)
  local_paths=$(echo "$ws_row" | cut -f2)

  local project_root ssh_target
  if [[ -n "$ssh_id" ]]; then
    local host user paths_blob
    IFS=$'\t' read -r host user paths_blob < <(sqlite3 -separator $'\t' "$ZED_DB" \
      "SELECT host, COALESCE(user,''), paths FROM ssh_projects WHERE id=$ssh_id;")
    project_root=$(echo "$paths_blob" | python3 -c "import sys,json; v=json.loads(sys.stdin.read() or '[]'); print(v[0] if v else '')")
    [[ -z "$project_root" ]] && die "Zed SSH project has no path"
    ssh_target="${user:+${user}@}${host}"
  else
    project_root=$(echo "$local_paths" | python3 -c "import sys,json; v=json.loads(sys.stdin.read() or '[]'); print(v[0] if v else '')")
    [[ -z "$project_root" ]] && die "Zed workspace has no local path"
    ssh_target=""
  fi

  local dest_rel dest_full
  dest_rel="$DEST_REL"
  dest_full="${project_root}/${dest_rel}"

  if [[ -n "$ssh_target" ]]; then
    ssh "$ssh_target" "mkdir -p '$(dirname "$dest_full")'" || die "ssh mkdir failed"
    scp -q "$TMP_PNG" "${ssh_target}:${dest_full}" || die "scp failed"
  else
    mkdir -p "$(dirname "$dest_full")"
    cp "$TMP_PNG" "$dest_full"
  fi

  # Zed: insert markdown reference via clipboard+paste (no terminal)
  echo -n "![image](${dest_rel})" | pbcopy
  osascript -e 'tell application "System Events" to keystroke "v" using command down' 2>/dev/null || true

  banner success "Zed → ${dest_rel}"
}

# ---------------------------------------------------------------------------
# Branch B: Ghostty
#
# Process tree on macOS: Ghostty → login (per pane) → zsh (the actual shell).
# We walk two levels deep, then pick the shell whose tty was most recently
# written to (mtime) — that's the pane the user just looked at / typed in.
# ---------------------------------------------------------------------------
handle_ghostty() {
  local ghostty_pid
  ghostty_pid=$(pgrep -f "Ghostty.app/Contents/MacOS/ghostty" 2>/dev/null | head -1)
  if [[ -z "$ghostty_pid" ]]; then
    ghostty_pid=$(pgrep -x ghostty | head -1)
  fi
  [[ -z "$ghostty_pid" ]] && die "Ghostty process not found"
  echo "ghostty pid: $ghostty_pid"

  # Walk ghostty → login → shell, collect all shell PIDs
  local shells=()
  local login_pid shell_pid cmd
  for login_pid in $(pgrep -P "$ghostty_pid" 2>/dev/null); do
    for shell_pid in $(pgrep -P "$login_pid" 2>/dev/null); do
      cmd=$(ps -o comm= -p "$shell_pid" 2>/dev/null | tr -d ' ' | sed 's|^-||')
      case "$cmd" in
        */zsh|*/bash|*/fish|zsh|bash|fish) shells+=("$shell_pid") ;;
      esac
    done
  done

  [[ ${#shells[@]} -eq 0 ]] && die "no shells found beneath Ghostty"
  echo "candidate shells: ${shells[*]}"

  # Pick the shell whose tty has the most recent mtime
  local best_pid="" best_mtime=0
  local pid tty mtime
  for pid in "${shells[@]}"; do
    tty=$(ps -o tty= -p "$pid" 2>/dev/null | tr -d ' ')
    [[ "$tty" != /dev/* ]] && tty="/dev/$tty"
    mtime=$(stat -f '%m' "$tty" 2>/dev/null || echo 0)
    echo "  candidate pid=$pid tty=$tty mtime=$mtime"
    if [[ "$mtime" -gt "$best_mtime" ]]; then
      best_mtime=$mtime
      best_pid=$pid
    fi
  done

  [[ -z "$best_pid" ]] && die "could not determine active shell by tty mtime"
  echo "selected active shell: $best_pid (tty mtime=$best_mtime)"

  local active_shell="$best_pid"

  # Detect ssh as direct child of the active shell
  local ssh_pid
  ssh_pid=$(pgrep -P "$active_shell" 2>/dev/null | while read -r p; do
    [[ -z "$p" ]] && continue
    ps -o pid=,command= -p "$p" 2>/dev/null
  done | awk '/^ *[0-9]+ +ssh / {print $1; exit}')

  if [[ -n "$ssh_pid" ]]; then
    echo "detected ssh subprocess: $ssh_pid"
    handle_ghostty_ssh "$ssh_pid"
  else
    handle_ghostty_local "$active_shell"
  fi
}

handle_ghostty_local() {
  local shell_pid="$1"

  # detect a tmux client launched from the shell
  local tmux_pid client_tty
  tmux_pid=$(pgrep -P "$shell_pid" | while read -r pid; do
    [[ -z "$pid" ]] && continue
    ps -o pid=,command= -p "$pid"
  done | awk '/tmux/ && !/server/ {print $1; exit}')

  local cwd pane=""
  if [[ -n "$tmux_pid" ]]; then
    client_tty=$(ps -o tty= -p "$tmux_pid" | tr -d ' ')
    [[ "$client_tty" != /dev/* ]] && client_tty="/dev/$client_tty"
    read -r cwd pane < <(tmux list-clients -F '#{client_tty}|#{pane_current_path}|#{pane_id}' 2>/dev/null \
      | awk -F'|' -v t="$client_tty" '$1==t {print $2" "$3; exit}')
  else
    cwd=$(lsof -a -d cwd -p "$shell_pid" -Fn 2>/dev/null | awk '/^n/ {print substr($0,2); exit}')
  fi

  [[ -z "$cwd" ]] && die "could not resolve local Ghostty CWD"

  local project_root dest_full
  project_root=$(project_root_for "$cwd")
  dest_full="${project_root}/${DEST_REL}"
  mkdir -p "$(dirname "$dest_full")"
  cp "$TMP_PNG" "$dest_full"

  if [[ -n "$pane" ]]; then
    inject_local_tmux "$pane" "$dest_full"
  else
    inject_via_paste "$dest_full"
  fi

  banner success "Ghostty local → ${DEST_REL}"
}

handle_ghostty_ssh() {
  local ssh_pid="$1"
  local ssh_cmd
  ssh_cmd=$(ps -o command= -p "$ssh_pid")
  echo "ssh cmd: $ssh_cmd"

  # Extract source port AND destination IP from the same lsof call.
  # CRITICAL: -a is needed to AND -i and -p together (lsof default is OR).
  # Without -a, lsof returns all network sockets OR all FDs of this PID.
  #
  # The address pair is the field containing "->". Last field is "(ESTABLISHED)"
  # state token, second-to-last is the address — but field count can vary, so
  # scan backwards for the "->" pattern instead of trusting positions.
  local conn src_port dest_ip
  conn=$(lsof -a -i -P -n -p "$ssh_pid" 2>/dev/null \
    | awk '/ESTABLISHED/ { for (i=NF; i>=1; i--) if ($i ~ /->/) { print $i; exit } }')
  [[ -z "$conn" ]] && die "could not read ssh TCP connection"
  src_port=$(echo "$conn" | awk -F'->' '{print $1}' | awk -F: '{print $NF}')
  dest_ip=$(echo "$conn" | awk -F'->' '{print $2}' | awk -F: '{print $1}')
  echo "ssh conn: src_port=$src_port dest_ip=$dest_ip"
  [[ -z "$src_port" || -z "$dest_ip" ]] && die "could not parse ssh connection: $conn"

  # Resolve host: try last positional arg of ssh command, fall back to dest_ip.
  # Last-arg works for `ssh ... homelab` (typical interactive case).
  # If last arg looks like an env var (ALL_CAPS or contains =) or doesn't look
  # like a hostname, fall back to the IP — always works with key auth.
  local host
  host=$(echo "$ssh_cmd" | awk '{print $NF}')
  if [[ "$host" == *=* ]] || [[ "$host" =~ ^[A-Z_]+$ ]] || [[ ! "$host" =~ [a-z0-9] ]]; then
    echo "last-arg looked like option-value ($host), falling back to dest IP"
    host="$dest_ip"
  fi
  echo "ssh host resolved: $host"

  # 3) on the remote: try tmux first, then source-port match
  #    Heredoc lives in a tempfile to avoid macOS bash 3.2's $()/heredoc bug.
  # Returns: TYPE|CWD|PANE   (PANE blank when not tmux)
  local remote_script="/tmp/paste-image-remote-$$.sh"
  cat > "$remote_script" <<'REMOTE_SCRIPT'
# Remote-side resolver — runs on homelab via `ssh bash -s -- $src_port`.
# Logs every step to /tmp/paste-image-remote.log so failures are debuggable
# from the Mac via `ssh homelab cat /tmp/paste-image-remote.log`.
#
# Strategy (privilege-free, no sudo needed):
#   1. If tmux is running → use most-recently-active client's pane CWD
#   2. Else `who -u` → find session marked idle="." → tty → shell on tty → /proc cwd
#
# We previously tried source-port matching via `ss -tnp`, but the kernel hides
# pid info on inbound sshd-session sockets from non-root users. The current
# strategy works without sudo and identifies the user's active pane correctly
# in the common case (most-recent activity).
set -uo pipefail

SRC_PORT="${1:-}"   # kept for forward-compat / sudo-ss fallback; unused here
LOG="/tmp/paste-image-remote.log"
exec 2> >(tee -a "$LOG" >&2)
log() { echo "[$(date '+%H:%M:%S')] $*" >> "$LOG"; }
log "===== remote run pid=$$ src_port=$SRC_PORT user=$USER ====="

# ----- Path 1: tmux (if server is running) -----
if tmux list-sessions >/dev/null 2>&1; then
  log "tmux server present, querying clients"
  CLIENT_LINE=$(tmux list-clients -F '#{client_activity}|#{client_tty}|#{session_name}|#{pane_current_path}|#{pane_id}' 2>/dev/null \
    | sort -t'|' -k1,1 -rn | head -1)
  log "active client: $CLIENT_LINE"
  if [[ -n "$CLIENT_LINE" ]]; then
    CWD=$(echo "$CLIENT_LINE" | awk -F'|' '{print $4}')
    PANE=$(echo "$CLIENT_LINE" | awk -F'|' '{print $5}')
    if [[ -n "$CWD" ]]; then
      printf 'tmux|%s|%s\n' "$CWD" "$PANE"
      exit 0
    fi
  fi
  log "tmux query produced no usable client; falling through to who -u"
fi

# ----- Path 2: who -u (active login session) -----
# who -u columns: USER TTY DATE TIME IDLE PID HOST
# IDLE column is "." for currently-active sessions.
ACTIVE_TTY=$(who -u 2>/dev/null \
  | awk -v user="$USER" '$1 == user && $5 == "." {print $2; exit}')
log "who_u active_tty=$ACTIVE_TTY"

if [[ -z "$ACTIVE_TTY" ]]; then
  # No session marked active right now — pick most recent login by start time
  ACTIVE_TTY=$(who -u 2>/dev/null \
    | awk -v user="$USER" '$1 == user {print}' \
    | sort -k 3,4 -r | head -1 | awk '{print $2}')
  log "fallback most-recent_tty=$ACTIVE_TTY"
fi

if [[ -z "$ACTIVE_TTY" ]]; then
  log "FATAL: no $USER session in who -u"
  printf 'unknown||\n'
  exit 0
fi

# Find the user's interactive shell on that tty.
# `ps -t pts/N -o ...` lists all processes on that tty; we want zsh/bash/fish.
SHELL_PID=""
for pid in $(ps -t "$ACTIVE_TTY" -o pid= 2>/dev/null); do
  cmd=$(ps -o comm= -p "$pid" 2>/dev/null | tr -d ' ' | sed 's|^-||')
  log "  candidate pid=$pid cmd=$cmd"
  case "$cmd" in
    zsh|bash|fish) SHELL_PID="$pid"; break ;;
  esac
done
log "shell_pid=$SHELL_PID"

if [[ -z "$SHELL_PID" ]]; then
  log "FATAL: no interactive shell on $ACTIVE_TTY"
  printf 'unknown||\n'
  exit 0
fi

CWD=$(readlink "/proc/$SHELL_PID/cwd" 2>/dev/null)
log "shell cwd=$CWD"

if [[ -n "$CWD" ]]; then
  printf 'shell|%s|\n' "$CWD"
  exit 0
fi

log "FATAL: could not read cwd of pid $SHELL_PID"
printf 'unknown||\n'
REMOTE_SCRIPT

  local remote_info
  remote_info=$(ssh "$host" bash -s -- "$src_port" < "$remote_script")
  rm -f "$remote_script"

  local kind cwd pane
  IFS='|' read -r kind cwd pane <<< "$remote_info"
  [[ "$kind" == "unknown" || -z "$cwd" ]] && die "could not resolve remote CWD on $host"

  # walk up to .git/ on the remote
  local project_root
  project_root=$(ssh "$host" "p='$cwd'; while [[ \"\$p\" != / && ! -d \"\$p/.git\" ]]; do p=\$(dirname \"\$p\"); done; [[ \"\$p\" == / ]] && echo '$cwd' || echo \"\$p\"")
  [[ -z "$project_root" ]] && project_root="$cwd"

  local dest_full="${project_root}/${DEST_REL}"
  ssh "$host" "mkdir -p '$(dirname "$dest_full")'" || die "ssh mkdir failed"
  scp -q "$TMP_PNG" "${host}:${dest_full}" || die "scp failed"

  if [[ "$kind" == "tmux" && -n "$pane" ]]; then
    inject_remote_tmux "$host" "$pane" "$dest_full"
    banner success "Ghostty SSH+tmux → ${DEST_REL}"
  else
    inject_via_paste "$dest_full"
    banner success "Ghostty SSH → ${DEST_REL}"
  fi
}

# ---------------------------------------------------------------------------
# Dispatch (FRONTMOST is already lowercased)
# ---------------------------------------------------------------------------
case "$FRONTMOST" in
  zed|"zed preview")
    handle_zed
    ;;
  ghostty)
    handle_ghostty
    ;;
  *)
    die "unsupported frontmost app: ${FRONTMOST_RAW:-unknown}"
    ;;
esac

rm -f "$TMP_PNG"
