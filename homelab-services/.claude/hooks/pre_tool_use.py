#!/usr/bin/env python3
"""
Pre-tool-use hook for Claude Code.

Called before a tool is executed. Logs the tool call attempt.
"""

import json
import os
import sys
import time
from pathlib import Path

# Add hooks directory to path to import send_event
sys.path.insert(0, str(Path(__file__).parent))
from send_event import send_event


def main():
    # Read hook event data from stdin (provided by Claude Code)
    try:
        event_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        print("[pre_tool_use] Failed to parse event data", file=sys.stderr)
        return 1

    # Extract relevant fields
    tool_name = event_data.get("tool_name", "unknown")
    tool_input = event_data.get("tool_input", {})

    # Get session ID from environment or event
    session_id = int(os.getenv("CLAUDE_SESSION_ID", "1"))

    # Serialize tool input (truncate if too large)
    tool_input_str = json.dumps(tool_input)
    if len(tool_input_str) > 5000:
        tool_input_str = tool_input_str[:5000] + "...[truncated]"

    # Send event to backend
    success = send_event(
        session_id=session_id,
        hook_type="pre_tool_use",
        tool_name=tool_name,
        tool_input=tool_input_str,
        success=True,
        metadata={"timestamp": int(time.time() * 1000)},
    )

    if not success:
        print(f"[pre_tool_use] Failed to send event for tool: {tool_name}", file=sys.stderr)

    # Always return 0 to not block Claude Code execution
    return 0


if __name__ == "__main__":
    sys.exit(main())
