#!/bin/bash
# validate-proxy.sh — Periodic validation + remediation of CloudPC proxy stack
# Checks: SOCKS tunnel (process + port), ProxyBridge running
# Remediates: kills zombie tunnels, restarts via launchctl
# Notifies: single updating notification (not spam), click opens log
#
# Note: ProxyBridge rule checking is skipped when running from launchd.
# macOS App Sandbox blocks LaunchAgents from reading container prefs
# (~/Library/Containers/). Run manually to check rules: bash validate-proxy.sh --rules
set -uo pipefail

DOTFILES="${DOTFILES:-$HOME/dev/if}"
RULES_SOURCE="$DOTFILES/scripts/proxybridge-rules.json"
STATE_FILE="$HOME/.local/logs/validate-proxy.state"
LOG_FILE="$HOME/.local/logs/validate-proxy.err.log"
ISSUES=()
FIXED=()
CHECK_RULES=false

# Parse args
for arg in "$@"; do
    [ "$arg" = "--rules" ] && CHECK_RULES=true
done

# --- State: track consecutive failures to avoid notification spam ---
read_state() {
    if [ -f "$STATE_FILE" ]; then
        FAIL_COUNT=$(grep -c '' "$STATE_FILE" 2>/dev/null || echo 0)
        LAST_ISSUE=$(tail -1 "$STATE_FILE" 2>/dev/null || echo "")
    else
        FAIL_COUNT=0
        LAST_ISSUE=""
    fi
}

write_fail() {
    local issue="$1"
    mkdir -p "$(dirname "$STATE_FILE")"
    echo "$(date '+%Y-%m-%d %H:%M:%S') $issue" >> "$STATE_FILE"
}

clear_state() {
    rm -f "$STATE_FILE"
}

# --- Helper: notify with dedup (replaces previous notification) ---
notify() {
    local msg="$1"
    local channels="${2:-tts,banner}"

    # terminal-notifier: -group replaces previous, -open opens log on click
    if command -v terminal-notifier >/dev/null 2>&1; then
        terminal-notifier \
            -title "CloudPC Proxy" \
            -message "$msg" \
            -group "cloudpc-proxy" \
            -open "file://$LOG_FILE" \
            2>/dev/null || true
    fi

    # Also try claude-notify / socat for TTS
    local claude_notify="$HOME/.claude/bin/claude-notify"
    if [ -x "$claude_notify" ]; then
        echo "{\"message\":\"$msg\"}" | "$claude_notify" --notify --channels "$channels" --type proxy-health 2>/dev/null || true
    else
        echo "{\"event\":\"notification\",\"message\":\"$msg\"}" | socat - UNIX-CONNECT:/tmp/nexus-agent.sock 2>/dev/null || true
    fi
}

notify_recovery() {
    local msg="$1"
    if command -v terminal-notifier >/dev/null 2>&1; then
        terminal-notifier \
            -title "CloudPC Proxy" \
            -subtitle "Recovered" \
            -message "$msg" \
            -group "cloudpc-proxy" \
            2>/dev/null || true
    fi
}

clear_notification() {
    terminal-notifier -remove "cloudpc-proxy" 2>/dev/null || true
}

# --- 1. Check SOCKS tunnel (process + port health) ---
TUNNEL_PID=$(pgrep -f "ssh.*-D.*1080.*cloudpc" 2>/dev/null | head -1)

if [ -n "$TUNNEL_PID" ]; then
    if ! lsof -i :1080 -P -n 2>/dev/null | grep -q LISTEN; then
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

# --- 3. Compare rules (interactive only) ---
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

# --- 4. Report with dedup ---
read_state

# Handle fixes
if [ ${#FIXED[@]} -gt 0 ]; then
    for fix in "${FIXED[@]}"; do
        echo "[validate-proxy] Fixed: $fix" >&2
    done
    if [ "$FAIL_COUNT" -gt 0 ]; then
        notify_recovery "Restored after $FAIL_COUNT failed attempts"
        clear_state
    fi
fi

# Handle issues
if [ ${#ISSUES[@]} -gt 0 ]; then
    echo "[validate-proxy] Issues found:" >&2
    for issue in "${ISSUES[@]}"; do
        echo "  - $issue" >&2
    done

    write_fail "${ISSUES[0]}"
    read_state  # re-read to get updated count

    # Notification strategy: notify on 1st failure, then update with count
    # TTS only on 1st failure to avoid audio spam
    if [ "$FAIL_COUNT" -eq 1 ]; then
        notify "${ISSUES[0]}" "tts,banner"
    else
        # Update the existing notification with attempt count (no TTS)
        if command -v terminal-notifier >/dev/null 2>&1; then
            terminal-notifier \
                -title "CloudPC Proxy" \
                -subtitle "$FAIL_COUNT attempts" \
                -message "${ISSUES[0]}" \
                -group "cloudpc-proxy" \
                -open "file://$LOG_FILE" \
                2>/dev/null || true
        fi
    fi
    exit 1
fi

# All clear — if we were failing before, notify recovery and clean up
if [ "$FAIL_COUNT" -gt 0 ]; then
    notify_recovery "All checks passing (was down for $FAIL_COUNT checks)"
    notify "CloudPC proxy recovered after $FAIL_COUNT failed checks" "tts,banner"
    clear_state
fi

# Remove any lingering notification
clear_notification
exit 0
