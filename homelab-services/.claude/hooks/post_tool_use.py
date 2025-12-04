#!/usr/bin/env python3
"""
Post-tool-use hook for Claude Code.

Called after a tool completes execution. Logs the result and duration.
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
        print("[post_tool_use] Failed to parse event data", file=sys.stderr)
        return 1

    # Extract relevant fields
    tool_name = event_data.get("tool_name", "unknown")
    tool_output = event_data.get("tool_output", {})
    duration_ms = event_data.get("duration_ms", 0)
    success = event_data.get("success", True)
    error = event_data.get("error")

    # Get session ID from environment or event
    session_id = int(os.getenv("CLAUDE_SESSION_ID", "1"))

    # Serialize tool output (truncate if too large)
    tool_output_str = json.dumps(tool_output)
    if len(tool_output_str) > 5000:
        tool_output_str = tool_output_str[:5000] + "...[truncated]"

    # Send event to backend
    send_success = send_event(
        session_id=session_id,
        hook_type="post_tool_use",
        tool_name=tool_name,
        tool_output=tool_output_str,
        duration_ms=int(duration_ms),
        success=success,
        error_message=str(error) if error else None,
        metadata={"timestamp": int(time.time() * 1000)},
    )

    if not send_success:
        print(
            f"[post_tool_use] Failed to send event for tool: {tool_name}",
            file=sys.stderr,
        )

    # Always return 0 to not block Claude Code execution
    return 0


if __name__ == "__main__":
    sys.exit(main())
