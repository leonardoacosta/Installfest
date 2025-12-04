# Implementation Tasks

## 1. Database Schema for Lifecycle
- [x] 1.1 Update `openspecSpecs` table with status enum
  - [x] Add status: 'proposing' | 'approved' | 'assigned' | 'in_progress' | 'review' | 'applied' | 'archived'
  - [x] Add statusChangedAt timestamp
  - [x] Add statusChangedBy (userId or sessionId reference)
  - [x] Set default status to 'proposing'
- [x] 1.2 Create `specLifecycle` table in `packages/db/src/schema/lifecycle.ts`
  - [x] Add id (auto-increment primary key)
  - [x] Add specId (foreign key to openspecSpecs)
  - [x] Add fromState, toState (7-state enum)
  - [x] Add triggeredBy ('user' | 'system' | 'worker')
  - [x] Add triggerUserId (nullable), triggerSessionId (nullable)
  - [x] Add transitionedAt timestamp, notes (nullable text)
  - [x] Add index: specId + transitionedAt
- [x] 1.3 Create `appliedSpecs` table for tracking implementations
  - [x] Add id, specId, projectId (foreign keys)
  - [x] Add appliedAt timestamp, appliedBy (sessionId)
  - [x] Add verificationStatus ('pending' | 'tests_passed' | 'tests_failed')
  - [x] Add verificationNotes (nullable text)
  - [x] Add index: projectId + specId (unique)
- [x] 1.4 Run Drizzle migration to create/update tables

## 2. Zod Validators for Lifecycle
- [x] 2.1 Create lifecycle validators in `packages/validators/src/lifecycle.ts`
  - [x] `specStatusSchema` - 7-state enum validator
  - [x] `stateTransitionSchema` - from/to states
  - [x] `transitionRequestSchema` - user/system transition request
  - [x] `lifecycleHistorySchema` - state history response
  - [x] `appliedSpecSchema` - applied spec tracking record

## 3. Transition Rules Engine
- [x] 3.1 Create transition rules in `packages/api/src/services/transition-rules.ts`
  - [x] Define state machine graph as adjacency list
  - [x] `validateTransition(from, to)` - check if transition allowed
  - [x] `getNextStates(currentState)` - return possible next states
  - [x] `isManualGate(from, to)` - check if user approval required
- [x] 3.2 Define allowed transitions
  - [x] proposing → approved (manual gate)
  - [x] approved → assigned (automatic)
  - [x] assigned → in_progress (automatic)
  - [x] in_progress → review (automatic, triggered by tasks complete)
  - [x] review → applied (manual gate)
  - [x] applied → archived (user-triggered)
  - [x] Any state → proposing (revert/reject)
- [x] 3.3 Implement automatic transition detection
  - [x] `checkTasksComplete(specId)` - parse tasks.md, count `[x]` vs `[ ]`
  - [x] `shouldAutoTransition(specId)` - check if auto-transition criteria met
  - [x] Return next state if criteria met, null otherwise

## 4. Spec Lifecycle Service
- [x] 4.1 Create `SpecLifecycleService` in `packages/api/src/services/spec-lifecycle.ts`
  - [x] Constructor accepts TransitionRulesEngine dependency
  - [x] `transitionState(specId, toState, triggeredBy, notes?)` - main entry point
  - [x] `canTransition(specId, toState)` - validate transition allowed
  - [x] `getStateHistory(specId)` - return lifecycle history
  - [x] `getCurrentState(specId)` - return current status
- [x] 4.2 Implement state transition logic
  - [x] Query current state from openspecSpecs table
  - [x] Validate transition using TransitionRulesEngine
  - [x] Check manual gate requirements (user approval for proposing→approved, review→applied)
  - [x] Update openspecSpecs.status and statusChangedAt
  - [x] Record transition in specLifecycle table
  - [x] Wrap in database transaction
- [x] 4.3 Implement manual gate checks
  - [x] `requiresUserApproval(fromState, toState)` - check if manual gate
  - [x] Create notification when manual gate reached
  - [x] Block automatic progression at gates
- [x] 4.4 Implement automatic transition triggers
  - [x] `triggerAutomaticTransitions()` - background job checks all in_progress specs
  - [x] For each spec: Check if tasks complete → transition to review
  - [x] Run every 30 seconds via cron job
  - [x] Log automatic transitions for audit

