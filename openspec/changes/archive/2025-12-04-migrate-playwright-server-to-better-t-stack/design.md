# Design Document: Playwright Server Migration + Claude Auto-Remediation

## Context

The `playwright-report-server` currently provides passive test report viewing. GitHub runners write Playwright HTML reports to a shared volume, the server watches for new files, parses them, and stores statistics in SQLite for display in a web UI.

**Current Flow:**
```
GitHub Runner → Playwright Test → HTML Report → /reports volume
                                                      ↓
                                              File Watcher
                                                      ↓
                                              Parse HTML → SQLite
                                                      ↓
                                              Web UI (view reports)
```

**Problem:** When tests fail, developers must:
1. Notice the failure (check dashboard or CI notifications)
2. Review the Playwright report
3. Identify the root cause
4. Write a fix
5. Push code and wait for re-run

This is manual, time-consuming, and often delayed.

**Vision:** Automate the remediation loop using Claude Code:
```
GitHub Runner → Playwright Test → HTML Report → /reports volume
                                                      ↓
                                              File Watcher
                                                      ↓
                                              Parse HTML → SQLite
                                                      ↓
                                              Detect Failure (threshold check)
                                                      ↓
                                              Extract Context (test, error, code location)
                                                      ↓
                                              Send to Claude Agent Server (tRPC)
                                                      ↓
                                              Claude spawns session → Investigates + Fixes
                                                      ↓
                                              Creates PR or Commits Fix
                                                      ↓
                                              Tests Re-Run (GitHub Actions)
                                                      ↓
                                              Validate Fix → Track Success Rate
```

## Goals / Non-Goals

**Goals:**
- Migrate to Better-T-Stack for type safety and scalability
- Detect test failures automatically with configurable thresholds
- Extract rich failure context from Playwright reports
- Send failure events to claude-agent-server for auto-remediation
- Track remediation attempts and success metrics
- Support historical failure analysis (flaky vs persistent)
- Maintain Docker deployment compatibility

**Non-Goals:**
- Replacing Playwright as test framework
- Modifying GitHub runner configuration
- Implementing custom test retry logic (Playwright handles this)
- Real-time test execution monitoring (only post-run analysis)
- Changing report file format or structure

## Decisions

### 1. Failure Detection Threshold Configuration

**Decision:** Implement configurable threshold system with multiple criteria.

**Why:**
- Not all test failures warrant Claude intervention (e.g., single flaky test)
- Different projects may have different tolerance levels
- Prevents Claude from being overwhelmed with noise

**Configuration Options:**
```typescript
interface FailureThreshold {
  enabled: boolean;                    // Master enable/disable
  minFailedTests: number;              // Minimum failed test count (default: 1)
  failureRate: number;                 // Minimum failure rate percentage (default: 0)
  includeFlaky: boolean;               // Trigger on flaky tests (default: false)
  onlyNewFailures: boolean;            // Only trigger for new failures (default: true)
  criticalTestPatterns: string[];      // Regex patterns for critical tests (always trigger)
  excludeTestPatterns: string[];       // Regex patterns to exclude from auto-remediation
}
```

**Storage:** Environment variables or database configuration table

**Alternatives Considered:**
- Fixed threshold: Too rigid, doesn't handle different project needs
- No threshold: Claude gets overwhelmed, wastes resources on non-issues
- ML-based threshold: Over-engineered for current scale

### 2. Claude Integration Method: tRPC Procedure Call

**Decision:** Playwright server calls claude-agent-server's tRPC API with test failure event.

**Why:**
- Type-safe cross-service communication
- claude-agent-server already uses tRPC (after its migration)
- Handles request/response and error handling cleanly
- Can retry on failure with exponential backoff

**API Contract:**
```typescript
// Claude Agent Server exposes:
testFailures.notify({
  source: 'playwright-server',
  workflow: string,
  runId: string,
  runNumber: number,
  reportUrl: string,
  failures: Array<{
    testName: string,
    testFile: string,
    lineNumber: number,
    error: string,
    stackTrace: string,
    isFlaky: boolean,
    previousFailures: number
  }>,
  summary: {
    totalTests: number,
    failed: number,
    passed: number,
    newFailures: number
  }
})
```

**Response:**
```typescript
{
  accepted: boolean,
  sessionId: string | null,  // If Claude session created
  reason?: string            // If rejected (e.g., below threshold)
}
```

**Alternatives Considered:**
- WebSocket push: More complex, requires persistent connection
- Message queue (Redis/RabbitMQ): Over-engineered for single-server deployment
- Custom hook script: Less type-safe, harder to maintain

