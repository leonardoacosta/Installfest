#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title img
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 📷
# @raycast.packageName Clipboard Image to Homelab

# Documentation:
# @raycast.description Paste clipboard image to homelab for Claude Code
# @raycast.author leonardoacosta
# @raycast.authorURL https://raycast.com/leonardoacosta

SSH_HOST="nyaptor@homelab.tail296462.ts.net"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOCAL_TMP="/tmp/clipboard_${TIMESTAMP}.png"
REMOTE_DIR="/home/nyaptor/tmp/images"
REMOTE_PATH="${REMOTE_DIR}/clipboard_${TIMESTAMP}.png"

# Save clipboard image to temp file
pngpaste "$LOCAL_TMP" 2>/dev/null

if [[ ! -f "$LOCAL_TMP" ]]; then
    osascript -e 'display notification "No image in clipboard" with title "img"'
    exit 1
fi

# Ensure remote directory exists and copy
ssh "$SSH_HOST" "mkdir -p $REMOTE_DIR"
scp -q "$LOCAL_TMP" "${SSH_HOST}:${REMOTE_PATH}"

# Clean up local temp
rm "$LOCAL_TMP"

# Copy path to clipboard for easy paste
echo -n "$REMOTE_PATH" | pbcopy

osascript -e "display notification \"Image saved: $REMOTE_PATH (path copied)\" with title \"img\""
