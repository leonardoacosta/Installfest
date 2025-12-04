#!/usr/bin/env python3
"""
Subagent stop hook for Claude Code.

Called when a subagent completes its task.
"""

import json
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from send_event import send_event


def main():
    try:
        event_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        event_data = {}

    session_id = int(os.getenv("CLAUDE_SESSION_ID", "1"))
    subagent_type = event_data.get("subagent_type", "unknown")

    send_event(
        session_id=session_id,
        hook_type="subagent_stop",
        tool_name=subagent_type,
        success=event_data.get("success", True),
        metadata={
            "timestamp": int(time.time() * 1000),
            "subagent_type": subagent_type,
        },
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
