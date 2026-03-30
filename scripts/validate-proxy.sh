#!/bin/bash
# validate-proxy.sh — Periodic validation + remediation of CloudPC proxy stack
# Checks: SOCKS tunnel (process + port), ProxyBridge running, rules completeness
# Remediates: kills zombie tunnels, restarts via launchctl
# Notifies: claude-notify (TTS/APNs/banner) on issues or recovery
set -uo pipefail

DOTFILES="${DOTFILES:-$HOME/dev/if}"
RULES_SOURCE="$DOTFILES/scripts/proxybridge-rules.json"
ISSUES=()
FIXED=()

# --- Helper: notify via claude-notify or fallback ---
notify() {
    local msg="$1"
    local channels="${2:-tts,banner}"
    local claude_notify="$HOME/.claude/bin/claude-notify"
    if [ -x "$claude_notify" ]; then
        echo "{\"message\":\"$msg\"}" | "$claude_notify" --notify --channels "$channels" --type proxy-health 2>/dev/null || true
    else
        # Fallback: socat to nexus-agent socket
        echo "{\"event\":\"notification\",\"message\":\"$msg\"}" | socat - UNIX-CONNECT:/tmp/nexus-agent.sock 2>/dev/null || \
        osascript -e "display notification \"$msg\" with title \"CloudPC Proxy\"" 2>/dev/null || true
    fi
}

# --- 1. Check SOCKS tunnel (process + port health) ---
TUNNEL_PID=$(pgrep -f "ssh.*-D.*1080.*cloudpc" 2>/dev/null | head -1)

if [ -n "$TUNNEL_PID" ]; then
    # Process exists — but is port 1080 actually listening?
    if ! lsof -i :1080 -P -n 2>/dev/null | grep -q LISTEN; then
        # Zombie tunnel: process alive but port dead
        kill "$TUNNEL_PID" 2>/dev/null
        # Kill any other stale instances
        pkill -f "ssh.*-D.*1080.*cloudpc" 2>/dev/null || true
        sleep 1
        TUNNEL_PID=""  # fall through to restart below
    fi
fi

if [ -z "$TUNNEL_PID" ]; then
    # Tunnel not running — attempt restart via launchd
    UID_NUM=$(id -u)
    if launchctl kickstart "gui/${UID_NUM}/com.leonardoacosta.cloudpc-tunnel" 2>/dev/null; then
        sleep 3
        if pgrep -f "ssh.*-D.*1080.*cloudpc" >/dev/null 2>&1 && \
           lsof -i :1080 -P -n 2>/dev/null | grep -q LISTEN; then
            FIXED+=("SOCKS tunnel was down — restarted via launchd")
        else
            ISSUES+=("SOCKS tunnel down — launchd restart failed")
        fi
    else
        ISSUES+=("SOCKS tunnel down — launchctl kickstart failed")
    fi
fi

# --- 2. Check ProxyBridge is running ---
if ! pgrep -f "ProxyBridge" >/dev/null 2>&1; then
    ISSUES+=("ProxyBridge is not running")
fi

# --- 3. Compare rules ---
# Note: `defaults read` fails in LaunchAgent context (cfprefsd session isolation).
# Read the plist file directly instead.
# ProxyBridge is sandboxed — prefs live in the app container, not ~/Library/Preferences/
PREFS_PLIST="$HOME/Library/Containers/com.interceptsuite.ProxyBridge/Data/Library/Preferences/com.interceptsuite.ProxyBridge.plist"

if [ -f "$RULES_SOURCE" ] && [ -f "$PREFS_PLIST" ]; then
    RULE_CHECK=$(python3 -c "
import json, plistlib, sys

# Load expected rules from source JSON
with open('$RULES_SOURCE') as f:
    expected = {r['processNames'] for r in json.load(f)}

# Load live rules from ProxyBridge plist (binary plist, not defaults)
with open('$PREFS_PLIST', 'rb') as f:
    prefs = plistlib.load(f)

rules = prefs.get('proxyRules', [])
if not rules:
    print('NO_RULES')
    sys.exit(0)

live_names = {r.get('processNames', '') for r in rules}

# Check missing rules
missing = expected - live_names
if missing:
    print('MISSING:' + ','.join(sorted(missing)))

# Check protocol drift (all should be TCP)
non_tcp = [r['protocol'] for r in rules if r.get('protocol') != 'TCP']
if non_tcp:
    print('NON_TCP:' + ','.join(non_tcp))

if not missing and not non_tcp:
    print('OK')
" 2>/dev/null)

    case "$RULE_CHECK" in
        NO_RULES)
            ISSUES+=("ProxyBridge has no rules configured") ;;
        MISSING:*)
            ISSUES+=("Missing ProxyBridge rules: ${RULE_CHECK#MISSING:}") ;;
        NON_TCP:*)
            ISSUES+=("ProxyBridge has non-TCP rules (${RULE_CHECK#NON_TCP:}) — re-import from source") ;;
        OK) ;;
        *)
            # Multiple issues possible (MISSING + NON_TCP on separate lines)
            while IFS= read -r line; do
                case "$line" in
                    MISSING:*) ISSUES+=("Missing ProxyBridge rules: ${line#MISSING:}") ;;
                    NON_TCP:*) ISSUES+=("ProxyBridge has non-TCP rules (${line#NON_TCP:}) — re-import") ;;
                esac
            done <<< "$RULE_CHECK"
            ;;
    esac
elif [ -f "$RULES_SOURCE" ] && [ ! -f "$PREFS_PLIST" ]; then
    ISSUES+=("ProxyBridge preferences file not found")
fi

# --- 4. Report ---

# Report fixes
if [ ${#FIXED[@]} -gt 0 ]; then
    for fix in "${FIXED[@]}"; do
        echo "[validate-proxy] Fixed: $fix" >&2
        notify "$fix" "tts,banner"
    done
fi

# Report unresolved issues
if [ ${#ISSUES[@]} -gt 0 ]; then
    echo "[validate-proxy] Issues found:" >&2
    for issue in "${ISSUES[@]}"; do
        echo "  - $issue" >&2
    done
    notify "CloudPC proxy: ${#ISSUES[@]} issues. ${ISSUES[0]}" "tts,apns,banner"
    exit 1
fi

# Silent success
exit 0
