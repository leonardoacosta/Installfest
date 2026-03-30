#!/bin/bash
# validate-proxy.sh — Periodic validation + remediation of CloudPC proxy stack
# Checks: SOCKS tunnel (process + port), ProxyBridge running
# Remediates: kills zombie tunnels, restarts via launchctl
# Notifies: claude-notify (TTS/APNs/banner) on issues or recovery
#
# Note: ProxyBridge rule checking is skipped when running from launchd.
# macOS App Sandbox blocks LaunchAgents from reading container prefs
# (~/Library/Containers/). Run manually to check rules: bash validate-proxy.sh --rules
set -uo pipefail

DOTFILES="${DOTFILES:-$HOME/dev/if}"
RULES_SOURCE="$DOTFILES/scripts/proxybridge-rules.json"
ISSUES=()
FIXED=()
CHECK_RULES=false

# Parse args: --rules flag enables rule checking (interactive only)
for arg in "$@"; do
    [ "$arg" = "--rules" ] && CHECK_RULES=true
done

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
        pkill -f "ssh.*-D.*1080.*cloudpc" 2>/dev/null || true
        sleep 1
        TUNNEL_PID=""
    fi
fi

if [ -z "$TUNNEL_PID" ]; then
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

# --- 3. Compare rules (interactive only — sandbox blocks LaunchAgent access) ---
if [ "$CHECK_RULES" = true ] && [ -f "$RULES_SOURCE" ]; then
    PREFS_PLIST="$HOME/Library/Containers/com.interceptsuite.ProxyBridge/Data/Library/Preferences/com.interceptsuite.ProxyBridge.plist"
    PLIST_BUDDY="/usr/libexec/PlistBuddy"

    if [ -f "$PREFS_PLIST" ]; then
        EXPECTED_NAMES=$(grep '"processNames"' "$RULES_SOURCE" | sed 's/.*: *"\(.*\)".*/\1/' | sort)

        LIVE_NAMES=""
        LIVE_PROTOCOLS=""
        i=0
        while true; do
            name=$("$PLIST_BUDDY" -c "Print :proxyRules:$i:processNames" "$PREFS_PLIST" 2>/dev/null) || break
            proto=$("$PLIST_BUDDY" -c "Print :proxyRules:$i:protocol" "$PREFS_PLIST" 2>/dev/null)
            LIVE_NAMES="${LIVE_NAMES}${name}\n"
            [ "$proto" != "TCP" ] && LIVE_PROTOCOLS="${LIVE_PROTOCOLS}${proto} "
            i=$((i+1))
        done

        if [ "$i" -eq 0 ]; then
            ISSUES+=("ProxyBridge has no rules configured")
        else
            MISSING=""
            while IFS= read -r expected; do
                [ -z "$expected" ] && continue
                if ! echo -e "$LIVE_NAMES" | grep -qF "$expected"; then
                    MISSING="${MISSING}${expected}, "
                fi
            done <<< "$EXPECTED_NAMES"

            [ -n "$MISSING" ] && ISSUES+=("Missing ProxyBridge rules: ${MISSING%, }")
            [ -n "$LIVE_PROTOCOLS" ] && ISSUES+=("ProxyBridge has non-TCP rules (${LIVE_PROTOCOLS% }) — re-import from source")
        fi
    else
        ISSUES+=("ProxyBridge preferences file not found")
    fi
fi

# --- 4. Report ---
if [ ${#FIXED[@]} -gt 0 ]; then
    for fix in "${FIXED[@]}"; do
        echo "[validate-proxy] Fixed: $fix" >&2
        notify "$fix" "tts,banner"
    done
fi

if [ ${#ISSUES[@]} -gt 0 ]; then
    echo "[validate-proxy] Issues found:" >&2
    for issue in "${ISSUES[@]}"; do
        echo "  - $issue" >&2
    done
    notify "CloudPC proxy: ${#ISSUES[@]} issues. ${ISSUES[0]}" "tts,apns,banner"
    exit 1
fi

exit 0
