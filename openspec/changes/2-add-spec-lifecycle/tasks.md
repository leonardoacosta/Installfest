# Implementation Tasks

## 1. Database Schema for Lifecycle
- [ ] 1.1 Update `openspecSpecs` table with status enum
  - [ ] Add status: 'proposing' | 'approved' | 'assigned' | 'in_progress' | 'review' | 'applied' | 'archived'
  - [ ] Add statusChangedAt timestamp
  - [ ] Add statusChangedBy (userId or sessionId reference)
  - [ ] Set default status to 'proposing'
- [ ] 1.2 Create `specLifecycle` table in `packages/db/src/schema/lifecycle.ts`
  - [ ] Add id (auto-increment primary key)
  - [ ] Add specId (foreign key to openspecSpecs)
  - [ ] Add fromState, toState (7-state enum)
  - [ ] Add triggeredBy ('user' | 'system' | 'worker')
  - [ ] Add triggerUserId (nullable), triggerSessionId (nullable)
  - [ ] Add transitionedAt timestamp, notes (nullable text)
  - [ ] Add index: specId + transitionedAt
- [ ] 1.3 Create `appliedSpecs` table for tracking implementations
  - [ ] Add id, specId, projectId (foreign keys)
  - [ ] Add appliedAt timestamp, appliedBy (sessionId)
  - [ ] Add verificationStatus ('pending' | 'tests_passed' | 'tests_failed')
  - [ ] Add verificationNotes (nullable text)
  - [ ] Add index: projectId + specId (unique)
- [ ] 1.4 Run Drizzle migration to create/update tables

## 2. Zod Validators for Lifecycle
- [ ] 2.1 Create lifecycle validators in `packages/validators/src/lifecycle.ts`
  - [ ] `specStatusSchema` - 7-state enum validator
  - [ ] `stateTransitionSchema` - from/to states
  - [ ] `transitionRequestSchema` - user/system transition request
  - [ ] `lifecycleHistorySchema` - state history response
  - [ ] `appliedSpecSchema` - applied spec tracking record

## 3. Transition Rules Engine
- [ ] 3.1 Create transition rules in `packages/api/src/services/transition-rules.ts`
  - [ ] Define state machine graph as adjacency list
  - [ ] `validateTransition(from, to)` - check if transition allowed
  - [ ] `getNextStates(currentState)` - return possible next states
  - [ ] `isManualGate(from, to)` - check if user approval required
- [ ] 3.2 Define allowed transitions
  - [ ] proposing → approved (manual gate)
  - [ ] approved → assigned (automatic)
  - [ ] assigned → in_progress (automatic)
  - [ ] in_progress → review (automatic, triggered by tasks complete)
  - [ ] review → applied (manual gate)
  - [ ] applied → archived (user-triggered)
  - [ ] Any state → proposing (revert/reject)
- [ ] 3.3 Implement automatic transition detection
  - [ ] `checkTasksComplete(specId)` - parse tasks.md, count `[x]` vs `[ ]`
  - [ ] `shouldAutoTransition(specId)` - check if auto-transition criteria met
  - [ ] Return next state if criteria met, null otherwise

## 4. Spec Lifecycle Service
- [ ] 4.1 Create `SpecLifecycleService` in `packages/api/src/services/spec-lifecycle.ts`
  - [ ] Constructor accepts TransitionRulesEngine dependency
  - [ ] `transitionState(specId, toState, triggeredBy, notes?)` - main entry point
  - [ ] `canTransition(specId, toState)` - validate transition allowed
  - [ ] `getStateHistory(specId)` - return lifecycle history
  - [ ] `getCurrentState(specId)` - return current status
- [ ] 4.2 Implement state transition logic
  - [ ] Query current state from openspecSpecs table
  - [ ] Validate transition using TransitionRulesEngine
  - [ ] Check manual gate requirements (user approval for proposing→approved, review→applied)
  - [ ] Update openspecSpecs.status and statusChangedAt
  - [ ] Record transition in specLifecycle table
  - [ ] Wrap in database transaction
- [ ] 4.3 Implement manual gate checks
  - [ ] `requiresUserApproval(fromState, toState)` - check if manual gate
  - [ ] Create notification when manual gate reached
  - [ ] Block automatic progression at gates
- [ ] 4.4 Implement automatic transition triggers
  - [ ] `triggerAutomaticTransitions()` - background job checks all in_progress specs
  - [ ] For each spec: Check if tasks complete → transition to review
  - [ ] Run every 30 seconds via cron job
  - [ ] Log automatic transitions for audit

