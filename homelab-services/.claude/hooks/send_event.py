#!/usr/bin/env python3
"""
Universal event transmission utility for Claude Code hooks.

Posts hook events to the tRPC backend API for ingestion and real-time broadcasting.
"""

import json
import sys
import urllib.request
import urllib.error
from typing import Any, Dict, Optional

# Configuration
API_URL = "http://localhost:3001/api/trpc/hooks.ingest"
TIMEOUT = 5  # seconds


def send_event(
    session_id: int,
    hook_type: str,
    tool_name: Optional[str] = None,
    tool_input: Optional[str] = None,
    tool_output: Optional[str] = None,
    duration_ms: Optional[int] = None,
    success: bool = True,
    error_message: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Send a hook event to the tRPC backend.

    Args:
        session_id: The session ID this hook belongs to
        hook_type: Type of hook (e.g., 'pre_tool_use', 'post_tool_use')
        tool_name: Name of the tool being used (optional)
        tool_input: Serialized input to the tool (optional)
        tool_output: Serialized output from the tool (optional)
        duration_ms: Execution duration in milliseconds (optional)
        success: Whether the operation succeeded
        error_message: Error message if failed (optional)
        metadata: Additional metadata as JSON string (optional)

    Returns:
        bool: True if event was sent successfully, False otherwise
    """
    # Construct payload
    payload = {
        "sessionId": session_id,
        "hookType": hook_type,
        "success": success,
    }

    if tool_name:
        payload["toolName"] = tool_name
    if tool_input:
        payload["toolInput"] = tool_input
    if tool_output:
        payload["toolOutput"] = tool_output
    if duration_ms is not None:
        payload["durationMs"] = duration_ms
    if error_message:
        payload["errorMessage"] = error_message
    if metadata:
        payload["metadata"] = json.dumps(metadata)

    # Prepare tRPC request format
    trpc_payload = {"json": payload}

    try:
        # Create request
        req = urllib.request.Request(
            API_URL,
            data=json.dumps(trpc_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        # Send request
        with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
            if response.status == 200:
                return True
            else:
                print(
                    f"[send_event] Failed to send event: HTTP {response.status}",
                    file=sys.stderr,
                )
                return False

    except urllib.error.URLError as e:
        # Network error - backend might be offline
        print(f"[send_event] Network error: {e.reason}", file=sys.stderr)
        return False
    except Exception as e:
        # Unexpected error
        print(f"[send_event] Unexpected error: {e}", file=sys.stderr)
        return False


if __name__ == "__main__":
    # Test mode - send a test event
    print("Testing send_event utility...")
    success = send_event(
        session_id=1,
        hook_type="test",
        tool_name="test_tool",
        success=True,
        metadata={"test": True},
    )
    print(f"Test event sent: {success}")
    sys.exit(0 if success else 1)
