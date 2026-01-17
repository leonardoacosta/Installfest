#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title la
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🏗️
# @raycast.packageName Leonardo Acosta

# Documentation:
# @raycast.description Leonardo Acosta
# @raycast.author leonardoacosta
# @raycast.authorURL https://raycast.com/leonardoacosta

LOCAL_IP1="192.168.1.100"
TAILSCALE="homelab.tail296462.ts.net"
USER="nyaptor"

if timeout 1 bash -c "</dev/tcp/$LOCAL_IP1/22" 2>/dev/null; then
  HOST="$LOCAL_IP1"
elif timeout 1 bash -c "</dev/tcp/$LOCAL_IP2/22" 2>/dev/null; then
  HOST="$LOCAL_IP2"
else
  HOST="$TAILSCALE"
fi

cursor --folder-uri "vscode-remote://ssh-remote+$USER@$HOST/home/$USER/personal/la/"