## 5. Applied Spec Tracking
- [x] 5.1 Implement applied spec recording
  - [x] On review → applied transition: Record in appliedSpecs table
  - [x] Link spec to project where it was applied
  - [x] Store appliedBy session for attribution
  - [x] Default verificationStatus to 'pending'
- [x] 5.2 Implement verification updates
  - [x] `updateVerification(specId, projectId, status, notes)` - update verification status
  - [x] User marks tests as passed/failed after applying
  - [x] Store verification notes for future reference
- [x] 5.3 Implement applied spec queries
  - [x] `getAppliedSpecs(projectId)` - all specs applied to project
  - [x] `getSpecApplications(specId)` - all projects where spec applied
  - [x] Include verification status in results

## 6. Lifecycle tRPC Router
- [x] 6.1 Create `packages/api/src/router/lifecycle.ts`
  - [x] Import SpecLifecycleService
  - [x] `lifecycle.getStatus({ specId })` - current status + history
  - [x] `lifecycle.transitionTo({ specId, toState, notes? })` - manual transition
  - [x] `lifecycle.approve({ specId })` - shortcut for proposing → approved
  - [x] `lifecycle.markApplied({ specId, verificationNotes })` - shortcut for review → applied
  - [x] `lifecycle.reject({ specId, reason })` - reject proposal, archive immediately
- [ ] 6.2 Implement lifecycle subscriptions (DEFERRED - not critical for core functionality)
  - [ ] `lifecycle.subscribe({ projectId?, specId? })` - stream state changes
  - [ ] Emit: state_changed, manual_gate_reached, auto_transition_blocked
  - [ ] Include: specId, fromState, toState, triggeredBy in events
- [x] 6.3 Implement applied spec endpoints
  - [x] `lifecycle.getAppliedSpecs({ projectId })` - query applied specs for project
  - [x] `lifecycle.updateVerification({ specId, projectId, status, notes })` - update verification
- [x] 6.4 Add to root router in `packages/api/src/root.ts`

## 7. Automatic Transition Background Job
- [x] 7.1 Create automatic transition cron job in `packages/api/src/services/lifecycle-monitor.ts`
  - [x] Schedule: every 30 seconds
  - [x] Query all specs with status = 'in_progress'
  - [x] For each: Check if all tasks marked `[x]` complete
  - [x] If complete: Transition to 'review' automatically
  - [x] Log transitions for debugging
- [x] 7.2 Implement task completion detection
  - [x] Parse tasks.md from openspecSpecs.tasksContent
  - [x] Count lines matching `- [ ]` (incomplete) and `- [x]` (complete)
  - [x] Calculate completion percentage
  - [x] Return true if 100% complete
- [x] 7.3 Handle background job errors
  - [x] Catch and log parsing errors (malformed tasks.md)
  - [x] Continue to next spec on error (don't crash job)
  - [x] Store error in spec for manual investigation

## 8. Testing
- [x] 8.1 Unit tests for TransitionRulesEngine
  - [x] Test valid transitions return true
  - [x] Test invalid transitions return false
  - [x] Test manual gate detection
  - [x] Test next states calculation
- [ ] 8.2 Unit tests for SpecLifecycleService (DEFERRED - require database mocking)
  - [ ] Test state transitions with valid paths
  - [ ] Test invalid transitions throw errors
  - [ ] Test manual gate blocking
  - [ ] Test automatic transition triggering
- [ ] 8.3 Integration tests for state machine (DEFERRED - require test database setup)
  - [ ] Create spec, walk through full lifecycle: proposing → archived
  - [ ] Test manual approvals (proposing → approved, review → applied)
  - [ ] Test automatic transitions (approved → assigned → in_progress → review)
  - [ ] Verify lifecycle history recorded correctly
- [ ] 8.4 Integration tests for applied spec tracking (DEFERRED - require test database setup)
  - [ ] Apply spec to project, verify appliedSpecs record created
  - [ ] Query applied specs for project, verify results
  - [ ] Update verification status, verify persisted

**Note**: Tests 8.2-8.4 are deferred as they require complex database mocking/setup. Core functionality is validated through:
- TransitionRulesEngine unit tests (passing)
- Successful TypeScript compilation
- Build verification across all packages

## 9. Documentation
- [x] 9.1 Update homelab-services/docs/architecture.md
  - [x] Document 7-state lifecycle workflow
  - [x] Explain manual gates and automatic transitions
- [x] 9.2 Create API documentation
  - [x] Document lifecycle router endpoints
  - [x] Provide state transition examples
  - [x] Document applied spec tracking
