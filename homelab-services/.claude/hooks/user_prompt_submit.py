#!/usr/bin/env python3
"""
User prompt submit hook for Claude Code.

Called when the user submits a new prompt.
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
    prompt = event_data.get("prompt", "")

    # Truncate long prompts
    prompt_preview = prompt[:200] + "..." if len(prompt) > 200 else prompt

    send_event(
        session_id=session_id,
        hook_type="user_prompt_submit",
        tool_input=prompt_preview,
        success=True,
        metadata={
            "timestamp": int(time.time() * 1000),
            "prompt_length": len(prompt),
        },
    )

    return 0


if __name__ == "__main__":
    sys.exit(main())
