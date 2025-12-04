# Claude Code Hook System

This directory contains Python hook scripts that integrate Claude Code sessions with the homelab monitoring dashboard.

## Overview

The hook system captures Claude Code events (tool calls, session lifecycle, user prompts) and sends them to the tRPC backend API for real-time visualization and analytics.

## Architecture

```
Claude Code Event
  ↓
Hook Script (Python)
  ↓
send_event.py → POST to http://localhost:3001/api/trpc/hooks.ingest
  ↓
tRPC API → Drizzle ORM → SQLite
  ↓
WebSocket Broadcast → Frontend Dashboard
```

## Hook Scripts

### Core Utility

- **`send_event.py`** - Universal event transmission utility
  - Posts events to tRPC backend
  - Handles network errors gracefully
  - Supports retry logic

### Tool Lifecycle

- **`pre_tool_use.py`** - Before tool execution
  - Logs tool name and input parameters
  - Captures timestamp

- **`post_tool_use.py`** - After tool execution
  - Logs tool output and duration
  - Captures success/failure status
  - Records error messages

### Session Lifecycle

- **`session_start.py`** - Session initialization
  - Records agent ID and working directory
  - Marks session start time

- **`session_end.py`** - Normal session completion
  - Records exit code
  - Marks session end time

- **`stop.py`** - Session interrupted (Ctrl+C)
  - Records stop reason
  - Differentiates from normal completion

- **`user_prompt_submit.py`** - User prompt capture
  - Logs user input (truncated)
  - Tracks prompt frequency

### Special Events

- **`subagent_stop.py`** - Subagent task completion
  - Tracks subagent type and success
  - Useful for multi-agent workflows

- **`pre_compact.py`** - Before context compaction
  - Logs context size metrics
  - Monitors memory usage patterns

## Configuration

Hooks are configured in `settings.json`:

```json
{
  "hooks": {
    "pre_tool_use": {
      "command": "python3",
      "args": [".claude/hooks/pre_tool_use.py"]
    }
  }
}
```

## Environment Variables

- **`CLAUDE_SESSION_ID`** - Unique session identifier (required)
- **`CLAUDE_AGENT_ID`** - Agent identifier (optional)

Set these before running Claude Code:

```bash
export CLAUDE_SESSION_ID=1
export CLAUDE_AGENT_ID=$(uuidgen)
claude-code
```

## API Endpoint

Hooks POST to: `http://localhost:3001/api/trpc/hooks.ingest`

**Payload Format:**
```json
{
  "json": {
    "sessionId": 1,
    "hookType": "pre_tool_use",
    "toolName": "Read",
    "toolInput": "{\"file_path\": \"/path/to/file\"}",
    "success": true,
    "durationMs": 150,
    "metadata": "{\"timestamp\": 1234567890}"
  }
}
```

## Error Handling

All hooks are designed to **never block** Claude Code execution:

- Network errors are logged to stderr but ignored
- Offline backend is handled gracefully
- Hooks always return exit code 0
- Truncation applied to large payloads (>5KB)

## Testing

Test individual hooks:

```bash
# Test send_event utility
python3 .claude/hooks/send_event.py

# Test hook with mock data
echo '{"tool_name": "Read", "tool_input": {}}' | python3 .claude/hooks/pre_tool_use.py
```

## Dashboard Access

View captured events at: `http://claude.local/hooks`

Features:
- Real-time event streaming (WebSocket)
- Filterable by session
- Aggregated statistics
- Success/failure tracking
- Duration metrics

## Development

To add a new hook:

1. Create script in `.claude/hooks/`
2. Import `send_event` utility
3. Parse event data from stdin
4. Call `send_event()` with appropriate fields
5. Add entry to `settings.json`
6. Make script executable: `chmod +x script.py`

Example hook template:

```python
#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from send_event import send_event

def main():
    event_data = json.load(sys.stdin)
    session_id = int(os.getenv("CLAUDE_SESSION_ID", "1"))

    send_event(
        session_id=session_id,
        hook_type="my_custom_hook",
        success=True,
    )

    return 0

if __name__ == "__main__":
    sys.exit(main())
```

## Troubleshooting

**Hooks not triggering:**
- Check `settings.json` syntax
- Verify Python3 is available
- Ensure scripts are executable

**Events not appearing in dashboard:**
- Check backend is running at `localhost:3001`
- Verify `CLAUDE_SESSION_ID` is set
- Check network connectivity
- Review stderr output for errors

**Performance issues:**
- Reduce payload sizes (already truncated)
- Increase timeout in `send_event.py`
- Consider batching events (future enhancement)
