# Claude Agent Server Specification

## ADDED Requirements

### Requirement: Monorepo Workspace Structure

The system SHALL organize code as a monorepo using Better-T-Stack conventions with separate apps and shared packages.

#### Scenario: Workspace organization

- **WHEN** the project is structured
- **THEN** it contains `apps/` for applications and `packages/` for shared code
- **AND** uses workspace protocol for internal dependencies

#### Scenario: Build orchestration

- **WHEN** running builds
- **THEN** Turborepo coordinates builds across all workspaces
- **AND** leverages caching for unchanged packages

### Requirement: Type-Safe API Layer with tRPC

The system SHALL provide type-safe API communication using tRPC procedures instead of REST endpoints.

#### Scenario: API procedure definition

- **WHEN** defining an API endpoint
- **THEN** it is implemented as a tRPC procedure with input/output validation
- **AND** types are automatically inferred on the client

#### Scenario: Frontend API consumption

- **WHEN** the frontend calls an API
- **THEN** it uses the tRPC client with full TypeScript autocomplete
- **AND** receives compile-time errors for invalid parameters

#### Scenario: Runtime validation

- **WHEN** invalid data is sent to a procedure
- **THEN** Zod validation rejects the request before handler execution
- **AND** returns typed error response

### Requirement: Drizzle ORM Database Layer

The system SHALL use Drizzle ORM for type-safe database operations instead of raw SQLite3 queries.

#### Scenario: Schema definition

- **WHEN** defining database tables
- **THEN** schemas are written as Drizzle table definitions in TypeScript
- **AND** migrations are generated from schema changes

#### Scenario: Type-safe queries

- **WHEN** querying the database
- **THEN** Drizzle provides fully typed query builder
- **AND** prevents invalid column references at compile time

#### Scenario: Database migrations

- **WHEN** schema changes are made
- **THEN** Drizzle generates migration SQL files
- **AND** migrations can be applied programmatically or via CLI

### Requirement: Shared Validation Schemas

The system SHALL define shared Zod validators in a central package for use across frontend and backend.

#### Scenario: Schema reuse

- **WHEN** validating user input
- **THEN** both client and server use identical Zod schemas from shared package
- **AND** validation logic remains consistent

#### Scenario: Type derivation

- **WHEN** a validator is defined
- **THEN** TypeScript types can be derived using `z.infer<>`
- **AND** eliminates manual type/validator duplication

### Requirement: Project Management API

The system SHALL provide tRPC procedures for creating, listing, updating, and deleting projects.

#### Scenario: List projects with metadata

- **WHEN** client calls `projects.list` procedure
- **THEN** returns array of projects with session counts and last activity
- **AND** results are ordered by most recently updated

#### Scenario: Create new project

- **WHEN** client calls `projects.create` with name and path
- **THEN** validates input with Zod schema
- **AND** creates project record in database
- **AND** returns project with generated ID

#### Scenario: Duplicate project names

- **WHEN** creating a project with existing name
- **THEN** procedure throws typed error
- **AND** client receives error with proper type inference

#### Scenario: Delete project cascade

- **WHEN** deleting a project
- **THEN** all associated sessions are also deleted
- **AND** foreign key constraints enforce data integrity

### Requirement: Session Management API

The system SHALL provide tRPC procedures for managing Claude Code agent sessions.

#### Scenario: Create agent session

- **WHEN** client calls `sessions.create` with project ID
- **THEN** generates unique agent ID
- **AND** creates session record with 'running' status
- **AND** returns session details with type safety

#### Scenario: List sessions with filters

- **WHEN** client calls `sessions.list` with optional filters
- **THEN** returns filtered sessions joined with project details
- **AND** supports filtering by project_id and status

#### Scenario: Stop agent session

- **WHEN** client calls `sessions.stop` with session ID
- **THEN** updates session status to 'stopped'
- **AND** sets stopped_at timestamp
- **AND** triggers any cleanup procedures

### Requirement: Hook Events API

The system SHALL provide tRPC procedures for storing and querying hook events from Claude Code sessions.

#### Scenario: Ingest hook event

- **WHEN** a hook script POSTs event data
- **THEN** procedure validates event structure with Zod
- **AND** stores event in hooks table with session reference
- **AND** broadcasts event to subscribed WebSocket clients

#### Scenario: Query hooks with filters

- **WHEN** client calls `hooks.list` with filters
- **THEN** returns paginated hook events
- **AND** supports filtering by session, tool_name, hook_type, and date range

#### Scenario: Hook statistics aggregation

- **WHEN** client calls `hooks.stats` for a session
- **THEN** returns aggregated statistics by hook_type
- **AND** includes count, average duration, and success rate

### Requirement: Real-Time Event Streaming

The system SHALL support WebSocket subscriptions for real-time hook event streaming using tRPC subscriptions.

#### Scenario: Subscribe to session events

- **WHEN** client subscribes to `hooks.subscribe` with session ID
- **THEN** receives real-time events as they are ingested
- **AND** events are typed end-to-end

#### Scenario: Unsubscribe from events

- **WHEN** client disconnects or unsubscribes
- **THEN** subscription is cleaned up
- **AND** no further events are sent

### Requirement: Environment Configuration

The system SHALL support environment-specific configuration for monorepo workspaces.

#### Scenario: API environment variables

- **WHEN** API server starts
- **THEN** loads configuration from environment variables
- **AND** validates required variables are present
- **AND** provides typed configuration object

#### Scenario: Development vs production

- **WHEN** running in different environments
- **THEN** uses appropriate database paths and ports
- **AND** enables debug logging in development only

### Requirement: Docker Deployment Compatibility

The system SHALL maintain Docker deployment compatibility with modified build process.

#### Scenario: Monorepo Docker build

- **WHEN** building Docker image
- **THEN** Turborepo builds all dependencies
- **AND** outputs production-ready bundle
- **AND** preserves same port exposure (3001)

#### Scenario: Volume mounts preservation

- **WHEN** deploying in homelab
- **THEN** maintains access to `/projects` volume
- **AND** persists database to `/app/db` volume
- **AND** mounts `/reports` volume (read-only) for Playwright report access

## MODIFIED Requirements

### Requirement: Database Schema

The system SHALL define database schema using Drizzle ORM with type-safe migrations.

**Previous Implementation:** Raw SQLite3 CREATE TABLE statements in init-db.ts

**New Implementation:** Drizzle schema definitions with generated migrations

#### Scenario: Projects table schema

- **WHEN** defining projects table
- **THEN** uses Drizzle table definition with columns: id, name, path, description, created_at, updated_at
- **AND** defines unique constraint on name

#### Scenario: Sessions table schema

- **WHEN** defining sessions table
- **THEN** uses Drizzle table definition with foreign key to projects
- **AND** cascade deletes when project is removed

#### Scenario: Hooks table schema

- **WHEN** defining hooks table
- **THEN** uses Drizzle table definition with foreign key to sessions
- **AND** indexes on session_id, tool_name, hook_type, and timestamp

#### Scenario: Schema migration

- **WHEN** migrating existing SQLite database
- **THEN** Drizzle introspects current schema
- **AND** generates migration to align with new schema definitions
- **AND** preserves all existing data

## REMOVED Requirements

None. This change enhances architecture without removing existing capabilities.
