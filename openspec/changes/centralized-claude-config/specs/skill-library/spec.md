# Capability: Skill Library

## Overview

Token-efficient code pattern libraries that load on-demand for T3 Stack development.

## ADDED Requirements

### Requirement: T3 Pattern Skills

The system SHALL provide skills for common T3 Stack patterns.

#### Scenario: tRPC router creation

**Given** a developer needs to create a new tRPC router

**When** the skill `t3-patterns/trpc-router` is invoked

**Then** the skill SHALL provide router creation template with protectedProcedure and publicProcedure examples

**And** the skill SHALL show input validation with Zod

**And** the skill SHALL demonstrate query and mutation patterns

**And** the skill SHALL include database access via ctx.db

**And** the skill SHALL show error handling patterns

#### Scenario: Drizzle schema definition

**Given** a developer needs to create database tables

**When** the skill `t3-patterns/drizzle-schema` is invoked

**Then** the skill SHALL provide table definition template with pgTable

**And** the skill SHALL show common column types (text, timestamp, uuid)

**And** the skill SHALL demonstrate relations and foreign keys

**And** the skill SHALL include audit field patterns (createdAt, updatedAt)

**And** the skill SHALL show index definitions

#### Scenario: Zod validation schemas

**Given** a developer needs to create input validation

**When** the skill `t3-patterns/zod-validation` is invoked

**Then** the skill SHALL provide schema creation patterns

**And** the skill SHALL show create vs update schema patterns (.partial())

**And** the skill SHALL demonstrate type inference with z.infer

**And** the skill SHALL include common validation rules (min, max, email, url)

#### Scenario: React hook form integration

**Given** a developer needs to build a form

**When** the skill `t3-patterns/react-hook-form` is invoked

**Then** the skill SHALL provide useForm setup with zodResolver

**And** the skill SHALL show form field registration patterns

**And** the skill SHALL demonstrate error handling and display

**And** the skill SHALL include submission with tRPC mutation

**And** the skill SHALL show loading states and optimistic updates

### Requirement: Testing Pattern Skills

The system SHALL provide skills for testing strategies.

#### Scenario: Playwright E2E test creation

**Given** a developer needs to write end-to-end tests

**When** the skill `testing/playwright-e2e` is invoked

**Then** the skill SHALL provide test file structure with describe/test blocks

**And** the skill SHALL show page object model patterns

**And** the skill SHALL demonstrate navigation and interaction patterns

**And** the skill SHALL include assertions for visibility, text content, and state

**And** the skill SHALL show fixture usage for authentication

#### Scenario: Vitest unit test patterns

**Given** a developer needs to write unit tests

**When** the skill `testing/vitest-unit` is invoked

**Then** the skill SHALL provide test file structure matching source file

**And** the skill SHALL show mocking patterns for dependencies

**And** the skill SHALL demonstrate testing utilities and services

**And** the skill SHALL include snapshot testing examples

#### Scenario: Integration test setup

**Given** a developer needs to write integration tests

**When** the skill `testing/integration-tests` is invoked

**Then** the skill SHALL provide database test setup with migrations

**And** the skill SHALL show tRPC caller pattern for API testing

**And** the skill SHALL demonstrate test data factories

**And** the skill SHALL include cleanup strategies

### Requirement: Monorepo Pattern Skills

The system SHALL provide skills for monorepo management.

#### Scenario: Turborepo configuration

**Given** a developer needs to configure Turborepo pipelines

**When** the skill `monorepo/turborepo-setup` is invoked

**Then** the skill SHALL provide turbo.json structure

**And** the skill SHALL show pipeline definitions for build, test, lint

**And** the skill SHALL demonstrate task dependencies and caching

**And** the skill SHALL include workspace configuration patterns

#### Scenario: Package structure conventions

**Given** a developer needs to create workspace packages

**When** the skill `monorepo/package-structure` is invoked

**Then** the skill SHALL provide directory structure for apps vs packages

**And** the skill SHALL show package.json naming and workspace references

**And** the skill SHALL demonstrate shared configuration patterns (eslint, typescript, tailwind)

**And** the skill SHALL include export patterns for libraries

### Requirement: On-Demand Loading

Skills SHALL be loaded only when explicitly invoked to conserve tokens.

#### Scenario: Skill invocation syntax

**Given** a user needs a code pattern

**When** the user types `@skill t3-patterns/trpc-router` in a message

**Then** Claude Code SHALL load the skill content

**And** Claude Code SHALL apply the pattern to the current context

**And** the skill SHALL not be loaded in subsequent messages unless re-invoked

#### Scenario: Skill file size limit

**Given** a skill markdown file

**When** the file is created

**Then** the file SHALL be between 200-500 tokens

**And** the file SHALL contain only essential patterns without explanatory prose

**And** the file SHALL use code blocks with inline comments for clarity

### Requirement: Skill Organization

Skills SHALL be organized in topic-based directories.

#### Scenario: Skill directory structure

**Given** the skill library exists

**When** skills are listed

**Then** skills SHALL be grouped in directories:
- `t3-patterns/` for T3 Stack code patterns
- `testing/` for test patterns
- `monorepo/` for workspace management

**And** each directory SHALL contain related skills only

**And** skill file names SHALL be descriptive kebab-case (e.g., `trpc-router.md`)

## Cross-References

- **Related to**: Agent System (agents invoke skills for patterns)
- **Related to**: Template System (templates include skill directories)
- **Related to**: Sync Tool (sync tool copies skills to projects)