### 3. Enhanced Report Parsing for Code Context

**Decision:** Extract test file paths and line numbers from Playwright HTML reports.

**Why:**
- Claude needs code location to investigate failures
- Playwright embeds test metadata in HTML (test file, line numbers)
- Enables direct navigation to failing test code

**Extraction Strategy:**
```javascript
// Playwright reports embed data in window.__playwright object
const testData = extractFromScript(html);

// Extract for each failed test:
{
  testName: "User login should validate credentials",
  testFile: "tests/auth/login.spec.ts",
  lineNumber: 42,
  error: "Expected 200, got 401",
  stackTrace: "...",
  annotations: [...],
  attachments: [...]
}
```

**Fallback:** If extraction fails, provide report URL for Claude to fetch manually

**Alternatives Considered:**
- GitHub API to fetch test files: Adds external dependency, slower
- Parse test files directly: Requires cloning repo, complex
- Skip code context: Claude would need to search, less efficient

### 4. Failure Classification: New vs Recurring vs Flaky

**Decision:** Track failure history to classify test failures.

**Why:**
- New failures likely indicate introduced bugs (high priority)
- Recurring failures may be known issues (lower priority)
- Flaky tests need different remediation (fix test, not code)

**Classification Logic:**
```typescript
interface FailureHistory {
  testName: string;
  firstSeen: Date;
  lastSeen: Date;
  occurrences: number;
  consecutiveFailures: number;
  totalRuns: number;
}

function classifyFailure(history: FailureHistory): FailureType {
  if (!history || history.occurrences === 1) {
    return 'NEW';
  }

  const failureRate = history.occurrences / history.totalRuns;

  if (failureRate < 0.3 && history.consecutiveFailures < 3) {
    return 'FLAKY';
  }

  if (history.consecutiveFailures >= 3) {
    return 'PERSISTENT';
  }

  return 'RECURRING';
}
```

**Database Schema Addition:**
```sql
CREATE TABLE failure_history (
  id INTEGER PRIMARY KEY,
  test_name TEXT NOT NULL UNIQUE,
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  occurrences INTEGER DEFAULT 1,
  consecutive_failures INTEGER DEFAULT 1,
  total_runs INTEGER DEFAULT 1
);
```

**Alternatives Considered:**
- No classification: Treats all failures equally, misses patterns
- External ML service: Over-engineered, adds dependency
- Manual tagging: Defeats automation purpose

### 5. Remediation Tracking

**Decision:** Store remediation attempts and outcomes in database.

**Why:**
- Track Claude's success rate at fixing tests
- Identify tests that Claude struggles with (may need human intervention)
- Provide feedback loop for improving prompts

**Schema:**
```sql
CREATE TABLE remediation_attempts (
  id INTEGER PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id),
  test_name TEXT NOT NULL,
  claude_session_id TEXT,
  triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  status TEXT, -- 'pending', 'in_progress', 'fixed', 'failed', 'skipped'
  fix_description TEXT,
  pr_url TEXT,
  rerun_report_id INTEGER REFERENCES reports(id),
  rerun_passed BOOLEAN
);
```

**Metrics to Track:**
- Success rate (fixed / total attempts)
- Time to fix (completed_at - triggered_at)
- Tests fixed on first attempt vs multiple attempts
- Tests that consistently fail remediation

**Alternatives Considered:**
- No tracking: Can't measure effectiveness
- External analytics: Over-complicated
- Manual logging: Not queryable, hard to analyze

### 6. Frontend Updates

**Decision:** Add failure dashboard and remediation history to React UI.

**Why:**
- Visibility into Claude's automation activities
- Manual override capability (disable auto-remediation per test)
- Historical performance metrics

**New UI Components:**
- Failure Dashboard: Active failures with remediation status
- Remediation History: Past attempts with success/failure
- Configuration Panel: Adjust thresholds and exclusions
- Test Health: Identify flaky tests, persistent failures

**Alternatives Considered:**
- Separate admin UI: Fragmented experience
- CLI-only config: Less accessible
- No UI updates: Lose visibility into automation

## Risks / Trade-offs

### Risk: Claude Fixes Wrong Thing

**Scenario:** Test fails because code has a bug, but Claude "fixes" the test to pass incorrectly

**Mitigation:**
- Claude should analyze test intent before modifying
- Include test history in context (if test passed before, likely code issue not test issue)
- Human review of Claude's PRs before merge
- Track remediation success rate, flag low-success tests for review

### Risk: Overwhelming Claude with Failures

**Scenario:** Build breaks, 50 tests fail, Claude gets 50 remediation requests