## 5. Applied Spec Tracking
- [ ] 5.1 Implement applied spec recording
  - [ ] On review → applied transition: Record in appliedSpecs table
  - [ ] Link spec to project where it was applied
  - [ ] Store appliedBy session for attribution
  - [ ] Default verificationStatus to 'pending'
- [ ] 5.2 Implement verification updates
  - [ ] `updateVerification(specId, projectId, status, notes)` - update verification status
  - [ ] User marks tests as passed/failed after applying
  - [ ] Store verification notes for future reference
- [ ] 5.3 Implement applied spec queries
  - [ ] `getAppliedSpecs(projectId)` - all specs applied to project
  - [ ] `getSpecApplications(specId)` - all projects where spec applied
  - [ ] Include verification status in results

## 6. Lifecycle tRPC Router
- [ ] 6.1 Create `packages/api/src/router/lifecycle.ts`
  - [ ] Import SpecLifecycleService
  - [ ] `lifecycle.getStatus({ specId })` - current status + history
  - [ ] `lifecycle.transitionTo({ specId, toState, notes? })` - manual transition
  - [ ] `lifecycle.approve({ specId })` - shortcut for proposing → approved
  - [ ] `lifecycle.markApplied({ specId, verificationNotes })` - shortcut for review → applied
  - [ ] `lifecycle.reject({ specId, reason })` - reject proposal, archive immediately
- [ ] 6.2 Implement lifecycle subscriptions
  - [ ] `lifecycle.subscribe({ projectId?, specId? })` - stream state changes
  - [ ] Emit: state_changed, manual_gate_reached, auto_transition_blocked
  - [ ] Include: specId, fromState, toState, triggeredBy in events
- [ ] 6.3 Implement applied spec endpoints
  - [ ] `lifecycle.getAppliedSpecs({ projectId })` - query applied specs for project
  - [ ] `lifecycle.updateVerification({ specId, projectId, status, notes })` - update verification
- [ ] 6.4 Add to root router in `packages/api/src/root.ts`

## 7. Automatic Transition Background Job
- [ ] 7.1 Create automatic transition cron job in `packages/api/src/services/lifecycle-monitor.ts`
  - [ ] Schedule: every 30 seconds
  - [ ] Query all specs with status = 'in_progress'
  - [ ] For each: Check if all tasks marked `[x]` complete
  - [ ] If complete: Transition to 'review' automatically
  - [ ] Log transitions for debugging
- [ ] 7.2 Implement task completion detection
  - [ ] Parse tasks.md from openspecSpecs.tasksContent
  - [ ] Count lines matching `- [ ]` (incomplete) and `- [x]` (complete)
  - [ ] Calculate completion percentage
  - [ ] Return true if 100% complete
- [ ] 7.3 Handle background job errors
  - [ ] Catch and log parsing errors (malformed tasks.md)
  - [ ] Continue to next spec on error (don't crash job)
  - [ ] Store error in spec for manual investigation

## 8. Testing
- [ ] 8.1 Unit tests for TransitionRulesEngine
  - [ ] Test valid transitions return true
  - [ ] Test invalid transitions return false
  - [ ] Test manual gate detection
  - [ ] Test next states calculation
- [ ] 8.2 Unit tests for SpecLifecycleService
  - [ ] Test state transitions with valid paths
  - [ ] Test invalid transitions throw errors
  - [ ] Test manual gate blocking
  - [ ] Test automatic transition triggering
- [ ] 8.3 Integration tests for state machine
  - [ ] Create spec, walk through full lifecycle: proposing → archived
  - [ ] Test manual approvals (proposing → approved, review → applied)
  - [ ] Test automatic transitions (approved → assigned → in_progress → review)
  - [ ] Verify lifecycle history recorded correctly
- [ ] 8.4 Integration tests for applied spec tracking
  - [ ] Apply spec to project, verify appliedSpecs record created
  - [ ] Query applied specs for project, verify results
  - [ ] Update verification status, verify persisted

## 9. Documentation
- [ ] 9.1 Update homelab-services/docs/architecture.md
  - [ ] Document 7-state lifecycle workflow
  - [ ] Explain manual gates and automatic transitions
- [ ] 9.2 Create API documentation
  - [ ] Document lifecycle router endpoints
  - [ ] Provide state transition examples
  - [ ] Document applied spec tracking
