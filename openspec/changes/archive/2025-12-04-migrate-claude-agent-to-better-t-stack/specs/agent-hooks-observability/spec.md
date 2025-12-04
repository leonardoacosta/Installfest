# Agent Hooks Observability Specification

## ADDED Requirements

### Requirement: Claude Hooks Directory Structure
The system SHALL provide a `.claude/` directory with hook scripts and configuration for event interception.

#### Scenario: Hook directory organization
- **WHEN** the project is initialized
- **THEN** `.claude/hooks/` contains Python scripts for each hook type
- **AND** `.claude/settings.json` defines hook event mappings

#### Scenario: Hook script discovery
- **WHEN** Claude Code executes an event
- **THEN** reads settings.json to find configured hook commands
- **AND** executes matching hooks with event context

### Requirement: Hook Configuration Format
The system SHALL define hook event mappings in JSON format following Claude Code conventions.

#### Scenario: Settings.json structure
- **WHEN** defining hook configuration
- **THEN** includes event types: PreToolUse, PostToolUse, SessionStart, SessionEnd, Stop, SubagentStop, PreCompact, UserPromptSubmit
- **AND** each event maps to array of commands with matchers

#### Scenario: Hook command execution
- **WHEN** an event triggers
- **THEN** executes all configured commands using `uv run`
- **AND** passes event metadata as command arguments

### Requirement: Pre-Tool-Use Hook
The system SHALL execute hooks before tool invocation for validation and logging.

#### Scenario: Tool use interception
- **WHEN** Claude Code is about to use a tool
- **THEN** pre_tool_use.py receives tool name and parameters
- **AND** can validate or block tool execution
- **AND** sends event to observability backend

#### Scenario: Command blocking
- **WHEN** hook detects invalid tool usage
- **THEN** returns non-zero exit code
- **AND** Claude Code aborts tool execution with error message

### Requirement: Post-Tool-Use Hook
The system SHALL execute hooks after tool completion for result logging and analysis.

#### Scenario: Tool result capture
- **WHEN** a tool completes execution
- **THEN** post_tool_use.py receives tool name, parameters, and result
- **AND** sends completion event to observability backend
- **AND** records success/failure status and duration

#### Scenario: Error result handling
- **WHEN** tool execution fails
- **THEN** hook receives error details
- **AND** logs failure for debugging analysis

### Requirement: Session Lifecycle Hooks
The system SHALL track session start and end events for agent lifecycle management.

#### Scenario: Session start event
- **WHEN** Claude Code session begins
- **THEN** session_start.py generates unique session ID
- **AND** records session metadata (project, timestamp)
- **AND** sends start event to backend

#### Scenario: Session end event
- **WHEN** Claude Code session terminates
- **THEN** session_end.py records final session statistics
- **AND** sends completion event with duration and event counts

### Requirement: User Prompt Submission Hook
The system SHALL capture user prompts for session transcript reconstruction.

#### Scenario: Prompt capture
- **WHEN** user submits a prompt
- **THEN** user_prompt_submit.py extracts prompt text
- **AND** sends to backend with session context
- **AND** enables chat history replay

### Requirement: Subagent Stop Hook
The system SHALL track subagent task completion for multi-agent workflows.

#### Scenario: Subagent completion
- **WHEN** a subagent task finishes
- **THEN** subagent_stop.py records task outcome
- **AND** sends event with task summary and duration

### Requirement: Context Compaction Hook
The system SHALL monitor context window management events.

#### Scenario: Pre-compaction event
- **WHEN** Claude Code compacts conversation context
- **THEN** pre_compact.py records compaction trigger
- **AND** logs context window usage statistics

### Requirement: Event Transmission
The system SHALL transmit hook events to tRPC backend endpoint for storage and analysis.

#### Scenario: Event POST to backend
- **WHEN** send_event.py is called with event data
- **THEN** POSTs JSON payload to tRPC hooks ingestion endpoint
- **AND** includes session ID, event type, tool name, and metadata

#### Scenario: Batch event transmission
- **WHEN** multiple events occur rapidly
- **THEN** hooks send events asynchronously
- **AND** backend queues events for processing
- **AND** prevents hook execution from blocking Claude Code

#### Scenario: Event transmission failure
- **WHEN** backend is unreachable
- **THEN** hook logs error locally
- **AND** continues Claude Code execution without blocking
- **AND** can retry event transmission on reconnection

### Requirement: Hook Event Schema
The system SHALL define typed event schemas using Zod for validation.

#### Scenario: Tool use event schema
- **WHEN** validating tool use events
- **THEN** schema includes: session_id, event_type, tool_name, parameters, timestamp
- **AND** backend validates structure before storage

#### Scenario: Session event schema
- **WHEN** validating session events
- **THEN** schema includes: session_id, project_id, event_type, timestamp, metadata
- **AND** supports optional fields for session-specific context

### Requirement: Python Environment Management
The system SHALL use `uv` for fast Python package management and script execution.

#### Scenario: Dependency installation
- **WHEN** hooks require Python packages
- **THEN** uv installs dependencies quickly
- **AND** creates isolated environment per script if needed

#### Scenario: Hook script execution
- **WHEN** Claude Code triggers a hook
- **THEN** executes using `uv run <script.py>` for speed
- **AND** avoids global Python environment pollution

### Requirement: Hook Observability Dashboard
The system SHALL display hook events in web UI with filtering and visualization.

#### Scenario: Real-time event stream
- **WHEN** viewing hooks dashboard
- **THEN** displays incoming events with color-coded session IDs
- **AND** updates in real-time via WebSocket subscription

#### Scenario: Session-specific filtering
- **WHEN** filtering by session ID
- **THEN** shows only events for selected session
- **AND** groups events by tool or hook type

#### Scenario: Event timeline visualization
- **WHEN** viewing session timeline
- **THEN** displays events chronologically with duration bars
- **AND** highlights failed operations

#### Scenario: Statistics summary
- **WHEN** viewing hook statistics
- **THEN** shows aggregated metrics: total events, success rate, average duration
- **AND** breaks down by hook type and tool name

### Requirement: Multi-Agent Workflow Tracking
The system SHALL track events across multiple concurrent Claude Code agent sessions.

#### Scenario: Concurrent session monitoring
- **WHEN** multiple agents run simultaneously
- **THEN** each session has unique ID
- **AND** events from all sessions are ingested in parallel
- **AND** UI distinguishes sessions with color coding

#### Scenario: Session correlation
- **WHEN** one agent spawns subagents
- **THEN** hooks track parent-child session relationships
- **AND** enables hierarchical session visualization

### Requirement: Chat Transcript Reconstruction
The system SHALL reconstruct full conversation transcripts from captured events.

#### Scenario: Transcript playback
- **WHEN** viewing session transcript
- **THEN** displays user prompts and agent responses in order
- **AND** includes tool uses and results inline
- **AND** preserves conversation flow

#### Scenario: Transcript export
- **WHEN** exporting session transcript
- **THEN** generates markdown file with full conversation
- **AND** includes timestamps and metadata

## MODIFIED Requirements

None. This is a new capability being added.

## REMOVED Requirements

None. This is a new capability being added.
