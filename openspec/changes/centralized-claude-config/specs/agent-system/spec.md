# Capability: Agent System

## Overview

Specialized Claude Code agents for T3 Stack development, each with focused expertise and proactive invocation patterns.

## ADDED Requirements

### Requirement: Multi-Platform Agent Collection

The system SHALL provide 10 specialized agents for T3 Stack, React Native, and .NET development.

#### Scenario: Full-stack feature development

**Given** a user needs to implement a complete feature with React UI, tRPC API, and database

**When** the user requests the feature

**Then** the t3-stack-developer agent SHALL be available for invocation

**And** the agent SHALL have expertise in React components, tRPC routers, Drizzle schemas, react-hook-form, and Zod validation

#### Scenario: Backend-only API development

**Given** a user needs to create tRPC endpoints without frontend changes

**When** the user requests API development

**Then** the trpc-backend-engineer agent SHALL be available for invocation

**And** the agent SHALL specialize in tRPC router design, middleware, type-safe server implementations

#### Scenario: Database optimization work

**Given** a user needs to optimize PostgreSQL queries or design database schemas

**When** the user requests database work

**Then** the database-architect agent SHALL be available for invocation

**And** the agent SHALL have expertise in PostgreSQL, Drizzle ORM, multi-tenant architectures, query optimization

#### Scenario: Frontend-only development

**Given** a user needs to build UI components without backend changes

**When** the user requests frontend work

**Then** the nextjs-frontend-specialist agent SHALL be available for invocation

**And** the agent SHALL specialize in Next.js App Router, ShadCN UI, react-hook-form integration

#### Scenario: End-to-end test creation

**Given** a user needs to write Playwright tests for new features

**When** the user requests testing work

**Then** the e2e-test-engineer agent SHALL be available for invocation

**And** the agent SHALL have expertise in Playwright, page object models, CI/CD integration, test data management

#### Scenario: Design system implementation

**Given** a user needs to implement Figma designs or create component libraries

**When** the user requests design work

**Then** the ux-design-specialist agent SHALL be available for invocation

**And** the agent SHALL specialize in Figma-to-code translation, responsive design, accessibility, ShadCN UI customization

#### Scenario: UI animation and polish

**Given** a user needs to add animations or micro-interactions

**When** the user requests animation work

**Then** the ui-animation-specialist agent SHALL be available for invocation

**And** the agent SHALL have expertise in Framer Motion, shadcn component customization, transition animations

#### Scenario: Caching strategy implementation

**Given** a user needs to implement Redis caching for performance

**When** the user requests caching work

**Then** the redis-cache-architect agent SHALL be available for invocation

**And** the agent SHALL specialize in Upstash Redis, tRPC result caching, cache invalidation, rate limiting

#### Scenario: React Native mobile development

**Given** a user needs to build a React Native mobile application

**When** the user requests mobile development work

**Then** the expo-mobile-specialist agent SHALL be available for invocation

**And** the agent SHALL have expertise in React Native, Expo Router, native modules, mobile-specific patterns, app store deployment

#### Scenario: .NET Azure enterprise development

**Given** a user needs to build .NET Azure services or APIs

**When** the user requests .NET development work

**Then** the dotnet-azure-specialist agent SHALL be available for invocation

**And** the agent SHALL have expertise in .NET 8-10, Azure Functions, ASP.NET Core (API/MVC), Entity Framework, Dapper, Azure Key Vault, Service Bus, Application Insights, Oracle/SQL Server

### Requirement: Agent Definition Format

Each agent SHALL be defined in a markdown file with frontmatter metadata.

#### Scenario: Agent file structure

**Given** an agent definition file

**When** the file is parsed by Claude Code

**Then** the file SHALL contain frontmatter with name, description, and model fields

**And** the file SHALL contain a detailed prompt defining agent expertise and behavior

**Example:**
```markdown
---
name: t3-stack-developer
description: Use this agent when you need to develop, refactor, or enhance applications using the T3 Stack and related modern web technologies.
model: inherit
---

You are an expert T3 Stack developer...
```

### Requirement: Proactive Agent Usage

Agents SHALL be invocable by Claude Code when task characteristics match agent expertise.

#### Scenario: Automatic agent selection

**Given** a user requests "implement a user profile page with edit form"

**When** Claude Code analyzes the request

**Then** Claude Code SHALL suggest or invoke the t3-stack-developer agent

**And** the agent SHALL be provided context about the request

## Cross-References

- **Related to**: Skill Library (agents reference skills for patterns)
- **Related to**: Template System (templates include agent configurations)
- **Related to**: Sync Tool (agents distributed to satellite projects)