**Mitigation:**
- Batch failures from same run into single Claude session
- Send summary: "10 tests failed in auth module" not 10 separate requests
- Configurable threshold prevents triggers on low-priority failures
- Rate limiting on Claude session creation (e.g., max 1 per workflow per hour)

### Risk: False Positives on Flaky Tests

**Scenario:** Flaky test fails, Claude investigates, but test passes on retry

**Mitigation:**
- Classification system identifies flaky tests
- Optionally exclude flaky tests from auto-remediation
- Focus Claude on fixing flakiness itself (add retries, wait for conditions)
- Track flaky test patterns, alert developers to stabilize

### Risk: Integration Dependency

**Scenario:** claude-agent-server is down, playwright-server can't send events

**Mitigation:**
- Graceful degradation: log event, continue operation
- Retry queue with exponential backoff
- Store unsent events in database, batch-send on reconnection
- Optional feature: can disable Claude integration entirely

### Trade-off: Automatic vs Manual Trigger

**Automatic:** Fast response, but may create noise

**Manual:** Human judgment, but slower response and defeats automation

**Decision:** Automatic with safeguards:
- Configurable thresholds prevent noise
- Dashboard allows manual disable per test
- Claude creates PRs, not direct commits (human review gate)

## Migration Plan

### Phase 1: Better-T-Stack Scaffolding (Day 1)
- Generate Better-T-Stack template
- Configure monorepo workspaces
- Set up Turborepo

### Phase 2: Database Schema Extension (Day 1-2)
- Define Drizzle schemas for existing reports table
- Add new tables: failure_history, remediation_attempts, threshold_config
- Generate migrations
- Test migration with existing data

### Phase 3: Enhanced Report Parsing (Day 2-3)
- Extract report parsing logic to shared package
- Enhance parser to extract test file paths and line numbers
- Implement failure classification logic
- Add historical tracking

### Phase 4: tRPC API Implementation (Day 3-4)
- Migrate REST endpoints to tRPC procedures
- Implement new procedures: failures.classify, failures.notify, remediation.list
- Add WebSocket subscriptions for real-time updates

### Phase 5: Claude Integration (Day 4-5)
- Implement threshold evaluation logic
- Create tRPC client for claude-agent-server
- Build failure notification system with retry/queue
- Add remediation tracking

### Phase 6: Frontend Migration (Day 5-6)
- Set up React + TanStack Router
- Implement type-safe tRPC queries
- Build new dashboards (failures, remediation history)
- Add configuration UI

### Phase 7: Docker & Testing (Day 6-7)
- Update Dockerfile for monorepo
- Add environment variables for Claude integration
- End-to-end testing with real test failures
- Deploy to homelab

**Rollback Plan:**
- Database migration is backward-compatible (new tables don't affect old code)
- Can disable Claude integration via environment variable
- Old Docker image available for quick rollback
- Estimated rollback time: 10 minutes

## Open Questions

### 1. Should Claude integration be opt-in or opt-out per project?

**Status:** Decided - Opt-in via environment variable

**Rationale:** Conservative approach, projects can enable when ready

### 2. How aggressive should threshold defaults be?

**Status:** Decided - Conservative defaults (minFailedTests=3, onlyNewFailures=true)

**Rationale:** Start cautious, tune based on real-world usage

### 3. Should Claude create PRs or direct commits?

**Status:** Decided - PRs for review

**Rationale:** Safety gate, allows human oversight before merge

### 4. How to handle authentication between services?

**Status:** Decided - Deferred to future (both services in homelab, trusted network)

**Rationale:** Add token auth later if services become internet-exposed

### 5. Should we support multiple Claude servers (load balancing)?

**Status:** Decided - Single claude-agent-server for v1

**Rationale:** Scale vertically first, horizontal scaling if needed later

## Success Metrics

**Technical Metrics:**
- Report parsing success rate > 95%
- Failure detection latency < 30 seconds from report creation
- Claude notification latency < 5 seconds
- Zero data loss during migration

**Remediation Metrics:**
- Test fixes automatically within 1 hour of failure
- Remediation success rate > 60% (first attempt)
- False positive rate < 10% (Claude fixing wrong thing)
- Flaky test identification accuracy > 80%

**Developer Experience:**
- Reduced time to fix test failures (measure before/after)
- Dashboard provides actionable insights
- Configuration changes take effect immediately
- Manual override available when needed

**Operational Metrics:**
- Docker deployment successful
- Service uptime maintained during migration
- Integration with claude-agent-server stable
- Rollback executed successfully if needed
