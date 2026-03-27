#!/bin/bash
# validate-proxy.sh — Login-time validation of CloudPC proxy stack
# Checks: SOCKS tunnel, ProxyBridge running, rules completeness
# Sends macOS notification + TTS if issues found
set -uo pipefail

DOTFILES="${DOTFILES:-$HOME/dev/if}"
RULES_SOURCE="$DOTFILES/scripts/proxybridge-rules.json"
ISSUES=()

# --- 1. Check SOCKS tunnel ---
if ! pgrep -f "ssh.*-D.*1080.*cloudpc" >/dev/null 2>&1; then
    ISSUES+=("CloudPC SOCKS tunnel not running")
fi

# --- 2. Check ProxyBridge is running ---
if ! pgrep -f "ProxyBridge" >/dev/null 2>&1; then
    ISSUES+=("ProxyBridge is not running")
fi

# --- 3. Compare rules ---
if [ -f "$RULES_SOURCE" ]; then
    # Extract expected process names from our source JSON
    EXPECTED=$(python3 -c "
import json, sys
rules = json.load(open('$RULES_SOURCE'))
for r in rules:
    print(r.get('processNames', ''))
" 2>/dev/null | sort)

    # Extract live rules from ProxyBridge preferences
    LIVE_PLIST=$(defaults read com.interceptsuite.ProxyBridge proxyRules 2>/dev/null || echo "")

    if [ -z "$LIVE_PLIST" ]; then
        ISSUES+=("ProxyBridge has no rules configured")
    else
        # Parse plist array — extract processNames values
        LIVE=$(echo "$LIVE_PLIST" | python3 -c "
import sys, plistlib
raw = sys.stdin.read()
# defaults read outputs an old-style plist text format — parse processNames
import re
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
            MISSING="${MISSING%, }"  # trim trailing comma
            ISSUES+=("Missing ProxyBridge rules: $MISSING")
        fi
    fi
fi

# --- 4. Report ---
if [ ${#ISSUES[@]} -eq 0 ]; then
    # All good — silent success
    exit 0
fi

# Build notification message
MSG=""
for issue in "${ISSUES[@]}"; do
    MSG="${MSG}• ${issue}\n"
done

# macOS notification
osascript -e "display notification \"$(echo -e "$MSG")\" with title \"CloudPC Proxy\" subtitle \"Issues Detected\"" 2>/dev/null || true

# TTS announcement
say "CloudPC proxy check: ${#ISSUES[@]} issues found. ${ISSUES[0]}" 2>/dev/null || true

# Also log to stderr for launchd logs
echo "[validate-proxy] Issues found:" >&2
for issue in "${ISSUES[@]}"; do
    echo "  - $issue" >&2
done

exit 1
