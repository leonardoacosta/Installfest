#!/usr/bin/env bash
# Debug version — shows every step
set -euo pipefail

CMUX="${CMUX_CLI:-cmux}"

echo "=== Step 1: Create workspace ==="
WS_OUT=$($CMUX new-workspace 2>&1)
echo "  output: '$WS_OUT'"
WS_UUID=$(echo "$WS_OUT" | awk '{print $2}')
echo "  UUID: '$WS_UUID'"
sleep 0.3

echo "=== Step 2: Rename (no select — stay in caller workspace) ==="
$CMUX rename-workspace --workspace "$WS_UUID" "debug" 2>&1
sleep 0.3

echo "=== Step 3: List surfaces ==="
SURF_OUT=$($CMUX list-pane-surfaces --workspace "$WS_UUID" 2>&1)
echo "  output: '$SURF_OUT'"
EDITOR_SURF=$(echo "$SURF_OUT" | awk '{for(i=1;i<=NF;i++) if($i ~ /^surface:/) {print $i; exit}}')
echo "  editor surface: '$EDITOR_SURF'"
sleep 0.2

echo "=== Step 4: Send to editor pane (with --workspace) ==="
SEND_OUT=$($CMUX send --workspace "$WS_UUID" --surface "$EDITOR_SURF" "echo HELLO_FROM_SCRIPT" 2>&1)
echo "  send: '$SEND_OUT'"
KEY_OUT=$($CMUX send-key --workspace "$WS_UUID" --surface "$EDITOR_SURF" enter 2>&1)
echo "  key: '$KEY_OUT'"
sleep 0.5

echo "=== Step 5: Read screen ==="
$CMUX read-screen --workspace "$WS_UUID" --surface "$EDITOR_SURF" --lines 5 2>&1

echo "=== Step 6: Split right ==="
SPLIT_OUT=$($CMUX new-split right --workspace "$WS_UUID" --surface "$EDITOR_SURF" 2>&1)
echo "  split: '$SPLIT_OUT'"
RIGHT_SURF=$(echo "$SPLIT_OUT" | awk '{for(i=1;i<=NF;i++) if($i ~ /^surface:/) {print $i; exit}}')
echo "  right surface: '$RIGHT_SURF'"
sleep 0.3

echo "=== Step 7: Send to right pane ==="
$CMUX send --workspace "$WS_UUID" --surface "$RIGHT_SURF" "echo RIGHT_PANE" 2>&1
$CMUX send-key --workspace "$WS_UUID" --surface "$RIGHT_SURF" enter 2>&1
sleep 0.5

echo "=== Step 8: Read right pane ==="
$CMUX read-screen --workspace "$WS_UUID" --surface "$RIGHT_SURF" --lines 5 2>&1

echo "=== Step 9: Select workspace (switch view) ==="
$CMUX select-workspace --workspace "$WS_UUID" 2>&1

echo "=== Done ==="
