#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title hl
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 💻

# Documentation:
# @raycast.description Home Lab
# @raycast.author leonardoacosta
# @raycast.authorURL https://raycast.com/leonardoacosta

# Use SSH Host alias - lets SSH config handle smart routing (LAN/Tailscale)
cursor --folder-uri "vscode-remote://ssh-remote+homelab/home/nyaptor/dev/hl"
