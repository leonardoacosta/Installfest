#!/usr/bin/env python3
"""
Pre-compact hook for Claude Code.

Called before context window compaction occurs.
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
        hook_type="pre_compact",
        success=True,
        metadata={
            "timestamp": int(time.time() * 1000),
            "context_size": event_data.get("context_size", 0),
            "target_size": event_data.get("target_size", 0),
        },
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
