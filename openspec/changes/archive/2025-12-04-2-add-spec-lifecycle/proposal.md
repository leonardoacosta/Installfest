# Change: Add Spec Lifecycle Management

## Why

OpenSpec specifications currently exist as static files without state tracking. There's no way to know if a spec is awaiting approval, actively being implemented, ready for review, or has been deployed. This creates confusion about which specs are ready for work and which need human decisions.

By implementing a 7-state lifecycle with manual approval gates and automatic transitions, we enable:
- **Clear work status**: Every spec has a well-defined state (proposing → approved → assigned → in_progress → review → applied → archived)
- **Manual gates**: User approval required at critical decision points (proposal approval, implementation validation)
- **Automatic progression**: Specs advance automatically when objective criteria met (all tasks complete → review)
- **State history**: Complete audit trail of all transitions with triggering users/agents
- **Applied spec tracking**: Track which specs have been implemented in each project

This change depends on **1-add-openspec-sync** to have database access to spec data.

## What Changes

### 7-State Lifecycle
- **proposing**: Auto-generated from errors or manually created, awaiting user review
- **approved**: User approved, waiting for assignment to worker
- **assigned**: Worker assigned, preparing to start implementation
- **in_progress**: Worker actively implementing tasks
- **review**: All tasks complete, awaiting user validation
- **applied**: User confirmed implementation successful, tests pass
- **archived**: Moved to archive/ directory via OpenSpec CLI

### Manual Approval Gates
- **proposing → approved**: User must review and explicitly approve spec proposal
- **review → applied**: User must validate implementation and confirm tests pass

### Automatic Transitions
- **approved → assigned**: When worker picks up from work queue
- **assigned → in_progress**: When worker starts first task (first tool execution)
- **in_progress → review**: When all tasks marked `[x]` complete in tasks.md
- **applied → archived**: User-triggered action (runs `openspec archive` command)

### Database Schema
- Update `openspecSpecs` table: Add status field (7-state enum)
- `specLifecycle` table: State transition history with timestamps and triggers
- `appliedSpecs` table: Track which specs implemented in which projects

### Services
- `SpecLifecycleService`: State transition logic, validation rules
- `TransitionRulesEngine`: Validate allowed transitions, detect automatic transition triggers

### API
- tRPC `lifecycle` router: Manual transitions, approval shortcuts, state history queries

## Impact

### Affected Specs
- **spec-lifecycle-management**: ADDED new capability for 7-state workflow with approval gates
- **openspec-integration**: MODIFIED to add status field to openspecSpecs table

### Affected Code
- `homelab-services/packages/db/src/schema/` - New tables: specLifecycle, appliedSpecs; update openspecSpecs
- `homelab-services/packages/api/src/services/` - New services: SpecLifecycleService, TransitionRulesEngine
- `homelab-services/packages/api/src/router/` - New tRPC router: lifecycle.ts
- `homelab-services/packages/validators/src/` - New Zod schemas for lifecycle entities

### Breaking Changes
None. This is purely additive functionality. Existing specs default to 'proposing' status.

### Dependencies
- **Required**: 1-add-openspec-sync (provides openspecSpecs table and sync infrastructure)
- **Existing**: tRPC, Drizzle, Zod, Better-T-Stack architecture
