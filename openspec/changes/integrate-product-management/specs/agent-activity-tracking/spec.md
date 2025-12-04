## ADDED Requirements

### Requirement: Real-Time Agent Activity Feed
The system SHALL display a live feed of agent activities across all projects.

#### Scenario: Active agents list
- **WHEN** GET /api/agents/active is requested
- **THEN** all running sessions are returned with current activity
- **AND** each agent shows: project name, work item (spec/error), current tool, last event timestamp
- **AND** agents are sorted by last activity (most recent first)

#### Scenario: Idle agent detection
- **WHEN** agent has no events for 5 minutes
- **THEN** agent status shows as "idle"
- **AND** last known activity is displayed
- **AND** idle duration is shown

#### Scenario: Completed session
- **WHEN** session stops
- **THEN** agent is removed from active list
- **AND** final status is recorded (completed, stopped, error)

### Requirement: Tool Execution Tracking
The system SHALL track tool executions via send_event hook integration.

#### Scenario: Pre-tool event
- **WHEN** pre_tool_use hook fires
- **THEN** send_event posts to /api/hooks/ingest
- **AND** event includes: sessionId, toolName, toolInput
- **AND** agent's current activity is updated to show pending tool

#### Scenario: Post-tool event
- **WHEN** post_tool_use hook fires
- **THEN** send_event posts completion data
- **AND** event includes: toolName, toolOutput, durationMs, success
- **AND** agent's completed tool count increments

#### Scenario: Tool failure tracking
- **WHEN** tool execution fails
- **THEN** error is captured in hook event
- **AND** agent's error count increments
- **AND** UI shows warning indicator

### Requirement: Activity Timeline
Each agent session SHALL maintain a real-time activity timeline.

#### Scenario: Session activity stream
- **WHEN** GET /api/agents/:sessionId/activity is requested
- **THEN** all hook events for that session are returned chronologically
- **AND** events include: timestamp, hookType, toolName, summary
- **AND** timeline shows user prompts, tool calls, and completions

#### Scenario: Activity grouping
- **WHEN** timeline is displayed
- **THEN** consecutive tool calls are grouped
- **AND** user prompt triggers new activity group
- **AND** elapsed time is shown per group

#### Scenario: Activity filtering
- **WHEN** user filters timeline by hookType
- **THEN** only selected event types are shown (e.g., only tool_use, only prompts)

### Requirement: Progress Indicators
The system SHALL show progress for agents working on specs or errors.

#### Scenario: Spec implementation progress
- **WHEN** agent is implementing a spec
- **THEN** progress shows task completion percentage
- **AND** current task being worked on is highlighted
- **AND** estimated completion is shown (based on velocity)

#### Scenario: Error remediation progress
- **WHEN** agent is fixing an error
- **THEN** progress shows remediation attempt status
- **AND** number of tools used is displayed
- **AND** elapsed time is shown

#### Scenario: Completion detection
- **WHEN** agent completes all tasks for a spec
- **THEN** progress shows 100%
- **AND** UI suggests archiving the spec
- **AND** success notification is shown

### Requirement: Multi-Agent Dashboard View
The dashboard SHALL provide a unified view of all active agents.

#### Scenario: Agent grid view
- **WHEN** user accesses /dashboard/agents
- **THEN** grid shows all active agents as cards
- **AND** each card shows: project, work item, current tool, progress
- **AND** cards update in real-time via subscription

#### Scenario: Agent detail modal
- **WHEN** user clicks on agent card
- **THEN** modal shows full activity timeline
- **AND** session details are displayed
- **AND** user can stop session from modal

#### Scenario: Filter by project
- **WHEN** project filter is applied
- **THEN** only agents working on selected project are shown

#### Scenario: Filter by work type
- **WHEN** user filters by work type (spec/error/manual)
- **THEN** only agents of that type are shown

### Requirement: Real-Time Activity Subscription
The system SHALL stream agent activity updates via WebSocket.

#### Scenario: Subscribe to all agents
- **WHEN** client subscribes to /api/agents/subscribe
- **THEN** all hook events from all sessions are streamed
- **AND** events include sessionId, agentId, hookType, toolName, timestamp

#### Scenario: Subscribe to specific agent
- **WHEN** client subscribes to /api/agents/subscribe?sessionId=123
- **THEN** only events from that session are streamed

#### Scenario: Activity notification
- **WHEN** new tool execution starts
- **THEN** UI updates agent card with "Running: [ToolName]"
- **AND** spinner indicator is shown

#### Scenario: Completion notification
- **WHEN** tool execution completes
- **THEN** UI updates with duration and result
- **AND** success/failure badge is shown

### Requirement: Performance Metrics
The system SHALL track and display agent performance metrics.

#### Scenario: Session metrics
- **WHEN** GET /api/agents/:sessionId/metrics is requested
- **THEN** metrics include: total tools used, success rate, average duration
- **AND** metrics include: prompts submitted, errors encountered
- **AND** metrics include: session duration, work item progress

#### Scenario: Aggregate metrics
- **WHEN** GET /api/agents/metrics is requested
- **THEN** aggregate stats across all sessions are returned
- **AND** stats include: total active agents, tools per minute, success rate

#### Scenario: Tool usage breakdown
- **WHEN** metrics are displayed
- **THEN** chart shows tool usage distribution (Read, Edit, Write, Bash, etc.)
- **AND** chart shows success vs failure rate per tool

### Requirement: Activity Summary Generation
The system SHALL generate human-readable summaries of agent activities.

#### Scenario: Session summary
- **WHEN** session completes
- **THEN** summary is generated from hook events
- **AND** summary includes: work accomplished, tools used, duration
- **AND** summary highlights key milestones

#### Scenario: Auto-summarization
- **WHEN** session has >100 events
- **THEN** events are grouped into logical phases
- **AND** summary condenses repetitive actions
- **AND** important events are highlighted

#### Scenario: Export activity log
- **WHEN** user requests activity export
- **THEN** full timeline is exported as JSON or CSV
- **AND** export includes all hook events and metadata
