#!/usr/bin/env python3
"""
Session start hook for Claude Code.

Called when a new Claude Code session begins.
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
    agent_id = event_data.get("agent_id", os.getenv("CLAUDE_AGENT_ID", "unknown"))

    send_event(
        session_id=session_id,
        hook_type="session_start",
        success=True,
        metadata={
            "agent_id": agent_id,
            "timestamp": int(time.time() * 1000),
            "cwd": os.getcwd(),
        },
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
