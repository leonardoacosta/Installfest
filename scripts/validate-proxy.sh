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
if [ -f "$RULES_SOURCE" ]; then
    EXPECTED=$(python3 -c "
import json, sys
rules = json.load(open('$RULES_SOURCE'))
for r in rules:
    print(r.get('processNames', ''))
" 2>/dev/null | sort)

    LIVE_PLIST=$(defaults read com.interceptsuite.ProxyBridge proxyRules 2>/dev/null || echo "")

    if [ -z "$LIVE_PLIST" ]; then
        ISSUES+=("ProxyBridge has no rules configured")
    else
        LIVE=$(echo "$LIVE_PLIST" | python3 -c "
import sys, re
raw = sys.stdin.read()
names = re.findall(r'processNames\s*=\s*\"?([^\";\n]+)\"?', raw)
for n in sorted(set(n.strip() for n in names)):
    print(n)
" 2>/dev/null | sort)

        # Find missing rules
        MISSING=""
        while IFS= read -r name; do
            [ -z "$name" ] && continue
            if ! echo "$LIVE" | grep -qF "$name"; then
                MISSING="${MISSING}${name}, "
            fi
        done <<< "$EXPECTED"

        if [ -n "$MISSING" ]; then
            MISSING="${MISSING%, }"
            ISSUES+=("Missing ProxyBridge rules: $MISSING")
        fi

        # Check for protocol drift (all rules should be TCP)
        NON_TCP=$(echo "$LIVE_PLIST" | python3 -c "
import sys, re
raw = sys.stdin.read()
protocols = re.findall(r'protocol\s*=\s*\"?([^\";\n]+)\"?', raw)
for p in protocols:
    p = p.strip()
    if p != 'TCP':
        print(p)
" 2>/dev/null)
        if [ -n "$NON_TCP" ]; then
            ISSUES+=("ProxyBridge has non-TCP rules (found: $NON_TCP) — re-import from source")
        fi
    fi
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
