#!/usr/bin/env bash
set -e

echo "🔧 Testing Hook Scripts"
echo "======================"

# Get project and session from database
PROJECT_ID=$(sqlite3 db/claude.db "SELECT id FROM projects LIMIT 1;")
if [ -z "$PROJECT_ID" ]; then
  echo "❌ No projects found in database"
  exit 1
fi

SESSION_ID=$(sqlite3 db/claude.db "SELECT id FROM sessions WHERE project_id=$PROJECT_ID LIMIT 1;")
if [ -z "$SESSION_ID" ]; then
  echo "❌ No sessions found in database"
  exit 1
fi

echo "✅ Found project ID: $PROJECT_ID, session ID: $SESSION_ID"
echo

# Test pre_tool_use hook
echo "📝 Testing pre_tool_use.py..."
export CLAUDE_SESSION_ID=$SESSION_ID

echo '{"tool_name":"Read","tool_input":{"file_path":"/test/file.txt"}}' | python3 .claude/hooks/pre_tool_use.py
if [ $? -eq 0 ]; then
  echo "✅ pre_tool_use.py executed successfully"
else
  echo "❌ pre_tool_use.py failed"
  exit 1
fi

# Wait and check if hook was ingested
sleep 1
HOOK_COUNT=$(sqlite3 db/claude.db "SELECT COUNT(*) FROM hooks WHERE session_id=$SESSION_ID AND hook_type='pre_tool_use';")
echo "   Found $HOOK_COUNT pre_tool_use hooks in database"

# Test post_tool_use hook
echo
echo "📝 Testing post_tool_use.py..."

echo '{"tool_name":"Read","tool_output":"File contents here","duration_ms":150,"success":true}' | python3 .claude/hooks/post_tool_use.py
if [ $? -eq 0 ]; then
  echo "✅ post_tool_use.py executed successfully"
else
  echo "❌ post_tool_use.py failed"
  exit 1
fi

# Wait and check
sleep 1
HOOK_COUNT=$(sqlite3 db/claude.db "SELECT COUNT(*) FROM hooks WHERE session_id=$SESSION_ID AND hook_type='post_tool_use';")
echo "   Found $HOOK_COUNT post_tool_use hooks in database"

# Test user_prompt_submit hook
echo
echo "📝 Testing user_prompt_submit.py..."

echo '{"prompt":"Test user prompt"}' | python3 .claude/hooks/user_prompt_submit.py
if [ $? -eq 0 ]; then
  echo "✅ user_prompt_submit.py executed successfully"
else
  echo "❌ user_prompt_submit.py failed"
  exit 1
fi

sleep 1
HOOK_COUNT=$(sqlite3 db/claude.db "SELECT COUNT(*) FROM hooks WHERE session_id=$SESSION_ID AND hook_type='user_prompt_submit';")
echo "   Found $HOOK_COUNT user_prompt_submit hooks in database"

echo
echo "✨ All hook tests passed!"
echo
echo "📊 Final hook statistics:"
sqlite3 db/claude.db "SELECT hook_type, COUNT(*) as count FROM hooks WHERE session_id=$SESSION_ID GROUP BY hook_type;"
