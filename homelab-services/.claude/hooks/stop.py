#!/usr/bin/env python3
"""
Stop hook for Claude Code.

Called when the session is stopped (e.g., Ctrl+C).
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

    send_event(
        session_id=session_id,
        hook_type="session_stop",
        success=True,
        metadata={
            "timestamp": int(time.time() * 1000),
            "reason": event_data.get("reason", "user_requested"),
        },
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
