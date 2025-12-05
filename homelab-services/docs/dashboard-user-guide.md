# Dashboard User Guide

Complete guide to using the Unified Work Dashboard for managing OpenSpec changes, work queue, and agent coordination.

**Access:** `http://localhost:3002/dashboard`

## Table of Contents

- [Getting Started](#getting-started)
- [Dashboard Overview](#dashboard-overview)
- [How to Approve Specs](#how-to-approve-specs)
- [How to Edit Specs](#how-to-edit-specs)
- [How to Monitor Workers](#how-to-monitor-workers)
- [How to Respond to Clarifications](#how-to-respond-to-clarifications)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Claude Agent Web application running on port 3002
- Database initialized with projects and sessions
- OpenSpec changes directory (`openspec/changes/`) accessible

### First-time Setup

1. **Start the development server:**
   ```bash
   cd homelab-services/apps/claude-agent-web
   bun run dev
   ```

2. **Access the dashboard:**
   - Open browser to `http://localhost:3002/dashboard`
   - Dashboard loads with Work Queue tab active by default

3. **Verify real-time features:**
   - Check browser console for successful WebSocket connection
   - Look for `[tRPC]` subscription logs confirming real-time updates

## Dashboard Overview

### Layout

The dashboard consists of:

1. **Header Section**
   - Page title and description
   - Stats cards showing aggregate metrics

2. **Filter Sidebar** (left)
   - Project dropdown
   - Status filters
   - Priority slider
   - Date range picker
   - Search input

3. **Main Content Area** (center)
   - Tab navigation (Work Queue, Approvals, Master Agents, Lifecycle)
   - Active tab content

### Stats Cards

Four summary cards at the top:

- **Total Specs:** Count of all OpenSpec changes
- **Active Work:** Number of items currently in work queue
- **Pending Approvals:** Specs awaiting review (proposing + review states)
- **Error Proposals:** Auto-generated proposals from test failures

Stats refresh automatically when data changes.

### Tab Navigation

Click any tab to switch views:

- **Work Queue** - Manage all work items
- **Approvals** - Review and approve specs
- **Master Agents** - Monitor worker agents
- **Lifecycle** - Visualize spec transitions

**Persistence:** Active tab saved to URL (e.g., `?tab=approvals`) for bookmarking.

## How to Approve Specs

### Step-by-Step Process

#### 1. Navigate to Approvals Tab

Click **Approvals** in the tab navigation.

#### 2. Locate Spec in "Needs Approval" Section

Specs in `proposing` state appear here awaiting initial review.

**Table Columns:**
- **Spec ID** - Unique identifier (e.g., `6-add-work-dashboard`)
- **Type** - Badge showing "Spec" (manual) or "Error" (auto-generated)
- **Priority** - Star rating (1-5)
- **Created** - Timestamp (relative, e.g., "2 days ago")
- **Actions** - View, Approve, Edit, Reject buttons

#### 3. Review Proposal Content

Click **View** (Eye icon) to open detail modal.

**Modal Contents:**
- **Header:** Title, type badge, priority, created date
- **Proposal Tab:** Full proposal.md rendered as markdown
  - **Why** section explaining the change
  - **What Changes** section detailing modifications
  - **Impact** section describing consequences
- **Tasks Tab:** tasks.md checklist with all implementation steps

**Review Checklist:**
- [ ] Does the "Why" section clearly justify the change?
- [ ] Are the "What Changes" specific and complete?
- [ ] Do tasks cover all necessary implementation steps?
- [ ] Is the priority appropriate (1-5)?
- [ ] Are there any dependencies on other specs?

#### 4. Approve or Reject

**Option A: Approve**
1. Click **Approve** button in modal footer
2. Toast notification: "Spec approved and added to work queue"
3. Spec transitions: `proposing` → `approved`
4. Spec appears in **Work Queue** tab

**Option B: Edit & Approve**
1. Click **Edit** button to open spec editor
2. Make necessary changes to proposal.md or tasks.md
3. Click **Save & Approve** in editor
4. Spec saved and approved in one action

**Option C: Reject**
1. Click **Reject** button
2. Rejection dialog appears
3. Enter reason for rejection (required)
4. Click "Confirm Reject"
5. Spec transitions: `proposing` → `archived`
6. Toast notification: "Spec rejected and archived"

### Approval Best Practices

- **Review thoroughly:** Read entire proposal and task list
- **Check dependencies:** Ensure prerequisite specs are complete
- **Validate priority:** Adjust if needed before approving
- **Provide feedback:** Use rejection reason to guide improvements
- **Edit first:** Prefer "Edit & Approve" for minor corrections

### Validating Completed Work

Specs completed by workers appear in **"Needs Validation"** section.

#### Validation Process

1. **Navigate to Approvals tab** → "Needs Validation" section
2. **Click View** on completed spec
3. **Review completed tasks:**
   - Check all tasks marked `[x]` complete
   - Review proposal.md for context
4. **Validate or Request Changes:**
   - **Validate & Apply:** Marks spec as applied (transitions `review` → `applied`)
   - **Request Changes:** Send feedback (placeholder, not yet implemented)

**Validation Checklist:**
- [ ] All tasks marked complete in tasks.md
- [ ] No failed tests or errors reported
- [ ] Changes match proposal expectations
- [ ] Worker detail shows successful completion

## How to Edit Specs

### Opening the Spec Editor

**From Any Tab:**
1. Locate spec in table
2. Click **Edit** button (Edit icon)
3. Spec editor opens at `/dashboard/spec-editor/[id]`

### Editor Interface

**Three Tabs:**

1. **Proposal Tab**
   - Monaco editor with markdown syntax highlighting
   - Edit proposal.md content
   - Required sections: Why, What Changes, Impact

2. **Tasks Tab**
   - Monaco editor with markdown
   - Edit tasks.md checklist
   - Live task completion percentage displayed

3. **Design Tab**
   - Optional design.md file
   - Shows "Create Design" button if not exists
   - Monaco editor once created

### Editing Workflow

#### 1. Select Tab to Edit

Click **Proposal**, **Tasks**, or **Design** tab.

#### 2. Make Changes

Use Monaco editor features:
- Syntax highlighting for markdown
- Line numbers
- Find and replace
- Multi-cursor editing
- Code folding

**See [Keyboard Shortcuts](#keyboard-shortcuts) section for full list.**

#### 3. Save Changes

**Option A: Save**
1. Click **Save** button
2. Changes written to filesystem
3. Toast notification: "Saved successfully"
4. Queries invalidated to refresh UI

**Option B: Save & Approve** (for proposing specs)
1. Click **Save & Approve** button
2. Saves changes to filesystem
3. Approves spec (transitions `proposing` → `approved`)
4. Redirects to Work Queue tab
5. Toast notification: "Spec approved and added to work queue"

**Option C: Cancel**
1. Click **Cancel** button
2. If unsaved changes: Confirmation dialog appears
3. Confirm to discard changes
4. Returns to previous page

### Editing Best Practices

- **Save frequently:** Use Ctrl/Cmd+S to save often
- **Check task completion:** Monitor percentage as you edit tasks
- **Use design.md sparingly:** Only for complex architectural changes
- **Preview markdown:** Mental rendering or use external previewer
- **Validate before saving:** Check for required sections

### Creating design.md

If spec requires architectural documentation:

1. **Navigate to Design tab**
2. **Click "Create Design" button**
3. **Template auto-generates with sections:**
   - Overview
   - Architecture
   - Database Schema
   - API Design
   - Security Considerations
   - Performance Considerations
4. **Fill in relevant sections**
5. **Save when complete**

## How to Monitor Workers

### Viewing Active Workers

#### 1. Navigate to Master Agents Tab

Click **Master Agents** in tab navigation.

#### 2. View Worker Cards

Workers displayed in responsive grid (3 cols desktop, 2 tablet, 1 mobile).

**Card Information:**
- **Agent Type Badge:** T3 Stack, E2E Tests, Database, UX Design, Docker, Redis, General
- **Status Badge:** Spawned (blue), Working (green), Completed (gray), Failed (red), Cancelled (gray)
- **Worker ID:** Truncated ID (hover for full ID)
- **Spec ID:** Link to spec details
- **Session ID:** Associated session
- **Time Elapsed:** "Started 5m ago" or "Spawned 10s ago"
- **Progress Bar:** Completion percentage (for active workers)
- **Error Message:** Displayed if failed

### Worker Actions

**Cancel Active Worker:**
1. Locate active worker card (Working status)
2. Click **Cancel** button (Square icon)
3. Confirmation: Worker stopped
4. Toast notification: "Worker cancelled"

**Retry Failed Worker:**
1. Locate failed worker card (Failed status)
2. Click **Retry** button (Zap icon)
3. New worker spawned with same spec
4. Toast notification: "Worker retry initiated"

**View Worker Details:**
1. Click **View Details** button (Activity icon)
2. Worker detail modal opens

### Worker Detail Modal

**Progress Metrics:**
- **Tools Executed:** Count of tool calls made
- **Success Rate:** Percentage of successful tool executions
- **Files Changed:** Number of files modified
- **Tests Run:** Count of test executions (if applicable)

**Timing Information:**
- **Spawned At:** Initial spawn timestamp
- **Started At:** When worker began executing
- **Completed At:** Finish timestamp (if completed)
- **Duration:** Total elapsed time

**Hook Timeline:**
- Last 50 hook events
- Tool names and results
- Chronological order (newest first)
- Success/failure indicators

**Files Changed:**
- List of modified file paths
- Useful for verifying worker actions

**Error Details:**
- Full error message for failed workers
- Stack trace (if available)
- Retry attempts count

### Monitoring Best Practices

- **Check progress regularly:** Workers show real-time progress bars
- **Review failures promptly:** Failed workers require attention
- **Use detail modal:** Deep dive into worker execution
- **Cancel if stuck:** Workers not progressing can be cancelled
- **Retry thoughtfully:** Understand failure before retrying

## How to Respond to Clarifications

> **Note:** Clarifications feature is a placeholder for future implementation.

### Current Status

The **Clarifications Panel** on Master Agents tab shows:
- Empty state: "No pending clarifications"
- Message: "Clarifications will appear here when workers need user input to proceed"

### Future Implementation

When implemented, clarifications will:
1. Appear when worker needs user decision
2. Display question from worker
3. Provide radio button options
4. Submit button to send response
5. Worker resumes after receiving answer

**Stay tuned for this feature in a future update.**

## Keyboard Shortcuts

### Spec Editor Shortcuts

All standard Monaco editor shortcuts available:

#### File Operations
- **Ctrl/Cmd + S** - Save current file
- **Ctrl/Cmd + Shift + S** - Save all files (not applicable, single file at a time)

#### Editing
- **Ctrl/Cmd + Z** - Undo
- **Ctrl/Cmd + Shift + Z** - Redo (or Ctrl/Cmd + Y)
- **Ctrl/Cmd + X** - Cut line (or selection)
- **Ctrl/Cmd + C** - Copy line (or selection)
- **Ctrl/Cmd + V** - Paste
- **Ctrl/Cmd + Shift + K** - Delete line
- **Ctrl/Cmd + /** - Toggle line comment
- **Ctrl/Cmd + /** (block) - Toggle block comment

#### Navigation
- **Ctrl/Cmd + F** - Find in file
- **Ctrl/Cmd + H** - Find and replace
- **Ctrl/Cmd + G** - Go to line
- **Ctrl/Cmd + Shift + O** - Go to symbol (outline)
- **F12** - Go to definition
- **Alt + F12** - Peek definition

#### Selection
- **Ctrl/Cmd + D** - Add selection to next find match
- **Ctrl/Cmd + Shift + L** - Select all occurrences of find match
- **Ctrl/Cmd + L** - Select current line
- **Shift + Alt + I** - Insert cursor at end of each line selected

#### Line Manipulation
- **Alt + Up/Down** - Move line up/down
- **Shift + Alt + Up/Down** - Copy line up/down
- **Ctrl/Cmd + Enter** - Insert line below
- **Ctrl/Cmd + Shift + Enter** - Insert line above

#### Multi-Cursor
- **Alt + Click** - Insert cursor
- **Ctrl/Cmd + Alt + Up/Down** - Insert cursor above/below

#### View
- **Ctrl/Cmd + =** - Zoom in
- **Ctrl/Cmd + -** - Zoom out
- **Ctrl/Cmd + B** - Toggle sidebar (not applicable in modal)

### Dashboard Navigation Shortcuts

**Browser shortcuts only (no custom shortcuts implemented):**
- **Ctrl/Cmd + R** - Refresh page
- **Ctrl/Cmd + T** - New tab
- **Ctrl/Cmd + W** - Close tab
- **Ctrl/Cmd + Shift + T** - Reopen closed tab

## Common Workflows

### Complete Workflow: From Proposal to Applied

#### 1. Create/Receive Spec Proposal

Specs created via `/openspec:proposal` command or error automation.

#### 2. Approve Spec
1. Navigate to **Approvals** tab
2. Find spec in "Needs Approval"
3. Click **View** → Review proposal and tasks
4. Click **Approve**
5. Spec moves to **Work Queue** tab

#### 3. Assign to Session
1. Navigate to **Work Queue** tab
2. Find approved spec
3. Click **Assign to Me**
4. Worker automatically spawned

#### 4. Monitor Progress
1. Navigate to **Master Agents** tab
2. View active worker card
3. Check progress bar and status
4. Click **View Details** for deeper insights

#### 5. Validate Completion
1. Worker completes (spec moves to `review` state)
2. Navigate to **Approvals** tab
3. Find spec in "Needs Validation"
4. Click **View** → Review completed tasks
5. Click **Validate & Apply**
6. Spec marked as applied

#### 6. View History
1. Navigate to **Lifecycle** tab
2. Select spec from dropdown
3. View full timeline of transitions
4. See who triggered each state change

### Quick Approval Workflow

For trusted or minor changes:

1. **Approvals** tab → "Needs Approval"
2. Quick scan of proposal title and priority
3. Click **Approve** directly (skip View modal)
4. Spec immediately added to work queue

### Bulk Reordering Workflow

To reprioritize multiple work items:

1. **Work Queue** tab
2. Drag items using grip icon (≡)
3. Reorder from highest to lowest priority
4. Release to save (syncs to server)
5. Optimistic UI updates immediately

### Error Proposal Review Workflow

When test failures generate proposals:

1. Check **Error Proposals** stat card for count
2. Navigate to `/errors` page (not dashboard tab)
3. Review error classification and priority
4. Approve to add to work queue
5. Returns to **Work Queue** tab in dashboard

## Troubleshooting

### Dashboard Not Loading

**Symptoms:** Blank page or "Loading..." spinner indefinitely

**Solutions:**
1. Check dev server running:
   ```bash
   cd homelab-services/apps/claude-agent-web
   bun run dev
   ```
2. Verify port 3002 not in use:
   ```bash
   lsof -i :3002
   ```
3. Check browser console for errors
4. Clear browser cache and reload

### Subscriptions Not Updating

**Symptoms:** No real-time updates, manual refresh required

**Solutions:**
1. Check browser console for WebSocket errors
2. Verify tRPC server running (part of Next.js dev server)
3. Look for `[tRPC]` subscription logs
4. Refresh page to reconnect subscriptions
5. Check network tab for failed requests

### Spec Editor Not Saving

**Symptoms:** "Saved successfully" toast not appearing, changes not persisted

**Solutions:**
1. Check file permissions on `openspec/changes/` directory:
   ```bash
   ls -la openspec/changes/[spec-id]/
   ```
2. Verify spec ID exists:
   ```bash
   ls openspec/changes/ | grep [spec-id]
   ```
3. Check server logs for sync errors:
   ```bash
   # In terminal running dev server
   # Look for tRPC mutation errors
   ```
4. Ensure proposal.md, tasks.md exist in spec directory
5. Try smaller edit to isolate issue

### Drag-and-Drop Not Working

**Symptoms:** Cannot grab rows, drag icon not appearing

**Solutions:**
1. Verify @dnd-kit packages installed:
   ```bash
   cd homelab-services
   grep "@dnd-kit" package.json
   ```
2. Check JavaScript errors in console
3. Refresh page to reset drag context
4. Try different browser (Firefox, Chrome, Safari)
5. Check if table has multiple rows (need 2+ to reorder)

### Worker Detail Modal Empty

**Symptoms:** Modal opens but shows no data

**Solutions:**
1. Worker may not have metrics yet (just spawned)
2. Wait for worker to start executing tools
3. Check if worker status is "Spawned" (no activity yet)
4. Completed workers retain full history (should show data)
5. Check browser console for API errors

### Stats Cards Showing Zero

**Symptoms:** All stats show "0" or "—"

**Solutions:**
1. Verify database has data:
   ```bash
   # Check if specs exist
   ls openspec/changes/
   ```
2. Ensure project initialized in database
3. Check tRPC query errors in console
4. Refresh page to re-query
5. Verify correct project selected in filter

### Filters Not Applying

**Symptoms:** Filter changes don't affect table results

**Solutions:**
1. Click **Apply Filters** button (if present)
2. Some filters client-side, some server-side (check implementation)
3. Refresh page if filters seem stuck
4. Clear filters and reapply one at a time
5. Check console for filter query errors

### Toast Notifications Not Appearing

**Symptoms:** Actions succeed but no confirmation message

**Solutions:**
1. Check if Toaster component mounted (should be in dashboard page)
2. Verify react-hot-toast installed:
   ```bash
   grep "react-hot-toast" package.json
   ```
3. Check browser console for toast errors
4. Look for `<Toaster />` component in page source
5. Toasts may be hidden behind modal (check z-index)

## Additional Resources

- **OpenSpec Specification:** [specs/unified-work-dashboard](../../openspec/specs/unified-work-dashboard/)
- **Architecture Guide:** [homelab-services/docs/architecture.md](./architecture.md)
- **Development Guide:** [homelab-services/docs/development.md](./development.md)
- **E2E Tests:** [apps/claude-agent-web/e2e/dashboard.spec.ts](../apps/claude-agent-web/e2e/dashboard.spec.ts)
- **CLAUDE.md Dashboard Section:** [CLAUDE.md#unified-work-dashboard](../../CLAUDE.md#unified-work-dashboard)

## Feedback and Support

For issues, feature requests, or questions:

1. **Check GitHub Issues:** Search for existing issues
2. **Review E2E Tests:** See expected behavior in test suite
3. **Consult OpenSpec:** Reference formal specification
4. **Check Server Logs:** Review Next.js dev server output

---

**Last Updated:** 2025-12-05
**Dashboard Version:** Phase 6.10 (Change 6 Complete)
